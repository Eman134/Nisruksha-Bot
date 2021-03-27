
const img = {};
const API = require("../api.js");

img.runColor = function(ctx, width, height, color, type){
    switch (type) {
        case 1:

            var gradient = ctx.createLinearGradient(384, 141, 0, 0);
            gradient.addColorStop(0, "rgb(197, 0, 0)");
            gradient.addColorStop(0.0707070707070707, "rgb(197, 0, 0)");
            gradient.addColorStop(0.20707070707070707, "rgb(255, 116, 0)");
            gradient.addColorStop(0.4292929292929293, "rgb(255, 252, 0)");
            gradient.addColorStop(0.6212121212121212, "rgb(14, 232, 66)");
            gradient.addColorStop(0.7676767676767676, "rgb(0, 255, 226)");
            gradient.addColorStop(0.8484848484848485, "rgb(28, 94, 237)");
            gradient.addColorStop(0.9545454545454546, "rgb(129, 28, 237)");
            gradient.addColorStop(1, "rgb(129, 28, 237)");
            ctx.fillStyle = gradient;
            ctx.rect(0, 0, width, height);
            ctx.fill();

            break;
        default:

            ctx.fillStyle = color;
            ctx.rect(0, 0, width, height);
            ctx.fill();

            break;
    }
}

img.loadImage = async function (url){
    const Canvas = require("canvas");
    let result;
    await Canvas.loadImage(url).then((image) => {
        const canvas = Canvas.createCanvas(image.width, image.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, image.width, image.height);
        result = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    });
    return result;
}

img.sendImage = async function (channel, imagedata, text) {
    const Discord = API.Discord;
    const Canvas = require("canvas");
	if(!imagedata) {
        console.log("Unknown image SENDIMAGE");
        return
    };
	let compress = 10;
	const image = new Canvas.Image();
	image.src = imagedata;
	const canvas = Canvas.createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0, image.width, image.height);
	const name = `image.png`;
	const buffer = canvas.toBuffer("image/png", { compressionLevel:compress });
    const attachment = new Discord.MessageAttachment(buffer, name);
    let msg
	try {
    if (text) {
        msg = await channel.send(text, attachment);
    }
    else msg = await channel.send(attachment);
	} catch {
		msg = await channel.send('Um erro ocorreu ao tentar enviar a imagem!')
	}
    return msg
}

img.getAttachment = async function (imagedata, name) {
    const Discord = API.Discord;
    const Canvas = require("canvas");
	if(!imagedata) {
        console.log("Unknown image GETATTACHMENT");
        return
    };
	let compress = 10;
	const image = new Canvas.Image();
	image.src = imagedata;
	const canvas = Canvas.createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0, image.width, image.height);
	const buffer = canvas.toBuffer("image/png", { compressionLevel:compress });
    const attachment = new Discord.MessageAttachment(buffer, name);
    return attachment
}

img.resize = async function(imagedata, x, y) {
    const Canvas = require("canvas");
	if(!imagedata) {
        console.log("Unknown imagedata RESIZE")
		return;
	}
	const image = new Canvas.Image();
	image.src = imagedata;
	const scalex = x;
	const scaley = y;
	let imagew = image.width;
	let imageh = image.height;
	let scalew = 1;
	let scaleh = 1;
	let mirrorw = 1;
	let mirrorh = 1;
	scale(scalex, scaley);
	scalew *= mirrorw;
	scaleh *= mirrorh;
	const canvas = Canvas.createCanvas(imagew, imageh);
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, imagew, imageh);
	ctx.save();
	ctx.translate(imagew / 2, imageh / 2);
	ctx.scale(scalew, scaleh);
	ctx.drawImage(image, -image.width/2, -image.height/2);
	ctx.restore();
	const result = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
	return result;
    
		function scale(w, h) {
			scalew = parseInt(w) / imagew;
			scaleh = parseInt(h) / imageh;
			imagew *= scalew;
			imageh *= scaleh;
		}
}

img.drawImage = async function (imagedata, imagedata2, x, y){
    const Canvas = require("canvas");
    if(!imagedata) {
        return;
    }
    if(!imagedata2) {
        return;
    }

    const image = new Canvas.Image();
    image.src = imagedata;
    const image2 = new Canvas.Image();
    image2.src = imagedata2;
    const canvas = Canvas.createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);
    ctx.drawImage(image2, x, y, image2.width, image2.height);
    const result = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    return result;
}

