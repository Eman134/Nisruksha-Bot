const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de dinheiro para depósito').setRequired(true))

const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'depositar',
    aliases: ['dep'],
    category: 'Economia',
    description: 'Deposita uma quantia de dinheiro no banco central',
    data,
    mastery: 20,
	async execute(API, interaction) {

        const quantia = interaction.options.getString('quantia');
        const money = await API.eco.money.get(interaction.user.id)
        let total = 0;
        if (quantia != 'tudo') {

            if (!API.isInt(API.toNumber(quantia))) {
                const embedtemp = await API.sendError(interaction, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para depósito!`, `depositar <quantia | tudo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (money < API.toNumber(quantia)) {
                const embedtemp = await API.sendError(interaction, `Você não possui essa quantia de dinheiro para depositar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (API.toNumber(quantia) < 1) {
                const embedtemp = await API.sendError(interaction, `Você não pode depositar essa quantia de dinheiro!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = API.toNumber(quantia);
        } else {
            if (money < 1) {
                const embedtemp = await API.sendError(interaction, `Você não possui dinheiro para depositar!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            total = money;
        }
        let total2 = total;
        let taxa = await API.townExtension.getTownTax(interaction.user.id);
        total = total2 - (Math.round(taxa*total2/100));
        
		const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja depositar o valor de ${API.format(total2)} ${API.money} ${API.moneyemoji} na sua conta bancária?\nTaxa de depósito da vila atual (**${await API.townExtension.getTownName(interaction.user.id)}**): ${taxa}% (${Math.round(taxa*total2/100)} ${API.money} ${API.moneyemoji})\nTotal a ser depositado: **${API.format(total)} ${API.money} ${API.moneyemoji}**`)
        
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
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            if (b.customId == 'cancel'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Depósito cancelado', `
                Você cancelou o depósito de **${API.format(total2)} ${API.money} ${API.moneyemoji}** na sua conta bancária.`)
            } else {
                const money2 = await API.eco.money.get(interaction.user.id);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no depósito', `Você não possui **${API.format(total2)} ${API.money} ${API.moneyemoji}** em mãos para depositar!`)
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso no depósito', `
                    Você depositou o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** na sua conta bancária!`)
                    API.eco.bank.add(interaction.user.id, total);
                    API.eco.money.remove(interaction.user.id, total2);
                    API.eco.addToHistory(interaction.user.id, `📥 Depósito | + ${API.format(total)} ${API.moneyemoji}`)
                    let obj = await DatabaseManager.get(interaction.user.id, "players");
                    DatabaseManager.set(interaction.user.id, "players", "dep", obj.dep + 1);
                    API.eco.money.globaladd(taxa)
                }
            }
            interaction.editReply({ embeds: [embed], components: [] });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria depositar o valor de **${API.format(total2)} ${API.money} ${API.moneyemoji}** na sua conta bancária, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};