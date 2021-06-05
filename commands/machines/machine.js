
const API = require("../../_classes/api");

let bg

loadbg()

async function loadbg() {
    bg = await API.img.loadImage(`resources/backgrounds/maq/maqbackground.png`)
}

module.exports = {
    name: 'máquina',
    aliases: ['maquina', 'maq', 'machine'],
    category: 'Maquinas',
    description: 'Visualiza as informações da sua máquina',
    options: [{
        name: 'membro',
        type: 'USER',
        description: 'Veja a máquina de algum membro',
        required: false,
    }],
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

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
            if (msg.options.length == 0) {
                member = msg.author
            } else {
                member = msg.options[0].user
            }
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "maq");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'maq', 'visualizar uma máquina')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "maq", 10);

        let todel = await msg.quote(`<a:loading:736625632808796250> Carregando informações da máquina`)

        let background = bg

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()

        const playerobj = await API.getInfo(member, 'machines')
        const pobj = await API.getInfo(member, 'players')
        let energia = await API.maqExtension.getEnergy(member);
        let energymax = await API.maqExtension.getEnergyMax(member);

        let maqid = playerobj.machine;
        let maq = API.shopExtension.getProduct(maqid);

        let profundidade = await API.maqExtension.getDepth(member)

        let ep = await API.maqExtension.getEquipedPieces(member);

        background = await API.img.drawText(background, maq.name, 24, './resources/fonts/Uni Sans.ttf', '#ffffff', 250, 38, 4)

        background = await API.img.drawText(background, (Math.round((energia/energymax)*100)) + '%', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 104, 3)
        
        background = await API.img.drawText(background, Math.round(100*(playerobj.durability/maq.durability)) + '%', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 135, 3)

        background = await API.img.drawText(background, profundidade + 'm', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 167, 3)

        let maqimg = await API.img.loadImage(maq.img)
        maqimg = await API.img.resize(maqimg, 100, 100);

        background = await API.img.drawImage(background, maqimg, 200, 80)

        const locked = await API.img.loadImage(`resources/backgrounds/maq/locked.png`)
        

        const mvp = (pobj.mvp == null ? false : true)

        const maxslots = API.maqExtension.getSlotMax(playerobj.level, mvp)
        
        if (maxslots < 5) {
            const locked2 = await API.img.loadImage(`resources/backgrounds/maq/locked2.png`)
            background = await API.img.drawImage(background, locked2, 398, 220)

            let placa;
            let slot = 5-1;
            if (!(ep[slot] == null || ep[slot] == undefined|| ep[slot] == 0)) {
                placa = API.shopExtension.getProduct(ep[slot]);

                ep.length == 1 ? ep = [] : ep.splice(slot, 1);

                const pic = await API.getInfo(member, 'storage')
            
                await API.setInfo(member, 'storage', `"piece:${placa.id}"`, pic[`piece:${placa.id}`]+1)
                await API.setInfo(member, 'machines', `slots`, ep)
                ep = await API.maqExtension.getEquipedPieces(member);

            }

        }


        if (maxslots < 4) {
            background = await API.img.drawImage(background, locked, 312, 252)
        }
        if (maxslots < 3) {
            background = await API.img.drawImage(background, locked, 220, 242)
        }
        if (maxslots < 2) {
            background = await API.img.drawImage(background, locked, 117, 255)
        }
        if (maxslots < 1) {
            background = await API.img.drawImage(background, locked, 19, 219)
        }

        if (ep.length !== 0) {
            if (ep[0]) {
                let chip = API.shopExtension.getProduct(ep[0]);
                let chipimg = await API.img.loadImage(chip.img)
                chipimg = await API.img.resize(chipimg, 60, 60);
                background = await API.img.drawImage(background, chipimg, 19, 219)
            }
            if (ep[1]) {
                let chip = API.shopExtension.getProduct(ep[1]);
                let chipimg = await API.img.loadImage(chip.img)
                chipimg = await API.img.resize(chipimg, 60, 60);
                background = await API.img.drawImage(background, chipimg, 117, 255)
            }
            if (ep[2]) {
                let chip = API.shopExtension.getProduct(ep[2]);
                let chipimg = await API.img.loadImage(chip.img)
                chipimg = await API.img.resize(chipimg, 60, 60);
                background = await API.img.drawImage(background, chipimg, 220, 242)
            }
            if (ep[3]) {
                let chip = API.shopExtension.getProduct(ep[3]);
                let chipimg = await API.img.loadImage(chip.img)
                chipimg = await API.img.resize(chipimg, 60, 60);
                background = await API.img.drawImage(background, chipimg, 312, 252)
            }
            if (ep[4]) {
                let chip = API.shopExtension.getProduct(ep[4]);
                let chipimg = await API.img.loadImage(chip.img)
                chipimg = await API.img.resize(chipimg, 60, 60);
                background = await API.img.drawImage(background, chipimg, 398, 220)
            }
        }
        
        const pieces = await API.maqExtension.getPieces(member);
        const piecesmap = pieces.map((p, index) => `**${p.size}x** ${p.icon} ${p.name} | **ID: ${index+1}**`).join('\n');
        embed.setDescription(`A cada **6 níveis** você adquire **+1 slot** para equipar chipes!`)
        .addField(`<:chip:833521401951944734> Inventário de Chipes`, `\nPara equipar um chipe utilize \`${API.prefix}equipar <ID DO CHIPE>\`\nPara desequipar um chipe utilize \`${API.prefix}desequipar <SLOT>\`\n\n` + (pieces.length <= 0 ? '**Não possui chipes de aprimoramento**' : piecesmap))
        embed.setAuthor(member.tag, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        embed.setColor('#7e6eb5')
        const attachment = await API.img.getAttachment(background, 'maq.png')
        embed.attachFiles([attachment])
        embed.setImage('attachment://maq.png')

        await msg.quote(embed);

        try {
            await todel.delete().catch();
        }catch{

        }

	}
};