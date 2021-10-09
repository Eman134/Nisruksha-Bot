const API = require("../../_classes/api");

let bg

loadbg()

async function loadbg() {
    bg = await API.img.loadImage(`resources/backgrounds/profile/profile.png`)
}

module.exports = {
    name: 'pnew',
    aliases: [],
    category: 'none',
    description: 'Veja suas informações como nível e tenha um perfil bonito',
    mastery: 6,
    options: [{
        name: 'membro',
        type: 'USER',
        description: 'Veja o perfil de algum membro',
        required: false
    }],
	async execute(API, msg) {

        const exec = Date.now()
        
        let member;
        let args = API.args(msg)

        if (!msg.slash) {
            if (msg.mentions.users.size < 1) {
                if (args.length == 0) {
                    member = msg.author;
                } else {
                    try {
                        let member2 = await client.users.fetch(args[0])
                        if (!member2) {
                            member = msg.author
                        } else {
                            member = member2
                        }
                    } catch {
                        member = msg.author
                    }
                }
            } else {
                member = msg.mentions.users.first();
            }
        } else {
            if (!msg.options.size) {
                member = msg.author
            } else {
                member = msg.options.get('membro').user
            }
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "profile");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'profile', 'visualizar um perfil')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "profile", 10);

        let todel = await msg.quote({ content: `<a:loading:736625632808796250> Carregando informações do perfil` })

        const playerobj = await API.getInfo(member, 'machines')
        const obj = await API.getInfo(member, "players")
        const players_utils = await API.getInfo(member, "players_utils")
        const mastery = await API.playerUtils.getMastery(member)
        const maqimg = API.shopExtension.getProduct(playerobj.machine).img;

        let background = bg
        
        // Draw bio
        let bio = obj.bio;
        let perm = obj.perm;
        // Color bord
        let textcolor = '#dedcde'
        let colors = {
            1: '#ffffff',
            2: '#2f7a78',
            3: '#739f3d',
            4: '#ff6f36',
            5: '#7936ff'
        }

        const img = Date.now()

        const profileimage = await API.img.imagegens.get('profile.js')(API, {

            textcolor: '#dedcde',
            boxescolor: colors[perm],
            name: member.username.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z</>.,+÷=_!@#$%^&*()'":;{}?¿ ])/g, '').trim() + '.',
            bio: bio.replace(/<prefixo>/g, API.prefix),
            mastery,
            url: {
                bg: obj.bglink,
                avatar: member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
                maq: maqimg,
                badges: (!obj.badges || obj.badges == null || obj.badges.length == 0 ? undefined : obj.badges)
            },
            frame: (obj.frames != null && obj.frames[0] != 0 ? API.frames.get(obj.frames[0]) : undefined),
            reps: obj.reps,
            level: playerobj.level,
            xp: playerobj.xp,
            perm,
            profile_color: players_utils.profile_color

        })

        console.log((Date.now()-img) + 'ms | Imagem pronta')

        const send = Date.now()

        await msg.quote({ files: [profileimage] } );

        console.log((Date.now()-send) + 'ms | Envio imagem')
        todel.delete().catch();

        console.log((Date.now()-exec) + 'ms | Execução de comando')

        return

	}
};