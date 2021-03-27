module.exports = {
    name: 'mapa',
    aliases: ['map', 'local', 'loc', 'vilas'],
    category: 'Players',
    description: 'Visualiza o mapa do mundo, suas vilas e sua localização atual',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const check = await API.checkCooldown(msg.author, "map");
        if (check) {

            let cooldown = await API.getCooldown(msg.author, "map");
            const embed = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setDescription('🕑 Aguarde mais `' + API.ms(cooldown) + '` para visualizar o mapa!')
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            msg.quote(embed);
            return;
        }

        API.setCooldown(msg.author, "map", 120);

        let todel = await msg.quote(`<a:loading:736625632808796250> Carregando mapa`)

        let background = await API.img.loadImage(`resources/backgrounds/map/map.jpg`)
        // Mark
        let mark = await API.img.loadImage(`resources/backgrounds/map/mark.png`)
        mark = await API.img.resize(mark, 250, 250)
        let pos = await API.townExtension.getTownPos(msg.author);
        background = await API.img.drawImage(background, mark, pos.x, pos.y)

        // Avatar
        let avatar = await API.img.loadImage(msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        avatar = await API.img.resize(avatar, 98, 98);
        avatar = await API.img.editBorder(avatar, 49, true)
        background = await API.img.drawImage(background, avatar, pos.x + 77, pos.y + 51)

        // Tesouro
        let tmsg = "\n<:treasure:807671407160197141> Há um tesouro não explorado na sua vila atual!\nPara pegá-lo utilize `" + API.prefix + "pegartesouro`"
        if (API.townExtension.treasure.loc != 0 && API.townExtension.treasure.picked == false) {
            let treasurepos = API.townExtension.treasure.pos
            let treasureicon = await API.img.loadImage(`resources/backgrounds/map/treasure.png`)
            background = await API.img.drawImage(background, treasureicon, treasurepos.x + 75, treasurepos.y + 150)
        }

        background = await API.img.resize(background, 1024, 768);
        let townname = await API.townExtension.getTownName(msg.author);
        try {
            await API.img.sendImage(msg.channel, background, `${msg.author}\nVocê se localiza na vila **${townname}**\nPopulação: **${API.townExtension.population[townname]} pessoas**\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(msg.author)].join(', ')}**.`);
            await todel.delete();
        }catch{}
        
	}
};