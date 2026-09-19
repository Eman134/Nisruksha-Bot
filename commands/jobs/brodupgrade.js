const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const cacheListsService = require('../../_classes/services/cacheLists');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const companyService = require('../../_classes/services/company');
const economyService = require('../../_classes/services/economy');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'uparvara',
    aliases: ['rodupgrade', 'varaupgrade', 'rodup', 'varaup', 'uv'],
    category: 'none',
    description: 'Dê upgrade na vara de pesca para melhorar a pescaria',
    mastery: 40,
    companytype: 6,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

                
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        if (pobj.rod == null) delete pobj.rod

        if (await cacheListsService.waiting.includes(interaction.user.id, 'fishing')) {
            const embedtemp = await utility.sendError(interaction, `Você não pode upar uma vara enquanto estiver pescando! [[VER PESCA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'fishing')})`);
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (!pobj.rod) {
            const embedtemp = await utility.sendError(interaction, `Você precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`/pegarvara\``)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        let total = Math.round(1200*pobj.rod.level*2)

        const embed = new Discord.EmbedBuilder()
        .setColor('#63b8ae')
        .setTitle(pobj.rod.icon + ' ' + pobj.rod.name)
        .setDescription(`\`${companyService.jobs.formatStars(pobj.rod.stars)}\`\nGasto por turno: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPreço do upgrade: **${total} ${utility.money} ${utility.moneyemoji}**`)
        let embedinteraction = (await interaction.reply({ embeds: [embed], withResponse: true})).resource.message
        embedinteraction.react('🔼')

        const filter = (reaction, user) => {
            return user.id === interaction.user.id;
        };
        
        const collector = embedinteraction.createReactionCollector({ filter, time: 30000 });
        let reacted = false;
		let upgraded = false
        collector.on('collect', async (reaction, user) => {
            if (!(['🔼'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();

            let pobj2 = await DatabaseManager.get(interaction.user.id, 'players')
            if (pobj2.rod == null) delete pobj2.rod

            playerobj = await DatabaseManager.get(interaction.user.id, 'machines')

            if (!pobj2.rod) {
                embed.setColor('#a60000');
                embed.addFields({ name: `❌ Falha no upgrade`, value: `Você precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`/pegarvara\`` })
                interaction.editReply({ embeds: [embed] });
                return
            }
    

            if (pobj2.money < total) {
                embed.setColor('#a60000');
                embed.addFields({ name: `❌ Falha no upgrade`, value: `Você não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${utility.format(pobj2.money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**` })
                interaction.editReply({ embeds: [embed] });
                return
            }

            let list = []

            if (pobj2.rod.stars < 5) {
                list.push(0)
            }

            if (pobj2.rod.sta > 6) {
                list.push(1)
            }
            

            if (!pobj2.rod.maxprofundidade) {
                if (Object.keys(companyService.jobs.fish.rods.obj).length == 0) companyService.jobs.fish.rods.load();
                let equipobj = companyService.jobs.fish.rods.obj;
        
                for (const r of equipobj) {
                    
                    if (pobj2.rod.level == r.level) {
                        pobj2.rod.maxprofundidade = r.maxprofundidade;
                    }
        
                }

            }
            
            if (pobj2.rod.profundidade < pobj2.rod.maxprofundidade) {
                list.push(2)
            }

            if (list.length == 0) {
                embed.setColor('#a60000');
                embed.addFields({ name: `❌ Falha no upgrade`, value: `Você não possui mais upgrades disponíveis nessa vara de pesca!` })
                return interaction.editReply({ embeds: [embed] });
            }
			upgraded = true

            economyService.money.remove(interaction.user.id, total)
            economyService.addToHistory(interaction.user.id, `Upgrade da vara de pesca | - ${utility.format(total)} ${utility.moneyemoji}`)

            if (list.includes(0)) {

                pobj2.rod.stars += 1
                DatabaseManager.set(interaction.user.id, 'players', 'rod', pobj2.rod)
                embed.setColor('#5bff45')
                .setDescription(`\`${companyService.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${utility.money} ${utility.moneyemoji}**`)
                embed.addFields({ name: `✅ Sucesso no upgrade`, value: `Você gastou **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** e adicionou uma estrela ⭐ ao nível da sua vara de pesca!` })
                return interaction.editReply({ embeds: [embed] });

            } if (list.includes(1)) {
                pobj2.rod.sta -= 1
                DatabaseManager.set(interaction.user.id, 'players', 'rod', pobj2.rod)
                embed.setColor('#5bff45')
                .setDescription(`\`${companyService.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${utility.money} ${utility.moneyemoji}**`)
                embed.addFields({ name: `✅ Sucesso no upgrade`, value: `Você gastou **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** e diminuiu o gasto de estamina 🔸 da sua vara de pesca!` })
                return interaction.editReply({ embeds: [embed] });

            } if (list.includes(2)) {
                pobj2.rod.profundidade = (parseFloat(pobj2.rod.profundidade) + parseFloat("0." + utility.random(2, 5))).toFixed(1)

                if (pobj2.rod.profundidade >= pobj2.rod.maxprofundidade) pobj2.rod.profundidade = pobj2.rod.maxprofundidade

                DatabaseManager.set(interaction.user.id, 'players', 'rod', pobj2.rod)

                embed.setColor('#5bff45')
                .setDescription(`\`${companyService.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${utility.money} ${utility.moneyemoji}**`)
                embed.addFields({ name: `✅ Sucesso no upgrade`, value: `Você gastou **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** e aumentou a profundidade alcançada pela sua vara de pesca!` })
                return interaction.editReply({ embeds: [embed] })
            } else {
                embed.setColor('#a60000');
                embed.addFields({ name: `❌ Falha no upgrade`, value: `Você não possui mais upgrades disponíveis nessa vara de pesca!` })
                return interaction.editReply({ embeds: [embed] });
            }
            
            
        });
        
        collector.on('end', async collected => {
            if (reacted || upgraded) return;
            const embed = new Discord.EmbedBuilder();
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `Você iria upar sua vara de pesca, porém o tempo expirou.` })
            interaction.editReply({ embeds: [embed] });
            return;
        });

	}
};
