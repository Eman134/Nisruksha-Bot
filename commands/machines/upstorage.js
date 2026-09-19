const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('quantia').setDescription('Selecione uma quantia para upar o armazém').setRequired(true))

module.exports = {
    requiredServices: ["Discord","client","createButton","eco","format","maqExtension","money","moneyemoji","rowComponents","sendError"],
    name: 'upararmazém',
    aliases: ['upararmazem', 'uparm', 'uparestoque', 'upstorage'],
    category: 'Maquinas',
    description: 'Faz upgrade de espaço do seu armazém',
    data,
    mastery: 20,
	async execute(interaction, svcDiscord, svcClient, svcCreateButton, svcEco, svcFormat, svcMaqExtension, svcMoney, svcMoneyemoji, svcRowComponents, svcSendError) {
        let quantia = interaction.options.getInteger('quantia')

        if (quantia < 1) {
            const embedtemp = await svcSendError(interaction, `Você não pode upar essa quantia de níveis!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (quantia > 25) {
            const embedtemp = await svcSendError(interaction, `Você só pode upar até 25 níveis de armazém por vez!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let size = await svcMaqExtension.storage.getSize(interaction.user.id);
        let max = await svcMaqExtension.storage.getMax(interaction.user.id);
        let r1 = quantia;
        let pricea = await svcMaqExtension.storage.getPrice(interaction.user.id, r1)
        let price = Math.round(await svcMaqExtension.storage.getPrice(interaction.user.id, r1)*1.40)
        let obj = await DatabaseManager.get(interaction.user.id, 'storage');
        let lvl = obj.storage;
        
		const embed = new svcDiscord.MessageEmbed()
        .setColor('#5634eb')
        .setTitle('Armazém de ' + interaction.user.username)
        .addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${svcFormat(size)}/${svcFormat(max)}]g**\nNível do armazém: **${svcFormat(lvl)} (+${r1})**\nPreço do aprimoramento: **${svcFormat(price)} ${svcMoneyemoji}**\n\nOBS: Um custo adicional foi implementado para\n aumentar diversos níveis de uma vez [+\`${Math.round(price-pricea)} ${svcMoney}\` ${svcMoneyemoji}]\nCaso não deseja pagar esta taxa, aumente o nível 1 por vez com \`/armazém\``)
        embed.addField('<:waiting:739967127502454916> Aguardando resposta'
        , 'Aprimorar o armazém [<:upgrade:738434840457642054>]')

        const btn0 = svcCreateButton('upgrade', 'SECONDARY', 'Upgrade', '738434840457642054')

        const embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 20000 });

        let reacted
        let err = false;
        let pago = 0;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            let ap = false;
            size = await svcMaqExtension.storage.getSize(interaction.user.id);
            max = await svcMaqExtension.storage.getMax(interaction.user.id);
            const svcMoney = await svcEco.svcMoney.get(interaction.user.id);

            reacted = true;
            embed.fields = [];
            if (b.customId == 'upgrade'){
                if (price > svcMoney) {
                    embed.setColor('#a60000')
                    .addField('❌ Aprimoramento mal sucedido!', `Você não possui dinheiro suficiente para realizar este aprimoramento!\nSeu dinheiro atual: **${svcFormat(svcMoney)}/${svcFormat(price)} ${svcMoney} ${svcMoneyemoji}**`)
                    .setFooter('')
                    err = true;
                } else {
                    embed.setColor('#5bff45');
                    pago += price;
                    await DatabaseManager.set(interaction.user.id, 'storage', 'storage', lvl+r1)
                    let obj55 = await DatabaseManager.get(interaction.user.id, 'storage');
                    let lvl55 = obj55.storage;
                    embed.addField('<:upgrade:738434840457642054> Aprimoramento realizado com sucesso!', `Peso máximo: **${svcFormat(max)}g (+${r1*svcMaqExtension.storage.sizeperlevel})**\nNível do armazém: **${svcFormat(lvl55)} (+${r1})**\nPreço pago: **${svcFormat(pago)} ${svcMoney} ${svcMoneyemoji}**`)
                    .setFooter('')
                    svcEco.svcMoney.remove(interaction.user.id, price)
                    svcEco.addToHistory(interaction.user.id, `Aprimoramento Armazém | - ${svcFormat(price)} ${svcMoneyemoji}`)
                    ap = true;
                }
                collector.stop()
            }
            try {
                if (embedinteraction)interaction.editReply({ embeds: [embed], components: [] });
            }catch (err){
                svcClient.emit('error', err)
            }
            if (err)collector.stop()
            
        });
        
        collector.on('end', collected => {
            try {
                if (embedinteraction){
                    if (!reacted) {
                    embed.fields = [];
                    embed.addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${svcFormat(size)}/${svcFormat(max)}]g**\nNível do armazém: **${svcFormat(lvl)} (+${r1})**\nPreço do aprimoramento: **${svcFormat(price)} ${svcMoneyemoji}**\n\nOBS: Um custo adicional foi implementado para\n aumentar diversos níveis de uma vez [+\`${Math.round(price-pricea)} ${svcMoney}\` ${svcMoneyemoji}]\nCaso não deseja pagar esta taxa, aumente o nível 1 por vez com \`/armazém\``)
                    embed.addField('❌ Sessão encerrada', 'O tempo de reação foi expirado!')
                    .setFooter('')
                    interaction.editReply({ embeds: [embed], components: [] });}
                }
            }catch (err){
                svcClient.emit('error', err)
            }
        });

	}
};
