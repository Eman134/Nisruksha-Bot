module.exports = {
    name: 'máquina',
    aliases: ['maquina', 'maq', 'machine', 'maquinas', 'máquinas'],
    category: 'Maquinas',
    description: 'Visualiza as informações da sua máquina',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        let member;
        let args = API.args(msg)
        if (msg.mentions.users.size < 1) {
            if (args.length == 0) {
                member = msg.author;
            } else {
                let member2 = await API.client.users.fetch(args[0])
                if (!member2) {
                    member = msg.author
                } else {
                    member = member2
                }
            }
        } else {
            member = msg.mentions.users.first();
        }

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()

        const playerobj = await API.getInfo(member, 'machines')
        let energia = await API.maqExtension.getEnergy(member);
        let energymax = await API.maqExtension.getEnergyMax(member);

        let maqid = playerobj.machine;
        let maq = API.shopExtension.getProduct(maqid);

        let progress2 = API.getProgress(10, '■', '□', energia, energymax);

        let profundidade = await API.maqExtension.getDepth(member)

       const ep = await API.maqExtension.getEquipedPieces(member);
        embed.setAuthor(`${member.tag}`, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        embed.setColor('#7e6eb5')
        embed.setDescription(`
${maq.icon ? maq.icon + ' ':''}${maq.name}
╔═══════
║ <:info:736274028515295262> Informações
║
║ Profundidade: ${profundidade}m
║ Durabilidade: ${Math.round(100*playerobj.durability/maq.durability)}%
║ Energia da máquina: ${progress2}${API.cacheLists.waiting.includes(member, 'mining') ? `\n║ [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member, 'mining')})`:''}
║ Tier: ${maq.tier} (${API.maqExtension.ores.getObj().minerios[maq.tier].name} ${API.maqExtension.ores.getObj().minerios[maq.tier].icon})
║ 
╠═══════
║ 🧩 Slots de Aprimoramento [\`${ep == null ? 0: ep.length}/${API.maqExtension.getSlotMax(playerobj.level)}\`]
║ ${ep == null || ep.length == 0?'': `\n║${ep.map((i, index) => ` SLOT **${index+1}**. ${API.shopExtension.getProduct(i).icon} ${API.shopExtension.getProduct(i).name}`).join('\n║')}\n║`}
╚═══════
Dicas: 
A cada 6 níveis você adquire +1 Slot!
Para manusear placas use \`${API.prefix}equipar\` e \`${API.prefix}desequipar\``)

        msg.quote(embed);
	}
};