const Discord = require('discord.js');
const machinesService = require('../../_classes/services/machines');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const itemsService = require('../../_classes/services/items');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja o armazém de algum membro'))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'armazém',
    aliases: ['armazem', 'ar', 'estoque', 'recursos', 'storage'],
    category: 'Maquinas',
    description: 'Visualiza seu estoque de recursos completo',
    data,
    mastery: 20,
	async execute(interaction) {
        
        let member = interaction.options.getUser('membro');
        if (!member) member = interaction.user

        let size = await machinesService.storage.getSize(member.id);
        let max = await machinesService.storage.getMax(member.id);
        let price = await machinesService.storage.getPrice(member.id);
        let obj = await DatabaseManager.get(member.id, 'storage');
        let lvl = obj.storage;
        
		const embed = new Discord.EmbedBuilder()
        .setColor('#5634eb')
        .setTitle('Armazém de ' + member.username)
        .addFields({ name: '<:storageinfo:738427915531845692> Informações', value: `Peso atual: **[${utility.format(size)}/${utility.format(max)}]g**\nNível do armazém: **${utility.format(lvl)}**\nPreço do aprimoramento: **${utility.format(price)} ${utility.moneyemoji}**` })
        if (member == interaction.user)embed.addFields({ name: '<:waiting:739967127502454916> Aguardando resposta', value: 'Aprimorar o armazém [<:upgrade:738434840457642054>]\nVisualizar recursos da sua máquina [<:recursos:738429524416528554>]' })

        if (member != interaction.user) return await interaction.reply({ embeds: [embed] })

        const btn0 = utility.createButton('upgrade', 'SECONDARY', 'Upgrade', '738434840457642054')
        const btn1 = utility.createButton('recursos', 'SECONDARY', 'Recursos', '738429524416528554')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 20000 });

        let reacted
        let r1 = 1;
        let err = false;
        let pago = 0;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            size = await machinesService.storage.getSize(member.id);
            max = await machinesService.storage.getMax(member.id);
            money = await economyService.money.get(interaction.user.id);
            price = await machinesService.storage.getPrice(member.id)

            reacted = true;
            collector.stop()
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.armazenamento.defer_update'); });
                
            if (b.customId == 'upgrade'){
                if (price > await economyService.money.get(interaction.user.id)) {
                    embed.setColor('#a60000')
                    .addFields({ name: '❌ Aprimoramento mal sucedido!', value: `Você não possui dinheiro suficiente para realizar este aprimoramento!\nSeu dinheiro atual: **${utility.format(await economyService.money.get(interaction.user.id))}/${utility.format(await machinesService.storage.getPrice(member.id))} ${utility.money} ${utility.moneyemoji}**` })
                    .setFooter({ text: '' })
                    err = true;
                } else {
                    embed.setColor('#5bff45');
                    pago += price;
                    await DatabaseManager.set(interaction.user.id, 'storage', 'storage', lvl+r1)
                    let obj55 = await DatabaseManager.get(member.id, 'storage');
                    let lvl55 = obj55.storage;
                    embed.addFields({ name: '<:upgrade:738434840457642054> Aprimoramento realizado com sucesso!', value: `Peso máximo: **${utility.format(max)}g (+${r1*machinesService.storage.sizeperlevel})**\nNível do armazém: **${utility.format(lvl55)} (+${r1})**\nPreço pago: **${utility.format(pago)} ${utility.money} ${utility.moneyemoji}**\nPreço do próximo aprimoramento: **${utility.format(await machinesService.storage.getPrice(member.id, undefined, max+(r1*machinesService.storage.sizeperlevel)))} ${utility.money} ${utility.moneyemoji}**` })
                    .setFooter({ text: '' })
                    economyService.money.remove(interaction.user.id, price)
                    economyService.addToHistory(interaction.user.id, `Aprimoramento Armazém | - ${utility.format(price)} ${utility.moneyemoji}`)
                    ap = true;
                }

            } else if (b.customId == 'recursos'){
                let obj55 = await DatabaseManager.get(member.id, 'storage');
                let lvl55 = obj55.storage;
                let obj = itemsService.getObj();
                const obj2 = await DatabaseManager.get(member.id, 'storage')
                embed.addFields({ name: '<:storageinfo:738427915531845692> Informações', value: `Peso atual: **[${utility.format(await machinesService.storage.getSize(member.id))}/${utility.format(max+(r1*machinesService.storage.sizeperlevel)-machinesService.storage.sizeperlevel)}]g**\nNível do armazém: **${utility.format(lvl55)}**` });
                let total = 0;
                for (const r of obj['minerios']) {
                    if (obj2[r.name] > 0) {
                        embed.addFields({ name: `${r.icon} ${r.name.charAt(0).toUpperCase() + r.name.slice(1)} | ${utility.format(Math.round(obj2[r.name]*r.price.atual))} ${utility.moneyemoji}`, value: `\`\`\`autohotkey\n${obj2[r.name] > 1000 ? (obj2[r.name]/1000).toFixed(1) + 'kg' : obj2[r.name] + 'g'}\`\`\``, inline: true })
                        total += obj2[r.name]*r.price.atual;
                    }
                }
                if (await machinesService.storage.getSize(member.id) == 0) {
                    embed.setColor('#a60000')
                    .addFields({ name: '❌ Ação mal sucedida!', value: `Seu armazém não possui recursos!` })
                    .setFooter({ text: '' })
                } else embed.setFooter({ text: '💰 Seus recursos valem ' + utility.format(Math.round(total)) + ' ' + utility.money })
            }

            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', collected => {

            if (reacted) return
            embed.fields = [];
            embed.addFields({ name: '<:storageinfo:738427915531845692> Informações', value: `Peso atual: **[${utility.format(size)}/${utility.format(max)}]g**\nNível do armazém: **${utility.format(lvl)}**\nPreço do aprimoramento: **${utility.format(price)} ${utility.moneyemoji}**` })
            embed.addFields({ name: '❌ Sessão encerrada', value: 'O tempo de reação foi expirado!' })
            .setFooter({ text: '' })
            interaction.editReply({ embeds: [embed], components: [] });

        });

	}
};
