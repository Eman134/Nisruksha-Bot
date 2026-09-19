const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()

const { readFileSync } = require('fs')

const jsonStringores = readFileSync('./_json/ores.json', 'utf8')
const customerores = JSON.parse(jsonStringores);

const minérios = customerores

const options = (option) => {
    option.setName('minério').setDescription('Veja a cotação de um minério específico')
    minérios.map(key => {
        option.addChoice(key.name, key.name)
    })
    return option.setRequired(false)
}

data.addStringOption(options)

module.exports = {
    requiredServices: ["Discord","events","img","itemExtension","maqExtension","money","moneyemoji","ms","sendError"],
    name: 'cotação',
    aliases: ['price', 'cotas', 'cot'],
    category: 'Maquinas',
    description: 'Veja a cotação atual de cada unidade para venda',
    data,
    mastery: 15,
	async execute(interaction, svcDiscord, svcEvents, svcImg, svcItemExtension, svcMaqExtension, svcMoney, svcMoneyemoji, svcMs, svcSendError) {
        const minério = interaction.options.getString('minério');
    
        if (minério == null) {
        
            const embed = new svcDiscord.MessageEmbed()
            .setColor('#32a893')
            .setTitle('📈 Cotação atual dos minérios')
            .setDescription(`${minérios.map(m => `${m.icon} 1g de ${m.name.charAt(0).toUpperCase() + m.name.slice(1)} <:arrow:737370913204600853> \`${m.price.atual} ${svcMoney}\` ${svcMoneyemoji} ${m.price.ultimoupdate !== '' ? m.price.ultimoupdate : ''}`).join('\n')}`)
            let footer = ""
            if (svcMaqExtension.lastcot !== '') {
            footer += ('Última atualização em ' + svcMaqExtension.lastcot)
            }
            if (svcMaqExtension.proxcot !== 0) {
                footer += ('\nPróxima atualização em ' + svcMs(svcMaqExtension.proxcot-Date.now()+(60000*svcEvents.getConfig().modules.cotacao), true))
            }
            if (footer != "") embed.setFooter(footer)

            await interaction.reply({ embeds: [embed] });

        } else {

            if (!svcItemExtension.exists(minério)) {
                const embedtemp = await svcSendError(interaction, `Você precisa identificar um minério EXISTENTE para visualizar sua cotação!\nVerifique os minérios disponíveis utilizando \`/cotação\``)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            let minerio = svcItemExtension.get(minério, "minerios")

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
            
            let cotimg = await svcImg.loadImage(chart_url)
            
            const hide = await svcImg.createImage(79, 13, '#ffffff')
            cotimg = await svcImg.drawImage(cotimg, hide, 621, 0)

            const attachment = await svcImg.getAttachment(cotimg, 'cot.png')
            
            const embed = new svcDiscord.MessageEmbed()
            .setColor('#32a893')
            .setTitle('📈 Cotação recente de ' + minerio.icon + ' ' + minerio.name.charAt(0).toUpperCase() + minerio.name.slice(1))
            .setImage('attachment://cot.png')
            await interaction.reply({ embeds: [embed], files: [attachment] });

        }

	}
};
