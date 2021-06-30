const { prefix, owner, token, ip, app } = require("../_classes/config");
const db = require('./db.js');
const serverdb = {};
const version = require('../package.json').version
const { MessageActionRow, MessageButton } = require('discord.js')

serverdb.getServerInfo = async function (id) {
    
    await API.serverdb.setServer(id)

    const text =  `SELECT * FROM servers WHERE server_id = $1;`,
        values = [id];
    let res;
    try {
        res = await db.pool.query(text, values);
        return res.rows[0];
    } catch (err) {
        console.log(err.stack)
        API.client.emit('error', err)
    }
    return res;

}

serverdb.setServerInfo = async function (id, string, value) {

    await API.serverdb.setServer(id);

    const text =  `UPDATE servers SET ${string} = $2 WHERE server_id = $1;`,
        values = [id, value]

    try {
        await db.pool.query(text, values);
    } catch (err) {
        console.log(err.stack)
        API.client.emit('error', err)
    }

}

serverdb.setServer = async function (id) {
    const text2 =  `INSERT INTO servers(server_id) VALUES($1) ON CONFLICT DO NOTHING;`,
    values2 = [id];
    try {
        await db.pool.query(text2, values2);
    } catch (err) {
        console.log(err.stack)
        API.client.emit('error', err)
    }
    
}


