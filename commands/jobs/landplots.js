module.exports = {
    name: 'terrenos',
    aliases: ['landplots', 'terrains', 'lotes', 'plots'],
    category: 'none',
    description: 'Visualiza as informações de todos os seus terrenos',
    options: [],
    mastery: 25,
    companytype: 1,
	async execute(API, msg, company) {

        const Discord = API.Discord;
        const client = API.client;

        let pobj = await API.getInfo(msg.author, 'players')

        const embed = new Discord.MessageEmbed().setColor(`#b8312c`)
        if (!pobj.plots || Object.keys(pobj.plots).length == 0) {
            embed.addField(`❌ Não possui terrenos`, `Utilize \`${API.prefix}terrenoatual\` para adquirir um terreno`)
         await msg.quote(embed);
            return;
        }

        let x = 1
        let townnum = await API.townExtension.getTownNum(msg.author);
        let townname = await API.townExtension.getTownName(msg.author);
        for (let r of Object.keys(pobj.plots)) {

            r = pobj.plots[r]

            let areaplant = 0;
            if (r.plants) {
                for (const rarea of r.plants) {
                    areaplant += rarea.area
                }
            }
            // \nConservação do terreno: \`${r.cons}%\`
            embed.addField(`${townnum == r.loc ? '<:arrow:737370913204600853> ':''}<:terreno:765944910179336202> Terreno ${x}`, `Área máxima em m²: \`${r.area}m²\`\nLotes de plantação: \`${r.plants ? r.plants.length : 0}/5\`\nÁrea com plantação: \`${areaplant}m²\`\nLocalização: \`${API.townExtension.getTownNameByNum(r.loc)}\``)
            x++
        }
        await msg.quote(embed);

	}
};