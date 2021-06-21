module.exports = {
    name: 'mochila',
    aliases: ['backpack', 'bag', 'inv'],
    category: 'Players',
    description: 'Visualiza os itens que estão na sua mochila',
    options: [{
        name: 'membro',
        type: 'USER',
        description: 'Veja a mochila de algum membro',
        required: false
    }],
    mastery: 7,
	async execute(API, msg) {

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
            if (msg.options.size == 0) {
                member = msg.author
            } else {
                member = msg.options.get('membro').user
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

        function reworkButtons({ currentpage, totalpages }) {

            const butnList = []
            const components = []
      
            butnList.push(API.createButton('backward', 'PRIMARY', '', '852241487064596540', (currentpage == 1 ? true : false)))
            butnList.push(API.createButton('forward', 'PRIMARY', '', '737370913204600853', (currentpage == totalpages ? true : false)))

            components.push(API.rowButton(butnList))
      
            return components
      
        }

        const embed = new Discord.MessageEmbed()

        await setInfosEmbed(embed, member)

        let components = reworkButtons({ currentpage, totalpages })

        if (currentpage == totalpages || totalpages == 0) components = []
        
        const embedmsg = await msg.quote({ embeds: [embed], components });
        
        if (currentpage == totalpages || totalpages == 0) return

        const filter = i => i.user.id === msg.author.id;
        
        let collector = embedmsg.createMessageComponentInteractionCollector(filter, { time: 30000 });
        
        collector.on('collect', async(b) => {
            
            b.deferUpdate()

            if (b.customID == 'forward'){
                if (currentpage < totalpages) currentpage += 1;
            } else if (b.customID == 'backward') {
                if (currentpage > 1) currentpage -= 1;
            }

            components = reworkButtons({ currentpage, totalpages })

            const embed = new Discord.MessageEmbed()
            
            await setInfosEmbed(embed, member)
           
            embedmsg.edit({ embeds: [embed], components });
            collector.resetTimer();
        });
        
        collector.on('end', collected => {
            embedmsg.edit({ embeds: [embed] });
        });

	}
};