img.drawText = async function (imagedata, text, fontSize, fontPath, fontColor, x, y, ad) {
    const Canvas = require("canvas");
    const opentype = require("opentype.js");
    if(!imagedata) {
        return;
    }
    if (fontColor.startsWith("#") == false) {
        fontColor = "#"+fontColor;
    }
    if (isNaN(fontSize)) {
        fontSize = 10;
    }
    x = parseFloat(x);
    y = parseFloat(y);
    const image = new Canvas.Image();
    image.src = imagedata;
    const canvas = Canvas.createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);
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
    const result = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    return result;
}

img.editBorder = async function (imagedata, radius, circleinfo) {
    const Canvas = require("canvas");

    if(!imagedata) {
        return;
    }
    const image = new Canvas.Image();
    image.src = imagedata;

    let imagew = image.width;
    let imageh = image.height;
    const canvas = Canvas.createCanvas(imagew, imageh);
    const ctx = canvas.getContext("2d");
    if (radius > 0) {
        corner(radius);
    }
    if (circleinfo && imagew == imageh) {
        circle();
    }
    ctx.drawImage(image, 0, 0);
    const result = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    return result;

    function circle() {
        ctx.beginPath();
        ctx.arc(imagew/2, imageh/2, (imagew+imageh)/4, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
    }
    function corner(r) {
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(imagew-r, 0);
        ctx.quadraticCurveTo(imagew, 0, imagew, r);
        ctx.lineTo(imagew, imageh-r);
        ctx.quadraticCurveTo(imagew, imageh, imagew-r, imageh);
        ctx.lineTo(r, imageh);
        ctx.quadraticCurveTo(0, imageh, 0, imageh-r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();
    }
}

img.generateProgressBar = async function(type, width, height, percent, lineWidth, lineCap, color) {

    const Canvas = require("canvas");
    let Cap;
    switch(lineCap) {
        case 0:
            Cap = "square";
            break;
        case 1:
            Cap = "round";
            break;
    }
    let canvas;
    if (type == 0) {
        canvas = Canvas.createCanvas(width, height);
    } else if (type == 1) {
        canvas = Canvas.createCanvas(height, height);
    }
    const ctx = canvas.getContext("2d");

    if (!color) color = '#000000'

    if (color.startsWith("#")) {
        ctx.strokeStyle = color;
    } else {
        ctx.strokeStyle = "#"+color;
    }
    ctx.lineWidth = lineWidth;
    if (type == 0) {
        ctx.beginPath();
        switch(lineCap) {
            case 0:
                ctx.moveTo(0, height/2);
                ctx.lineTo(width*percent/100, height/2);
                break;
            case 1:
                let center = lineWidth/2;
                let top = height/2-center;
                let bottom = height/2+center;
                ctx.moveTo(center, top);
                ctx.lineTo(width-lineWidth, top);
                ctx.arcTo(width, top, width, height/2, center);
                ctx.arcTo(width, bottom, top, bottom, center);
                ctx.lineTo(center, bottom);
                ctx.arcTo(0, bottom, 0, height/2, center);
                ctx.arcTo(0, top, center, top, center);
                ctx.closePath();
                ctx.clip();
                ctx.beginPath();
                ctx.moveTo(-center, height/2);
                ctx.lineTo(width*percent/100-center, height/2);
                break;
        }
    } else if (type == 1) {
        ctx.translate(height / 2, height / 2);
        ctx.rotate(-0.5 * Math.PI);
        ctx.beginPath();
        ctx.arc(0, 0, width, 0, Math.PI * 2 * percent / 100, false);
    }
    ctx.lineCap = Cap;
    ctx.stroke();
    const result = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    return result;
}

img.createImage = async function(width, height, color, type) {
    const Canvas = require("canvas");
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    img.runColor(ctx, width, height, color, type)

    const result = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    return result;
}

img.rotate = async function(imagedata, degrees) {
    const Canvas = require("canvas");
    const image = new Canvas.Image();
    image.src = imagedata;

    const radian = Math.PI / 180 * degrees;

    let imagew = image.width;
    let imageh = image.height;
    let scalew = 1;
    let scaleh = 1;
    let mirrorw = 1;
    let mirrorh = 1;

    rotate(radian);

    scalew *= mirrorw;
    scaleh *= mirrorh;
    const canvas = Canvas.createCanvas(imagew, imageh);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, imagew, imageh);
    ctx.save();
    ctx.translate(imagew / 2, imageh / 2);
    ctx.rotate(radian);
    ctx.scale(scalew, scaleh);
    ctx.drawImage(image, -image.width/2, -image.height/2);
    ctx.restore();

    const result = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

    function rotate(r) {
        let imagex = imagew * Math.abs(Math.cos(r)) + imageh * Math.abs(Math.sin(r));
        let imagey = imageh * Math.abs(Math.cos(r)) + imagew * Math.abs(Math.sin(r));
        imagew = imagex;
        imageh = imagey;
    }
    return result;
}

module.exports = img;