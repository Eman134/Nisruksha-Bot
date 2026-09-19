const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const config = require('../../_classes/config');
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('valor').setDescription('Digite o valor da doação').setRequired(false))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'gendonation',
    aliases: [],
    category: 'none',
    description: 'none',
    data,
    perm: 5,
	async execute(interaction) {
        
        const donate = parseFloat(interaction.options.getInteger('valor'));

                
		const embed = new Discord.EmbedBuilder()
		.setDescription(`Deseja gerar a mensagem de doação para R$${donate}?`, ``)

        const btn0 = utility.createButton('confirm', 'SECONDARY', 'Confirmar', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', 'Cancelar', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            
            if (b.customId == 'cancel') return collector.stop();
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.gendonation.defer_update'); });

            await DatabaseManager.increment(config.app.id, 'globals', 'totaldonates', donate);
            await DatabaseManager.increment(config.app.id, 'globals', 'donates', 1);

            let commandfile = clientService.current.commands.get('mvp')
            await commandfile.execute(interaction);

            let commandfile2 = clientService.current.commands.get('doar')
            await commandfile2.execute(interaction);

            collector.stop();

        });

        collector.on('end', async (b) => {
            interaction.deleteReply()
        })

	}
};
