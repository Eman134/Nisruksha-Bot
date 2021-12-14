const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('status').setDescription('Selecione o status')
  .addChoice('Comandos somente se o membro tiver no servidor oficial', '0')
  .addChoice('Uso liberado para qualquer membro', '1')
  .addChoice('Manutenção ligada', '2')
.setRequired(true))
.addStringOption(option => option.setName('motivo').setDescription('Selecione um motivo para a manutenção').setRequired(true))

module.exports = {
    name: 'setgstatus',
    aliases: ['setargstatus', 'gstatus', 'setgs'],
    category: 'none',
    description: 'Modifica o status global do bot',
    data,
    perm: 5,
	async execute(API, interaction) {

        const status = parseInt(interaction.options.getString('status'));
        const motivo = interaction.options.getString('motivo');

        if (status == 2 && motivo == null) {
            const embedtemp = await API.sendError(interaction, `Você precisa especificar um motivo para a manutenção!`, "setgstatus 2 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let ob = {
            0: "Comandos somente se o membro tiver no servidor oficial",
            1: "Uso liberado para qualquer membro",
            2: "Manutenção ligada"
        }

        interaction.reply({ content: `O status global do bot foi modificado para: \`${status}\` ${ob[status]}` })

        DatabaseManager.set(API.id, 'globals', 'status', status)
        DatabaseManager.set(API.id, 'globals', 'man', motivo)

	}
};