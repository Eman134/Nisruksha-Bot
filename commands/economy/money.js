const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja as moedas e o histórico de transação de algum membro'))

module.exports = {
    requiredServices: ["Discord","eco","format","money","money2","money2emoji","money3","money3emoji","moneyemoji","tp"],
    name: 'dinheiro',
    aliases: ['dinheiro', 'money', 'points', 'coins', 'coin', 'fichas', 'bal', 'balance', 'moedas', 'pontostemp'],
    category: 'Economia',
    description: 'Veja as informações na sua conta',
    data,
    async execute(interaction, svcDiscord, svcEco, svcFormat, svcMoney, svcMoney2, svcMoney2emoji, svcMoney3, svcMoney3emoji, svcMoneyemoji, svcTp) {        
        let member = interaction.options.getUser('membro') || interaction.user
        
        const svcMoney = await svcEco.svcMoney.get(member.id);
        const moneybank = await svcEco.bank.get(member.id);
        const points = await svcEco.points.get(member.id);
        const token = await svcEco.token.get(member.id);
        const svcTp = await svcEco.svcTp.get(member.id);
        //const obj = await DatabaseManager.get(member.id, 'players');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``);
        const embed = new svcDiscord.MessageEmbed()
        .setTitle(`Conta de \`${member.username}\``)
        .setColor('#32a893')
        .addField(`${svcMoneyemoji} Dinheiro`, code('js', `${svcFormat(svcMoney)} ${svcMoney}`), true)
        .addField(`🏦 Saldo Bancário`, code('js', `${svcFormat(moneybank)} ${svcMoney}`), true)
        .addField(`${svcMoney3emoji} Fichas`, code('js', `${svcFormat(token)} ${svcMoney3}`), true)
        .addField(`${svcMoney2emoji} Cristais`, code('js', `${svcFormat(points)} ${svcMoney2}`), true)
        .addField(`${svcTp.emoji} Pontos temporais`, code('js', `${svcFormat(svcTp.points)} ${svcTp.name}`), true)
        .addField('📃 Extrato [5 ações]', `${svcEco.getHistory(member.id)}`, false)
        //.addField(`📤 Saques`, code('autohotkey', obj.saq), true)
        //.addField(`📥 Depósitos`, code('autohotkey', obj.dep), true)
        //.addField(`📭 Transferências`, code('autohotkey', obj.tran), true)
        await interaction.reply({ embeds: [embed] });

    },
};