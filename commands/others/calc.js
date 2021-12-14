const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('expressão').setDescription('Coloque uma expressão de matemática para calcular').setRequired(true))

module.exports = {
    name: 'calcular',
    aliases: ['calc', 'calculate'],
    category: 'Outros',
    description: 'Facilite suas contas utilizando este comando',
    data,
    mastery: 10,
	async execute(API, interaction) {

        const Discord = API.Discord;
        const args = interaction.options.getString('expressão');
        
        var happycalculator = require('happycalculator');

        try {
            var resultado = happycalculator.calculate(args.split('÷').join('/'));
            if (resultado.toString().includes(API.token)) {
                return interaction.reply({ content: '**Token do bot**: OdIcBaAzD2NzYxMSA3b2TOa4vca.Xvko_Q.A6F3EHwD3abV-Xabc_as9FEMm6eXD?' });
            }
            const embed = new Discord.MessageEmbed()
            if (resultado === Infinity || resultado == NaN || resultado == undefined || resultado == null || resultado.toString() == 'NaN') {
                embed.setImage('https://i.imgur.com/9EDKaRj.gif')
                .setDescription(`Ao infinito, e além!`)
                return interaction.reply({ embeds: [embed]});
            }
            embed.setImage('https://media.tenor.com/images/c2f392370c8b20cc99d04148c7b6bebc/tenor.gif')
            .setDescription(`Resultado: \`${resultado}\``)
            return interaction.reply({ embeds: [embed]});
        } catch {
            const embedtemp = await API.sendError(interaction, `Houve um erro ao realizar o seu calculo! Tente novamente`);
            await interaction.reply({ embeds: [embedtemp]})
            return
        };

	}
};