module.exports = {
    name: 'abrircaixa',
    aliases: ['openbox'],
    category: 'Players',
    description: 'Abre uma caixa misteriosa da sua mochila',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        const check = await API.checkCooldown(msg.author, "crate");
        if (check) {

            let cooldown = await API.getCooldown(msg.author, "crate");
            const embed = new Discord.MessageEmbed()
            .setColor('#b8312c')
            .setDescription('🕑 Aguarde mais `' + API.ms(cooldown) + '` para abrir outra caixa!')
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            msg.quote(embed);
            return;
        }

        if (args.length == 0) {
            API.sendError(msg, `Você precisa especificar um id de caixa para abrir!\nUtilize \`${API.prefix}mochila\` para visualizar suas caixas`, `abrircaixa 1`)
			return;
        }

        const obj = await API.getInfo(msg.author, 'storage');
        const id = parseInt(args[0]);
        
        
        if (!API.isInt(args[0]) || obj[`crate:${id}`] == null || obj[`crate:${id}`] < 1 || obj[`crate:${id}`] == undefined) {
            API.sendError(msg, `Você não possui uma caixa com este id!\nUtilize \`${API.prefix}mochila\` para visualizar suas caixas`, `abrircaixa 1`)
			return;
        }
        
        if (args.length == 2 && API.isInt(args[1]) && obj[`crate:${id}`] < parseInt(args[1])) {
            API.sendError(msg, `Você não possui essa quantia de caixas [${obj[`crate:${id}`]}/${parseInt(args[1])}]!\nUtilize \`${API.prefix}mochila\` para visualizar suas caixas`, `abrircaixa 1`)
            return;
        }

        let boxl = 1;
        if (args.length == 2 && API.isInt(args[1]) && parseInt(args[1]) > 1) {
            boxl = parseInt(args[1]) || 1
        }
        if (!API.isInt(args[1])) boxl = 1
        
        if (boxl > 10) {
            API.sendError(msg, `Você não pode abrir mais do que 10 caixas simultaneamente!`)
            return;
        }
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#606060')
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `📦 Você deseja abrir **${boxl}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}**?\nPara visualizar as recompensas disponíveis use \`${API.prefix}recc ${id}\``)
        .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        const embedmsg = await msg.quote(embed);
        await embedmsg.react('✅')
        embedmsg.react('❌')

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
            
        const collector = await embedmsg.createReactionCollector(filter, { time: 30000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {

            await reaction.users.remove(user.id);
            if (!(['✅', '❌'].includes(reaction.emoji.name))) return;
            
            reacted = true;
            collector.stop();

            if (reaction.emoji.name == '❌'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Abertura de caixa cancelada', `Você cancelou a abertura de **${boxl}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}**.\nPara visualizar as recompensas disponíveis use \`${API.prefix}recc ${id}\``)
                embedmsg.edit(embed);
                API.setCooldown(msg.author, "crate", 0);
                return;
            } 

            let rewards = boxl > 1 ? API.crateExtension.getReward(id, boxl):API.crateExtension.getReward(id);
            if(API.debug) console.log(rewards)

            embed.fields = [];
            embed.setColor('#606060');
            embed.setDescription(`<a:abrindo:758105619281870898>  ⤳  Abrindo **${boxl}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}**`)
            embedmsg.edit(embed);

            let arraywin = [];
            let currnum = 0;

            let descartou = false

            let t1 = 1000+(100-rewards[0].chance)*30;
            setTimeout(function(){win(rewards[0], rewards)} , t1);

            async function win(reward, rewards){
                
                arraywin.push(reward)
                currnum++;
                
                embed.fields = [];
                embed.setColor('#5bff45');
                embed.setDescription(`${arraywin.map(rr => `<a:aberto:758105619269156864>  ⤳  ${rr.icon} ${rr.displayname ? rr.displayname : rr.name}`).join('\n')}${currnum < rewards.length ? `\n \n**<a:abrindo:758105619281870898> ${rewards.length-currnum}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}** restantes...`:`\n \n✅ Todas as caixas foram abertas (${boxl}x)`}`)
                if(API.debug) {
                    embed.addField('<:error:736274027756388353> Depuração', `\n\`\`\`js\nBoxl: ${boxl}\nRewardsLength: ${rewards.length}\nÚltimo recebido em: ${1000+(100-rewards[currnum-1].chance)*30}ms\nFinalizado em: ${Date.now()-msg.createdTimestamp}ms\`\`\``)
                }

                try {
                    const obj = await API.getInfo(msg.author, 'storage');
                    API.setInfo(msg.author, 'storage', `"crate:${id}"`, obj[`crate:${id}`]-1);
                    API.eco.addToHistory(msg.member, `${API.crateExtension.obj[id.toString()].name} | ${reward.size > 0 ? '+ ' + API.format(reward.size) + ' ':''}${reward.icon}`)
                    switch (reward.type) {
                        case 0:
                            API.eco.money.add(msg.author, reward.size)
                            break;
                        case 1:
                            API.eco.token.add(msg.author, reward.size)
                            break;
                        case 2:
                            API.eco.points.add(msg.author, reward.size)
                            break;
                        case 3:
                            playerobj = await API.getInfo(msg.author, 'storage');
                            API.setInfo(msg.author, 'storage', `"piece:${reward.pid}"`, playerobj[`piece:${reward.pid}`] + reward.size)
                            break;
                        case 4:

                            break;
                        default:

                            let retorno = await API.company.jobs.giveItem(msg, [reward])

                            let descartado = retorno.descartados

                            if (descartado && descartado.length > 0) {
                                descartou = true
                            }

                            break;
                    }
                    
                } catch (err) {
                    console.log(`Um erro na caixa ${id} foi encontrado!\nReward:`)
                    console.log(array[5])
                    console.log(`\n${err}`)
                    client.emit('error', err)
                    msg.reply('Não foi possível entregar sua recompensa da caixa, contate algum moderador ou o criador do Nisruksha.')
                }

                if (descartou && currnum >= rewards.length) {
                    embed.addField('❌ Oops, um problema ao abrir as caixas!', `Um ou mais itens ganhados das caixas foram descartados da sua mochila\nIsso ocorre quando a sua mochila está lotada de tipos de itens máximo, ou seja, 10/10.\nVocê pode esvaziar sua mochila vendendo alguns itens com \`${API.prefix}venderitem\``)
                }

                embedmsg.edit(embed);
                
                if (currnum < rewards.length) {

                    const ltchance = (rewards[currnum].chance == undefined ? 25 : rewards[currnum].chance)
                    

                    let t1 = 1000+(100-ltchance)*30;
                    setTimeout(function(){win(rewards[currnum], rewards)} , t1);
                } else {
                    API.setCooldown(msg.author, "crate", 0);
                }

            }
        });

        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
            if (reacted) return;
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria abrir **${boxl}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}**, porém o tempo expirou.\nPara visualizar as recompensas disponíveis use \`${API.prefix}recc ${id}\``)
            embedmsg.edit(embed);
        });

        API.setCooldown(msg.author, "crate", 30);
	}
};