module.exports = {
    name: 'upararmazém',
    aliases: ['upararmazem', 'uparm', 'uparestoque', 'upstorage'],
    category: 'Maquinas',
    description: 'Faz upgrade de espaço do seu armazém',
    options: [{
        name: 'quantia',
        type: 'INTEGER',
        description: 'Selecione uma quantia para upar o armazém',
        required: true
    }],
    mastery: 20,
	async execute(API, msg) {

        const Discord = API.Discord;

        let args = API.args(msg)

        if (!API.isInt(args[0])) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de níveis (NÚMERO) para upar!`, `uparm <níveis>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (parseInt(args[0]) < 1) {
            const embedtemp = await API.sendError(msg, `Você não pode upar essa quantia de níveis!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        if (parseInt(args[0]) > 25) {
            const embedtemp = await API.sendError(msg, `Você só pode upar até 25 níveis de armazém por vez!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let size = await API.maqExtension.storage.getSize(msg.author);
        let max = await API.maqExtension.storage.getMax(msg.author);
        let r1 = parseInt(args[0]);
        let pricea = await API.maqExtension.storage.getPrice(msg.author, r1)
        let price = Math.round(await API.maqExtension.storage.getPrice(msg.author, r1)*1.40)
        let obj = await API.getInfo(msg.author, 'storage');
        let lvl = obj.storage;
        
		const embed = new Discord.MessageEmbed()
        .setColor('#5634eb')
        .setTitle('Armazém de ' + msg.author.username)
        .addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${API.format(size)}/${API.format(max)}]g**\nNível do armazém: **${API.format(lvl)} (+${r1})**\nPreço do aprimoramento: **${API.format(price)} ${API.moneyemoji}**\n\nOBS: Um custo adicional foi implementado para\n aumentar diversos níveis de uma vez [+\`${Math.round(price-pricea)} ${API.money}\` ${API.moneyemoji}]\nCaso não deseja pagar esta taxa, aumente o nível 1 por vez com \`${API.prefix}armazém\``)
        embed.addField('<:waiting:739967127502454916> Aguardando resposta'
        , 'Aprimorar o armazém [<:upgrade:738434840457642054>]')

        const btn0 = API.createButton('upgrade', 'SECONDARY', 'Upgrade', '738434840457642054')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowComponents([btn0])] });

        const filter = i => i.user.id === msg.author.id;
        
        let collector = embedmsg.createMessageComponentCollector({ filter, time: 20000 });

        let reacted
        let err = false;
        let pago = 0;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === msg.author.id)) return

            let ap = false;
            size = await API.maqExtension.storage.getSize(msg.author);
            max = await API.maqExtension.storage.getMax(msg.author);
            const money = await API.eco.money.get(msg.author);

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
                    await API.setInfo(msg.author, 'storage', 'storage', lvl+r1)
                    let obj55 = await API.getInfo(msg.author, 'storage');
                    let lvl55 = obj55.storage;
                    embed.addField('<:upgrade:738434840457642054> Aprimoramento realizado com sucesso!', `Peso máximo: **${API.format(max)}g (+${r1*API.maqExtension.storage.sizeperlevel})**\nNível do armazém: **${API.format(lvl55)} (+${r1})**\nPreço pago: **${API.format(pago)} ${API.money} ${API.moneyemoji}**`)
                    .setFooter('')
                    API.eco.money.remove(msg.author, price)
                    API.eco.addToHistory(msg.author, `Aprimoramento Armazém | - ${API.format(price)} ${API.moneyemoji}`)
                    ap = true;
                }
                collector.stop()
            }
            try {
                if (embedmsg)embedmsg.edit({ embeds: [embed], components: [] });
            }catch (err){
                client.emit('error', err)
                console.log(err)
            }
            if (err)collector.stop()
            
        });
        
        collector.on('end', collected => {
            try {
                if (embedmsg){
                    if (!reacted) {
                    embed.fields = [];
                    embed.addField('<:storageinfo:738427915531845692> Informações', `Peso atual: **[${API.format(size)}/${API.format(max)}]g**\nNível do armazém: **${API.format(lvl)} (+${r1})**\nPreço do aprimoramento: **${API.format(price)} ${API.moneyemoji}**\n\nOBS: Um custo adicional foi implementado para\n aumentar diversos níveis de uma vez [+\`${Math.round(price-pricea)} ${API.money}\` ${API.moneyemoji}]\nCaso não deseja pagar esta taxa, aumente o nível 1 por vez com \`${API.prefix}armazém\``)
                    embed.addField('❌ Sessão encerrada', 'O tempo de reação foi expirado!')
                    .setFooter('')
                    embedmsg.edit({ embeds: [embed], components: [] });}
                }
            }catch (err){
                API.client.emit('error', err)
                console.log(err)
            }
        });

	}
};