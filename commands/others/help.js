module.exports = {
	name: 'ajuda',
	aliases: ['help', 'comandos', 'commands'],
    category: 'Outros',
    description: 'Visualiza os comandos disponíveis do bot',
	mastery: 10,
	async execute(API, interaction) {

		const categorylist = API.helpExtension.getCategoryListObj()
		const Discord = API.Discord;

		function home() {
			embed.setColor('#32a893')
			.setTitle('Olá, meu nome é Nisruksha!')
			.setDescription(`<:info:736274028515295262> Olá ${interaction.user}, sou o **Nisruksha**.
↳ Para me convidar para seu servidor ou entrar no meu, basta usar \`/convite\`

Acesse o tutorial do bot para saber a história e como usá-lo (Em construção) \`/tutorial\`

Apoie quem te convidou para o bot usando \`/apoiar <código>\`
Caso não tenha o código, peça para a pessoa utilizar \`/meucodigo\`

<:book:703298827888623647> Para saber mais sobre os comandos, separei algumas categorias para você listar!

<:list:736274028179750922> **Categorias**
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

            butnList.push(API.createButton('home', 'PRIMARY', 'Início', '🏠', (current == "home" || allDisabled ? true : false)))

            for (i = 0; i < categorylist.length; i++) {
                butnList.push(API.createButton(categorylist[i], (current == categorylist[i] ? 'SUCCESS': 'SECONDARY'), categorylist[i], undefined, (current == categorylist[i] || allDisabled ? true : false)))
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

		const embedinteraction = await interaction.reply({ embeds: [embed], components, fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
			current = b.customId
            if (b.customId == 'home') {
                home()
            } else {

				const cmdlist = API.client.commands.filter((cmd) => cmd.category == current )
                const cmdmap = cmdlist.map((cmd) => `\`/${cmd.name}\` <:arrow:737370913204600853> ${cmd.description}${'\n › Maestria média: \`🔰\ ' + (cmd.mastery || 1) + '\`\n'}`).join('\n')
				embed.setTitle(`<:info:736274028515295262> Categoria ${b.customId.toUpperCase()}`);
				embed.setColor("#03d7fc");
				embed.setDescription(cmdmap);
				//embed.setDescription(`${cmdlist.map((cmd) => `\`/${cmd.name}\` <:arrow:737370913204600853> ${cmd.description}${!cmd.aliases || cmd.aliases.length < 1 ? '': `\n › Alcunhas: [\`${cmd.aliases.slice(0, 5).map(a => a).join(', ')}\`]`}\n`).join('\n')}`);
			}
        
            reworkButtons(current)

            await interaction.editReply({ embeds: [embed], components })

            collector.resetTimer()
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            
        });
        
        collector.on('end', collected => {
			reworkButtons(current, true)
            interaction.editReply({ embeds: [embed], components })
        });
		
	}
};