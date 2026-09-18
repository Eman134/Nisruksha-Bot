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
	async execute(API, interaction) {

        const quantia = interaction.options.getString('quantia');
        const money = await API.eco.bank.get(interaction.user.id)
        let total = 0;
        if (quantia != 'tudo') {

            if (!API.isInt(API.toNumber(quantia))) {
                const embedtemp = await API.sendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para saque!`, `sacar <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (money < API.toNumber(quantia)) {
                const embedtemp = await API.sendError(interaction, `Você não possui essa quantia __no banco__ de dinheiro para sacar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (API.toNumber(quantia) < 1) {
                const embedtemp = await API.sendError(interaction, `Você não pode sacar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = API.toNumber(quantia);
        } else {
            if (money < 1) {
                const embedtemp = await API.sendError(interaction, `Você não possui dinheiro __no banco__ para sacar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = money;
        }
        
		const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja sacar o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** da sua conta bancária?`)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

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
                embed.addField('❌ Saque cancelado', `
                Você cancelou o saque de **${API.format(total)} ${API.money} ${API.moneyemoji}** da sua conta bancária.`)
            } else {
                const money2 = await API.eco.bank.get(interaction.user.id);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no saque', `Você não possui **${API.format(total)} ${API.money} ${API.moneyemoji}** __no banco__ para sacar!`)
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso no saque', `
                    Você sacou o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** da sua conta bancária!`)
                    API.eco.money.add(interaction.user.id, total);
                    API.eco.bank.remove(interaction.user.id, total);
                    API.eco.addToHistory(interaction.user.id, `📤 Saque | - ${API.format(total)} ${API.moneyemoji}`)
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
            embed.addField('❌ Tempo expirado', `
            Você iria sacar o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** da sua conta bancária, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
