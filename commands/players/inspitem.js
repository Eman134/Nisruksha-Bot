const itemsService = require('../../_classes/services/items');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
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
            const embedtemp = await utility.sendError(interaction, `Você precisa identificar um item EXISTENTE para inspecionar!\nVerifique os itens disponíveis utilizando \`/mochila\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        id = id.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

        const drop = await itemsService.get(id)
        
        const user_id = BigInt(interaction.user.id)
        const obj2 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
        if (obj2[drop.name.replace(/"/g, '')] <= 0) {
            const embedtemp = await utility.sendError(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para inspecionar!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        const embed = new Discord.EmbedBuilder();
        embed.setColor('#606060');
        embed.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
        
        embed.addFields({ name: '🔎 Inspeção', value: `Nome: **${drop.icon} ${drop.displayname}**\nValor: \`${drop.price} ${utility.money}\` ${utility.moneyemoji}\nDescrição do item: \`${drop.desc || "Descrição desconhecida."}\`\nRaridade:${drop.rarity ? itemsService.translateRarity(drop.rarity) : "Desconhecida"}\nItem usável: ${drop.usavel ? '**sim** 💫' : '**não**'}` })
        if (drop.icon.includes('>')) embed.setImage('https://cdn.discordapp.com/emojis/' + drop.icon.split(':')[2].replace('>', '') + '.png?v=1')
        await interaction.reply({ embeds: [embed] });

	}
};
