const API = require("../../api.js");
let bg

loadbg()

async function loadbg() {
    bg = await API.img.Canvas.loadImage('./resources/backgrounds/cartas/game.png');
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

    const player1 = options.players[0]
    const player2 = options.players[1]

    function normalize(name) {
        return name.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z</>.,+÷=_!@#$%^&*()'":;{}?¿ ])/g, '').trim() + '.'
    }
    
    const game = options.game
    let player1color = '#ffffff'
    let player2color = '#ffffff'
    if (game.winner != -1) {
        if (game.winner == 0) {
            player1color = '#00ff00'
            player2color = '#ff0000'
        } else {
            player1color = '#ff0000'
            player2color = '#00ff00'
        }
    }
    
    API.img.drawText(ctx, normalize(player1.name) + '  [' + (player1.pontos) + ' p]', 30, './resources/fonts/Uni Sans.ttf', player1color, 250, 40, 4)
    API.img.drawText(ctx, normalize(player2.name) + '  [' + (player2.pontos) + ' p]', 30, './resources/fonts/Uni Sans.ttf', player2color, 250, 290, 4)
    
    for (let i = 0; i < player1.cartas.length; i++) {
        const card = player1.cartas[i]
        const image = await API.img.Canvas.loadImage(card.imagem)
        if (i < 5) {
            const x = 28 + (i * 86)
            ctx.drawImage(image, x, 90, image.width, image.height)
        } else {
            const randomed = API.random(20, 45)
            ctx.save()
            ctx.translate(100, 100);
            ctx.rotate((randomed+i*2) * Math.PI / 180);
            ctx.drawImage(image, (i*6), randomed/8, image.width, image.height)
            ctx.translate(-100, -100)
            ctx.rotate(-((randomed+i*2) * Math.PI / 180))
            ctx.restore()
        }
    }

    for (let i = 0; i < player2.cartas.length; i++) {
        const card = player2.cartas[i]
        const image = await API.img.Canvas.loadImage(card.imagem)
        if (i < 5) {
            const x = 28 + (i * 86)
            ctx.drawImage(image, x, 355, image.width, image.height)
        } else {
            const randomed = API.random(20, 45)
            ctx.save()
            ctx.translate(300, 300);
            ctx.rotate((randomed+i*2) * Math.PI / 180);
            ctx.drawImage(image, (i*6), randomed/8, image.width, image.height)
            ctx.translate(-300, -300)
            ctx.rotate(-((randomed+i*2) * Math.PI / 180))
            ctx.restore()
        }
    }

    /*for (let i = 0; i < player2.cartas.length; i++) {
        const card = player2.cartas[i]
        const image = await API.img.Canvas.loadImage(card.imagem)
        const x = 30 + (i * 50)
        ctx.drawImage(image, x, 350, image.width, image.height)
    }*/

    // Transformando a imagem em arquivo
    const attachment = new API.Discord.MessageAttachment(canvas.toBuffer("image/png", { compressionLevel: 10 }), 'image.png');
    return attachment

}