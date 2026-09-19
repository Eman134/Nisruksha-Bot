module.exports = {

    dependencies: ["Discord","client","createButton","rowComponents"],
    name: "messageCreate",
    execute: async (dependencies, interaction) => {

        const votos = require('../_classes/packages/votos.js');
        votos.check(dependencies.resolve(votos.dependencies), interaction)

        const prefix = "n."

        if (interaction.content.startsWith(prefix)) {

            const args = interaction.content.slice(prefix.length).split(/ +/);
    
            const command = args.shift().toLowerCase();

            let commandfile = dependencies.client.commands.get(command)
            if (commandfile) {
                interaction.commandName = 'MIGRAÇÃO'
                dependencies.client.emit('fail', { interaction, type: 'Atualização', sendMe: true, desc: 'Os comandos do NISRUKSHA foram migrados para **SLASH (/)**\nMencione o bot para entrar no servidor oficial e tirar suas dúvidas!' })
                return true;
            }
        }

        const mentionRegex = new RegExp(`^<@!?${dependencies.client.user.id}>$`);
        
        if (interaction.content.match(mentionRegex)) {

            const embed = new dependencies.Discord.MessageEmbed()
            .setColor('#36393f')
            .setAuthor(interaction.author.tag, interaction.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setDescription(`Olá ${interaction.author}` + ', meu prefixo é `/`, caso precise de ajuda use `/ajuda`')

            const btn1 = dependencies.createButton('https://discord.com/invite/jK3eNA5GkM', 'LINK', 'Meu servidor', '📨')
            const btn2 = dependencies.createButton('https://discord.com/oauth2/authorize?client_id=763815343507505183&permissions=388160&scope=bot%20applications.commands', 'LINK', 'Convidar', '📩')
            const btn3 = dependencies.createButton('https://top.gg/bot/763815343507505183', 'LINK', 'Vote em mim', '🗳')
            
            return await interaction.channel.send({ embeds: [embed], components: [dependencies.rowComponents([btn1, btn2, btn3])] });
        }
    }
}
