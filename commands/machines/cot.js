const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const machinesService = require('../../_classes/services/machines');
const eventsService = require('../../_classes/services/events');
const itemsService = require('../../_classes/services/items');
const imagesService = require('../../_classes/services/images');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder } = require('@discordjs/builders');
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

const v2Flags = Discord.MessageFlags.IsComponentsV2;

function textContainer(content, color) {
    return new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

function errorContainer(interaction, message) {
    return textContainer(`${interaction.user.tag}\n<:error:736274027756388353> ${message}`, 0xb8312c);
}

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
        
            let description = `${minérios.map(m => `${m.icon} 1g de ${m.name.charAt(0).toUpperCase() + m.name.slice(1)} <:arrow:737370913204600853> \`${m.price.atual} ${utility.money}\` ${utility.moneyemoji} ${m.price.ultimoupdate !== '' ? m.price.ultimoupdate : ''}`).join('\n')}`;
            let footer = ""
            if (machinesService.lastcot !== '') {
            footer += ('Última atualização em ' + machinesService.lastcot)
            }
            if (machinesService.proxcot !== 0) {
                footer += ('\nPróxima atualização em ' + compactTime(machinesService.proxcot-Date.now()+(60000*eventsService.getConfig().modules.cotacao)))
            }
            if (footer != "") description += `\n\n${footer}`;

            await interaction.reply({ components: [textContainer(`**📈 Cotação atual dos minérios**\n${description}`, 0x32a893)], flags: v2Flags });

        } else {

            if (!await itemsService.exists(minério)) {
                await interaction.reply({ components: [errorContainer(interaction, `Você precisa identificar um minério EXISTENTE para visualizar sua cotação!\nVerifique os minérios disponíveis utilizando \`/cotação\``)], flags: v2Flags });
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
            
            const container = textContainer(`**📈 Cotação recente de ${minerio.icon} ${minerio.name.charAt(0).toUpperCase() + minerio.name.slice(1)}**`, 0x32a893)
                .addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: 'attachment://cot.png' } }));
            await interaction.reply({ components: [container], files: [attachment], flags: v2Flags });

        }

	}
};
