const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database()
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('item').setDescription('Escreva o nome do item que você deseja inspecionar').setRequired(true))

module.exports = {
    name: 'inspecionaritem',
    aliases: ['veritem', 'insi', 'inspitem'],
    category: 'Players',
    description: 'Inspeciona algum item da sua mochila',
    data,
    mastery: 25,
	async execute(API, interaction) {

        let id = interaction.options.getString('item');
        
        if ((API.itemExtension.exists(id, 'drops') == false)) {
            const embedtemp = await API.sendError(interaction, `Você precisa identificar um item EXISTENTE para inspecionar!\nVerifique os itens disponíveis utilizando \`/mochila\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        id = id.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

        const drop = API.itemExtension.get(id)
        
        const obj2 = await DatabaseManager.get(interaction.user.id, 'storage')
        if (obj2[drop.name.replace(/"/g, '')] <= 0) {
            const embedtemp = await API.sendError(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para inspecionar!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        embed.addField('🔎 Inspeção', `Nome: **${drop.icon} ${drop.displayname}**\nValor: \`${drop.price} ${API.money}\` ${API.moneyemoji}\nDescrição do item: \`${drop.desc || "Descrição desconhecida."}\`\nRaridade:${drop.rarity ? API.itemExtension.translateRarity(drop.rarity) : "Desconhecida"}\nItem usável: ${drop.usavel ? '**sim** 💫' : '**não**'}`)
        if (drop.icon.includes('>')) embed.setImage('https://cdn.discordapp.com/emojis/' + drop.icon.split(':')[2].replace('>', '') + '.png?v=1')
        await interaction.reply({ embeds: [embed] });

	}
};