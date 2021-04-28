module.exports = {
    name: 'roleta',
    aliases: ['roullete'],
    category: 'Jogos',
    description: 'Aposte em frutas e multiplique sua aposta',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        const check = await API.playerUtils.cooldown.check(msg.author, "roullete");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'roullete', 'girar a roleta')

            return;
        }

        if (!(API.townExtension.games[await API.townExtension.getTownName(msg.author)].includes('roleta'))) {
            API.sendError(msg, `A casa de jogos da sua vila não possui o jogo **ROLETA**!\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(msg.author)].join(', ')}.**`)
			return;
        }

        if (args.length == 0) {
            API.sendError(msg, `Você precisa especificar uma quantia de fichas para aposta!`, `roleta 5`)
			return;
        }

        if (!API.isInt(args[0])) {
            API.sendError(msg, `Você precisa especificar uma quantia de fichas (NÚMERO) para aposta!`, `roleta 5`)
            return;
        }

        let aposta = parseInt(args[0]);

        if (aposta < 5) {
            API.sendError(msg, `A quantia mínima de apostas é de 5 fichas!`, `roleta 5`)
            return;
        }

        const token = await API.eco.token.get(msg.author)

        if (token < aposta) {
            API.sendError(msg, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`${API.prefix}loja fichas\``)
            return;
        }
        
        const emojis = ['🍊', '🍓', '🍐', '🍇', '🔁']
        const emojisfruits = ['🍊', '🍓', '🍐', '🍇']
        const multiplier = {
            '🍊': 1.2,
            '🍓': 1.5,
            '🍐': 3,
            '🍇': 10
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#4e5052')
        .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setTitle(`⭕ Roleta`)
        .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
        .setFooter(`⭕ Informações da sua aposta:\nEscolha uma fruta para apostar`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        let msgembed = await msg.quote(embed);
        await msgembed.react('🍊')
        await msgembed.react('🍓')
        await msgembed.react('🍐')
        msgembed.react('🍇')
    
        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
            
        const collector = await msgembed.createReactionCollector(filter, { time: 60000 });
        let selected;
        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(emojis.includes(reaction.emoji.name))) return;
            if (emojisfruits.includes(reaction.emoji.name)) selected = reaction.emoji.name;
            else return;
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
                    if (selected == array[5]) {API.eco.addToHistory(msg.member, `Roleta | + ${API.format(Math.round(aposta*multiplier[selected])-aposta)} ${API.money3emoji}`);embed2.setColor('#56fc03');title = '**✅ VOCÊ GANHOU!!**'; emote = '✅'; await API.eco.token.add(msg.author, (Math.round(aposta*multiplier[selected])-aposta));API.playerUtils.cooldown.set(msg.author, "roullete", 0);}
                    else {API.eco.addToHistory(msg.member, `Roleta | - ${API.format(aposta)} ${API.money3emoji}`);embed2.setColor('#fc0324');title = '**❌ VOCÊ PERDEU!!**'; emote = '❌'; await API.eco.token.remove(msg.author, aposta);API.playerUtils.cooldown.set(msg.author, "roullete", 0);}
                    embed2.fields = [];
                    embed2.addField(`Sua aposta`, `Aposta: ${API.format(aposta)} ${API.money3} ${API.money3emoji}\nFruta: ${selected} (${multiplier[selected]}x)\n${emote} ${emote == '✅' ? `Lucro: ${(Math.round(aposta*multiplier[selected])-aposta)}`: `Prejuízo: ${aposta}`} ${API.money3} ${API.money3emoji}`, true)
                    .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
                    .setDescription(`${title}\n${'<:rol2:742058057110126674>'.repeat(5)}<:rol2s:742058927163965620>${'<:rol2:742058057110126674>'.repeat(5)}\n${array.join('')}\n${'<:rol1:742058057051144272>'.repeat(5)}<:rol1s:742058927021359145>${'<:rol1:742058057051144272>'.repeat(5)}`)
                    
                }
                msgembed.edit(embed2);
            }

            roll();

            collector.stop();
        });
            
        collector.on('end', async collected => {
            msgembed.reactions.removeAll();
        });
        API.playerUtils.cooldown.set(msg.author, "roullete", 60);
    
    }
};