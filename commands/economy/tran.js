const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Selecione um membro para realizar a transferência').setRequired(true))
.addIntegerOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para transferência').setRequired(true))

module.exports = {
    requiredServices: ["Discord","client","createButton","eco","format","isInt","money","moneyemoji","ms","playerUtils","rowComponents","sendError","toNumber"],
    name: 'transferir',
    aliases: ['tn', 'pay'],
    category: 'Economia',
    description: 'Transfere uma quantia de dinheiro para outro jogador',
    data,
    mastery: 50,
	async execute(interaction, svcDiscord, svcClient, svcCreateButton, svcEco, svcFormat, svcIsInt, svcMoney, svcMoneyemoji, svcMs, svcPlayerUtils, svcRowComponents, svcSendError, svcToNumber) {

        const quantia = interaction.options.getInteger('quantia');
        const member = interaction.options.getUser('membro')

        const svcMoney = await svcEco.bank.get(interaction.user.id)

        let total = 0;
        if (quantia != 'tudo') {

            if (!svcIsInt(svcToNumber(quantia))) {
                const embedtemp = await svcSendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para transferir!`, `transferir @membro <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (svcMoney < svcToNumber(quantia)) {
                const embedtemp = await svcSendError(interaction, `Você não possui essa quantia de dinheiro __no banco__ para transferir!\nUtilize \`/depositar\` para depositar dinheiro no banco`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (svcToNumber(quantia) < 1) {
                const embedtemp = await svcSendError(interaction, `Você não pode transferir essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = svcToNumber(quantia)
        } else {
            if (svcMoney < 1) {
                const embedtemp = await svcSendError(interaction, `Você não possui dinheiro __no banco__ para transferir!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = svcMoney;
        }
        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "transferir");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'transferir', 'usar outro comando de transferir')

            return;
        }
        
        let memberobj = await DatabaseManager.get(member.id, "machines")
        let nivel = memberobj.level

        if (nivel < 50) {

            const check2 = await svcPlayerUtils.cooldown.check(member.id, "receivetr");
            if (check2) {

                let cooldown = await svcPlayerUtils.cooldown.get(member.id, "receivetr");
                const embed = new svcDiscord.MessageEmbed()
                .setColor('#b8312c')
                .setDescription('❌ Este membro já recebeu uma transferência nas últimas 12 horas!\nAguarde mais `' + svcMs(cooldown) + '` para fazer uma transferência para ele!')
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))
                await interaction.reply({ embeds: [embed] });
                return;
            }

            var mat = Math.round(Math.pow(nivel, 2) * 500);
            
            if (total > mat) {
                const embedtemp = await svcSendError(interaction, `O limite de transferência recebido por ${member} é de ${svcFormat(mat)} ${svcMoney} ${svcMoneyemoji}!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

        }

        svcPlayerUtils.cooldown.set(interaction.user.id, "transferir", 20);
        
		const embed = new svcDiscord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja transferir o valor de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** para ${member}?`)

        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

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
                    Você cancelou a transferência de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** para ${member}.`)
                } else {
                    const money2 = await svcEco.bank.get(interaction.user.id);
                    if (money2 < total) {
                        embed.fields = [];
                        embed.setColor('#a60000');
                        embed.addField('❌ Falha na transferência', `Você não possui **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** __no banco__ para transferir!`)
                    } else {
                        embed.fields = [];
                        embed.setColor('#5bff45');
                        embed.addField('✅ Sucesso na transferência', `
                        Você transferiu o valor de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** para ${member} com sucesso!`)
                        svcEco.bank.remove(interaction.user.id, total);
                        svcEco.bank.add(member.id, total);
                        svcEco.addToHistory(interaction.user.id, `📤 Transferência para ${member} | - ${svcFormat(total)} ${svcMoneyemoji}`)
                        svcEco.addToHistory(member.id, `📥 Transferência de ${interaction.user} | + ${svcFormat(total)} ${svcMoneyemoji}`)
                        let obj = await DatabaseManager.get(interaction.user.id, "players");
                        DatabaseManager.set(interaction.user.id, "players", "tran", obj.tran + 1);
                        if (nivel < 50) {
                            if (total > mat/2.5) {
                                svcPlayerUtils.cooldown.set(member.id, "receivetr", 43200);
                            }
                        }
                    }
                }
                svcPlayerUtils.cooldown.set(interaction.user.id, "transferir", 0);
                interaction.editReply({ embeds: [embed], components: [] });
            } catch (error) {
                reportError(error, 'command.transfer.execute', { userId: interaction.user?.id });
            }

        });
        
        collector.on('end', collected => {
            if (reacted) return
            svcPlayerUtils.cooldown.set(interaction.user.id, "transferir", 0);
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria transferir o valor de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** para ${member}, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
