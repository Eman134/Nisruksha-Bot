const API = require("../../_classes/api");

module.exports = {
    name: 'apoiar',
    aliases: ['usereferral', 'usarref'],
    category: 'Social',
    description: 'Utiliza um código de referência para apoiar seu amigo',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        
        const args = API.args(msg)
        
        if (args.length == 0) {
            API.sendError(msg, 'Você precisa pedir ao seu amigo o código de convite dele!', 'usarcodigo <codigo>')
            return
        }

        const check = await checkExists(args[0])

        if (!check.exists) {
            API.sendError(msg, 'Este código de convite não existe, verifique com seu amigo o código!', 'usarcodigo <codigo>')
            return
        }

        if (check.owner == msg.author.id) {
            API.sendError(msg, 'Você não pode utilizar seu próprio código de convite bobinho!\nChame seus amigos para o bot para poder ganhar as recompensas!')
            return
        }

        const invitejson = await getInviteJson(msg.author)

        if (invitejson.usedinvite) {
            API.sendError(msg, 'Você só pode utilizar um código de convite!\nCaso você deseja ganhar recompensas, utilize `' + API.prefix + 'convite` e veja as instruções.')
            return
        }

        const owner = await API.client.users.fetch(check.owner)
        
        const embed = new Discord.MessageEmbed()

        .setTitle('💚 Código de convite utilizado com sucesso!')
        .setColor('#5bff45')
        .setDescription('Você utilizou o código do seu amigo `' + owner.tag + ' (' + owner.id + ')` e você recebeu 🎫 5 pontos de convite, enquanto seu amigo recebeu 🎫 1 ponto de convite')
        .setFooter('Sabia que você também pode convidar seus amigos e ganhar recompensas?\nUtilize ' + API.prefix + 'convite para mais informações')
        msg.channel.send(embed)

        updateInviteJson(msg.author, owner)

	}
};

async function checkExists(code) {

    const text =  `SELECT * FROM players_utils WHERE invite IS NOT NULL;`
    let array = Array
    try {
        let res = await API.db.pool.query(text);
        array = res.rows
    } catch (err) {
        API.client.emit('error', err)
    }

    let exists = false

    let owner
    
    if (array.length <= 0) return exists
    
    for (i = 0; i < array.length; i++) {

        if (array[i].invite.code.toLowerCase() == code.toLowerCase()) {
            exists = true
            owner = array[i].user_id
            break;
        }
    }

    return {
        exists,
        owner
    }

}

async function getInviteJson(member) {

    const utilsobj = await API.getInfo(member, 'players_utils')

    let invitejson = {
        code: String,
        qnt: Number,
        points: Number,
        usedinvite: Boolean
    }

    if (utilsobj.invite == null) {

        function randomString(length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVapdjjwq1923878@98123*jjXlsa=WXYZ01010101010101098342819273057801010101';
            var charactersLength = characters.length;
            for ( var i = 0; i < length; i++ ) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }

        let tempcode = randomString(6)
        if (await checkExists(tempcode)) {
            tempcode = randomString(6)
        }

        invitejson.code = tempcode
        invitejson.qnt = 0
        invitejson.points = 0
        invitejson.usedinvite = false

        API.setInfo(member, 'players_utils', 'invite', invitejson)

    } else invitejson = utilsobj.invite

    return invitejson
}

async function updateInviteJson(member, owner) {

    const utilsobj1 = await API.getInfo(member, 'players_utils')

    const invitejson1 = utilsobj1.invite

    invitejson1.points += 5
    invitejson1.usedinvite = true

    const utilsobj2 = await API.getInfo(owner, 'players_utils')

    const invitejson2 = utilsobj2.invite

    invitejson2.points += 1
    invitejson2.qnt += 1

    API.setInfo(member, 'players_utils', 'invite', invitejson1)
    API.setInfo(owner, 'players_utils', 'invite', invitejson2)

}