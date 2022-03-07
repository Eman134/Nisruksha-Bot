const Database = require('../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const { app } = require("../_classes/config");

module.exports = {

    name: "interactionCreate",
    execute: async (API, interaction) => {

        if (!interaction.isCommand() && !interaction.isContextMenu()) return

        const client = API.client;

        const command = interaction.commandName;

        if (interaction != null) interaction.url = `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${interaction.id}`

        let commandfile = client.commands.get(command);

        if (commandfile) {
            try {
                const boolean = await checkAll(API, interaction, { req: commandfile.perm ? commandfile.perm : 1, mastery: commandfile.mastery ? commandfile.mastery : 0, companytype: commandfile.companytype });
                if (boolean === true) return
                if (boolean && !commandfile.companytype) return;

                try {
                    if (!commandfile.companytype) await commandfile.execute(API, interaction);
                    else await commandfile.execute(API, interaction, boolean);
                } catch {
                    
                }
            } catch (error) {
                console.error(error);
                API.client.emit('error', error)
                await interaction.reply({ content: 'Ocorreu um erro ao executar o comando ' + command });
            }
        }
    }
}


async function checkAll(API, interaction, { req, mastery: maestria = 0, companytype }) {

    const pobj = await DatabaseManager.get(interaction.user.id, 'players')
    const serverobj = await DatabaseManager.get(interaction.guild.id, 'servers', 'server_id');
    const globalobj = await DatabaseManager.get(app.id, 'globals');

    const globalstatus = globalobj.status
    const globalman = globalobj.man
    const totalcmds = pobj.cmdsexec

    const command = interaction.commandName;

    if (app.id == '726943606761324645' && interaction.channel.id !== '703293776788979812' && pobj.perm < 4) {
        const embedtemp = await API.sendError(interaction, 'Você não pode utilizar o bot BETA neste canal!')
        await interaction.reply({ embeds: [embedtemp]})
        return true
    }

    const checkAntispam = await API.playerUtils.cooldown.check(interaction.user.id, "antispam");
    if (checkAntispam) return true;
    API.playerUtils.cooldown.set(interaction.user.id, "antispam", 3);

    if (pobj.perm == 0) {
        
        const checkBanned = await API.playerUtils.cooldown.check(interaction.user.id, "banned");
        if (checkBanned) return true

        API.playerUtils.cooldown.set(interaction.user.id, "banned", 60);
        API.client.emit('fail', { interaction, type: 'ban', sendMe: true, desc: `<:banido:756525777981276331> Você está **BANIDO** do Nisruksha!\nMotivo: ${pobj.banreason}` })
        return true;
    }

    if (serverobj.status == 2 && pobj.perm < 4) {
        interaction.guild.leave()
        API.client.emit('fail', { interaction, type: 'ban', sendMe: true, desc: `<:banido:756525777981276331> Este servidor está **BANIDO** do Nisruksha!\nMotivo: ${serverobj.banreason}\n[MEU SERVIDOR](https://bit.ly/svnisru)` })
        return true;
    }

    if (serverobj.status == 1 && pobj.perm < 4) {
        API.client.emit('fail', { interaction, type: 'no-permitted', sendMe: true, desc: `<:error:736274027756388353> Este servidor não está permitido o uso de comandos!\nContate o criador do bot para analisar o motivo.\n[MEU SERVIDOR](https://bit.ly/svnisru)` })
        return true;
    }
    
    if (pobj.perm < 4 && globalstatus == 2) {
        API.client.emit('fail', { interaction, type: 'manutenção', sendMe: true, desc: `⚙ **O BOT ESTÁ EM MODO MANUTENÇÃO NO MOMENTO!**\nMotivo: **${globalman}**\n[MEU SERVIDOR](https://bit.ly/svnisru)` })
        return true;
    }

    if ((Date.now()-new Date(interaction.user.createdAt).getTime()) < 86400000*7) {
        API.client.emit('fail', { interaction, type: 'conta recente', sendMe: true, desc: `Você não pode executar comandos no bot por sua conta ser criada recentemente! Tente novamente mais tarde.\nPara quaisquer suporte entre em [MEU SERVIDOR](https://bit.ly/svnisru)\nVocê poderá usar o bot em \`${API.ms(86400000*7-(Date.now()-new Date(interaction.user.createdAt).getTime()))}\`` })
        return true;
    }

    async function limitedpatrao() {
        API.client.emit('fail', { interaction, type: 'fora do servidor oficial', sendMe: true, desc: `Você foi limitado inicialmente e precisa estar em nosso servidor oficial para poder usufruir mais do bot!\nA partir do momento que estiver no servidor oficial, você poderá continuar a usar bot em qualquer outro servidor que o tenha!\nPara entrar no servidor oficial [CLIQUE AQUI](https://bit.ly/svnisru)` })
        return true;
    }

    if (globalstatus == 0) {
        try {
            const x = await API.client.guilds.cache.get('693150851396796446').members.fetch(interaction.user.id, { force: true, cache: true })

            if (!x) {
                if (await limitedpatrao()) return true
            }

        } catch {
            if (await limitedpatrao()) return true
        }
        
    }
        
    if (req > 1 && pobj.perm < req) {
        API.playerUtils.cooldown.set(interaction.user.id, "antispam", 3);
        const embedtemp = await API.sendError(interaction, 'Você não possui permissões necessárias para executar isto.')
        await interaction.reply({ embeds: [embedtemp]})
        return true;
    }
    
    let list = [];

    const me = await API.client.users.fetch(app.id, { force: true, cache: true })

    const p = interaction.channel.permissionsFor(me).toArray()
        
    p.includes('EMBED_LINKS') ? list.push('INSERIR LINKS | ✅') : list.push('INSERIR LINKS | ❌')
    p.includes('ATTACH_FILES') ? list.push('ANEXAR ARQUIVOS | ✅') : list.push('ANEXAR ARQUIVOS | ❌')
   // p.includes('MANAGE_MESSAGES') ? list.push('GERENCIAR MENSAGENS | ✅') : list.push('GERENCIAR MENSAGENS | ❌')
    p.includes('USE_EXTERNAL_EMOJIS') ? list.push('EMOJIS EXTERNOS | ✅') : list.push('EMOJIS EXTERNOS | ❌')
    p.includes('ADD_REACTIONS') ? list.push('ADICIONAR REAÇÕES | ✅') : list.push('ADICIONAR REAÇÕES | ❌')
    p.includes('READ_MESSAGE_HISTORY') ? list.push('LER HISTÓRICO | ✅') : list.push('LER HISTÓRICO | ❌')

    let result = "";
    result = list.join('\n').toString();

    //console.log(result.replace(/✅/g, 'ok').replace(/❌/g, 'no'))

    if (result.includes('❌') && pobj.perm < 4) {
        API.client.emit('fail', { interaction, type: 'sem permissão', sendMe: true, desc: 'O bot necessita das seguintes permissões: (Cheque o cargo, as permissões do canal e do bot no canal)```' + result + '```\nhttps://bit.ly/svnisru' })
        return true;
    }
    
    
    if (pobj.mvp != null && Date.now()-pobj.mvp > 0) {
        const embed = new API.Discord.MessageEmbed()
        .setColor(`#f21a0f`)
        .setTitle(`Opa, deslizou ai?`)
        .setDescription(`Seu **MVP** acaba de ter seu tempo expirado!\nPara adquirir **MVP** basta doar usando \`/doar\` e em seguida contatar o criador do bot\nPara conseguir cristais rapidamente você precisa doar para o bot e contatando o criador.\nPara entrar no servidor de suporte utilize \`/convite\``)
        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        interaction.channel.send({ embeds: [embed], mention: true})
        DatabaseManager.set(interaction.user.id, 'players', 'mvp', null)
        if (pobj.perm == 3) DatabaseManager.set(interaction.user.id, 'players', 'perm', 1)
    }
    
    const check = await API.playerUtils.cooldown.check(interaction.user.id, "global");
    if (check) {

        const check2 = await API.playerUtils.cooldown.check(interaction.user.id, "antispam");
        if (check2) return true;

        const spamcheckinteraction = await API.playerUtils.cooldown.message(interaction, 'global', 'digitar outro comando')
        setTimeout(() => spamcheckinteraction.delete(), 5000)

        API.playerUtils.cooldown.set(interaction.user.id, "antispam", 10);
        return true;
    }
    API.playerUtils.cooldown.set(interaction.user.id, "global", Math.round((4500-(pobj.perm*500))/1000));
        
    API.cmdsexec++;
    DatabaseManager.increment(app.id, 'globals', 'totalcmd', 1)
    DatabaseManager.increment(interaction.user.id, 'players', 'cmdsexec', 1)
    DatabaseManager.increment(interaction.guild.id, 'servers', 'cmdsexec', 1, 'server_id')
    DatabaseManager.set(interaction.guild.id, 'servers', 'lastcmd', Date.now(), 'server_id')

    const check25 = await API.playerUtils.cooldown.check(interaction.user.id, "mastery");
    if (!check25) API.playerUtils.addMastery(interaction.user.id, maestria + 1)
    else API.playerUtils.cooldown.set(interaction.user.id, "mastery", 120);
    
	if (totalcmds == 0) {
		
		const voteembed = new API.Discord.MessageEmbed()
        voteembed.setDescription('Olá, vi que é a primeira vez sua no bot, não é mesmo? Acesse o tutorial usando `/tutorial`\nPara apoiar o amigo/pessoa que lhe convidou utilize `/apoiar <codigo do amigo>`\nCaso não tenha o código, peça para o mesmo.\nVocê também pode convidar amigos e ganhar recompensas! Utilize `/meucodigo`')
        voteembed.setFooter('Entre em nosso servidor oficial para ficar ciente das regras e evitar ser banido!')
        if (interaction.replied) await interaction.followUp({ embeds: [voteembed], mention: true})
		return false;
		
		
	} else if (API.client.user.id != '726943606761324645') {
        const check44 = await API.playerUtils.cooldown.check(interaction.user.id, "alertdelay");
        if (!check44) {
            API.playerUtils.cooldown.set(interaction.user.id, "alertdelay", 500);

            const words = [
                'Que tal votar para ajudar o bot e ao mesmo tempo receber recompensas?\nUtilize \`/votar\`',
                'Olá, você sabia que sendo MVP no bot você pode ter diversas vantagens?\nPara adquirir um MVP de forma rápida você pode doar para o bot, assim como ajudar a manter ele online! \nUtilize \`/doar\` e \`/mvp\` para mais informações',
                'Fique por dentro de **NOVIDADES**, **ANÚNCIOS** e principalmente dentro das **REGRAS** para evitar ser banido e ter um bom uso do bot.\nPara entrar no servidor oficial [CLIQUE AQUI](https://bit.ly/svnisru)'
            ]

            const alertembed = new API.Discord.MessageEmbed()
            .setDescription(words[API.random(0, words.length-1)])
            .setFooter('Entre em nosso servidor oficial para ficar ciente das regras e evitar ser banido!')

            if (interaction.replied) await interaction.followUp({ embeds: [alertembed], mention: true})
        }
    }
	
	if (API.logs.cmds) {
        const embedcmd = new API.Discord.MessageEmbed()
        .setColor('#b8312c')
        .setTimestamp()
		.setTitle('<:staff:788945462206922794> | Log de comando')
		.addField('<:arrow:737370913204600853> Comando', '/'+command)
		if (interaction.options.size > 0) embedcmd.addField('<:arrow:737370913204600853> Parâmetros', `\`\`\`\n${interaction.options.map(i => i.value).join(' ').slice(0, 1000)}\`\`\``)
		embedcmd.addField('<:mention:788945462283075625> Membro', `${interaction.user.tag} (\`${interaction.user.id}\`)`)
		.addField('<:channel:788949139390988288> Canal', `\`${interaction.channel.name} (${interaction.channel.id})\``)
        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
		.setFooter(interaction.guild.name + " | " + interaction.guild.id, interaction.guild.iconURL())
        API.client.channels.cache.get('768465691547271168').send({ embeds: [embedcmd]});
    }

    if (companytype && companytype > 0) {
        if (!(await API.company.check.hasCompany(interaction.user.id)) && !(await API.company.check.isWorker(interaction.user.id))) {
            const embedtemp = await API.sendError(interaction, `Você deve ser funcionário ou possuir uma empresa de ${API.company.e[API.company.types[companytype]].icon} ${API.company.types[companytype]} para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\`\nPesquise empresas usando \`/empresas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return true;
        }
        let company;
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        if (await API.company.check.isWorker(interaction.user.id)) {
            company = await API.company.get.companyById(pobj.company);
            if (!company) {
                await DatabaseManager.set(interaction.user.id, 'players', 'company', null)
                return true
            }
            if (company.type != companytype) {
                const embedtemp = await API.sendError(interaction, `A empresa onde você trabalha não é de ${API.company.e[API.company.types[companytype]].icon} ${API.company.types[companytype]}!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\`\nPesquise empresas usando \`/empresas\``)
                await interaction.reply({ embeds: [embedtemp]})
                return true;
            }
        } else {
            company = await API.company.get.companyByOwnerId(interaction.user.id);
            if (!company) {
                await DatabaseManager.set(interaction.user.id, 'players', 'company', null)
                return true
            }
            if (company.type != companytype) {
                const embedtemp = await API.sendError(interaction, `A sua empresa não é de ${API.company.e[API.company.types[companytype]].icon} ${API.company.types[companytype]}!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\`\nPesquise empresas usando \`/empresas\``)
                await interaction.reply({ embeds: [embedtemp]})
                return true;

            }
        }

        if (company) return company
    }

    if (!API.playerscmds.includes(interaction.user.id)) {
        API.playerscmds.push(interaction.user.id)
    }
    
    return false;

}