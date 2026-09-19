module.exports = {

    name: "messageCreate",
    execute: async (interaction) => {

        const client = require('../_classes/services/clientService').current;
        const Discord = require('discord.js');
        const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
        const UtilityService = require('../_classes/services/utilityService');
        const utility = new UtilityService();

        const votos = require('../_classes/packages/votos.js');
        votos.check(interaction)

        const prefix = "n."

        if (interaction.content.startsWith(prefix)) {

            const args = interaction.content.slice(prefix.length).split(/ +/);
    
            const command = args.shift().toLowerCase();

            let commandfile = client.commands.get(command)
            if (commandfile) {
                interaction.commandName = 'MIGRAÇÃO'
                client.emit('fail', { interaction, type: 'Atualização', sendMe: true, desc: 'Os comandos do NISRUKSHA foram migrados para **SLASH (/)**\nMencione o bot para entrar no servidor oficial e tirar suas dúvidas!' })
                return true;
            }
        }

        const mentionRegex = new RegExp(`^<@!?${client.user.id}>$`);
        
        if (interaction.content.match(mentionRegex)) {

            const embed = new ContainerBuilder()
                .setAccentColor(0x36393f)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# ${interaction.author.tag}`),
                    new TextDisplayBuilder().setContent(`Olá ${interaction.author}, meu prefixo é \`/\`, caso precise de ajuda use \`/ajuda\``)
                );

            const btn1 = utility.createButton('https://discord.com/invite/jK3eNA5GkM', 'LINK', 'Meu servidor', '📨')
            const btn2 = utility.createButton('https://discord.com/oauth2/authorize?client_id=763815343507505183&permissions=388160&scope=bot%20applications.commands', 'LINK', 'Convidar', '📩')
            const btn3 = utility.createButton('https://top.gg/bot/763815343507505183', 'LINK', 'Vote em mim', '🗳')
            
            return await interaction.channel.send({ components: [embed, new ActionRowBuilder().addComponents(btn1, btn2, btn3)], flags: Discord.MessageFlags.IsComponentsV2 });
        }
    }
}
