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

const delegates = { players: prisma.players, servers: prisma.servers, globals: prisma.globals, storage: prisma.storage, players_utils: prisma.players_utils, machines: prisma.machines, towns: prisma.towns };
const addableFields = {
    players: new Set(['money', 'streak', 'perm', 'points', 'token', 'bank', 'saq', 'dep', 'tran', 'cmdsexec', 'stamina', 'reps', 'mastery']),
    servers: new Set(['lastcmd', 'cmdsexec', 'status']),
    globals: new Set(['totalcmd', 'donates', 'totaldonates', 'status', 'money']),
    storage: new Set(['storage']),
    players_utils: new Set(['profile_color', 'backpack']),
    machines: new Set(['machine', 'level', 'xp', 'energymax', 'energy', 'totalxp', 'durability', 'pressure', 'refrigeration', 'pollutants']),
    towns: new Set(['loc'])
};
const bigintFields = new Set(['stamina', 'reps', 'mastery', 'totalcmd', 'donates', 'totaldonates', 'money']);

module.exports = {
    name: 'addvar',
    aliases: [],
    category: 'none',
    description: 'Adicione um valor á uma variável no banco de dados',
    data,
    perm: 5,
	async execute(interaction) {

        const id = interaction.options.getString('id');
        const tabela = interaction.options.getString('tabela');
        const coluna = interaction.options.getString('coluna');
        const valor = interaction.options.getString('valor');

        const table = tabela?.toLowerCase();
        const field = coluna?.replace(/^"|"$/g, '');
        if (!addableFields[table]?.has(field) || !/^-?\d+(\.\d+)?$/.test(valor)) {
            return interaction.reply({ content: 'Tabela, coluna ou valor não permitido.' });
        }

		                let v;
        let va = '';
        try {
            v = await client.users.fetch(id);
            va = 'user_id'
        } catch (error) {
            reportError(error, 'command.addvar.user_lookup', { id });
            v = client.guilds.cache.get(id);
            va = 'server_id'
        }
        if ((table === 'servers') !== (va === 'server_id') || !v) {
            return interaction.reply({ content: 'O identificador não corresponde à tabela permitida.' });
        }
		const embed = new Discord.EmbedBuilder()
        try {
            const id = BigInt(v.id);
            const where = va === 'server_id' ? { server_id: id } : { user_id: id };
            const base = createDefaults(table, id, va);
            const before = await delegates[table].upsert({ where, update: where, create: base });
            const increment = bigintFields.has(field) ? BigInt(valor) : Number(valor);
            await delegates[table].update({ where, data: { [field]: { increment } } });
            const after = await delegates[table].findUnique({ where });

            embed.setDescription(`✅ Dados de ${v} atualizados! ${before[field]} -> ${after[field]}`)

            .setColor('#32a893')
        } catch (e) {
            embed.setDescription(`❌ Houve um erro ao atualizar dados de ${v} em \`${table}:${field}\``)
            .addFields({ name: 'Erro:', value: `\`\`\`js\n${e.stack}\`\`\`` })
            .setColor('#eb4034')
        } finally {
            await interaction.reply({ embeds: [embed] });
        }

	}
};

function createDefaults(table, id, column) {
    if (column === 'server_id') return { server_id: id };
    if (table === 'players') return { user_id: id, frames: [], badges: [] };
    if (table === 'machines') return { user_id: id, slots: [] };
    if (table === 'globals') return { user_id: id, keys: [], remember: [], processing: [] };
    return { user_id: id };
}
