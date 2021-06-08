module.exports = {
	name: 'ajuda',
	aliases: ['help', 'comandos', 'commands'],
    category: 'Outros',
    description: 'Visualiza os comandos disponíveis do bot',
	options: [{
        name: 'categoria',
        type: 'STRING',
        description: 'Digite o nome da categoria para obter a lista de comandos, descrição e alcunhas.',
        required: false
    }],
	mastery: 4,
	async execute(API, msg) {
		
		let args = API.args(msg);
		const Discord = API.Discord;

		if (args.length == 0) {
			const embed = new Discord.MessageEmbed()
			.setColor('#32a893')
			.setTitle('Olá, meu nome é Nisruksha!')
			.setDescription(`
<:info:736274028515295262> Olá ${msg.author}, sou o **Nisruksha**.
↳ Para me convidar para seu servidor ou entrar no meu, basta usar \`${API.prefix}convite\`

Acesse o tutorial do bot para saber a história e como usá-lo (Em construção) \`${API.prefix}tutorial\`

Apoie quem te convidou para o bot usando \`${API.prefix}apoiar <código>\`
Caso não tenha o código, peça para a pessoa utilizar \`${API.prefix}meucodigo\`

<:book:703298827888623647> Para saber mais sobre os comandos, separei algumas categorias para você listar!
↳ Utilize \`${API.prefix}ajuda <categoria>\`

<:list:736274028179750922> **Categorias** | ex: \`${API.prefix}ajuda economia\`
${API.helpExtension.getCategoryList()}`)

			await msg.quote(embed);
			return;
		}
		let categoria = args[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

		if (categoria.startsWith("eco")) {
			categoria = 'economia';
		}
		if (categoria.startsWith("maq")) {
			categoria = 'maquinas';
		}
		
		categoria = categoria.charAt(0).toUpperCase() + categoria.slice(1); 

			
		if (!(API.helpExtension.categoryExists(categoria))) {
			const embedtemp = await API.sendError(msg, `Você selecionou uma categoria inexistente!`, `ajuda <${API.helpExtension.category.join(' | ')}>`)
			await msg.quote(embedtemp)
			return;
		}

		const embed = new Discord.MessageEmbed();
		embed.setTitle(`<:info:736274028515295262> Categoria ${categoria.toUpperCase()}`);
		embed.setColor("#03d7fc");
		embed.setDescription(`${API.client.commands.filter((cmd) => cmd.category == categoria ).map((cmd) => `\`${API.prefix}${cmd.name}\` <:arrow:737370913204600853> ${cmd.description}${!cmd.aliases || cmd.aliases.length < 1 ? '': `\n › Alcunhas: [\`${cmd.aliases.slice(0, 5).map(a => a).join(', ')}\`]`}\n`).join('\n')}`);
		msg.quote(embed);

		
	}
};