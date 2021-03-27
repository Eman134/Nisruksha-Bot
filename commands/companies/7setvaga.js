module.exports = {
    name: 'setarvaga',
    aliases: ['vagas', 'vaga', 'setarvagas', 'setvagas'],
    category: 'Empresas',
    description: 'Abre ou fecha as vagas de funcionários na sua empresa',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        if (!(await API.company.check.hasCompany(msg.author))) {
            API.sendError(msg, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\``)
            return;
        }

        let args = API.args(msg)

        if (args.length == 0) {
            API.sendError(msg, `Você deve indicar se deseja liberar as vagas da empresa ou não **[on/off]**`, `vagas off`)
            return;
        }

        let boo = false;
        

        if (args[0] != 'on' && args[0] != 'off') {
            API.sendError(msg, `Você deve indicar se deseja liberar as vagas da empresa ou não **[on/off]**`, `vagas off`)
            return;
        }

        boo = (args[0] == 'on' ? boo = true : boo = false)

        const embed = new Discord.MessageEmbed()
        .setColor((boo ? '#5bff45':'#a60000'))
        .setDescription('Você setou as vagas da sua empresa para ' +  (boo ? '🟢':'🔴')  + ' **' + args[0] + '**')
        await msg.quote(embed)
        const companyid = await API.company.get.idByOwner(msg.author)
        API.setCompanieInfo(msg.author, companyid, 'openvacancie', boo)


	}
};