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
    playerstaminamax,
    username,
    equips,
    stptdp,
    stcstatdm,

    percent01,
    percent02,
    percent03,
    percent04,

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
    ctx.drawImage(avatar, 47, 16, 98, 98);

    // Desenhando monstro
    const monsteravatar = await API.img.Canvas.loadImage(monster.image);
    ctx.drawImage(monsteravatar, 47, 136, 98, 98);

    // Desenhando equipamentos

    for (let i = 0; i < equips.length; i++) {
        if (equips[i]) {
            const equip = await API.img.Canvas.loadImage(equips[i].img);
            ctx.drawImage(equip, equips[i].x, equips[i].y, 13, 13);
        }
    }

    // Desenhando morte
    if (stptdp <= 0) {
        ctx.drawImage(deadbg, 47, 16);
    }
    if (stcstatdm <= 0) {
        ctx.drawImage(deadbg, 47, 136);
    }

    // Desenhar barras de progresso na imagem
    ctx.fillStyle = '#de4040';
    if (percent01 > 0) ctx.fillRect(146, 46, (249)*percent01/100, 18);
    if (percent03 > 0) ctx.fillRect(146, 166, (249)*percent03/100, 18);
    ctx.fillStyle = '#d6801a';
    if (percent02 > 0) ctx.fillRect(146, 46, (249)*percent02/100, 18);
    if (percent04 > 0) ctx.fillRect(146, 166, (249)*percent04/100, 18);
    
    API.img.drawText(ctx, `Estamina: ${stptdp}/${playerstaminamax}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 396, 40, 8)
    API.img.drawText(ctx, username, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 396, 70, 2)
    API.img.drawText(ctx, `Nível ${playerlevel}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 155, 70, 0)
    API.img.drawText(ctx, `Estamina: ${stcstatdm}/${monster.sta}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 396, 160, 8)
    API.img.drawText(ctx, monster.name, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 396, 190, 2)
    API.img.drawText(ctx, `Nível ${monster.level}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 155, 190, 0)

    // Transformando a imagem em arquivo
    const attachment = new API.Discord.MessageAttachment(canvas.toBuffer("image/png", { compressionLevel: 10 }), 'image.png');
    return attachment

}