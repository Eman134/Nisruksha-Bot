const Discord = require('../../_classes/discordCompat');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const companyService = require('../../_classes/services/company');
const economyService = require('../../_classes/services/economy');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'pegarvara',
    aliases: ['getrod', 'trocarvara', 'comprarvara'],
    category: 'none',
    description: 'Compre ou troque uma vara de pesca',
    mastery: 30,
    companytype: 6,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

        
        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        if (pobj2.level < 3) {
            const embedtemp = await utility.sendError(interaction, `Você não possui nível o suficiente para pegar uma vara de pesca!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'fishing')) {
            const embedtemp = await utility.sendError(interaction, `Você não pode comprar/trocar uma vara enquanto estiver pescando! [[VER PESCA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'fishing')})`);
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let total = 1200*(pobj2.level)
        let disp = companyService.jobs.fish.rods.possibilities(pobj2.level)

        const embed = new Discord.MessageEmbed()
        .setColor('#63b8ae')
        .setTitle('🎣 Varas disponíveis')
        .setDescription('**Explicação:** Ao confirmar a reação, o sistema irá sortear uma vara dentre as disponíveis, e a vara de pesca será essa.\n**Preço atual: ' + utility.format(total) + ' ' + utility.money + '** ' + utility.moneyemoji)
        for (i = 0; i < disp.length; i++) {
            embed.addField(disp[i].icon + ' ' + disp[i].name, `\`${companyService.jobs.formatStars(disp[i].stars)}\`\nGasto por turno: **${disp[i].sta} 🔸**\nProfundidade: **${disp[i].profundidade}m**\nProfundidade Máxima: **${disp[i].maxprofundidade}m**`)
        }

        function reworkBtns(hasrod) {

            const btn0 = utility.createButton(hasrod ? 'troca' : 'compra', 'SECONDARY', hasrod ? 'Trocar vara' : 'Comprar vara', hasrod ? '🔁' : '✅')
            const btn1 = utility.createButton('cancel', 'SECONDARY', 'Cancelar', '❌')

            return [utility.rowComponents([btn0, btn1])]
        }

        let pobjcheck = await DatabaseManager.get(interaction.user.id, 'players')
        if (pobjcheck.rod == null) delete pobjcheck.rod


        let embedinteraction = await interaction.reply({ embeds: [embed], components: reworkBtns(pobjcheck.rod), withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;

            let troca = b.customId == 'troca'

            let pobj2 = await DatabaseManager.get(interaction.user.id, 'players')
            if (pobj2.rod == null) delete pobj2.rod
            let pobj3 = await DatabaseManager.get(interaction.user.id, 'machines')

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.bgetrod.defer_update'); });

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField(`❌ ${pobj2.rod ? 'Troca' : 'Compra'} cancelada`, `Você cancelou a ${pobj2.rod ? 'troca' : 'compra'} da sua vara de pesca!.`)
                interaction.editReply({ embeds: [embed] });
				collector.stop();
                return;
            }

            playerobj = await DatabaseManager.get(interaction.user.id, 'machines')

            if (pobj2.money < total) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha na ${pobj2.rod ? 'troca' : 'compra'}`, `Você não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${utility.format(pobj2.money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**`)
                interaction.editReply({ embeds: [embed] });
				collector.stop();
                return
            }
            
            economyService.money.remove(interaction.user.id, total)
            economyService.addToHistory(interaction.user.id, `${pobj2.rod ? 'Troca' : 'Compra'} de vara de pesca | - ${utility.format(total)} ${utility.moneyemoji}`)

            let vara = companyService.jobs.fish.rods.get(pobj3.level)
            embed.fields = []

            for (let i = 0; i < disp.length; i++) {
                embed.addField((disp[i] == vara ? ( troca ? '🔁':'✅') : ' ') + disp[i].icon + ' ' + disp[i].name, `\`${companyService.jobs.formatStars(disp[i].stars)}\`\nGasto por turno: **${disp[i].sta} 🔸**\nProfundidade: **${disp[i].profundidade}m**\nProfundidade Máxima: **${disp[i].maxprofundidade}m**`)
            }

            embed
            .addField(`✅ Sucesso na ${pobj2.rod ? 'troca' : 'compra'}`, `Você acaba de ${pobj2.rod ? 'trocar sua vara para:' : 'comprar uma vara:'} **${vara.icon} ${vara.name}**\nPara testar sua nova vara de pesca utilize \`/pescar\`!`)
            .setColor('#5bff45')
            interaction.editReply({ embeds: [embed], components: reworkBtns(true) });
            DatabaseManager.set(interaction.user.id, 'players', 'rod', vara)

            collector.resetTimer();
            
        });
        
        collector.on('end', async collected => {
            if (reacted) {
                return interaction.editReply({ embeds: [embed] });;
            }
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria ${pobj2.rod ? 'trocar sua' : 'comprar uma'} vara de pesca, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });


	}
};
