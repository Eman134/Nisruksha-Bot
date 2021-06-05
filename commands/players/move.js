module.exports = {
    name: 'mover',
    aliases: ['move'],
    category: 'Players',
    description: 'Mova-se para uma outra vila específica',
    options: [{
        name: 'vila',
        type: 'STRING',
        description: 'Selecione a vila para a qual deseja se mover',
        required: false
    }],
    mastery: 25,
	async execute(API, msg) {

        const Discord = API.Discord;

        let args = API.args(msg);
        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa digitar o nome de alguma vila para se mover!\nUtilize \`${API.prefix}mapa\` para visualizar as vilas existentes.`, `mover <${Object.keys(API.townExtension.population).join(' | ')}>`);
            await msg.quote(embedtemp)
            return;
        }

        if (API.townExtension.getTownNumByName(args[0]) == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa digitar o nome de alguma vila EXISTENTE para se mover!\nUtilize \`${API.prefix}mapa\` para visualizar as vilas existentes.`, `mover <${Object.keys(API.townExtension.population).join(' | ')}>`);
            await msg.quote(embedtemp)
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'mining')) {
            const embedtemp = await API.sendError(msg, `Você não pode se mover enquanto minera! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})`)
            await msg.quote(embedtemp)
            return;
        }
        if (API.cacheLists.waiting.includes(msg.author, 'fishing')) {
            const embedtemp = await API.sendError(msg, `Você não pode se mover enquanto pesca! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author, 'fishing')})`)
            await msg.quote(embedtemp)
            return;
        }
        if (API.cacheLists.waiting.includes(msg.author, 'hunting')) {
            const embedtemp = await API.sendError(msg, `Você não pode se mover enquanto caça! [[VER CAÇA]](${API.cacheLists.waiting.getLink(msg.author, 'hunting')})`)
            await msg.quote(embedtemp)
            return;
        }
        if (API.cacheLists.waiting.includes(msg.author, 'collecting')) {
            const embedtemp = await API.sendError(msg, `Você não pode se mover enquanto coleta! [[VER COLETA]](${API.cacheLists.waiting.getLink(msg.author, 'collecting')})`)
            await msg.quote(embedtemp)
            return;
        }
        if (API.cacheLists.waiting.includes(msg.author, 'digging')) {
            const embedtemp = await API.sendError(msg, `Você não pode se mover enquanto escava um tesouro! [[VER ESCAVAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'digging')})`)
            await msg.quote(embedtemp)
            return;
        }


        let atual = await API.townExtension.getTownNum(msg.author);
        let prox = API.townExtension.getTownNumByName(args[0]);

        if (atual == prox) {
            const embedtemp = await API.sendError(msg, `Você já se encontra nesta vila!\nUtilize \`${API.prefix}mapa\` para visualizar as vilas existentes.`)
            await msg.quote(embedtemp)
            return;
        }

        let stamina = await API.maqExtension.stamina.get(msg.author)
        let staminamax = 1000;

        if (stamina < 150) {
            
            const embedtemp = await API.sendError(msg, `Você não possui estamina o suficiente para se mover!\nPara mover entre vilas gasta 150 pontos de Estamina.\n🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${staminamax}]**`)
            await msg.quote(embedtemp)
            return;

        }

        
        const check = await API.playerUtils.cooldown.check(msg.author, "move");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'move', 'mover-se pelas vilas')

            return;
        }
        API.playerUtils.cooldown.set(msg.author, "move", 60*5);
        
        API.townExtension.population[API.townExtension.getTownNameByNum(prox)]++;
        API.townExtension.population[API.townExtension.getTownNameByNum(atual)]--;

        API.setInfo(msg.author, 'towns', 'loc', prox);
        let assaltado = false;
        let total = 0;
        let money = await API.eco.money.get(msg.author);
        let assaltantes = API.random(1, 10);
        if (API.random(0, 100) < 50) assaltado = true;
        if (assaltado) {
            if (money < 1) {
                assaltado = false;
            } else {
                total = Math.round( (assaltantes*5)*money/100);
                if (total < 1) {
                    assaltado = false;
                } else {
                    API.eco.money.remove(msg.author, total);
                    API.eco.money.globaladd(total);
                    API.eco.addToHistory(msg.member, `Assalto | - ${API.format(total)} ${API.moneyemoji}`)
                }
            }
        }
        
        API.maqExtension.stamina.remove(msg.author, 149)
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription(`Você usou 150 pontos de Estamina 🔸 e se moveu da vila **${API.townExtension.getTownNameByNum(atual)}** para a vila **${API.townExtension.getTownNameByNum(prox)}**${assaltado ? `\n🏴‍☠️ No meio de sua travessia você foi assaltado por ${assaltantes} assaltantes e perdeu ${assaltantes*5}% (${API.format(total)} ${API.money} ${API.moneyemoji}) do seu dinheiro!\n**Dica: Deposite seu dinheiro no banco para não ser assaltado!**` : ''}`)
     await msg.quote(`${msg.author}`, embed);

	}
};