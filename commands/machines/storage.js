const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja o armazém de algum membro'))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","createButton","eco","format","itemExtension","maqExtension","money","moneyemoji","rowComponents"],
    name: 'armazém',
    aliases: ['armazem', 'ar', 'estoque', 'recursos', 'storage'],
    category: 'Maquinas',
    description: 'Visualiza seu estoque de recursos completo',
    data,
    mastery: 20,
	async execute(interaction, svcDiscord, svcCreateButton, svcEco, svcFormat, svcItemExtension, svcMaqExtension, svcMoney, svcMoneyemoji, svcRowComponents) {
        let member = interaction.options.getUser('membro');
        if (!member) member = interaction.user

        let size = await svcMaqExtension.storage.getSize(member.id);
        let max = await svcMaqExtension.storage.getMax(member.id);
        let price = await svcMaqExtension.storage.getPrice(member.id);
        let obj = await DatabaseManager.get(member.id, 'storage');
        let lvl = obj.storage;
        
		const embed = new svcDiscord.MessageEmbed()
        .setColor('#5634eb')
        .setTitle('Armazém de ' + member.username)
        .addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${svcFormat(size)}/${svcFormat(max)}]g**\nNível do armazém: **${svcFormat(lvl)}**\nPreço do aprimoramento: **${svcFormat(price)} ${svcMoneyemoji}**`)
        if (member == interaction.user)embed.addField('<:waiting:739967127502454916> Aguardando resposta'
        , 'Aprimorar o armazém [<:upgrade:738434840457642054>]\nVisualizar recursos da sua máquina [<:recursos:738429524416528554>]')

        if (member != interaction.user) return await interaction.reply({ embeds: [embed] })

        const btn0 = svcCreateButton('upgrade', 'SECONDARY', 'Upgrade', '738434840457642054')
        const btn1 = svcCreateButton('recursos', 'SECONDARY', 'Recursos', '738429524416528554')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 20000 });

        let reacted
        let r1 = 1;
        let err = false;
        let pago = 0;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            size = await svcMaqExtension.storage.getSize(member.id);
            max = await svcMaqExtension.storage.getMax(member.id);
            svcMoney = await svcEco.svcMoney.get(interaction.user.id);
            price = await svcMaqExtension.storage.getPrice(member.id)

            reacted = true;
            collector.stop()
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.armazenamento.defer_update'); });
                
            if (b.customId == 'upgrade'){
                if (price > await svcEco.svcMoney.get(interaction.user.id)) {
                    embed.setColor('#a60000')
                    .addField('❌ Aprimoramento mal sucedido!', `Você não possui dinheiro suficiente para realizar este aprimoramento!\nSeu dinheiro atual: **${svcFormat(await svcEco.svcMoney.get(interaction.user.id))}/${svcFormat(await svcMaqExtension.storage.getPrice(member.id))} ${svcMoney} ${svcMoneyemoji}**`)
                    .setFooter('')
                    err = true;
                } else {
                    embed.setColor('#5bff45');
                    pago += price;
                    await DatabaseManager.set(interaction.user.id, 'storage', 'storage', lvl+r1)
                    let obj55 = await DatabaseManager.get(member.id, 'storage');
                    let lvl55 = obj55.storage;
                    embed.addField('<:upgrade:738434840457642054> Aprimoramento realizado com sucesso!', `Peso máximo: **${svcFormat(max)}g (+${r1*svcMaqExtension.storage.sizeperlevel})**\nNível do armazém: **${svcFormat(lvl55)} (+${r1})**\nPreço pago: **${svcFormat(pago)} ${svcMoney} ${svcMoneyemoji}**\nPreço do próximo aprimoramento: **${svcFormat(await svcMaqExtension.storage.getPrice(member.id, undefined, max+(r1*svcMaqExtension.storage.sizeperlevel)))} ${svcMoney} ${svcMoneyemoji}**`)
                    .setFooter('')
                    svcEco.svcMoney.remove(interaction.user.id, price)
                    svcEco.addToHistory(interaction.user.id, `Aprimoramento Armazém | - ${svcFormat(price)} ${svcMoneyemoji}`)
                    ap = true;
                }

            } else if (b.customId == 'recursos'){
                let obj55 = await DatabaseManager.get(member.id, 'storage');
                let lvl55 = obj55.storage;
                let obj = svcItemExtension.getObj();
                const obj2 = await DatabaseManager.get(member.id, 'storage')
                embed.addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${svcFormat(await svcMaqExtension.storage.getSize(member.id))}/${svcFormat(max+(r1*svcMaqExtension.storage.sizeperlevel)-svcMaqExtension.storage.sizeperlevel)}]g**\nNível do armazém: **${svcFormat(lvl55)}**`);
                let total = 0;
                for (const r of obj['minerios']) {
                    if (obj2[r.name] > 0) {
                        embed.addField(`${r.icon} ${r.name.charAt(0).toUpperCase() + r.name.slice(1)} | ${svcFormat(Math.round(obj2[r.name]*r.price.atual))} ${svcMoneyemoji}`, `\`\`\`autohotkey\n${obj2[r.name] > 1000 ? (obj2[r.name]/1000).toFixed(1) + 'kg' : obj2[r.name] + 'g'}\`\`\``, true)
                        total += obj2[r.name]*r.price.atual;
                    }
                }
                if (await svcMaqExtension.storage.getSize(member.id) == 0) {
                    embed.setColor('#a60000')
                    .addField('❌ Ação mal sucedida!', `Seu armazém não possui recursos!`)
                    .setFooter('')
                } else embed.setFooter('💰 Seus recursos valem ' + svcFormat(Math.round(total)) + ' ' + svcMoney)
            }

            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', collected => {

            if (reacted) return
            embed.fields = [];
            embed.addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${svcFormat(size)}/${svcFormat(max)}]g**\nNível do armazém: **${svcFormat(lvl)}**\nPreço do aprimoramento: **${svcFormat(price)} ${svcMoneyemoji}**`)
            embed.addField('❌ Sessão encerrada', 'O tempo de reação foi expirado!')
            .setFooter('')
            interaction.editReply({ embeds: [embed], components: [] });

        });

	}
};
