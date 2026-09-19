const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const clientService = require('../../_classes/services/clientService');
const economyService = require('../../_classes/services/economy');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'fecharempresa',
    aliases: ['closecompany'],
    category: 'Empresas',
    description: 'Feche a sua empresa atual',
    mastery: 50,
	async execute(interaction) {

        
        if (!(await companyService.check.hasCompany(interaction.user.id))) {
            const embedtemp = await utility.sendError(interaction, `Você não possui uma empresa aberta para fecha-la!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let company = await companyService.get.companyByOwnerId(interaction.user.id)

        let locname = townsService.getTownNameByNum(company.loc)
        let townname = await townsService.getTownName(interaction.user.id);
        
        if (locname != townname) {
            const embedtemp = await utility.sendError(interaction, `Você precisa estar na mesma vila da empresa para fechar a empresa!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover\``, `mover ${locname}`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (company.workers != null && company.workers.length > 0) {
            const embedtemp = await utility.sendError(interaction, `Você não pode fechar uma empresa antes de demitir os funcionários!\nUtilize \`/demitir\` para demitir seus funcionários`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        let total = 0;
        
        let r1 = 150000;
        let r2 = 150000;
        let r3 = 300000;
        let r4 = 75000;
        
        total = r1+r2+r3+r4

        const user_id = BigInt(interaction.user.id)
        let playerobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })

        const name = company.name
        const type = company.type
        const icon = companyService.e[companyService.types[type]].icon;
        let townname2 = await townsService.getTownName(interaction.user.id);
        
        const embed = new Discord.EmbedBuilder()
        .addFields({ name: `📃 Informações da Empresa`, value: `Nome: **${name}**\nSetor: **${icon} ${companyService.types[company.type].charAt(0).toUpperCase() + companyService.types[company.type].slice(1)}**\nLocalização: **${townname2}**` })
        .addFields({ name: `🧾 Contratos`, value: `\`Termos de Compromisso\`\n${utility.format(r1)} ${utility.money} ${utility.moneyemoji}\n\`Compensação de Trabalho\`\n${utility.format(r2)} ${utility.money} ${utility.moneyemoji}\n\`Autorização de Recebimento\`\n${utility.format(r3)} ${utility.money} ${utility.moneyemoji}\n\`Instrumento Particular\`\n${utility.format(r4)} ${utility.money} ${utility.moneyemoji}` })
        .addFields({ name: `📑 Requisitos de fechamento`, value: `Valor final: **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** ${playerobj2.money >= total ? '✅':'❌'}` })
        .setColor('#00e061')

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.fecharempresa.defer_update'));
            reacted = true;
            collector.stop();

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Fechamento cancelado', value: `
                Você cancelou o fechamento da empresa **${icon} ${name}**.` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
            playerobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })

            let locname = townsService.getTownNameByNum(company.loc)
            let townname = await townsService.getTownName(interaction.user.id);
            
            if (locname != townname) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha no fechamento', value: `Você precisa estar na mesma vila da empresa para fechar a empresa!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover ${locname}\`` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (company.workers != null && company.workers.length > 0) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha no fechamento', value: `Você não pode fechar uma empresa antes de demitir os funcionários!\nUtilize \`/demitir\` para demitir seus funcionários` })
                interaction.editReply({ embeds: [embed], components: [] });
                return
            }

            if (playerobj2.money < total) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha no fechamento', value: `Você não possui dinheiro o suficiente para fechar sua empresa!\nSeu dinheiro atual: **${utility.format(playerobj2.money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**` })
                interaction.editReply({ embeds: [embed], components: [] });
                return
            }

            try {
                const user_id = BigInt(interaction.user.id);
                const currentCompany = await prisma.companies.findFirst({ where: { user_id }, select: { company_id: true } });
                if (currentCompany) {
                    await prisma.companies.delete({
                        where: { company_id_user_id: { company_id: String(currentCompany.company_id), user_id } }
                    });
                }
            }catch (err) { 
                clientService.current.emit('error', err)
                throw err 
            }

            const code = company.company_id
            
            economyService.money.remove(interaction.user.id, total)
            economyService.addToHistory(interaction.user.id, `Empresa fechada | - ${utility.format(total)} ${utility.moneyemoji}`)
            townname = await townsService.getTownName(interaction.user.id);
            embed
            .addFields({ name: `✅ Sucesso no fechamento`, value: `Você acaba de fechar sua empresa **${icon} ${name}**!` })
            .setColor('#a60000')
            interaction.editReply({ embeds: [embed], components: [] });

            const embed2 = new Discord.EmbedBuilder();
            embed2.setTitle(`Empresa fechada!`) 
            .addFields({ name: `Informações da Empresa`, value: `Fundador: ${interaction.user}\nNome: **${name}**\nSetor: **${icon} ${companyService.types[company.type].charAt(0).toUpperCase() + companyService.types[company.type].slice(1)}**\nLocalização: **${townname}**\nCódigo: **${code}**` })
            embed2.setColor('#a60000')
            clientService.current.guilds.cache.get('693150851396796446').channels.cache.get('747490313765126336').send({ embeds: [embed2] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new Discord.EmbedBuilder();
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `Você iria fechar a empresa **${icon} ${name}**, porém o tempo expirou.` })
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });
        
	}
};
