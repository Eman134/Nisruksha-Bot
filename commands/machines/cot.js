module.exports = {
    name: 'cotação',
    aliases: ['price', 'cotas', 'cot'],
    category: 'Maquinas',
    description: 'Veja a cotação atual de cada unidade para venda',
    options: [{
        name: 'minério',
        type: 'STRING',
        description: 'Veja a cotação de um minério específico',
        required: false,
    }],
    mastery: 15,
	async execute(API, msg) {

        const Discord = API.Discord;

        const args = API.args(msg)
    
        if (args.length == 0) {
        
            const embed = new Discord.MessageEmbed()
            .setColor('#32a893')
            .setTitle('📈 Cotação atual dos minérios')
            .setDescription(`${API.maqExtension.ores.obj.minerios.map(m => `${m.icon} 1g de ${m.name.charAt(0).toUpperCase() + m.name.slice(1)} <:arrow:737370913204600853> \`${m.price.atual} ${API.money}\` ${API.moneyemoji} ${m.price.ultimoupdate !== '' ? m.price.ultimoupdate : ''}`).join('\n')}`)
            let footer = ""
            if (API.maqExtension.lastcot !== '') {
            footer += ('Última atualização em ' + API.maqExtension.lastcot)
            }
            if (API.maqExtension.proxcot !== 0) {
                footer += ('\nPróxima atualização em ' + API.ms2(API.maqExtension.proxcot-Date.now()+(60000*API.events.getConfig().cotacao)))
            }
            if (footer != "") embed.setFooter(footer)

            await msg.quote(embed);

        }

        if (args.length > 0) {


            if (!API.maqExtension.ores.checkExists(args[0])) {
                const embedtemp = await API.sendError(msg, `Você precisa identificar um minério EXISTENTE para visualizar sua cotação!\nVerifique os minérios disponíveis utilizando \`${API.prefix}cotação\``)
                await msg.quote(embedtemp)
                return;
            }

            let minerio = API.maqExtension.ores.getDrop(args[0], "minerios")

            let prefix = ""
            if (minerio.price.updates.length == 0) {
                prefix = minerio.price.default + ',' + minerio.price.default
            } if (minerio.price.updates.length == 1) {
                prefix = minerio.price.default + ','
            }

            const ImageCharts = require('image-charts');

            const chart_url = await ImageCharts()
		
            .chco('E4061C')
            .chd('a:' + prefix + minerio.price.updates.reverse().map((update) => update.price).join(','))
            .chm('s,E4061C,0,-1,15.0|B,FCECF4,0,0,0')
            .chma('0,0,20,10,5,10,12')
            .chs('700x450')
            .cht('lc')
            .chxl('0:|' + minerio.price.updates.map((update) => update.date).join('|') + '|1:|' + minerio.price.min + '|' + minerio.price.default + '|' + minerio.price.max)
            .chxr('1,' + minerio.price.min + ',' + minerio.price.max)
            .chxt('x,y')
            
            .toURL();
            
            let cotimg = await API.img.loadImage(chart_url)
            //chart = await API.img.resize(chart, 465, 190);
            
            hide = await API.img.createImage(79, 13, '#ffffff')
            cotimg = await API.img.drawImage(cotimg, hide, 621, 0)

            const attachment = await API.img.getAttachment(cotimg, 'cot.png')
            
            const embed = new Discord.MessageEmbed()
            .setColor('#32a893')
            .setTitle('📈 Cotação recente de ' + minerio.icon + ' ' + minerio.name.charAt(0).toUpperCase() + minerio.name.slice(1))
            .attachFiles([attachment])
            .setImage('attachment://cot.png')
            await msg.quote(embed);

        }

	}
};