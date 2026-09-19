const Discord = require('discord.js');
const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja as moedas e o histórico de transação de algum membro'))

module.exports = {
    name: 'dinheiro',
    aliases: ['dinheiro', 'money', 'points', 'coins', 'coin', 'fichas', 'bal', 'balance', 'moedas', 'pontostemp'],
    category: 'Economia',
    description: 'Veja as informações na sua conta',
    data,
    async execute(interaction) {

                
        let member = interaction.options.getUser('membro') || interaction.user
        
        const money = await economyService.money.get(member.id);
        const moneybank = await economyService.bank.get(member.id);
        const points = await economyService.points.get(member.id);
        const token = await economyService.token.get(member.id);
        const tp = await economyService.tp.get(member.id);
        //const obj = await DatabaseManager.get(member.id, 'players');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``);
        const embed = new Discord.EmbedBuilder()
        .setTitle(`Conta de \`${member.username}\``)
        .setColor('#32a893')
        .addFields({ name: `${utility.moneyemoji} Dinheiro`, value: code('js', `${utility.format(money)} ${utility.money}`), inline: true })
        .addFields({ name: `🏦 Saldo Bancário`, value: code('js', `${utility.format(moneybank)} ${utility.money}`), inline: true })
        .addFields({ name: `${utility.money3emoji} Fichas`, value: code('js', `${utility.format(token)} ${utility.money3}`), inline: true })
        .addFields({ name: `${utility.money2emoji} Cristais`, value: code('js', `${utility.format(points)} ${utility.money2}`), inline: true })
        .addFields({ name: `${utility.tp.emoji} Pontos temporais`, value: code('js', `${utility.format(tp.points)} ${utility.tp.name}`), inline: true })
        .addFields({ name: '📃 Extrato [5 ações]', value: `${economyService.getHistory(member.id)}`, inline: false })
        //.addFields({ name: `📤 Saques`, value: code('autohotkey', obj.saq), inline: true })
        //.addFields({ name: `📥 Depósitos`, value: code('autohotkey', obj.dep), inline: true })
        //.addFields({ name: `📭 Transferências`, value: code('autohotkey', obj.tran), inline: true })
        await interaction.reply({ embeds: [embed] });

    },
};
