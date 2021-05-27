module.exports = {
    name: 'versão',
    aliases: ['versao', 'patch', 'att'],
    category: 'Outros',
    description: 'Visualize o último patch de atualizações do bot',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;
        const args = API.args(msg);

        let patch = ''
        let patchobj

        const { readFileSync } = require('fs')
        const path = './_json/patch.json'
        try {
          if (path) {
            const jsonString = readFileSync(path, 'utf8')
            const customer = JSON.parse(jsonString);
            patchobj = customer;
          } else {
            console.log('File path is missing from patchobj!')
            if (API.debug) console.log(`Error on load patch obj`);
          }
        } catch (err) {
            console.log('Error parsing JSON string:', err);
            if (API.debug) console.log(`Error on load patch obj`);
            client.emit('error', err)
        }

        if (args.length == 0) {
            patch = API.version
        } else {
            patch = args[0]
        }

        if (!Object.keys(patchobj).includes(patch)) {
            patch = API.version
        }

        let getPatch = patchobj[patch] || API.version

        const Discord = API.Discord;
    
        const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        if (getPatch.title) embed.setTitle(getPatch.title)
        embed.setDescription(`**Versão ${patch}**${getPatch.obs ? '\n'+getPatch.obs:''}`)
        embed.addField(`\`Mudanças\``, getPatch.chn.length == 0 ? '**Não ocorreu mudanças**' : getPatch.chn.map(i => `<:changed:762022788038525008> ${i}`).join('\n'))
        embed.addField(`\`Adições\``, getPatch.add.length == 0 ? '**Não ocorreu adições**' : getPatch.add.map(i => `<:added:762022787773759498> ${i}`).join('\n'))
        embed.addField(`\`Remoções\``, getPatch.rem.length == 0 ? '**Não ocorreu remoções**' : getPatch.rem.map(i => `<:removed:762022787954245642> ${i}`).join('\n'))
        if (getPatch.alc.length > 0) embed.addField(`\`Novas alcunhas\``, getPatch.alc.map(i => `<:list:736274028179750922> ${i}`).join('\n'))
        if (getPatch.fix.length > 0) embed.addField(`\`Bugs fixados\``, getPatch.fix.map(i => `<:error:736274027756388353> ${i}`).join('\n'))

        .setFooter(`Veja um patch específico utilizando ${API.prefix}versão <versao>\nPatchs começaram a ser contados a partir de 2.0.0 e hoje está em ${patch}`)
        if (!API.owner.includes(msg.author.id)) {
            await msg.quote(embed);
            return;
        } else {
            
            let embedmsg
            if (!msg.slash) embedmsg = await msg.channel.send(embed);
            else embedmsg = await msg.quote(embed)

            try {

                await msg.delete()
                
            } catch {
                
            }
            embedmsg.react('762018420370833488');
            embedmsg.react('👍🏽');
            embedmsg.react('👎🏽');
        }

	}
};