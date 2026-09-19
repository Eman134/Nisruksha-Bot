const { reportWarning } = require('../../debug');
module.exports = async function execute(imageServices, {

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
    const { bg, locked, locked2, rachadura1, rachadura2, rachadura3, rachadura4, rachadura5 } = await imageServices.img.getAssets('machine');

    // Criando o padrão de imagem

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const composer = imageServices.img.createComposer(width, height);
	const ctx = composer.getContext("2d");

    ctx.drawImage(imageDefault, 0, 0);

    imageServices.img.drawText(ctx, profundidade + 'm', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 167, 3)
    imageServices.img.drawText(ctx, (Math.round((energia/energiamax)*100)) + '%', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 104, 3)
    imageServices.img.drawText(ctx, machineproduct.name, 24, './resources/fonts/Uni Sans.ttf', '#ffffff', 250, 38, 4)
    imageServices.img.drawText(ctx, Math.round(durabilityPercent) + '%', 20, './resources/fonts/Uni-Sans-Light.ttf', '#ffffff', 380, 135, 3)

    // Desenhando máquina
    const machineimage = await loadOptionalImage(imageServices, machineproduct.img, () => createWhiteImage(imageServices, 100, 100), 'imagegen.machine.machine');
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
            const chip = imageServices.shopExtension.getProduct(equipedchip.id);
            const chipimg = await loadOptionalImage(imageServices, chip?.img, () => createWhiteImage(imageServices, 60, 60), 'imagegen.machine.chip.1');
            if (chipimg) ctx.drawImage(chipimg, 19, 219, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 19, 219, 60, 60) : null

            ctx.fillStyle = '#545454';
            ctx.fillRect(19, 276, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(19, 276, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
        if (equippedchips[1]) {
            const equipedchip = equippedchips[1]
            const chip = imageServices.shopExtension.getProduct(equipedchip.id);
            const chipimg = await loadOptionalImage(imageServices, chip?.img, () => createWhiteImage(imageServices, 60, 60), 'imagegen.machine.chip.2');
            if (chipimg) ctx.drawImage(chipimg, 117, 255, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 117, 255, 60, 60) : null
            
            ctx.fillStyle = '#545454'
            ctx.fillRect(117, 312, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(117, 312, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
        if (equippedchips[2]) {
            const equipedchip = equippedchips[2]
            const chip = imageServices.shopExtension.getProduct(equipedchip.id);
            const chipimg = await loadOptionalImage(imageServices, chip?.img, () => createWhiteImage(imageServices, 60, 60), 'imagegen.machine.chip.3');
            if (chipimg) ctx.drawImage(chipimg, 220, 242, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 220, 242, 60, 60) : null

            ctx.fillStyle = '#545454'
            ctx.fillRect(220, 299, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(220, 299, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
        if (equippedchips[3]) {
            const equipedchip = equippedchips[3]
            const chip = imageServices.shopExtension.getProduct(equipedchip.id);
            const chipimg = await loadOptionalImage(imageServices, chip?.img, () => createWhiteImage(imageServices, 60, 60), 'imagegen.machine.chip.4');
            if (chipimg) ctx.drawImage(chipimg, 312, 252, 60, 60)

            const rachadura = getRachadura(equipedchip.durabilitypercent)
            rachadura ? ctx.drawImage(rachadura, 312, 252, 60, 60) : null

            ctx.fillStyle = '#545454'
            ctx.fillRect(312, 309, (60)*(100)/100, 3);
            ctx.fillStyle = getProgressColor(equipedchip.durabilitypercent);
            ctx.fillRect(312, 309, (60)*(equipedchip.durabilitypercent)/100, 3);
        }
        if (equippedchips[4]) {
            const equipedchip = equippedchips[4]
            const chip = imageServices.shopExtension.getProduct(equipedchip.id);
            const chipimg = await loadOptionalImage(imageServices, chip?.img, () => createWhiteImage(imageServices, 60, 60), 'imagegen.machine.chip.5');
            if (chipimg) ctx.drawImage(chipimg, 398, 220, 60, 60)

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

    // Refrigeração
    const refrigerationGradient = ctx.createLinearGradient(0, 0, 0, 200);
    refrigerationGradient.addColorStop(0.020202020202020204, "rgb(126, 239, 244)");
    refrigerationGradient.addColorStop(0.4090909090909091, "rgb(126, 239, 244)");
    refrigerationGradient.addColorStop(0.6919191919191919, "rgb(84, 184, 197)");
    refrigerationGradient.addColorStop(1, "rgb(40, 98, 108)");
    ctx.fillStyle = refrigerationGradient;
    ctx.fillRect(22, 162 - refrigerationPercent, 15, refrigerationPercent);

    // Pressão
    const pressureGradient = ctx.createLinearGradient(0, 0, 0, 200);
    pressureGradient.addColorStop(0, "rgb(239, 255, 0)");
    pressureGradient.addColorStop(0.2222222222222222, "rgb(239, 255, 0)");
    pressureGradient.addColorStop(0.41919191919191917, "rgb(255, 223, 0)");
    pressureGradient.addColorStop(0.5909090909090909, "rgb(254, 193, 1)");
    pressureGradient.addColorStop(0.797979797979798, "rgb(253, 181, 49)");
    pressureGradient.addColorStop(0.9545454545454546, "rgb(254, 145, 1)");
    pressureGradient.addColorStop(1, "rgb(254, 145, 1)");
    ctx.fillStyle = pressureGradient;
    ctx.fillRect(55, 162 - pressurePercent, 15, pressurePercent);

    // Poluentes
    const pollutantsGradient = ctx.createLinearGradient(0, 0, 0, 200);
    pollutantsGradient.addColorStop(0.020202020202020204, "rgb(147, 244, 126)");
    pollutantsGradient.addColorStop(0.4090909090909091, "rgb(147, 244, 126)");
    pollutantsGradient.addColorStop(0.6919191919191919, "rgb(89, 176, 90)");
    pollutantsGradient.addColorStop(1, "rgb(38, 50, 38)");
    ctx.fillStyle = pollutantsGradient;
    ctx.fillRect(86, 162 - pollutantsPercent, 15, pollutantsPercent);

    const finalImage = await imageServices.img.resize(composer, width*0.65, height*0.65)

    // Transformando a imagem em arquivo
    return imageServices.img.getAttachment(finalImage, 'image.png');

}

async function loadOptionalImage(imageServices, url, fallback, context) {
    try {
        if (!url) throw new Error('Image URL is empty');
        return await imageServices.img.loadImage(url);
    } catch (error) {
        reportWarning('Optional image unavailable; using fallback', context, {
            url,
            error: error.message,
            fallback: Boolean(fallback)
        });
        return fallback ? fallback() : null;
    }
}

function createWhiteImage(imageServices, width, height) {
    const composer = imageServices.img.createComposer(width, height);
    const context = composer.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    return composer;
}
