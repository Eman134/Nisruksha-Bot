const Discord = require('discord.js');
const playersService = require('../../_classes/services/players');
const townsService = require('../../_classes/services/towns');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const config = require('../../_classes/config');
const economyService = require('../../_classes/services/economy');
const clientService = require('../../_classes/services/clientService');
const imagesService = require('../../_classes/services/images');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))
.addUserOption(option => option.setName('membro').setDescription('Faça uma aposta com algum membro').setRequired(true))

const v2Flags = Discord.MessageFlags.IsComponentsV2;

function textContainer(content, color) {
    return new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

function errorContainer(interaction, message, usage) {
    return textContainer(`${interaction.user.tag}\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`, 0xb8312c);
}

function blackjackConfirmationContainer({ color, description, field, buttons }) {
    const sections = ['**<:hide:855906056865316895> BlackJack**', description, field && `**${field.name}**\n${field.value}`].filter(Boolean);
    const container = textContainer(sections.join('\n\n'), color);
    if (buttons) container.addActionRowComponents(new ActionRowBuilder().addComponents(...buttons));
    return container;
}

module.exports = {
    name: 'blackjack',
    aliases: ['luckycards'],
    category: 'Jogos',
    description: 'Faça uma aposta com cartas e ganhe fichas!',
    data,
    mastery: 5,
	async execute(interaction) {

        
        const aposta = interaction.options.getInteger('fichas')
        let member = interaction.options.getUser('membro')

        const check = await playersService.cooldown.check(interaction.user.id, "blackjack");

        if (check) {
            playersService.cooldown.message(interaction, 'blackjack', 'realizar aposta em blackjack')
            return;
        }

        const townauthor = await townsService.getTownName(interaction.user.id)

        if (!(townsService.games[townauthor].includes('blackjack'))) {
            await interaction.reply({ components: [errorContainer(interaction, `A casa de jogos da sua vila não possui o jogo **BLACKJACK**!\nJogos disponíveis na sua vila: **${townsService.games[townauthor].join(', ')}.**`)], flags: v2Flags });
            return;
        }

        if (member == null || member.id == interaction.user.id) {
            await interaction.reply({ components: [errorContainer(interaction, 'Você precisa mencionar outra pessoa para usar o blackjack', 'blackjack <fichas> @membro')], flags: v2Flags });
            return
        }

        if (member.id != config.app.id) {

            const check2 = await playersService.cooldown.check(member.id, "blackjack");

            if (check2) {
                playersService.cooldown.message(interaction, 'blackjack', 'realizar aposta em blackjack')
                return;
            }

            const townmember = await townsService.getTownName(member.id)
            if (!(townsService.games[townmember].includes('blackjack'))) {
                await interaction.reply({ components: [errorContainer(interaction, `A casa de jogos de ${member} não possui o jogo **BLACKJACK**!\nJogos disponíveis na vila do mesmo: **${townsService.games[townmember].join(', ')}.**`)], flags: v2Flags });
                return;
            }
        }

        if (aposta < 20) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia mínima de apostas é de 20 fichas!`, 'blackjack 20')], flags: v2Flags });
            return;
        }

        if (aposta > 2500) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia máxima de apostas é de 2500 fichas!`, 'blackjack <aposta>')], flags: v2Flags });
            return;
        }

        const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)], flags: v2Flags });
            return;
        }
        
        const tokenmember = await economyService.token.get(member.id)

        if (tokenmember < aposta) {
            await interaction.reply({ components: [errorContainer(interaction, `O membro ${member} não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!`)], flags: v2Flags });
            return;
        }
        
        let players = [
            {
                id: interaction.user.id,
                name: interaction.user.username,
                fichas: aposta,
                cartas: [],
                pontos: 0,
                status: 'playing'
            }
        ]

        let game = {
            confirm: {},
            reacted: {},
            current: 0,
            winner: -1,
            status: 'confirm',
            plays: []
        }

        game.confirm[interaction.user.id] = '<a:loading:736625632808796250>'
        game.confirm[member.id] = '<a:loading:736625632808796250>'

        if (member != null) {
            const player2 = {
                id: member.id,
                name: member.username,
                fichas: aposta,
                cartas: [],
                pontos: 0,
                status: 'playing'
            }
            players.push(player2)
        } else {
            const player3 = {
                id: clientService.current.user.id,
                name: clientService.current.user.username,
                fichas: aposta,
                cartas: [],
                pontos: 0,
                status: 'playing'
            }
            players.push(player3)
        }

        function setCards() {
            for (let i = 0; i < players.length; i++) {
                players[i].cartas = [getCard(), getCard()]
                players[i].pontos = players[i].cartas.reduce((acc, cur) => {
                    if (!players[i].cartas.find((c) => c.id > 10) && cur.id == 1) {
                        return acc + 1
                    }
                    return acc + cur.pontos
                }, 0)
                checkStatus(i)
                checkGame(players[i])
            }
        }

        async function start() {
            setCards()
            const blmsg = await blackjack()
            return blmsg
        }

        function getCard() {

            let cardsplayed = players[0].cartas.concat(players[1].cartas)

            function newCard() {

                try {
                    let id = Math.floor(Math.random() * 13) + 1
                    if (utility.random(0, 100) < 60) id = (Math.floor(Math.random() * 6) + 1)
                    const card = {
                        id,
                        pontos: 0,
                        naipe: Math.floor(Math.random() * 4) + 1,
                        imagem: ''
                    }
                    card.pontos = card.id > 10 ? 10 : card.id
                    card.id == 1 ? card.pontos = 11 : null
                    card.imagem = './resources/backgrounds/cartas/' + card.id + '/' + card.naipe + '.png'
                    if (cardsplayed.find(c => c.id == card.id && c.naipe == card.naipe)) {
                        return newCard()
                    }
                    return card
                } catch (error) {
                    reportError(error, 'command.blackjack.challenge');
                }

            }

            const card = newCard()

            return card
        }

        function checkStatus(player) {
            if (players[player].pontos > 21) {
                players[player].status = 'bust'
                return players[player];
            }
            if (players[player].pontos == 21) {
                players[player].status = 'blackjack'
                return players[player];
            }
            if (players[player].pontos < 21) {
                if (players[player].status != 'stand') {
                    players[player].status = 'skip'
                }
                return players[player];
            }
        }

        async function play(player, playtype) {

            let stand = false
            
            function setStand() {
                if (game.status == 'stand') {
                    players[player].status = 'stand'
                    stand = true
                }
                else game.status = 'stand'
                
            }

            const card = await getCard()

            function giveCard() {
                players[player].cartas.push(card)
                players[player].pontos = players[player].cartas.reduce((acc, cur) => {
                    if (!players[player].cartas.find((c) => c.id > 10) && cur.id == 1) {
                        return acc + 1
                    }
                    return acc + cur.pontos
                }, 0)
            }

            if (game.status == 'stand') {
                setStand()
            }
            
            switch (playtype) {
                case 'hit':
                    giveCard()
                    break;
                case 'stand':
                    setStand()
                    if (players[(game.current + 1) % players.length].cartas.length >= 5) {
                        setStand()
                    }
                    break;
                case 'double':
                    giveCard()
                    players[player].fichas *= 2
                    setStand()
                    break;
                case 'split':
                    giveCard()
                    players[0].fichas /= 2
                    players[1].fichas /= 2
                    setStand()
                    break;
                default:
                    console.log('Erro play blackjack - playtype: ' + playtype)
                    break;
            } 

            game.plays.push({ player, playtype })

            return checkStatus(player, stand)
        }

        function checkGame(player) {
            if (player.status == 'skip') {
                game.current = (game.current + 1) % players.length
                players[game.current].status = 'playing'
            } else if (player.status == 'bust') {
                if (players[0].pontos == players[1].pontos) {
                    game.winner = -1
                    game.status = 'draw'
                } else {
                    game.current = (game.current + 1) % players.length
                    game.winner = game.current
                    game.status = 'bust'
                    sendWinner()
                }
            } else if (player.status == 'blackjack') {
                if (players[0].pontos == players[1].pontos) {
                    game.winner = -1
                    game.status = 'draw'
                } else {
                    game.winner = game.current
                    game.status = 'blackjack'
                    sendWinner()
                }
            } else if (player.status == 'stand') {
                
                if (players[0].pontos == players[1].pontos) {
                    game.winner = -1
                    game.status = 'draw'
                } else {
                    players[0].pontos > players[1].pontos ? game.winner = 0 : game.winner = 1
                    game.status = 'lost'
                    sendWinner()
                }

            }

            return game
        }

        function sendWinner() {

            let winner = players[game.winner]

            let loser = players[(game.winner + 1) % 2]

            economyService.token.add(winner.id, winner.fichas);
            economyService.token.remove(loser.id, loser.fichas);

            economyService.addToHistory(winner.id, `Blackjack <@${loser.id}> | + ${utility.format(winner.fichas)} ${utility.money3emoji}`);
            economyService.addToHistory(loser.id, `Blackjack <@${winner.id}> | - ${utility.format(loser.fichas)} ${utility.money3emoji}`);

        }

        async function blackjack() {

            async function getBlackJackImage () {

                const blackjackimage = await imagesService.imagegens.get('blackjack.js')({
                    players,
                    game,
                })
    
                return blackjackimage;
    
            }

            function getBlackJackComponents (token) {

                if ((players[0].status != 'playing' && players[1].status != 'playing') || ['bust', 'blackjack', 'draw', 'timeout', 'lost'].includes(game.status)) return []

                const blackjackcomponents = []

                let row1

                const currentBtn = utility.createButton('current', 'PRIMARY', 'Vez de ' + players[game.current].name).setDisabled(true)
                const hitBtn = utility.createButton('hit', 'PRIMARY', 'Hit')
                const standBtn = utility.createButton('stand', 'SUCCESS', 'Stand')
                const doubleBtn = utility.createButton('double', 'SECONDARY', 'Double Down')
                const splitBtn = utility.createButton('split', 'SECONDARY', 'Split')
                
                if (game.status == 'stand') {
                    standBtn.setDisabled(true)
                    //doubleBtn.setDisabled(true)
                    //splitBtn.setDisabled(true)
                }
                
                if (players[game.current].cartas.length != 2 || token < (players[game.current].fichas * 2)) {
                    doubleBtn.setDisabled(true)
                }
                
                let row1components = [currentBtn, hitBtn, standBtn, doubleBtn]
                row1 = new ActionRowBuilder().addComponents(...row1components)

                blackjackcomponents.push(row1)

                return blackjackcomponents
            }

            function getBlackJackContainer () {
                const playsMap = `\n \nJogadas:\nCartas iniciais dadas\n${game.plays.map(play => `${players[play.player].name} usou ${play.playtype.toUpperCase()}`).join('\n')}`
                const description = `${players[0].name} e ${players[1].name}${game.status == 'bust' || game.status == 'blackjack' || ['bust', 'blackjack', 'timeout', 'lost'].includes(game.status) ? `\nVencedor: **${players[game.winner].name}** [__${game.status}__]\nAposta: ${players[game.winner].fichas} ${utility.money3emoji}` : (game.status == 'draw' ? `\nEmpate!` : '')}`;
                const sections = [`**<:hide:855906056865316895> BlackJack**`, description];
                if (!['bust', 'blackjack', 'draw', 'timeout', 'lost'].includes(game.status)) {
                    sections.push(`**${players[game.current].name}**\nPontos: ${players[game.current].pontos}\nAposta: ${players[game.current].fichas} ${utility.money3emoji}`);
                    sections.push(`${players[game.current].name} está jogando${playsMap}`);
                } else {
                    sections.push(playsMap);
                }
                return textContainer(sections.join('\n\n'), 0x4e5052)
                    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: 'attachment://image.png' } }));
            }
            const token = await economyService.token.get(players[game.current].id)
            const blackjackimage = await getBlackJackImage()
            const blackjackcomponents = getBlackJackComponents(token)
            const blackjackcontainer = getBlackJackContainer()
            
            const interactionData = { files: [blackjackimage], components: [blackjackcontainer, ...blackjackcomponents], flags: v2Flags, withResponse: true }

            let message
            if (interaction.replied) {
                message = await interaction.editReply(interactionData);
            } else {
                message = await interaction.reply(interactionData)
            }

            return message

        }

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')
        const blackjackDescription = `O membro ${interaction.user} iniciou um blackjack contra ${member} valendo \`${aposta} ${utility.money3}\` ${utility.money3emoji}.`;

        let message 
        if (member.id == config.app.id) {
            message = await start()
            game.status = 'playing'
        } else {
            message = (await interaction.reply({ components: [blackjackConfirmationContainer({ color: 0x42e3d0, description: blackjackDescription, field: { name: '<a:loading:736625632808796250> Aguardando confirmações', value: `${interaction.user} ${game.confirm[interaction.user.id]}\n${member} ${game.confirm[member.id]}` }, buttons: [btn0, btn1] })], flags: v2Flags, withResponse: true })).resource.message;
        }

        const filter = i => {
            let passed = true
            try {
                const checkFilter = [interaction.user.id]
                if (member != null) checkFilter.push(member.id)
    
                if (!checkFilter.includes(i.user.id)) passed = false

            } catch (error) {
                reportError(error, 'command.blackjack.collector');
            }
            return passed
        }

        let collector = message.createMessageComponentCollector({ filter, time: 60000 });
        collector.on('collect', async(b) => {

            collector.resetTimer()

            if (game.status == 'confirm') {

                playersService.cooldown.set(interaction.user.id, "blackjack", 60);
                if (member.id != config.app.id) playersService.cooldown.set(member.id, "blackjack", 60);
                game.reacted[b.user.id] = true
                if (b.customId == 'cancel'){
                    game.confirm[b.user.id] = '❌'
                } else {
                    game.confirm[b.user.id] = '✅'
                }
                if (b && !b.deferred) await b.deferUpdate()

                if (game.confirm[interaction.user.id] == '<a:loading:736625632808796250>' || game.confirm[member.id] == '<a:loading:736625632808796250>') {
                    return interaction.editReply({ components: [blackjackConfirmationContainer({ color: 0xa60000, description: blackjackDescription, field: { name: '<a:loading:736625632808796250> Aguardando confirmações', value: `${interaction.user} ${game.confirm[interaction.user.id]}\n${member} ${game.confirm[member.id]}` }, buttons: [btn0, btn1] })], flags: v2Flags })
                }
                if (game.confirm[interaction.user.id] == '❌' && game.confirm[member.id] == '❌') {
                    game.status = 'nostart'
                    return interaction.editReply({ components: [blackjackConfirmationContainer({ color: 0xa60000, description: blackjackDescription, field: { name: '❌ Aposta cancelada', value: 'Os dois jogadores cancelaram a aposta!' } })], flags: v2Flags })
                } else if (game.confirm[interaction.user.id] == '❌') {
                    game.status = 'nostart'
                    return interaction.editReply({ components: [blackjackConfirmationContainer({ color: 0xa60000, description: blackjackDescription, field: { name: '❌ Aposta cancelada', value: `O membro ${interaction.user} cancelou a aposta!` } })], flags: v2Flags })
                } else if (game.confirm[member.id] == '❌') {
                    game.status = 'nostart'
                    return interaction.editReply({ components: [blackjackConfirmationContainer({ color: 0xa60000, description: blackjackDescription, field: { name: '❌ Aposta cancelada', value: `O membro ${member} não aceitou a aposta!` } })], flags: v2Flags })
                } else if (game.confirm[interaction.user.id] == '✅' && game.confirm[member.id] == '✅') {
                    game.status = 'playing'
                    start()
                }

                return
            }

            try {

                if (game.current == 0 && b.user.id != interaction.user.id) return true
    
                if (member != null && game.current == 1 && b.user.id != member.id) return true

                const player = await play(game.current, b.customId)
                checkGame(player)

                if (!['bust', 'blackjack', 'draw', 'timeout', 'lost'].includes(game.status)) {

                    if (member.id == config.app.id && game.current == 1 && (game.status == 'stand' || game.status == 'playing' )) {

                        async function getBotPlay() {
                            const botPlay = {
                                player: 1,
                                playtype: 'hit',
                            }
                            if (players[1].pontos >= 15 && players[1].pontos <= 21 && game.status != 'stand' && players[0].status != 'stand') {
                                botPlay.playtype = 'stand'
                            } else if (players[1].pontos >= 17 && players[1].pontos <= 21 && players[0].pontos <= 10 && game.status != 'stand' && players[0].status != 'stand') {
                                botPlay.playtype = 'stand'
                            } else if (players[1].pontos > 6 && players[1].pontos < 14 && utility.random(0, 100) < 30 && players[1].cartas.length == 2) {
                                const token = await economyService.token.get(players[1].id)
                                if (token >= (players[1].fichas * 2)) {
                                    botPlay.playtype = 'double'
                                } else {
                                    botPlay.playtype = 'hit'
                                }
                            } else if (players[1].pontos < 15) {
                                botPlay.playtype = 'hit'
                            }
                            return botPlay
                        }
                        const botPlay = await getBotPlay()
                        const player2 = await play(game.current, botPlay.playtype)
                        checkGame(player2)
                    }

                } else {
                    collector.stop()
                }

                await blackjack()
                await b.deferUpdate()
            } catch (error) {
                reportError(error, 'command.blackjack.timeout');
            }

        })

        collector.on('end', async() => {
            if (member.id != config.app.id) playersService.cooldown.set(member.id, "blackjack", 0);
            playersService.cooldown.set(interaction.user.id, "blackjack", 0);
            if (game.status == 'confirm' && (!game.reacted[interaction.user.id] || !game.reacted[member.id])) {
                interaction.editReply({ components: [blackjackConfirmationContainer({ color: 0xa60000, description: blackjackDescription, field: { name: '❌ Tempo expirado', value: 'Um jogador não aceitou ou negou a aposta em tempo suficiente, o jogo foi cancelado!' } })], flags: v2Flags });
                return
            }
            if (['bust', 'blackjack', 'draw', 'lost', 'nostart'].includes(game.status)) return
            players[game.current].status = 'off'
            game.status = 'timeout'
            game.current = (game.current + 1) % players.length
            game.winner = game.current
            await blackjack()
            sendWinner()
        })
    
    }
};
