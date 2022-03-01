const API = require("../../api.js");
let bg, deadbg

loadbg()

async function loadbg() {
    bg = await API.img.Canvas.loadImage('./resources/backgrounds/company/battle.png');
    deadbg = await API.img.Canvas.loadImage('./resources/backgrounds/company/dead.png');
}

module.exports = async function execute(API, {

    avatarurl,
    monster,
    playerlevel,
    username,
    equips,
    stptdp,
    stcstatdm,

}) {

    // Criando o padrão de imagem

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const canvas = API.img.Canvas.createCanvas(width, height);
	const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imageDefault, 0, 0);

    // Desenhando avatar
    const avatar = await API.img.Canvas.loadImage(avatarurl);
    ctx.drawImage(avatar, 33, 76, 98, 98);

    // Desenhando monstro
    const monsteravatar = await API.img.Canvas.loadImage(monster.image);
    ctx.drawImage(monsteravatar, 319, 76, 98, 98);

    // Desenhando equipamentos

    for (let iequip = 0; i < equips.length; i++) {
        if (equips[iequip]) {
            const equip = await API.img.Canvas.loadImage(equips[iequip].img);
            const tempx = equips[iequip].x
            const tempy = equips[iequip].y
            ctx.drawImage(equip, tempx, tempy, 13, 13);
        }
    }

    // Desenhando morte
    if (stptdp <= 0) {
        ctx.drawImage(deadbg, 33, 76);
    }
    if (stcstatdm <= 0) {
        ctx.drawImage(deadbg, 319, 76);
    }
    

    API.img.drawText(ctx, username, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 32, 180, 0)
    API.img.drawText(ctx, `Nível ${playerlevel}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 32, 200, 0)

    API.img.drawText(ctx, monster.name, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 318, 180, 0)
    API.img.drawText(ctx, `Nível ${monster.level}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 318, 200, 0)

    // Transformando a imagem em arquivo
    const attachment = new API.Discord.MessageAttachment(canvas.toBuffer("image/png", { compressionLevel: 10 }), 'image.png');
    return attachment

}