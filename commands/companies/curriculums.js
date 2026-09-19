const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const config = require('../../_classes/config');
const companyInfo = require('../../_classes/services/companyInfo');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
    .addSubcommand(subcommand => subcommand.setName('lista').setDescription('Veja a lista de currículos atual'))
    .addSubcommand(subcommand => subcommand.setName('aceitar').setDescription('Aceita ou nega um currículo na sua empresa').addIntegerOption(option => option.setName('id-currículo').setDescription('Digite o id do currículo para aceitar ou negar').setRequired(true)))
    .addSubcommand(subcommand => subcommand.setName('negar').setDescription('Aceita ou nega um currículo na sua empresa').addIntegerOption(option => option.setName('id-currículo').setDescription('Digite o id do currículo para aceitar ou negar').setRequired(true)));

module.exports = {
    name: 'currículos',
    aliases: ['curriculos', 'curr', 'vercurri', 'curriculo', 'currículo'],
    category: 'Empresas',
    description: 'Visualiza os currículos pendentes da sua empresa',
    data,
    mastery: 50,
    async execute(interaction) {
        const errorText = message => new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\n${message}`);
        const replyError = message => interaction.reply({ components: [errorText(message)], flags: Discord.MessageFlags.IsComponentsV2 });
        if (!(await companyService.check.hasCompany(interaction.user.id))) return replyError('Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize `/abrirempresa <setor> <nome>`');

        const subCmd = interaction.options.getSubcommand();
        const value = interaction.options.getInteger('id-currículo');
        const company = await companyService.get.companyByOwnerId(interaction.user.id);
        const array = company.curriculum == null ? [] : [...company.curriculum];
        const title = `${companyService.e[companyService.types[company.type]].icon} ${company.name}`;
        const botowner = await clientService.current.users.fetch(config.owner[0]);
        const buildContainer = ({ color = 0xfc7b03, description, fields = [], footer, image }) => {
            const container = new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));
            if (description) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
            for (const [name, field] of fields) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${name}**\n${field}`));
            if (footer) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${footer}`));
            if (image) container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(image)));
            return container;
        };

        if (subCmd === 'aceitar' || subCmd === 'negar') {
            if (value == null || array[value - 1] == null) return replyError(`Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr ${subCmd} <Nº do currículo>`);
            const index = array[value - 1];
            const usr = await clientService.current.users.fetch(index.split(';')[0]);
            array.splice(value - 1, 1);

            if (subCmd === 'aceitar') {
                const hasCompany = await companyService.check.hasCompany(usr.id);
                const isWorker = await companyService.check.isWorker(usr.id);
                const hasVacancies = await companyService.check.hasVacancies(company.company_id);
                if (hasCompany || isWorker) {
                    await companyInfo.set(interaction.user.id, company.company_id, 'curriculum', array);
                    return interaction.reply({ components: [buildContainer({ color: 0xa60000, fields: [['❌ Houve uma falha no contrato', 'Este membro já possui uma empresa ou trabalha em uma!']] })], flags: Discord.MessageFlags.IsComponentsV2 });
                }
                if (!hasVacancies) return interaction.reply({ components: [buildContainer({ color: 0xa60000, fields: [['❌ Houve uma falha no contrato', 'Sua empresa não possui vagas disponíveis ou estão desativadas!']] })], flags: Discord.MessageFlags.IsComponentsV2 });
                await interaction.reply({ components: [buildContainer({ color: 0x5bff45, description: `Você aceitou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\`` })], flags: Discord.MessageFlags.IsComponentsV2 });
                try {
                    await usr.send({
                        components: [new ContainerBuilder().setAccentColor(0x5bff45).addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`A empresa ${company.name} aceitou seu currículo!\nSeja bem vindo!\nPara visualizar os comandos da sua empresa utilize \`/setores\``),
                            new TextDisplayBuilder().setContent(`-# Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                        )],
                        flags: Discord.MessageFlags.IsComponentsV2
                    });
                } catch (error) {
                    reportError(error, 'command.curriculos.user_notification', { userId: usr.id });
                }
                const workers = company.workers == null ? [] : [...company.workers, usr.id];
                await companyInfo.set(interaction.user.id, company.company_id, 'curriculum', array);
                await companyInfo.set(interaction.user.id, company.company_id, 'workers', workers);
                const user_id = BigInt(usr.id);
                await prisma.players.upsert({ where: { user_id }, update: { company: company.company_id }, create: { user_id, company: company.company_id, frames: [], badges: [] } });
                return;
            }

            await interaction.reply({ components: [buildContainer({ color: 0xa60000, description: `Você negou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\`` })], flags: Discord.MessageFlags.IsComponentsV2 });
            try {
                await usr.send({
                    components: [new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`A empresa ${company.name} negou seu currículo!`),
                        new TextDisplayBuilder().setContent(`-# Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                    )],
                    flags: Discord.MessageFlags.IsComponentsV2
                });
            } catch (error) {
                reportError(error, 'command.curriculos.rejection_notification', { userId: usr.id });
            }
            await companyInfo.set(interaction.user.id, company.company_id, 'curriculum', array);
            return;
        }

        const fields = [];
        if (array.length > 0) {
            for (const r of array) {
                const usr = await clientService.current.users.fetch(r.split(';')[0]);
                const user_id = BigInt(usr.id);
                const pobjmaq = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
                fields.push([`📰 Nº ${array.indexOf(r) + 1}`, `Enviado por: ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\`\nNível: ${pobjmaq.level}\nEnviou há: **${compactTime(Date.now() - parseInt(r.split(';')[1]))}**\n\`/curr <aceitar/negar> ${array.indexOf(r) + 1}\``]);
            }
            await interaction.reply({ components: [buildContainer({ color: 0x5bff45, fields, image: company.logo || undefined })], flags: Discord.MessageFlags.IsComponentsV2 });
        } else {
            await interaction.reply({ components: [buildContainer({ color: 0xa60000, fields: [['📰 Sem currículos', 'Sua empresa não possui currículos pendentes!']], image: company.logo || undefined })], flags: Discord.MessageFlags.IsComponentsV2 });
        }
    }
};
