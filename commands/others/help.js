module.exports = {
	name: 'ajuda',
	aliases: ['help', 'comandos', 'commands'],
    category: 'Outros',
    description: 'Visualiza os comandos disponíveis do bot',
	mastery: 10,
	async execute(API, msg) {

		const categorylist = API.helpExtension.getCategoryListObj()
		const Discord = API.Discord;

		function home() {
			embed.setColor('#32a893')
			.setTitle('Olá, meu nome é Nisruksha!')
			.setDescription(`<:info:736274028515295262> Olá ${msg.author}, sou o **Nisruksha**.
↳ Para me convidar para seu servidor ou entrar no meu, basta usar \`${API.prefix}convite\`

Acesse o tutorial do bot para saber a história e como usá-lo (Em construção) \`${API.prefix}tutorial\`

Apoie quem te convidou para o bot usando \`${API.prefix}apoiar <código>\`
Caso não tenha o código, peça para a pessoa utilizar \`${API.prefix}meucodigo\`

<:book:703298827888623647> Para saber mais sobre os comandos, separei algumas categorias para você listar!
↳ Utilize \`${API.prefix}ajuda <categoria>\`

<:list:736274028179750922> **Categorias** | ex: \`${API.prefix}ajuda economia\`
${API.helpExtension.getCategoryList()}`)
		}

		const embed = new Discord.MessageEmbed()
			
		home()

		let components = []
		let current = "home"

        reworkButtons(current)
        
        function reworkButtons(current, allDisabled) {

            let butnList = []

            components = []

            butnList.push(API.createButton('home', 'blurple', 'Início', '🏠', (current == "home" || allDisabled ? true : false)))

            for (i = 0; i < categorylist.length; i++) {
                butnList.push(API.createButton(categorylist[i], (current == categorylist[i] ? 'green': 'grey'), categorylist[i], undefined, (current == categorylist[i] || allDisabled ? true : false)))
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

				const cmdlist = API.client.commands.filter((cmd) => cmd.category == current )
            
				embed.setTitle(`<:info:736274028515295262> Categoria ${b.id.toUpperCase()}`);
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