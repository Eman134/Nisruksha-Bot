const { reportError } = require('../../debug');
module.exports = async function execute(imageServices, options) {
    const { bg } = await imageServices.img.getAssets('profile');

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

    const composer = imageServices.img.createComposer(width, height);
	const ctx = composer.getContext("2d");

    // Colocando o background personalizado do membro

    if (options.url.bg && options.url.bg != null) {
        try {
            // Criando o background personalizado como imagem e definindo a resolução
            const imageBackground = await imageServices.img.loadImage(options.url.bg)
            ctx.drawImage(imageBackground, 0, 0, width, height);
        } catch (error) {
            reportError(error, 'imagegen.profile.background', { background: options.url.bg });
        }
    }
    
    // Desenhando a imagem padrão por cima do background
    ctx.drawImage(bg, 0, 0, width, height);

    // Escrevendo todos os textos

    // Nome do membro
    imageServices.img.drawText(ctx, options.name, 30, './resources/fonts/MartelSans-Regular.ttf', options.textcolor, 400, 117, 3)
    // Biografia
    imageServices.img.drawText(ctx, options.bio, 27, './resources/fonts/MartelSans-Regular.ttf', options.textcolor, 400, 181,3)
    // Reputação
    imageServices.img.drawText(ctx, options.reps, 30, './resources/fonts/MartelSans-Regular.ttf', options.textcolor, 1060, 117, 3)
    // Maestria
    imageServices.img.drawText(ctx, options.mastery, 24, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 1150, 670,5)
    // Nível
    imageServices.img.drawText(ctx, `Nível atual: ${options.level}`, 25, './resources/fonts/MartelSans-Bold.ttf', options.textcolor, 600, 675, 4)
    // Experiência
    imageServices.img.drawText(ctx, `EXP: ${options.xp}/${options.level*1980} (${(100*options.xp/(options.level*1980)).toFixed(2)}%)`, 25, './resources/fonts/MartelSans-Bold.ttf', options.textcolor, 600, 705, 4)
    imageServices.img.drawText(ctx, `debug`, 25, './resources/fonts/MartelSans-Bold.ttf', options.textcolor, -50, 0, 4)

    const percent = Math.round((100*options.xp/(options.level*1980)))

    // Badges

    let tempx = 0
    let tempy = 605
    if (options.perm > 1) {
        const tempbadge = await imageServices.img.loadImage(`resources/backgrounds/profile/${options.perm}.png`)
        ctx.drawImage(tempbadge, tempx, tempy, 35, 35);
        tempx += 45
    }

    const maqimg = await imageServices.img.loadImage(options.url.maq)

    ctx.drawImage(maqimg, tempx, tempy, 35, 35);

    tempx += 45

    if (options.url.badges) {
        for (let i = 0; i < options.url.badges.length; i++) {
            let tempbadge = await imageServices.img.loadImage(imageServices.badges.get(options.url.badges[i]).url);
            ctx.drawImage(tempbadge, tempx, tempy, 35, 35);
            if (tempx < 1100) tempx += 45
            else break
        }
    }

    ctx.save()

    // Barra de progresso
    ctx.strokeStyle = options.boxescolor;
    ctx.lineWidth = 10;
    ctx.moveTo(0, 745);
    ctx.lineTo(width*percent/100, 745);
    ctx.closePath();
    ctx.lineCap = "square";
    ctx.stroke();

    ctx.restore()
    
    // Barras de cores

    ctx.save()
    
    if (options.perm > 1 || options.profile_color > 0) {
        
        let gradcolor = 0
        
        if (options.profile_color > 0) gradcolor = options.profile_color
        
        runColor(387, 91, 593, 2, options.boxescolor, gradcolor)
        runColor(1006, 91, 163, 2, options.boxescolor, gradcolor)
        runColor(387, 154, 782, 2, options.boxescolor, gradcolor)
        
    }

    ctx.restore()

    // Checando moldura e avatar

    if (options.frame) {

        const tempframe = await imageServices.img.loadImage(options.frame.url);

        ctx.drawImage(tempframe, 50, 24, tempframe.width, tempframe.height);

    }

    const avatar = await imageServices.img.loadImage(options.url.avatar);
    const avatarImage = options.frame?.type == 1
        ? await imageServices.img.editBorder(avatar, 90, true)
        : avatar;
    ctx.drawImage(avatarImage, 85, 59, 180, 180);

    // Transformando a imagem em arquivo
    return imageServices.img.getAttachment(composer, 'image.png');

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
