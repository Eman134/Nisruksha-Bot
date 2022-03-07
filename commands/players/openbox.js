const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('id-caixa').setDescription('Escreva o id da caixa da sua mochila para abrir').setRequired(true))
.addIntegerOption(option => option.setName('quantia').setDescription('Escolha uma quantia de caixas para abrir').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'abrircaixa',
    aliases: ['openbox'],
    category: 'Players',
    description: 'Abre uma caixa misteriosa da sua mochila',
    data,
    mastery: 5,
	async execute(API, interaction) {

        const Discord = API.Discord;
        const client = API.client;

        const id = interaction.options.getInteger('id-caixa');
        const quantia = interaction.options.getInteger('quantia');

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "crate");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'crate', 'abrir outra caixa')

            return;
        }

        const obj = await DatabaseManager.get(interaction.user.id, 'storage');
        
        if (obj[`crate:${id}`] == null || obj[`crate:${id}`] < 1 || obj[`crate:${id}`] == undefined) {
            const embedtemp = await API.sendError(interaction, `Você não possui uma caixa com este id!\nUtilize \`/mochila\` para visualizar suas caixas`, `abrircaixa 1`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (obj[`crate:${id}`] < quantia) {
            const embedtemp = await API.sendError(interaction, `Você não possui essa quantia de caixas [${obj[`crate:${id}`]}/${quantia}]!\nUtilize \`/mochila\` para visualizar suas caixas`, `abrircaixa 1`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let boxl = interaction.options.getInteger('quantia');
        if (boxl < 1) boxl = 1
        
        if (boxl > 30) {
            const embedtemp = await API.sendError(interaction, `Você não pode abrir mais do que 30 caixas simultaneamente!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#606060')
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `📦 Você deseja abrir **${boxl}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}**?\nPara visualizar as recompensas disponíveis use \`/recompensascaixa ${id}\``)
        .setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id && ['confirm', 'cancel', 'skip'].includes(i.customId);
            
        const collector = await embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        let skipping = false
        let arraywin = [];
        let currnum = 0;
        let descartou = false

        async function editBox(reward, rewards){

            try {
                arraywin.push(reward)
                currnum++;
                
                embed.fields = [];
                embed.setColor('#5bff45');
                embed.setDescription(`${arraywin.map(rr => `<a:aberto:758105619269156864>  ⤳  ${rr.icon} ${rr.displayname ? rr.displayname : rr.name}`).join('\n')}${currnum < rewards.length ? `\n \n**<a:abrindo:758105619281870898> ${rewards.length-currnum}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}** restantes...`:`\n \n✅ Todas as caixas foram abertas (${boxl}x)`}`)
                if(API.debug) {
                    embed.addField('<:error:736274027756388353> Depuração', `\n\`\`\`js\nBoxl: ${boxl}\nRewardsLength: ${rewards.length}\nÚltimo recebido em: ${1000+(100-rewards[currnum-1].chance)*30}ms\nFinalizado em: ${Date.now()-interaction.createdTimestamp}ms\`\`\``)
                }

                try {
                    const obj = await DatabaseManager.get(interaction.user.id, 'storage');
                    DatabaseManager.set(interaction.user.id, 'storage', `"crate:${id}"`, obj[`crate:${id}`]-1);
                    API.eco.addToHistory(interaction.user.id, `${API.crateExtension.obj[id.toString()].name} | ${reward.size > 0 ? '+ ' + API.format(reward.size) + ' ':''}${reward.icon}`)
                    switch (reward.type) {
                        case 0:
                            API.eco.money.add(interaction.user.id, reward.size)
                            break;
                        case 1:
                            API.eco.token.add(interaction.user.id, reward.size)
                            break;
                        case 2:
                            API.eco.points.add(interaction.user.id, reward.size)
                            break;
                        case 3:
                            playerobj = await DatabaseManager.get(interaction.user.id, 'storage');
                            DatabaseManager.set(interaction.user.id, 'storage', `"piece:${reward.pid}"`, playerobj[`piece:${reward.pid}`] + reward.size)
                            break;
                        case 4:
                            API.eco.tp.add(interaction.user.id, reward.size)
                            break;
                        case 5:

                            const rewardname = reward.name.includes('x ') ? reward.name.split('x ')[1] : reward.name

                            if (!rewardname) {
                                console.log('TYPE 5 OPENBOX')
                                console.log(reward)
                                console.log(rewardname)
                            }
                            
                            if (!reward) {
                                console.log('TYPE 5 REWARD')
                                console.log(reward)
                            }

                            const drop = API.itemExtension.get((rewardname || reward.name))

                            if (!drop) {
                                console.log('TYPE 5 DROP')
                                console.log(drop)
                                console.log((rewardname || reward.name))
                            }

                            drop.size = (reward.size || 1)

                            let retorno = await API.itemExtension.give(interaction, [drop])

                            let descartado = retorno.descartados

                            if (descartado && descartado.length > 0) {
                                descartou = true
                            }
                            break;
                        case 6:
                            API.badges.add(interaction.user.id, reward.size)
                            break;
                        default:
                            break;
                    }
                    
                } catch (err) {
                    console.log(`Um erro na caixa ${id} foi encontrado!\nReward:`)
                    console.log(err)
                    API.client.emit('error', err)
                    interaction.channel.send({ content: 'Não foi possível entregar sua recompensa da caixa, contate algum moderador ou o criador do Nisruksha.' })
                }

                if (descartou && currnum >= rewards.length) {
                    embed.addField('❌ Oops, um problema ao abrir as caixas!', `Um ou mais itens foram descartados da sua mochila.\nVocê pode esvaziar sua mochila vendendo alguns itens com \`/venderitem\``)
                }
                
                let components = []

                if (rewards.length-currnum > 5) {
                    const skipBtn = API.createButton('skip', 'SECONDARY', 'Pular', '⏩')
                    components.push(API.rowComponents([skipBtn]))
                }

                if (!skipping || (skipping && currnum >= rewards.length)) {
                    await interaction.editReply({ embeds: [embed], components });
                }
                
                if (currnum < rewards.length) {
                    //const ltchance = (rewards[currnum].chance == undefined ? 25 : rewards[currnum].chance)
                    //let t1 = 1000+(100-ltchance)*30;
                    if (!skipping) setTimeout(function(){ editBox(rewards[currnum], rewards)} , 1500);
                    else editBox(rewards[currnum], rewards)
                } else {
                    API.playerUtils.cooldown.set(interaction.user.id, "crate", 0);
                }

            } catch (error) {
                console.log(error)
            }
                
        }

        collector.on('collect', async (b) => {

            b.deferUpdate()
            
            reacted = true;

            if (b.customId == 'skip') {
                skipping = true
                return
            }

            if (b.customId == 'cancel'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Abertura de caixa cancelada', `Você cancelou a abertura de **${boxl}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}**.\nPara visualizar as recompensas disponíveis use \`/recompensascaixa ${id}\``)
                interaction.editReply({ embeds: [embed], components: [] });
                API.playerUtils.cooldown.set(interaction.user.id, "crate", 0);
                return;
            } 

            let rewards = boxl > 1 ? API.crateExtension.getReward(id, boxl):API.crateExtension.getReward(id);
            if(API.debug) console.log(rewards)

            embed.fields = [];
            embed.setColor('#606060');
            embed.setDescription(`<a:abrindo:758105619281870898>  ⤳  Abrindo **${boxl}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}**`)
            interaction.editReply({ embeds: [embed], components: [] });

            //let t1 = 1000+(100-rewards[0].chance)*30;
            setTimeout(function(){ editBox(rewards[0], rewards) }, 1500);

        });

        collector.on('end', async collected => {
            if (reacted) return;
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria abrir **${boxl}x ${API.crateExtension.obj[id.toString()].icon} ${API.crateExtension.obj[id.toString()].name}**, porém o tempo expirou.\nPara visualizar as recompensas disponíveis use \`/recompensascaixa ${id}\``)
            interaction.editReply({ embeds: [embed], components: [] });
        });

        API.playerUtils.cooldown.set(interaction.user.id, "crate", 30);
	}
};