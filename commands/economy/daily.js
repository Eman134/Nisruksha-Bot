module.exports = {
    name: 'recompensa',
    aliases: ['daily'],
    category: 'Economia',
    description: 'Receba uma recompensa diária e aumente seu streak',
	async execute(API, msg) {
        const boolean = await API.checkAll(msg);
        if (boolean) return;
        const Discord = API.Discord;

        const check = await API.playerUtils.cooldown.check(msg.author, "daily");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'daily', 'resgatar sua recompensa diária')

            return;
        }

        
        const obj = await API.getInfo(msg.member, "players");
        let streak = obj['streak'];

        let reward;

        if (streak == null || streak == undefined || streak == '0;0' || streak == 0) {
            streak = 0
        } else {

            const check2 = await API.playerUtils.cooldown.check(msg.author, "breakstreak");
            if (!check2) {
                streak = 0
            }
            
        }
        if (streak == 100) streak = 0
        streak++
        
        const colors = {
            1: '#cfeb34',
            2: '#83eb34',
            3: '#34eb43',
            4: '#34eb99',
            5: '#34ebd6',
            6: '#31aade',
            7: '#2975d9',
            8: '#2432d1',
            9: '#6c24d1',
            10: '#d124c0'
        }
        
        reward = (streak) * 350;
        
		const embed = new Discord.MessageEmbed()
        .setColor(colors[streak] || colors["10"])
        .setDescription(`Você recebeu \`${reward}\` ${API.moneyemoji}${obj.perm >= 3 ? ' e **2x 📦 Caixa comum** ':''} de recompensa diária\nVolte em 24 horas para receber a recompensa\nnovamente e aumentar o seu streak!\n**Streak atual: ${streak}/50**`)
        .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        await msg.quote(embed);
        API.eco.money.add(msg.member, reward)
        API.setInfo(msg.member, "players", "streak", streak)
        API.eco.addToHistory(msg.member, `Recompensa diária | + ${API.format(reward)} ${API.moneyemoji}`)
        API.playerUtils.cooldown.set(msg.author, "daily", 86400);
        API.playerUtils.cooldown.set(msg.author, "breakstreak", 86400*2);
        if (obj.perm >= 3)API.crateExtension.give(msg.author, 1, 2)
	},
};