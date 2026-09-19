const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const eventsService = require('../../_classes/services/events');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const config = require('../../_classes/config');
const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('aposta').setDescription('Selecione uma quantia de dinheiro para aposta').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'apostarcavalo',
    aliases: [],
    category: 'none',
    description: 'none',
    data,
    mastery: 30,
    companytype: -1,
	async execute(interaction) {

                
        const total = interaction.options.getInteger('aposta');

        async function checkAll() {

            if(!eventsService.race.rodando) {
                const embedtemp = await utility.sendError(interaction, 'Não possui nenhuma **Corrida de Cavalos** ativa no momento!\nEm nosso servidor oficial você pode ser notificado quando há eventos! (`/convite`)')
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            const money = await economyService.money.get(interaction.user.id)
            
            if (money < total) {
                const embedtemp = await utility.sendError(interaction, `Você não possui essa quantia de dinheiro para apostar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            if (total < 1) {
                const embedtemp = await utility.sendError(interaction, `Você não pode apostar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }
            if (total < 1000) {
                const embedtemp = await utility.sendError(interaction, `O mínimo para apostar em cavalos é de \`1000 ${utility.money}\` ${utility.moneyemoji}`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }
            if (total > 2000000) {
                const embedtemp = await utility.sendError(interaction, `O máximo para apostar em cavalos é de \`${utility.format(2000000)} ${utility.money}\` ${utility.moneyemoji}`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            return false
        }

        const checkin = await checkAll()

        if (checkin) return
        
		const embed = eventsService.getRaceEmbed(total)
        const embedinteraction = (await interaction.reply({ embeds: [embed], withResponse: true })).resource.message;
        
        await embedinteraction.react('🟧')
        await embedinteraction.react('🟥')
        await embedinteraction.react('🟪')

        const filter = (reaction, user) => {
            return user.id === interaction.user.id;
        };
        
        const collector = embedinteraction.createReactionCollector({ filter, time: 20000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            if (!(['🟧', '🟥', '🟪'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();

            const checkin = await checkAll()

            if (checkin) return

            let apostastring = ""
            
            switch (reaction.emoji.name){
                case '🟧':
                    apostastring = "laranja"
                    break;
                case '🟥':
                    apostastring = "vermelho"
                    break;
                case '🟪':
                    apostastring = "roxo"
                    break;
                default:
                    break;
            }

            const globalobj = await DatabaseManager.get(config.app.id, 'globals');

            const globalevents = globalobj.events;

            economyService.money.remove(interaction.user.id, total)
            economyService.money.globaladd(total)
            economyService.addToHistory(user, `Aposta 🏇${reaction.emoji.name} | - ${utility.format(total)} ${utility.moneyemoji}`)

            eventsService.race.apostas[apostastring].push({ id: interaction.user.id, aposta: total })

            if (globalevents == null) {
                DatabaseManager.set(config.app.id, 'globals', "events", {
                    "race": eventsService.race
                })
            } else {
                DatabaseManager.set(config.app.id, 'globals', "events", {
                    ...globalevents,
                    "race": eventsService.race
                })
            }

            const embed = eventsService.getRaceEmbed(total)

            embed.setColor('#5bff45');
            embed.addFields({ name: '✅ Aposta realizada', value: `
            Você fez uma aposta de \`${utility.format(total)} ${utility.money}\` ${utility.moneyemoji} no cavalo **🏇${reaction.emoji.name}**!\nO resultado final da corrida sairá em **${compactTime(eventsService.race.time-(Date.now()-eventsService.race.started))}** e se ganhar o valor será creditado automaticamente em seu banco!` })
            await interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = eventsService.getRaceEmbed(total)
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `Você iria realizar uma aposta na corrida de cavalos, porém o tempo expirou.` })
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
