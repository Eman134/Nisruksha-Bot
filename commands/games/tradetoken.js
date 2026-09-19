const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Digite a quantia de fichas que deseja trocar').setRequired(true))

module.exports = {
    requiredServices: ["Discord","createButton","eco","format","money","money3","money3emoji","moneyemoji","rowComponents","sendError"],
    name: 'trocarfichas',
    aliases: ['tfichas', 'tf'],
    category: 'Jogos',
    description: 'Troca as suas fichas por uma quantia de dinheiro',
    data,
    mastery: 10,
	async execute(interaction, svcDiscord, svcCreateButton, svcEco, svcFormat, svcMoney, svcMoney3, svcMoney3emoji, svcMoneyemoji, svcRowComponents, svcSendError) {        
        const fichas = interaction.options.getInteger('fichas');

        if (fichas < 20) {
            const embedtemp = await svcSendError(interaction, `A quantia mínima de fichas para troca é 20 fichas!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
		
	const token = await svcEco.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await svcSendError(interaction, `Você não possui \`${aposta} ${svcMoney3}\` ${svcMoney3emoji} para trocar `)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let total = fichas*810;
        
		const embed = new svcDiscord.MessageEmbed()
	    .setColor('#32a893')
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja trocar ${svcFormat(fichas)} ${svcMoney3} ${svcMoney3emoji} pelo valor de ${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}?`)
        
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        let reacted = false;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.trocartokens.defer_update'); });
            reacted = true;
            collector.stop();
		
	const token = await svcEco.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await svcSendError(interaction, `Você não possui \`${aposta} ${svcMoney3}\` ${svcMoney3emoji} para trocar `)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
		
            if (b.customId == 'cancel'){
                collector.stop();
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Troca cancelada', `
                Você cancelou a troca de ${svcFormat(fichas)} ${svcMoney3} ${svcMoney3emoji} pelo valor de ${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            } else {
                embed.fields = [];
                embed.setColor('#5bff45');
                embed.addField('✅ Sucesso na troca', `
                Você trocou ${svcFormat(fichas)} ${svcMoney3} ${svcMoney3emoji} pelo valor de ${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}`)
                interaction.editReply({ embeds: [embed], components: [] });
                svcEco.token.remove(interaction.user.id, fichas)
                svcEco.svcMoney.add(interaction.user.id, total)
                svcEco.addToHistory(interaction.user.id, `Troca | - ${svcFormat(fichas)} ${svcMoney3emoji} : + ${svcFormat(total)} ${svcMoneyemoji}`)
            }
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria trocar ${fichas} ${svcMoney3} ${svcMoney3emoji} pelo valor de ${total} ${svcMoney} ${svcMoneyemoji}, porém o tempo expirou!`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
