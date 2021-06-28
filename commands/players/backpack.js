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

        let sorter = 0
        let sortermode = 0
        let currentsort = 0

        let totalpages = arrayitens.length % 10;
        if (totalpages == 0) totalpages = (arrayitens.length)/10;
        else totalpages = ((arrayitens.length-totalpages)/10)+1;

        let currentpage = 1

        if (totalpages == 0) currentpage = 0

        async function setInfosEmbed(embed, member) {
    
            const map = array2.map(crate => `**${crate.split(';')[1]}x** ${API.crateExtension.obj[crate.split(';')[0]].icon} ${API.crateExtension.obj[crate.split(';')[0]].name} | **ID: ${crate.split(';')[0]}**`).join('\n');
            
            arrayitens = arrayitens.sort(function(a, b){

                if (sorter == 0) return b.size - a.size

                if (sorter == 1 && a.rarity && b.rarity) {
                    const rarities = {
                        "common": 0,
                        "uncommon": 1,
                        "rare": 2,
                        "epic": 3,
                        "lendary": 4,
                        "mythic": 5
                    }
                    return rarities[b.rarity] - rarities[a.rarity]
                    
                }

                if (sorter == 2) {
                    if(a.displayname < b.displayname) { 
                        return -1; 
                    }
                    if(a.displayname > b.displayname) { 
                        return 1; 
                    }
                }

                return b.size - a.size;
            })

            if (sortermode == 1) arrayitens = arrayitens.reverse()

            embed
            .setColor('#a85a32')
            .setTitle(backpack.icon + ' ' + backpack.name)
            .setAuthor(`Mochila de ${member.tag}`, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .addField(`📦 Caixas misteriosas`, `Para abrir uma caixa utilize \`${API.prefix}abrircaixa <ID DA CAIXA> [quantia]\`\nPara visualizar recompensas de uma caixa use \`${API.prefix}recc <ID DA CAIXA>\`\n` + (array2.length <= 0 ? '**Não possui caixas misteriosas**' : `${map}`))
            
            embed.addField(`💠 Itens [${arrayitens.length}/${backpack.customitem.typesmax}]`, `Para vender itens utilize \`${API.prefix}venderitem\`\nPara usar itens utilize \`${API.prefix}usaritem\`\nOBS: Itens que podem ser usados são marcados com 💫`)
            //for (i = 1; i < totalpages; i++) {
            const mapitens = arrayitens.slice((currentpage*10)-10, currentpage*10).map((i2) => `${i2.rarity != "" ? `[${API.itemExtension.translateRarity(i2.rarity)}] `:''}**${i2.size}x** ${i2.icon} ${i2.displayname}${i2.usavel ? ` 💫` : ''}`).join('\n')
            embed.addField(`Itens Página ${currentpage}/${totalpages} ${sorter == 0 ? '🔢' : sorter == 1 ? '<:raro:852302870074359838>' : '🔠'}${sortermode == 0 ? '<:up:833837888634486794>':'<:down:833837888546275338>'}`, (arrayitens.length <= 0 ? '**Não possui itens**' : `${mapitens}`))
           // }
            return embed
        }

        function reworkButtons({ currentpage, totalpages }) {

            const butnList = []
            const components = []
      
            butnList.push(API.createButton('backward', 'PRIMARY', '', '852241487064596540', (currentpage == 1 ? true : false)))
            butnList.push(API.createButton('forward', 'PRIMARY', '', '737370913204600853', (currentpage == totalpages ? true : false)))

            // Sorters
            butnList.push(API.createButton('sort0', 'SECONDARY', 'Quantidade', '🔢'))
            butnList.push(API.createButton('sort1', 'SECONDARY', 'Raridade', '852302870074359838'))
            butnList.push(API.createButton('sort2', 'SECONDARY', 'Alfabeto', '🔠'))

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


            if (!(b.user.id === msg.author.id)) return
            
            b.deferUpdate()

            if (b.customID == 'forward'){
                if (currentpage < totalpages) currentpage += 1;
            } else if (b.customID == 'backward') {
                if (currentpage > 1) currentpage -= 1;
            } 

            if (b.customID.startsWith('sort')) {
                if (currentsort == parseInt(b.customID.replace('sort', ''))) {
                    sortermode == 0 ? sortermode = 1 : sortermode = 0
                } else {
                    sortermode = 0
                    sorter = parseInt(b.customID.replace('sort', ''))
                    currentsort = parseInt(b.customID.replace('sort', ''))
                }
            }

            components = reworkButtons({ currentpage, totalpages })

            const embed = new Discord.MessageEmbed()
            
            await setInfosEmbed(embed, member)
           
            embedmsg.edit({ embeds: [embed], components });
            collector.resetTimer();
        });
        
        collector.on('end', collected => {
            embedmsg.edit({ embeds: [embed], components: [] });
        });

	}
};