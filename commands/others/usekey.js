module.exports = {
    name: 'usarchave',
    aliases: ['ativarchave', 'usarkey', 'usekey'],
    category: 'Outros',
    description: 'Resgata um produto de uma chave de ativação',
    options: [{
        name: 'chave',
        type: 'STRING',
        description: 'Coloque a chave para resgatar a recompensa da mesma',
        required: true
    }],
    mastery: 15,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg)
        
        let objgkeys = await API.getGlobalInfo('keys') || [];

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, 'Você precisa digitar um código de chave para a ativação', `usarkey 000-000-000-000-N`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        let key = args[0]
        console.log(key)
        let exists = false;
        let item;
        for (const r of objgkeys) {
            let _key = r.key;
            if (key == _key) {
              if (API.debug)console.log(r)
              item = r;
              exists = true
              break;
            }
        }

        if (!exists) {
            const embedtemp = await API.sendError(msg, 'Essa chave de ativação é inexistente!')
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "usekey");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'usekey', 'usar uma chave')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "usekey", 30);

        let size = item.size || 0
        let time = item.time || 0

        const embed = new Discord.MessageEmbed()
		.setDescription(`Você deseja usar a **🔑 Chave de Ativação**?\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1])] });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {
            b.defer()
            reacted = true;
            collector.stop();
            const embed = new API.Discord.MessageEmbed()
            if (b.id == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Uso de chave cancelado', `
                Você cancelou o uso da **🔑 Chave de Ativação**.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
                embedmsg.edit({ embeds: [embed] });
                return;
            }

            objgkeys = await API.getGlobalInfo('keys') || [];

            let key2 = args[0]
            let exists2 = false;

            for (const r of objgkeys) {
                let _key2 = r.key;
                if (key2 == _key2) {
                if (API.debug)console.log(r)
                item = r;
                exists2 = true
                break;
                }
            }

            if (!exists2) {
                embed.setColor('#a60000');
                embed.addField('❌ Uso de chave cancelado', `
                Essa chave de ativação é inexistente!`)
                embedmsg.edit({ embeds: [embed] });
                return;
            }
            
            if (API.debug)console.log(`Index of key ${objgkeys.indexOf(item)}`)
            objgkeys.splice(objgkeys.indexOf(item), 1)
            API.setGlobalInfo('keys', objgkeys)
    
            let pobj = await API.getInfo(msg.author, 'players')
            switch (item.form.type) {
                case 0:
                    API.badges.add(msg.author, 1)
                    await API.frames.add(msg.author, 3)
                    await API.frames.add(msg.author, 4)
                    API.setInfo(msg.author, 'players', 'mvp', pobj.mvp == null || pobj.mvp <= 0 ? (Date.now()+item.time) : (pobj.mvp+item.time))
                    if (await API.getPerm(msg.author) == 1) API.setPerm(msg.author, 3)
                    break;
                case 1:
                    API.eco.money.add(msg.author, item.size)
                    break;
                case 2:
                    API.eco.token.add(msg.author, item.size)
                    break;
                case 3:
                    API.eco.points.add(msg.author, item.size)
                    break;
                default:
                    break;
            }


            embed.setColor('#5bff45');
            embed.addField('✅ Chave usada com sucesso', `Você usou uma **🔑 Chave de Ativação**!\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
            embedmsg.edit({ embeds: [embed] });

			let cchannel = await API.client.channels.cache.get(msg.channel.id)

            const embed2 = new API.Discord.MessageEmbed()
            .setTitle(`✅ Chave usada`)
            .setDescription(`Quem usou: ${msg.author} \`${msg.author.id}\`
Local em que usou: #${cchannel.name} 🡮 ${msg.guild.name} 🡮 \`${msg.guild.id}\`
Chave usada: **${item.key}**

Produto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração do ${item.form.name}: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}

`)
            .setColor(`#5bff45`)
            let ch = await API.client.channels.cache.get('758711135284232263')
            ch.send({ embeds: [embed2] });

            API.playerUtils.cooldown.set(msg.author, "usekey", 0);

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria usar a **🔑 Chave de Ativação**, porém o tempo expirou.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
            embedmsg.edit({ embeds: [embed] });
            API.playerUtils.cooldown.set(msg.author, "usekey", 0);
            return;
        });

	}
};