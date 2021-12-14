const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('categoria').setDescription('Digite uma categoria de loja para visualizar os produtos')
.addChoice('MAQUINAS', 'MAQUINAS')
.addChoice('FICHAS', 'FICHAS')
.addChoice('CHIPES', 'CHIPES')
.addChoice('TEMPORAL', 'TEMPORAL')
.addChoice('MOCHILAS', 'MOCHILAS')
.setRequired(false))

module.exports = {
    name: 'loja',
    aliases: ['shop', 'l'],
    category: 'Economia',
    description: 'Veja os produtos disponíveis para venda',
    data,
    mastery: 10,
	async execute(API, interaction) {

        const Discord = API.Discord;
        const optioncategoria = interaction.options.getString('categoria')
        if (optioncategoria == null) {
            const embed = new Discord.MessageEmbed()
            .setColor('#811e99')
            .setDescription(`
            <:shop:736274027919966269> Veja abaixo produtos das categorias e divirta-se!
            ↳ Utilize \`/loja <categoria>\` para visualizar uma categoria
            ↳ Utilize \`/comprar <id>\` para realizar uma compra
            `)
            .addField('<:list:736274028179750922> Categorias', API.shopExtension.getShopList())
            await interaction.reply({ embeds: [embed] });
            return;
        }
        const categoria = optioncategoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (categoria == 'maq') {
            categoria = 'maquinas';
        }
        let obj = API.shopExtension.getShopObj();
        let array = Object.keys(obj);
        if (!API.shopExtension.categoryExists(categoria)){
            const embedtemp = await API.sendError(interaction, `Você selecionou uma categoria inexistente!`, `loja <${array.join(' | ').toUpperCase()}>`)
            await interaction.reply({ embeds: [embedtemp]})
			return;
        }
        var product = obj[categoria];
        product = product.filter((item) => item.buyable)
        let array2 = Object.keys(product);
        const embed = new Discord.MessageEmbed();
        let totalpages = array2.length % 3;
        if (totalpages == 0) totalpages = (array2.length)/3;
        else totalpages = ((array2.length-totalpages)/3)+1;

        let currentpage = 1;

        if (totalpages == 0) currentpage = 0

        embed.setTitle(`${categoria.toUpperCase()} ${currentpage}/${totalpages}`);
        embed.setColor('#bf772a');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        embed.setDescription(`Utilize \`/comprar <id>\` para realizar uma compra`);

        let stopComponents = false

        if (currentpage == totalpages || totalpages == 0) stopComponents = true

        const components = await API.shopExtension.formatPages(embed, { currentpage, totalpages }, product, interaction.user.id, stopComponents);

        let embedinteraction = await interaction.reply({ embeds: [embed], components, fetchReply: true });

        if (stopComponents) return

        API.shopExtension.editPage(categoria.toUpperCase(), interaction, embedinteraction, product, embed, currentpage, totalpages);

	}
};