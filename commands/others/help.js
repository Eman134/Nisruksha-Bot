const helpService = require('../../_classes/services/help');
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const { reportError } = require('../../_classes/debug');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');

module.exports = {
	name: 'ajuda',
	aliases: ['help', 'comandos', 'commands'],
    category: 'Outros',
    description: 'Visualiza os comandos disponíveis do bot',
	mastery: 10,
	async execute(interaction) {

		const categorylist = helpService.getCategoryListObj()
		let display = { color: 0x32a893, title: 'Olá, meu nome é Nisruksha!', description: '' };

		function buildContainer() {
			return new ContainerBuilder().setAccentColor(display.color).addTextDisplayComponents(new TextDisplayBuilder().setContent([
				`## ${display.title}`,
				display.description
			].filter(Boolean).join('\n\n')));
		}
		
		function home() {
            display = { color: 0x32a893, title: 'Olá, meu nome é Nisruksha!', description: `<:info:736274028515295262> Olá ${interaction.user}, sou o **Nisruksha**.
↳ Para me convidar para seu servidor ou entrar no meu, basta usar \`/convite\`

Acesse o tutorial do bot para saber a história e como usá-lo (Em construção) \`/tutorial\`

Apoie quem te convidou para o bot usando \`/apoiar <código>\`
Caso não tenha o código, peça para a pessoa utilizar \`/meucodigo\`

<:book:703298827888623647> Para saber mais sobre os comandos, separei algumas categorias para você listar!

<:list:736274028179750922> **Categorias**
${helpService.getCategoryList()}` };
		}
			
		home()

		let components = []
		let current = "home"

        reworkButtons(current)
        
        function reworkButtons(current, allDisabled) {

            let butnList = []

            components = []

            butnList.push(utility.createButton('home', 'PRIMARY', 'Início', '🏠', (current == "home" || allDisabled ? true : false)))

            for (let i = 0; i < categorylist.length; i++) {
                butnList.push(utility.createButton(categorylist[i], (current == categorylist[i] ? 'SUCCESS': 'SECONDARY'), categorylist[i], undefined, (current == categorylist[i] || allDisabled ? true : false)))
            }

            let totalcomponents = butnList.length % 5;
            if (totalcomponents == 0) totalcomponents = (butnList.length)/5;
            else totalcomponents = ((butnList.length-totalcomponents)/5);

            totalcomponents += 1

            for (let x = 0; x < totalcomponents; x++) {
                const var1 = (x+1)*5-5
                const var2 = ((x+1)*5)
                 const rowBtn = new ActionRowBuilder().addComponents(...butnList.slice(var1, var2))
                if (rowBtn.components.length > 0) components.push(rowBtn)

            }

        }

        const embedinteraction = (await interaction.reply({ components: [buildContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
			current = b.customId
            if (b.customId == 'home') {
                home()
            } else {

				const cmdlist = clientService.current.commands.filter((cmd) => cmd.category == current )
                const cmdmap = cmdlist.map((cmd) => `\`/${cmd.name}\` <:arrow:737370913204600853> ${cmd.description}${'\n › Maestria média: \`🔰\ ' + (cmd.mastery || 1) + '\`\n'}`).join('\n')
				display = { title: `<:info:736274028515295262> Categoria ${b.customId.toUpperCase()}`, color: 0x03d7fc, description: cmdmap };
			}
        
            reworkButtons(current)

            await interaction.editReply({ components: [buildContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2 })

            collector.resetTimer()
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.ajuda.defer_update'); });
            
        });
        
        collector.on('end', collected => {
			reworkButtons(current, true)
             interaction.editReply({ components: [buildContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2 })
        });
		
	}
};