const API = {

    debug: false,
    logs: {
        cmds: true,
        falhas: true
    },

    // Extensions
    serverdb,
    db: db,
    // Utils
    prefix,
    owner,
    version,
    token,
    id: app.id,
    ip,
    lastsave: '',
    cmdsexec: 0,
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

API.checkAll = async function(msg, { perm: req, mastery: maestria = 0, companytype }) {

    API.client.users.fetch(msg.author.id)
    
    let pobj = await API.getInfo(msg.author, 'players')
    let perm = pobj.perm;
    let serverobj = await API.serverdb.getServerInfo(msg.guild.id);
    
    let globalstatus = await API.getGlobalInfo('status');
    let globalman = await API.getGlobalInfo('man');

	let chan = await API.client.channels.cache.get(msg.channel.id, { withOverwrites: true })

    const guild = await API.client.guilds.fetch(msg.guild.id, { force: true, cache: true })

    await guild.roles.fetch({ force: true, cache: true })

    const me = await guild.members.fetch(API.client.user.id)

    const args = msg.content.slice(API.prefix.length).split(/ +/);

    const command = args.shift().toLowerCase();

    let arg = API.args(msg);

    if (API.client.user.id == '726943606761324645' && chan.id !== '703293776788979812' && perm < 4) {
        const embedtemp = await API.sendError(msg, 'Você não pode utilizar o bot BETA neste canal!')
        await msg.quote({ embeds: [embedtemp]})
        return true
    }
    
    if (serverobj.status == 2 && perm < 4) {
        const check2 = await API.playerUtils.cooldown.check(msg.author, "antispam");
        if (check2) return true;
        API.playerUtils.cooldown.set(msg.author, "antispam", 3);
        msg.guild.leave()
        const embed = new API.Discord.MessageEmbed()
        .setColor('#b8312c')
        .setDescription(`<:banido:756525777981276331> Este servidor está **BANIDO** do Nisruksha!\nMotivo: ${serverobj.banreason}\n[MEU SERVIDOR](https://bit.ly/svnisru)`)
        .setAuthor(msg.guild.name, msg.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }))
        .setThumbnail(`https://cdn.discordapp.com/emojis/756525777981276331.png?v=1`)
        await msg.quote({ embeds: [embed] })

        if (API.logs.falhas) {
            const embedcmd = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: servidor banido`)
            .setDescription(`${msg.author} executou o comando \`${API.prefix}${command}\` em #${chan.name}`)
            .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            if (arg.length > 0) embedcmd.addField('Argumentos', `\`\`\`\n${API.getMultipleArgs(msg, 1).slice(0, 1000)}\`\`\``)
            API.client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]});
        }

        return true;
    }

    if (serverobj.status == 1 && perm < 4) {
        const embed = new API.Discord.MessageEmbed()
        .setColor('#b8312c')
        .setDescription(`<:error:736274027756388353> Este servidor não está permitido o uso de comandos!\nContate o criador do bot para analisar o motivo.\n[MEU SERVIDOR](https://bit.ly/svnisru)`)
        .setAuthor(msg.guild.name, msg.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }))
        .setThumbnail(`https://cdn.discordapp.com/emojis/736274027756388353.png?v=1`)
        await msg.quote({ embeds: [embed] })

        if (API.logs.falhas) {
            const embedcmd = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: não é permitido`)
            .setDescription(`${msg.author} executou o comando \`${API.prefix}${command}\` em #${chan.name}`)
            .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            if (arg.length > 0) embedcmd.addField('Argumentos', `\`\`\`\n${API.getMultipleArgs(msg, 1).slice(0, 1000)}\`\`\``)
            API.client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]});
        }

        return true;
    }
    
    if (perm < 4) {
        
        if (globalstatus == 2) {
            const check2 = await API.playerUtils.cooldown.check(msg.author, "antispam");
            if (check2) return true;
            API.playerUtils.cooldown.set(msg.author, "antispam", 3);
            const embed = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setDescription(`<:banido:756525777981276331> **O BOT ESTÁ EM MODO MANUTENÇÃO NO MOMENTO!**\nMotivo: **${globalman}**\n[MEU SERVIDOR](https://bit.ly/svnisru)`)
            .setAuthor(msg.guild.name, msg.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }))
            .setThumbnail(`https://cdn.discordapp.com/emojis/736274027756388353.png?v=1`)
            await msg.quote({ embeds: [embed] })

            if (API.logs.falhas) {
                const embedcmd = new API.Discord.MessageEmbed()
                .setColor('#b8312c')
                .setTimestamp()
                .setTitle(`Falha: manutenção`)
                .setDescription(`${msg.author} executou o comando \`${API.prefix}${command}\` em #${chan.name}`)
                .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                if (arg.length > 0) embedcmd.addField('Argumentos', `\`\`\`\n${API.getMultipleArgs(msg, 1).slice(0, 1000)}\`\`\``)
                API.client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]});
            }
                
            return true;
        }
        
    }
    
    
    if (perm == 0) {
        
        const check = await API.playerUtils.cooldown.check(msg.author, "banned");
        if (check) return true

        API.playerUtils.cooldown.set(msg.author, "banned", 60);

        const embed = new API.Discord.MessageEmbed()
        .setColor('#b8312c')
        .setDescription(`<:banido:756525777981276331> Você está **BANIDO** do Nisruksha!\nMotivo: ${pobj.banreason}`)
        .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setThumbnail(`https://cdn.discordapp.com/emojis/756525777981276331.png?v=1`)
        .setImage(`https://media1.tenor.com/images/b1b83ab983d136bdf3fed71af0b40c0e/tenor.gif?itemid=17528115`)
        await msg.quote({ embeds: [embed] })

        if (API.logs.falhas) {
            const embedcmd = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: membro banido`)
            .setDescription(`${msg.author} executou o comando \`${API.prefix}${command}\` em #${chan.name}`)
            .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            if (arg.length > 0) embedcmd.addField('Argumentos', `\`\`\`\n${API.getMultipleArgs(msg, 1).slice(0, 1000)}\`\`\``)
            API.client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]});
        }

        return true;
    }
    const totalcmdplayer = await API.getInfo(msg.author, 'players');

    async function limitedpatrao() {
        const embedtemp = await API.sendError(msg, `Você foi limitado inicialmente a 200 comandos e precisa estar em nosso servidor oficial para poder usufruir mais do bot!\nA partir do momento que estiver no servidor oficial, você poderá continuar a usar bot em qualquer outro servidor que o tenha!\nPara entrar no servidor oficial [CLIQUE AQUI](https://bit.ly/svnisru)`)
        await msg.quote({ embeds: [embedtemp], mention: true } )
        if (API.logs.falhas) {
            const embedcmd = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: fora do servidor oficial`)
            .setDescription(`${msg.author} executou o comando \`${API.prefix}${command}\` em #${chan.name}`)
            .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            if (arg.length > 0) embedcmd.addField('Argumentos', `\`\`\`\n${API.getMultipleArgs(msg, 1).slice(0, 1000)}\`\`\``)
            API.client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]});
            return true;
        }
    }

    if (totalcmdplayer.cmdsexec >= 200 || globalstatus == 0) {
        try {
            const x = await API.client.guilds.cache.get('693150851396796446').members.fetch(msg.author.id, { force: true, cache: true })

            if (!x) {
                if (await limitedpatrao()) return true
            }

        } catch {
            if (await limitedpatrao()) return true
        }
        
    }
        

    if ((Date.now()-new Date(msg.author.createdAt).getTime()) < 86400000*7) {
        
        const embedtemp = await API.sendError(msg, `Você não pode executar comandos no bot por sua conta ser criada recentemente! Tente novamente mais tarde.\nPara quaisquer suporte entre em [MEU SERVIDOR](https://bit.ly/svnisru)\nVocê poderá usar o bot em \`${API.ms(86400000*7-(Date.now()-new Date(msg.author.createdAt).getTime()))}\``)
        await msg.quote({ embeds: [embedtemp], mention: true } )
        if (API.logs.falhas) {
            const embedcmd = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: tempo de conta`)
            .setDescription(`${msg.author} executou o comando \`${API.prefix}${command}\` em #${chan.name}\nTempo de conta: ${API.ms2((Date.now()-new Date(msg.author.createdAt).getTime()))}`)
            .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            if (arg.length > 0) embedcmd.addField('Argumentos', `\`\`\`\n${API.getMultipleArgs(msg, 1).slice(0, 1000)}\`\`\``)
            API.client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]});
        }

        return true;
    }

        
    if (req > 1) {
        if (perm < req) {
            const check2 = await API.playerUtils.cooldown.check(msg.author, "antispam");
            if (check2) return true;
            API.playerUtils.cooldown.set(msg.author, "antispam", 3);
            const embedtemp = await API.sendError(msg, 'Você não possui permissões necessárias para executar isto.')
            await msg.quote({ embeds: [embedtemp]})
            return true;
        }
    }
    
    let list = [];
    
    if (!chan) await API.client.channels.fetch(msg.channel.id, { cache: true, force: true})

    chan = await API.client.channels.cache.get(msg.channel.id, { withOverwrites: true })

    const p = chan.permissionsFor(me).toArray()
        
    p.includes('EMBED_LINKS') ? list.push('INSERIR LINKS | ✅') : list.push('INSERIR LINKS | ❌')
    p.includes('ATTACH_FILES') ? list.push('ANEXAR ARQUIVOS | ✅') : list.push('ANEXAR ARQUIVOS | ❌')
    p.includes('MANAGE_MESSAGES') ? list.push('GERENCIAR MENSAGENS | ✅') : list.push('GERENCIAR MENSAGENS | ❌')
    p.includes('USE_EXTERNAL_EMOJIS') ? list.push('EMOJIS EXTERNOS | ✅') : list.push('EMOJIS EXTERNOS | ❌')
    p.includes('ADD_REACTIONS') ? list.push('ADICIONAR REAÇÕES | ✅') : list.push('ADICIONAR REAÇÕES | ❌')
    p.includes('READ_MESSAGE_HISTORY') ? list.push('LER HISTÓRICO | ✅') : list.push('LER HISTÓRICO | ❌')

    let result = "";
    result = list.join('\n').toString();

    //console.log(result.replace(/✅/g, 'ok').replace(/❌/g, 'no'))

    if (result.includes('❌') && perm < 4) {
        try {

            await msg.quote({ content: 'O bot necessita das seguintes permissões: (Cheque o cargo, as permissões do canal e do bot no canal)```' + result + '```\nhttps://bit.ly/svnisru' }).catch()
            
        } catch {
            
        }
            
        if (API.logs.falhas) {
            const embedcmd = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: sem permissão`)
            .setDescription(`${msg.author} executou o comando \`${API.prefix}${command}\` em #${chan.name}`)
            .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .addField('Perms', `\`\`\`\n${result}\`\`\``)
            API.client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]}).catch();
        }
            
            return true;
    }
    
    
    if (pobj.mvp != null && Date.now()-pobj.mvp > 0) {
        const embed = new API.Discord.MessageEmbed()
        .setColor(`#f21a0f`)
        .setTitle(`Opa, deslizou ai?`)
        .setDescription(`Seu **MVP** acaba de ter seu tempo expirado!\nPara adquirir **MVP** basta doar usando \`${API.prefix}doar\` e em seguida contatar o criador do bot\nPara conseguir cristais rapidamente você precisa doar para o bot e contatando o criador.\nPara entrar no servidor de suporte utilize \`${API.prefix}convite\``)
        .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        await msg.quote({ embeds: [embed], mention: true})
        API.setInfo(msg.author, 'players', 'mvp', null)
        if (perm == 3) API.setPerm(msg.author, 1)
    }
    
    const check = await API.playerUtils.cooldown.check(msg.author, "global");
    if (check) {

        const check2 = await API.playerUtils.cooldown.check(msg.author, "antispam");
        if (check2) return true;

        const spamcheckmsg = await API.playerUtils.cooldown.message(msg, 'global', 'digitar outro comando')
        setTimeout(() => spamcheckmsg.delete(), 5000)

        API.playerUtils.cooldown.set(msg.author, "antispam", 3);
        return true;
    }
    API.playerUtils.cooldown.set(msg.author, "global", Math.round((4500-(perm*500))/1000));
        
    API.cmdsexec++;

    const totalcmd = await API.getGlobalInfo('totalcmd');
    API.setGlobalInfo('totalcmd', parseInt(totalcmd)+1)

    const check = await API.playerUtils.cooldown.check(msg.author, "mastery");
    if (!check) API.playerUtils.addMastery(msg.author, maestria + 1)
    else API.playerUtils.cooldown.set(msg.author, "mastery", 60);

    API.setInfo(msg.author, 'players', 'cmdsexec', parseInt(totalcmdplayer.cmdsexec)+1)
    
    const totalcmdserver = await API.serverdb.getServerInfo(msg.guild.id);
    API.serverdb.setServerInfo(guild.id, 'cmdsexec', parseInt(totalcmdserver.cmdsexec)+1)
    API.serverdb.setServerInfo(guild.id, 'lastcmd', Date.now())
    
	if (totalcmdplayer.cmdsexec == 0) {
		
		const voteembed = new API.Discord.MessageEmbed()
        voteembed.setDescription('Olá, vi que é a primeira vez sua no bot, não é mesmo? Acesse o tutorial usando `' + API.prefix + 'tutorial`\nPara apoiar o amigo/pessoa que lhe convidou utilize `' + API.prefix + 'apoiar <codigo do amigo>`\nCaso não tenha o código, peça para o mesmo.\nVocê também pode convidar amigos e ganhar recompensas! Utilize `' + API.prefix + 'meucodigo`')
        await msg.quote({ embeds: [voteembed], mention: true})
		return false;
		
		
	} else if (API.client.user.id != '726943606761324645' && API.dbl) {
        API.dbl.hasVoted(msg.author.id).then(async voted => {
            if (voted) return
            const check44 = await API.playerUtils.cooldown.check(msg.author, "alertdelay");
            if (check44) return true;
            API.playerUtils.cooldown.set(msg.author, "alertdelay", 820);
            const voteembed = new API.Discord.MessageEmbed()
            voteembed.setDescription('Olá, vi que você não votou ainda no TOP.GG <:sadpepo:766103572932460585>\nQue tal votar para ajudar o bot e ao mesmo tempo receber recompensas?\nUtilize \`' + API.prefix + 'votar\`')
            
            if (API.random(0, 100) < 50 && perm < 3) {
                voteembed.setDescription('Olá, você sabia que sendo MVP no bot você pode ter diversas vantagens?\nPara adquirir um MVP de forma rápida você pode doar para o bot, assim como ajudar a manter ele online! \nUtilize \`' + API.prefix + 'doar\` e \`' + API.prefix + 'mvp\` para mais informações')
            }

            await msg.quote({ embeds: [voteembed], mention: true})
			return false;
        });
    }
	
	if (API.logs.cmds) {
        const embedcmd = new API.Discord.MessageEmbed()
        .setColor('#b8312c')
        .setTimestamp()
		.setTitle('<:staff:788945462206922794> | Log de comando')
		.addField('<:arrow:737370913204600853> Comando', API.prefix+command)
		if (arg.length > 0) embedcmd.addField('<:arrow:737370913204600853> Parâmetros', `\`\`\`\n${API.getMultipleArgs(msg, 1).slice(0, 1000)}\`\`\``)
		embedcmd.addField('<:mention:788945462283075625> Membro', `${msg.author.tag} (\`${msg.author.id}\`)`)
		.addField('<:channel:788949139390988288> Canal', `\`${chan.name} (${msg.channel.id})\``)
        .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
		.setFooter(guild.name + " | " + guild.id, guild.iconURL())
        API.client.channels.cache.get('768465691547271168').send({ embeds: [embedcmd]});
    }

    if (companytype && companytype != 0) {
        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa de ${API.company.e[API.company.types[companytype]].icon} ${API.company.types[companytype]} para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            await msg.quote({ embeds: [embedtemp]})
            return true;
        }
        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
            if (company.type != companytype) {
                const embedtemp = await API.sendError(msg, `A empresa onde você trabalha não é de ${API.company.e[API.company.types[companytype]].icon} ${API.company.types[companytype]}!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                await msg.quote({ embeds: [embedtemp]})
                return true;
            }
        } else {
            company = await API.company.get.company(msg.author);
            if (company.type != companytype) {
                const embedtemp = await API.sendError(msg, `A sua empresa não é de ${API.company.e[API.company.types[companytype]].icon} ${API.company.types[companytype]}!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                await msg.quote({ embeds: [embedtemp]})
                return true;

            }
        }

        if (company) return company
    }
    
    return false;

}

