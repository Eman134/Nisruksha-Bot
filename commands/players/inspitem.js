const itemsService = require('../../_classes/services/items');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const errorContainer = (interaction, message) => new ContainerBuilder()
    .setAccentColor(0xb8312c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> ${message}`));
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('item').setDescription('Escreva o nome do item que você deseja inspecionar').setRequired(true))

module.exports = {
    name: 'inspecionaritem',
    aliases: ['veritem', 'insi', 'inspitem'],
    category: 'Players',
    description: 'Inspeciona algum item da sua mochila',
    data,
    mastery: 25,
	async execute(interaction) {

        let id = interaction.options.getString('item');
        
        if ((await itemsService.exists(id, 'drops') == false)) {
            await interaction.reply({ components: [errorContainer(interaction, `Você precisa identificar um item EXISTENTE para inspecionar!\nVerifique os itens disponíveis utilizando \`/mochila\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        id = id.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

        const drop = await itemsService.get(id)
        
        const user_id = BigInt(interaction.user.id)
        const obj2 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
        if (obj2[drop.name.replace(/"/g, '')] <= 0) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para inspecionar!`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
        const container = new ContainerBuilder()
            .setAccentColor(0x606060)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# ${interaction.user.tag}`),
                new TextDisplayBuilder().setContent(`**🔎 Inspeção**\nNome: **${drop.icon} ${drop.displayname}**\nValor: \`${drop.price} ${utility.money}\` ${utility.moneyemoji}\nDescrição do item: \`${drop.desc || "Descrição desconhecida."}\`\nRaridade:${drop.rarity ? itemsService.translateRarity(drop.rarity) : "Desconhecida"}\nItem usável: ${drop.usavel ? '**sim** 💫' : '**não**'}`)
            );
        if (drop.icon.includes('>')) container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('https://cdn.discordapp.com/emojis/' + drop.icon.split(':')[2].replace('>', '') + '.png?v=1')));
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

	}
};
