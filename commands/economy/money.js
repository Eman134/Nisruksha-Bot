const Discord = require('../../_classes/discordCompat');
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
        const embed = new Discord.MessageEmbed()
        .setTitle(`Conta de \`${member.username}\``)
        .setColor('#32a893')
        .addField(`${utility.moneyemoji} Dinheiro`, code('js', `${utility.format(money)} ${utility.money}`), true)
        .addField(`🏦 Saldo Bancário`, code('js', `${utility.format(moneybank)} ${utility.money}`), true)
        .addField(`${utility.money3emoji} Fichas`, code('js', `${utility.format(token)} ${utility.money3}`), true)
        .addField(`${utility.money2emoji} Cristais`, code('js', `${utility.format(points)} ${utility.money2}`), true)
        .addField(`${utility.tp.emoji} Pontos temporais`, code('js', `${utility.format(tp.points)} ${utility.tp.name}`), true)
        .addField('📃 Extrato [5 ações]', `${economyService.getHistory(member.id)}`, false)
        //.addField(`📤 Saques`, code('autohotkey', obj.saq), true)
        //.addField(`📥 Depósitos`, code('autohotkey', obj.dep), true)
        //.addField(`📭 Transferências`, code('autohotkey', obj.tran), true)
        await interaction.reply({ embeds: [embed] });

    },
};