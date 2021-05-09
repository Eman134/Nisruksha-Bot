const { json } = require("body-parser");

module.exports = {
    name: 'girar',
    aliases: ['flip'],
    category: 'Jogos',
    description: 'Aposte em cara ou coroa e duplique suas fichas',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        const check = await API.playerUtils.cooldown.check(msg.author, "flip");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'flip', 'girar cara ou coroa')

            return;
        }

        if (!(API.townExtension.games[await API.townExtension.getTownName(msg.author)].includes('flip'))) {
            API.sendError(msg, `A casa de jogos da sua vila não possui o jogo **FLIP**!\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(msg.author)].join(', ')}.**`)
			return;
        }

        if (args.length < 2) {
            API.sendError(msg, `Você precisa especificar o lado da moeda e a quantia da aposta!`, `girar <cara/coroa> <aposta>`)
			return;
        }

        if (!(['cara', 'coroa'].includes(args[0].toLowerCase()))) {
            API.sendError(msg, `Você precisa especificar um lado EXISTENTE de uma moeda!`, `girar <cara/coroa> <aposta>`)
            return;
        }

        if (!API.isInt(args[1])) {
            API.sendError(msg, `Você precisa especificar uma quantia de fichas (NÚMERO) para aposta!`, `girar <cara/coroa> <aposta>`)
            return;
        }

        let lado = args[0].toLowerCase()

        let aposta = parseInt(args[1]);

        if (aposta < 1) {
            API.sendError(msg, `A quantia mínima de apostas é de 1 ficha!`, `girar <cara/coroa> <aposta>`)
            return;
        }
        if (aposta > 1000) {
            API.sendError(msg, `A quantia máxima de apostas é de 1000 fichas!`, `girar <cara/coroa> <aposta>`)
            return;
        }

        const token = await API.eco.token.get(msg.author)

        if (token < aposta) {
            API.sendError(msg, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`${API.prefix}loja fichas\``)
            return;
        }

        let fcolor = "#"
        let fresponse = ""
        let response = "cara"

        const rd = API.random(0, 100)

        if (rd < 50) response = "coroa"

        if (response == lado) { // Ganhou
            fcolor += "56fc03"
            fresponse += "Yay! Você apostou em **" + lado + "** e ganhou " + API.format(aposta) + " " + API.money3 + " " + API.money3emoji
            API.eco.token.add(msg.author, aposta);
            API.eco.addToHistory(msg.member, `Flip | + ${API.format(aposta)} ${API.money3emoji}`);
        } else { // Perdeu
            fcolor += "fc0324"
            fresponse += "Oops! Você apostou em **" + lado + "** e perdeu " + API.format(aposta) + " " + API.money3 + " " + API.money3emoji
            API.eco.token.remove(msg.author, aposta);
            API.eco.addToHistory(msg.member, `Flip | - ${API.format(aposta)} ${API.money3emoji}`);
        }

        API.playerUtils.cooldown.set(msg.author, "flip", 0);

        
        async function applyBet(rd) {
            
            const bets = await API.getGlobalInfo("bets")

            let jsonbet = {
                "flip": []
            }
    
            
            if (bets != null) {
                jsonbet = bets
            }
    
            jsonbet.flip.unshift(rd)
            jsonbet.flip = jsonbet.flip.slice(0, 100)
    
            API.setGlobalInfo('bets', jsonbet)

            let chancemedia = 0
    
            for (i = 0; i < jsonbet.flip.length; i++) {
                chancemedia += jsonbet.flip[i]
            }

            return (chancemedia/jsonbet.flip.length).toFixed(3)
        }

        const chances = await applyBet(rd, response) 

        const embed = new Discord.MessageEmbed()
        embed.setDescription(fresponse + (chances ? `\nChances: \`${chances} cara/coroa\``:''))
        embed.setColor(fcolor)
        await msg.quote(embed)

        API.playerUtils.cooldown.set(msg.author, "flip", 5);

    
    }
};