const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const crateExtensionService = require('../../_classes/services/crateExtension');
const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'daily',
    aliases: ['daily'],
    category: 'Economia',
    description: 'Receba uma recompensa diária e aumente seu streak',
	async execute(interaction) {

        
        const check = await playersService.cooldown.check(interaction.user.id, "daily");
        if (check) {

            playersService.cooldown.message(interaction, 'daily', 'resgatar sua recompensa diária')

            return;
        }

        const streakmax = -1
        
        const user_id = BigInt(interaction.user.id)
        const obj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
        let streak = obj['streak'];

        let reward;

        if (streak == null || streak == undefined || streak == '0;0' || streak == 0) {
            streak = 0
        } else {

            const check2 = await playersService.cooldown.check(interaction.user.id, "breakstreak");
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
        
        const container = new ContainerBuilder()
            .setAccentColor(parseInt((colors[streak] || colors["10"]).slice(1), 16))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**${interaction.user.tag}**\nVocê recebeu \`${reward}\` ${utility.moneyemoji}${cristal > 0 ? `${obj.mvp ? ',':' e'} \`1 ${utility.money2}\` ${utility.money2emoji}`:''}${obj.mvp ? ' e **2x 📦 Caixa comum** ':''} de recompensa diária\nVolte em 24 horas para receber a recompensa\nnovamente e aumentar o seu streak!\n**Streak atual: ${streak}**`
            ));
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
        await economyService.money.add(interaction.user.id, reward)
        await economyService.points.add(interaction.user.id, cristal)
        await prisma.players.update({ where: { user_id }, data: { streak } })
        await economyService.addToHistory(interaction.user.id, `Recompensa diária | + ${utility.format(reward)} ${utility.moneyemoji}`)
        await playersService.cooldown.set(interaction.user.id, "daily", 86400);
        await playersService.cooldown.set(interaction.user.id, "breakstreak", 86400*2);
        if (obj.perm >= 3) await crateExtensionService.give(interaction.user.id, 1, 2)
	},
};
