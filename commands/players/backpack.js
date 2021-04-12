module.exports = {
    name: 'mochila',
    aliases: ['backpack', 'bag', 'inv'],
    category: 'Players',
    description: 'Visualiza os itens que estão na sua mochila',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        let member;
        let args = API.args(msg)
        if (msg.mentions.users.size < 1) {
            if (args.length == 0) {
                member = msg.author;
            } else {
                let member2 = await API.client.users.fetch(args[0])
                if (!member2) {
                    member = msg.author
                } else {
                    member = member2
                }
            }
        } else {
            member = msg.mentions.users.first();
        }

        let arraycrates = await API.crateExtension.getCrates(member);
        let array2 = []
        for (const crate of arraycrates) {
            if (parseInt(crate.split(";")[1]) > 0){
                array2.push(crate)
            }
        }


        let arrayitens = await API.company.jobs.itens.get(member, true)

        let mapitens = arrayitens.sort(function(a, b){
            return b.size - a.size;
        }).map(i => `**${i.size}x ${i.icon} ${i.displayname}**`).join('\n')

        const map = array2.map(crate => `**${crate.split(';')[1]}x** ${API.crateExtension.obj[crate.split(';')[0]].icon} ${API.crateExtension.obj[crate.split(';')[0]].name} | **ID: ${crate.split(';')[0]}**`).join('\n');
        const pieces = await API.maqExtension.getPieces(member);
        const piecesmap = pieces.map((p, index) => `**${p.size}x** ${p.icon} ${p.name} | **ID: ${index+1}**`).join('\n');
        const embed = new Discord.MessageEmbed()
        .setColor('#a85a32')
        .setAuthor(`Mochila de ${member.tag}`, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .addField(`🧩 Placas de Aprimoramento`, `\nPara equipar uma placa utilize \`${API.prefix}equipar <ID DA PLACA>\`\n` + (pieces.length <= 0 ? '**Não possui peças de aprimoramento**' : `${piecesmap}`))
        .addField(`📦 Caixas misteriosas`, `Para abrir uma caixa use \`${API.prefix}abrircaixa <ID DA CAIXA> [quantia]\`\nPara visualizar recompensas de uma caixa use \`${API.prefix}recc <ID DA CAIXA>\`\n` + (array2.length <= 0 ? '**Não possui caixas misteriosas**' : `${map}`))
        .addField(`🦴 Itens [${arrayitens.length}/10]`, `Para vender itens use \`${API.prefix}venderitem\`\n` + (arrayitens.length <= 0 ? '**Não possui itens**' : `${mapitens}`))
        msg.quote(embed);

	}
};