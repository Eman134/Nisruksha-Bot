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
	async execute(API, interaction) {

        const Discord = API.Discord;
        const client = API.client;

        const total = interaction.options.getInteger('aposta');

        async function checkAll() {

            if(!API.events.race.rodando) {
                const embedtemp = await API.sendError(interaction, 'Não possui nenhuma **Corrida de Cavalos** ativa no momento!\nEm nosso servidor oficial você pode ser notificado quando há eventos! (`/convite`)')
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            const money = await API.eco.money.get(interaction.user.id)
            
            if (money < total) {
                const embedtemp = await API.sendError(interaction, `Você não possui essa quantia de dinheiro para apostar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            if (total < 1) {
                const embedtemp = await API.sendError(interaction, `Você não pode apostar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }
            if (total < 1000) {
                const embedtemp = await API.sendError(interaction, `O mínimo para apostar em cavalos é de \`1000 ${API.money}\` ${API.moneyemoji}`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }
            if (total > 2000000) {
                const embedtemp = await API.sendError(interaction, `O máximo para apostar em cavalos é de \`${API.format(2000000)} ${API.money}\` ${API.moneyemoji}`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            return false
        }

        const checkin = await checkAll()

        if (checkin) return
        
		const embed = API.events.getRaceEmbed(total)
        const embedinteraction = await interaction.reply({ embeds: [embed], fetchReply: true });
        
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

            const globalobj = await DatabaseManager.get(API.id, 'globals');

            const globalevents = globalobj.events;

            API.eco.money.remove(interaction.user.id, total)
            API.eco.money.globaladd(total)
            API.eco.addToHistory(user, `Aposta 🏇${reaction.emoji.name} | - ${API.format(total)} ${API.moneyemoji}`)

            API.events.race.apostas[apostastring].push({ id: interaction.user.id, aposta: total })

            if (globalevents == null) {
                DatabaseManager.set(API.id, 'globals', "events", {
                    "race": API.events.race
                })
            } else {
                DatabaseManager.set(API.id, 'globals', "events", {
                    ...globalevents,
                    "race": API.events.race
                })
            }

            const embed = API.events.getRaceEmbed(total)

            embed.setColor('#5bff45');
            embed.addField('✅ Aposta realizada', `
            Você fez uma aposta de \`${API.format(total)} ${API.money}\` ${API.moneyemoji} no cavalo **🏇${reaction.emoji.name}**!\nO resultado final da corrida sairá em **${API.ms2(API.events.race.time-(Date.now()-API.events.race.started))}** e se ganhar o valor será creditado automaticamente em seu banco!`)
            await interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = API.events.getRaceEmbed(total)
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria realizar uma aposta na corrida de cavalos, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};