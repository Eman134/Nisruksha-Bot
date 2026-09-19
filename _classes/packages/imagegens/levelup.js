module.exports = async function execute(API, options) {
    const { bg } = await API.img.getAssets('levelup');

    // Criando o padrão de imagem do perfil

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const composer = API.img.createComposer(width, height);
	const ctx = composer.getContext("2d");

    ctx.drawImage(imageDefault, 0, 0);
    
    // Draw username

    ctx.save()
    
    API.img.drawText(ctx, options.level + '', 40, './resources/fonts/Uni-Sans-Thin.ttf', '#ffffff', 178, 77, 4)

    API.img.drawText(ctx, (options.level+1) + '', 40, './resources/fonts/Uni-Sans-Thin.ttf', '#ffffff', 313, 77, 4)

    // Draw avatar
    const avatarimg = await API.img.loadImage(options.avatar);
    ctx.drawImage(avatarimg, 21, 35, 80, 80);

    // Transformando a imagem em arquivo
    return API.img.getAttachment(composer, 'image.png');

}
