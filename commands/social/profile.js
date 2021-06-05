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
    mastery: 6,
    options: [{
        name: 'membro',
        type: 'USER',
        description: 'Veja o perfil de algum membro',
        required: false
    }],
	async execute(API, msg) {
        
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
            if (msg.options.size == 0) {
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

        let todel = await msg.quote(`<a:loading:736625632808796250> Carregando informações do perfil`)

        const playerobj = await API.getInfo(member, 'machines')
        const obj = await API.getInfo(member, "players")

        let background = bg
        
        // Draw bio
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
                res = await API.img.resize(background2, 1200, 750)
                background = await API.img.drawImage(res, background, 0, 0)
            }catch(err){
                API.setInfo(member, 'players', 'bglink', null);
                const embedtemp = await API.sendError(msg, `Houve um erro ao carregar seu background personalizado! Por favor não apague a mensagem de comando de background!\nEnvie uma nova imagem utilizando \`${API.prefix}background\``)
                await msg.quote({ embed: embedtemp, mention: true } )
            }
        }

        // user
        background = await API.img.drawText(background, `${member.username.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z</>.,+÷=_!@#$%^&*()'":;{}?¿ ])/g, '').trim()}.`, 30, './resources/fonts/MartelSans-Regular.ttf', textcolor, 400, 117,3)
        background = await API.img.drawText(background, bio.replace(/<prefixo>/g, API.prefix), 27, './resources/fonts/MartelSans-Regular.ttf', textcolor, 400, 181,3)
        // Mastery
        const mastery = await API.playerUtils.getMastery(member)
        background = await API.img.drawText(background, mastery, 24, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 1150, 670,5)
        // avatar e moldura

        let avatar = await API.img.loadImage(member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        avatar = await API.img.resize(avatar, 180, 180);

        if (obj.frames != null && obj.frames[0] != 0) {
            
            const frame = API.frames.get(obj.frames[0])

            if (frame.type == 1) avatar = await API.img.editBorder(avatar, 90, true)

            let tempframe = await API.img.loadImage(frame.url);
            background = await API.img.drawImage(background, avatar, 85, 59)
            background = await API.img.drawImage(background, tempframe, 50, 24)
            
        } else {
            background = await API.img.drawImage(background, avatar, 85, 59)
        }
        

        // badges

        let tempx = 0
        let tempy = 605
        if (perm > 1) {
            let tempbadge = await API.img.loadImage(`resources/backgrounds/profile/${perm}.png`)
            tempbadge = await API.img.resize(tempbadge, 35, 35);
            background = await API.img.drawImage(background, tempbadge, tempx, tempy)
            tempx += 45
        }

        let maqid = playerobj.machine;
        let maq = API.shopExtension.getProduct(maqid);

        let maqimg = await API.img.loadImage(maq.img)
        maqimg = await API.img.resize(maqimg, 35, 35);

        background = await API.img.drawImage(background, maqimg, tempx, tempy)
        tempx += 45

        if (obj.badges != null) {
            for (i = 0; i < obj.badges.length; i++) {
                let tempbadge0 = API.badges.get(obj.badges[i])
                let tempbadge = await API.img.loadImage(tempbadge0.url);
                tempbadge = await API.img.resize(tempbadge, 35, 35);
                background = await API.img.drawImage(background, tempbadge, tempx, tempy)
                if (tempx < 1100) tempx += 45
                else break
            }
        }

        background = await API.img.drawText(background, obj.reps, 30, './resources/fonts/MartelSans-Regular.ttf', textcolor, 1060, 117, 3)

        const obj2 = await API.getInfo(member, "machines")
        const players_utils = await API.getInfo(member, "players_utils")

        //let progress = await API.img.generateProgressBar(1, 75, 155, Math.round(100*obj2.xp/(obj2.level*1980)), 5, 1, colors[perm])
        //background = await API.img.drawImage(background, progress, 5, 5)

        background = await API.img.drawText(background, `Nível atual: ${obj2.level}`, 25, './resources/fonts/MartelSans-Bold.ttf', textcolor, 600, 675, 4)
        background = await API.img.drawText(background, `XP: ${obj2.xp}/${obj2.level*1980} (${Math.round(100*obj2.xp/(obj2.level*1980))}%)`, 25, './resources/fonts/MartelSans-Bold.ttf', '#FFFFFF', 600, 705, 4)

        let progress2 = await API.img.generateProgressBar(0, 1200, 10, Math.round(100*obj2.xp/(obj2.level*1980)), 10, 0, colors[perm])
        background = await API.img.drawImage(background, progress2, 0, 740)

        if (perm > 1 || players_utils.profile_color > 0) {

            let gradcolor = 0

            if (players_utils.profile_color > 0) gradcolor = players_utils.profile_color

            let colorbord = await API.img.createImage(593, 2, colors[perm], gradcolor)
            let colorbord2 = await API.img.createImage(163, 2, colors[perm], gradcolor)
            let colorbord3 = await API.img.createImage(782, 2, colors[perm], gradcolor)

            background = await API.img.drawImage(background, colorbord, 387, 91)
            background = await API.img.drawImage(background, colorbord2, 1006, 91)
            background = await API.img.drawImage(background, colorbord3, 387, 154)

        }

        try {
            await API.img.sendImage(msg.channel, background, msg.id);
            todel.delete().catch();
        }catch{}

	}
};