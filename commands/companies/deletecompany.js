const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    requiredServices: ["Discord","client","company","createButton","eco","format","money","moneyemoji","rowComponents","sendError","townExtension"],
    name: 'fecharempresa',
    aliases: ['closecompany'],
    category: 'Empresas',
    description: 'Feche a sua empresa atual',
    mastery: 50,
	async execute(interaction, svcDiscord, svcClient, svcCompany, svcCreateButton, svcEco, svcFormat, svcMoney, svcMoneyemoji, svcRowComponents, svcSendError, svcTownExtension) {
        if (!(await svcCompany.check.hasCompany(interaction.user.id))) {
            const embedtemp = await svcSendError(interaction, `Você não possui uma empresa aberta para fecha-la!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let company = await svcCompany.get.companyByOwnerId(interaction.user.id)

        let locname = svcTownExtension.getTownNameByNum(company.loc)
        let townname = await svcTownExtension.getTownName(interaction.user.id);
        
        if (locname != townname) {
            const embedtemp = await svcSendError(interaction, `Você precisa estar na mesma vila da empresa para fechar a empresa!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover\``, `mover ${locname}`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (company.workers != null && company.workers.length > 0) {
            const embedtemp = await svcSendError(interaction, `Você não pode fechar uma empresa antes de demitir os funcionários!\nUtilize \`/demitir\` para demitir seus funcionários`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        let total = 0;
        
        let r1 = 150000;
        let r2 = 150000;
        let r3 = 300000;
        let r4 = 75000;
        
        total = r1+r2+r3+r4

        let playerobj2 = await DatabaseManager.get(interaction.user.id, 'players')

        const name = company.name
        const type = company.type
        const icon = svcCompany.e[svcCompany.types[type]].icon;
        let townname2 = await svcTownExtension.getTownName(interaction.user.id);
        
        const embed = new svcDiscord.MessageEmbed()
        .addField(`📃 Informações da Empresa`, `Nome: **${name}**\nSetor: **${icon} ${svcCompany.types[company.type].charAt(0).toUpperCase() + svcCompany.types[company.type].slice(1)}**\nLocalização: **${townname2}**`)
        .addField(`🧾 Contratos`, `\`Termos de Compromisso\`\n${svcFormat(r1)} ${svcMoney} ${svcMoneyemoji}\n\`Compensação de Trabalho\`\n${svcFormat(r2)} ${svcMoney} ${svcMoneyemoji}\n\`Autorização de Recebimento\`\n${svcFormat(r3)} ${svcMoney} ${svcMoneyemoji}\n\`Instrumento Particular\`\n${svcFormat(r4)} ${svcMoney} ${svcMoneyemoji}`)
        .addField(`📑 Requisitos de fechamento`, `Valor final: **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** ${playerobj2.svcMoney >= total ? '✅':'❌'}`)
        .setColor('#00e061')

        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.fecharempresa.defer_update'));
            reacted = true;
            collector.stop();

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Fechamento cancelado', `
                Você cancelou o fechamento da empresa **${icon} ${name}**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            playerobj = await DatabaseManager.get(interaction.user.id, 'machines')
            playerobj2 = await DatabaseManager.get(interaction.user.id, 'players')

            let locname = svcTownExtension.getTownNameByNum(company.loc)
            let townname = await svcTownExtension.getTownName(interaction.user.id);
            
            if (locname != townname) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no fechamento', `Você precisa estar na mesma vila da empresa para fechar a empresa!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover ${locname}\``)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (company.workers != null && company.workers.length > 0) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no fechamento', `Você não pode fechar uma empresa antes de demitir os funcionários!\nUtilize \`/demitir\` para demitir seus funcionários`)
                interaction.editReply({ embeds: [embed], components: [] });
                return
            }

            if (playerobj2.svcMoney < total) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no fechamento', `Você não possui dinheiro o suficiente para fechar sua empresa!\nSeu dinheiro atual: **${svcFormat(playerobj2.svcMoney)}/${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}**`)
                interaction.editReply({ embeds: [embed], components: [] });
                return
            }

            try {
                await DatabaseManager.deleteMany('companies', { user_id: interaction.user.id });
            }catch (err) { 
                svcClient.emit('error', err)
                throw err 
            }

            const code = company.company_id
            
            svcEco.svcMoney.remove(interaction.user.id, total)
            svcEco.addToHistory(interaction.user.id, `Empresa fechada | - ${svcFormat(total)} ${svcMoneyemoji}`)
            townname = await svcTownExtension.getTownName(interaction.user.id);
            embed
            .addField(`✅ Sucesso no fechamento`, `Você acaba de fechar sua empresa **${icon} ${name}**!`)
            .setColor('#a60000')
            interaction.editReply({ embeds: [embed], components: [] });

            const embed2 = new svcDiscord.MessageEmbed();
            embed2.setTitle(`Empresa fechada!`) 
            .addField(`Informações da Empresa`, `Fundador: ${interaction.user}\nNome: **${name}**\nSetor: **${icon} ${svcCompany.types[company.type].charAt(0).toUpperCase() + svcCompany.types[company.type].slice(1)}**\nLocalização: **${townname}**\nCódigo: **${code}**`)
            embed2.setColor('#a60000')
            svcClient.guilds.cache.get('693150851396796446').channels.cache.get('747490313765126336').send({ embeds: [embed2] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new svcDiscord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria fechar a empresa **${icon} ${name}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });
        
	}
};
