const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Digite a quantia de fichas que deseja trocar').setRequired(true))

module.exports = {
    name: 'trocarfichas',
    aliases: ['tfichas', 'tf'],
    category: 'Jogos',
    description: 'Troca as suas fichas por uma quantia de dinheiro',
    data,
    mastery: 10,
	async execute(API, interaction) {

        const Discord = API.Discord;
        
        const fichas = interaction.options.getInteger('fichas');

        if (fichas < 20) {
            const embedtemp = await API.sendError(interaction, `A quantia mínima de fichas para troca é 20 fichas!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
		
	const token = await API.eco.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await API.sendError(interaction, `Você não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para trocar `)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let total = fichas*810;
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja trocar ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}?`)
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        let reacted = false;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            reacted = true;
            collector.stop();
		
	const token = await API.eco.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await API.sendError(interaction, `Você não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para trocar `)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
		
            if (b.customId == 'cancel'){
                collector.stop();
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Troca cancelada', `
                Você cancelou a troca de ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            } else {
                embed.fields = [];
                embed.setColor('#5bff45');
                embed.addField('✅ Sucesso na troca', `
                Você trocou ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}`)
                interaction.editReply({ embeds: [embed], components: [] });
                API.eco.token.remove(interaction.user.id, fichas)
                API.eco.money.add(interaction.user.id, total)
                API.eco.addToHistory(interaction.user.id, `Troca | - ${API.format(fichas)} ${API.money3emoji} : + ${API.format(total)} ${API.moneyemoji}`)
            }
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria trocar ${fichas} ${API.money3} ${API.money3emoji} pelo valor de ${total} ${API.money} ${API.moneyemoji}, porém o tempo expirou!`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
