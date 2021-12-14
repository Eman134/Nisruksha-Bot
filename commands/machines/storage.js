const { SlashCommandBuilder } = require('@discordjs/builders');
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
	async execute(API, interaction) {
        const Discord = API.Discord;

        let member = interaction.options.getUser('membro');
        if (!member) member = interaction.user

        let size = await API.maqExtension.storage.getSize(member.id);
        let max = await API.maqExtension.storage.getMax(member.id);
        let price = await API.maqExtension.storage.getPrice(member.id);
        let obj = await DatabaseManager.get(member.id, 'storage');
        let lvl = obj.storage;
        
		const embed = new Discord.MessageEmbed()
        .setColor('#5634eb')
        .setTitle('Armazém de ' + member.username)
        .addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${API.format(size)}/${API.format(max)}]g**\nNível do armazém: **${API.format(lvl)}**\nPreço do aprimoramento: **${API.format(price)} ${API.moneyemoji}**`)
        if (member == interaction.user)embed.addField('<:waiting:739967127502454916> Aguardando resposta'
        , 'Aprimorar o armazém [<:upgrade:738434840457642054>]\nVisualizar recursos da sua máquina [<:recursos:738429524416528554>]')

        if (member != interaction.user) return await interaction.reply({ embeds: [embed] })

        const btn0 = API.createButton('upgrade', 'SECONDARY', 'Upgrade', '738434840457642054')
        const btn1 = API.createButton('recursos', 'SECONDARY', 'Recursos', '738429524416528554')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 20000 });

        let reacted
        let r1 = 1;
        let err = false;
        let pago = 0;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            size = await API.maqExtension.storage.getSize(member.id);
            max = await API.maqExtension.storage.getMax(member.id);
            money = await API.eco.money.get(interaction.user.id);
            price = await API.maqExtension.storage.getPrice(member.id)

            reacted = true;
            collector.stop()
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
                
            if (b.customId == 'upgrade'){
                if (price > await API.eco.money.get(interaction.user.id)) {
                    embed.setColor('#a60000')
                    .addField('❌ Aprimoramento mal sucedido!', `Você não possui dinheiro suficiente para realizar este aprimoramento!\nSeu dinheiro atual: **${API.format(await API.eco.money.get(interaction.user.id))}/${API.format(await API.maqExtension.storage.getPrice(member.id))} ${API.money} ${API.moneyemoji}**`)
                    .setFooter('')
                    err = true;
                } else {
                    embed.setColor('#5bff45');
                    pago += price;
                    await DatabaseManager.set(interaction.user.id, 'storage', 'storage', lvl+r1)
                    let obj55 = await DatabaseManager.get(member.id, 'storage');
                    let lvl55 = obj55.storage;
                    embed.addField('<:upgrade:738434840457642054> Aprimoramento realizado com sucesso!', `Peso máximo: **${API.format(max)}g (+${r1*API.maqExtension.storage.sizeperlevel})**\nNível do armazém: **${API.format(lvl55)} (+${r1})**\nPreço pago: **${API.format(pago)} ${API.money} ${API.moneyemoji}**\nPreço do próximo aprimoramento: **${API.format(await API.maqExtension.storage.getPrice(member.id, undefined, max+(r1*API.maqExtension.storage.sizeperlevel)))} ${API.money} ${API.moneyemoji}**`)
                    .setFooter('')
                    API.eco.money.remove(interaction.user.id, price)
                    API.eco.addToHistory(interaction.user.id, `Aprimoramento Armazém | - ${API.format(price)} ${API.moneyemoji}`)
                    ap = true;
                }

            } else if (b.customId == 'recursos'){
                let obj55 = await DatabaseManager.get(member.id, 'storage');
                let lvl55 = obj55.storage;
                let obj = API.itemExtension.getObj();
                const obj2 = await DatabaseManager.get(member.id, 'storage')
                embed.addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${API.format(await API.maqExtension.storage.getSize(member.id))}/${API.format(max+(r1*API.maqExtension.storage.sizeperlevel)-API.maqExtension.storage.sizeperlevel)}]g**\nNível do armazém: **${API.format(lvl55)}**`);
                let total = 0;
                for (const r of obj['minerios']) {
                    if (obj2[r.name] > 0) {
                        embed.addField(`${r.icon} ${r.name.charAt(0).toUpperCase() + r.name.slice(1)} | ${API.format(Math.round(obj2[r.name]*r.price.atual))} ${API.moneyemoji}`, `\`\`\`autohotkey\n${obj2[r.name] > 1000 ? (obj2[r.name]/1000).toFixed(1) + 'kg' : obj2[r.name] + 'g'}\`\`\``, true)
                        total += obj2[r.name]*r.price.atual;
                    }
                }
                if (await API.maqExtension.storage.getSize(member.id) == 0) {
                    embed.setColor('#a60000')
                    .addField('❌ Ação mal sucedida!', `Seu armazém não possui recursos!`)
                    .setFooter('')
                } else embed.setFooter('💰 Seus recursos valem ' + API.format(Math.round(total)) + ' ' + API.money)
            }

            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', collected => {

            if (reacted) return
            embed.fields = [];
            embed.addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${API.format(size)}/${API.format(max)}]g**\nNível do armazém: **${API.format(lvl)}**\nPreço do aprimoramento: **${API.format(price)} ${API.moneyemoji}**`)
            embed.addField('❌ Sessão encerrada', 'O tempo de reação foi expirado!')
            .setFooter('')
            interaction.editReply({ embeds: [embed], components: [] });

        });

	}
};