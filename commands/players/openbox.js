const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const crateExtensionService = require('../../_classes/services/crateExtension');
const runtime = require('../../_classes/services/runtime');
const economyService = require('../../_classes/services/economy');
const itemsService = require('../../_classes/services/items');
const badgesService = require('../../_classes/services/badges');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('id-caixa').setDescription('Escreva o id da caixa da sua mochila para abrir').setRequired(true))
.addIntegerOption(option => option.setName('quantia').setDescription('Escolha uma quantia de caixas para abrir').setRequired(true))

const prisma = require('../../_classes/prisma');
const errorContainer = (interaction, message, usage) => new ContainerBuilder()
    .setAccentColor(0xb8312c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`));

module.exports = {
    name: 'abrircaixa',
    aliases: ['openbox'],
    category: 'Players',
    description: 'Abre uma caixa misteriosa da sua mochila',
    data,
    mastery: 5,
	async execute(interaction) {

                
        const id = interaction.options.getInteger('id-caixa');
        const quantia = interaction.options.getInteger('quantia');
        const crate = await crateExtensionService.getCrate(id);
        if (!crate) return;

        const check = await playersService.cooldown.check(interaction.user.id, "crate");
        if (check) {

            playersService.cooldown.message(interaction, 'crate', 'abrir outra caixa')

            return;
        }

        const user_id = BigInt(interaction.user.id)
        const obj = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
        
        const crateField = `crate_${id}`;
        if (obj[crateField] == null || obj[crateField] < 1 || obj[crateField] == undefined) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui uma caixa com este id!\nUtilize \`/mochila\` para visualizar suas caixas`, 'abrircaixa 1')], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
        if (obj[crateField] < quantia) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui essa quantia de caixas [${obj[crateField]}/${quantia}]!\nUtilize \`/mochila\` para visualizar suas caixas`, 'abrircaixa 1')], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        let boxl = interaction.options.getInteger('quantia');
        if (boxl < 1) boxl = 1
        
        if (boxl > 30) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não pode abrir mais do que 30 caixas simultaneamente!`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
        let boxColor = 0x606060;
        let boxDescription = '';
        let boxFields = [['<a:loading:736625632808796250> Aguardando confirmação', `📦 Você deseja abrir **${boxl}x ${crate.icon} ${crate.name}**?\nPara visualizar as recompensas disponíveis use \`/recompensascaixa ${id}\``]];
        const buildBoxContainer = () => {
            const container = new ContainerBuilder().setAccentColor(boxColor).addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${interaction.user.tag}`));
            if (boxDescription) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(boxDescription));
            for (const [name, value] of boxFields) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${name}**\n${value}`));
            return container;
        };
        
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ components: [buildBoxContainer(), new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

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
                
                boxFields = [];
                boxColor = 0x5bff45;
                boxDescription = `${arraywin.map(rr => `<a:aberto:758105619269156864>  ⤳  ${rr.icon} ${rr.displayname ? rr.displayname : rr.name}`).join('\n')}${currnum < rewards.length ? `\n \n**<a:abrindo:758105619281870898> ${rewards.length-currnum}x ${crate.icon} ${crate.name}** restantes...`:`\n \n✅ Todas as caixas foram abertas (${boxl}x)`}`
                if(runtime.debug) {
                    boxFields.push(['<:error:736274027756388353> Depuração', `\n\`\`\`js\nBoxl: ${boxl}\nRewardsLength: ${rewards.length}\nÚltimo recebido em: ${1000+(100-rewards[currnum-1].chance)*30}ms\nFinalizado em: ${Date.now()-interaction.createdTimestamp}ms\`\`\``])
                }

                try {
                    const obj = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
                    const crateField = `crate_${id}`;
                    await prisma.storage.update({ where: { user_id }, data: { [crateField]: obj[crateField]-1 } });
                    await economyService.addToHistory(interaction.user.id, `${crate.name} | ${reward.size > 0 ? '+ ' + utility.format(reward.size) + ' ':''}${reward.icon}`)
                    switch (reward.type) {
                        case 0:
                            await economyService.money.add(interaction.user.id, reward.size)
                            break;
                        case 1:
                            await economyService.token.add(interaction.user.id, reward.size)
                            break;
                        case 2:
                            await economyService.points.add(interaction.user.id, reward.size)
                            break;
                        case 3:
                            playerobj = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
                            const pieceField = `piece_${reward.pid}`;
                            await prisma.storage.update({ where: { user_id }, data: { [pieceField]: playerobj[pieceField] + reward.size } })
                            break;
                        case 4:
                            await economyService.tp.add(interaction.user.id, reward.size)
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

                            const drop = await itemsService.get((rewardname || reward.name))

                             if (!drop) throw new Error(`Recompensa de item não encontrada: ${rewardname || reward.name}`);

                            drop.size = (reward.size || 1)

                            let retorno = await itemsService.give(interaction, [drop])

                            let descartado = retorno.descartados

                            if (descartado && descartado.length > 0) {
                                descartou = true
                            }
                            break;
                        case 6:
                            await badgesService.add(interaction.user.id, reward.size)
                            break;
                        default:
                            break;
                    }
                    
                } catch (err) {
                    clientService.current.emit('error', err)
                    interaction.channel.send({ components: [new TextDisplayBuilder().setContent('Não foi possível entregar sua recompensa da caixa, contate algum moderador ou o criador do Nisruksha.')], flags: Discord.MessageFlags.IsComponentsV2 })
                }

                if (descartou && currnum >= rewards.length) {
                    boxFields.push(['❌ Oops, um problema ao abrir as caixas!', `Um ou mais itens foram descartados da sua mochila.\nVocê pode esvaziar sua mochila vendendo alguns itens com \`/venderitem\``])
                }
                
                let components = []

                if (rewards.length-currnum > 5) {
                    const skipBtn = utility.createButton('skip', 'SECONDARY', 'Pular', '⏩')
                    components.push(new ActionRowBuilder().addComponents(skipBtn))
                }

                if (!skipping || (skipping && currnum >= rewards.length)) {
                    await interaction.editReply({ components: [buildBoxContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2 });
                }
                
                if (currnum < rewards.length) {
                    //const ltchance = (rewards[currnum].chance == undefined ? 25 : rewards[currnum].chance)
                    //let t1 = 1000+(100-ltchance)*30;
                    if (!skipping) setTimeout(function(){ editBox(rewards[currnum], rewards)} , 1500);
                    else editBox(rewards[currnum], rewards)
                } else {
                    await playersService.cooldown.set(interaction.user.id, "crate", 0);
                }

            } catch (error) {
                reportError(error, 'command.openbox.execute', { userId: interaction.user?.id });
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
                boxFields = [['❌ Abertura de caixa cancelada', `Você cancelou a abertura de **${boxl}x ${crate.icon} ${crate.name}**.\nPara visualizar as recompensas disponíveis use \`/recompensascaixa ${id}\``]];
                boxDescription = '';
                boxColor = 0xa60000;
                interaction.editReply({ components: [buildBoxContainer()], flags: Discord.MessageFlags.IsComponentsV2 });
                playersService.cooldown.set(interaction.user.id, "crate", 0);
                return;
            } 

            let rewards = await crateExtensionService.getReward(id, boxl);
            if(runtime.debug) console.log(rewards)

            boxFields = [];
            boxColor = 0x606060;
            boxDescription = `<a:abrindo:758105619281870898>  ⤳  Abrindo **${boxl}x ${crate.icon} ${crate.name}**`;
            interaction.editReply({ components: [buildBoxContainer()], flags: Discord.MessageFlags.IsComponentsV2 });

            //let t1 = 1000+(100-rewards[0].chance)*30;
            setTimeout(function(){ editBox(rewards[0], rewards) }, 1500);

        });

        collector.on('end', async collected => {
            if (reacted) return;
            boxFields = [['❌ Tempo expirado', `Você iria abrir **${boxl}x ${crate.icon} ${crate.name}**, porém o tempo expirou.\nPara visualizar as recompensas disponíveis use \`/recompensascaixa ${id}\``]];
            boxDescription = '';
            boxColor = 0xa60000;
            interaction.editReply({ components: [buildBoxContainer()], flags: Discord.MessageFlags.IsComponentsV2 });
        });

        playersService.cooldown.set(interaction.user.id, "crate", 30);
	}
};
