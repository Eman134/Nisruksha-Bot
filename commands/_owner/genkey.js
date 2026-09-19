const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const crateExtensionService = require('../../_classes/services/crateExtension');
const config = require('../../_classes/config');
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const prisma = require('../../_classes/prisma');

const data = new SlashCommandBuilder()
    .addStringOption(option => option.setName('tipochave').setDescription('Digite o tipo de chave que deseja gerar')
        .addChoices({ name: 'MVP', value: 'MVP' }, { name: 'MOEDAS', value: 'MOEDAS' }, { name: 'FICHAS', value: 'FICHAS' }, { name: 'CRISTAIS', value: 'CRISTAIS' }, { name: 'CAIXA', value: 'CAIXA' })
        .setRequired(true))
    .addStringOption(option => option.setName('durqnt').setDescription('Digite a quantidade ou duração da chave').setRequired(false))
    .addStringOption(option => option.setName('args2').setDescription('Caixa').setRequired(false));

function container(color, title, description, fields = []) {
    return new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(new TextDisplayBuilder().setContent([
        title ? `## ${title}` : '',
        description || '',
        ...fields.map(field => `**${field.name}**\n${field.value}`)
    ].filter(Boolean).join('\n\n')));
}

module.exports = {
    name: 'gerarkey',
    aliases: ['gerarchave', 'gchave', 'gkey', 'genkey'],
    category: 'none',
    description: 'Gera uma chave de ativação com um produto de recompensa',
    data,
    perm: 5,
    async execute(interaction) {
        const types = {
            MVP: { icon: '<:mvp:758717273304465478>', name: 'MVP', requiret: true, requiresize: false, type: 0 },
            MOEDAS: { icon: utility.moneyemoji, name: utility.money, requiret: false, requiresize: true, requireid: false, type: 1 },
            FICHAS: { icon: utility.money3emoji, name: utility.money3, requiret: false, requiresize: true, requireid: false, type: 2 },
            CRISTAIS: { icon: utility.money2emoji, name: utility.money2, requiret: false, requiresize: true, requireid: false, type: 3 },
            CAIXA: { icon: '', name: '', requiret: false, requiresize: false, requireid: true, type: 4 }
        };
        const choose = interaction.options.getString('tipochave').toUpperCase();
        const id = interaction.options.getString('durqnt');
        const args2 = interaction.options.getString('args2');
        const error = (message, usage) => container(0xb8312c, null, `<:error:736274027756388353> ${interaction.user.tag}\n${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`);

        if (!types[choose]) {
            return interaction.reply({ components: [error(`Você precisa especificar um tipo de chave existente!\n\n**Lista de Tipos**\n\`${Object.keys(types).join(', ')}.\``, 'gerarchave MVP 1mo 30d 10h 30m 30s\n/gerarchave money 100\n/gerarchave caixa 1 5')], flags: Discord.MessageFlags.IsComponentsV2 });
        }
        if (types[choose].requireid && args2 == null) {
            return interaction.reply({ components: [error('Você precisa especificar um id de caixa', 'gerarchave caixa 1 5')], flags: Discord.MessageFlags.IsComponentsV2 });
        }

        let time = 0;
        if (types[choose].requiret) {
            for (const value of id.split(' ')) {
                if (value.includes('mo')) time += parseInt(value) * 30 * 24 * 60 * 60 * 1000;
                else if (value.includes('d')) time += parseInt(value) * 24 * 60 * 60 * 1000;
                else if (value.includes('h')) time += parseInt(value) * 60 * 60 * 1000;
                else if (value.includes('m')) time += parseInt(value) * 60 * 1000;
                else if (value.includes('s')) time += parseInt(value) * 1000;
            }
        }
        let size = 0;
        if (types[choose].requiresize && !utility.isInt(id)) {
            return interaction.reply({ components: [error('Você precisa especificar uma quantia para a o produto', `gerarchave ${types[choose].name} 10000`)], flags: Discord.MessageFlags.IsComponentsV2 });
        }
        if (types[choose].requireid) {
            size = parseInt(args2);
            const crate = await crateExtensionService.getCrate(id);
            if (!crate) return;
            types[choose].icon = crate.icon;
            types[choose].name = crate.name;
        }
        if (types[choose].requiresize) size = parseInt(id);

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅');
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌');
        const product = `Produto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret ? `\nDuração: **${utility.ms(time, true)}**` : ''}${size > 0 ? `\nQuantia: **${size}**` : ''}`;
        const message = (await interaction.reply({
            components: [container(0x36393f, null, `Você deseja gerar uma nova **🔑 Chave de Ativação**?\n${product}`), new ActionRowBuilder().addComponents(btn0, btn1)],
            flags: Discord.MessageFlags.IsComponentsV2,
            withResponse: true
        })).resource.message;
        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 15000 });
        let reacted = false;

        collector.on('collect', async b => {
            reacted = true;
            collector.stop();
            if (!b.deferred) b.deferUpdate().catch(error => reportError(error, 'command.genkey.defer_update'));
            if (b.customId === 'cancel') {
                return interaction.editReply({ components: [container(0xa60000, null, '', [{ name: '❌ Geração de chave cancelada', value: `Você cancelou a geração de uma nova **🔑 Chave de Ativação**.\n${product}` }])], flags: Discord.MessageFlags.IsComponentsV2 });
            }

            const makeid = length => Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
            const key = `${makeid(3)}-${makeid(3)}-${makeid(3)}-${makeid(3)}-N`;
            const obj = { key, form: types[choose] };
            if (time) obj.time = time;
            if (size) obj.size = size;
            if (id) obj.id = id;
            const user_id = BigInt(config.app.id);
            const globalobj = await prisma.globals.upsert({ where: { user_id }, update: { user_id }, create: { user_id, keys: [], remember: [], processing: [] } });
            const keys = globalobj.keys || [];
            keys.push(obj);
            await prisma.globals.update({ where: { user_id }, data: { keys } });
            const channel = await clientService.current.channels.cache.get('758711135284232263');
            const created = await channel.send({
                components: [container(0xfc8c03, '🔑 Nova chave gerada', `Quem gerou: ${interaction.user} \`${interaction.user.id}\`\nLocal em que gerou: ${interaction.channel} 🡮 ${interaction.guild.name} 🡮 \`${interaction.guild.id}\`\nChave gerada: **${key}**\n\n${product}\n\n**Objeto gerado:**\n\`\`\`js\n${JSON.stringify(obj, null, '\t').slice(0, 1000)}\n\`\`\``)],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            await interaction.editReply({ components: [container(0x5bff45, null, '', [{ name: '✅ Chave criada com sucesso', value: `Você gerou uma nova **🔑 Chave de Ativação**, visualize-a [CLICANDO AQUI](https://discordapp.com/channels/${channel.guild.id}/${channel.id}/${created.id})` }])], flags: Discord.MessageFlags.IsComponentsV2 });
        });

        collector.on('end', async () => {
            if (reacted) return;
            await interaction.editReply({ components: [container(0xa60000, null, `❌ Tempo expirado\n\nVocê iria gerar uma nova **🔑 Chave de Ativação**, porém o tempo expirou.\n${product}`)], flags: Discord.MessageFlags.IsComponentsV2 });
        });
    }
};
