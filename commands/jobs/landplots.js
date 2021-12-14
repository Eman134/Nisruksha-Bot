const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'terrenos',
    aliases: ['landplots', 'terrains', 'lotes', 'plots'],
    category: 'none',
    description: 'Visualiza as informações de todos os seus terrenos',
    mastery: 25,
    companytype: 1,
	async execute(API, interaction, company) {

        const Discord = API.Discord;
        const client = API.client;

        let pobj = await DatabaseManager.get(interaction.user.id, 'players')

        const embed = new Discord.MessageEmbed().setColor(`#b8312c`)
        if (!pobj.plots || Object.keys(pobj.plots).length == 0) {
            embed.addField(`❌ Não possui terrenos`, `Utilize \`/terrenoatual\` para adquirir um terreno`)
         await interaction.reply({ embeds: [embed] });
            return;
        }

        let x = 1
        let townnum = await API.townExtension.getTownNum(interaction.user.id);
        let townname = await API.townExtension.getTownName(interaction.user.id);
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
        await interaction.reply({ embeds: [embed] });

	}
};