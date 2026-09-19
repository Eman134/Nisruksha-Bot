module.exports = async function execute(imageServices, options) {
    const { bg } = await imageServices.img.getAssets('levelup');

    // Criando o padrão de imagem do perfil

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const composer = imageServices.img.createComposer(width, height);
	const ctx = composer.getContext("2d");

    ctx.drawImage(imageDefault, 0, 0);
    
    // Draw username

    ctx.save()
    
    imageServices.img.drawText(ctx, options.level + '', 40, './resources/fonts/Uni-Sans-Thin.ttf', '#ffffff', 178, 77, 4)

    imageServices.img.drawText(ctx, (options.level+1) + '', 40, './resources/fonts/Uni-Sans-Thin.ttf', '#ffffff', 313, 77, 4)

    // Draw avatar
    const avatarimg = await imageServices.img.loadImage(options.avatar);
    ctx.drawImage(avatarimg, 21, 35, 80, 80);

    // Transformando a imagem em arquivo
    return imageServices.img.getAttachment(composer, 'image.png');

}
