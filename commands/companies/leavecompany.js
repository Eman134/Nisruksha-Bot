const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const config = require('../../_classes/config');
const companyInfo = require('../../_classes/services/companyInfo');
const prisma = require('../../_classes/prisma');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'sairdaempresa',
    aliases: ['sairempresa', 'medemitir'],
    category: 'Empresas',
    description: 'Se demite da empresa que você trabalha atualmente',
    mastery: 50,
    async execute(interaction) {
        const errorText = message => new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\n${message}`);
        const replyError = message => interaction.reply({ components: [errorText(message)], flags: Discord.MessageFlags.IsComponentsV2 });
        if (!(await companyService.check.isWorker(interaction.user.id))) return replyError(`Você não trabalha em nenhuma empresa para se demitir${await companyService.check.hasCompany(interaction.user.id) ? '\nCaso deseja fechar sua empresa utilize `/fecharempresa`' : ''}`);
        if (await cacheListsService.waiting.includes(interaction.user.id, 'working')) return replyError('Você não pode sair de uma empresa enquanto está trabalhando na mesma!');
        const user_id = BigInt(interaction.user.id);
        let pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
        const company = await companyService.get.companyById(pobj.company);
        const companyName = `${companyService.e[companyService.types[company.type]].icon} ${company.name}`;
        const buildContainer = (color, field, description, footer) => new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(
            new TextDisplayBuilder().setContent(field ? `**${field[0]}**\n${field[1]}` : description),
            ...(footer ? [new TextDisplayBuilder().setContent(`-# ${footer}`)] : [])
        );
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅');
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌');
        const message = (await interaction.reply({ components: [buildContainer(0x36393f, ['<a:loading:736625632808796250> Aguardando confirmação', `Você deseja se demitir da empresa **${companyName}**?`]), new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async b => {
            if (b.user.id !== interaction.user.id) return;
            if (!b.deferred) b.deferUpdate().catch(error => reportError(error, 'command.sairempresa.defer_update'));
            reacted = true;
            collector.stop();
            if (b.customId === 'cancel') return interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Demissão cancelada', `Você cancelou a própria demissão na empresa **${companyName}**.`])], flags: Discord.MessageFlags.IsComponentsV2 });
            if (!(await companyService.check.isWorker(interaction.user.id))) return interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha na demissão', `Você não trabalha em nenhuma empresa para se demitir${await companyService.check.hasCompany(interaction.user.id) ? '\nCaso deseja fechar sua empresa utilize `/fecharempresa`' : ''}`])], flags: Discord.MessageFlags.IsComponentsV2 });
            companyService.jobs.process.remove(interaction.user.id);
            await interaction.editReply({ components: [buildContainer(0x5bff45, ['✅ Demitido!', `Você se demitiu da empresa **${companyName}**!`])], flags: Discord.MessageFlags.IsComponentsV2 });
            pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
            const company2 = await companyService.get.companyById(pobj.company);
            const owner = await companyService.get.ownerById(pobj.company);
            const botowner = await clientService.current.users.fetch(config.owner[0]);
            try {
                await owner.send({
                    components: [buildContainer(0xa60000, null, `O trabalhador ${interaction.user.tag} (${interaction.user.id}) se demitiu da sua empresa!`, `Você está em consentimento em receber DM\'S do bot para ações de funcionários na sua empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)],
                    flags: Discord.MessageFlags.IsComponentsV2
                });
            } catch (error) {
                reportError(error, 'command.sairempresa.owner_notification', { ownerId: owner.id });
            }
            const list = company2.workers;
            const index = list.indexOf(interaction.user.id);
            if (index > -1) list.splice(index, 1);
            companyInfo.set(owner.id, company.company_id, 'workers', list);
            await prisma.players.update({ where: { user_id }, data: { company: null } });
            await prisma.players.update({ where: { user_id }, data: { companyact: null } });
        });
        collector.on('end', async () => {
            if (reacted) return;
            await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Tempo expirado', `Você iria se demitir da empresa **${companyName}**, porém o tempo expirou.`])], flags: Discord.MessageFlags.IsComponentsV2 });
        });
    }
};
