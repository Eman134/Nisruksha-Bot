const API = require("../../api.js");
let bg

loadbg()

async function loadbg() {
    bg = await API.img.Canvas.loadImage('./resources/backgrounds/profile/levelup.png');
}

module.exports = async function execute(API, options) {

    // Criando o padrão de imagem do perfil

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const canvas = API.img.Canvas.createCanvas(width, height);
	const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imageDefault, 0, 0);
    
    // Draw username

    ctx.save()
    
    API.img.drawText(ctx, options.level + '', 40, './resources/fonts/Uni-Sans-Thin.ttf', '#ffffff', 178, 77, 4)

    API.img.drawText(ctx, (options.level+1) + '', 40, './resources/fonts/Uni-Sans-Thin.ttf', '#ffffff', 313, 77, 4)

    // Draw avatar
    const avatarimg = await API.img.Canvas.loadImage(options.avatar);
    ctx.drawImage(avatarimg, 21, 35, 80, 80);

    // Transformando a imagem em arquivo
    const attachment = new API.Discord.MessageAttachment(canvas.toBuffer("image/png", { compressionLevel: 10 }), 'image.png');
    return attachment

}