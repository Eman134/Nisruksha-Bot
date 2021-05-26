module.exports = {
    name: 'loja',
    aliases: ['shop', 'l'],
    category: 'Economia',
    description: 'Veja os produtos disponíveis para venda',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const args = API.args(msg);
        if (args.length == 0) {
            const embed = new Discord.MessageEmbed()
            .setColor('#811e99')
            .setDescription(`
            <:shop:736274027919966269> Veja abaixo produtos das categorias e divirta-se!
            ↳ Utilize \`${API.prefix}loja <categoria>\` para visualizar uma categoria
            ↳ Utilize \`${API.prefix}comprar <id>\` para realizar uma compra
            `)
            .addField('<:list:736274028179750922> Categorias', API.shopExtension.getShopList())
            await msg.quote(embed);
            return;
        }
        let categoria = args[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (categoria == 'maq') {
            categoria = 'maquinas';
        }
        let obj = API.shopExtension.getShopObj();
        let array = Object.keys(obj);
        if (!API.shopExtension.categoryExists(categoria)){
            API.sendError(msg, `Você selecionou uma categoria inexistente!`, `loja <${array.join(' | ').toUpperCase()}>`)
			return;
        }
        let product = obj[categoria];
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
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        embed.setDescription(`Utilize \`${API.prefix}comprar <id>\` para realizar uma compra`);
        await API.shopExtension.formatPages(embed, currentpage, product, msg.author);
        let msgembed = await msg.quote(embed);
        if (currentpage == totalpages || totalpages == 0) return
        msgembed.react('⏪');
        msgembed.react('⏩');
        API.shopExtension.editPage(categoria.toUpperCase(), msg, msgembed, product, embed, currentpage, totalpages);

	}
};