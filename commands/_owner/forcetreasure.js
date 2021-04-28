module.exports = {
    name: 'forçartesouro',
    aliases: ['forcetreasure'],
    category: 'none',
    description: 'none',
	async execute(API, msg) {

        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

     await msg.quote(`Um novo tesouro apareceu! Utilizem \`${API.prefix}mapa\``)
        API.townExtension.forceTreasure()

    }
}