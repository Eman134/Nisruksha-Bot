const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para depósito').setRequired(true))

const prisma = require('../../_classes/prisma');

function buildMessage(interaction, { color = '#606060', title, value, error = false }) {
    return new ContainerBuilder()
        .setAccentColor(parseInt(color.slice(1), 16))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent([
            `**${interaction.user.tag}**`,
            title ? `**${title}**` : '',
            `${error ? '<:error:736274027756388353> ' : ''}${value}`
        ].filter(Boolean).join('\n\n')));
}

module.exports = {
    name: 'depositar',
    aliases: ['dep'],
    category: 'Economia',
    description: 'Deposita uma quantia de dinheiro no banco central',
    data,
    mastery: 20,
	async execute(interaction) {

        const quantia = interaction.options.getString('quantia');
        const money = await economyService.money.get(interaction.user.id)
        let total = 0;
        if (quantia != 'tudo') {

            if (!utility.isInt(utility.toNumber(quantia))) {
                await interaction.reply({ components: [buildMessage(interaction, { value: 'Você precisa especificar uma quantia de dinheiro (NÚMERO) para depósito!\n\n**Exemplo de uso**\n`/depositar <quantia | tudo>`', error: true, color: '#b8312c' })], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }

            if (money < utility.toNumber(quantia)) {
                await interaction.reply({ components: [buildMessage(interaction, { value: 'Você não possui essa quantia de dinheiro para depositar!', error: true, color: '#b8312c' })], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }

            if (utility.toNumber(quantia) < 1) {
                await interaction.reply({ components: [buildMessage(interaction, { value: 'Você não pode depositar essa quantia de dinheiro!', error: true, color: '#b8312c' })], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }
            total = utility.toNumber(quantia);
        } else {
            if (money < 1) {
                await interaction.reply({ components: [buildMessage(interaction, { value: 'Você não possui dinheiro para depositar!', error: true, color: '#b8312c' })], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }
            total = money;
        }
        let total2 = total;
        let taxa = await townsService.getTownTax(interaction.user.id);
        total = total2 - (Math.round(taxa*total2/100));
        
        let container = buildMessage(interaction, { title: '<a:loading:736625632808796250> Aguardando confirmação', value: `
        Você deseja depositar o valor de ${utility.format(total2)} ${utility.money} ${utility.moneyemoji} na sua conta bancária?\nTaxa de depósito da vila atual (**${await townsService.getTownName(interaction.user.id)}**): ${taxa}% (${Math.round(taxa*total2/100)} ${utility.money} ${utility.moneyemoji})\nTotal a ser depositado: **${utility.format(total)} ${utility.money} ${utility.moneyemoji}**` })
        
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
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.depositar.defer_update'); });
            if (b.customId == 'cancel'){
                container = buildMessage(interaction, { color: '#a60000', title: '❌ Depósito cancelado', value: `
                Você cancelou o depósito de **${utility.format(total2)} ${utility.money} ${utility.moneyemoji}** na sua conta bancária.` });
            } else {
                const money2 = await economyService.money.get(interaction.user.id);
                if (money2 < total) {
                    container = buildMessage(interaction, { color: '#a60000', title: '❌ Falha no depósito', value: `Você não possui **${utility.format(total2)} ${utility.money} ${utility.moneyemoji}** em mãos para depositar!` });
                } else {
                    container = buildMessage(interaction, { color: '#5bff45', title: '✅ Sucesso no depósito', value: `
                    Você depositou o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** na sua conta bancária!` });
                    economyService.bank.add(interaction.user.id, total);
                    economyService.money.remove(interaction.user.id, total2);
                    economyService.addToHistory(interaction.user.id, `📥 Depósito | + ${utility.format(total)} ${utility.moneyemoji}`)
                    const user_id = BigInt(interaction.user.id)
                    let obj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
                    await prisma.players.update({ where: { user_id }, data: { dep: obj.dep + 1 } });
                    economyService.money.globaladd(taxa)
                }
            }
            interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            container = buildMessage(interaction, { color: '#a60000', title: '❌ Tempo expirado', value: `
            Você iria depositar o valor de **${utility.format(total2)} ${utility.money} ${utility.moneyemoji}** na sua conta bancária, porém o tempo expirou.` });
            interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