API.setGlobalInfo = async function(info, value) {
    API.setInfo(app, "globals", info, value);
}

API.getGlobalInfo = async function(info) {
    const obj = await API.getInfo(app, "globals");
    return obj[info];
}

API.getPerm = async function(member) {
    const obj = await API.getInfo(member, "players");
    return obj.perm;
}

API.setPerm = async function(member, perm) {
    API.setInfo(member, "players", 'perm', perm);
}

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

API.sendError = async function (msg, s, usage) {
    const Discord = API.Discord;
    const embedError = new Discord.MessageEmbed()
        .setColor('#b8312c')
        .setDescription('<:error:736274027756388353> ' + s)
        .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    if (usage) {
        embedError.addField('Exemplo de uso', "\n`" + API.prefix + usage + "`")
    }

    return embedError
    
}

API.args = function(msg) {
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    args.shift();
    return args;
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
	
	
	let plataforma;
    if (process.platform) {
        const { platform } = process
        if (platform === 'win32') plataforma = 'Windows'
        else if (platform === 'aix') plataforma = 'Aix'
        else if (platform === 'linux') plataforma = 'Linux'
        else if (platform === 'darwin') plataforma = 'Darwin'
    }

    const text =  `SELECT pg_size_pretty(pg_database_size('postgres'));`
    let dbsize;
    try {
        res = await db.pool.query(text);
        dbsize = res.rows[0]["pg_size_pretty"];
    } catch (err) {
        console.log(err.stack)
        client.emit('error', err)
    }

    const totalcmd = await API.getGlobalInfo('totalcmd');
    const embed = new API.Discord.MessageEmbed();
    embed.setTitle(`(${API.prefix}) ${API.client.user.username}`);

    embed.addField(`🕐 Tempo online`, `\`${API.uptime()}\``, true)

    embed.addField(`💾 Último save`, `\`${API.lastsave == '' ? 'Não ocorreu':API.lastsave}\``, true)

    embed.addField(`📓 Comandos executados`, `Após iniciar: \`${API.cmdsexec}\`\nTotal: \`${totalcmd}\``, true)

    embed.addField(`🪐 População`, `Servidores: \`${API.client.guilds.cache.size}\`\nMinerando: \`${API.cacheLists.waiting.length('mining')}\`\nCaçando: \`${API.cacheLists.waiting.length('hunting')}\`\nColetando: \`${API.cacheLists.waiting.length('collecting')}\`\nPescando: \`${API.cacheLists.waiting.length('fishing')}\`\nAguardando: \`${API.cacheLists.remember.get().size}\``, true)

    embed.addField(`📎 Versões`, `Node.js \`${process.versions.node}\`\nDiscord.js \`${API.Discord.version}\`\nNisruksha \`${API.version}\``, true)


	let ownerx = await API.client.users.fetch('422002630106152970')

    embed.addField(`<:list:736274028179750922> Detalhados`, `Ping: \`${API.client.ws.ping} ms\`\nConsumo: \`${formatBytes(process.memoryUsage().rss)}\`\nTamanho da db: \`${dbsize}\`\nFundador: \`${ownerx.tag}\``, true)
    
    embed.setTimestamp()
	
	return embed

	
}

