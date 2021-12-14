const API = require("../../_classes/api");

module.exports = {
    name: 'meucodigo',
    category: 'Social',
    description: 'Visualiza os status de convite de jogadores',
    mastery: 6,
	async execute(API, interaction) {

        const Discord = API.Discord;

        const invitejson = await API.eco.tp.get(interaction.user.id)
        const code = invitejson.code
        const qnt = invitejson.qnt
        const points = invitejson.points
        
        const embed = new Discord.MessageEmbed()

        .setTitle('<:info:736274028515295262> Informações de Convite')
        .setColor('#34ebcf')
        .setDescription('Convide seus amigos para jogar o bot e ganhe recompensas!\nQuem utilizar seu código receberá **5 ' + API.tp.name + ' ' + API.tp.emoji + '**, e você ganhará **1 ' + API.tp.name + ' ' + API.tp.emoji + '** a cada amigo que usar o código\nPara resgatar suas recompensas acesse \`/loja temporal\`\n\n📩 Código de Convite: **' + code + '**\n\`/apoiar ' + code +'\`\n✨ Total de usos: **' + qnt + '**\n' + API.tp.emoji + ' ' + API.tp.name + ': **' + points + '**\nJá utilizou um código: ' + (invitejson.usedinvite ? '✅' : '❌'))
        await interaction.reply({ embeds: [embed] })

	}
};