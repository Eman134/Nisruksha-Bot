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
	async execute(API, interaction) {

        let member = interaction.options.getUser('membro') || interaction.user

        let filtered = []

        let blacklist = [ 'daily2' ]

        try {
            const columns = await DatabaseManager.columns('cooldowns');

            for (const column of columns.filter((name) => name !== 'user_id')) {
                const cd = await API.playerUtils.cooldown.check(member.id, column)
                if (cd) {
                    const cd2 = await API.playerUtils.cooldown.get(member.id, column)
                    if (!blacklist.includes(column)) {
                        filtered.push( {
                            name: column,
                            time: cd2
                        })
                    }
                }
            }

        } catch (err) {
            API.client.emit('error', err)
        }

        const embed = new API.Discord.MessageEmbed()
        .setColor('#4ae8ac')
        .setTitle('⏰ Lista de cooldowns ativos')
        .setAuthor(member.tag, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        if (filtered.length > 0) {

            embed.setDescription( filtered.map((i) => `${i.name} <:arrow:737370913204600853> \`${API.ms2(i.time)}\`` ).join('\n') )

        } else {
            embed.setDescription('Não possui nenhum cooldown ativo!')
        }

        await interaction.reply({ embeds: [embed]});

	}
};
