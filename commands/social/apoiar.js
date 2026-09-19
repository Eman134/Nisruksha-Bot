const Discord = require('discord.js');
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

const prisma = require('../../_classes/prisma');

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
        
        const embed = new Discord.EmbedBuilder()

        .setTitle('💚 Código de convite utilizado com sucesso!')
        .setColor('#5bff45')
        .setDescription('Você utilizou o código do seu amigo `' + owner.tag + ' (' + owner.id + ')` e você recebeu 5 ' + utility.tp.name + ' ' + utility.tp.emoji + ', enquanto seu amigo recebeu 1 ' + utility.tp.name + ' ' + utility.tp.emoji)
        .setFooter({ text: 'Sabia que você também pode convidar seus amigos e ganhar recompensas?\nUtilize /convite para mais informações' })
        await interaction.reply({ embeds: [embed] })

        const embedcmd = new Discord.EmbedBuilder()
          .setColor('#b8312c')
          .setTimestamp()
          .setDescription(`O membro ${interaction.user} apoiou ${owner}`)
          .addFields({ name: '<:mention:788945462283075625> Membro', value: `${interaction.user.tag} (\`${interaction.user.id}\`)` })
          .addFields({ name: '<:channel:788949139390988288> Canal', value: `\`${interaction.channel.name} (${interaction.channel.id})\`` })
          .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
          .setFooter({ text: interaction.guild.name + " | " + interaction.guild.id, iconURL: interaction.guild.iconURL() })
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

    const member_id = BigInt(member.id)
    const owner_id = BigInt(owner.id)
    await prisma.players_utils.upsert({ where: { user_id: member_id }, update: { invite: invitejson1 }, create: { user_id: member_id, invite: invitejson1 } })
    await prisma.players_utils.upsert({ where: { user_id: owner_id }, update: { invite: invitejson2 }, create: { user_id: owner_id, invite: invitejson2 } })

}
