module.exports = async function execute(imageServices, options) {
    const { bg, mark, treasureicon, duckicon } = await imageServices.img.getAssets('map');

    // Criando o padrão de imagem do perfil

    options.pos.x = options.pos.x + 80
    options.pos.y = options.pos.y + 80

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const composer = imageServices.img.createComposer(width, height);
	const ctx = composer.getContext("2d");

    ctx.drawImage(imageDefault, 0, 0);

    // Desenhando marca
    ctx.drawImage(mark, options.pos.x, options.pos.y);

    // Colocando o avatar dentro da marca
    let avatar = await imageServices.img.loadImage(options.url.avatar);
    avatar = await imageServices.img.editBorder(avatar, 49, true)
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
    return imageServices.img.getAttachment(composer, 'image.png');

}
