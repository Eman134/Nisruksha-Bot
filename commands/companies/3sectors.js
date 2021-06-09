module.exports = {
    name: 'setores',
    aliases: ['sectors'],
    category: 'Empresas',
    description: 'Visualiza os setores de empresas disponíveis',
    options: [],
    mastery: 30,
	async execute(API, msg) {

		const Discord = API.Discord;

        const embed = new Discord.MessageEmbed()
        function home() {
            embed.fields = []
            embed.setTitle('👨🏽‍🌾 | Setores de Empresas')
            embed.setDescription('')
            for (i = 0; i < Object.keys(API.company.e).length; i++) {
                const sector = API.company.e[Object.keys(API.company.e)[i]]
                const name = Object.keys(API.company.e)[i]
                if (sector.description) embed.addField(`**${sector.icon} ${name.charAt(0).toUpperCase() + name.slice(1)}**`, sector.description)
            }
        }
			
		home()

		let components = []
		let current = "home"

        reworkButtons(current)
        
        function reworkButtons(current, allDisabled) {

            let butnList = []

            components = []

            butnList.push(API.createButton('home', 'blurple', 'Início', '🏠', (current == "home" || allDisabled ? true : false)))

            for (i = 0; i < Object.keys(API.company.e).length; i++) {
                const sector = API.company.e[Object.keys(API.company.e)[i]]
                if (sector.description) butnList.push(API.createButton(sector.tipo+toString(), 'grey', '', (sector.icon.split(':')[2] ? sector.icon.split(':')[2].replace('>', '') : sector.icon), (current == sector.tipo+toString() || allDisabled ? true : false)))
            }

            let totalcomponents = butnList.length % 5;
            if (totalcomponents == 0) totalcomponents = (butnList.length)/5;
            else totalcomponents = ((butnList.length-totalcomponents)/5);

            totalcomponents += 1

            for (x = 0; x < totalcomponents; x++) {
                const var1 = (x+1)*5-5
                const var2 = ((x+1)*5)
                const rowBtn = API.rowButton(butnList.slice(var1, var2))
                if (rowBtn.components.length > 0) components.push(rowBtn)

            }

        }

		let embedmsg = await msg.quote({ embed, components });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 30000 });
        
        collector.on('collect', async (b) => {
            current = b.id
            if (b.id == 'home') {
                home()
            } else {
                embed.fields = []

                const type = parseInt(current)

				const cmdlist = API.client.commands.filter((cmd) => cmd.companytype == type)
            
				embed.setTitle(`<:info:736274028515295262> Comandos de ${API.company.types[type]} ${API.company.e[API.company.types[type]].icon}`);
                embed.setColor("#03d7fc");
                embed.setDescription(`${cmdlist.map((cmd) => `\`${API.prefix}${cmd.name}\` <:arrow:737370913204600853> ${cmd.description}${!cmd.aliases || cmd.aliases.length < 1 ? '': `\n › Alcunhas: [\`${cmd.aliases.slice(0, 5).map(a => a).join(', ')}\`]`}\n`).join('\n')}`);

			}
        
            reworkButtons(current)

            await embedmsg.edit({embed, components})

            collector.resetTimer()
            b.defer()
            
        });
        
        collector.on('end', collected => {
			reworkButtons(current, true)
            embedmsg.edit({ embed, components })
        });

	}
};