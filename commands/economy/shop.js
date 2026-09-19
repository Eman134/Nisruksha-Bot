const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const shopService = require('../../_classes/services/shop');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('categoria').setDescription('Digite uma categoria de loja para visualizar os produtos')
.addChoices({ name: 'MAQUINAS', value: 'MAQUINAS' })
.addChoices({ name: 'FICHAS', value: 'FICHAS' })
.addChoices({ name: 'CHIPES', value: 'CHIPES' })
.addChoices({ name: 'TEMPORAL', value: 'TEMPORAL' })
.addChoices({ name: 'MOCHILAS', value: 'MOCHILAS' })
.setRequired(false))

function buildContainer(interaction, { title, description, fields = [], color = '#bf772a' }) {
    return new ContainerBuilder()
        .setAccentColor(parseInt(color.slice(1), 16))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent([
            `**${interaction.user.tag}**`,
            title ? `## ${title}` : '',
            description || '',
            ...fields.map(({ name, value }) => `**${name}**\n${value}`)
        ].filter(Boolean).join('\n\n')));
}

function buildError(interaction, message, usage) {
    return buildContainer(interaction, {
        color: '#b8312c',
        fields: [{ name: '<:error:736274027756388353>', value: `${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}` }]
    });
}

function buildPage(interaction, categoria, product, currentpage, totalpages) {
    const start = (currentpage - 1) * 3;
    const fields = product.slice(start, start + 3).map((p) => {
        let value = `Preço: ${p.price > 0 ? `\`${utility.format(p.price)} ${utility.money}\` ${utility.moneyemoji}` : ''}${p.price2 ? ` e \`${p.price2} ${utility.money2}\` ${utility.money2emoji}` : ''}${p.price3 ? `\`${p.price3} ${utility.tp.name}\` ${utility.tp.emoji}` : ''}`;
        if (p.buyable) value += `\nUtilize /comprar ${p.id}`;
        if (p.token) value += `\nQuantia: ${p.token} fichas`;
        if (p.info) value += `\n${p.info}`;
        return { name: `${p.icon || ''} ${p.name} ┆ ID: ${p.id}`, value };
    });
    if (product.length === 0) fields.push({ name: '❌ Oops, um problema inesperado ocorreu', value: 'Esta categoria não possui produtos ainda!' });
    return buildContainer(interaction, {
        title: `${categoria.toUpperCase()} ${currentpage}/${totalpages}`,
        description: 'Utilize `/comprar <id>` para realizar uma compra',
        fields
    });
}

function buildPageComponents(utility, product, currentpage, totalpages) {
    const buttons = [
        utility.createButton('backward', 'PRIMARY', '', '852241487064596540', currentpage === 1),
        utility.createButton('stop', 'SECONDARY', '', '🔴'),
        utility.createButton('forward', 'PRIMARY', '', '737370913204600853', currentpage === totalpages)
    ];
    for (const p of product.slice((currentpage - 1) * 3, currentpage * 3)) {
        buttons.push(utility.createButton(p.id.toString(), 'SECONDARY', p.id.toString(), p.icon?.split(':')[2]?.replace('>', '') || p.icon, !p.buyable));
    }
    const rows = [];
    for (let i = 0; i < buttons.length; i += 3) rows.push(new ActionRowBuilder().addComponents(...buttons.slice(i, i + 3)));
    return rows;
}

module.exports = {
    name: 'loja',
    aliases: ['shop', 'l'],
    category: 'Economia',
    description: 'Veja os produtos disponíveis para venda',
    data,
    mastery: 10,
	async execute(interaction) {

                const optioncategoria = interaction.options.getString('categoria')
        if (optioncategoria == null) {
            const container = buildContainer(interaction, {
                color: '#811e99',
                description: `
            <:shop:736274027919966269> Veja abaixo produtos das categorias e divirta-se!
            ↳ Utilize \`/loja <categoria>\` para visualizar uma categoria
            ↳ Utilize \`/comprar <id>\` para realizar uma compra
            `,
                fields: [{ name: '<:list:736274028179750922> Categorias', value: await shopService.getShopList() }]
            });
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        }
        const categoria = optioncategoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (categoria == 'maq') {
            categoria = 'maquinas';
        }
        let obj = await shopService.getShopObj();
        let array = Object.keys(obj);
        if (!await shopService.categoryExists(categoria)){
            await interaction.reply({ components: [buildError(interaction, 'Você selecionou uma categoria inexistente!', `loja <${array.join(' | ').toUpperCase()}>`)], flags: Discord.MessageFlags.IsComponentsV2 })
			return;
        }
        var product = obj[categoria];
        product = product.filter((item) => item.buyable)
        let array2 = Object.keys(product);
        let totalpages = array2.length % 3;
        if (totalpages == 0) totalpages = (array2.length)/3;
        else totalpages = ((array2.length-totalpages)/3)+1;

        let currentpage = 1;

        if (totalpages == 0) currentpage = 0

        const stopComponents = currentpage === totalpages || totalpages === 0;
        let container = buildPage(interaction, categoria, product, currentpage, totalpages);
        let components = stopComponents ? [] : buildPageComponents(utility, product, currentpage, totalpages);
        const embedinteraction = (await interaction.reply({ components: [container, ...components], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        if (stopComponents) return;

        const collector = embedinteraction.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 30000 });
        let stopped = false;
        collector.on('collect', async (b) => {
            if (!b.deferred) b.deferUpdate().catch(() => {});
            if (b.customId === 'forward' && currentpage < totalpages) currentpage++;
            if (b.customId === 'backward' && currentpage > 1) currentpage--;
            if (b.customId === 'stop') {
                stopped = true;
                collector.stop();
                await interaction.editReply({ components: [buildPage(interaction, categoria, product, currentpage, totalpages)], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            const selected = await shopService.getProduct(b.customId);
            if (selected) {
                collector.stop();
                await shopService.execute(interaction, selected);
                return;
            }
            components = buildPageComponents(utility, product, currentpage, totalpages);
            container = buildPage(interaction, categoria, product, currentpage, totalpages);
            await interaction.editReply({ components: [container, ...components], flags: Discord.MessageFlags.IsComponentsV2 });
            collector.resetTimer();
        });
        collector.on('end', async () => {
            if (stopped) return;
            await interaction.editReply({ components: [buildPage(interaction, categoria, product, currentpage, totalpages)], flags: Discord.MessageFlags.IsComponentsV2 });
        });

	}
};
