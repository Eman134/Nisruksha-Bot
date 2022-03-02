const { prefix, owner, token, ip, app } = require("../_classes/config");
const serverdb = {};
const version = require('../package.json').version
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js')
const Database = require('./manager/DatabaseManager');
const DatabaseManager = new Database();

const API = {

    debug: false,
    logs: {
        cmds: true,
        falhas: true
    },

    // Extensions
    serverdb,
    // Utils
    prefix,
    owner,
    version,
    token,
    id: app.id,
    lastsave: '',
    cmdsexec: 0,
    playerscmds: [],
    // Strings
    money: 'moedas',
    moneyemoji: '<:moneybag:736290479406317649>',
    money2: 'cristais',
    money2emoji: '<:estilhas:743176785986060390>',
    money3: 'fichas',
    money3emoji: '<:ficha:741827151879471115>',
    tp: {
        name: 'pontos temporais',
        emoji: '<:tp:841870541274087455>'
    },
    mastery: {
        name: 'pontos de maestria',
        emoji: '🔰'
    }
};

API.ms = function(s) {
    function pad(n, z) {
        z = z || 2;
        return ('00' + n).slice(-z);
    }

    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    var days = parseInt(Math.floor(hrs / 24));
    hrs = parseInt(hrs % 24);

    var meses = parseInt(Math.floor(days / 30));
    days = parseInt(days % 30);

    return (meses > 0 ? pad(meses) + ' mêses, ' : "") + (days > 0 ? pad(days) + ' dias, ' : "") + (hrs > 0 ? pad(hrs) + ' horas, ' : "") + (mins > 0 ? pad(mins) + ' minutos e ' : "") + (pad(secs) + ' segundos')
}

API.ms2 = function(s) {
    function pad(n, z) {
        z = z || 2;
        return ('00' + n).slice(-z);
    }

    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    var days = parseInt(Math.floor(hrs / 24));
    hrs = parseInt(hrs % 24);

    var meses = parseInt(Math.floor(days / 30));
    days = parseInt(days % 30);

    return (meses > 0 ? pad(meses) + 'mo, ' : "") + (days > 0 ? pad(days) + 'd, ' : "") + (hrs > 0 ? pad(hrs) + 'h, ' : "") + (mins > 0 ? pad(mins) + 'm e ' : "") + (pad(secs) + 's')
}

API.getProgress = function(maxticks, tickchar, seekpos, atual, max, percento) {
    
    const percentage = atual / max;
    const progress = Math.round((maxticks * percentage));
    const emptyProgress = maxticks - progress;

    if (typeof tickchar == 'object') {
        for (xii = 0; xii < Object.keys(tickchar).length; xii++) {
            if ( Math.round(percentage*100) >= parseInt(Object.keys(tickchar).reverse()[xii])){
                tickchar = tickchar[Object.keys(tickchar).reverse()[xii]]
                break;
            }
        }
    }

    const progressText = tickchar.repeat(progress);
    const emptyProgressText = seekpos.repeat(emptyProgress);

    const bar = '[' + progressText + emptyProgressText + "] "+ (percento ? Math.round((percentage)*100) + "%" : "(" + atual + "/" + max +")") ;
    return bar;
}

API.isInt = function(value) {
    if (isNaN(value)) {
        return false;
    }
    var x = parseFloat(value);
    return (x | 0) === x;
}

API.format = function(num) {
	return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
}

API.sendError = async function (interaction, s, usage) {
    const Discord = API.Discord;
    const embedError = new Discord.MessageEmbed()
        .setColor('#b8312c')
        .setDescription('<:error:736274027756388353> ' + s)
        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    if (usage) {
        embedError.addField('Exemplo de uso', "\n`/" + usage + "`")
    }

    return embedError
    
}

API.uptime = function() {
    let uptime = process.uptime(),
        days = Math.floor((uptime % 31536000) / 86400),
        hours = Math.floor((uptime % 86400) / 3600),
        minutes = Math.floor((uptime % 3600) / 60),
        seconds = Math.round(uptime % 60),
        uptimestring = (days > 0 ? days + " dias, " : "") + (hours > 0 ? hours + " horas, " : "") + (minutes > 0 ? minutes + " minutos, " : "") + (seconds > 0 ? seconds + " segundos" : "")
    return uptimestring;
    
}

API.random = function(min, max, doubled) {

    if (doubled) return min + (max - min) * Math.random();

    return Math.floor(Math.random() * (max - min) + min);
}

API.isOdd = function(n) {
   return Math.abs(n % 2) == 1;
}

