const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para saque').setRequired(true))

const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","createButton","eco","format","isInt","money","moneyemoji","rowComponents","sendError","toNumber"],
    name: 'sacar',
    aliases: ['sac'],
    category: 'Economia',
    description: 'Saca uma quantia de dinheiro do banco central',
    data,
    mastery: 20,
	async execute(interaction, svcDiscord, svcCreateButton, svcEco, svcFormat, svcIsInt, svcMoney, svcMoneyemoji, svcRowComponents, svcSendError, svcToNumber) {

        const quantia = interaction.options.getString('quantia');
        const svcMoney = await svcEco.bank.get(interaction.user.id)
        let total = 0;
        if (quantia != 'tudo') {

            if (!svcIsInt(svcToNumber(quantia))) {
                const embedtemp = await svcSendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para saque!`, `sacar <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (svcMoney < svcToNumber(quantia)) {
                const embedtemp = await svcSendError(interaction, `Você não possui essa quantia __no banco__ de dinheiro para sacar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (svcToNumber(quantia) < 1) {
                const embedtemp = await svcSendError(interaction, `Você não pode sacar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = svcToNumber(quantia);
        } else {
            if (svcMoney < 1) {
                const embedtemp = await svcSendError(interaction, `Você não possui dinheiro __no banco__ para sacar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = svcMoney;
        }
        
		const embed = new svcDiscord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja sacar o valor de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** da sua conta bancária?`)

        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.sacar.defer_update'); });
            if (b.customId == 'cancel'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Saque cancelado', `
                Você cancelou o saque de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** da sua conta bancária.`)
            } else {
                const money2 = await svcEco.bank.get(interaction.user.id);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no saque', `Você não possui **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** __no banco__ para sacar!`)
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso no saque', `
                    Você sacou o valor de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** da sua conta bancária!`)
                    svcEco.svcMoney.add(interaction.user.id, total);
                    svcEco.bank.remove(interaction.user.id, total);
                    svcEco.addToHistory(interaction.user.id, `📤 Saque | - ${svcFormat(total)} ${svcMoneyemoji}`)
                    let obj = await DatabaseManager.get(interaction.user.id, "players");
                    DatabaseManager.set(interaction.user.id, "players", "saq", obj.saq + 1);
                }
            }
            interaction.editReply({ embeds: [embed], components: [] });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria sacar o valor de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** da sua conta bancária, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
