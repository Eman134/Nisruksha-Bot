module.exports = {
    name: 'setartaxa',
    aliases: ['settaxa', 'settx'],
    category: 'Empresas',
    description: 'Seta a taxa de venda de itens da sua empresa',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        if (!(await API.company.check.hasCompany(msg.author))) {
            API.sendError(msg, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\``)
            return;
        }

        const check = await API.checkCooldown(msg.author, "settaxa");
        if (check) {

            let cooldown = await API.getCooldown(msg.author, "settaxa");
            const embed = new Discord.MessageEmbed()
            .setColor('#b8312c')
            .setDescription('🕑 Aguarde mais `' + API.ms(cooldown) + '` para setar a taxa novamente!')
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            await msg.quote(embed);
            return;
        }

        let args = API.args(msg)

        if (args.length == 0) {
            API.sendError(msg, `Você deve digitar o valor da taxa para funcionários! **[1%-50%]**\nA taxa padrão é de **25%**`, `setartaxa 25%`)
            return;
        }

        let taxa = args[0].replace(/%/g, '')

        if (!API.isInt(taxa)) {
            API.sendError(msg, `Você deve digitar o valor da taxa __EM NÚMERO__ para funcionários! **[1%-50%]**\nA taxa padrão é de **25%**`, `setartaxa 25%`)
            return;
        }
        taxa = parseInt(taxa)
        if (taxa < 1 || taxa > 50) {
            API.sendError(msg, `Você deve digitar o valor da taxa entre 1% e 50%! **[1%-50%]**\nA taxa padrão é de **25%**`, `setartaxa 25%`)
            return;
        }


        const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setDescription('Você setou a taxa da sua empresa para __' + taxa + '%__')
        await msg.quote(embed)
        const companyid = await API.company.get.idByOwner(msg.author)
        API.setCompanieInfo(msg.author, companyid, 'taxa', taxa)
        API.setCooldown(msg.author, "settaxa", 86400);


	}
};