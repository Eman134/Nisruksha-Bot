const shopService = require('../../_classes/services/shop');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
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
	async execute(interaction) {

        let obj = await shopService.getShopObj();
        let array = Object.keys(obj);

        let id = interaction.options.getInteger('produto')

        if (!await shopService.checkIdExists(id)) {
            const embedtemp = await utility.sendError(interaction, `Você precisa especificar um id de item existente para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
		await shopService.execute(interaction, await shopService.getProduct(id));

	}
};
