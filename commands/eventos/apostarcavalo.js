const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const clientService = require('../../_classes/services/clientService');
const eventsService = require('../../_classes/services/events');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const config = require('../../_classes/config');
const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('aposta').setDescription('Selecione uma quantia de dinheiro para aposta').setRequired(true))

const prisma = require('../../_classes/prisma');

function buildError(interaction, message) {
    return new ContainerBuilder()
        .setAccentColor(0xb8312c)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${interaction.user.tag}**\n\n<:error:736274027756388353> ${message}`));
}

function buildRaceContainer(aposta, status) {
    const race = eventsService.race;
    const inv = '<:inv:781993473331036251>';
    const inv2 = '<:inv2:838584020547141643>';
    const inv3 = '<:inv3:838584020571783179>';
    const inv4 = '<:inv4:838584020257734667>';
    const totals = ['laranja', 'vermelho', 'roxo'].map((color) => race.apostas[color].reduce((sum, item) => sum + item.aposta, 0));
    const vencedor = race.vencedor;
    const horses = `${vencedor == 1 ? '🎉|🏇' : '🏁|' + inv2}${vencedor != 0 && vencedor != 1 ? '🏇' : inv2}${inv2}${inv2}${inv2}|${vencedor != 0 ? inv : '🏇'}🟧${inv}\`${utility.format(totals[0])} ${utility.money}\` ${utility.moneyemoji}
${vencedor == 2 ? '🎉|🏇' : '🏁|' + inv3}${vencedor != 0 && vencedor != 2 ? '🏇' : inv3}${inv3}${inv3}${inv3}|${vencedor != 0 ? inv : '🏇'}🟥${inv}\`${utility.format(totals[1])} ${utility.money}\` ${utility.moneyemoji}
${vencedor == 3 ? '🎉|🏇' : '🏁|' + inv4}${vencedor != 0 && vencedor != 3 ? '🏇' : inv4}${inv4}${inv4}${inv4}|${vencedor != 0 ? inv : '🏇'}🟪${inv}\`${utility.format(totals[2])} ${utility.money}\` ${utility.moneyemoji}`;
    const lines = [
        '## Evento | Corrida de Cavalos',
        '<:info:736274028515295262> **Informações**',
        `${aposta ? `Sua aposta: \`${utility.format(aposta)} ${utility.money}\` ${utility.moneyemoji}\n` : ''}Você receberá **1.5x**, ou seja, **50% de lucro da sua aposta** caso acerte o cavalo que ganhará a corrida.\nUtilize \`/apostarcavalo <valor>\` para fazer a sua aposta!`,
        `**${race.rodando ? '⏰ Tempo restante: ' + utility.ms(race.time - (Date.now() - race.started), true) : 'Corrida de cavalos finalizada'}**\n${horses}`
    ];
    if (vencedor !== 0) {
        const winner = ['laranja', 'vermelho', 'roxo'][vencedor - 1];
        const winnerEmoji = ['🟧', '🟥', '🟪'][vencedor - 1];
        const totalWinner = race.apostas[winner].reduce((sum, item) => sum + item.aposta, 0);
        lines.push(`**Vencedor: 🏇${winnerEmoji}**\n${race.apostas[winner].length === 0 ? '**Não houveram apostas no cavalo vencedor**' : `**Houveram no total ${race.apostas.laranja.length + race.apostas.vermelho.length + race.apostas.roxo.length} apostas e somente ${race.apostas[winner].length} ganharam**\nUm total de \`${utility.format(Math.round(totalWinner * 1.5))} ${utility.money}\` ${utility.moneyemoji} foi distribuído para os apostadores.`}`);
    }
    if (status) lines.push(`**${status.title}**\n${status.value}`);
    return new ContainerBuilder().setAccentColor(status?.color || 0x36393f).addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n\n')));
}

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
                await interaction.reply({ components: [buildError(interaction, 'Não possui nenhuma **Corrida de Cavalos** ativa no momento!\nEm nosso servidor oficial você pode ser notificado quando há eventos! (`/convite`)')], flags: Discord.MessageFlags.IsComponentsV2 })
                return true
            }

            const money = await economyService.money.get(interaction.user.id)
            
            if (money < total) {
                await interaction.reply({ components: [buildError(interaction, 'Você não possui essa quantia de dinheiro para apostar!')], flags: Discord.MessageFlags.IsComponentsV2 })
                return true
            }

            if (total < 1) {
                await interaction.reply({ components: [buildError(interaction, 'Você não pode apostar essa quantia de dinheiro!')], flags: Discord.MessageFlags.IsComponentsV2 })
                return true
            }
            if (total < 1000) {
                await interaction.reply({ components: [buildError(interaction, `O mínimo para apostar em cavalos é de \`1000 ${utility.money}\` ${utility.moneyemoji}`)], flags: Discord.MessageFlags.IsComponentsV2 })
                return true
            }
            if (total > 2000000) {
                await interaction.reply({ components: [buildError(interaction, `O máximo para apostar em cavalos é de \`${utility.format(2000000)} ${utility.money}\` ${utility.moneyemoji}`)], flags: Discord.MessageFlags.IsComponentsV2 })
                return true
            }

            return false
        }

        const checkin = await checkAll()

        if (checkin) return
        
        const embedinteraction = (await interaction.reply({ components: [buildRaceContainer(total)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        
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

            const user_id = BigInt(config.app.id)
            const globalobj = await prisma.globals.upsert({ where: { user_id }, update: { user_id }, create: { user_id, keys: [], remember: [], processing: [] } });

            const globalevents = globalobj.events;

            economyService.money.remove(interaction.user.id, total)
            economyService.money.globaladd(total)
            economyService.addToHistory(user, `Aposta 🏇${reaction.emoji.name} | - ${utility.format(total)} ${utility.moneyemoji}`)

            eventsService.race.apostas[apostastring].push({ id: interaction.user.id, aposta: total })

            if (globalevents == null) {
                await prisma.globals.update({ where: { user_id }, data: { events: {
                    "race": eventsService.race
                } } })
            } else {
                await prisma.globals.update({ where: { user_id }, data: { events: {
                    ...globalevents,
                    "race": eventsService.race
                } } })
            }

            const container = buildRaceContainer(total, { color: 0x5bff45, title: '✅ Aposta realizada', value: `Você fez uma aposta de \`${utility.format(total)} ${utility.money}\` ${utility.moneyemoji} no cavalo **🏇${reaction.emoji.name}**!\nO resultado final da corrida sairá em **${compactTime(eventsService.race.time-(Date.now()-eventsService.race.started))}** e se ganhar o valor será creditado automaticamente em seu banco!` });
            await interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const container = buildRaceContainer(total, { color: 0xa60000, title: '❌ Tempo expirado', value: 'Você iria realizar uma aposta na corrida de cavalos, porém o tempo expirou.' });
            interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
