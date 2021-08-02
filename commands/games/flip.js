module.exports = {
    name: 'girar',
    aliases: ['flip'],
    category: 'Jogos',
    description: 'Aposte em cara ou coroa e duplique suas fichas',
    options: [{
        name: 'membro',
        type: 'USER',
        description: 'Selecione um membro para realizar a aposta',
        required: true
    },
    {
        name: 'fichas',
        type: 'INTEGER',
        description: 'Selecione uma quantia de fichas para aposta',
        required: true
    }],
    mastery: 10,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        const check = await API.playerUtils.cooldown.check(msg.author, "flip");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'flip', 'apostar um giro contra um membro')

            return;
        }

        let member 
        if (msg.slash) {
            member = msg.options.getMember('membro');
        } else {

            member = msg.mentions.users.first();

            if (msg.mentions.users.size < 1) {
                const embedtemp = await API.sendError(msg, `Você precisa mencionar um player para usar o flip!`, `girar @membro <quantia | tudo>`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
            
        }
        
        if (member.id == msg.author.id) {
            const embedtemp = await API.sendError(msg, 'Você precisa mencionar outra pessoa para usar o flip', 'girar @membro <quantia | tudo>')
            await msg.quote({ embeds: [embedtemp]})
            return
        }

        const townauthor = await API.townExtension.getTownName(msg.author)
        const townmember = await API.townExtension.getTownName(member)

        if (!(API.townExtension.games[townauthor].includes('flip'))) {
            const embedtemp = await API.sendError(msg, `A casa de jogos da sua vila não possui o jogo **FLIP**!\nJogos disponíveis na sua vila: **${API.townExtension.games[townauthor].join(', ')}.**`)
			await msg.quote({ embeds: [embedtemp]})
            return;
        }
        if (!(API.townExtension.games[townmember].includes('flip'))) {
            const embedtemp = await API.sendError(msg, `A casa de jogos de ${member} não possui o jogo **FLIP**!\nJogos disponíveis na vila do mesmo: **${API.townExtension.games[townmember].join(', ')}.**`)
			await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let aposta = 0

        if (!msg.slash) {

            if (args.length < 2) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar o membro e a quantia da aposta!`, `girar @membro <aposta>`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

            if (!API.isInt(args[1])) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas (NÚMERO) para aposta!`, `girar @membro <aposta>`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

        }
        aposta = parseInt(args[1]);

        if (aposta < 1) {
            const embedtemp = await API.sendError(msg, `A quantia mínima de apostas é de 1 ficha!`, `girar @membro <aposta>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        if (aposta > 5000) {
            const embedtemp = await API.sendError(msg, `A quantia máxima de apostas é de 5000 fichas!`, `girar @membro <aposta>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        const token = await API.eco.token.get(msg.author)

        if (token < aposta) {
            const embedtemp = await API.sendError(msg, `Você não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para apostar!\nCompre suas fichas na loja \`${API.prefix}loja fichas\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        const tokenmember = await API.eco.token.get(member)

        if (tokenmember < aposta) {
            const embedtemp = await API.sendError(msg, `O membro ${member} não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para apostar!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let confirm = {}

        confirm[msg.author.id] = '<a:loading:736625632808796250>'
        confirm[member.id] = '<a:loading:736625632808796250>'

        API.playerUtils.cooldown.set(msg.author, "flip", 60);
        API.playerUtils.cooldown.set(member, "flip", 60);

        const embed = new Discord.MessageEmbed()
        .setTitle('Giro')
        .setColor('#42e3d0')
		.setDescription(`O membro ${msg.author} iniciou uma aposta contra ${member} valendo \`${aposta} ${API.money3}\` ${API.money3emoji}\nCaso a moeda caia em **CARA**, ${msg.author} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
        .addField('<a:loading:736625632808796250> Aguardando confirmações', `${msg.author} ${confirm[msg.author.id]}\n${member} ${confirm[member.id]}`)
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] });

        const filter = (button) => true

        let reacted = {}
        
        const collector = embedmsg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id || b.user.id === member.id)) return
            collector.resetTimer()
            API.playerUtils.cooldown.set(msg.author, "flip", 60);
            API.playerUtils.cooldown.set(member, "flip", 60);
            reacted[b.user.id] = true
            if (b.customId == 'cancel'){
                confirm[b.user.id] = '❌'
            } else {
                confirm[b.user.id] = '✅'
            }

            if (!b.deferred) b.deferUpdate().then().catch();

            const embed = new Discord.MessageEmbed()
            .setTitle('Giro')
            .setColor('#a60000')
            .setDescription(`O membro ${msg.author} iniciou uma aposta contra ${member} valendo \`${aposta} ${API.money3}\` ${API.money3emoji}\nCaso a moeda caia em **CARA**, ${msg.author} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
            if (confirm[msg.author.id] == '<a:loading:736625632808796250>' || confirm[member.id] == '<a:loading:736625632808796250>') {
                embed.addField('<a:loading:736625632808796250> Aguardando confirmações', `${msg.author} ${confirm[msg.author.id]}\n${member} ${confirm[member.id]}`)
                return embedmsg.edit({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] })
            }

            collector.stop()
            if (confirm[msg.author.id] == '❌' && confirm[member.id] == '❌') {
                embed.addField('❌ Aposta cancelada', `Os dois jogadores cancelaram a aposta!`)
            } else if (confirm[msg.author.id] == '❌') {
                embed.addField('❌ Aposta cancelada', `O membro ${msg.author} cancelou a aposta!`)
            } else if (confirm[member.id] == '❌') {
                embed.addField('❌ Aposta cancelada', `O membro ${member} não aceitou a aposta!`)
            } else if (confirm[msg.author.id] == '✅' && confirm[member.id] == '✅') {

                const token = await API.eco.token.get(msg.author)

                if (token < aposta) {
                    embed.addField('❌ Aposta cancelada', `${msg.author} não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para apostar!\nCompre suas fichas na loja \`${API.prefix}loja fichas\``)
                    return embedmsg.edit({ embeds: [embed], components: [] });
                }
                const tokenmember = await API.eco.token.get(member)

                if (tokenmember < aposta) {
                    embed.addField('❌ Aposta cancelada', `${member} não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para apostar!\nCompre suas fichas na loja \`${API.prefix}loja fichas\``)
                    return embedmsg.edit({ embeds: [embed], components: [] });
                }

                let fresponse = ""
                let response = "cara"
                let lado = "cara"

                const rd = API.random(0, 100)

                if (rd < 50) response = "coroa"

                if (response == lado) { // Author ganhou
                    fresponse += `Caiu em **CARA** e ${msg.author} foi o ganhador das \`${API.format(aposta)} ${API.money3}\` ${API.money3emoji}`
                    API.eco.token.add(msg.author, aposta);
                    API.eco.token.remove(member, aposta);

                    API.eco.addToHistory(msg.author, `Flip ${member} | + ${API.format(aposta)} ${API.money3emoji}`);
                    API.eco.addToHistory(member, `Flip ${msg.author} | - ${API.format(aposta)} ${API.money3emoji}`);
                } else { // Membro ganhou
                    fresponse += `Caiu em **COROA** e ${member} foi o ganhador das \`${API.format(aposta)} ${API.money3}\` ${API.money3emoji}`
                    API.eco.token.add(member, aposta);
                    API.eco.token.remove(msg.author, aposta);

                    API.eco.addToHistory(member, `Flip ${msg.author} | + ${API.format(aposta)} ${API.money3emoji}`);
                    API.eco.addToHistory(msg.author, `Flip ${member} | - ${API.format(aposta)} ${API.money3emoji}`);
                }
                
                async function applyBet(rd) {
                    
                    const bets = await API.getGlobalInfo("bets")

                    let jsonbet = {
                        "flip": []
                    }
                    
                    if (bets != null) {
                        jsonbet = bets
                    }
            
                    jsonbet.flip.unshift(rd)
                    jsonbet.flip = jsonbet.flip.slice(0, 100)
            
                    API.setGlobalInfo('bets', jsonbet)

                    let chancemedia = 0
            
                    for (i = 0; i < jsonbet.flip.length; i++) {
                        chancemedia += jsonbet.flip[i]
                    }

                    return (chancemedia/jsonbet.flip.length).toFixed(3)
                }

                const chances = await applyBet(rd, response) 
                embed.setColor('#5bff45');
                embed.addField('✅ Aposta realizada', fresponse + (chances ? `\nChances: \`${chances} cara/coroa\``:''))
                API.playerUtils.cooldown.set(msg.author, "flip", 0);
                API.playerUtils.cooldown.set(member, "flip", 0);
            }
            
            embedmsg.edit({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            API.playerUtils.cooldown.set(msg.author, "flip", 0);
            API.playerUtils.cooldown.set(member, "flip", 0);
            if (reacted[msg.author.id] == true && reacted[member.id] == true) return;

            const embed = new Discord.MessageEmbed()
            .setTitle('Giro')
            .setColor('#a60000')
            .setDescription(`O membro ${msg.author} iniciou uma aposta contra ${member} valendo \`${aposta} ${API.money3}\` ${API.money3emoji}\nCaso a moeda caia em **CARA**, ${msg.author} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
            .addField('❌ Tempo expirado', `Um jogador não aceitou ou negou a aposta em tempo suficiente, a aposta foi cancelada!`)
            embedmsg.edit({ embeds: [embed], components: [] });

            return;
        });

    
    }
};