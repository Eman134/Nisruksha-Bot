const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('área').setDescription('Digite o tamanho da área para realizar a plantação').setRequired(true))
.addIntegerOption(option => option.setName('quantia').setDescription('Digite a quantia de sementes que deseja plantar').setRequired(true))
.addStringOption(option => option.setName('semente').setDescription('Digite o nome da semente que deseja plantar').setRequired(true))

module.exports = {
    name: 'plantar',
    aliases: ['plant'],
    category: 'none',
    description: 'Faça um lote de plantação em seu terreno',
    data,
    mastery: 20,
    companytype: 1,
	async execute(API, interaction, company) {

        const Discord = API.Discord;

        let pobj = await DatabaseManager.get(interaction.user.id, 'players')

        const area = interaction.options.getInteger('área')
        const quantia = interaction.options.getInteger('quantia')
        const semente = interaction.options.getString('semente').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        let allplots = pobj.plots
        let plot
        let townnum = await API.townExtension.getTownNum(interaction.user.id);
        let contains = false
        if (pobj.plots) {
            for (let r of Object.keys(pobj.plots)) {
                r = pobj.plots[r]
                if (townnum == r.loc) {

                    let areaplant = 0;
                    if (r.plants) {
                        for (const rarea of r.plants) {
                            areaplant += rarea.area
                        }
                    }

                    r.areaplant = areaplant

                    contains = true
                    plot = r;
                }
            }
        }

        
        if (!contains) {
            const embedtemp = await API.sendError(interaction, `Você não possui terrenos na sua vila atual!\nPara adquirir um terreno utilize \`/terrenoatual\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (plot.plants && plot.plants.length == 5) {
            const embedtemp = await API.sendError(interaction, `Você atingiu o máximo de lotes no seu terreno para plantação!\nVisualize seu terreno utilizando \`/terrenoatual\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (area < 5) {
            const embedtemp = await API.sendError(interaction, `A __área__ precisa ser um número e no mínimo 5!\nUtilize \`/plantar <área em m²> <quantia> <semente>\``, `plantar 10 20 Soja`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (quantia < 5) {
            const embedtemp = await API.sendError(interaction, `A __quantia__ precisa ser no __mínimo 5__!\nUtilize \`/plantar <área em m²> <quantia> <semente>\``, `plantar 10 20 Soja`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (quantia > 20) {
            const embedtemp = await API.sendError(interaction, `A __quantia__ precisa ser no __máximo 20__!\nUtilize \`/plantar <área em m²> <quantia> <semente>\``, `plantar 10 20 Soja`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (area > plot.area-plot.areaplant) {
            const embedtemp = await API.sendError(interaction, `Você não possui __${area}m²__ disponíveis para outra plantação no seu terreno!\nVisualize seu terreno utilizando \`/terrenoatual\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (plot.adubacao && plot.adubacao < 10) {
            const embedtemp = await API.sendError(interaction, `Você não possui adubação o suficiente em seu terreno para realizar uma plantação\nUtilize \`/adubar\` para adubar o terreno atual`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let seedobj = API.itemExtension.getObj().drops.filter(i => i.type == "seed");

        let contains2 = false;

        let seed

        let seedstorage = await DatabaseManager.get(interaction.user.id, 'storage')
        for (const r of seedobj) {

            if (r.displayname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') == semente) {
                seed = r
                contains2 = true
                
                if (quantia > seedstorage[seed.displayname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()]) {
                    contains2 = false
                }

                break;
            }
        }

        if (!contains2) {
            const embedtemp = await API.sendError(interaction, `Você não possui **${quantia}x ${seed ? seed.icon + ' ' + seed.displayname : semente}** na sua mochila!\nVisualize suas sementes na mochila utilizando \`/mochila\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        seed.qnt = quantia
        seed.area = area

        let adubacao = 100
        if (plot.adubacao) adubacao = plot.adubacao

        let maxtime = API.company.jobs.agriculture.calculatePlantTime(seed, adubacao)

        if (pobj.perm != null || pobj.perm == 5) maxtime = Math.round(90*maxtime/100)
        
        let lote = {
            loc: townnum,
            seed: seed,
            area: area,
            qnt: quantia,
            adubacao: 0,
            planted: Date.now(),
            maxtime: maxtime
        }
        let plants = plot.plants || []
        plants.push(lote)

        plot.plants = plants

        if (!plot.adubacao) plot.adubacao = 100

        if (plot.adubacao > 0) plot.adubacao -= 1
        
        allplots[townnum] = plot

        DatabaseManager.set(interaction.user.id, 'players', 'plots', allplots)
        DatabaseManager.set(interaction.user.id, 'storage', seed.name, seedstorage[seed.displayname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()]-quantia)

        const embed = new Discord.MessageEmbed()

        embed.setColor('RANDOM')
        embed.setTitle(seed.icon + ' Plantação realizada!')
        embed.setDescription(`Você cercou __${area}m²__ do seu terreno e plantou **${quantia}x ${seed.icon} ${seed.displayname}**\nPara ver as informações dos seus lotes e terreno utilize \`/terrenoatual\``)
        await interaction.reply({ embeds: [embed] })

	}
};