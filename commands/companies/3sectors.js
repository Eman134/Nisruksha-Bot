module.exports = {
    name: 'setores',
    aliases: ['sectors'],
    category: 'Empresas',
    description: 'Visualiza os setores de empresas e os comandos de cada um',
    mastery: 30,
	async execute(API, interaction) {

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

            butnList.push(API.createButton('home', 'PRIMARY', 'Início', '🏠', (current == "home" || allDisabled ? true : false)))

            for (i = 0; i < Object.keys(API.company.e).length; i++) {
                const sector = API.company.e[Object.keys(API.company.e)[i]]
                if (sector.description) butnList.push(API.createButton(sector.tipo+toString(), (current == sector.tipo+toString() ? 'SUCCESS': 'SECONDARY'), '', (sector.icon.split(':')[2] ? sector.icon.split(':')[2].replace('>', '') : sector.icon), (current == sector.tipo+toString() || allDisabled ? true : false)))
            }

            let totalcomponents = butnList.length % 5;
            if (totalcomponents == 0) totalcomponents = (butnList.length)/5;
            else totalcomponents = ((butnList.length-totalcomponents)/5);

            totalcomponents += 1

            for (x = 0; x < totalcomponents; x++) {
                const var1 = (x+1)*5-5
                const var2 = ((x+1)*5)
                const rowBtn = API.rowComponents(butnList.slice(var1, var2))
                if (rowBtn.components.length > 0) components.push(rowBtn)

            }

        }

		let embedinteraction = await interaction.reply({ embeds: [embed], components, fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            current = b.customId
            if (b.customId == 'home') {
                home()
            } else {
                embed.fields = []

                const type = parseInt(current)

				const cmdlist = API.client.commands.filter((cmd) => cmd.companytype == type)
            
				embed.setTitle(`<:info:736274028515295262> Comandos de ${API.company.types[type]} ${API.company.e[API.company.types[type]].icon}`);
                embed.setColor("#03d7fc");
                embed.setDescription(`${cmdlist.map((cmd) => `\`/${cmd.name}\` <:arrow:737370913204600853> ${cmd.description}${!cmd.aliases || cmd.aliases.length < 1 ? '': `\n › Alcunhas: [\`${cmd.aliases.slice(0, 5).map(a => a).join(', ')}\`]`}\n`).join('\n')}`);

			}
        
            reworkButtons(current)

            await interaction.editReply({embeds: [embed], components})

            collector.resetTimer()
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            
        });
        
        collector.on('end', collected => {
			reworkButtons(current, true)
            interaction.editReply({ embeds: [embed], components })
        });

	}
};