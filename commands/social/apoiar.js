const API = require("../../_classes/api");

module.exports = {
    name: 'apoiar',
    aliases: ['usereferral', 'usarref'],
    category: 'Social',
    description: 'Utiliza um código de referência para apoiar seu amigo',
    options: [{
        name: 'código',
        type: 'STRING',
        description: 'Escreva um código de apoiador',
        required: true,
    }],
    mastery: 20,
	async execute(API, msg) {

        const Discord = API.Discord;
        
        const args = API.args(msg)
        
        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, 'Você precisa pedir ao seu amigo o código de convite dele!', 'usarcodigo <codigo>')
            await msg.quote(embedtemp)
            return
        }

        const check = await API.eco.tp.check(args[0])

        if (!check.exists) {
            const embedtemp = await API.sendError(msg, 'Este código de convite não existe, verifique com seu amigo o código!', 'usarcodigo <codigo>')
            await msg.quote(embedtemp)
            return
        }

        if (check.owner == msg.author.id) {
            const embedtemp = await API.sendError(msg, 'Você não pode utilizar seu próprio código de convite bobinho!\nChame seus amigos para o bot para poder ganhar as recompensas!')
            await msg.quote(embedtemp)
            return
        }

        const invitejson = await API.eco.tp.get(msg.author)

        if (invitejson.usedinvite) {
            const embedtemp = await API.sendError(msg, 'Você só pode utilizar UM código de convite!\nCaso você deseja ganhar recompensas, utilize `' + API.prefix + 'convite` e veja as instruções.')
            await msg.quote(embedtemp)
            return
        }

        let cmaq = await API.maqExtension.get(msg.author)

        if (cmaq < 102) {
            const embedtemp = await API.sendError(msg, `Você precisa ter no mínimo a ${API.shopExtension.getProduct(102).icon} ${API.shopExtension.getProduct(102).name} para apoiar alguém!`)
            await msg.quote(embedtemp)
            return
        }

        const owner = await API.client.users.fetch(check.owner)
        
        const embed = new Discord.MessageEmbed()

        .setTitle('💚 Código de convite utilizado com sucesso!')
        .setColor('#5bff45')
        .setDescription('Você utilizou o código do seu amigo `' + owner.tag + ' (' + owner.id + ')` e você recebeu 5 ' + API.tp.name + ' ' + API.tp.emoji + ', enquanto seu amigo recebeu 1 ' + API.tp.name + ' ' + API.tp.emoji)
        .setFooter('Sabia que você também pode convidar seus amigos e ganhar recompensas?\nUtilize ' + API.prefix + 'convite para mais informações')
        msg.channel.send(embed)

        const embedcmd = new API.Discord.MessageEmbed()
          .setColor('#b8312c')
          .setTimestamp()
          .setDescription(`O membro ${msg.author} apoiou ${owner}`)
          .addField('<:mention:788945462283075625> Membro', `${msg.author.tag} (\`${msg.author.id}\`)`)
          .addField('<:channel:788949139390988288> Canal', `\`${msg.channel.name} (${msg.channel.id})\``)
          .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
          .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
          API.client.channels.cache.get('826184097814020116').send(embedcmd);

        updateInviteJson(msg.author, owner)

	}
};

async function updateInviteJson(member, owner) {

    const invitejson1 = await API.eco.tp.get(member)
    
    invitejson1.points += 5
    invitejson1.usedinvite = true

    const invitejson2 = await API.eco.tp.get(owner)

    invitejson2.points += 1
    invitejson2.qnt += 1

    API.setInfo(member, 'players_utils', 'invite', invitejson1)
    API.setInfo(owner, 'players_utils', 'invite', invitejson2)

}