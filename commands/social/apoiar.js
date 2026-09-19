const Discord = require('../../_classes/discordCompat');
const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const machinesService = require('../../_classes/services/machines');
const shopService = require('../../_classes/services/shop');
const clientService = require('../../_classes/services/clientService');
const framesService = require('../../_classes/services/frames');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('código').setDescription('Escreva um código de apoiador').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'apoiar',
    aliases: ['usereferral', 'usarref'],
    category: 'Social',
    description: 'Utiliza um código de referência para apoiar seu amigo',
    data,
    mastery: 20,
	async execute(interaction) {

                
        const codigo = interaction.options.getString('código')

        const check = await economyService.tp.check(codigo)

        if (!check.exists) {
            const embedtemp = await utility.sendError(interaction, 'Este código de convite não existe, verifique com seu amigo o código!', 'apoiar <codigo>')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        if (check.owner == interaction.user.id) {
            const embedtemp = await utility.sendError(interaction, 'Você não pode utilizar seu próprio código de convite bobinho!\nChame seus amigos para o bot para poder ganhar as recompensas!')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const invitejson = await economyService.tp.get(interaction.user.id)

        if (invitejson.usedinvite) {
            const embedtemp = await utility.sendError(interaction, 'Você só pode utilizar UM código de convite!\nCaso você deseja ganhar recompensas, utilize `/convite` e veja as instruções.')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        let cmaq = await machinesService.get(interaction.user.id)

        if (cmaq < 102) {
            const embedtemp = await utility.sendError(interaction, `Você precisa ter no mínimo a ${shopService.getProduct(102).icon} ${shopService.getProduct(102).name} para apoiar alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const owner = await clientService.current.users.fetch(check.owner)
        
        const embed = new Discord.MessageEmbed()

        .setTitle('💚 Código de convite utilizado com sucesso!')
        .setColor('#5bff45')
        .setDescription('Você utilizou o código do seu amigo `' + owner.tag + ' (' + owner.id + ')` e você recebeu 5 ' + utility.tp.name + ' ' + utility.tp.emoji + ', enquanto seu amigo recebeu 1 ' + utility.tp.name + ' ' + utility.tp.emoji)
        .setFooter('Sabia que você também pode convidar seus amigos e ganhar recompensas?\nUtilize /convite para mais informações')
        await interaction.reply({ embeds: [embed] })

        const embedcmd = new Discord.MessageEmbed()
          .setColor('#b8312c')
          .setTimestamp()
          .setDescription(`O membro ${interaction.user} apoiou ${owner}`)
          .addField('<:mention:788945462283075625> Membro', `${interaction.user.tag} (\`${interaction.user.id}\`)`)
          .addField('<:channel:788949139390988288> Canal', `\`${interaction.channel.name} (${interaction.channel.id})\``)
          .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
          .setFooter(interaction.guild.name + " | " + interaction.guild.id, interaction.guild.iconURL())
          clientService.current.channels.cache.get('826184097814020116').send({ embeds: [embedcmd]});

        updateInviteJson(interaction.user, owner)

	}
};

async function updateInviteJson(member, owner) {

    const invitejson1 = await economyService.tp.get(member.id)
    
    invitejson1.points += 5
    invitejson1.usedinvite = true

    const invitejson2 = await economyService.tp.get(owner.id)

    invitejson2.points += 1
    invitejson2.qnt += 1

    framesService.add(owner.id, 14)

    DatabaseManager.set(member.id, 'players_utils', 'invite', invitejson1)
    DatabaseManager.set(owner.id, 'players_utils', 'invite', invitejson2)

}