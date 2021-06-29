module.exports = {
    name: 'inspecionaritem',
    aliases: ['veritem', 'insi', 'inspitem'],
    category: 'Players',
    description: 'Inspeciona algum item da sua mochila',
    options: [{
        name: 'item',
        type: 'STRING',
        description: 'Escreva o nome do item que você deseja usar',
        required: false
    }],
    mastery: 25,
	async execute(API, msg) {

        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um item para inspecionar!`, `inspecionaritem <nome do item>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (args.length >= 1 && (API.itemExtension.exists(API.getMultipleArgs(msg, 1), 'drops') == false)) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um item EXISTENTE para inspecionar!\nVerifique os itens disponíveis utilizando \`${API.prefix}mochila\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let id = API.getMultipleArgs(msg, 1).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); 
        const drop = API.itemExtension.get(id)
        
        const obj2 = await API.getInfo(msg.author, 'storage')
        if (obj2[drop.name.replace(/"/g, '')] <= 0) {
            const embedtemp = await API.sendError(msg, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para inspecionar!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        
        const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        embed.addField('🔎 Inspeção', `Nome: **${drop.icon} ${drop.displayname}**\nValor: \`${drop.price} ${API.money}\` ${API.moneyemoji}\nDescrição do item: \`${drop.desc || "Descrição desconhecida."}\`\nRaridade:${drop.rarity ? API.itemExtension.translateRarity(drop.rarity) : "Desconhecida"}\nItem usável: ${drop.usavel ? '**sim** 💫' : '**não**'}`)
        if (drop.icon.includes('>')) embed.setImage('https://cdn.discordapp.com/emojis/' + drop.icon.split(':')[2].replace('>', '') + '.png?v=1')
        await msg.quote({ embeds: [embed] });

	}
};