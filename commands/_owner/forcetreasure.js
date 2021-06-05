module.exports = {
    name: 'forçartesouro',
    aliases: ['forcetreasure'],
    category: 'none',
    description: 'none',
    options: [],
    perm: 5,
	async execute(API, msg) {

        await msg.quote(`Um novo tesouro apareceu! Utilizem \`${API.prefix}mapa\``)
        API.events.forceTreasure()

    }
}