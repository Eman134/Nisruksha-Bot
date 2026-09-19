const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('código').setDescription('Escreva um código de apoiador').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","client","eco","frames","maqExtension","sendError","shopExtension","tp"],
    name: 'apoiar',
    aliases: ['usereferral', 'usarref'],
    category: 'Social',
    description: 'Utiliza um código de referência para apoiar seu amigo',
    data,
    mastery: 20,
	async execute(interaction, svcDiscord, svcClient, svcEco, svcFrames, svcMaqExtension, svcSendError, svcShopExtension, svcTp) {        
        const codigo = interaction.options.getString('código')

        const check = await svcEco.svcTp.check(codigo)

        if (!check.exists) {
            const embedtemp = await svcSendError(interaction, 'Este código de convite não existe, verifique com seu amigo o código!', 'apoiar <codigo>')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        if (check.owner == interaction.user.id) {
            const embedtemp = await svcSendError(interaction, 'Você não pode utilizar seu próprio código de convite bobinho!\nChame seus amigos para o bot para poder ganhar as recompensas!')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const invitejson = await svcEco.svcTp.get(interaction.user.id)

        if (invitejson.usedinvite) {
            const embedtemp = await svcSendError(interaction, 'Você só pode utilizar UM código de convite!\nCaso você deseja ganhar recompensas, utilize `/convite` e veja as instruções.')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        let cmaq = await svcMaqExtension.get(interaction.user.id)

        if (cmaq < 102) {
            const embedtemp = await svcSendError(interaction, `Você precisa ter no mínimo a ${svcShopExtension.getProduct(102).icon} ${svcShopExtension.getProduct(102).name} para apoiar alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const owner = await svcClient.users.fetch(check.owner)
        
        const embed = new svcDiscord.MessageEmbed()

        .setTitle('💚 Código de convite utilizado com sucesso!')
        .setColor('#5bff45')
        .setDescription('Você utilizou o código do seu amigo `' + owner.tag + ' (' + owner.id + ')` e você recebeu 5 ' + svcTp.name + ' ' + svcTp.emoji + ', enquanto seu amigo recebeu 1 ' + svcTp.name + ' ' + svcTp.emoji)
        .setFooter('Sabia que você também pode convidar seus amigos e ganhar recompensas?\nUtilize /convite para mais informações')
        await interaction.reply({ embeds: [embed] })

        const embedcmd = new svcDiscord.MessageEmbed()
          .setColor('#b8312c')
          .setTimestamp()
          .setDescription(`O membro ${interaction.user} apoiou ${owner}`)
          .addField('<:mention:788945462283075625> Membro', `${interaction.user.tag} (\`${interaction.user.id}\`)`)
          .addField('<:channel:788949139390988288> Canal', `\`${interaction.channel.name} (${interaction.channel.id})\``)
          .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
          .setFooter(interaction.guild.name + " | " + interaction.guild.id, interaction.guild.iconURL())
          svcClient.channels.cache.get('826184097814020116').send({ embeds: [embedcmd]});

        updateInviteJson(interaction.user, owner)

	}
};

async function updateInviteJson(member, owner) {

    const invitejson1 = await svcEco.svcTp.get(member.id)
    
    invitejson1.points += 5
    invitejson1.usedinvite = true

    const invitejson2 = await svcEco.svcTp.get(owner.id)

    invitejson2.points += 1
    invitejson2.qnt += 1

    svcFrames.add(owner.id, 14)

    DatabaseManager.set(member.id, 'players_utils', 'invite', invitejson1)
    DatabaseManager.set(owner.id, 'players_utils', 'invite', invitejson2)

}
