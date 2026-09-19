const Discord = require('discord.js');
const playersService = require('../../_classes/services/players');
const townsService = require('../../_classes/services/towns');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const config = require('../../_classes/config');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))

const v2Flags = Discord.MessageFlags.IsComponentsV2;

function textContainer(content, color) {
    return new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

function errorContainer(interaction, message, usage) {
    return textContainer(`${interaction.user.tag}\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`, 0xb8312c);
}

function rouletteContainer({ color, description, fields, footer }) {
    const content = [
        `${fields.author}\n**${fields.title}**`,
        description,
        ...fields.values.map(({ name, value }) => `**${name}**\n${value}`),
        footer
    ].filter(Boolean).join('\n\n');
    return textContainer(content, color);
}

module.exports = {
    name: 'roleta',
    aliases: ['roullete'],
    category: 'Jogos',
    description: 'Aposte em frutas e multiplique sua aposta',
    data,
    mastery: 3,
	async execute(interaction) {

        
        const aposta = interaction.options.getInteger('fichas');

        const check = await playersService.cooldown.check(interaction.user.id, "roullete");
        if (check) {

            playersService.cooldown.message(interaction, 'roullete', 'girar a roleta')

            return;
        }

        if (!(townsService.games[await townsService.getTownName(interaction.user.id)].includes('roleta'))) {
            await interaction.reply({ components: [errorContainer(interaction, `A casa de jogos da sua vila não possui o jogo **ROLETA**!\nJogos disponíveis na sua vila: **${townsService.games[await townsService.getTownName(interaction.user.id)].join(', ')}.**`)], flags: v2Flags });
            return;
        }

        if (aposta < 5) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia mínima de apostas é de 5 fichas!`, `roleta 5`)], flags: v2Flags });
            return;
        }

        if (aposta > 5000) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `roleta 5000`)], flags: v2Flags });
            return;
        }

        const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)], flags: v2Flags });
            return;
        }
        
        const multiplier = {
            '🍊': 1.2,
            '🍓': 1.5,
            '🍐': 3,
            '🍇': 6.5
        }

        const btn0 = utility.createButton('🍊', 'SECONDARY', '', '🍊')
        const btn1 = utility.createButton('🍓', 'SECONDARY', '', '🍓')
        const btn2 = utility.createButton('🍐', 'SECONDARY', '', '🍐')
        const btn3 = utility.createButton('🍇', 'SECONDARY', '', '🍇')

        const gameInfo = `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`;
        const initialContainer = rouletteContainer({
            color: 0x4e5052,
            fields: { author: interaction.user.tag, title: '⭕ Roleta', values: [{ name: 'Informações de Jogo', value: gameInfo }] },
            footer: '⭕ Informações da sua aposta:\nEscolha uma fruta para apostar'
        });
        initialContainer.addActionRowComponents(new ActionRowBuilder().addComponents(btn0, btn1, btn2, btn3));
        let embedinteraction = (await interaction.reply({ components: [initialContainer], flags: v2Flags, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
            
        const collector = await embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let selected;
        let reacted = false
        collector.on('collect', async (b) => {

            selected = b.customId;
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.roleta.defer_update'); });
            reacted = true

            let array = [];
            let rolnum = utility.random(15, 20)
            let currentnum = 0;
            async function roll(){

                if (array.length == 0) {
                    for (let i = 0; i < 11; i++) {
                        let random = utility.random(0, 100);

                        if (random < 45) {
                            array.push('🍊')
                        }else if (random < 76) {
                            array.push('🍓')
                        }else if (random < 95) {
                            array.push('🍐')
                        }else if (random >= 95) {
                            array.push('🍇')
                        }
                    }
                } else {
                    array.splice(0, 1);
                    let random = utility.random(0, 100);

                    if (random < 45) {
                        array.push('🍊')
                    }else if (random < 76) {
                        array.push('🍓')
                    }else if (random < 90) {
                        array.push('🍐')
                    }else if (random < 100) {
                        array.push('🍇')
                    }
                }
                
                let resultColor = 0x4e5052;
                let resultTitle = '';
                let resultEmote = '';
                const resultDescription = `**<a:loading:736625632808796250> Girando a roleta**\n${'<:rol2:742058057110126674>'.repeat(5)}<:rol2s:742058927163965620>${'<:rol2:742058057110126674>'.repeat(5)}\n${array.join('')}\n${'<:rol1:742058057051144272>'.repeat(5)}<:rol1s:742058927021359145>${'<:rol1:742058057051144272>'.repeat(5)}`;
                let resultContainer = rouletteContainer({
                    color: resultColor,
                    description: resultDescription,
                    fields: { author: interaction.user.tag, title: '⭕ Roleta', values: [
                        { name: 'Sua aposta', value: `Aposta: ${utility.format(aposta)} ${utility.money3} ${utility.money3emoji}\nFruta: ${selected} (${multiplier[selected]}x)` },
                        { name: 'Informações de Jogo', value: gameInfo }
                    ] }
                });
                currentnum++;
                if (rolnum > currentnum) {
                    currentnum++;
                    setTimeout(function(){roll()}, 1550);
                } else {
                    if (selected == array[5]) {
                        economyService.addToHistory(interaction.user.id, `Roleta | + ${utility.format(Math.round(aposta*multiplier[selected])-aposta)} ${utility.money3emoji}`);
                        resultColor = 0x56fc03; resultTitle = '**✅ VOCÊ GANHOU!!**'; resultEmote = '✅';
                        await economyService.token.add(interaction.user.id, (Math.round(aposta*multiplier[selected])-aposta));playersService.cooldown.set(interaction.user.id, "roullete", 0);
                    }
                    else {
                        economyService.addToHistory(interaction.user.id, `Roleta | - ${utility.format(aposta)} ${utility.money3emoji}`);
                        resultColor = 0xfc0324;
                        resultTitle = '**❌ VOCÊ PERDEU!!**';
                        resultEmote = '❌';
                        await economyService.token.remove(interaction.user.id, aposta);
                        economyService.token.add(config.app.id, aposta);
                        playersService.cooldown.set(interaction.user.id, "roullete", 0);
                    }
                    resultContainer = rouletteContainer({
                        color: resultColor,
                        description: `${resultTitle}\n${'<:rol2:742058057110126674>'.repeat(5)}<:rol2s:742058927163965620>${'<:rol2:742058057110126674>'.repeat(5)}\n${array.join('')}\n${'<:rol1:742058057051144272>'.repeat(5)}<:rol1s:742058927021359145>${'<:rol1:742058057051144272>'.repeat(5)}`,
                        fields: { author: interaction.user.tag, title: '⭕ Roleta', values: [
                            { name: 'Sua aposta', value: `Aposta: ${utility.format(aposta)} ${utility.money3} ${utility.money3emoji}\nFruta: ${selected} (${multiplier[selected]}x)\n${resultEmote} ${resultEmote == '✅' ? `Lucro: ${(Math.round(aposta*multiplier[selected])-aposta)}`: `Prejuízo: ${aposta}`} ${utility.money3} ${utility.money3emoji}` },
                            { name: 'Informações de Jogo', value: gameInfo }
                        ] }
                    });
                    playersService.cooldown.set(interaction.user.id, "roullete", 0);
                }
                interaction.editReply({ components: [resultContainer], flags: v2Flags });
            }

            roll();

            collector.stop();
        });

        collector.on('end', async collected => {

            if (reacted) return

            interaction.editReply({ components: [initialContainer], flags: v2Flags });

            return;
        });

        playersService.cooldown.set(interaction.user.id, "roullete", 60);
    
    }
};
