module.exports = {
    name: 'comprar',
    aliases: ['buy', 'c'],
    category: 'Economia',
    description: 'Faz a compra de um item da loja',
    options: [{
            name: 'produto',
            type: 'STRING',
            description: 'Selecione um id de produto para a compra',
            required: false
    }],
    mastery: 20,
	async execute(API, msg) {

        const args = API.args(msg);
        let obj = API.shopExtension.getShopObj();
        let array = Object.keys(obj);
        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar um id de item para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
			await msg.quote(embedtemp)
            return;
        }

        if (!API.isInt(args[0])) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar um id de item (número)!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
            await msg.quote(embedtemp)
            return;
        }

        let id = parseInt(args[0]);

        if (!API.shopExtension.checkIdExists(id)) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar um id de item existente para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
            await msg.quote(embedtemp)
            return;
        }
        
		API.shopExtension.execute(msg, API.shopExtension.getProduct(id));

	}
};