API.getBotInfoProperties = async function() {

    function formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
	}

    const text =  `SELECT pg_size_pretty(pg_database_size('postgres'));`
    const res = await DatabaseManager.query(text);
    const dbsize = res.rows[0]["pg_size_pretty"];

    const globalsObj = await DatabaseManager.get(app.id, 'globals');
    const embed = new API.Discord.MessageEmbed();
    embed.setTitle(`(/) ${API.client.user.username}`);

    embed.addField(`🕐 Tempo online`, `\`${API.uptime()}\``, true)

    embed.addField(`💾 Último save`, `\`${API.lastsave == '' ? 'Não ocorreu':API.lastsave}\``, true)

    embed.addField(`📓 Comandos executados`, `Após iniciar: \`${API.cmdsexec}\`\nTotal: \`${globalsObj.totalcmd}\`\nPlayers após iniciar: \`${API.playerscmds.length}\``, true)

    embed.addField(`🪐 População`, `Servidores: \`${API.client.guilds.cache.size}\`\nMinerando: \`${API.cacheLists.waiting.length('mining')}\`\nCaçando: \`${API.cacheLists.waiting.length('hunting')}\`\nColetando: \`${API.cacheLists.waiting.length('collecting')}\`\nPescando: \`${API.cacheLists.waiting.length('fishing')}\`\nAguardando: \`${API.cacheLists.remember.get().size}\``, true)

    embed.addField(`📎 Versões`, `Node.js \`${process.versions.node}\`\nDiscord.js \`${API.Discord.version}\`\nNisruksha \`${API.version}\``, true)

	let ownerx = await API.client.users.fetch('422002630106152970')

    embed.addField(`<:list:736274028179750922> Detalhados`, `Ping: \`${API.client.ws.ping} ms\`\nConsumo: \`${formatBytes(process.memoryUsage().rss)}\`\nTamanho da db: \`${dbsize}\`\nFundador: \`${ownerx.tag}\``, true)
    
    embed.setTimestamp()
	
	return embed

	
}

API.setCompanieInfo = async function (user_id, company, string, value) {

    const text2 =  `INSERT INTO companies(company_id, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING;`,
    values2 = [company, user_id];
    try {

        await DatabaseManager.query(text2, values2);

    } catch (err) {
        console.log(err.stack)
        API.client.emit('error', err)
    }

    const text =  `UPDATE companies SET ${string} = $3 WHERE user_id = $1 AND company_id = $2;`,
        values = [user_id, company, value]

    try {
        await DatabaseManager.query(text, values);
    } catch (err) {
        console.log(err.stack)
        API.client.emit('error', err)
    }

};

API.toNumber = function(x) {
    return parseInt((x+'').replace(/k/g, '000').replace(/m/g, '000000').replace(/b/g, '000000000'))
}

API.getFormatedDate = function(onlyhour) {
    let result
    const moment = require('moment')
    moment.suppressDeprecationWarnings = true;
    const date = moment(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const buildInput = 'DD/MM/YYYY [|] HH:mm'
    const buildInput2 = 'HH:mm'
    result = date.format(onlyhour ? buildInput2 : buildInput)
    return result;
}

API.getMultipleArgs = function(interaction, index) {
    const params = interaction.content.split(/ /g);
    source = "";
    for(let i = 0; i < index; i++) {
        source += (params[i] + " ");
    }
    const location = interaction.content.indexOf(source);
    if(location === 0) {
        source = interaction.content.substring(source.length);
    }
    return source;
}

API.createButton = function(id, style, label, emoji, disabled) {

    let button = new MessageButton()
    .setStyle(style.toUpperCase())
    .setLabel(label)
    if (emoji) button.setEmoji(emoji)
    if (style == 'LINK') button.setURL(id.toString()) 
    else button.setCustomId(id)
    if (disabled) button.setDisabled(true);

    return button
}

API.createMenu = function({ id, placeholder, min, max }, options) {

/*
label	
string 	True		
The text to be displayed on this option

value	
string 	True		
The value to be sent for this option

description	
string 	True	none	
Optional description to show for this option

emoji	
EmojiIdentifierResolvable	True	none	
Emoji to display for this option

default	
boolean 	True	none	
Render this option as the default selection

{ label: 'opção1', value: 'testandoele', description: 'q isso lek tmj', emoji: '847075122778865744', default: true}

*/

    let menu = new MessageSelectMenu()
    .setCustomId(id)
    .setPlaceholder(placeholder)
    .setMinValues(min)
    .setMaxValues(max)
    .addOptions(options)

    return menu

}

API.rowComponents = function(arr) {

    let btnRow = new MessageActionRow()

    for (rowButtonVar = 0; rowButtonVar < arr.length; rowButtonVar++) {
        btnRow.addComponents(arr[rowButtonVar])
    }

    return btnRow
}

API.clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

module.exports = API;
