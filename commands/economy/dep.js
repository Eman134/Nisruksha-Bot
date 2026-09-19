const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para depósito').setRequired(true))

const prisma = require('../../_classes/prisma');

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
                const embedtemp = await utility.sendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para depósito!`, `depositar <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (money < utility.toNumber(quantia)) {
                const embedtemp = await utility.sendError(interaction, `Você não possui essa quantia de dinheiro para depositar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (utility.toNumber(quantia) < 1) {
                const embedtemp = await utility.sendError(interaction, `Você não pode depositar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = utility.toNumber(quantia);
        } else {
            if (money < 1) {
                const embedtemp = await utility.sendError(interaction, `Você não possui dinheiro para depositar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = money;
        }
        let total2 = total;
        let taxa = await townsService.getTownTax(interaction.user.id);
        total = total2 - (Math.round(taxa*total2/100));
        
		const embed = new Discord.EmbedBuilder();
        embed.setColor('#606060');
        embed.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })

        embed.addFields({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `
        Você deseja depositar o valor de ${utility.format(total2)} ${utility.money} ${utility.moneyemoji} na sua conta bancária?\nTaxa de depósito da vila atual (**${await townsService.getTownName(interaction.user.id)}**): ${taxa}% (${Math.round(taxa*total2/100)} ${utility.money} ${utility.moneyemoji})\nTotal a ser depositado: **${utility.format(total)} ${utility.money} ${utility.moneyemoji}**` })
        
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
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.depositar.defer_update'); });
            if (b.customId == 'cancel'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Depósito cancelado', value: `
                Você cancelou o depósito de **${utility.format(total2)} ${utility.money} ${utility.moneyemoji}** na sua conta bancária.` })
            } else {
                const money2 = await economyService.money.get(interaction.user.id);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addFields({ name: '❌ Falha no depósito', value: `Você não possui **${utility.format(total2)} ${utility.money} ${utility.moneyemoji}** em mãos para depositar!` })
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addFields({ name: '✅ Sucesso no depósito', value: `
                    Você depositou o valor de **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** na sua conta bancária!` })
                    economyService.bank.add(interaction.user.id, total);
                    economyService.money.remove(interaction.user.id, total2);
                    economyService.addToHistory(interaction.user.id, `📥 Depósito | + ${utility.format(total)} ${utility.moneyemoji}`)
                    const user_id = BigInt(interaction.user.id)
                    let obj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
                    await prisma.players.update({ where: { user_id }, data: { dep: obj.dep + 1 } });
                    economyService.money.globaladd(taxa)
                }
            }
            interaction.editReply({ embeds: [embed], components: [] });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `
            Você iria depositar o valor de **${utility.format(total2)} ${utility.money} ${utility.moneyemoji}** na sua conta bancária, porém o tempo expirou.` })
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
