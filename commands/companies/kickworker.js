const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const clientService = require('../../_classes/services/clientService');
const config = require('../../_classes/config');
const companyInfo = require('../../_classes/services/companyInfo');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
    .addUserOption(option => option.setName('membro').setDescription('Mencione o membro que deseja demitir').setRequired(true))
    .addStringOption(option => option.setName('motivo').setDescription('Explique o motivo da demoção').setRequired(true));

module.exports = {
    name: 'demitir',
    aliases: ['demotar', 'expulsar'],
    category: 'Empresas',
    description: 'Demite um funcionário da sua empresa',
    data,
    mastery: 20,
    async execute(interaction) {
        const errorText = message => new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\n${message}`);
        const replyError = message => interaction.reply({ components: [errorText(message)], flags: Discord.MessageFlags.IsComponentsV2 });
        if (!(await companyService.check.hasCompany(interaction.user.id))) return replyError('Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize `/abrirempresa <setor> <nome>`');
        const member = interaction.options.getUser('membro');
        const motivo = interaction.options.getString('motivo');
        const company = await companyService.get.companyByOwnerId(interaction.user.id);
        if (company.workers == null || !company.workers.includes(member.id)) return replyError('Este funcionário não trabalha em sua empresa!\nVeja seus funcionários usando `/func`');
        const companyName = `${companyService.e[companyService.types[company.type]].icon} ${company.name}`;
        const buildContainer = (color, field, description, footer) => new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(
            new TextDisplayBuilder().setContent(field ? `**${field[0]}**\n${field[1]}` : description),
            ...(footer ? [new TextDisplayBuilder().setContent(`-# ${footer}`)] : [])
        );
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅');
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌');
        const message = (await interaction.reply({ components: [buildContainer(0x36393f, ['<a:loading:736625632808796250> Aguardando confirmação', `Você deseja demitir ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${companyName}**?`]), new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async b => {
            if (!b.deferred) b.deferUpdate().catch(error => reportError(error, 'command.demitir.defer_update'));
            reacted = true;
            collector.stop();
            if (b.customId === 'cancel') return interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Demissão cancelada', `Você cancelou a demissão de ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${companyName}**.`])], flags: Discord.MessageFlags.IsComponentsV2 });
            const currentCompany = await companyService.get.companyByOwnerId(interaction.user.id);
            if (currentCompany.workers == null || !currentCompany.workers.includes(member.id)) return interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha na demissão', 'Este funcionário não trabalha em sua empresa!\nVeja seus funcionários usando `/func`'])], flags: Discord.MessageFlags.IsComponentsV2 });
            if (await cacheListsService.waiting.includes(member.id, 'working')) return interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha na demissão', 'Você não pode demitir um funcionário enquanto o mesmo está trabalhando na mesma!'])], flags: Discord.MessageFlags.IsComponentsV2 });
            companyService.jobs.process.remove(member.id);
            await interaction.editReply({ components: [buildContainer(0x5bff45, ['✅ Demitido!', `Você demitiu ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${companyName}**!\nMotivo: ${motivo}`])], flags: Discord.MessageFlags.IsComponentsV2 });
            const company2 = await companyService.get.companyByOwnerId(interaction.user.id);
            const botowner = await clientService.current.users.fetch(config.owner[0]);
            try {
                await member.send({
                    components: [buildContainer(0xa60000, null, `Você foi demitido da empresa **${companyName}**\nMotivo: ${motivo}`, `Você está em consentimento em receber DM\'S do bot para ações da empresa onde trabalha!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)],
                    flags: Discord.MessageFlags.IsComponentsV2
                });
            } catch (error) {
                reportError(error, 'command.demitir.member_notification', { memberId: member.id });
            }
            const list = company2.workers;
            const index = list.indexOf(member.id);
            if (index > -1) list.splice(index, 1);
            companyInfo.set(interaction.user.id, company2.company_id, 'workers', list);
            const user_id = BigInt(member.id);
            await prisma.players.upsert({ where: { user_id }, update: { company: null }, create: { user_id, company: null, frames: [], badges: [] } });
            await prisma.players.upsert({ where: { user_id }, update: { companyact: null }, create: { user_id, companyact: null, frames: [], badges: [] } });
        });
        collector.on('end', async () => {
            if (reacted) return;
            await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Tempo expirado', `Você iria demitir ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${companyName}**, porém o tempo expirou.`])], flags: Discord.MessageFlags.IsComponentsV2 });
        });
    }
};
