const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('tabela').setDescription('Selecione uma tabela').setRequired(true))

module.exports = {
    name: 'reset',
    aliases: ['resetar'],
    category: 'none',
    description: 'Executa um reset do banco de dados',
    data,
    perm: 5,
	async execute(interaction) {

        const tabela = interaction.options.getString('tabela');
        const buildContainer = (color, content) => new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
        const initialContainer = buildContainer(0x36393f, 'Reaja para continuar o reset de ' + tabela);

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ components: [initialContainer, new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.reset.defer_update'); });
            if (b.customId == 'cancel'){
                interaction.editReply({ components: [buildContainer(0xa60000, `❌ Reset cancelado\n\nVocê cancelou o reset de ${tabela}`)], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            const table = tabela.toLowerCase();
            const allowedTables = new Set(['players', 'servers', 'globals', 'storage', 'players_utils', 'machines', 'cooldowns', 'companies', 'towns', 'site']);
            if (table !== 'all' && !allowedTables.has(table)) {
                await interaction.editReply({ components: [buildContainer(0xeb4034, '❌ Tabela não permitida.')], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            if (table == 'all') {
                let resultContainer;
                try {
                    await Promise.all([
                        prisma.players.deleteMany(), prisma.servers.deleteMany(), prisma.globals.deleteMany(),
                        prisma.storage.deleteMany(), prisma.players_utils.deleteMany(), prisma.machines.deleteMany(),
                        prisma.cooldowns.deleteMany(), prisma.companies.deleteMany(), prisma.towns.deleteMany(), prisma.site.deleteMany()
                    ]);
    
    
                    resultContainer = buildContainer(0x32a893, '✅ Todos os dados foram resetados!');
                } catch (e) {
                    resultContainer = buildContainer(0xeb4034, `❌ Houve um erro ao tentar resetar todos os dados\n\n**Erro**\n\`\`\`js\n${e.stack}\n\`\`\``);
                } finally {
                    await interaction.editReply({ components: [resultContainer], flags: Discord.MessageFlags.IsComponentsV2 });
                }
    
            } else {
                let resultContainer;
                try {
                    const resetters = {
                        players: () => prisma.players.deleteMany(),
                        servers: () => prisma.servers.deleteMany(),
                        globals: () => prisma.globals.deleteMany(),
                        storage: () => prisma.storage.deleteMany(),
                        players_utils: () => prisma.players_utils.deleteMany(),
                        machines: () => prisma.machines.deleteMany(),
                        cooldowns: () => prisma.cooldowns.deleteMany(),
                        companies: () => prisma.companies.deleteMany(),
                        towns: () => prisma.towns.deleteMany(),
                        site: () => prisma.site.deleteMany()
                    };
                    await resetters[table]();
    
    
                    resultContainer = buildContainer(0x32a893, `✅ Dados da tabela \`${tabela.toLowerCase()}\` foram resetados!`);
                } catch (e) {
                    resultContainer = buildContainer(0xeb4034, `❌ Houve um erro ao tentar resetar os dados de \`${tabela.toLowerCase()}\`\n\n**Erro**\n\`\`\`js\n${e.stack}\n\`\`\``);
                } finally {
                        await interaction.editReply({ components: [resultContainer], flags: Discord.MessageFlags.IsComponentsV2 });
                }
            }

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            interaction.editReply({ components: [buildContainer(0xa60000, `❌ Tempo expirado\n\nVocê iria resetar ${tabela}, porém o tempo expirou.`)], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
