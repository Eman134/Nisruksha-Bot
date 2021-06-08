module.exports = {
	name: 'ajudaempresa',
	aliases: ['helpcompany', 'companycmds', 'cmdscompany'],
    category: 'Empresas',
    description: 'Visualiza os comandos de trabalhos da sua empresa',
	options: [],
	mastery: 50,
	async execute(API, msg) {
		
		let args = API.args(msg);
		const Discord = API.Discord;

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa de para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            await msg.quote(embedtemp)
            return true;
        }
        
        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
        } else {
            company = await API.company.get.company(msg.author);
        }

		const embed = new Discord.MessageEmbed();
		embed.setTitle(`<:info:736274028515295262> Comandos de ${API.company.types[company.type]}`);
		embed.setColor("#03d7fc");
		embed.setDescription(`${API.client.commands.filter((cmd) => cmd.companytype == company.type).map((cmd) => `\`${API.prefix}${cmd.name}\` <:arrow:737370913204600853> ${cmd.description}${!cmd.aliases || cmd.aliases.length < 1 ? '': `\n › Alcunhas: [\`${cmd.aliases.slice(0, 5).map(a => a).join(', ')}\`]`}\n`).join('\n')}`);
		msg.quote(embed);

		
	}
};