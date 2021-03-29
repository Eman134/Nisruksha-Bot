module.exports = {
    name: 'gerarkey',
    aliases: ['gerarchave', 'gchave', 'gkey', 'genkey'],
    category: 'Mod',
    description: 'Gera uma chave de ativação com um produto de recompensa',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg, 4);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg)

        if (args.length == 0) {
            API.sendError(msg, 'Você precisa especificar um tipo de chave e sua duração', `gerarchave MVP 1mo 30d 10h 30m 30s\n${API.prefix}gerarchave money 100`)
            return;
        }

        let types = {
            'MVP': {
                icon: '<:mvp:758717273304465478>',
                name: 'MVP',
                requiret: true,
                requiresize: false,
                type: 0
            },
            'MOEDAS': {
                icon: `${API.moneyemoji}`,
                name: `${API.money}`,
                requiret: false,
                requiresize: true,
                type: 1
            },
            'FICHAS': {
                icon: `${API.money3emoji}`,
                name: `${API.money3}`,
                requiret: false,
                requiresize: true,
                type: 2
            },
            'CRISTAIS': {
                icon: `${API.money2emoji}`,
                name: `${API.money2}`,
                requiret: false,
                requiresize: true,
                type: 3
            }
        }

        let choose = args[0].toUpperCase();
        if (Object.keys(types).includes(choose) == false) {
            API.sendError(msg, `Você precisa especificar um tipo de chave existente!\n \n**Lista de Tipos**\n\`${Object.keys(types).join(', ')}.\``, `gerarchave MVP 1mo 30d 10h 30m 30s\n${API.prefix}gerarchave money 100`)
            return;
        }

        if (types[choose].requiret == true && args.length < 2) {
            API.sendError(msg, 'Você precisa especificar um tempo de duração para a o produto', `gerarchave ${types[choose].name} 1mo 30d 10h 30m 30s`)
            return;
        }
        if (types[choose].requiresize == true && args.length < 2) {
            API.sendError(msg, 'Você precisa especificar uma quantia para a o produto', `gerarchave ${types[choose].name} 10000`)
            return;
        }
        let time = 0;
        if (types[choose].requiret == true) {

            let d = API.getMultipleArgs(msg, 2);
            timesplit = d.split(" ");
            
            for (const r of timesplit) {
                if (r.includes('mo')) {
                    time += parseInt(r.replace('mo', ''))*30*24*60*60*1000
                }
                else if (r.includes('d')) {
                    time += parseInt(r.replace('d', ''))*24*60*60*1000
                }
                else if (r.includes('h')) {
                    time += parseInt(r.replace('h', ''))*60*60*1000
                }
                else if (r.includes('m')) {
                    time += parseInt(r.replace('m', ''))*60*1000
                }
                else if (r.includes('s')) {
                    time += parseInt(r.replace('s', ''))*1000
                }

            }

        }
        let size = 0;
        if (types[choose].requiresize == true && !API.isInt(args[1])) {
            API.sendError(msg, 'Você precisa especificar uma quantia para a o produto', `gerarchave ${types[choose].name} 10000`)
            return;
        }
        if (types[choose].requiresize == true){
            size = parseInt(args[1])
        }
        
		const embed = new Discord.MessageEmbed()
		.setDescription(`Você deseja gerar uma nova **🔑 Chave de Ativação**?\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
        const embedmsg = await msg.quote(embed);
        
        await embedmsg.react('✅')
        embedmsg.react('❌')

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(['✅', '❌'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();
            const embed = new API.Discord.MessageEmbed()
            if (reaction.emoji.name == '❌'){
                embed.setColor('#a60000');
                embed.addField('❌ Geração de chave cancelada', `
                Você cancelou a geração de uma nova **🔑 Chave de Ativação**.\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
                embedmsg.edit(embed);
                return;
            }

            function makeid(length) {
                var result = '';
                var characters = '012345678901234567890123456789012345678901234567890123456789';
                var charactersLength = characters.length;
                for ( var i = 0; i < length; i++ ) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                return result;
            }

            let key = `${makeid(3)}-${makeid(3)}-${makeid(3)}-${makeid(3)}-N`

            let obj = {
                key: key,
                form: types[choose]
            }

            if (time) obj.time = time
            if (size) obj.size = size

            let objgkeys = await API.getGlobalInfo('keys');
            let clist = []
            if (objgkeys != null) {
                clist = objgkeys
            }
            clist.push(obj)
            API.setGlobalInfo('keys', clist);

            const embed2 = new API.Discord.MessageEmbed()
            .setTitle(`🔑 Nova chave gerada`)
            .setDescription(`Quem gerou: ${msg.author} \`${msg.author.id}\`
Local em que gerou: ${msg.channel} 🡮 ${msg.guild.name} 🡮 \`${msg.guild.id}\`
Chave gerada: **${key}**

Produto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}

**Objeto gerado:**
\`\`\`js
${JSON.stringify(obj, null, '\t').slice(0, 1000)}
\`\`\``)
            .setColor(`#fc8c03`)
            let ch = await API.client.channels.cache.get('758711135284232263')
            let createdmsg = await ch.send(embed2);

            embed.setColor('#5bff45');
            embed.addField('✅ Chave criada com sucesso', `
            Você gerou uma nova **🔑 Chave de Ativação**, visualize-a [CLICANDO AQUI](${`https://discordapp.com/channels/${ch.guild.id}/${ch.id}/${createdmsg.id}`})`)
            embedmsg.edit(embed);

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria gerar uma nova **🔑 Chave de Ativação**, porém o tempo expirou.\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
            embedmsg.edit(embed);
            return;
        });

	}
};