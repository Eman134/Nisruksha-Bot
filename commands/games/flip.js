const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const economyService = require('../../_classes/services/economy');
const config = require('../../_classes/config');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const prisma = require('../../_classes/prisma');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Selecione um membro para realizar a aposta').setRequired(true))
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

function flipContainer({ color, description, field, buttons }) {
    const sections = ['**Giro**', description, field && `**${field.name}**\n${field.value}`].filter(Boolean);
    const container = textContainer(sections.join('\n\n'), color);
    if (buttons) container.addActionRowComponents(new ActionRowBuilder().addComponents(...buttons));
    return container;
}

module.exports = {
    name: 'girar',
    aliases: ['flip'],
    category: 'Jogos',
    description: 'Aposte em cara ou coroa e duplique suas fichas',
    data,
    mastery: 10,
	async execute(interaction) {

                
        const check = await playersService.cooldown.check(interaction.user.id, "flip");
        if (check) {

            playersService.cooldown.message(interaction, 'flip', 'apostar um giro contra um membro')

            return;
        }

        const aposta = interaction.options.getInteger('fichas');
        const member = interaction.options.getUser('membro')
        
        if (member.id == interaction.user.id) {
            await interaction.reply({ components: [errorContainer(interaction, 'Você precisa mencionar outra pessoa para usar o flip', 'girar @membro <quantia | tudo>')], flags: v2Flags });
            return
        }

        const townauthor = await townsService.getTownName(interaction.user.id)
        const townmember = await townsService.getTownName(member.id)

        if (!(townsService.games[townauthor].includes('flip'))) {
            await interaction.reply({ components: [errorContainer(interaction, `A casa de jogos da sua vila não possui o jogo **FLIP**!\nJogos disponíveis na sua vila: **${townsService.games[townauthor].join(', ')}.**`)], flags: v2Flags });
            return;
        }
        if (!(townsService.games[townmember].includes('flip'))) {
            await interaction.reply({ components: [errorContainer(interaction, `A casa de jogos de ${member} não possui o jogo **FLIP**!\nJogos disponíveis na vila do mesmo: **${townsService.games[townmember].join(', ')}.**`)], flags: v2Flags });
            return;
        }

        if (aposta < 1) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia mínima de apostas é de 1 ficha!`, `girar @membro <aposta>`)], flags: v2Flags });
            return;
        }
        if (aposta > 5000) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `girar @membro <aposta>`)], flags: v2Flags });
            return;
        }

        const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\``)], flags: v2Flags });
            return;
        }
        const tokenmember = await economyService.token.get(member.id)

        if (tokenmember < aposta) {
            await interaction.reply({ components: [errorContainer(interaction, `O membro ${member} não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!`)], flags: v2Flags });
            return;
        }

        let confirm = {}

        confirm[interaction.user.id] = '<a:loading:736625632808796250>'
        confirm[member.id] = '<a:loading:736625632808796250>'

        playersService.cooldown.set(interaction.user.id, "flip", 60);
        playersService.cooldown.set(member.id, "flip", 60);

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')
        const flipDescription = `O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${utility.money3}\` ${utility.money3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`;

        let embedinteraction = (await interaction.reply({ components: [flipContainer({ color: 0x42e3d0, description: flipDescription, field: { name: '<a:loading:736625632808796250> Aguardando confirmações', value: `${interaction.user} ${confirm[interaction.user.id]}\n${member} ${confirm[member.id]}` }, buttons: [btn0, btn1] })], flags: v2Flags, withResponse: true })).resource.message;

        const filter = (button) => true

        let reacted = {}
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id || b.user.id === member.id)) return
            collector.resetTimer()
            playersService.cooldown.set(interaction.user.id, "flip", 60);
            playersService.cooldown.set(member.id, "flip", 60);
            reacted[b.user.id] = true
            if (b.customId == 'cancel'){
                confirm[b.user.id] = '❌'
            } else {
                confirm[b.user.id] = '✅'
            }

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.flip.defer_update'); });

            let flipView = flipContainer({ color: 0xa60000, description: flipDescription, buttons: [] });
            if (confirm[interaction.user.id] == '<a:loading:736625632808796250>' || confirm[member.id] == '<a:loading:736625632808796250>') {
                flipView = flipContainer({ color: 0xa60000, description: flipDescription, field: { name: '<a:loading:736625632808796250> Aguardando confirmações', value: `${interaction.user} ${confirm[interaction.user.id]}\n${member} ${confirm[member.id]}` }, buttons: [btn0, btn1] });
                return interaction.editReply({ components: [flipView], flags: v2Flags });
            }

            collector.stop()
            if (confirm[interaction.user.id] == '❌' && confirm[member.id] == '❌') {
                flipView = flipContainer({ color: 0xa60000, description: flipDescription, field: { name: '❌ Aposta cancelada', value: 'Os dois jogadores cancelaram a aposta!' } });
            } else if (confirm[interaction.user.id] == '❌') {
                flipView = flipContainer({ color: 0xa60000, description: flipDescription, field: { name: '❌ Aposta cancelada', value: `O membro ${interaction.user} cancelou a aposta!` } });
            } else if (confirm[member.id] == '❌') {
                flipView = flipContainer({ color: 0xa60000, description: flipDescription, field: { name: '❌ Aposta cancelada', value: `O membro ${member} não aceitou a aposta!` } });
            } else if (confirm[interaction.user.id] == '✅' && confirm[member.id] == '✅') {

                const token = await economyService.token.get(interaction.user.id)

                if (token < aposta) {
                    flipView = flipContainer({ color: 0xa60000, description: flipDescription, field: { name: '❌ Aposta cancelada', value: `${interaction.user} não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\`` } });
                    return interaction.editReply({ components: [flipView], flags: v2Flags });
                }
                const tokenmember = await economyService.token.get(member.id)

                if (tokenmember < aposta) {
                    flipView = flipContainer({ color: 0xa60000, description: flipDescription, field: { name: '❌ Aposta cancelada', value: `${member} não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\`` } });
                    return interaction.editReply({ components: [flipView], flags: v2Flags });
                }

                let fresponse = ""
                let response = "cara"
                let lado = "cara"

                const rd = utility.random(0, 100)

                if (rd < 50) response = "coroa"

                if (response == lado) { // Author ganhou
                    fresponse += `Caiu em **CARA** e ${interaction.user} foi o ganhador das \`${utility.format(aposta)} ${utility.money3}\` ${utility.money3emoji}`
                    economyService.token.add(interaction.user.id, aposta);
                    economyService.token.remove(member.id, aposta);

                    economyService.addToHistory(interaction.user.id, `Flip ${member} | + ${utility.format(aposta)} ${utility.money3emoji}`);
                    economyService.addToHistory(member.id, `Flip ${interaction.user} | - ${utility.format(aposta)} ${utility.money3emoji}`);
                } else { // Membro ganhou
                    fresponse += `Caiu em **COROA** e ${member} foi o ganhador das \`${utility.format(aposta)} ${utility.money3}\` ${utility.money3emoji}`
                    economyService.token.add(member.id, aposta);
                    economyService.token.remove(interaction.user.id, aposta);

                    economyService.addToHistory(member.id, `Flip ${interaction.user} | + ${utility.format(aposta)} ${utility.money3emoji}`);
                    economyService.addToHistory(interaction.user.id, `Flip ${member} | - ${utility.format(aposta)} ${utility.money3emoji}`);
                }
                
                async function applyBet(rd) {

                    const user_id = BigInt(config.app.id)
                    const globalobj = await prisma.globals.upsert({ where: { user_id }, update: { user_id }, create: { user_id, keys: [], remember: [], processing: [] } });
                    
                    const bets = globalobj.bets

                    let jsonbet = {
                        "flip": []
                    }
                    
                    if (bets != null) {
                        jsonbet = bets
                    }
            
                    jsonbet.flip.unshift(rd)
                    jsonbet.flip = jsonbet.flip.slice(0, 100)
            
                    await prisma.globals.update({ where: { user_id }, data: { bets: jsonbet } })

                    let chancemedia = 0
            
                    for (let i = 0; i < jsonbet.flip.length; i++) {
                        chancemedia += jsonbet.flip[i]
                    }

                    return (chancemedia/jsonbet.flip.length).toFixed(3)
                }

                const chances = await applyBet(rd, response) 
                flipView = flipContainer({ color: 0x5bff45, description: flipDescription, field: { name: '✅ Aposta realizada', value: fresponse + (chances ? `\nChances: \`${chances} cara/coroa\``:'') } });
                playersService.cooldown.set(interaction.user.id, "flip", 0);
                playersService.cooldown.set(member.id, "flip", 0);
            }
            
            interaction.editReply({ components: [flipView], flags: v2Flags });

        });
        
        collector.on('end', async collected => {
            playersService.cooldown.set(interaction.user.id, "flip", 0);
            playersService.cooldown.set(member.id, "flip", 0);
            if (reacted[interaction.user.id] == true && reacted[member.id] == true) return;

            interaction.editReply({ components: [flipContainer({ color: 0xa60000, description: flipDescription, field: { name: '❌ Tempo expirado', value: 'Um jogador não aceitou ou negou a aposta em tempo suficiente, a aposta foi cancelada!' } })], flags: v2Flags });

            return;
        });

    
    }
};
