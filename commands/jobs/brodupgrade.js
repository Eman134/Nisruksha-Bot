const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","cacheLists","client","company","eco","format","money","moneyemoji","random","sendError"],
    name: 'uparvara',
    aliases: ['rodupgrade', 'varaupgrade', 'rodup', 'varaup', 'uv'],
    category: 'none',
    description: 'Dê upgrade na vara de pesca para melhorar a pescaria',
    mastery: 40,
    companytype: 6,
	async execute(interaction, svcDiscord, svcCacheLists, svcClient, svcCompany, svcEco, svcFormat, svcMoney, svcMoneyemoji, svcRandom, svcSendError, company) {
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        if (pobj.rod == null) delete pobj.rod

        if (await svcCacheLists.waiting.includes(interaction.user.id, 'fishing')) {
            const embedtemp = await svcSendError(interaction, `Você não pode upar uma vara enquanto estiver pescando! [[VER PESCA]](${await svcCacheLists.waiting.getLink(interaction.user.id, 'fishing')})`);
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (!pobj.rod) {
            const embedtemp = await svcSendError(interaction, `Você precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`/pegarvara\``)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        let total = Math.round(1200*pobj.rod.level*2)

        const embed = new svcDiscord.MessageEmbed()
        .setColor('#63b8ae')
        .setTitle(pobj.rod.icon + ' ' + pobj.rod.name)
        .setDescription(`\`${svcCompany.jobs.formatStars(pobj.rod.stars)}\`\nGasto por turno: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPreço do upgrade: **${total} ${svcMoney} ${svcMoneyemoji}**`)
        let embedinteraction = await interaction.reply({ embeds: [embed], withResponse: true})
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
                embed.addField(`❌ Falha no upgrade`, `Você precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`/pegarvara\``)
                interaction.editReply({ embeds: [embed] });
                return
            }
    

            if (pobj2.svcMoney < total) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${svcFormat(pobj2.svcMoney)}/${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}**`)
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
                if (Object.keys(svcCompany.jobs.fish.rods.obj).length == 0) svcCompany.jobs.fish.rods.load();
                let equipobj = svcCompany.jobs.fish.rods.obj;
        
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
                embed.addField(`❌ Falha no upgrade`, `Você não possui mais upgrades disponíveis nessa vara de pesca!`)
                return interaction.editReply({ embeds: [embed] });
            }
			upgraded = true

            svcEco.svcMoney.remove(interaction.user.id, total)
            svcEco.addToHistory(interaction.user.id, `Upgrade da vara de pesca | - ${svcFormat(total)} ${svcMoneyemoji}`)

            if (list.includes(0)) {

                pobj2.rod.stars += 1
                DatabaseManager.set(interaction.user.id, 'players', 'rod', pobj2.rod)
                embed.setColor('#5bff45')
                .setDescription(`\`${svcCompany.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${svcMoney} ${svcMoneyemoji}**`)
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** e adicionou uma estrela ⭐ ao nível da sua vara de pesca!`)
                return interaction.editReply({ embeds: [embed] });

            } if (list.includes(1)) {
                pobj2.rod.sta -= 1
                DatabaseManager.set(interaction.user.id, 'players', 'rod', pobj2.rod)
                embed.setColor('#5bff45')
                .setDescription(`\`${svcCompany.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${svcMoney} ${svcMoneyemoji}**`)
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** e diminuiu o gasto de estamina 🔸 da sua vara de pesca!`)
                return interaction.editReply({ embeds: [embed] });

            } if (list.includes(2)) {
                pobj2.rod.profundidade = (parseFloat(pobj2.rod.profundidade) + parseFloat("0." + svcRandom(2, 5))).toFixed(1)

                if (pobj2.rod.profundidade >= pobj2.rod.maxprofundidade) pobj2.rod.profundidade = pobj2.rod.maxprofundidade

                DatabaseManager.set(interaction.user.id, 'players', 'rod', pobj2.rod)

                embed.setColor('#5bff45')
                .setDescription(`\`${svcCompany.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${svcMoney} ${svcMoneyemoji}**`)
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** e aumentou a profundidade alcançada pela sua vara de pesca!`)
                return interaction.editReply({ embeds: [embed] })
            } else {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você não possui mais upgrades disponíveis nessa vara de pesca!`)
                return interaction.editReply({ embeds: [embed] });
            }
            
            
        });
        
        collector.on('end', async collected => {
            if (reacted || upgraded) return;
            const embed = new svcDiscord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria upar sua vara de pesca, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed] });
            return;
        });

	}
};
