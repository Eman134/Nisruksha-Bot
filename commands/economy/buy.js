const shopService = require('../../_classes/services/shop');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
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
            const container = new ContainerBuilder()
                .setAccentColor(0xb8312c)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                    `**${interaction.user.tag}**`,
                    '<:error:736274027756388353> Você precisa especificar um id de item existente para compra!\nVisualize uma lista de produtos disponíveis',
                    `**Exemplo de uso**\n\`/loja <${array.join(' | ').toUpperCase()}>\``
                ].join('\n\n')));
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
		await shopService.execute(interaction, await shopService.getProduct(id));

	}
};
