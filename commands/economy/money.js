const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja as moedas e o histórico de transação de algum membro'))

module.exports = {
    name: 'dinheiro',
    aliases: ['dinheiro', 'money', 'points', 'coins', 'coin', 'fichas', 'bal', 'balance', 'moedas', 'pontostemp'],
    category: 'Economia',
    description: 'Veja as informações na sua conta',
    data,
    async execute(API, interaction) {

        const Discord = API.Discord;
        
        let member = interaction.options.getUser('membro') || interaction.user
        
        const money = await API.eco.money.get(member.id);
        const moneybank = await API.eco.bank.get(member.id);
        const points = await API.eco.points.get(member.id);
        const token = await API.eco.token.get(member.id);
        const tp = await API.eco.tp.get(member.id);
        //const obj = await DatabaseManager.get(member.id, 'players');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``);
        const embed = new Discord.MessageEmbed()
        .setTitle(`Conta de \`${member.username}\``)
        .setColor('#32a893')
        .addField(`${API.moneyemoji} Dinheiro`, code('js', `${API.format(money)} ${API.money}`), true)
        .addField(`🏦 Saldo Bancário`, code('js', `${API.format(moneybank)} ${API.money}`), true)
        .addField(`${API.money3emoji} Fichas`, code('js', `${API.format(token)} ${API.money3}`), true)
        .addField(`${API.money2emoji} Cristais`, code('js', `${API.format(points)} ${API.money2}`), true)
        .addField(`${API.tp.emoji} Pontos temporais`, code('js', `${API.format(tp.points)} ${API.tp.name}`), true)
        .addField('📃 Extrato [5 ações]', `${API.eco.getHistory(member.id)}`, false)
        //.addField(`📤 Saques`, code('autohotkey', obj.saq), true)
        //.addField(`📥 Depósitos`, code('autohotkey', obj.dep), true)
        //.addField(`📭 Transferências`, code('autohotkey', obj.tran), true)
        await interaction.reply({ embeds: [embed] });

    },
};