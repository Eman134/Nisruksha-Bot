const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
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
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``);
        const container = new ContainerBuilder()
            .setAccentColor(0x32a893)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                `## Conta de \`${member.username}\``,
                `**${utility.moneyemoji} Dinheiro**\n${code('js', `${utility.format(money)} ${utility.money}`)}`,
                `**🏦 Saldo Bancário**\n${code('js', `${utility.format(moneybank)} ${utility.money}`)}`,
                `**${utility.money3emoji} Fichas**\n${code('js', `${utility.format(token)} ${utility.money3}`)}`,
                `**${utility.money2emoji} Cristais**\n${code('js', `${utility.format(points)} ${utility.money2}`)}`,
                `**${utility.tp.emoji} Pontos temporais**\n${code('js', `${utility.format(tp.points)} ${utility.tp.name}`)}`,
                `**📃 Extrato [5 ações]**\n${economyService.getHistory(member.id)}`
            ].join('\n\n')));
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

    },
};
