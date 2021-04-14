module.exports = {
    name: 'usarchave',
    aliases: ['ativarchave', 'usarkey', 'usekey'],
    category: 'Outros',
    description: 'Resgata um produto de uma chave de ativação',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg)
        
        let objgkeys = await API.getGlobalInfo('keys') || [];

        if (args.length == 0) {
            API.sendError(msg, 'Você precisa digitar um código de chave para a ativação', `usarkey 000-000-000-000-N`)
            return;
        }

        let key = args[0]
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
            API.sendError(msg, 'Essa chave de ativação é inexistente!')
            return;
        }

        const check = await API.checkCooldown(msg.author, "usekey");
        if (check) {

            let cooldown = await API.getCooldown(msg.author, "usekey");
            const embed = new Discord.MessageEmbed()
            .setColor('#b8312c')
            .setDescription('🕑 Aguarde mais `' + API.ms(cooldown) + '` para usar uma chave!')
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            msg.quote(embed);
            return;
        }

        API.setCooldown(msg.author, "usekey", 30);

        let size = item.size || 0
        let time = item.time || 0

        const embed = new Discord.MessageEmbed()
		.setDescription(`Você deseja usar a **🔑 Chave de Ativação**?\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
        const embedmsg
        try {
            
        } catch {
            embedmsg = await msg.quote(embed);
        } 
        
        await embedmsg.react('✅')
        embedmsg.react('❌')

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            reaction.users.remove(user.id);
            if (!(['✅', '❌'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();
            const embed = new API.Discord.MessageEmbed()
            if (reaction.emoji.name == '❌'){
                embed.setColor('#a60000');
                embed.addField('❌ Uso de chave cancelado', `
                Você cancelou o uso da **🔑 Chave de Ativação**.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
                embedmsg.edit(embed);
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
                embedmsg.edit(embed);
                return;
            }
            
            if (API.debug)console.log(`Index of key ${objgkeys.indexOf(item)}`)
            objgkeys.splice(objgkeys.indexOf(item), 1)
            API.setGlobalInfo('keys', objgkeys)
    
            let pobj = await API.getInfo(msg.author, 'players')
            switch (item.form.type) {
                case 0:
                    API.setInfo(msg.author, 'players', 'mvp', pobj.mvp == null || pobj.mvp <= 0 ? (Date.now()+item.time) : (pobj.mvp+item.time))
                    API.setPerm(msg.author, 3)
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
            embedmsg.edit(embed);

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
            ch.send(embed2);

            API.setCooldown(msg.author, "usekey", 0);

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll().catch();
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria usar a **🔑 Chave de Ativação**, porém o tempo expirou.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
            embedmsg.edit(embed);
            API.setCooldown(msg.author, "usekey", 0);
            return;
        });

	}
};