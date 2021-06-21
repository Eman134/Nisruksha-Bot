module.exports = {
    name: 'desequipar',
    aliases: ['unequip'],
    category: 'Maquinas',
    description: 'Desquipa algum chipe da sua máquina',
    options: [{
        name: 'slot',
        type: 'STRING',
        description: 'Selecione o id do slot para desequipar',
        required: false
    }],
    mastery: 15,
	async execute(API, msg) {

        const Discord = API.Discord;

        let pieces = await API.maqExtension.getEquipedPieces(msg.author);
        var args = API.args(msg);

        if (API.cacheLists.waiting.includes(msg.author, 'mining')) {
            const embedtemp = await API.sendError(msg, `Você não pode equipar/desequipar chipes enquanto está minerando! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})`);
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (args.length < 1 || (!API.isInt(args[0]) && args[0] != "tudo")) {
            const embedtemp = await API.sendError(msg, `Você precisa escrever um ID de slot para desequipar!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots`, `desequipar <slot | tudo>`);
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let placa;
        let slot = parseInt(args[0])-1;

        let desequipado = ""

        if (args[0] == "tudo") {

            desequipado = "tudo"

            if (!pieces[0]) {
                const embedtemp = await API.sendError(msg, `Você não possui chipes equipados no momento!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots`);
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

            for (i = 0; i < pieces.length; i++){
                const pic = await API.getInfo(msg.author, 'storage')
                await API.setInfo(msg.author, 'storage', `"piece:${pieces[i]}"`, pic[`piece:${pieces[i]}`]+1)
            }

            API.setInfo(msg.author, 'machines', `slots`, [])

        } else {

            if (!API.isInt(args[0]) || parseInt(args[0]) < 0 || !pieces[slot] || pieces[slot] == 0) {
                const embedtemp = await API.sendError(msg, `Você não possui chipes neste slot para desequipar!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots`);
                await msg.quote({ embeds: [embedtemp]})
                return;
            } 

            placa = API.shopExtension.getProduct(pieces[slot]);
            desequipado = `${placa.icon ? placa.icon:''} ${placa.name}`

            pieces.length == 1 ? pieces = [] : pieces.splice(slot, 1);

            const pic = await API.getInfo(msg.author, 'storage')
        
            API.setInfo(msg.author, 'storage', `"piece:${placa.id}"`, pic[`piece:${placa.id}`]+1)
            API.setInfo(msg.author, 'machines', `slots`, pieces)

        }

        const embed = new Discord.MessageEmbed();
        embed.setColor('#5bff45');
        embed.addField('✅ Sucesso ao desequipar', `Você desequipou **${desequipado}** da sua máquina com sucesso!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots e chipes`)
        await msg.quote({ embeds: [embed] });
        
	}
};