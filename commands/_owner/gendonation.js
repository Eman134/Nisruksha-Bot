const { SlashCommandBuilder } = require('@discordjs/builders');
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
	async execute(API, interaction) {
        
        const donate = parseFloat(interaction.options.getInteger('valor'));

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()
		.setDescription(`Deseja gerar a mensagem de doação para R$${donate}?`, ``)

        const btn0 = API.createButton('confirm', 'SECONDARY', 'Confirmar', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', 'Cancelar', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            
            if (b.customId == 'cancel') return collector.stop();
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);

            await DatabaseManager.increment(API.id, 'globals', 'totaldonates', donate);
            await DatabaseManager.increment(API.id, 'globals', 'donates', 1);

            let commandfile = API.client.commands.get('mvp')
            await commandfile.execute(API, interaction);

            let commandfile2 = API.client.commands.get('doar')
            await commandfile2.execute(API, interaction);

            collector.stop();

        });

        collector.on('end', async (b) => {
            interaction.deleteReply()
        })

	}
};