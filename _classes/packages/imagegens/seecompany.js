const { reportError } = require('../../debug');
const ImageCharts = require('image-charts');
module.exports = async function execute(API, {

    username,
    rend,
    rends,
    bglink,
    logo,
    hasVacancies,
    type,
    name,
    score,
    descr,
    workers,
    loc,
    taxa,
    company_id,

}) {
    const { bg } = await API.img.getAssets('seecompany');

    // Criando o padrão de imagem do perfil

    const imageDefault = bg
    
    const width = imageDefault.width
    const height = imageDefault.height

    const composer = API.img.createComposer(width, height);
	const ctx = composer.getContext("2d");


    // Colocando o background personalizado do membro

    if (bglink != null) {
        try {
            // Criando o background personalizado como imagem e definindo a resolução
            const imageBackground = await API.img.loadImage(bglink)
            ctx.drawImage(imageBackground, 0, 0, width, height);
        } catch (error) {
            reportError(error, 'imagegen.seecompany.background', { bglink });
        }
    }
    
    // Desenhando a imagem padrão por cima do background
    ctx.drawImage(imageDefault, 0, 0);

    // Desenhando logo
    if (logo == null) {
        API.img.drawText(ctx, `/editarempresa logo`, 12, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 115, 125, 4)
    } else {
        try{
            const logoImage = await API.img.loadImage(logo)
            ctx.drawImage(logoImage, 38, 50, 150, 150);
        } catch (error) {
            reportError(error, 'imagegen.seecompany.logo', { logo });
        }
    }

    // Desenhando icon da empresa

    const icon = await API.img.loadImage(`./resources/backgrounds/company/icon-${type}.png`)
    ctx.drawImage(icon, 218, 57, 25, 25);

    // Vagas
    const hasVacanciesIcon = await API.img.loadImage(hasVacancies ? 'https://cdn.discordapp.com/attachments/736274289254334504/768995522286714910/556678187786960897.png' : 'https://cdn.discordapp.com/attachments/736274289254334504/768995546127138856/556678417018257408.png')
    ctx.drawImage(hasVacanciesIcon, 95, 361, 20, 20);
    // Textos

    API.img.drawText(ctx, `${name}`, 20, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 254, 70,3)
    API.img.drawText(ctx, `Fundador:`, 16, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 213, 185,3)
    API.img.drawText(ctx, `@${username}`, 16, './resources/fonts/MartelSans-Regular.ttf', '#03e8fc', 295, 185,3)
    API.img.drawText(ctx, `${score.toFixed(2)}`, 20, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 620, 70,5)
    API.img.drawText(ctx, `${descr == null ? `Nenhuma descrição da empresa foi definida! /editarempresa desc`: descr}`, 15, './resources/fonts/Uni-Sans-Light.ttf', '#FFFFFF', 211, 105,3)
    API.img.drawText(ctx, `Código: ${company_id}`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 239,3)
    API.img.drawText(ctx, `Taxa: ${taxa}%`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 272,3)
    API.img.drawText(ctx, `Loc: ${API.townExtension.getTownNameByNum(loc)}`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 305,3)
    API.img.drawText(ctx, `Funcionários: ${workers ? workers.length : 0}`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 338,3)
    API.img.drawText(ctx, `Vagas`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 371,3)

    // Gráfico

    const chart_url = await ImageCharts()
		
    .chco('FFFFFF')
    .chdls('FFFFFF,10')
    .chf('bg,s,2e2d2f')
    .chls('3,50,2')
    .chm('B,2e2d2f,0,0,0')
    .chma('10,20,5,10')
    .chs('465x190')
    .cht('lc')
    .chts('FFFFFF,20')
    .chtt('Rendimentos da empresa')
    .chxl(`0:|${rends.length} Último(s) rendimentos`)
    .chxs('0,FFFFFF,13|1,FFFFFF')
    .chxt('x,y')
    .chd(`a:${rend}`)
    .toURL();
    
    const chart = await API.img.loadImage(chart_url)
    ctx.drawImage(chart, 198, 210, 465, 190);
    
    ctx.beginPath();
    ctx.fillStyle = '#2e2d2f';
    ctx.rect(584, 210, 79, 13);
    ctx.fill();
    ctx.closePath();

    // Transformando a imagem em arquivo
    return API.img.getAttachment(composer, 'image.png');

}
