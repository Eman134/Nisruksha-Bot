module.exports = {
    name: 'currículos',
    aliases: ['curriculos', 'curr', 'vercurri', 'curriculo', 'currículo'],
    category: 'Empresas',
    description: 'Visualiza os currículos pendentes da sua empresa',
    options: [{
        name: 'ação',
        type: 'STRING',
        description: 'Digite a ação que irá ser realizada',
        required: true,
        choices: [
            {
                name: 'lista',
                value: 'lista'
            },
            {
                name: 'aceitar',
                value: 'aceitar'
            },
            {
                name: 'negar',
                value: 'negar'
            }
        ]
    },
    {
        name: 'id-currículo',
        type: 'INTEGER',
        description: 'Digite o id do currículo para aceitar ou negar',
        required: false
    }
    ],
    mastery: 50,
	async execute(API, msg) {

        let args = API.args(msg);
        const Discord = API.Discord;
        
        const embed = new Discord.MessageEmbed().setColor(`#fc7b03`)
        
        if (!(await API.company.check.hasCompany(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\``)
            await msg.quote(embedtemp)
            return;
        }
        
        if (args.length == 0) {
            embed.setDescription(`🐻 Olá, sou o Teddy e estou aqui para te auxiliar.\nVeja alguns comandos possíveis relacionados a currículos:\n \n\`${API.prefix}curr lista\` - Visualiza os currículos pendentes da sua empresa\n\`${API.prefix}curr <aceitar/negar> <Nº de currículo>\` - Aceita ou nega um currículo pendente da sua empresa.`)
            await msg.quote(embed);
            return;
        }

        let largs0 = ['aceitar', 'negar', 'lista']

        
        if (largs0.includes(args[0]) == false) {
            const embedtemp = await API.sendError(msg, `Parece que você digitou um argumento inválido, os disponíveis são <aceitar/negar/lista> e você digitou ${args[0]}`)
            await msg.quote(embedtemp)
            return;
        }
        
        let company = await API.company.get.company(msg.author)
        
        let array = [];
        if (company.curriculum != null) array = company.curriculum;
        
        embed.setTitle(`${API.company.e[API.company.types[company.type]].icon} ${company.name}`)
        let botowner = await API.client.users.fetch(API.owner[0])
        if (args[0] == 'aceitar') {
            
            if (args.length < 2) {
                const embedtemp = await API.sendError(msg, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`${API.prefix}curr lista\``, `curr aceitar <Nº do currículo>`)
                await msg.quote(embedtemp)
                return;
            }
            
            if (API.isInt(args[1]) == false) {
                const embedtemp = await API.sendError(msg, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`${API.prefix}curr lista\``, `curr aceitar <Nº do currículo>`)
                await msg.quote(embedtemp)
                return;
            }
            
            if (array[parseInt(args[1])-1] == undefined || array[parseInt(args[1])-1] == null) {
                const embedtemp = await API.sendError(msg, `Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`${API.prefix}curr lista\``, `curr aceitar <Nº do currículo>`)
                await msg.quote(embedtemp)
                return;
            }

            let index = array[parseInt(args[1])-1];
            let usr = await API.client.users.fetch(index.split(";")[0]);
            
            let xy = await API.company.check.hasCompany(usr)
            let xx = await API.company.check.isWorker(usr)
            let vac = await API.company.check.hasVacancies(company.company_id)

            array.splice(index, 1)

            if (xy || xx) {
                await API.setCompanieInfo(msg.author, company.company_id, 'curriculum', array)
                embed.setColor('#a60000');
                embed.addField('❌ Houve uma falha no contrato', `Este membro já possui uma empresa ou trabalha em uma!`)
                await msg.quote(embed)
                return;
            }
            
            if (!(vac)) {
                embed.setColor('#a60000');
                embed.addField('❌ Houve uma falha no contrato', `Sua empresa não possui vagas disponíveis ou estão desativadas!`)
                await msg.quote(embed)
                return;
            }

            embed.setColor("#5bff45")
            .setDescription(`Você aceitou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\``)
            await msg.quote(embed)

            try {
                
                embed.setColor("#5bff45")
                .setDescription(`A empresa ${company.name} aceitou seu currículo!\nSeja bem vindo!`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                await usr.send(embed).catch()

            } catch{
            }

            let workers = company.workers == null ? [] : company.workers
            workers.push(usr.id)

            await API.setCompanieInfo(msg.author, company.company_id, 'curriculum', array)
            await API.setCompanieInfo(msg.author, company.company_id, 'workers', workers)

            API.setInfo(usr, 'players', 'company', company.company_id)
            return;

        } else if (args[0] == 'negar') {
            
            if (args.length < 2) {
                const embedtemp = await API.sendError(msg, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`${API.prefix}curr lista\``, `curr negar <Nº do currículo>`)
                await msg.quote(embedtemp)
                return;
            }
            
            if (API.isInt(args[1]) == false) {
                const embedtemp = await API.sendError(msg, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`${API.prefix}curr lista\``, `curr negar <Nº do currículo>`)
                await msg.quote(embedtemp)
                return;
            }
            
            if (array[parseInt(args[1])-1] == undefined || array[parseInt(args[1])-1] == null) {
                const embedtemp = await API.sendError(msg, `Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`${API.prefix}curr lista\``, `curr negar <Nº do currículo>`)
                await msg.quote(embedtemp)
                return;
            }
            
            let index = array[parseInt(args[1])-1];
            let usr = await API.client.users.fetch(index.split(";")[0]);
            array.splice(parseInt(args[1])-1, 1)
            
            embed.setColor("#a60000")
            .setDescription(`Você negou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\``)
            await msg.quote(embed)

            try {
                
                embed.setColor("#a60000")
                .setDescription(`A empresa ${company.name} negou seu currículo!`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                usr.send(embed)

            } catch{
            }

            await API.setCompanieInfo(msg.author, company.company_id, 'curriculum', array)
            
            return;
        }
        
        try {
            if (company.logo != null) embed.setThumbnail(company.logo)
        }catch (err){
            client.emit('error', err)
        }
        if (array.length > 0) {
            
            for (const r of array) {
                let usr = await API.client.users.fetch(r.split(";")[0])
                const pobjmaq = await API.getInfo(usr, 'machines')
                embed.addField(`📰 Nº ${array.indexOf(r)+1}`, `Enviado por: ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\`\nNível: ${pobjmaq.level}\nEnviou há: **${API.ms2(Date.now()-parseInt(r.split(";")[1]))}**\n\`${API.prefix}curr <aceitar/negar> ${array.indexOf(r)+1}\``)
            }

            embed.setColor("#5bff45")
            
        } else {
            embed.addField(`📰 Sem currículos`, `Sua empresa não possui currículos pendentes!`)
            embed.setColor("#a60000")
        }

        await msg.quote(embed);
        
	}
};