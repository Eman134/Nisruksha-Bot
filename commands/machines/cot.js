const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const machinesService = require('../../_classes/services/machines');
const eventsService = require('../../_classes/services/events');
const itemsService = require('../../_classes/services/items');
const imagesService = require('../../_classes/services/images');
const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()

const { readFileSync } = require('fs')

const jsonStringores = readFileSync('./_json/ores.json', 'utf8')
const customerores = JSON.parse(jsonStringores);

const minérios = customerores

const options = (option) => {
    option.setName('minério').setDescription('Veja a cotação de um minério específico')
    minérios.map(key => {
        option.addChoices({ name: key.name, value: key.name })
    })
    return option.setRequired(false)
}

data.addStringOption(options)

module.exports = {
    name: 'cotação',
    aliases: ['price', 'cotas', 'cot'],
    category: 'Maquinas',
    description: 'Veja a cotação atual de cada unidade para venda',
    data,
    mastery: 15,
	async execute(interaction) {

        
        const minério = interaction.options.getString('minério');
    
        if (minério == null) {
        
            const embed = new Discord.EmbedBuilder()
            .setColor('#32a893')
            .setTitle('📈 Cotação atual dos minérios')
            .setDescription(`${minérios.map(m => `${m.icon} 1g de ${m.name.charAt(0).toUpperCase() + m.name.slice(1)} <:arrow:737370913204600853> \`${m.price.atual} ${utility.money}\` ${utility.moneyemoji} ${m.price.ultimoupdate !== '' ? m.price.ultimoupdate : ''}`).join('\n')}`)
            let footer = ""
            if (machinesService.lastcot !== '') {
            footer += ('Última atualização em ' + machinesService.lastcot)
            }
            if (machinesService.proxcot !== 0) {
                footer += ('\nPróxima atualização em ' + compactTime(machinesService.proxcot-Date.now()+(60000*eventsService.getConfig().modules.cotacao)))
            }
            if (footer != "") embed.setFooter({ text: footer })

            await interaction.reply({ embeds: [embed] });

        } else {

            if (!await itemsService.exists(minério)) {
                const embedtemp = await utility.sendError(interaction, `Você precisa identificar um minério EXISTENTE para visualizar sua cotação!\nVerifique os minérios disponíveis utilizando \`/cotação\``)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            let minerio = await itemsService.get(minério, "minerios")

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
            
            let cotimg = await imagesService.loadImage(chart_url)
            
            const hide = await imagesService.createImage(79, 13, '#ffffff')
            cotimg = await imagesService.drawImage(cotimg, hide, 621, 0)

            const attachment = await imagesService.getAttachment(cotimg, 'cot.png')
            
            const embed = new Discord.EmbedBuilder()
            .setColor('#32a893')
            .setTitle('📈 Cotação recente de ' + minerio.icon + ' ' + minerio.name.charAt(0).toUpperCase() + minerio.name.slice(1))
            .setImage('attachment://cot.png')
            await interaction.reply({ embeds: [embed], files: [attachment] });

        }

	}
};
