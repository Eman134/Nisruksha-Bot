const API = require("../../api.js");
const opentype = require("opentype.js");
const { drawText } = require("../../modules/img.js");
let bg

loadbg()

async function loadbg() {
    bg = await API.img.Canvas.loadImage('./resources/backgrounds/profile/profile.png');
}

module.exports = async function execute(API, options) {

    /* options : Object

    name: String,
    textcolor: Hex,
    boxescolor: Hex,
    bio: String,
    mastery: Number,
    reps: Number,
    level: Number,
    xp: Number,
    url: {
        bg: String,
        avatar: String,
        maq: String,
        badges: Array
    },
    frame: Object,
    perm: Number,
    profile_color: Number

    */

    // Criando o padrão de imagem do perfil

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const canvas = API.img.Canvas.createCanvas(width, height);
	const ctx = canvas.getContext("2d");

    // Colocando o background personalizado do membro

    if (options.url.bg && options.url.bg != null) {
        
        try{
            
            // Criando o background personalizado como imagem e definindo a resolução
            const imageBackground = await API.img.Canvas.loadImage(options.url.bg)
            
            ctx.drawImage(imageBackground, 0, 0, width, height);
            
        }catch{
        }
        
    }
    
    // Desenhando a imagem padrão por cima do background

    ctx.drawImage(bg, 0, 0, width, height);

    // Escrevendo todos os textos

    // Nome do membro
    drawText(options.name, 30, './resources/fonts/MartelSans-Regular.ttf', options.textcolor, 400, 117, 3)
    // Biografia
    drawText(options.bio, 27, './resources/fonts/MartelSans-Regular.ttf', options.textcolor, 400, 181,3)
    // Reputação
    drawText(options.reps, 30, './resources/fonts/MartelSans-Regular.ttf', options.textcolor, 1060, 117, 3)
    // Maestria
    drawText(options.mastery, 24, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 1150, 670,5)
    // Nível
    drawText(`Nível atual: ${options.level}`, 25, './resources/fonts/MartelSans-Bold.ttf', options.textcolor, 600, 675, 4)
    // Experiência
    drawText(`EXP: ${options.xp}/${options.level*1980} (${(100*options.xp/(options.level*1980)).toFixed(2)}%)`, 25, './resources/fonts/MartelSans-Bold.ttf', options.textcolor, 600, 705, 4)

    // Desenhando avatar

    const avatar = await API.img.Canvas.loadImage(options.url.avatar);
    ctx.drawImage(avatar, 85, 59, 180, 180);

    // Checando moldura

    if (options.frame) {

        // Fazendo o avatar redondo
        if (options.frame.type == 1) {
            ctx.beginPath();
            ctx.arc(90, 90, 180/4, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
        }

        // Criando moldura
        const tempframe = await API.img.Canvas.loadImage(options.frame.url);
        // Desenhando moldura
        ctx.drawImage(tempframe, 50, 24, tempframe.width, tempframe.height);

    }

    const percent = Math.round((100*options.xp/(options.level*1980)))

    ctx.beginPath();
    // Barra de progresso
    ctx.strokeStyle = options.boxescolor;
    ctx.lineWidth = 10;
    ctx.moveTo(0, 745);
    ctx.lineTo(width*percent/100, 745);
    ctx.closePath();
    ctx.lineCap = "square";
    ctx.stroke();
    
    // Barras de cores
    
    if (options.perm > 1 || options.profile_color > 0) {
        
        let gradcolor = 0
        
        if (options.profile_color > 0) gradcolor = options.profile_color
        
        runColor(387, 91, 593, 2, options.boxescolor, gradcolor)
        runColor(1006, 91, 163, 2, options.boxescolor, gradcolor)
        runColor(387, 154, 782, 2, options.boxescolor, gradcolor)
        
    }

    // Badges

    let tempx = 0
    let tempy = 605
    if (options.perm > 1) {
        const tempbadge = await API.img.Canvas.loadImage(`resources/backgrounds/profile/${options.perm}.png`)
        ctx.drawImage(tempbadge, tempx, tempy, 35, 35);
        tempx += 45
    }

    const maqimg = await API.img.Canvas.loadImage(options.url.maq)

    ctx.drawImage(maqimg, tempx, tempy, 35, 35);

    tempx += 45

    if (options.url.badges) {
        for (i = 0; i < options.url.badges.length; i++) {
            let tempbadge = await API.img.Canvas.loadImage(API.badges.get(options.url.badges[i]).url);
            ctx.drawImage(tempbadge, tempx, tempy, 35, 35);
            if (tempx < 1100) tempx += 45
            else break
        }
    }

    // Transformando a imagem em arquivo
    const attachment = new API.Discord.MessageAttachment(canvas.toBuffer("image/png", { compressionLevel: 10 }), 'image.png');
    return attachment

    // Funções

    function drawText (text, fontSize, fontPath, fontColor, x, y, ad) {
    
        if (fontColor.startsWith("#") == false) {
            fontColor = "#"+fontColor;
        }
        if (isNaN(fontSize)) {
            fontSize = 10;
        }
        x = parseFloat(x);
        y = parseFloat(y);

        const font = opentype.loadSync(fontPath);
        let textpath = font.getPath(text, 0, 0, fontSize);
        var bounder = textpath.getBoundingBox();
        let width = bounder.x2 - bounder.x1;
        let height = bounder.y2 - bounder.y1;
        let align = 0;
        if (ad) align = ad;
        /*<option value="0" selected>Top Left</option>
            <option value="1">Top Center</option>
            <option value="2">Top Right</option>
            <option value="3">Middle Left</option>
            <option value="4">Middle Center</option>
            <option value="5">Middle Right</option>
            <option value="6">Bottom Left</option>
            <option value="7">Bottom Center</option>
            <option value="8">Bottom Right</option>
            */
        switch(align) {
            case 1:
                x -= width / 2;
                break;
            case 2:
                x -= width;
                break;
            case 3:
                y -= height / 2;
                break;
            case 4:
                x -= width / 2;
                y -= height / 2;
                break;
            case 5:
                x -= width;
                y -= height / 2;
                break;
            case 6:
                y -= height;
                break;
            case 7:
                x -= width / 2;
                y -= height;
                break;
            case 8:
                x -= width;
                y -= height;
        }
        
        x -= bounder.x1;
        y -= bounder.y1;
        
        const Path = font.getPath(text, x, y, fontSize);
        Path.fill = fontColor;
        Path.draw(ctx);
    }

    function runColor(loc1, loc2, widthw, heightw, color, type){
        ctx.beginPath();
        switch (type) {
            case 1:
                var gradient = ctx.createLinearGradient(0, 0, 170, 0);
                gradient.addColorStop(0, "rgb(197, 0, 0)");
                gradient.addColorStop(0.0707070707070707, "rgb(197, 0, 0)");
                gradient.addColorStop(0.20707070707070707, "rgb(255, 116, 0)");
                gradient.addColorStop(0.4292929292929293, "rgb(255, 252, 0)");
                gradient.addColorStop(0.6212121212121212, "rgb(14, 232, 66)");
                gradient.addColorStop(0.7676767676767676, "rgb(0, 255, 226)");
                gradient.addColorStop(0.8484848484848485, "rgb(28, 94, 237)");
                gradient.addColorStop(0.9545454545454546, "rgb(129, 28, 237)");
                gradient.addColorStop(1, "rgb(129, 28, 237)");
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fillRect(loc1, loc2, widthw, heightw);
                break;
            default:
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fillRect(loc1, loc2, widthw, heightw);
                break;
        }
        
    }

}