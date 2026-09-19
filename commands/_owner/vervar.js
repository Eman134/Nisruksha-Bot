const clientService = require('../../_classes/services/clientService');
const Discord = require('discord.js');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('id').setDescription('Selecione um id de usuário').setRequired(true))
.addStringOption(option => option.setName('tabela').setDescription('Selecione uma tabela').setRequired(true));

const SUCCESS_COLOR = '#32a893';
const ERROR_COLOR = '#eb4034';
const WARNING_COLOR = '#f0ad4e';
const DESCRIPTION_DATA_LENGTH = 1500;
const FIELD_DATA_LENGTH = 800;
const MAX_ADDITIONAL_FIELDS = 5;
const MAX_ERROR_LENGTH = 1000;
const delegates = { players: prisma.players, servers: prisma.servers, globals: prisma.globals, storage: prisma.storage, players_utils: prisma.players_utils, machines: prisma.machines, cooldowns: prisma.cooldowns, companies: prisma.companies, towns: prisma.towns, site: prisma.site };

module.exports = {
    name: 'vervar',
    aliases: ['seevar', 'verobj', 'seeobj', 'getobj'],
    category: 'none',
    description: 'Veja uma variável e um valor do banco de dados',
    data,
    perm: 5,
    async execute(interaction) {
        const id = interaction.options.getString('id');
        const table = interaction.options.getString('tabela');
        if (!delegates[table?.toLowerCase()]) return interaction.reply({ content: 'Essa tabela não é permitida.' });
        const target = await resolveTarget(clientService.current, id);

        if (!target) {
            return interaction.reply({ content: 'id undefined' });
        }
        if ((table.toLowerCase() === 'servers') !== (target.column === 'server_id')) {
            return interaction.reply({ content: 'O identificador não corresponde à tabela permitida.' });
        }

        const embed = new Discord.EmbedBuilder();

        try {
            const targetId = BigInt(target.entity.id);
            const rows = await delegates[table.toLowerCase()].findMany({ where: { [target.column]: targetId } });
            const row = rows[0];

            if (!row) {
                embed
                    .setDescription(`⚠️ Nenhum dado encontrado para ${target.entity} em \`${table}\``)
                    .setColor(WARNING_COLOR);
            } else {
                addDataToEmbed(embed, target.entity, table, JSON.stringify(row, (_, value) => typeof value === 'bigint' ? value.toString() : value, '\t'));
            }
        } catch (error) {
            embed
                .setDescription(`❌ Houve um erro ao ver dados de ${target.entity} em \`${table}\``)
                .addFields({ name: 'Erro:', value: codeBlock(getErrorDetails(error)) })
                .setColor(ERROR_COLOR);
        }

        await interaction.reply({ embeds: [embed] });
    }
};

async function resolveTarget(client, id) {
    let lookupError;

    try {
        const user = await client.users.fetch(id);
        if (user) {
            return { entity: user, column: 'user_id' };
        }
    } catch (error) {
        lookupError = error;
    }

    const guild = client.guilds.cache.get(id);
    if (!guild && lookupError) {
        reportError(lookupError, 'command.vervar.user_lookup', { id });
    }

    return guild ? { entity: guild, column: 'server_id' } : null;
}

function addDataToEmbed(embed, entity, table, serializedData) {
    const chunks = splitData(serializedData);
    const [description, ...fields] = chunks;

    embed
        .setDescription(`✅ Dados de ${entity} em \`${table}\`\n${codeBlock(description)}`)
        .setColor(SUCCESS_COLOR);

    fields.forEach((chunk) => {
        embed.addFields({ name: '.', value: `\n${codeBlock(chunk)}` });
    });
}

function splitData(data) {
    const chunks = [data.slice(0, DESCRIPTION_DATA_LENGTH)];
    let start = DESCRIPTION_DATA_LENGTH;
    let fieldCount = 0;

    while (start < data.length && fieldCount < MAX_ADDITIONAL_FIELDS) {
        chunks.push(data.slice(start, start + FIELD_DATA_LENGTH));
        start += FIELD_DATA_LENGTH;
        fieldCount += 1;
    }

    return chunks;
}

function codeBlock(content) {
    return `\`\`\`js\n${content}\`\`\``;
}

function getErrorDetails(error) {
    const details = error?.stack || error?.message || String(error);
    return details.slice(0, MAX_ERROR_LENGTH);
}
