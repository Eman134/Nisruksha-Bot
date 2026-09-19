const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))
.addUserOption(option => option.setName('membro').setDescription('Faça uma aposta com algum membro').setRequired(true))

module.exports = {
    requiredServices: ["Discord","client","createButton","eco","format","id","img","money3","money3emoji","playerUtils","random","rowComponents","sendError","townExtension"],
    name: 'blackjack',
    aliases: ['luckycards'],
    category: 'Jogos',
    description: 'Faça uma aposta com cartas e ganhe fichas!',
    data,
    mastery: 5,
	async execute(interaction, svcDiscord, svcClient, svcCreateButton, svcEco, svcFormat, svcId, svcImg, svcMoney3, svcMoney3emoji, svcPlayerUtils, svcRandom, svcRowComponents, svcSendError, svcTownExtension) {
        const aposta = interaction.options.getInteger('fichas')
        let member = interaction.options.getUser('membro')

        const check = await svcPlayerUtils.cooldown.check(interaction.user.svcId, "blackjack");

        if (check) {
            svcPlayerUtils.cooldown.message(interaction, 'blackjack', 'realizar aposta em blackjack')
            return;
        }

        const townauthor = await svcTownExtension.getTownName(interaction.user.svcId)

        if (!(svcTownExtension.games[townauthor].includes('blackjack'))) {
            const embedtemp = await svcSendError(interaction, `A casa de jogos da sua vila não possui o jogo **BLACKJACK**!\nJogos disponíveis na sua vila: **${svcTownExtension.games[townauthor].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (member == null || member.svcId == interaction.user.svcId) {
            const embedtemp = await svcSendError(interaction, 'Você precisa mencionar outra pessoa para usar o blackjack', 'blackjack <fichas> @membro')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        if (member.svcId != svcId) {

            const check2 = await svcPlayerUtils.cooldown.check(member.svcId, "blackjack");

            if (check2) {
                svcPlayerUtils.cooldown.message(interaction, 'blackjack', 'realizar aposta em blackjack')
                return;
            }

            const townmember = await svcTownExtension.getTownName(member.svcId)
            if (!(svcTownExtension.games[townmember].includes('blackjack'))) {
                const embedtemp = await svcSendError(interaction, `A casa de jogos de ${member} não possui o jogo **BLACKJACK**!\nJogos disponíveis na vila do mesmo: **${svcTownExtension.games[townmember].join(', ')}.**`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
        }

        if (aposta < 20) {
            const embedtemp = await svcSendError(interaction, `A quantia mínima de apostas é de 20 fichas!`, `blackjack 20`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta > 2500) {
            const embedtemp = await svcSendError(interaction, `A quantia máxima de apostas é de 2500 fichas!`, `blackjack <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const token = await svcEco.token.get(interaction.user.svcId)

        if (token < aposta) {
            const embedtemp = await svcSendError(interaction, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        const tokenmember = await svcEco.token.get(member.svcId)

        if (tokenmember < aposta) {
            const embedtemp = await svcSendError(interaction, `O membro ${member} não possui \`${aposta} ${svcMoney3}\` ${svcMoney3emoji} para apostar!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        let players = [
            {
                svcId: interaction.user.svcId,
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

        game.confirm[interaction.user.svcId] = '<a:loading:736625632808796250>'
        game.confirm[member.svcId] = '<a:loading:736625632808796250>'

        if (member != null) {
            const player2 = {
                svcId: member.svcId,
                name: member.username,
                fichas: aposta,
                cartas: [],
                pontos: 0,
                status: 'playing'
            }
            players.push(player2)
        } else {
            const player3 = {
                svcId: svcClient.user.svcId,
                name: svcClient.user.username,
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
                    if (!players[i].cartas.find((c) => c.svcId > 10) && cur.svcId == 1) {
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
                    let svcId = Math.floor(Math.svcRandom() * 13) + 1
                    if (svcRandom(0, 100) < 60) svcId = (Math.floor(Math.svcRandom() * 6) + 1)
                    const card = {
                        svcId,
                        pontos: 0,
                        naipe: Math.floor(Math.svcRandom() * 4) + 1,
                        imagem: ''
                    }
                    card.pontos = card.svcId > 10 ? 10 : card.svcId
                    card.svcId == 1 ? card.pontos = 11 : null
                    card.imagem = './resources/backgrounds/cartas/' + card.svcId + '/' + card.naipe + '.png'
                    if (cardsplayed.find(c => c.svcId == card.svcId && c.naipe == card.naipe)) {
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
                    if (!players[player].cartas.find((c) => c.svcId > 10) && cur.svcId == 1) {
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

            svcEco.token.add(winner.svcId, winner.fichas);
            svcEco.token.remove(loser.svcId, loser.fichas);

            svcEco.addToHistory(winner.svcId, `Blackjack <@${loser.svcId}> | + ${svcFormat(winner.fichas)} ${svcMoney3emoji}`);
            svcEco.addToHistory(loser.svcId, `Blackjack <@${winner.svcId}> | - ${svcFormat(loser.fichas)} ${svcMoney3emoji}`);

        }

        async function blackjack() {

            async function getBlackJackImage () {

                const blackjackimage = await svcImg.imagegens.get('blackjack.js')(dependencies, {
                    players,
                    game,
                })
    
                return blackjackimage;
    
            }

            function getBlackJackComponents (token) {

                if ((players[0].status != 'playing' && players[1].status != 'playing') || ['bust', 'blackjack', 'draw', 'timeout', 'lost'].includes(game.status)) return []

                const blackjackcomponents = []

                let row1

                const currentBtn = svcCreateButton('current', 'PRIMARY', 'Vez de ' + players[game.current].name).setDisabled(true)
                const hitBtn = svcCreateButton('hit', 'PRIMARY', 'Hit')
                const standBtn = svcCreateButton('stand', 'SUCCESS', 'Stand')
                const doubleBtn = svcCreateButton('double', 'SECONDARY', 'Double Down')
                const splitBtn = svcCreateButton('split', 'SECONDARY', 'Split')
                
                if (game.status == 'stand') {
                    standBtn.setDisabled(true)
                    //doubleBtn.setDisabled(true)
                    //splitBtn.setDisabled(true)
                }
                
                if (players[game.current].cartas.length != 2 || token < (players[game.current].fichas * 2)) {
                    doubleBtn.setDisabled(true)
                }
                
                let row1components = [currentBtn, hitBtn, standBtn, doubleBtn]
                row1 = svcRowComponents(row1components)

                blackjackcomponents.push(row1)

                return blackjackcomponents
            }

            function getBlackJackEmbed () {
                const playsMap = `\n \nJogadas:\nCartas iniciais dadas\n${game.plays.map(play => `${players[play.player].name} usou ${play.playtype.toUpperCase()}`).join('\n')}`
                const embed = new svcDiscord.MessageEmbed()
                .setColor('#4e5052')
                .setTitle(`<:hide:855906056865316895> BlackJack`)
                .setImage('attachment://image.png')
                .setDescription(`${players[0].name} e ${players[1].name}${game.status == 'bust' || game.status == 'blackjack' || ['bust', 'blackjack', 'timeout', 'lost'].includes(game.status) ? `\nVencedor: **${players[game.winner].name}** [__${game.status}__]\nAposta: ${players[game.winner].fichas} ${svcMoney3emoji}` : (game.status == 'draw' ? `\nEmpate!` : '')}`)
                .setFooter(playsMap)
                if (!['bust', 'blackjack', 'draw', 'timeout', 'lost'].includes(game.status)) {
                    embed.addField(`${players[game.current].name}`, `Pontos: ${players[game.current].pontos}\nAposta: ${players[game.current].fichas} ${svcMoney3emoji}`)
                    embed.setFooter(`${players[game.current].name} está jogando${playsMap}`)
                }
                return embed
            }
            const token = await svcEco.token.get(players[game.current].svcId)
            const blackjackimage = await getBlackJackImage()
            const blackjackcomponents = getBlackJackComponents(token)
            const blackjackembed = getBlackJackEmbed()
            
            const interactionData = { embeds: [blackjackembed], attachments: [], files: [blackjackimage], components: blackjackcomponents, withResponse: true }

            let message
            if (interaction.replied) {
                message = await interaction.editReply(interactionData);
            } else {
                message = await interaction.reply(interactionData)
            }

            return message

        }

        const embed = new svcDiscord.MessageEmbed()
        .setTitle(`<:hide:855906056865316895> BlackJack`)
        .setColor('#42e3d0')
		.setDescription(`O membro ${interaction.user} iniciou um blackjack contra ${member} valendo \`${aposta} ${svcMoney3}\` ${svcMoney3emoji}.`)
        .addField('<a:loading:736625632808796250> Aguardando confirmações', `${interaction.user} ${game.confirm[interaction.user.svcId]}\n${member} ${game.confirm[member.svcId]}`)
        
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let message 
        if (member.svcId == svcId) {
            message = await start()
            game.status = 'playing'
        } else {
            message = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });
        }

        const filter = i => {
            let passed = true
            try {
                const checkFilter = [interaction.user.svcId]
                if (member != null) checkFilter.push(member.svcId)
    
                if (!checkFilter.includes(i.user.svcId)) passed = false

            } catch (error) {
                reportError(error, 'command.blackjack.collector');
            }
            return passed
        }

        let collector = message.createMessageComponentCollector({ filter, time: 60000 });
        collector.on('collect', async(b) => {

            collector.resetTimer()

            if (game.status == 'confirm') {

                svcPlayerUtils.cooldown.set(interaction.user.svcId, "blackjack", 60);
                if (member.svcId != svcId) svcPlayerUtils.cooldown.set(member.svcId, "blackjack", 60);
                game.reacted[b.user.svcId] = true
                if (b.customId == 'cancel'){
                    game.confirm[b.user.svcId] = '❌'
                } else {
                    game.confirm[b.user.svcId] = '✅'
                }
                if (b && !b.deferred) await b.deferUpdate()

                const embed = new svcDiscord.MessageEmbed()
                .setTitle('<:hide:855906056865316895> BlackJack')
                .setColor('#a60000')
                .setDescription(`O membro ${interaction.user} iniciou um blackjack contra ${member} valendo \`${aposta} ${svcMoney3}\` ${svcMoney3emoji}.`)
                if (game.confirm[interaction.user.svcId] == '<a:loading:736625632808796250>' || game.confirm[member.svcId] == '<a:loading:736625632808796250>') {
                    embed.addField('<a:loading:736625632808796250> Aguardando confirmações', `${interaction.user} ${game.confirm[interaction.user.svcId]}\n${member} ${game.confirm[member.svcId]}`)
                    return interaction.editReply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])] })
                }
                if (game.confirm[interaction.user.svcId] == '❌' && game.confirm[member.svcId] == '❌') {
                    embed.addField('❌ Aposta cancelada', `Os dois jogadores cancelaram a aposta!`)
                    game.status = 'nostart'
                    return interaction.editReply({ embeds: [embed], components: [] })
                } else if (game.confirm[interaction.user.svcId] == '❌') {
                    embed.addField('❌ Aposta cancelada', `O membro ${interaction.user} cancelou a aposta!`)
                    game.status = 'nostart'
                    return interaction.editReply({ embeds: [embed], components: [] })
                } else if (game.confirm[member.svcId] == '❌') {
                    embed.addField('❌ Aposta cancelada', `O membro ${member} não aceitou a aposta!`)
                    game.status = 'nostart'
                    return interaction.editReply({ embeds: [embed], components: [] })
                } else if (game.confirm[interaction.user.svcId] == '✅' && game.confirm[member.svcId] == '✅') {
                    game.status = 'playing'
                    start()
                }

                return
            }

            try {

                if (game.current == 0 && b.user.svcId != interaction.user.svcId) return true
    
                if (member != null && game.current == 1 && b.user.svcId != member.svcId) return true

                const player = await play(game.current, b.customId)
                checkGame(player)

                if (!['bust', 'blackjack', 'draw', 'timeout', 'lost'].includes(game.status)) {

                    if (member.svcId == svcId && game.current == 1 && (game.status == 'stand' || game.status == 'playing' )) {

                        async function getBotPlay() {
                            const botPlay = {
                                player: 1,
                                playtype: 'hit',
                            }
                            if (players[1].pontos >= 15 && players[1].pontos <= 21 && game.status != 'stand' && players[0].status != 'stand') {
                                botPlay.playtype = 'stand'
                            } else if (players[1].pontos >= 17 && players[1].pontos <= 21 && players[0].pontos <= 10 && game.status != 'stand' && players[0].status != 'stand') {
                                botPlay.playtype = 'stand'
                            } else if (players[1].pontos > 6 && players[1].pontos < 14 && svcRandom(0, 100) < 30 && players[1].cartas.length == 2) {
                                const token = await svcEco.token.get(players[1].svcId)
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
            if (member.svcId != svcId) svcPlayerUtils.cooldown.set(member.svcId, "blackjack", 0);
            svcPlayerUtils.cooldown.set(interaction.user.svcId, "blackjack", 0);
            if (game.status == 'confirm' && (!game.reacted[interaction.user.svcId] || !game.reacted[member.svcId])) {
                const embed = new svcDiscord.MessageEmbed()
                .setTitle('<:hide:855906056865316895> BlackJack')
                .setColor('#a60000')
                .setDescription(`O membro ${interaction.user} iniciou um blackjack contra ${member} valendo \`${aposta} ${svcMoney3}\` ${svcMoney3emoji}.`)
                .addField('❌ Tempo expirado', `Um jogador não aceitou ou negou a aposta em tempo suficiente, o jogo foi cancelado!`)
                interaction.editReply({ embeds: [embed], components: [] });
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
