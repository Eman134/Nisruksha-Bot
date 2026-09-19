const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Discord = require('../../_classes/discordCompat');
const clientService = require('../../_classes/services/clientService');
const playersService = require('../../_classes/services/players');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Selecione um membro para realizar a transferência').setRequired(true))
.addIntegerOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para transferência').setRequired(true))

module.exports = {
    name: 'transferir',
    aliases: ['tn', 'pay'],
    category: 'Economia',
    description: 'Transfere uma quantia de dinheiro para outro jogador',
    data,
    mastery: 50,
	async execute(interaction) {

        const quantia = interaction.options.getInteger('quantia');
        const member = interaction.options.getUser('membro')

        const money = await economyService.bank.get(interaction.user.id)

        let total = 0;
        if (quantia != 'tudo') {

            if (!utility.isInt(utility.toNumber(quantia))) {
                const embedtemp = await utility.sendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para transferir!`, `transferir @membro <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (money < utility.toNumber(quantia)) {
                const embedtemp = await utility.sendError(interaction, `Você não possui essa quantia de dinheiro __no banco__ para transferir!\nUtilize \`/depositar\` para depositar dinheiro no banco`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (utility.toNumber(quantia) < 1) {
                const embedtemp = await utility.sendError(interaction, `Você não pode transferir essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = utility.toNumber(quantia)
        } else {
            if (money < 1) {
                const embedtemp = await utility.sendError(interaction, `Você não possui dinheiro __no banco__ para transferir!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = money;
        }

                
        const check = await playersService.cooldown.check(interaction.user.id, "transferir");
        if (check) {

            playersService.cooldown.message(interaction, 'transferir', 'usar outro comando de transferir')

            return;
        }
        
        let memberobj = await DatabaseManager.get(member.id, "machines")
        let nivel = memberobj.level

        if (nivel < 50) {

            const check2 = await playersService.cooldown.check(member.id, "receivetr");
            if (check2) {

                let cooldown = await playersService.cooldown.get(member.id, "receivetr");
                const embed = new Discord.MessageEmbed()
                .setColor('#b8312c')
                .setDescription('❌ Este membro já recebeu uma transferência nas últimas 12 horas!\nAguarde mais `' + utility.ms(cooldown) + '` para fazer uma transferência para ele!')
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                await interaction.reply({ embeds: [embed] });
                return;
            }

            var mat = Math.round(Math.pow(nivel, 2) * 500);
            
            if (total > mat) {
                const embedtemp = await utility.sendError(interaction, `O limite de transferência recebido por ${member} é de ${utility.format(mat)} ${utility.money} ${utility.moneyemoji}!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

        }

        playersService.cooldown.set(interaction.user.id, "transferir", 20);
        
		const embed = new Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja transferir o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** para ${member}?`)

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            try {
                if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.transferir.defer_update'));
                reacted = true;
                collector.stop();
                if (b.customId == 'cancel'){
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addField('❌ Transferência cancelado', `
                    Você cancelou a transferência de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** para ${member}.`)
                } else {
                    const money2 = await economyService.bank.get(interaction.user.id);
                    if (money2 < total) {
                        embed.fields = [];
                        embed.setColor('#a60000');
                        embed.addField('❌ Falha na transferência', `Você não possui **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** __no banco__ para transferir!`)
                    } else {
                        embed.fields = [];
                        embed.setColor('#5bff45');
                        embed.addField('✅ Sucesso na transferência', `
                        Você transferiu o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** para ${member} com sucesso!`)
                        economyService.bank.remove(interaction.user.id, total);
                        economyService.bank.add(member.id, total);
                        economyService.addToHistory(interaction.user.id, `📤 Transferência para ${member} | - ${utility.format(total)} ${utility.moneyemoji}`)
                        economyService.addToHistory(member.id, `📥 Transferência de ${interaction.user} | + ${utility.format(total)} ${utility.moneyemoji}`)
                        let obj = await DatabaseManager.get(interaction.user.id, "players");
                        DatabaseManager.set(interaction.user.id, "players", "tran", obj.tran + 1);
                        if (nivel < 50) {
                            if (total > mat/2.5) {
                                playersService.cooldown.set(member.id, "receivetr", 43200);
                            }
                        }
                    }
                }
                playersService.cooldown.set(interaction.user.id, "transferir", 0);
                interaction.editReply({ embeds: [embed], components: [] });
            } catch (error) {
                reportError(error, 'command.transfer.execute', { userId: interaction.user?.id });
            }

        });
        
        collector.on('end', collected => {
            if (reacted) return
            playersService.cooldown.set(interaction.user.id, "transferir", 0);
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria transferir o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** para ${member}, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
