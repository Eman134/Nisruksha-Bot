module.exports = {
    name: 'roleta',
    aliases: ['roullete'],
    category: 'Jogos',
    description: 'Aposte em frutas e multiplique sua aposta',
    options: [{
        name: 'fichas',
        type: 'INTEGER',
        description: 'Selecione uma quantia de fichas para aposta',
        required: true
    }],
    mastery: 20,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        const check = await API.playerUtils.cooldown.check(msg.author, "roullete");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'roullete', 'girar a roleta')

            return;
        }

        if (!(API.townExtension.games[await API.townExtension.getTownName(msg.author)].includes('roleta'))) {
            const embedtemp = await API.sendError(msg, `A casa de jogos da sua vila não possui o jogo **ROLETA**!\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(msg.author)].join(', ')}.**`)
			await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas para aposta!`, `roleta 5`)
			await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (!API.isInt(args[0])) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas (NÚMERO) para aposta!`, `roleta 5`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let aposta = parseInt(args[0]);

        if (aposta < 5) {
            const embedtemp = await API.sendError(msg, `A quantia mínima de apostas é de 5 fichas!`, `roleta 5`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        const token = await API.eco.token.get(msg.author)

        if (token < aposta) {
            const embedtemp = await API.sendError(msg, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`${API.prefix}loja fichas\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        
        const multiplier = {
            '🍊': 1.2,
            '🍓': 1.5,
            '🍐': 3,
            '🍇': 6.5
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#4e5052')
        .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setTitle(`⭕ Roleta`)
        .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
        .setFooter(`⭕ Informações da sua aposta:\nEscolha uma fruta para apostar`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        const btn0 = API.createButton('🍊', 'SECONDARY', '', '🍊')
        const btn1 = API.createButton('🍓', 'SECONDARY', '', '🍓')
        const btn2 = API.createButton('🍐', 'SECONDARY', '', '🍐')
        const btn3 = API.createButton('🍇', 'SECONDARY', '', '🍇')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1, btn2, btn3])] });

        const filter = i => i.user.id === msg.author.id;
            
        const collector = await embedmsg.createMessageComponentInteractionCollector({ filter, time: 60000 });
        let selected;
        let reacted = false
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
            selected = b.customID;
            b.deferUpdate().catch()

            reacted = true

            let array = [];
            let rolnum = API.random(15, 20)
            let currentnum = 0;
            async function roll(){

                if (array.length == 0) {
                    for (i = 0; i < 11; i++) {
                        let random = API.random(0, 100);

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
                    let random = API.random(0, 100);

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
                
                const embed2 = new Discord.MessageEmbed()
                .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setColor('#4e5052')
                .setTitle(`⭕ Roleta`)
                .addField(`Sua aposta`, `Aposta: ${API.format(aposta)} ${API.money3} ${API.money3emoji}\nFruta: ${selected} (${multiplier[selected]}x)`, true)
                .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
                .setDescription(`**<a:loading:736625632808796250> Girando a roleta**\n${'<:rol2:742058057110126674>'.repeat(5)}<:rol2s:742058927163965620>${'<:rol2:742058057110126674>'.repeat(5)}\n${array.join('')}\n${'<:rol1:742058057051144272>'.repeat(5)}<:rol1s:742058927021359145>${'<:rol1:742058057051144272>'.repeat(5)}`)
                currentnum++;
                if (rolnum > currentnum) {
                    currentnum++;
                    setTimeout(function(){roll()}, 1550);
                } else {
                    let title
                    let emote
                    if (selected == array[5]) {
                        API.eco.addToHistory(msg.author, `Roleta | + ${API.format(Math.round(aposta*multiplier[selected])-aposta)} ${API.money3emoji}`);
                        embed2.setColor('#56fc03');title = '**✅ VOCÊ GANHOU!!**'; emote = '✅'; 
                        await API.eco.token.add(msg.author, (Math.round(aposta*multiplier[selected])-aposta));API.playerUtils.cooldown.set(msg.author, "roullete", 0);
                    }
                    else {API.eco.addToHistory(msg.author, `Roleta | - ${API.format(aposta)} ${API.money3emoji}`);embed2.setColor('#fc0324');title = '**❌ VOCÊ PERDEU!!**'; emote = '❌'; await API.eco.token.remove(msg.author, aposta);API.playerUtils.cooldown.set(msg.author, "roullete", 0);}
                    embed2.fields = [];
                    embed2.addField(`Sua aposta`, `Aposta: ${API.format(aposta)} ${API.money3} ${API.money3emoji}\nFruta: ${selected} (${multiplier[selected]}x)\n${emote} ${emote == '✅' ? `Lucro: ${(Math.round(aposta*multiplier[selected])-aposta)}`: `Prejuízo: ${aposta}`} ${API.money3} ${API.money3emoji}`, true)
                    .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
                    .setDescription(`${title}\n${'<:rol2:742058057110126674>'.repeat(5)}<:rol2s:742058927163965620>${'<:rol2:742058057110126674>'.repeat(5)}\n${array.join('')}\n${'<:rol1:742058057051144272>'.repeat(5)}<:rol1s:742058927021359145>${'<:rol1:742058057051144272>'.repeat(5)}`)
                    
                }
                embedmsg.edit({ embeds: [embed2], components: [] });
            }

            roll();

            collector.stop();
        });

        collector.on('end', async collected => {

            API.playerUtils.cooldown.set(msg.author, "roullete", 0);

            if (reacted) return

            embedmsg.edit({ embeds: [embed], components: [] });

            return;
        });

        API.playerUtils.cooldown.set(msg.author, "roullete", 60);
    
    }
};