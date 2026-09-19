const Discord = require('discord.js');
const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();

module.exports = {
    name: 'meucodigo',
    category: 'Social',
    description: 'Visualiza os status de convite de jogadores',
    mastery: 6,
	async execute(interaction) {

        
        const invitejson = await economyService.tp.get(interaction.user.id)
        const code = invitejson.code
        const qnt = invitejson.qnt
        const points = invitejson.points
        
        const embed = new Discord.EmbedBuilder()

        .setTitle('<:info:736274028515295262> Informações de Convite')
        .setColor('#34ebcf')
        .setDescription('Convide seus amigos para jogar o bot e ganhe recompensas!\nQuem utilizar seu código receberá **5 ' + utility.tp.name + ' ' + utility.tp.emoji + '**, e você ganhará **1 ' + utility.tp.name + ' ' + utility.tp.emoji + '** a cada amigo que usar o código\nPara resgatar suas recompensas acesse \`/loja temporal\`\n\n📩 Código de Convite: **' + code + '**\n\`/apoiar ' + code +'\`\n✨ Total de usos: **' + qnt + '**\n' + utility.tp.emoji + ' ' + utility.tp.name + ': **' + points + '**\nJá utilizou um código: ' + (invitejson.usedinvite ? '✅' : '❌'))
        await interaction.reply({ embeds: [embed] })

	}
};
