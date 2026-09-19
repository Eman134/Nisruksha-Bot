const Discord = require('discord.js');
const machinesService = require('../../_classes/services/machines');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const itemsService = require('../../_classes/services/items');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja o armazém de algum membro'))

const v2Flags = Discord.MessageFlags.IsComponentsV2;

function textContainer(content, color) {
    return new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

function errorContainer(interaction, message) {
    return textContainer(`${interaction.user.tag}\n<:error:736274027756388353> ${message}`, 0xb8312c);
}

function storageContainer({ color, title, fields, footer, buttons }) {
    const content = [`**${title}**`, ...fields.map(({ name, value }) => `**${name}**\n${value}`), footer].filter(Boolean).join('\n\n');
    const container = textContainer(content, color);
    if (buttons) container.addActionRowComponents(new ActionRowBuilder().addComponents(...buttons));
    return container;
}

const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'armazém',
    aliases: ['armazem', 'ar', 'estoque', 'recursos', 'storage'],
    category: 'Maquinas',
    description: 'Visualiza seu estoque de recursos completo',
    data,
    mastery: 20,
	async execute(interaction) {
        
        let member = interaction.options.getUser('membro');
        if (!member) member = interaction.user

        let size = await machinesService.storage.getSize(member.id);
        let max = await machinesService.storage.getMax(member.id);
        let price = await machinesService.storage.getPrice(member.id);
        const user_id = BigInt(member.id)
        let obj = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
        let lvl = obj.storage;
        
        const storageInfo = `Peso atual: **[${utility.format(size)}/${utility.format(max)}]g**\nNível do armazém: **${utility.format(lvl)}**\nPreço do aprimoramento: **${utility.format(price)} ${utility.moneyemoji}**`;
        const initialFields = [{ name: '<:storageinfo:738427915531845692> Informações', value: storageInfo }];
        if (member == interaction.user) initialFields.push({ name: '<:waiting:739967127502454916> Aguardando resposta', value: 'Aprimorar o armazém [<:upgrade:738434840457642054>]\nVisualizar recursos da sua máquina [<:recursos:738429524416528554>]' });

        if (member != interaction.user) return await interaction.reply({ components: [storageContainer({ color: 0x5634eb, title: 'Armazém de ' + member.username, fields: initialFields })], flags: v2Flags });

        const btn0 = utility.createButton('upgrade', 'SECONDARY', 'Upgrade', '738434840457642054')
        const btn1 = utility.createButton('recursos', 'SECONDARY', 'Recursos', '738429524416528554')

        const initialContainer = storageContainer({ color: 0x5634eb, title: 'Armazém de ' + member.username, fields: initialFields, buttons: [btn0, btn1] });
        let embedinteraction = (await interaction.reply({ components: [initialContainer], flags: v2Flags, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 20000 });

        let reacted
        let r1 = 1;
        let err = false;
        let pago = 0;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            size = await machinesService.storage.getSize(member.id);
            max = await machinesService.storage.getMax(member.id);
            money = await economyService.money.get(interaction.user.id);
            price = await machinesService.storage.getPrice(member.id)

            reacted = true;
            collector.stop()
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.armazenamento.defer_update'); });
                
            if (b.customId == 'upgrade'){
                if (price > await economyService.money.get(interaction.user.id)) {
                    var resultContainer = storageContainer({ color: 0xa60000, title: 'Armazém de ' + member.username, fields: [{ name: '❌ Aprimoramento mal sucedido!', value: `Você não possui dinheiro suficiente para realizar este aprimoramento!\nSeu dinheiro atual: **${utility.format(await economyService.money.get(interaction.user.id))}/${utility.format(await machinesService.storage.getPrice(member.id))} ${utility.money} ${utility.moneyemoji}**` }] });
                    err = true;
                } else {
                    pago += price;
                    await prisma.storage.update({ where: { user_id }, data: { storage: lvl+r1 } })
                    let obj55 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
                    let lvl55 = obj55.storage;
                    resultContainer = storageContainer({ color: 0x5bff45, title: 'Armazém de ' + member.username, fields: [{ name: '<:upgrade:738434840457642054> Aprimoramento realizado com sucesso!', value: `Peso máximo: **${utility.format(max)}g (+${r1*machinesService.storage.sizeperlevel})**\nNível do armazém: **${utility.format(lvl55)} (+${r1})**\nPreço pago: **${utility.format(pago)} ${utility.money} ${utility.moneyemoji}**\nPreço do próximo aprimoramento: **${utility.format(await machinesService.storage.getPrice(member.id, undefined, max+(r1*machinesService.storage.sizeperlevel)))} ${utility.money} ${utility.moneyemoji}**` }] });
                    economyService.money.remove(interaction.user.id, price)
                    economyService.addToHistory(interaction.user.id, `Aprimoramento Armazém | - ${utility.format(price)} ${utility.moneyemoji}`)
                    ap = true;
                }

            } else if (b.customId == 'recursos'){
                    let obj55 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
                let lvl55 = obj55.storage;
                let obj = await itemsService.getObj();
                const obj2 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
                const resourceFields = [{ name: '<:storageinfo:738427915531845692> Informações', value: `Peso atual: **[${utility.format(await machinesService.storage.getSize(member.id))}/${utility.format(max+(r1*machinesService.storage.sizeperlevel)-machinesService.storage.sizeperlevel)}]g**\nNível do armazém: **${utility.format(lvl55)}**` }];
                let total = 0;
                for (const r of obj['minerios']) {
                    if (obj2[r.name] > 0) {
                        resourceFields.push({ name: `${r.icon} ${r.name.charAt(0).toUpperCase() + r.name.slice(1)} | ${utility.format(Math.round(obj2[r.name]*r.price.atual))} ${utility.moneyemoji}`, value: `\`\`\`autohotkey\n${obj2[r.name] > 1000 ? (obj2[r.name]/1000).toFixed(1) + 'kg' : obj2[r.name] + 'g'}\`\`\`` });
                        total += obj2[r.name]*r.price.atual;
                    }
                }
                if (await machinesService.storage.getSize(member.id) == 0) {
                    resultContainer = storageContainer({ color: 0xa60000, title: 'Armazém de ' + member.username, fields: [...resourceFields, { name: '❌ Ação mal sucedida!', value: 'Seu armazém não possui recursos!' }] });
                } else resultContainer = storageContainer({ color: 0x5634eb, title: 'Armazém de ' + member.username, fields: resourceFields, footer: '💰 Seus recursos valem ' + utility.format(Math.round(total)) + ' ' + utility.money });
            }

            if (!resultContainer) resultContainer = initialContainer;
            interaction.editReply({ components: [resultContainer], flags: v2Flags });

        });
        
        collector.on('end', collected => {

            if (reacted) return
            interaction.editReply({ components: [storageContainer({ color: 0x5634eb, title: 'Armazém de ' + member.username, fields: [
                { name: '<:storageinfo:738427915531845692> Informações', value: storageInfo },
                { name: '❌ Sessão encerrada', value: 'O tempo de reação foi expirado!' }
            ] })], flags: v2Flags });

        });

	}
};
