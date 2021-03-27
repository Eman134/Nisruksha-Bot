module.exports = {
    name: 'desequipar',
    aliases: ['unequip'],
    category: 'Maquinas',
    description: 'Desquipa alguma placa da sua mochila',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        let pieces = await API.maqExtension.getEquipedPieces(msg.author);
        var args = API.args(msg);

        if (API.cacheLists.waiting.includes(msg.author, 'mining')) {
            API.sendError(msg, `Você não pode equipar/desequipar placas enquanto está minerando! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})`);
            return;
        }

        if (args.length < 1) {
            API.sendError(msg, `Você precisa escrever um ID de slot para desequipar!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots`, `desequipar <slot>`);
            return;
        }

        let placa;
        let slot = parseInt(args[0])-1;
        if (API.isInt(args[0]) == false || parseInt(args[0]) < 0 || pieces[slot] == null || pieces[slot] == undefined|| pieces[slot] == 0) {
            API.sendError(msg, `Você não possui placas neste slot para desequipar!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots`);
            return;
        } 
        
        placa = API.shopExtension.getProduct(pieces[slot]);
        const embed = new Discord.MessageEmbed();
        embed.setColor('#5bff45');
        embed.addField('✅ Sucesso ao desequipar', `Você desequipou **${placa.icon ? placa.icon+' ':''}${placa.name}** da sua máquina com sucesso!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots e placas\nUtilize \`${API.prefix}mochila\` para ver sua placa na mochila`)
        msg.quote(embed);

        pieces.length == 1 ? pieces = [] : pieces.splice(slot, 1);

        const pic = await API.getInfo(msg.author, 'storage')
    
        API.setInfo(msg.author, 'storage', `"piece:${placa.id}"`, pic[`piece:${placa.id}`]+1)
        API.setInfo(msg.author, 'machines', `slots`, pieces)
        
	}
};