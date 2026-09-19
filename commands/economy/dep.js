const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para depósito').setRequired(true))

const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","createButton","eco","format","isInt","money","moneyemoji","rowComponents","sendError","toNumber","townExtension"],
    name: 'depositar',
    aliases: ['dep'],
    category: 'Economia',
    description: 'Deposita uma quantia de dinheiro no banco central',
    data,
    mastery: 20,
	async execute(interaction, svcDiscord, svcCreateButton, svcEco, svcFormat, svcIsInt, svcMoney, svcMoneyemoji, svcRowComponents, svcSendError, svcToNumber, svcTownExtension) {

        const quantia = interaction.options.getString('quantia');
        const svcMoney = await svcEco.svcMoney.get(interaction.user.id)
        let total = 0;
        if (quantia != 'tudo') {

            if (!svcIsInt(svcToNumber(quantia))) {
                const embedtemp = await svcSendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para depósito!`, `depositar <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (svcMoney < svcToNumber(quantia)) {
                const embedtemp = await svcSendError(interaction, `Você não possui essa quantia de dinheiro para depositar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (svcToNumber(quantia) < 1) {
                const embedtemp = await svcSendError(interaction, `Você não pode depositar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = svcToNumber(quantia);
        } else {
            if (svcMoney < 1) {
                const embedtemp = await svcSendError(interaction, `Você não possui dinheiro para depositar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = svcMoney;
        }
        let total2 = total;
        let taxa = await svcTownExtension.getTownTax(interaction.user.id);
        total = total2 - (Math.round(taxa*total2/100));
        
		const embed = new svcDiscord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja depositar o valor de ${svcFormat(total2)} ${svcMoney} ${svcMoneyemoji} na sua conta bancária?\nTaxa de depósito da vila atual (**${await svcTownExtension.getTownName(interaction.user.id)}**): ${taxa}% (${Math.round(taxa*total2/100)} ${svcMoney} ${svcMoneyemoji})\nTotal a ser depositado: **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}**`)
        
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
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.depositar.defer_update'); });
            if (b.customId == 'cancel'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Depósito cancelado', `
                Você cancelou o depósito de **${svcFormat(total2)} ${svcMoney} ${svcMoneyemoji}** na sua conta bancária.`)
            } else {
                const money2 = await svcEco.svcMoney.get(interaction.user.id);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no depósito', `Você não possui **${svcFormat(total2)} ${svcMoney} ${svcMoneyemoji}** em mãos para depositar!`)
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso no depósito', `
                    Você depositou o valor de **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** na sua conta bancária!`)
                    svcEco.bank.add(interaction.user.id, total);
                    svcEco.svcMoney.remove(interaction.user.id, total2);
                    svcEco.addToHistory(interaction.user.id, `📥 Depósito | + ${svcFormat(total)} ${svcMoneyemoji}`)
                    let obj = await DatabaseManager.get(interaction.user.id, "players");
                    DatabaseManager.set(interaction.user.id, "players", "dep", obj.dep + 1);
                    svcEco.svcMoney.globaladd(taxa)
                }
            }
            interaction.editReply({ embeds: [embed], components: [] });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria depositar o valor de **${svcFormat(total2)} ${svcMoney} ${svcMoneyemoji}** na sua conta bancária, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
