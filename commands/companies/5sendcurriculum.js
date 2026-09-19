const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const townsService = require('../../_classes/services/towns');
const config = require('../../_classes/config');
const companyInfo = require('../../_classes/services/companyInfo');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
    .addStringOption(option => option.setName('empresa').setDescription('Digite o código da empresa que deseja enviar o currículo').setRequired(true));

module.exports = {
    name: 'enviarcurriculo',
    aliases: ['enviarcurrículo', 'enviarc'],
    category: 'Empresas',
    description: 'Envia um currículo de trabalho para alguma empresa',
    data,
    mastery: 20,
    async execute(interaction) {
        const company_id = interaction.options.getString('empresa');
        const errorText = (message, usage) => new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\n${message}${usage ? `\nExemplo de uso: \`/${usage}\`` : ''}`);
        const replyError = (message, usage) => interaction.reply({ components: [errorText(message, usage)], flags: Discord.MessageFlags.IsComponentsV2 });

        if (await companyService.check.hasCompany(interaction.user.id)) return replyError('Você não pode enviar currículo para alguma empresa pois você já possui uma');
        if (await companyService.check.isWorker(interaction.user.id)) return replyError('Você não pode enviar currículo para outra empresa pois você já trabalha em uma');

        let company;
        try {
            company = await companyService.get.companyById(company_id);
            if (!company) return replyError(`O id de empresa ${company_id} é inexistente!\nPesquise empresas utilizando \`/empresas\``);
        } catch (err) {
            clientService.current.emit('error', err);
            throw err;
        }

        const locname = townsService.getTownNameByNum(company.loc);
        const townname = await townsService.getTownName(interaction.user.id);
        if (locname !== townname) return replyError(`Você precisa estar na mesma vila da empresa para enviar o currículo!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover\``, `mover ${locname}`);

        const user_id = BigInt(interaction.user.id);
        const pobjmaq = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
        if (pobjmaq.level < 3) return replyError(`Você não possui nível o suficiente para enviar currículo!\nSeu nível atual: **${pobjmaq.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``);
        if (!(await companyService.check.hasVacancies(company_id))) return replyError('Esta empresa não possui vagas ou estão fechadas, tente novamente quando houver vagas!');
        if (company.curriculum != null && company.curriculum.length >= 10) return replyError('Esta empresa já possui o máximo de currículos pendentes **10/10**.');

        const clist0 = company.curriculum == null ? [] : company.curriculum;
        if (clist0.some(r => r.includes(interaction.user.id))) return replyError('Você já enviou um currículo para esta empresa! Aguarde uma resposta.\nOBS: Para receber uma resposta você deve manter sua DM liberada.');

        const companyName = `${companyService.e[companyService.types[company.type]].icon} ${company.name}`;
        const consentFooter = 'Ao enviar o currículo você está em consentimento em receber DM\'S do bot de quando você for aceito ou negado na empresa!';
        function buildContainer(color, field, footer = consentFooter) {
            return new ContainerBuilder()
                .setAccentColor(color)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${field[0]}**\n${field[1]}`), new TextDisplayBuilder().setContent(`-# ${footer}`));
        }

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅');
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌');
        const message = (await interaction.reply({
            components: [buildContainer(0x36393f, ['<a:loading:736625632808796250> Aguardando confirmação', `Você deseja enviar seu currículo para a empresa **${companyName}**?`]), new ActionRowBuilder().addComponents(btn0, btn1)],
            flags: Discord.MessageFlags.IsComponentsV2,
            withResponse: true
        })).resource.message;
        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;

        collector.on('collect', async b => {
            if (b.user.id !== interaction.user.id) return;
            if (!b.deferred) b.deferUpdate().catch(error => reportError(error, 'command.enviarcurriculo.defer_update'));
            reacted = true;
            collector.stop();
            if (b.customId === 'cancel') {
                await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Currículo cancelado', `Você cancelou o envio de currículo para a empresa **${companyName}**.`])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            const companyobj = await companyService.get.companyById(company_id);
            if (!companyobj) {
                await interaction.editReply({ components: [errorText(`O id de empresa ${company_id} é inexistente!\nPesquise empresas utilizando \`/empresas\``)], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            if (companyobj.curriculum != null && companyobj.curriculum.includes(interaction.user.id)) {
                await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha no currículo', 'Você já enviou um currículo para esta empresa! Aguarde uma resposta..'])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            if (await companyService.check.hasCompany(interaction.user.id)) {
                await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha no currículo', 'Você não pode enviar currículo para alguma empresa pois você já possui uma'])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            if (await companyService.check.isWorker(interaction.user.id)) {
                await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha no currículo', 'Você não pode enviar currículo para outra empresa pois você já trabalha em uma'])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            if (!(await companyService.check.hasVacancies(company_id))) {
                await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Falha no currículo', 'Esta empresa não possui vagas ou estão fechadas, tente novamente quando houver vagas!'])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            const clist = companyobj.curriculum == null ? [] : companyobj.curriculum;
            clist.push(`${interaction.user.id};${Date.now()}`);
            const botowner = await clientService.current.users.fetch(config.owner[0]);
            try {
                const companyowner = await clientService.current.users.fetch(String(companyobj.user_id));
                companyInfo.set(companyowner.id, companyobj.company_id, 'curriculum', clist);
                await companyowner.send({
                    components: [new ContainerBuilder().setAccentColor(0x5bff45).addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`O membro ${interaction.user} enviou um currículo para a sua empresa!\nUtilize \`/curriculos\` em algum servidor do bot para visualizar os currículos pendentes.`),
                        new TextDisplayBuilder().setContent(`-# Você está em consentimento em receber DM\'S do bot para ações de funcionários na sua empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                    )],
                    flags: Discord.MessageFlags.IsComponentsV2
                });
            } catch (error) {
                reportError(error, 'command.enviarcurriculo.owner_notification', { companyId: companyobj.company_id });
            }

            await interaction.editReply({ components: [buildContainer(0x5bff45, ['✅ Currículo enviado', `Você enviou o currículo para a empresa **${companyName}**!\nAguarde uma resposta da empresa.\nOBS: Para receber uma resposta você deve manter sua DM liberada.`])], flags: Discord.MessageFlags.IsComponentsV2 });
        });

        collector.on('end', async () => {
            if (reacted) return;
            await interaction.editReply({ components: [buildContainer(0xa60000, ['❌ Tempo expirado', `Você iria enviar o currículo para a empresa **${companyName}**, porém o tempo expirou.`])], flags: Discord.MessageFlags.IsComponentsV2 });
        });
    }
};
