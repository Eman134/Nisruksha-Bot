const playersService = require('../../_classes/services/players');
const clientService = require('../../_classes/services/clientService');
const Discord = require('../../_classes/discordCompat');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja os cooldowns ativos de um membro'))

module.exports = {
    name: 'cooldowns',
    aliases: ['cd'],
    category: 'Outros',
    description: 'Visualize todos os cooldowns ativos',
    data,
    mastery: 25,
	async execute(interaction) {

        let member = interaction.options.getUser('membro') || interaction.user

        let filtered = []

        let blacklist = [ 'daily2' ]

        try {
            const columns = await DatabaseManager.columns('cooldowns');

            for (const column of columns.filter((name) => name !== 'user_id')) {
                const cd = await playersService.cooldown.check(member.id, column)
                if (cd) {
                    const cd2 = await playersService.cooldown.get(member.id, column)
                    if (!blacklist.includes(column)) {
                        filtered.push( {
                            name: column,
                            time: cd2
                        })
                    }
                }
            }

        } catch (err) {
            clientService.current.emit('error', err)
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#4ae8ac')
        .setTitle('⏰ Lista de cooldowns ativos')
        .setAuthor(member.tag, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        if (filtered.length > 0) {

            embed.setDescription( filtered.map((i) => `${i.name} <:arrow:737370913204600853> \`${utility.ms(i.time, true)}\`` ).join('\n') )

        } else {
            embed.setDescription('Não possui nenhum cooldown ativo!')
        }

        await interaction.reply({ embeds: [embed]});

	}
};
