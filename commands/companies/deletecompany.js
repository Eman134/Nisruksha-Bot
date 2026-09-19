const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const clientService = require('../../_classes/services/clientService');
const economyService = require('../../_classes/services/economy');
const prisma = require('../../_classes/prisma');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'fecharempresa',
    aliases: ['closecompany'],
    category: 'Empresas',
    description: 'Feche a sua empresa atual',
    mastery: 50,
    async execute(interaction) {
        const errorText = message => new TextDisplayBuilder().setContent(`<:error:736274028515295262> ${message}`);
        const replyError = message => interaction.reply({ components: [errorText(message)], flags: Discord.MessageFlags.IsComponentsV2 });
        if (!(await companyService.check.hasCompany(interaction.user.id))) return replyError('Você não possui uma empresa aberta para fecha-la!');
        const company = await companyService.get.companyByOwnerId(interaction.user.id);
        const locname = townsService.getTownNameByNum(company.loc);
        let townname = await townsService.getTownName(interaction.user.id);
        if (locname !== townname) return replyError(`Você precisa estar na mesma vila da empresa para fechar a empresa!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover\``);
        if (company.workers != null && company.workers.length > 0) return replyError('Você não pode fechar uma empresa antes de demitir os funcionários!\nUtilize `/demitir` para demitir seus funcionários');

        const r1 = 150000;
        const r2 = 150000;
        const r3 = 300000;
        const r4 = 75000;
        const total = r1 + r2 + r3 + r4;
        const user_id = BigInt(interaction.user.id);
        let playerobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
        const name = company.name;
        const type = company.type;
        const icon = companyService.e[companyService.types[type]].icon;
        townname = await townsService.getTownName(interaction.user.id);
        const baseFields = [
            ['📃 Informações da Empresa', `Nome: **${name}**\nSetor: **${icon} ${companyService.types[type].charAt(0).toUpperCase() + companyService.types[type].slice(1)}**\nLocalização: **${townname}**`],
            ['🧾 Contratos', `\`Termos de Compromisso\`\n${utility.format(r1)} ${utility.money} ${utility.moneyemoji}\n\`Compensação de Trabalho\`\n${utility.format(r2)} ${utility.money} ${utility.moneyemoji}\n\`Autorização de Recebimento\`\n${utility.format(r3)} ${utility.money} ${utility.moneyemoji}\n\`Instrumento Particular\`\n${utility.format(r4)} ${utility.money} ${utility.moneyemoji}`],
            ['📑 Requisitos de fechamento', `Valor final: **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** ${playerobj2.money >= total ? '✅' : '❌'}`]
        ];
        const buildContainer = (color, extra) => new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(...baseFields.concat(extra ? [extra] : []).map(([field, value]) => new TextDisplayBuilder().setContent(`**${field}**\n${value}`)));
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅');
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌');
        const message = (await interaction.reply({ components: [buildContainer(0x00e061), new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });
        let reacted = false;
        collector.on('collect', async b => {
            if (!b.deferred) b.deferUpdate().catch(error => reportError(error, 'command.fecharempresa.defer_update'));
            reacted = true;
            collector.stop();
            if (b.customId === 'cancel') {
                await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Fechamento cancelado', `Você cancelou o fechamento da empresa **${icon} ${name}**.`])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            playerobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
            const currentLoc = townsService.getTownNameByNum(company.loc);
            const currentTown = await townsService.getTownName(interaction.user.id);
            if (currentLoc !== currentTown) return interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha no fechamento', `Você precisa estar na mesma vila da empresa para fechar a empresa!\nSua vila atual: **${currentTown}**\nVila da empresa: **${currentLoc}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover ${currentLoc}\``])], flags: Discord.MessageFlags.IsComponentsV2 });
            if (company.workers != null && company.workers.length > 0) return interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha no fechamento', 'Você não pode fechar uma empresa antes de demitir os funcionários!\nUtilize `/demitir` para demitir seus funcionários'])], flags: Discord.MessageFlags.IsComponentsV2 });
            if (playerobj2.money < total) return interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha no fechamento', `Você não possui dinheiro o suficiente para fechar sua empresa!\nSeu dinheiro atual: **${utility.format(playerobj2.money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**`])], flags: Discord.MessageFlags.IsComponentsV2 });
            try {
                const currentCompany = await prisma.companies.findFirst({ where: { user_id }, select: { company_id: true } });
                if (currentCompany) await prisma.companies.delete({ where: { company_id_user_id: { company_id: String(currentCompany.company_id), user_id } } });
            } catch (err) {
                clientService.current.emit('error', err);
                throw err;
            }
            const code = company.company_id;
            economyService.money.remove(interaction.user.id, total);
            economyService.addToHistory(interaction.user.id, `Empresa fechada | - ${utility.format(total)} ${utility.moneyemoji}`);
            townname = await townsService.getTownName(interaction.user.id);
            await interaction.editReply({ components: [buildContainer(0xa60000, ['✅ Sucesso no fechamento', `Você acaba de fechar sua empresa **${icon} ${name}**!`])], flags: Discord.MessageFlags.IsComponentsV2 });
            clientService.current.guilds.cache.get('693150851396796446').channels.cache.get('747490313765126336').send({
                components: [new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent('## Empresa fechada!'), new TextDisplayBuilder().setContent(`**Informações da Empresa**\nFundador: ${interaction.user}\nNome: **${name}**\nSetor: **${icon} ${companyService.types[type].charAt(0).toUpperCase() + companyService.types[type].slice(1)}**\nLocalização: **${townname}**\nCódigo: **${code}**`))],
                flags: Discord.MessageFlags.IsComponentsV2
            });
        });
        collector.on('end', async () => {
            if (reacted) return;
            await interaction.editReply({ components: [new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent('**❌ Tempo expirado**\nVocê iria fechar a empresa **' + icon + ' ' + name + '**, porém o tempo expirou.'))], flags: Discord.MessageFlags.IsComponentsV2 });
        });
    }
};