API.setCompanieInfo = async function (member, company, string, value) {

    const text2 =  `INSERT INTO companies(company_id, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING;`,
    values2 = [company, member.id];
    try {
        await db.pool.query(text2, values2);
    } catch (err) {
        console.log(err.stack)
        client.emit('error', err)
    }

    const text =  `UPDATE companies SET ${string} = $3 WHERE user_id = $1 AND company_id = $2;`,
        values = [member.id, company, value]

    try {
        await db.pool.query(text, values);
    } catch (err) {
        console.log(err.stack)
        client.emit('error', err)
    }

};

API.getInfo = async function (member, table) {
    
    await API.setPlayer(member, table)

    const text =  `SELECT * FROM ${table} WHERE user_id = $1;`,
        values = [member.id];
    let res;
    try {
        res = await db.pool.query(text, values);
        return res.rows[0];
    } catch (err) {
        console.log(err.stack)
        API.client.emit('error', err)
    }
    return res;

}

API.setInfo = async function (member, table, string, value) {

    await API.setPlayer(member, table);

    const text =  `UPDATE ${table} SET ${string} = $2 WHERE user_id = $1;`,
        values = [member.id, value]

    try {
        await db.pool.query(text, values);
    } catch (err) {
        console.log(err.stack)
        API.client.emit('error', err)
    }

};

