const Discord = require('../../_classes/discordCompat');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Digite a quantia de fichas que deseja trocar').setRequired(true))

module.exports = {
    name: 'trocarfichas',
    aliases: ['tfichas', 'tf'],
    category: 'Jogos',
    description: 'Troca as suas fichas por uma quantia de dinheiro',
    data,
    mastery: 10,
	async execute(interaction) {

                
        const fichas = interaction.options.getInteger('fichas');

        if (fichas < 20) {
            const embedtemp = await utility.sendError(interaction, `A quantia mínima de fichas para troca é 20 fichas!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
		
	const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await utility.sendError(interaction, `Você não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para trocar `)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let total = fichas*810;
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja trocar ${utility.format(fichas)} ${utility.money3} ${utility.money3emoji} pelo valor de ${utility.format(total)} ${utility.money} ${utility.moneyemoji}?`)
        
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        let reacted = false;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.trocartokens.defer_update'); });
            reacted = true;
            collector.stop();
		
	const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await utility.sendError(interaction, `Você não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para trocar `)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
		
            if (b.customId == 'cancel'){
                collector.stop();
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Troca cancelada', `
                Você cancelou a troca de ${utility.format(fichas)} ${utility.money3} ${utility.money3emoji} pelo valor de ${utility.format(total)} ${utility.money} ${utility.moneyemoji}.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            } else {
                embed.fields = [];
                embed.setColor('#5bff45');
                embed.addField('✅ Sucesso na troca', `
                Você trocou ${utility.format(fichas)} ${utility.money3} ${utility.money3emoji} pelo valor de ${utility.format(total)} ${utility.money} ${utility.moneyemoji}`)
                interaction.editReply({ embeds: [embed], components: [] });
                economyService.token.remove(interaction.user.id, fichas)
                economyService.money.add(interaction.user.id, total)
                economyService.addToHistory(interaction.user.id, `Troca | - ${utility.format(fichas)} ${utility.money3emoji} : + ${utility.format(total)} ${utility.moneyemoji}`)
            }
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria trocar ${fichas} ${utility.money3} ${utility.money3emoji} pelo valor de ${total} ${utility.money} ${utility.moneyemoji}, porém o tempo expirou!`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
