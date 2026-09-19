const Discord = require('discord.js');
const economyService = require('../../_classes/services/economy');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const machinesService = require('../../_classes/services/machines');
const shopService = require('../../_classes/services/shop');
const clientService = require('../../_classes/services/clientService');
const framesService = require('../../_classes/services/frames');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const errorContainer = (interaction, message, usage) => new ContainerBuilder()
    .setAccentColor(0xb8312c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`));

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
            await interaction.reply({ components: [errorContainer(interaction, 'Este código de convite não existe, verifique com seu amigo o código!', 'apoiar <codigo>')], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        }

        if (check.owner == interaction.user.id) {
            await interaction.reply({ components: [errorContainer(interaction, 'Você não pode utilizar seu próprio código de convite bobinho!\nChame seus amigos para o bot para poder ganhar as recompensas!')], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        }

        const invitejson = await economyService.tp.get(interaction.user.id)

        if (invitejson.usedinvite) {
            await interaction.reply({ components: [errorContainer(interaction, 'Você só pode utilizar UM código de convite!\nCaso você deseja ganhar recompensas, utilize `/convite` e veja as instruções.')], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        }

        let cmaq = await machinesService.get(interaction.user.id)

        if (cmaq < 102) {
            const product = await shopService.getProduct(102);
            await interaction.reply({ components: [errorContainer(interaction, `Você precisa ter no mínimo a ${product.icon} ${product.name} para apoiar alguém!`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        }

        const owner = await clientService.current.users.fetch(check.owner)
        
        const container = new ContainerBuilder()
            .setAccentColor(0x5bff45)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 💚 Código de convite utilizado com sucesso!'),
                new TextDisplayBuilder().setContent('Você utilizou o código do seu amigo `' + owner.tag + ' (' + owner.id + ')` e você recebeu 5 ' + utility.tp.name + ' ' + utility.tp.emoji + ', enquanto seu amigo recebeu 1 ' + utility.tp.name + ' ' + utility.tp.emoji),
                new TextDisplayBuilder().setContent('-# Sabia que você também pode convidar seus amigos e ganhar recompensas?\nUtilize /convite para mais informações')
            );
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })

        const logContainer = new ContainerBuilder()
            .setAccentColor(0xb8312c)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`O membro ${interaction.user} apoiou ${owner}\n\n**<:mention:788945462283075625> Membro**\n${interaction.user.tag} (\`${interaction.user.id}\`)\n\n**<:channel:788949139390988288> Canal**\n\`${interaction.channel.name} (${interaction.channel.id})\`\n\n-# ${interaction.guild.name} | ${interaction.guild.id}`)
            );
        clientService.current.channels.cache.get('826184097814020116').send({ components: [logContainer], flags: Discord.MessageFlags.IsComponentsV2 });

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
