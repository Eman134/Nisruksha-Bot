const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('id').setDescription('Selecione um id de usuário').setRequired(true))
.addStringOption(option => option.setName('tabela').setDescription('Selecione uma tabela').setRequired(true))
.addStringOption(option => option.setName('coluna').setDescription('Selecione uma coluna').setRequired(true))
.addStringOption(option => option.setName('valor').setDescription('Coloque o valor a ser setado').setRequired(true))

const delegates = { players: prisma.players, servers: prisma.servers, globals: prisma.globals, storage: prisma.storage, players_utils: prisma.players_utils, machines: prisma.machines, towns: prisma.towns, site: prisma.site };
const fields = {
    players: new Set(['money', 'streak', 'perm', 'points', 'bio', 'token', 'bglink', 'bank', 'saq', 'dep', 'tran', 'cmdsexec', 'stamina', 'company', 'banreason', 'mvp', 'plots', 'reps', 'rod', 'companyact', 'frames', 'badges', 'mastery']),
    servers: new Set(['lastcmd', 'cmdsexec', 'banreason', 'status']),
    globals: new Set(['totalcmd', 'donates', 'totaldonates', 'status', 'man', 'money', 'bets', 'events', 'keys', 'remember', 'processing']),
    storage: new Set(['storage']),
    players_utils: new Set(['invite', 'profile_color', 'backpack', 'process']),
    machines: new Set(['machine', 'level', 'xp', 'energymax', 'energy', 'totalxp', 'durability', 'pressure', 'refrigeration', 'pollutants', 'slots']),
    towns: new Set(['loc']),
    site: new Set(['first', 'todo'])
};
const bigintFields = new Set(['stamina', 'reps', 'mastery', 'totalcmd', 'donates', 'totaldonates', 'money']);

module.exports = {
    name: 'setvar',
    aliases: ['svar'],
    category: 'none',
    description: 'Seta uma variável e um valor no banco de dados',
    data,
    perm: 5,
	async execute(interaction) {

        const id = interaction.options.getString('id');
        const tabela = interaction.options.getString('tabela');
        const coluna = interaction.options.getString('coluna');
        const valor = interaction.options.getString('valor');
        const table = tabela?.toLowerCase();
        const field = coluna?.replace(/^"|"$/g, '');
        if (!fields[table]?.has(field)) {
            return interaction.reply({ content: 'Tabela ou coluna não permitida.' });
        }

		                const embed = new Discord.EmbedBuilder()
        let v;
        let va = '';
        try {
            v = await client.users.fetch(id);
            va = 'user_id'
        } catch (error) {
            reportError(error, 'command.setvar.user_lookup', { id });
            v = client.guilds.cache.get(id);
            va = 'server_id'
        }

        if (!v) {
            interaction.reply({ content: `id undefined` })
            return;
        }
        if ((table === 'servers') !== (va === 'server_id')) {
            return interaction.reply({ content: 'O identificador não corresponde à tabela permitida.' });
        }

        try {

            let evaluatedValue = parseValue(valor);
            if (bigintFields.has(field)) evaluatedValue = BigInt(evaluatedValue);
            const id = BigInt(v.id);
            const where = va === 'server_id' ? { server_id: id } : { user_id: id };
            const base = createDefaults(table, id, va);
            await delegates[table].upsert({ where, update: { [field]: evaluatedValue }, create: { ...base, [field]: evaluatedValue } });

            embed.setDescription(`✅ Você setou o valor \`${evaluatedValue}\` para ${v} em \`${table}:${field}\``)
            embed.setColor('#32a893');

        } catch (e) {
            embed.setDescription(`❌ Houve um erro ao setar \`${valor}\` para ${v} em \`${table}:${field}\``)
            embed.addFields({ name: 'Erro:', value: `\`\`\`js\n${e}\`\`\`` });
            embed.setColor('#eb4034')
        } finally {
            await interaction.reply({ embeds: [embed] });
        }

	}
};

function parseValue(value) {
    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    try { return JSON.parse(value); } catch { return value; }
}

function createDefaults(table, id, column) {
    if (column === 'server_id') return { server_id: id };
    if (table === 'players') return { user_id: id, frames: [], badges: [] };
    if (table === 'machines') return { user_id: id, slots: [] };
    if (table === 'globals') return { user_id: id, keys: [], remember: [], processing: [] };
    if (table === 'site') return { user_id: id, todo: [] };
    return { user_id: id };
}
