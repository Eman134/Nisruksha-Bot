const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para saque').setRequired(true))

const prisma = require('../../_classes/prisma');

function buildMessage(interaction, { color = '#606060', title, value }) {
    return new ContainerBuilder()
        .setAccentColor(parseInt(color.slice(1), 16))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent([
            `**${interaction.user.tag}**`,
            title ? `**${title}**` : '',
            value
        ].filter(Boolean).join('\n\n')));
}

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
                await interaction.reply({ components: [buildMessage(interaction, { color: '#b8312c', value: '<:error:736274027756388353> Você precisa especificar uma quantia de dinheiro (NÚMERO) para saque!\n\n**Exemplo de uso**\n`/sacar <quantia | tudo>`' })], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }

            if (money < utility.toNumber(quantia)) {
                await interaction.reply({ components: [buildMessage(interaction, { color: '#b8312c', value: '<:error:736274027756388353> Você não possui essa quantia __no banco__ de dinheiro para sacar!' })], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }

            if (utility.toNumber(quantia) < 1) {
                await interaction.reply({ components: [buildMessage(interaction, { color: '#b8312c', value: '<:error:736274027756388353> Você não pode sacar essa quantia de dinheiro!' })], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }
            total = utility.toNumber(quantia);
        } else {
            if (money < 1) {
                await interaction.reply({ components: [buildMessage(interaction, { color: '#b8312c', value: '<:error:736274027756388353> Você não possui dinheiro __no banco__ para sacar!' })], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }
            total = money;
        }
        
        let container = buildMessage(interaction, { title: '<a:loading:736625632808796250> Aguardando confirmação', value: `
        Você deseja sacar o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** da sua conta bancária?` })

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ components: [container, new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.sacar.defer_update'); });
            if (b.customId == 'cancel'){
                container = buildMessage(interaction, { color: '#a60000', title: '❌ Saque cancelado', value: `
                Você cancelou o saque de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** da sua conta bancária.` });
            } else {
                const money2 = await economyService.bank.get(interaction.user.id);
                if (money2 < total) {
                    container = buildMessage(interaction, { color: '#a60000', title: '❌ Falha no saque', value: `Você não possui **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** __no banco__ para sacar!` });
                } else {
                    container = buildMessage(interaction, { color: '#5bff45', title: '✅ Sucesso no saque', value: `
                    Você sacou o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** da sua conta bancária!` });
                    economyService.money.add(interaction.user.id, total);
                    economyService.bank.remove(interaction.user.id, total);
                    economyService.addToHistory(interaction.user.id, `📤 Saque | - ${utility.format(total)} ${utility.moneyemoji}`)
                    const user_id = BigInt(interaction.user.id)
                    let obj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
                    await prisma.players.update({ where: { user_id }, data: { saq: obj.saq + 1 } });
                }
            }
            interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            container = buildMessage(interaction, { color: '#a60000', title: '❌ Tempo expirado', value: `
            Você iria sacar o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** da sua conta bancária, porém o tempo expirou.` });
            interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
