const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('produto').setDescription('Especifique um id de produto').setRequired(true))

module.exports = {
    requiredServices: ["sendError","shopExtension"],
    name: 'comprar',
    aliases: ['buy', 'c'],
    category: 'Economia',
    description: 'Faz a compra de um item da loja',
    data,
    mastery: 20,
	async execute(interaction, svcSendError, svcShopExtension) {

        let obj = svcShopExtension.getShopObj();
        let array = Object.keys(obj);

        let id = interaction.options.getInteger('produto')

        if (!svcShopExtension.checkIdExists(id)) {
            const embedtemp = await svcSendError(interaction, `Você precisa especificar um id de item existente para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
		svcShopExtension.execute(interaction, svcShopExtension.getProduct(id));

	}
};