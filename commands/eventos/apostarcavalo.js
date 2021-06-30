module.exports = {
    name: 'apostarcavalo',
    aliases: [],
    category: 'none',
    description: 'none',
    options: [],
    mastery: 30,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;

        let total = 0;

        async function checkAll() {

            if(!API.events.race.rodando) {
                const embedtemp = await API.sendError(msg, 'Não possui nenhuma **Corrida de Cavalos** ativa no momento!\nEm nosso servidor oficial você pode ser notificado quando há eventos! (`'+ API.prefix + 'convite`)')
                await msg.quote({ embeds: [embedtemp]})
                return true
            }

            const args = API.args(msg);

            if (args.length == 0) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro para aposta!`, `apostarcavalo <quantia | tudo>`)
                await msg.quote({ embeds: [embedtemp]})
                return true
            }
            const money = await API.eco.money.get(msg.author)
            
            if (args[0] != 'tudo') {

                if (!API.isInt(API.toNumber(args[0]))) {
                    const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para depósito!`, `apostarcavalo <quantia | tudo>`)
                    await msg.quote({ embeds: [embedtemp]})
                    return true
                }

                if (money < API.toNumber(args[0])) {
                    const embedtemp = await API.sendError(msg, `Você não possui essa quantia de dinheiro para apostar!`)
                    await msg.quote({ embeds: [embedtemp]})
                    return true
                }

                if (API.toNumber(args[0]) < 1) {
                    const embedtemp = await API.sendError(msg, `Você não pode apostar essa quantia de dinheiro!`)
                    await msg.quote({ embeds: [embedtemp]})
                    return true
                }
                total = API.toNumber(args[0]);
            } else {
                if (money < 1) {
                    const embedtemp = await API.sendError(msg, `Você não possui dinheiro para apostar!`)
                    await msg.quote({ embeds: [embedtemp]})
                    return true
                }
                total = money;
            }

            if (total < 1000) {
                const embedtemp = await API.sendError(msg, `O mínimo para apostar em cavalos é de \`1000 ${API.money}\` ${API.moneyemoji}`)
                await msg.quote({ embeds: [embedtemp]})
                return true
            }
            if (total > 2000000) {
                const embedtemp = await API.sendError(msg, `O máximo para apostar em cavalos é de \`${API.format(2000000)} ${API.money}\` ${API.moneyemoji}`)
                await msg.quote({ embeds: [embedtemp]})
                return true
            }

            return false
        }

        const checkin = await checkAll()

        if (checkin) return
        
		const embed = API.events.getRaceEmbed(total)
        const embedmsg = await msg.quote({ embeds: [embed] });
        
        await embedmsg.react('🟧')
        await embedmsg.react('🟥')
        await embedmsg.react('🟪')

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector({ filter, time: 20000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
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

            const globalevents = await API.getGlobalInfo("events")

            API.eco.money.remove(msg.author, total)
            API.eco.money.globaladd(total)
            API.eco.addToHistory(user, `Aposta 🏇${reaction.emoji.name} | - ${API.format(total)} ${API.moneyemoji}`)

            API.events.race.apostas[apostastring].push({ id: msg.author.id, aposta: total })

            if (globalevents == null) {
                API.setGlobalInfo("events", {
                    "race": API.events.race
                })
            } else {
                API.setGlobalInfo("events", {
                    ...globalevents,
                    "race": API.events.race
                })
            }

            const embed = API.events.getRaceEmbed(total)

            embed.setColor('#5bff45');
            embed.addField('✅ Aposta realizada', `
            Você fez uma aposta de \`${API.format(total)} ${API.money}\` ${API.moneyemoji} no cavalo **🏇${reaction.emoji.name}**!\nO resultado final da corrida sairá em **${API.ms2(API.events.race.time-(Date.now()-API.events.race.started))}** e se ganhar o valor será creditado automaticamente em seu banco!`)
            embedmsg.edit({ embeds: [embed] });

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
            if (reacted) return;
            const embed = API.events.getRaceEmbed(total)
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria realizar uma aposta na corrida de cavalos, porém o tempo expirou.`)
            embedmsg.edit({ embeds: [embed] });
            return;
        });

	}
};