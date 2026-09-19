const Discord = require('discord.js');
const crateExtensionService = require('../../_classes/services/crateExtension');
const shopService = require('../../_classes/services/shop');
const itemsService = require('../../_classes/services/items');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja a mochila de algum membro'))

module.exports = {
    name: 'mochila',
    aliases: ['backpack', 'bag', 'inv'],
    category: 'Players',
    description: 'Visualiza os itens que estão na sua mochila',
    data,
    mastery: 7,
	async execute(interaction) {

        
        let member = interaction.options.getUser('membro') || interaction.user

        let arraycrates = await crateExtensionService.getCrates(member.id);
        let array2 = []
        for (const crate of arraycrates) {
            if (parseInt(crate.split(";")[1]) > 0){
                array2.push(crate)
            }
        }

        const utilsobj = await DatabaseManager.get(member.id, 'players_utils')

        let backpackid = utilsobj.backpack;
        let backpack = shopService.getProduct(backpackid);

        let arrayitens = await itemsService.getInv(member.id, true)

        let sorter = 0
        let sortermode = 0
        let currentsort = 0

        let totalpages = arrayitens.length % 10;
        if (totalpages == 0) totalpages = (arrayitens.length)/10;
        else totalpages = ((arrayitens.length-totalpages)/10)+1;

        let currentpage = 1

        if (totalpages == 0) currentpage = 0

        async function setInfosEmbed(embed, member) {
    
            const map = array2.map(crate => `**${crate.split(';')[1]}x** ${crateExtensionService.obj[crate.split(';')[0]].icon} ${crateExtensionService.obj[crate.split(';')[0]].name} | **ID: ${crate.split(';')[0]}**`).join('\n');
            
            arrayitens = arrayitens.sort(function(a, b){

                if (sorter == 0) return b.qnt - a.qnt

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
            .setAuthor({ name: `Mochila de ${member.tag}`, iconURL: member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
            .addFields({ name: `📦 Caixas misteriosas`, value: `Para abrir uma caixa utilize \`/abrircaixa <ID DA CAIXA> [quantia]\`\nPara visualizar recompensas de uma caixa use \`/recompensascaixa <ID DA CAIXA>\`\n` + (array2.length <= 0 ? '**Não possui caixas misteriosas**' : `${map}`) })
            
            embed.addFields({ name: `💠 Itens [${arrayitens.length}/${backpack.customitem.typesmax}]`, value: `Para vender itens utilize \`/venderitem\`\nPara usar itens utilize \`/usaritem\`\nOBS: Itens que podem ser usados são marcados com 💫` })
            //for (i = 1; i < totalpages; i++) {
            const mapitens = arrayitens.slice((currentpage*10)-10, currentpage*10).map((i2) => `${i2.rarity != "" ? `[${itemsService.translateRarity(i2.rarity)}] `:''}**${i2.size}x** ${i2.icon} ${i2.displayname}${i2.usavel ? ` 💫` : ''}`).join('\n')
            embed.addFields({ name: `Itens Página ${currentpage}/${totalpages} ${sorter == 0 ? '🔢' : sorter == 1 ? '<:raro:852302870074359838>' : '🔠'}${sortermode == 0 ? '<:up:833837888634486794>':'<:down:833837888546275338>'}`, value: (arrayitens.length <= 0 ? '**Não possui itens**' : `${mapitens}`) })
           // }
            return embed
        }

        function reworkButtons({ currentpage, totalpages }) {

            const butnList = []
            const components = []
      
            butnList.push(utility.createButton('backward', 'PRIMARY', '', '852241487064596540', (currentpage == 1 ? true : false)))
            butnList.push(utility.createButton('forward', 'PRIMARY', '', '737370913204600853', (currentpage == totalpages ? true : false)))

            // Sorters
            butnList.push(utility.createButton('sort0', 'SECONDARY', 'Quantidade', '🔢'))
            butnList.push(utility.createButton('sort1', 'SECONDARY', 'Raridade', '852302870074359838'))
            butnList.push(utility.createButton('sort2', 'SECONDARY', 'Alfabeto', '🔠'))

            components.push(utility.rowComponents(butnList))
      
            return components
      
        }

        const embed = new Discord.EmbedBuilder()

        await setInfosEmbed(embed, member)

        let components = reworkButtons({ currentpage, totalpages })

        if (currentpage == totalpages || totalpages == 0) components = []
        
        const embedinteraction = (await interaction.reply({ embeds: [embed], components, withResponse: true })).resource.message;
        
        if (currentpage == totalpages || totalpages == 0) return

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        
        collector.on('collect', async(b) => {

            b.deferUpdate()

            if (b.customId == 'forward'){
                if (currentpage < totalpages) currentpage += 1;
            } else if (b.customId == 'backward') {
                if (currentpage > 1) currentpage -= 1;
            } 

            if (b.customId.startsWith('sort')) {
                if (currentsort == parseInt(b.customId.replace('sort', ''))) {
                    sortermode == 0 ? sortermode = 1 : sortermode = 0
                } else {
                    sortermode = 0
                    sorter = parseInt(b.customId.replace('sort', ''))
                    currentsort = parseInt(b.customId.replace('sort', ''))
                }
            }

            components = reworkButtons({ currentpage, totalpages })

            const embed = new Discord.EmbedBuilder()
            
            await setInfosEmbed(embed, member)
           
            interaction.editReply({ embeds: [embed], components });
            collector.resetTimer();
        });
        
        collector.on('end', collected => {
            interaction.editReply({ embeds: [embed], components: [] });
        });

	}
};
