const API = require("../../api.js");
let bg, mark, treasureicon, duckicon

loadbg()

async function loadbg() {
    bg = await API.img.Canvas.loadImage('./resources/backgrounds/map/map.png');
    mark = await API.img.Canvas.loadImage(`./resources/backgrounds/map/mark.png`)
    treasureicon = await API.img.Canvas.loadImage(`./resources/backgrounds/map/treasure.png`)
    duckicon = await API.img.Canvas.loadImage(`./resources/backgrounds/map/duck.png`)
    mark = await API.img.resize(mark, 250, 250)
}

module.exports = async function execute(API, options) {

    // Criando o padrão de imagem do perfil

    options.pos.x = options.pos.x + 80
    options.pos.y = options.pos.y + 80

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const canvas = API.img.Canvas.createCanvas(width, height);
	const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imageDefault, 0, 0);

    // Desenhando marca
    ctx.drawImage(mark, options.pos.x, options.pos.y);

    // Colocando o avatar dentro da marca
    let avatar = await API.img.Canvas.loadImage(options.url.avatar);
    avatar = await API.img.editBorder(avatar, 49, true)
    ctx.drawImage(avatar, options.pos.x + (51+(51/2)), options.pos.y + (34+(34/2)), 49*2, 49*2);

    // Desenhando tesouro
    if (options.treasure.has) {
        const treasurepos = options.treasure.pos
        ctx.drawImage(treasureicon, treasurepos.x+75, treasurepos.y+150, 64, 64);
    }

    // Desenhando pato
    if (options.duck.has) {
        const duckpos = options.duck.pos
        ctx.drawImage(duckicon, duckpos.x+75, duckpos.y+150, 64, 64);
    }

    // Transformando a imagem em arquivo
    const attachment = new API.Discord.MessageAttachment(canvas.toBuffer("image/png", { compressionLevel: 10 }), 'image.png');
    return attachment

}