const Discord = require('discord.js');
const itemsService = require('../../_classes/services/items');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const playersService = require('../../_classes/services/players');
const machinesService = require('../../_classes/services/machines');
const shopService = require('../../_classes/services/shop');
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('item').setDescription('Escreva o nome do item que você deseja usar').setRequired(true))

const prisma = require('../../_classes/prisma');
const errorContainer = (interaction, message) => new ContainerBuilder()
    .setAccentColor(0xb8312c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> ${message}`));

module.exports = {
    name: 'usaritem',
    aliases: ['useitem', 'uitem', 'usari'],
    category: 'Players',
    description: 'Faz o uso de um item usável da sua mochila',
    data,
    mastery: 10,
	async execute(interaction) {

        
        let id = interaction.options.getString('item');
        
        if (!await itemsService.exists(id, 'drops')) {
            await interaction.reply({ components: [errorContainer(interaction, `Você precisa identificar um item EXISTENTE para uso!\nVerifique os itens disponíveis utilizando \`/mochila\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
        const drop = await itemsService.get(id)
        id = id.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        
        if (!drop.usavel) {
            await interaction.reply({ components: [errorContainer(interaction, `O item ${drop.icon} \`${drop.displayname}\` não é usável!\nDica: Os itens usáveis possuem um sufixo '💫' em seu nome na mochila.`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
        const user_id = BigInt(interaction.user.id)
        const obj2 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
        if (obj2[drop.name.replace(/"/g, '')] <= 0) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para usar!`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        const check = await playersService.cooldown.check(interaction.user.id, "usaritem");
        if (check) {

            playersService.cooldown.message(interaction, 'usaritem', 'usar itens novamente')

            return;
        }

        playersService.cooldown.set(interaction.user.id, "usaritem", 15);

        const quantia = 1
        
        let itemColor = 0x606060;
        let itemFields = [['<a:loading:736625632808796250> Aguardando confirmação', `Você deseja utilizar o item **${drop.icon} ${drop.displayname}** da sua mochila?\nDescrição do item: \`${drop.desc}\``]];
        const buildItemContainer = () => {
            const container = new ContainerBuilder().setAccentColor(itemColor).addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${interaction.user.tag}`));
            for (const [name, value] of itemFields) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${name}**\n${value}`));
            return container;
        };
        
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ components: [buildItemContainer(), new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async(b) => {

            reacted = true;
            collector.stop();
            b.deferUpdate()

            const obj2 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                itemColor = 0xa60000;
                itemFields = [['❌ Uso cancelado', `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para usar!`]];
                interaction.editReply({ components: [buildItemContainer()], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            if (b.customId == 'cancel'){
                itemColor = 0xa60000;
                itemFields = [['❌ Uso cancelado', `Você cancelou o uso de **${drop.icon} ${drop.displayname}**.\nDescrição do item: \`${drop.desc}\``]];
                interaction.editReply({ components: [buildItemContainer()], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            function sucessEmbed() {
                itemColor = 0x5bff45;
                itemFields = [['✅ Item usado', `Você usou **${drop.icon} ${drop.displayname}**\nDescrição do item: \`${drop.desc}\``]];
                interaction.editReply({ components: [buildItemContainer()], flags: Discord.MessageFlags.IsComponentsV2 });
            }

            switch (drop.type) {
                case 1:

                    const isFull = await machinesService.storage.isFull(interaction.user.id);

                    if (isFull) {
                        itemColor = 0xa60000;
                        itemFields = [['❌ Uso cancelado', `Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize \`/armazém\` para visualizar seus recursos\nUtilize \`/vender\` para vender os recursos`]];
                        interaction.editReply({ components: [buildItemContainer()], flags: Discord.MessageFlags.IsComponentsV2 });
                        return
                    }

                    let miningDescription = '';
                    let miningFields = [];
                    const buildMiningContainer = () => {
                        const container = new ContainerBuilder().setAccentColor(0x2ed1ce)
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${drop.icon} ${drop.displayname}`));
                        if (miningDescription) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(miningDescription));
                        for (const [name, value] of miningFields) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${name}**\n${value}`));
                        return container;
                    };
                    
                    let totalcoletado = 0;
                    let coletadox = new Map();

                    async function edit() {

                        try{

                            let profundidade = await machinesService.getDepth(interaction.user.id)

                            let playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
                            let maqid = playerobj.machine;
                            const maq1 = await shopService.getProduct(maqid);
                            const maq = utility.clone(maq1);
                            
                            maq.tier = drop.tier+2
                        
                            const obj2 = await machinesService.ores.gen(maq, profundidade*drop.tier*5, []);

                            let sizeMap = new Map();

                            let round = 0;
                            let xp = utility.random(15, 35)*drop.tier;
                            xp = await playersService.execExp(interaction, xp);

                            for (const r of obj2) {
            
                                const ore = r.oreobj
            
                                let size = ore.size*drop.tier;
                
                                let arMax = await machinesService.storage.getMax(interaction.user.id);
                
                                if (await machinesService.storage.getSize(interaction.user.id)+size >= arMax) {
                                    size -= (await machinesService.storage.getSize(interaction.user.id)+size-arMax)
                                }
                                totalcoletado += size;
                                if (coletadox.has(ore.name)) coletadox.set(ore.name, coletadox.get(ore.name)+size)
                                else coletadox.set(ore.name, size)
                                sizeMap.set(ore.name, size)
                                await itemsService.add(interaction.user.id, ore.name, size)
                                round += size;
                
                                if (await machinesService.storage.getSize(interaction.user.id)+size >= arMax) break;
                                    
                            }
                            
                            let armazemmax2 = await machinesService.storage.getMax(interaction.user.id);
                            miningFields = [];
                            const obj6 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
                            const arsize = await machinesService.storage.getSize(interaction.user.id);

                            miningDescription = `Minerador: ${interaction.user}`;
                            miningFields.push([`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${arsize}/${armazemmax2}]g\nTotal coletado: ${totalcoletado}g\nColetado neste update: ${round}g`]);
                            miningFields.push([`💥 Informações de explosão`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nTier da dinamite: ${drop.tier}`]);

                            for await (const r of obj2) {

                                const ore = r.oreobj

                                let qnt = sizeMap.get(ore.name);
                                if (qnt == undefined) qnt = 0;
                                if (qnt < 1) qnt = 0;

                                miningFields.push([`${ore.icon} ${ore.name.charAt(0).toUpperCase() + ore.name.slice(1)} +${qnt}g`, `\`\`\`autohotkey\nColetado: ${coletadox.get(ore.name) == undefined ? '0':coletadox.get(ore.name)}g\`\`\``])
                            }

                            try{
                                await interaction.editReply({ components: [buildMiningContainer()], flags: Discord.MessageFlags.IsComponentsV2 })
                            } catch (error) {
                                reportError(error, 'command.usaritem.edit_reply', { userId: interaction.user.id });
                                return
                            }
                        }catch (err){
                            clientService.current.emit('error', err)
                        }
                    }

                    await edit()

                    break;

                case 2:
                    await playersService.stamina.add(interaction.user.id, drop.value);
                    sucessEmbed()
                    break;

                case 3:
                    await playersService.execExp(interaction, drop.value, true);
                    sucessEmbed()
                    break;

                default:
                    embedinteraction.delete()
                    interaction.reply({ components: [new TextDisplayBuilder().setContent('Ocorreu um erro ao utilizar o item, contate algum moderador do bot.')], flags: Discord.MessageFlags.IsComponentsV2 })

            }
            await itemsService.add(interaction.user.id, drop.name, -quantia)

        });
        
        collector.on('end', async collected => {
            await playersService.cooldown.set(interaction.user.id, "usaritem", 0);
            if (reacted) return
            itemColor = 0xa60000;
            itemFields = [['❌ Tempo expirado', `Você iria usar **${drop.icon} ${drop.displayname}**, porém o tempo expirou!\nDescrição do item: \`${drop.desc}\``]];
            interaction.editReply({ components: [buildItemContainer()], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
