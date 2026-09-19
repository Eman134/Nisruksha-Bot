const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('aposta').setDescription('Selecione uma quantia de dinheiro para aposta').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","client","eco","events","format","id","money","moneyemoji","ms","sendError"],
    name: 'apostarcavalo',
    aliases: [],
    category: 'none',
    description: 'none',
    data,
    mastery: 30,
    companytype: -1,
	async execute(interaction, svcDiscord, svcClient, svcEco, svcEvents, svcFormat, svcId, svcMoney, svcMoneyemoji, svcMs, svcSendError) {
        const total = interaction.options.getInteger('aposta');

        async function checkAll() {

            if(!svcEvents.race.rodando) {
                const embedtemp = await svcSendError(interaction, 'Não possui nenhuma **Corrida de Cavalos** ativa no momento!\nEm nosso servidor oficial você pode ser notificado quando há eventos! (`/convite`)')
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            const svcMoney = await svcEco.svcMoney.get(interaction.user.svcId)
            
            if (svcMoney < total) {
                const embedtemp = await svcSendError(interaction, `Você não possui essa quantia de dinheiro para apostar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            if (total < 1) {
                const embedtemp = await svcSendError(interaction, `Você não pode apostar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }
            if (total < 1000) {
                const embedtemp = await svcSendError(interaction, `O mínimo para apostar em cavalos é de \`1000 ${svcMoney}\` ${svcMoneyemoji}`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }
            if (total > 2000000) {
                const embedtemp = await svcSendError(interaction, `O máximo para apostar em cavalos é de \`${svcFormat(2000000)} ${svcMoney}\` ${svcMoneyemoji}`)
                await interaction.reply({ embeds: [embedtemp]})
                return true
            }

            return false
        }

        const checkin = await checkAll()

        if (checkin) return
        
		const embed = svcEvents.getRaceEmbed(total)
        const embedinteraction = await interaction.reply({ embeds: [embed], withResponse: true });
        
        await embedinteraction.react('🟧')
        await embedinteraction.react('🟥')
        await embedinteraction.react('🟪')

        const filter = (reaction, user) => {
            return user.svcId === interaction.user.svcId;
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

            const globalobj = await DatabaseManager.get(svcId, 'globals');

            const globalevents = globalobj.events;

            svcEco.svcMoney.remove(interaction.user.svcId, total)
            svcEco.svcMoney.globaladd(total)
            svcEco.addToHistory(user, `Aposta 🏇${reaction.emoji.name} | - ${svcFormat(total)} ${svcMoneyemoji}`)

            svcEvents.race.apostas[apostastring].push({ svcId: interaction.user.svcId, aposta: total })

            if (globalevents == null) {
                DatabaseManager.set(svcId, 'globals', "events", {
                    "race": svcEvents.race
                })
            } else {
                DatabaseManager.set(svcId, 'globals', "events", {
                    ...globalevents,
                    "race": svcEvents.race
                })
            }

            const embed = svcEvents.getRaceEmbed(total)

            embed.setColor('#5bff45');
            embed.addField('✅ Aposta realizada', `
            Você fez uma aposta de \`${svcFormat(total)} ${svcMoney}\` ${svcMoneyemoji} no cavalo **🏇${reaction.emoji.name}**!\nO resultado final da corrida sairá em **${svcMs(svcEvents.race.time-(Date.now()-svcEvents.race.started), true)}** e se ganhar o valor será creditado automaticamente em seu banco!`)
            await interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = svcEvents.getRaceEmbed(total)
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria realizar uma aposta na corrida de cavalos, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
