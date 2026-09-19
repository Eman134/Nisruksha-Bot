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
	async execute(API, interaction) {

        const quantia = interaction.options.getInteger('quantia');
        const member = interaction.options.getUser('membro')

        const money = await API.eco.bank.get(interaction.user.id)

        let total = 0;
        if (quantia != 'tudo') {

            if (!API.isInt(API.toNumber(quantia))) {
                const embedtemp = await API.sendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para transferir!`, `transferir @membro <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (money < API.toNumber(quantia)) {
                const embedtemp = await API.sendError(interaction, `Você não possui essa quantia de dinheiro __no banco__ para transferir!\nUtilize \`/depositar\` para depositar dinheiro no banco`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (API.toNumber(quantia) < 1) {
                const embedtemp = await API.sendError(interaction, `Você não pode transferir essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = API.toNumber(quantia)
        } else {
            if (money < 1) {
                const embedtemp = await API.sendError(interaction, `Você não possui dinheiro __no banco__ para transferir!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = money;
        }

        const Discord = API.Discord;
        const client = API.client;

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "transferir");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'transferir', 'usar outro comando de transferir')

            return;
        }
        
        let memberobj = await DatabaseManager.get(member.id, "machines")
        let nivel = memberobj.level

        if (nivel < 50) {

            const check2 = await API.playerUtils.cooldown.check(member.id, "receivetr");
            if (check2) {

                let cooldown = await API.playerUtils.cooldown.get(member.id, "receivetr");
                const embed = new Discord.MessageEmbed()
                .setColor('#b8312c')
                .setDescription('❌ Este membro já recebeu uma transferência nas últimas 12 horas!\nAguarde mais `' + API.ms(cooldown) + '` para fazer uma transferência para ele!')
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                await interaction.reply({ embeds: [embed] });
                return;
            }

            var mat = Math.round(Math.pow(nivel, 2) * 500);
            
            if (total > mat) {
                const embedtemp = await API.sendError(interaction, `O limite de transferência recebido por ${member} é de ${API.format(mat)} ${API.money} ${API.moneyemoji}!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

        }

        API.playerUtils.cooldown.set(interaction.user.id, "transferir", 20);
        
		const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja transferir o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** para ${member}?`)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], withResponse: true });

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
                    Você cancelou a transferência de **${API.format(total)} ${API.money} ${API.moneyemoji}** para ${member}.`)
                } else {
                    const money2 = await API.eco.bank.get(interaction.user.id);
                    if (money2 < total) {
                        embed.fields = [];
                        embed.setColor('#a60000');
                        embed.addField('❌ Falha na transferência', `Você não possui **${API.format(total)} ${API.money} ${API.moneyemoji}** __no banco__ para transferir!`)
                    } else {
                        embed.fields = [];
                        embed.setColor('#5bff45');
                        embed.addField('✅ Sucesso na transferência', `
                        Você transferiu o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** para ${member} com sucesso!`)
                        API.eco.bank.remove(interaction.user.id, total);
                        API.eco.bank.add(member.id, total);
                        API.eco.addToHistory(interaction.user.id, `📤 Transferência para ${member} | - ${API.format(total)} ${API.moneyemoji}`)
                        API.eco.addToHistory(member.id, `📥 Transferência de ${interaction.user} | + ${API.format(total)} ${API.moneyemoji}`)
                        let obj = await DatabaseManager.get(interaction.user.id, "players");
                        DatabaseManager.set(interaction.user.id, "players", "tran", obj.tran + 1);
                        if (nivel < 50) {
                            if (total > mat/2.5) {
                                API.playerUtils.cooldown.set(member.id, "receivetr", 43200);
                            }
                        }
                    }
                }
                API.playerUtils.cooldown.set(interaction.user.id, "transferir", 0);
                interaction.editReply({ embeds: [embed], components: [] });
            } catch (error) {
                console.log(error)
            }

        });
        
        collector.on('end', collected => {
            if (reacted) return
            API.playerUtils.cooldown.set(interaction.user.id, "transferir", 0);
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria transferir o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** para ${member}, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
