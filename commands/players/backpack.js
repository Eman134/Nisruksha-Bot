module.exports = {
    name: 'mochila',
    aliases: ['backpack', 'bag', 'inv'],
    category: 'Players',
    description: 'Visualiza os itens que estão na sua mochila',
    options: [{
        name: 'membro',
        type: 'USER',
        description: 'Veja a mochila de algum membro',
        required: false,
    }],
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        let member;
        let args = API.args(msg)
        if (!msg.slash) {
            if (msg.mentions.users.size < 1) {
                if (args.length == 0) {
                    member = msg.author;
                } else {
                    try {
                    let member2 = await client.users.fetch(args[0])
                    if (!member2) {
                        member = msg.author
                    } else {
                        member = member2
                    }
                    } catch {
                        member = msg.author
                    }
                }
            } else {
                member = msg.mentions.users.first();
            }
        } else {
            if (msg.options.length == 0) {
                member = msg.author
            } else {
                member = msg.options[0].user
            }
        }

        let arraycrates = await API.crateExtension.getCrates(member);
        let array2 = []
        for (const crate of arraycrates) {
            if (parseInt(crate.split(";")[1]) > 0){
                array2.push(crate)
            }
        }

        const utilsobj = await API.getInfo(member, 'players_utils')

        let backpackid = utilsobj.backpack;
        let backpack = API.shopExtension.getProduct(backpackid);

        let arrayitens = await API.company.jobs.itens.get(member, true)

        arrayitens = arrayitens.sort(function(a, b){
            return b.size - a.size;
        })

        let totalpages = arrayitens.length % 10;
        if (totalpages == 0) totalpages = (arrayitens.length)/10;
        else totalpages = ((arrayitens.length-totalpages)/10)+1;

        let currentpage = 1

        if (totalpages == 0) currentpage = 0

        async function setInfosEmbed(embed, member) {
    
            const map = array2.map(crate => `**${crate.split(';')[1]}x** ${API.crateExtension.obj[crate.split(';')[0]].icon} ${API.crateExtension.obj[crate.split(';')[0]].name} | **ID: ${crate.split(';')[0]}**`).join('\n');
            
            embed
            .setColor('#a85a32')
            .setTitle(backpack.icon + ' ' + backpack.name)
            .setAuthor(`Mochila de ${member.tag}`, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .addField(`📦 Caixas misteriosas`, `Para abrir uma caixa utilize \`${API.prefix}abrircaixa <ID DA CAIXA> [quantia]\`\nPara visualizar recompensas de uma caixa use \`${API.prefix}recc <ID DA CAIXA>\`\n` + (array2.length <= 0 ? '**Não possui caixas misteriosas**' : `${map}`))
            
            embed.addField(`🦴 Itens [${arrayitens.length}/${backpack.customitem.typesmax}]`, `Para vender itens utilize \`${API.prefix}venderitem\`\nPara usar itens utilize \`${API.prefix}usaritem\`\nOBS: Itens que podem ser usados são marcados com 💫`)
            //for (i = 1; i < totalpages; i++) {
            const mapitens = arrayitens.slice((currentpage*10)-10, currentpage*10).map((i2) => `**${i2.size}x ${i2.icon} ${i2.displayname}**${i2.usavel ? ` 💫` : ''}`).join('\n')
            embed.addField(`Itens Página ${currentpage}/${totalpages}`, (arrayitens.length <= 0 ? '**Não possui itens**' : `${mapitens}`))
           // }
            return embed
        }

        const embed = new Discord.MessageEmbed()

        await setInfosEmbed(embed, member)

        const embedmsg = await msg.quote(embed);

        if (currentpage == totalpages || totalpages == 0) return
        embedmsg.react('⏪');
        embedmsg.react('⏩');

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
      
        const emojis = ['⏪', '⏩'];
        
        let collector = embedmsg.createReactionCollector(filter, { time: 30000 });
        
        collector.on('collect', async(reaction, user) => {
      
            if (emojis.includes(reaction.emoji.name)) {
              if (reaction.emoji.name == '⏩'){
                if (currentpage < totalpages) currentpage += 1;
              } else {
                if (currentpage > 1) currentpage -= 1;
              }
            }

            const embed = new Discord.MessageEmbed()
            
            await setInfosEmbed(embed, member)

            embedmsg.edit(embed);
            await reaction.users.remove(user.id);
            collector.resetTimer();
        });
        
        collector.on('end', collected => {
            embedmsg.reactions.removeAll();
        });

	}
};