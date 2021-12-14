const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('código').setDescription('Digite o código a ser executado').setRequired(true))

module.exports = {
    name: 'eval',
    aliases: ['evaluate', 'ev'],
    category: 'none',
    description: 'Executa um código em javascript',
    data,
    perm: 5,
	async execute(API, interaction) {
        
        const Discord = API.Discord;

        const { inspect } = require('util')

        const embed = new Discord.MessageEmbed().setFooter(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        const tempo = Date.now();
        const query = interaction.options.getString('código');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``).replace(API.token, '*').replace(API.ip, '*')

        try {
                
            const evald = await eval(query)
            const res = typeof evald === 'string' ? evald : inspect(evald, { depth: 0 })
            embed.addField('Código', code('js', query), false)
            embed.addField('Resultado', code('js', res), false)
                
            if (!Boolean(res) || (!Boolean(evald) && evald !== 0)) embed.setColor('DANGER')
            else {
                embed.addField('Tipo', code('css', typeof evald), true).setColor('#6cf542')
            }

        } catch (error) {
                embed
                .addField('Erro', code('js', error), true)
                .setColor('DANGER')
        } finally {
            const content = '**Executado em ' + (Date.now()-tempo)+" ms**"
            await interaction.reply({ content, embeds: [embed] }).catch(error => {
            interaction.reply({ content: `Ocorreu um erro ao dar eval! ${error.message}`})
            })   
        }
        
    }
}
