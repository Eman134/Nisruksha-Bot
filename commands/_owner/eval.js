const Discord = require('discord.js');
const config = require('../../_classes/config');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
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

        const fields = [];
        let color = 0x32a893;
        const tempo = Date.now();
        const query = interaction.options.getString('código');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``).replace(config.app.token, '*').replace(config.ip, '*')

        try {
                
            const evald = await eval(query)
            const res = typeof evald === 'string' ? evald : inspect(evald, { depth: 0 })
            fields.push({ name: 'Código', value: code('js', query) });
            fields.push({ name: 'Resultado', value: code('js', res) });
                
            if (!Boolean(res) || (!Boolean(evald) && evald !== 0)) color = 0xa60000
            else {
                fields.push({ name: 'Tipo', value: code('css', typeof evald) });
                color = 0x6cf542;
            }

        } catch (error) {
                fields.push({ name: 'Erro', value: code('js', error) });
                color = 0xa60000;
        } finally {
            const container = new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(new TextDisplayBuilder().setContent([
                `**${interaction.user.tag}**`,
                ...fields.map(field => `**${field.name}**\n${field.value}`),
                '**Executado em ' + (Date.now()-tempo) + ' ms**'
            ].join('\n\n')));
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 }).catch(error => {
            interaction.reply({ components: [new TextDisplayBuilder().setContent(`Ocorreu um erro ao dar eval! ${error.message}`)], flags: Discord.MessageFlags.IsComponentsV2 })
            })   
        }
        
    }
}
