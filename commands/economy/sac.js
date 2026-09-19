const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para saque').setRequired(true))

const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'sacar',
    aliases: ['sac'],
    category: 'Economia',
    description: 'Saca uma quantia de dinheiro do banco central',
    data,
    mastery: 20,
	async execute(interaction) {

        const quantia = interaction.options.getString('quantia');
        const money = await economyService.bank.get(interaction.user.id)
        let total = 0;
        if (quantia != 'tudo') {

            if (!utility.isInt(utility.toNumber(quantia))) {
                const embedtemp = await utility.sendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para saque!`, `sacar <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (money < utility.toNumber(quantia)) {
                const embedtemp = await utility.sendError(interaction, `Você não possui essa quantia __no banco__ de dinheiro para sacar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (utility.toNumber(quantia) < 1) {
                const embedtemp = await utility.sendError(interaction, `Você não pode sacar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = utility.toNumber(quantia);
        } else {
            if (money < 1) {
                const embedtemp = await utility.sendError(interaction, `Você não possui dinheiro __no banco__ para sacar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = money;
        }
        
		const embed = new Discord.EmbedBuilder();
        embed.setColor('#606060');
        embed.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })

        embed.addFields({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `
        Você deseja sacar o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** da sua conta bancária?` })

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.sacar.defer_update'); });
            if (b.customId == 'cancel'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Saque cancelado', value: `
                Você cancelou o saque de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** da sua conta bancária.` })
            } else {
                const money2 = await economyService.bank.get(interaction.user.id);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addFields({ name: '❌ Falha no saque', value: `Você não possui **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** __no banco__ para sacar!` })
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addFields({ name: '✅ Sucesso no saque', value: `
                    Você sacou o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** da sua conta bancária!` })
                    economyService.money.add(interaction.user.id, total);
                    economyService.bank.remove(interaction.user.id, total);
                    economyService.addToHistory(interaction.user.id, `📤 Saque | - ${utility.format(total)} ${utility.moneyemoji}`)
                    let obj = await DatabaseManager.get(interaction.user.id, "players");
                    DatabaseManager.set(interaction.user.id, "players", "saq", obj.saq + 1);
                }
            }
            interaction.editReply({ embeds: [embed], components: [] });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `
            Você iria sacar o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** da sua conta bancária, porém o tempo expirou.` })
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
