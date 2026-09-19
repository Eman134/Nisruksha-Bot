const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('valor').setDescription('Digite o valor da doação').setRequired(false))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","client","createButton","id","rowComponents"],
    name: 'gendonation',
    aliases: [],
    category: 'none',
    description: 'none',
    data,
    perm: 5,
	async execute(interaction, svcDiscord, svcClient, svcCreateButton, svcId, svcRowComponents) {
        
        const donate = parseFloat(interaction.options.getInteger('valor'));        
		const embed = new svcDiscord.MessageEmbed()
		.setDescription(`Deseja gerar a mensagem de doação para R$${donate}?`, ``)

        const btn0 = svcCreateButton('confirm', 'SECONDARY', 'Confirmar', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', 'Cancelar', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.svcId === interaction.user.svcId;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (b) => {

            if (!(b.user.svcId === interaction.user.svcId)) return
            reacted = true;
            
            if (b.customId == 'cancel') return collector.stop();
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.gendonation.defer_update'); });

            await DatabaseManager.increment(svcId, 'globals', 'totaldonates', donate);
            await DatabaseManager.increment(svcId, 'globals', 'donates', 1);

            let commandfile = svcClient.commands.get('mvp')
            await commandfile.execute(dependencies, interaction);

            let commandfile2 = svcClient.commands.get('doar')
            await commandfile2.execute(dependencies, interaction);

            collector.stop();

        });

        collector.on('end', async (b) => {
            interaction.deleteReply()
        })

	}
};
