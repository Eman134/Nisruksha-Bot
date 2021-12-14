const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('produto').setDescription('Especifique um id de produto').setRequired(true))

module.exports = {
    name: 'comprar',
    aliases: ['buy', 'c'],
    category: 'Economia',
    description: 'Faz a compra de um item da loja',
    data,
    mastery: 20,
	async execute(API, interaction) {

        let obj = API.shopExtension.getShopObj();
        let array = Object.keys(obj);

        let id = interaction.options.getInteger('produto')

        if (!API.shopExtension.checkIdExists(id)) {
            const embedtemp = await API.sendError(interaction, `Você precisa especificar um id de item existente para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
		API.shopExtension.execute(interaction, API.shopExtension.getProduct(id));

	}
};