module.exports = {
    name: 'saldo',
    aliases: ['dinheiro', 'conta', 'money', 'points', 'coins', 'coin', 'fichas', 'bal', 'balance', 'moedas'],
    category: 'Economia',
    description: 'Veja as informações na sua conta',
    async execute(API, msg) {
        const boolean = await API.checkAll(msg);
        if (boolean) return;
        const Discord = API.Discord;
        const client = API.client;
        
        let member;
        let args = API.args(msg)
        if (msg.mentions.users.size < 1) {
            if (args.length == 0) {
                member = msg.author;
            } else {
                let member2 = await client.users.fetch(args[0])
                if (!member2) {
                    member = msg.author
                } else {
                    member = member2
                }
            }
        } else {
            member = msg.mentions.users.first();
        }
        
        const money = await API.eco.money.get(member);
        const moneybank = await API.eco.bank.get(member);
        const points = await API.eco.points.get(member);
        const token = await API.eco.token.get(member);
        const obj = await API.getInfo(member, 'players');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``);
        const embed = new Discord.MessageEmbed()
        .setTitle(`Conta de \`${member.username}\``)
        .setColor('#32a893')
        .addField(`${API.moneyemoji} Dinheiro`, code('js', `${API.format(money)} ${API.money}`), true)
        .addField(`🏦 Saldo Bancário`, code('js', `${API.format(moneybank)} ${API.money}`), true)
        .addField(`${API.money3emoji} Fichas`, code('js', `${API.format(token)} ${API.money3}`), true)
        .addField(`${API.money2emoji} Cristais`, code('js', `${API.format(points)} ${API.money2}`), true)
        .addField(`🎫 Convites`, code('js', `${API.prefix + 'meuconvite'}`), true)
        .addField('📃 Extrato [5 ações]', `${API.eco.getHistory(member)}`, false)
        .addField(`📤 Saques`, code('autohotkey', obj.saq), true)
        .addField(`📥 Depósitos`, code('autohotkey', obj.dep), true)
        .addField(`📭 Transferências`, code('autohotkey', obj.tran), true)
        await msg.quote(embed);

    },
};