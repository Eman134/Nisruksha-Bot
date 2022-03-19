const API = require("../../api.js");
let bg, locked, locked2, rachadura1, rachadura2, rachadura3, rachadura4, rachadura5

loadbg()

async function loadbg() {
    bg = await API.img.Canvas.loadImage('./resources/backgrounds/maq/maqbackground.png');
    locked = await API.img.Canvas.loadImage(`./resources/backgrounds/maq/locked.png`)
    locked2 = await API.img.Canvas.loadImage(`./resources/backgrounds/maq/locked2.png`)

    rachadura1 = await API.img.Canvas.loadImage(`./resources/backgrounds/rachaduras/1.png`)
    rachadura2 = await API.img.Canvas.loadImage(`./resources/backgrounds/rachaduras/2.png`)
    rachadura3 = await API.img.Canvas.loadImage(`./resources/backgrounds/rachaduras/3.png`)
    rachadura4 = await API.img.Canvas.loadImage(`./resources/backgrounds/rachaduras/4.png`)
    rachadura5 = await API.img.Canvas.loadImage(`./resources/backgrounds/rachaduras/5.png`)
}

module.exports = async function execute(API, {

    profundidade,
    energia,
    energiamax,
    machineproduct,
    durabilityPercent,
    pressurePercent,
    pollutantsPercent,
    refrigerationPercent,
    maxslots,
    equippedchips,

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

    API.img.drawText(ctx, profundidade + 'm', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 167, 3)
    API.img.drawText(ctx, (Math.round((energia/energiamax)*100)) + '%', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 104, 3)
    API.img.drawText(ctx, machineproduct.name, 24, './resources/fonts/Uni Sans.ttf', '#ffffff', 250, 38, 4)
    API.img.drawText(ctx, Math.round(durabilityPercent) + '%', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 135, 3)

    // Desenhando máquina
    const machineimage = await API.img.Canvas.loadImage(machineproduct.img)
    ctx.drawImage(machineimage, 200, 80, 100, 100);

    if (maxslots < 5) {
        ctx.drawImage(locked2, 398, 220)
    }
    if (maxslots < 4) {
        ctx.drawImage(locked, 312, 252)
    }
    if (maxslots < 3) {
        ctx.drawImage(locked, 220, 242)
    }
    if (maxslots < 2) {
        ctx.drawImage(locked, 117, 255)
    }
    if (maxslots < 1) {
        ctx.drawImage(locked, 19, 219)
    }

    function getProgressColor(progres) {
        if (progres/100 <= 0.25) {
            return '#ff0000'
        }
        if (progres/100 <= 0.5) {
            return '#ff7f00'
        }
        if (progres/100 <= 0.75) {
            return '#ffff00'
        }
        if (progres/100 <= 1) {
            return '#00ff00'
        }
    }

    function getRachadura(progress) {
        if (progress/100 <= 0.3) {
            return rachadura5
        }
        if (progress/100 <= 0.4) {
            return rachadura4
        }
        if (progress/100 <= 0.5) {
            return rachadura3
        }
        if (progress/100 <= 0.60) {
            return rachadura2
        }
        if (progress/100 <= 0.79) {
            return rachadura1
        }
        if (progress/100 >= 80) {
            return undefined
        }
    }

    if (equippedchips.length !== 0) {
        if (equippedchips[0]) {
            const equipedchip = equippedchips[0]
            const chip = API.shopExtension.getProduct(equipedchip.id);
            const chipimg = await API.img.Canvas.loadImage(chip.img)
            ctx.drawImage(chipimg, 19, 219, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 19, 219, 60, 60) : null

            ctx.fillStyle = '#545454';
            ctx.fillRect(19, 276, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(19, 276, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
        if (equippedchips[1]) {
            const equipedchip = equippedchips[1]
            const chip = API.shopExtension.getProduct(equipedchip.id);
            const chipimg = await API.img.Canvas.loadImage(chip.img)
            ctx.drawImage(chipimg, 117, 255, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 117, 255, 60, 60) : null
            
            ctx.fillStyle = '#545454'
            ctx.fillRect(117, 312, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(117, 312, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
        if (equippedchips[2]) {
            const equipedchip = equippedchips[2]
            const chip = API.shopExtension.getProduct(equipedchip.id);
            const chipimg = await API.img.Canvas.loadImage(chip.img)
            ctx.drawImage(chipimg, 220, 242, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 220, 242, 60, 60) : null

            ctx.fillStyle = '#545454'
            ctx.fillRect(220, 299, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(220, 299, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
        if (equippedchips[3]) {
            const equipedchip = equippedchips[3]
            const chip = API.shopExtension.getProduct(equipedchip.id);
            const chipimg = await API.img.Canvas.loadImage(chip.img)
            ctx.drawImage(chipimg, 312, 252, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 312, 252, 60, 60) : null

            ctx.fillStyle = '#545454'
            ctx.fillRect(312, 309, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(312, 309, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
        if (equippedchips[4]) {
            const equipedchip = equippedchips[4]
            const chip = API.shopExtension.getProduct(equipedchip.id);
            const chipimg = await API.img.Canvas.loadImage(chip.img)
            ctx.drawImage(chipimg, 398, 220, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 398, 220, 60, 60) : null

            ctx.fillStyle = '#545454';
            ctx.fillRect(398, 277, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(398, 277, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
    }

    // Desenhando pressão, poluentes e refrigeração
    ctx.fillStyle = '#545454';

    ctx.fillRect(22, 62, 15, (100)*(100)/100);
    ctx.fillRect(55, 62, 15, (100)*(100)/100);
    ctx.fillRect(86, 62, 15, (100)*(100)/100);

    ctx.save();

    // Refrigeração
    ctx.translate(22+15/2, 62+refrigerationPercent-(refrigerationPercent/2)+((100-refrigerationPercent)/2));
    ctx.rotate(Math.PI);
    ctx.translate(-(22+15/2), -(62+refrigerationPercent-(refrigerationPercent/2)+((100-refrigerationPercent)/2)))
    var gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0.020202020202020204, "rgb(126, 239, 244)");
    gradient.addColorStop(0.4090909090909091, "rgb(126, 239, 244)");
    gradient.addColorStop(0.6919191919191919, "rgb(84, 184, 197)");
    gradient.addColorStop(1, "rgb(40, 98, 108)");
    ctx.fillStyle = gradient;
    ctx.fillRect(22, 62, 15, refrigerationPercent);

    ctx.restore()

    ctx.save();

    // Pressão
    ctx.translate(55+15/2, 62+pressurePercent-(pressurePercent/2)+((100-pressurePercent)/2));
    ctx.rotate(Math.PI);
    ctx.translate(-(55+15/2), -(62+pressurePercent-(pressurePercent/2)+((100-pressurePercent)/2)))
    var gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgb(239, 255, 0)");
    gradient.addColorStop(0.2222222222222222, "rgb(239, 255, 0)");
    gradient.addColorStop(0.41919191919191917, "rgb(255, 223, 0)");
    gradient.addColorStop(0.5909090909090909, "rgb(254, 193, 1)");
    gradient.addColorStop(0.797979797979798, "rgb(253, 181, 49)");
    gradient.addColorStop(0.9545454545454546, "rgb(254, 145, 1)");
    gradient.addColorStop(1, "rgb(254, 145, 1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(55, 62, 15, pressurePercent);

    ctx.restore()

    ctx.save();

    // Poluentes
    ctx.translate(86+15/2, 62+pollutantsPercent-(pollutantsPercent/2)+((100-pollutantsPercent)/2));
    ctx.rotate(Math.PI);
    ctx.translate(-(86+15/2), -(62+pollutantsPercent-(pollutantsPercent/2)+((100-pollutantsPercent)/2)))
    var gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0.020202020202020204, "rgb(147, 244, 126)");
    gradient.addColorStop(0.4090909090909091, "rgb(147, 244, 126)");
    gradient.addColorStop(0.6919191919191919, "rgb(89, 176, 90)");
    gradient.addColorStop(1, "rgb(38, 50, 38)");
    ctx.fillStyle = gradient;
    ctx.fillRect(86, 62, 15, pollutantsPercent);

    ctx.restore()

    const finalcanvas = await API.img.resize(canvas, width*0.65, height*0.65)

    // Transformando a imagem em arquivo
    const attachment = new API.Discord.MessageAttachment(finalcanvas.toBuffer("image/png", { compressionLevel: 10 }), 'image.png');
    return attachment

}