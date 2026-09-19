const compactTime = value => utility.ms(value, true);
const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const companyInfo = require('../../_classes/services/companyInfo');
const prisma = require('../../_classes/prisma');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'funcionários',
    aliases: ['func', 'funcionarios', 'workers'],
    category: 'Empresas',
    description: 'Visualiza a lista de funcionários e atividade',
    mastery: 20,
    async execute(interaction) {
        if (!(await companyService.check.hasCompany(interaction.user.id)) && !(await companyService.check.isWorker(interaction.user.id))) {
            return interaction.reply({ components: [new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\nVocê deve ser funcionário ou possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\`\nPesquise empresas usando \`/empresas\``)], flags: Discord.MessageFlags.IsComponentsV2 });
        }
        const user_id = BigInt(interaction.user.id);
        const pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
        const pobj2 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
        const company = await (await companyService.check.isWorker(interaction.user.id) ? companyService.get.companyById(pobj.company) : companyService.get.companyByOwnerId(interaction.user.id));
        const logo = company.logo || undefined;
        const buildContainer = ({ color, title, fields = [], footer, image, description }) => {
            const container = new ContainerBuilder().setAccentColor(color);
            const texts = [];
            if (title) texts.push(new TextDisplayBuilder().setContent(`## ${title}`));
            if (description) texts.push(new TextDisplayBuilder().setContent(description));
            for (const [name, value] of fields) texts.push(new TextDisplayBuilder().setContent(`**${name}**\n${value}`));
            if (footer) texts.push(new TextDisplayBuilder().setContent(`-# ${footer}`));
            container.addTextDisplayComponents(...texts);
            if (image) container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(image)));
            return container;
        };
        if (company.workers == null || company.workers.length === 0) {
            const ownerobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
            const ownerobj2 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
            return interaction.reply({
                components: [buildContainer({ color: 0x34fa3a, fields: [[`📌 \`${interaction.user.tag}\` [⭐ ${ownerobj.companyact == null ? 0 : ownerobj.companyact.score}]`, `ID: ${interaction.user.id}\nNível: **${ownerobj2.level}**\nÚltima atividade: **${ownerobj.companyact == null ? 'Não houve' : compactTime(Date.now() - ownerobj.companyact.last)}**\n**Fundador**`]], footer: 'Para demitir um funcionário utilize /demitir <id>', image: logo })],
                flags: Discord.MessageFlags.IsComponentsV2
            });
        }
        const owner = await clientService.current.users.fetch(String(company.user_id));
        const list = [];
        for (let i = 0; i < company.workers.length; i++) {
            const user = await clientService.current.users.fetch(company.workers[i]);
            if (!user) {
                company.workers.splice(i, 1);
                companyInfo.set(owner.id, company.company_id, 'workers', company.workers);
                return interaction.reply({ components: [new TextDisplayBuilder().setContent('Houve um erro ao carregar a lista de funcionários! Tente novamente.')], flags: Discord.MessageFlags.IsComponentsV2 });
            }
            const worker_id = BigInt(user.id);
            const { companyact } = await prisma.players.upsert({ where: { user_id: worker_id }, update: { user_id: worker_id }, create: { user_id: worker_id, frames: [], badges: [] } });
            const { level } = await prisma.machines.upsert({ where: { user_id: worker_id }, update: { user_id: worker_id }, create: { user_id: worker_id, slots: [] } });
            list.push({ user, level, companyact });
        }
        list.sort((a, b) => (b.companyact == null ? 0 : b.companyact.score) - (a.companyact == null ? 0 : a.companyact.score));
        const owner_id = BigInt(owner.id);
        const ownerobj = await prisma.players.upsert({ where: { user_id: owner_id }, update: { user_id: owner_id }, create: { user_id: owner_id, frames: [], badges: [] } });
        const ownerobj2 = await prisma.machines.upsert({ where: { user_id: owner_id }, update: { user_id: owner_id }, create: { user_id: owner_id, slots: [] } });
        const price = 60;
        const fields = [[`📌 \`${owner.tag}\` [⭐ ${ownerobj.companyact == null ? 0 : ownerobj.companyact.score}]`, `ID: ${owner.id}\nNível: **${ownerobj2.level}**\n**Fundador**`]];
        for (let i = 0; i < list.length; i++) {
            const func = list[i];
            fields.push([`${func.user.id === interaction.user.id ? ' ⏩ ' : ''}${i + 1}º \`${func.user.tag}\` [⭐ ${func.companyact == null ? 0 : func.companyact.score}]`, `ID: ${func.user.id}\nNível: **${func.level}**\nÚltima atividade: **${func.companyact == null ? 'Não houve' : compactTime(Date.now() - func.companyact.last)}**\nRendeu: **${func.companyact == null ? utility.format(0) : utility.format(func.companyact.rend)} ${utility.money} ${utility.moneyemoji}**`]);
        }
        const footer = owner.id === interaction.user.id ? `Para demitir um funcionário utilize /demitir <id>${company.funcmax < 8 ? `\nReaja com 🔼 para realizar upgrade nos funcionários máximos (Custa ${price} ⭐ da empresa)` : ''}` : 'Para sair da empresa utilize /sairempresa';
        const base = { color: 0x34fa3a, title: `Score da empresa: ${company.score.toFixed(2)} ⭐`, fields, footer, image: logo };
        if (!(await companyService.check.hasCompany(interaction.user.id))) return interaction.reply({ components: [buildContainer(base)], flags: Discord.MessageFlags.IsComponentsV2 });
        const maxWorkers = await companyService.get.maxWorkers(company.company_id);
        if (maxWorkers >= 8 || company.score.toFixed(2) < price) return interaction.reply({ components: [buildContainer(base)], flags: Discord.MessageFlags.IsComponentsV2 });
        const button = utility.createButton('up', 'PRIMARY', '', '🔼');
        const message = (await interaction.reply({ components: [buildContainer(base), new ActionRowBuilder().addComponents(button)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 15000 });
        collector.on('collect', async b => {
            if (b.user.id !== interaction.user.id) return;
            collector.stop();
            if (!b.deferred) b.deferUpdate().catch(error => { throw reportError(error, 'command.func.defer_update'); });
            if (company.score < price) return interaction.editReply({ components: [buildContainer({ color: 0xa60000, fields: [['❌ Falha no upgrade', `A sua empresa não possui score o suficiente para realizar upgrade!\nScore: **${utility.format(company.score.toFixed(2))}/${utility.format(price)} ⭐**`]] })], flags: Discord.MessageFlags.IsComponentsV2 });
            companyInfo.set(interaction.user.id, company.company_id, 'score', parseFloat(company.score) - price);
            companyInfo.set(interaction.user.id, company.company_id, 'funcmax', parseFloat(company.funcmax) + 1);
            await interaction.editReply({ components: [buildContainer({ color: 0x5bff45, fields: [['✅ Upgrade realizado', `Você gastou ${price} ⭐ da empresa subiu um nível dela, agora a empresa possui maior capacidade de funcionários máximo.`]] })], flags: Discord.MessageFlags.IsComponentsV2 });
        });
    }
};
