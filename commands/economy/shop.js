const Discord = require('discord.js');
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
            const embed = new Discord.EmbedBuilder()
            .setColor('#811e99')
            .setDescription(`
            <:shop:736274027919966269> Veja abaixo produtos das categorias e divirta-se!
            ↳ Utilize \`/loja <categoria>\` para visualizar uma categoria
            ↳ Utilize \`/comprar <id>\` para realizar uma compra
            `)
            .addFields({ name: '<:list:736274028179750922> Categorias', value: await shopService.getShopList() })
            await interaction.reply({ embeds: [embed] });
            return;
        }
        const categoria = optioncategoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (categoria == 'maq') {
            categoria = 'maquinas';
        }
        let obj = await shopService.getShopObj();
        let array = Object.keys(obj);
        if (!await shopService.categoryExists(categoria)){
            const embedtemp = await utility.sendError(interaction, `Você selecionou uma categoria inexistente!`, `loja <${array.join(' | ').toUpperCase()}>`)
            await interaction.reply({ embeds: [embedtemp]})
			return;
        }
        var product = obj[categoria];
        product = product.filter((item) => item.buyable)
        let array2 = Object.keys(product);
        const embed = new Discord.EmbedBuilder();
        let totalpages = array2.length % 3;
        if (totalpages == 0) totalpages = (array2.length)/3;
        else totalpages = ((array2.length-totalpages)/3)+1;

        let currentpage = 1;

        if (totalpages == 0) currentpage = 0

        embed.setTitle(`${categoria.toUpperCase()} ${currentpage}/${totalpages}`);
        embed.setColor('#bf772a');
        embed.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
        embed.setDescription(`Utilize \`/comprar <id>\` para realizar uma compra`);

        let stopComponents = false

        if (currentpage == totalpages || totalpages == 0) stopComponents = true

        const components = await shopService.formatPages(embed, { currentpage, totalpages }, product, interaction.user.id, stopComponents);

        let embedinteraction = (await interaction.reply({ embeds: [embed], components, withResponse: true })).resource.message;

        if (stopComponents) return

        shopService.editPage(categoria.toUpperCase(), interaction, embedinteraction, product, embed, currentpage, totalpages);

	}
};
