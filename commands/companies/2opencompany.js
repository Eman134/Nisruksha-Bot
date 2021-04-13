module.exports = {
    name: 'abrirempresa',
    aliases: ['criarempresa', 'opencompany', 'abrire'],
    category: 'Empresas',
    description: 'Abra uma empresa de algum setor em seu nome e customize-a',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        let args = API.args(msg);
        const Discord = API.Discord;

        
        if (args.length < 2) {
            API.sendError(msg, `Você precisa digitar um nome e setor para a sua empresa!\nUtilize \`${API.prefix}setores\` para visualizar os setores disponíveis.`, 'abrirempresa <setor> <nome>')
            return;
        }

        let tipo = args[0].toLowerCase();
        let e = API.company.e;
        
        if (!(Object.keys(e).includes(tipo))) {
            API.sendError(msg, `Você precisa digitar um setor de empresa existente!\nUtilize \`${API.prefix}setores\` para visualizar os setores disponíveis.`, 'abrirempresa <setor> <nome>')
            return;
        }
        
        if (API.getMultipleArgs(msg, 2).length > 30) {
            API.sendError(msg, `A nome de sua empresa não pode conter mais de 30 caracteres!`, 'abrirempresa <setor> <nome>')
            return;
        }
        
        if (await API.company.check.hasCompany(msg.author)) {
            API.sendError(msg, `Você não pode abrir mais de uma empresa!`)
            return;
        }

        if (await API.company.check.isWorker(msg.author)) {
            API.sendError(msg, `Você precisa sair da sua empresa atual para abrir outra!`)
            return;
        }

        let total = 0;

        let r1 = 75000;
        let r2 = 50000;
        let r3 = 50000;
        let r4 = 25000;
        let c1 = 125;

        total = r1+r2+r3+r4
        
        let playerobj = await API.getInfo(msg.author, 'machines')
        let playerobj2 = await API.getInfo(msg.author, 'players')
        const req = 10;
        const name = API.getMultipleArgs(msg, 2);
        const type = e[tipo].tipo;
        const icon = e[tipo].icon;
        let townname = await API.townExtension.getTownName(msg.author);
        let cristais = await API.eco.points.get(msg.author)
        
        const embed = new Discord.MessageEmbed()
        .addField(`📃 Informações da Empresa`, `Nome: **${name}**\nSetor: **${icon} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}**\nLocalização: **${townname}**`)
        .addField(`🧾 Contratos`, `\`Termos de Compromisso\`\n${API.format(r1)} ${API.money} ${API.moneyemoji}\n\`Compensação de Trabalho\`\n${API.format(r2)} ${API.money} ${API.moneyemoji}\n\`Autorização de Recebimento\`\n${API.format(r3)} ${API.money} ${API.moneyemoji}\n\`Instrumento Particular\`\n${API.format(r4)} ${API.money} ${API.moneyemoji}`)
        .addField(`📑 Requisitos de proposta`, `Nível mínimo: **${req}** ${playerobj.level >= req ? '✅':'❌'}\nMoedas: **${API.format(total)} ${API.money} ${API.moneyemoji}** ${playerobj2.money >= total ? '✅':'❌'}${c1 > 0 ? `\nCristais: **${API.format(c1)} ${API.money2} ${API.money2emoji}** ${cristais >= c1 ? '✅':'❌'}`:''}`)
        .setColor('#00e061')
        .setFooter('Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa')
		const embedmsg = await msg.quote(embed);
        
        await embedmsg.react('✅')
        embedmsg.react('❌')
        
        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 60000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(['✅', '❌'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();

            if (reaction.emoji.name == '❌'){
                embed.setColor('#a60000');
                embed.addField('❌ Abertura cancelada', `
                Você cancelou a abertura da empresa **${icon} ${name}**.`)
                embedmsg.edit(embed);
                return;
            }

            playerobj = await API.getInfo(msg.author, 'machines')
            playerobj2 = await API.getInfo(msg.author, 'players')

            cristais = await API.eco.points.get(msg.author)

            if (playerobj.level < req) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui nível o suficiente para abrir uma empresa!\nSeu nível atual: **${playerobj.level}/${req}**\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
                embedmsg.edit(embed);
                return;
            }

            if (playerobj2.money < total) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui dinheiro o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${API.format(playerobj2.money)}/${API.format(total)} ${API.money} ${API.moneyemoji}**`)
                embedmsg.edit(embed);
                return;
            }
            if (cristais < c1) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui cristais o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${API.format(cristais)}/${API.format(c1)} ${API.money2} ${API.money2emoji}**`)
                embedmsg.edit(embed);
                return;
            }

            if (await API.company.check.isWorker(msg.author)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você precisa sair da sua empresa atual para abrir outra!`)
                embedmsg.edit(embed);
                return;
            }

            if (await API.company.check.hasCompany(msg.author)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não pode abrir mais de uma empresa!`)
                embedmsg.edit(embed);
                return;
            }

            let cont = false;
            try {
                let res = await API.db.pool.query(`SELECT * FROM companies;`);
                for (const r of res.rows) {
                    if (r.name.toLowerCase() == name.toLowerCase()) {
                        cont = true;
                        break;
                    }
                }
            }catch (err) { 
                client.emit('error', err)
                throw err 
            }
            
            if (cont) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Já possui uma empresa com este nome! Pense em outro`)
                embedmsg.edit(embed);
                return;
            }

            const code = await API.company.create(msg.author, {
                type: type,
                icon: icon,
                name: name,
                tipo: tipo
            })
            
            API.eco.money.remove(msg.author, total)
            API.eco.points.remove(msg.author, c1)
            API.eco.addToHistory(msg.member, `Nova empresa | - ${API.format(total)} ${API.moneyemoji}${c1 > 0 ? ` | - ${API.format(c1)} ${API.money2} ${API.money2emoji}`:''}`)
            townname = await API.townExtension.getTownName(msg.author);
            embed
            .addField(`✅ Sucesso na abertura`, `Parabéns, você acaba de abrir a empresa **${API.company.e[API.company.types[type]].icon} ${name}**\nCódigo da empresa: **${code}**`)
            .setColor('#00e061')
            .setFooter('Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa')
            embedmsg.edit(embed);
            return

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria abrir a empresa **${API.company.e[API.company.types[type]].icon} ${name}**, porém o tempo expirou.`)
            embedmsg.edit(embed);
            return;
        });
        





	}
};