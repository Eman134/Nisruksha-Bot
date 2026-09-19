const Discord = require('discord.js');
const config = require('../../_classes/config');
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
	async execute(interaction) {
        
        
        const { inspect } = require('util')

        const embed = new Discord.EmbedBuilder().setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
        
        const tempo = Date.now();
        const query = interaction.options.getString('código');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``).replace(config.app.token, '*').replace(config.ip, '*')

        try {
                
            const evald = await eval(query)
            const res = typeof evald === 'string' ? evald : inspect(evald, { depth: 0 })
            embed.addFields({ name: 'Código', value: code('js', query), inline: false })
            embed.addFields({ name: 'Resultado', value: code('js', res), inline: false })
                
            if (!Boolean(res) || (!Boolean(evald) && evald !== 0)) embed.setColor('#a60000')
            else {
                embed.addFields({ name: 'Tipo', value: code('css', typeof evald), inline: true }).setColor('#6cf542')
            }

        } catch (error) {
                embed
                .addFields({ name: 'Erro', value: code('js', error), inline: true })
                .setColor('#a60000')
        } finally {
            const content = '**Executado em ' + (Date.now()-tempo)+" ms**"
            await interaction.reply({ content, embeds: [embed] }).catch(error => {
            interaction.reply({ content: `Ocorreu um erro ao dar eval! ${error.message}`})
            })   
        }
        
    }
}
