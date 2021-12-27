const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('quantia').setDescription('Selecione uma quantia para upar o armazém').setRequired(true))

module.exports = {
    name: 'upararmazém',
    aliases: ['upararmazem', 'uparm', 'uparestoque', 'upstorage'],
    category: 'Maquinas',
    description: 'Faz upgrade de espaço do seu armazém',
    data,
    mastery: 20,
	async execute(API, interaction) {

        const Discord = API.Discord;

        let quantia = interaction.options.getInteger('quantia')

        if (quantia < 1) {
            const embedtemp = await API.sendError(interaction, `Você não pode upar essa quantia de níveis!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (quantia > 25) {
            const embedtemp = await API.sendError(interaction, `Você só pode upar até 25 níveis de armazém por vez!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let size = await API.maqExtension.storage.getSize(interaction.user.id);
        let max = await API.maqExtension.storage.getMax(interaction.user.id);
        let r1 = quantia;
        let pricea = await API.maqExtension.storage.getPrice(interaction.user.id, r1)
        let price = Math.round(await API.maqExtension.storage.getPrice(interaction.user.id, r1)*1.40)
        let obj = await DatabaseManager.get(interaction.user.id, 'storage');
        let lvl = obj.storage;
        
		const embed = new Discord.MessageEmbed()
        .setColor('#5634eb')
        .setTitle('Armazém de ' + interaction.user.username)
        .addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${API.format(size)}/${API.format(max)}]g**\nNível do armazém: **${API.format(lvl)} (+${r1})**\nPreço do aprimoramento: **${API.format(price)} ${API.moneyemoji}**\n\nOBS: Um custo adicional foi implementado para\n aumentar diversos níveis de uma vez [+\`${Math.round(price-pricea)} ${API.money}\` ${API.moneyemoji}]\nCaso não deseja pagar esta taxa, aumente o nível 1 por vez com \`/armazém\``)
        embed.addField('<:waiting:739967127502454916> Aguardando resposta'
        , 'Aprimorar o armazém [<:upgrade:738434840457642054>]')

        const btn0 = API.createButton('upgrade', 'SECONDARY', 'Upgrade', '738434840457642054')

        const embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 20000 });

        let reacted
        let err = false;
        let pago = 0;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            let ap = false;
            size = await API.maqExtension.storage.getSize(interaction.user.id);
            max = await API.maqExtension.storage.getMax(interaction.user.id);
            const money = await API.eco.money.get(interaction.user.id);

            reacted = true;
            embed.fields = [];
            if (b.customId == 'upgrade'){
                if (price > money) {
                    embed.setColor('#a60000')
                    .addField('❌ Aprimoramento mal sucedido!', `Você não possui dinheiro suficiente para realizar este aprimoramento!\nSeu dinheiro atual: **${API.format(money)}/${API.format(price)} ${API.money} ${API.moneyemoji}**`)
                    .setFooter('')
                    err = true;
                } else {
                    embed.setColor('#5bff45');
                    pago += price;
                    await DatabaseManager.set(interaction.user.id, 'storage', 'storage', lvl+r1)
                    let obj55 = await DatabaseManager.get(interaction.user.id, 'storage');
                    let lvl55 = obj55.storage;
                    embed.addField('<:upgrade:738434840457642054> Aprimoramento realizado com sucesso!', `Peso máximo: **${API.format(max)}g (+${r1*API.maqExtension.storage.sizeperlevel})**\nNível do armazém: **${API.format(lvl55)} (+${r1})**\nPreço pago: **${API.format(pago)} ${API.money} ${API.moneyemoji}**`)
                    .setFooter('')
                    API.eco.money.remove(interaction.user.id, price)
                    API.eco.addToHistory(interaction.user.id, `Aprimoramento Armazém | - ${API.format(price)} ${API.moneyemoji}`)
                    ap = true;
                }
                collector.stop()
            }
            try {
                if (embedinteraction)interaction.editReply({ embeds: [embed], components: [] });
            }catch (err){
                API.client.emit('error', err)
                console.log(err)
            }
            if (err)collector.stop()
            
        });
        
        collector.on('end', collected => {
            try {
                if (embedinteraction){
                    if (!reacted) {
                    embed.fields = [];
                    embed.addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${API.format(size)}/${API.format(max)}]g**\nNível do armazém: **${API.format(lvl)} (+${r1})**\nPreço do aprimoramento: **${API.format(price)} ${API.moneyemoji}**\n\nOBS: Um custo adicional foi implementado para\n aumentar diversos níveis de uma vez [+\`${Math.round(price-pricea)} ${API.money}\` ${API.moneyemoji}]\nCaso não deseja pagar esta taxa, aumente o nível 1 por vez com \`/armazém\``)
                    embed.addField('❌ Sessão encerrada', 'O tempo de reação foi expirado!')
                    .setFooter('')
                    interaction.editReply({ embeds: [embed], components: [] });}
                }
            }catch (err){
                API.client.emit('error', err)
                console.log(err)
            }
        });

	}
};