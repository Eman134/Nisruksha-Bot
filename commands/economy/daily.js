const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'daily',
    aliases: ['daily'],
    category: 'Economia',
    description: 'Receba uma recompensa diária e aumente seu streak',
	async execute(API, interaction) {

        const Discord = API.Discord;

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "daily");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'daily', 'resgatar sua recompensa diária')

            return;
        }

        const streakmax = -1
        
        const obj = await DatabaseManager.get(interaction.user.id, "players");
        let streak = obj['streak'];

        let reward;

        if (streak == null || streak == undefined || streak == '0;0' || streak == 0) {
            streak = 0
        } else {

            const check2 = await API.playerUtils.cooldown.check(interaction.user.id, "breakstreak");
            if (!check2) {
                streak = 0
            }
            
        }
        if (streak == streakmax) streak = 0
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
        
        let r = (streak)-((streak)%5);

        let cristal = 0
        if (r > 0 && streak == r) {
            cristal = 1
        }
        
		const embed = new Discord.MessageEmbed()
        .setColor(colors[streak] || colors["10"])
        .setDescription(`Você recebeu \`${reward}\` ${API.moneyemoji}${cristal > 0 ? `${obj.mvp ? ',':' e'} \`1 ${API.money2}\` ${API.money2emoji}`:''}${obj.mvp ? ' e **2x 📦 Caixa comum** ':''} de recompensa diária\nVolte em 24 horas para receber a recompensa\nnovamente e aumentar o seu streak!\n**Streak atual: ${streak}**`)
        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        await interaction.reply({ embeds: [embed] });
        API.eco.money.add(interaction.user.id, reward)
        API.eco.points.add(interaction.user.id, cristal)
        DatabaseManager.set(interaction.user.id, "players", "streak", streak)
        API.eco.addToHistory(interaction.user.id, `Recompensa diária | + ${API.format(reward)} ${API.moneyemoji}`)
        API.playerUtils.cooldown.set(interaction.user.id, "daily", 86400);
        API.playerUtils.cooldown.set(interaction.user.id, "breakstreak", 86400*2);
        if (obj.perm >= 3)API.crateExtension.give(interaction.user.id, 1, 2)
	},
};