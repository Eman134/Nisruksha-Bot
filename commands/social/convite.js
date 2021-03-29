const API = require("../../_classes/api");

module.exports = {
    name: 'meucodigo',
    aliases: ['referral', 'ref'],
    category: 'Social',
    description: 'Visualiza os status de convite de jogadores',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        const invitejson = await getInviteJson(msg.author)
        const code = invitejson.code
        const qnt = invitejson.qnt
        const points = invitejson.points
        
        const embed = new Discord.MessageEmbed()

        .setTitle('<:info:736274028515295262> Informações de Convite')
        .setColor('#34ebcf')
        .setDescription('Convide seus amigos para jogar o bot e ganhe recompensas!\nQuem utilizar seu código receberá 🎫 5 pontos de convite, e você ganhará 🎫 1 ponto de convite a cada amigo que usar o código\nPara resgatar suas recompensas acesse \`'+ API.prefix +'loja convites\`\n\n📩 Código de Convite: **' + code + '**\n\`' + API.prefix +'apoiar ' + code +'\`\n✨ Total de usos: **' + qnt + '**\n🎫 Pontos de convites: **' + points + '**\nJá utilizou um código: ' + (invitejson.usedinvite ? '✅' : '❌'))
        msg.quote(embed)

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