API.setPlayer = async function (member, table) {
    try {
        await db.pool.query(`INSERT INTO ${table}(user_id) VALUES(${member.id}) ON CONFLICT DO NOTHING`)
    }catch (err){
        console.log(err)
        API.client.emit('error', err)
    }
}

API.toNumber = function(x) {
    return parseInt(x.replace(/k/g, '000').replace(/m/g, '000000').replace(/b/g, '000000000'))
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

API.getMultipleArgs = function(msg, index) {
    const params = msg.content.split(/ /g);
    source = "";
    for(let i = 0; i < index; i++) {
        source += (params[i] + " ");
    }
    const location = msg.content.indexOf(source);
    if(location === 0) {
        source = msg.content.substring(source.length);
    }
    return source;
}

API.createButton = function(id, style, label, emoji, disabled) {

    let button = new MessageButton()
    .setStyle(style.toUpperCase())
    .setLabel(label)
    if (emoji) button.setEmoji(emoji)
    if (style == 'url') button.setURL(id) 
    else button.setCustomID(id)
    if (disabled) button.setDisabled(true);

    return button
}

API.rowButton = function(arr) {

    let btnRow = new MessageActionRow()

    for (rowButtonVar = 0; rowButtonVar < arr.length; rowButtonVar++) {
        btnRow.addComponents(arr[rowButtonVar])
    }

    return btnRow
}

module.exports = API;
