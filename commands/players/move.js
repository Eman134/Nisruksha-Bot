module.exports = {
    name: 'mover',
    aliases: ['move'],
    category: 'Players',
    description: 'Mova-se para uma outra vila específica',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        let args = API.args(msg);
        if (args.length == 0) {
            API.sendError(msg, `Você precisa digitar o nome de alguma vila para se mover!\nUtilize \`${API.prefix}mapa\` para visualizar as vilas existentes.`, `mover <${Object.keys(API.townExtension.population).join(' | ')}>`);
            return;
        }

        if (API.townExtension.getTownNumByName(args[0]) == 0) {
            API.sendError(msg, `Você precisa digitar o nome de alguma vila EXISTENTE para se mover!\nUtilize \`${API.prefix}mapa\` para visualizar as vilas existentes.`, `mover <${Object.keys(API.townExtension.population).join(' | ')}>`);
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'mining')) {
            API.sendError(msg, `Você não pode se mover enquanto minera! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})`)
            return;
        }
        if (API.cacheLists.waiting.includes(msg.author, 'fishing')) {
            API.sendError(msg, `Você não pode se mover enquanto pesca! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author, 'fishing')})`)
            return;
        }
        if (API.cacheLists.waiting.includes(msg.author, 'hunting')) {
            API.sendError(msg, `Você não pode se mover enquanto caça! [[VER CAÇA]](${API.cacheLists.waiting.getLink(msg.author, 'hunting')})`)
            return;
        }
        if (API.cacheLists.waiting.includes(msg.author, 'collecting')) {
            API.sendError(msg, `Você não pode se mover enquanto coleta! [[VER COLETA]](${API.cacheLists.waiting.getLink(msg.author, 'collecting')})`)
            return;
        }
        if (API.cacheLists.waiting.includes(msg.author, 'digging')) {
            API.sendError(msg, `Você não pode se mover enquanto escava um tesouro! [[VER ESCAVAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'digging')})`)
            return;
        }


        let atual = await API.townExtension.getTownNum(msg.author);
        let prox = API.townExtension.getTownNumByName(args[0]);

        if (atual == prox) {
            API.sendError(msg, `Você já se encontra nesta vila!\nUtilize \`${API.prefix}mapa\` para visualizar as vilas existentes.`)
            return;
        }

        let stamina = await API.maqExtension.stamina.get(msg.author)
        let staminamax = 1000;

        if (stamina < 200) {
            
            API.sendError(msg, `Você não possui estamina o suficiente para se mover!\nPara mover entre vilas gasta 200 pontos de Estamina.\n🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${staminamax}]**`)
            return;

        }

        
        const check = await API.checkCooldown(msg.author, "move");
        if (check) {

            let cooldown = await API.getCooldown(msg.author, "move");
            const embed = new Discord.MessageEmbed()
            .setColor('#b8312c')
            .setDescription('🕑 Aguarde mais `' + API.ms(cooldown) + '` para mover-se pelas vilas!')
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            msg.quote(embed);
            return;
        }
        API.setCooldown(msg.author, "move", 60*5);
        
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
                    API.eco.addToHistory(msg.member, `Assalto | - ${API.format(total)} ${API.moneyemoji}`)
                }
            }
        }
        
        API.maqExtension.stamina.remove(msg.author, 149)
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription(`Você usou 150 pontos de Estamina 🔸 e se moveu da vila **${API.townExtension.getTownNameByNum(atual)}** para a vila **${API.townExtension.getTownNameByNum(prox)}**${assaltado ? `\n🏴‍☠️ No meio de sua travessia você foi assaltado por ${assaltantes} assaltantes e perdeu ${assaltantes*5}% (${API.format(total)} ${API.money} ${API.moneyemoji}) do seu dinheiro!\n**Dica: Deposite seu dinheiro no banco para não ser assaltado!**` : ''}`)
        msg.quote(`${msg.author}`, embed);

	}
};