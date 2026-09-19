const clientService = require('../../_classes/services/clientService');
const companyService = require('../../_classes/services/company');
const townsService = require('../../_classes/services/towns');
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const { SlashCommandBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');

async function formatList(page2) {
    let page = page2;
    let array = [];
    try {
        array = await prisma.companies.findMany({
            where: { company_id: { not: '' } },
            select: { company_id: true, user_id: true, score: true, type: true, name: true, loc: true, taxa: true, workers: true, curriculum: true }
        });
    } catch (error) {
        clientService.current.emit('error', error);
        throw error;
    }

    array.sort((a, b) => b.score - a.score);
    let description;
    const fields = [];
    let totalpages = 0;

    if (array.length < 1) {
        description = '❌ Ainda não possui empresas registradas!\nAbra sua empresa agora usando `/abrirempresa`';
    } else {
        totalpages = array.length % 6 === 0 ? array.length / 6 : Math.floor(array.length / 6) + 1;
        if (page > totalpages) page = 1;
        description = `**Página atual: ${page}/${totalpages}**\nPara navegar entre as páginas use \`/empresas <página>\`\nUtilize \`/verempresa <código>\` para visualizar as informações de uma empresa`;
        for (const r of array.slice((page * 6) - 6, page * 6)) {
            const owner = await clientService.current.users.fetch(String(r.user_id));
            const vagas = await companyService.check.hasVacancies(r.company_id);
            const func = r.workers == null ? `0/${await companyService.get.maxWorkers(r.company_id)}` : `${r.workers.length}/${await companyService.get.maxWorkers(r.company_id)}`;
            const locname = townsService.getTownNameByNum(r.loc);
            const curriculum = r.curriculum == null ? 0 : r.curriculum.length;
            fields.push({
                name: `${companyService.e[companyService.types[r.type]].icon} ${r.name} [⭐ ${r.score.toFixed(2)}]`,
                value: `Setor: ${companyService.e[companyService.types[r.type]].icon} **${companyService.types[r.type].charAt(0).toUpperCase() + companyService.types[r.type].slice(1)}**\nFundador: ${owner} (\`${owner.id}\`)\nCódigo: **${r.company_id}**\nLocalização: **${locname}**\nTaxa de venda: ${r.taxa}%\nFuncionários: ${func}\nCurrículos pendentes: ${curriculum}/10\nVagas abertas: ${vagas ? `🟢 \`/enviarcurriculo ${r.company_id}\`` : '🔴'}`
            });
        }
    }

    return { totalpages, currentpage: page, description, fields };
}

const data = new SlashCommandBuilder()
    .addIntegerOption(option => option.setName('página').setDescription('Digite o número da página para pesquisar empresas').setRequired(false));

module.exports = {
    name: 'empresas',
    aliases: ['companies'],
    category: 'Empresas',
    description: 'Visualiza as empresas existentes',
    data,
    mastery: 30,
    async execute(interaction) {
        const página = interaction.options.getInteger('página');
        let components;
        let returned = await formatList(página != null && página > 0 ? página : 1);

        function reworkButtons() {
            const buttons = [
                utility.createButton('backward', 'PRIMARY', '', '852241487064596540', returned.currentpage === 1),
                utility.createButton('forward', 'PRIMARY', '', '737370913204600853', returned.currentpage === returned.totalpages)
            ];
            components = [new ActionRowBuilder().addComponents(...buttons)];
        }

        function buildContainer() {
            return new ContainerBuilder()
                .setAccentColor(0x4870c7)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## 📃 | Lista de Empresas'),
                    new TextDisplayBuilder().setContent(returned.description),
                    ...returned.fields.map(field => new TextDisplayBuilder().setContent(`**${field.name}**\n${field.value}`))
                );
        }

        reworkButtons();
        const message = (await interaction.reply({ components: [buildContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        if (returned.currentpage === returned.totalpages || returned.totalpages === 0) return;

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 30000 });
        collector.on('collect', async b => {
            if (b.user.id !== interaction.user.id) return;
            if (!b.deferred) b.deferUpdate().catch(error => { throw reportError(error, 'command.empresas.defer_update'); });
            if (b.customId === 'forward' && returned.currentpage < returned.totalpages) returned.currentpage += 1;
            if (b.customId === 'backward' && returned.currentpage > 1) returned.currentpage -= 1;
            returned = await formatList(returned.currentpage);
            reworkButtons();
            await interaction.editReply({ components: [buildContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2 });
            collector.resetTimer();
        });
        collector.on('end', () => {
            interaction.editReply({ components: [buildContainer()], flags: Discord.MessageFlags.IsComponentsV2 });
        });
    }
};
