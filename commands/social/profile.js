const API = require("../../_classes/api");

let bg

loadbg()

async function loadbg() {
    bg = await API.img.loadImage(`resources/backgrounds/profile/profile.png`)
}

module.exports = {
    name: 'perfil',
    aliases: ['p', 'profile', 'level'],
    category: 'Social',
    description: 'Veja suas informações como nível e tenha um perfil bonito',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;
        
        let member;
        let args = API.args(msg)
        if (msg.mentions.users.size < 1) {
            if (args.length == 0) {
                member = msg.author;
            } else {
                let fetched
                try {
                    fetched = await API.client.users.fetch(args[0])
                    member = fetched
                } catch {
                    member = msg.author
                }
            }
        } else {
            member = msg.mentions.users.first();
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "profile");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'profile', 'visualizar um perfil')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "profile", 10);

        let todel = await msg.quote(`<a:loading:736625632808796250> Carregando informações do perfil`)

        let background = bg
        
        // Draw bio
        const obj = await API.getInfo(member, "players")
        let bio = '';
        let perm = 0;
        // Color bord
        let textcolor = '#dedcde'
        let colors = {
            1: '#ffffff',
            2: '#2f7a78',
            3: '#739f3d',
            4: '#ff6f36',
            5: '#7936ff'
        }

        if (!(obj == undefined)) {
            bio = obj.bio;
            perm = obj.perm;
        }
        if (obj.bglink != null) {
            try{
                background2 = await API.img.loadImage(obj.bglink)
                res = await API.img.resize(background2, 900, 500)
                background = await API.img.drawImage(res, background, 0, 0)
            }catch(err){API.setInfo(member, 'players', 'bglink', null);API.sendErrorM(msg, `Houve um erro ao carregar seu background personalizado! Por favor não apague a mensagem de comando de background!\nEnvie uma nova imagem utilizando \`${API.prefix}background\``)}
        }

        // Draw username
        background = await API.img.drawText(background, `${member.username.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z</>.,+÷=_!@#$%^&*()'":;{}?¿ ])/g, '').trim()}.`, 30, './resources/fonts/MartelSans-Regular.ttf', textcolor, 200, 52,3)
        background = await API.img.drawText(background, bio.replace(/<prefixo>/g, API.prefix), 27, './resources/fonts/MartelSans-Regular.ttf', textcolor, 200, 117,3)
        // Draw circle avatar
        let avatar = await API.img.loadImage(member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        avatar = await API.img.resize(avatar, 145, 145);
        avatar = await API.img.editBorder(avatar, 75, true)
        background = await API.img.drawImage(background, avatar, 10, 10)
        // Badge
        if (perm > 1) background = await API.img.drawImage(background, await API.img.loadImage(`resources/backgrounds/profile/${perm}.png`), 590, 27)

        // Town name and Mark
        /*let mark = await API.img.loadImage(`resources/backgrounds/map/mark.png`)
        mark = await API.img.resize(mark, 50, 50)
        let townname = await API.townExtension.getTownName(member);

        background = await API.img.drawImage(background, mark, 655, 27)
        background = await API.img.drawText(background, `${townname}`, 30, './resources/fonts/MartelSans-Regular.ttf', textcolor, 705, 52,3)*/
        background = await API.img.drawText(background, `${obj.reps} REPS`, 30, './resources/fonts/MartelSans-Regular.ttf', textcolor, 756, 50,4)

        const obj2 = await API.getInfo(member, "machines")
        const players_utils = await API.getInfo(member, "players_utils")

        let progress = await API.img.generateProgressBar(1, 75, 155, Math.round(100*obj2.xp/(obj2.level*1980)), 5, 1, colors[perm])
        background = await API.img.drawImage(background, progress, 5, 5)

        background = await API.img.drawText(background, `Nível atual: ${obj2.level}`, 20, './resources/fonts/MartelSans-Bold.ttf', textcolor, 450, 445, 4)
        background = await API.img.drawText(background, `XP: ${obj2.xp}/${obj2.level*1980} (${Math.round(100*obj2.xp/(obj2.level*1980))}%)`, 20, './resources/fonts/MartelSans-Bold.ttf', '#FFFFFF', 450, 475, 4)

        let progress2 = await API.img.generateProgressBar(0, 900, 17, Math.round(100*obj2.xp/(obj2.level*1980)), 10, 0, colors[perm])
        background = await API.img.drawImage(background, progress2, 0, 407)

        if (perm > 1 || players_utils.profile_color > 0) {

            let gradcolor = 0

            if (players_utils.profile_color > 0) gradcolor = players_utils.profile_color

            let colorbord = await API.img.createImage(440, 2, colors[perm], gradcolor)
            let colorbord2 = await API.img.createImage(682, 2, colors[perm], gradcolor)
            let colorbord3 = await API.img.createImage(225, 2, colors[perm], gradcolor)

            background = await API.img.drawImage(background, colorbord, 186, 27)
            background = await API.img.drawImage(background, colorbord2, 186, 92)
            background = await API.img.drawImage(background, colorbord3, 643, 27)

        }

        try {
        await API.img.sendImage(msg.channel, background);
        todel.delete().catch();
        }catch{}

	}
};