module.exports = {
    name: 'versão',
    aliases: ['versao', 'patch', 'att', 'temporada'],
    category: 'Outros',
    description: 'Visualize o último patch de atualizações do bot',
    options: [{
        name: 'versão',
        type: 'STRING',
        description: 'Digite uma versão para visualizar as modificações que ocorreram nela',
        required: false
    }],
    mastery: 20,
	async execute(API, msg) {

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

        //API.badges.add(msg.author, 2)
        //API.frames.add(msg.author, 13)

        let getPatch = patchobj[patch] || API.version

        const Discord = API.Discord;
    
        const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        if (getPatch.title) embed.setTitle(getPatch.title)
        embed.setDescription(`**Versão ${patch}**${getPatch.obs ? '\n'+getPatch.obs:''}`)
        embed.addField('(' + getPatch.chn.length + `) \`Mudanças\``, getPatch.chn.length == 0 ? '**Não ocorreu mudanças**' : getPatch.chn.map(i => `<:changed:762022788038525008> ${i}`).join('\n'))
        embed.addField('(' + getPatch.add.length + `) \`Adições\``, getPatch.add.length == 0 ? '**Não ocorreu adições**' : getPatch.add.map(i => `<:added:762022787773759498> ${i}`).join('\n'))
        embed.addField('(' + getPatch.rem.length + `) \`Remoções\``, getPatch.rem.length == 0 ? '**Não ocorreu remoções**' : getPatch.rem.map(i => `<:removed:762022787954245642> ${i}`).join('\n'))
        if (getPatch.alc.length > 0) embed.addField('(' + getPatch.alc.length + `) \`Novas alcunhas\``, getPatch.alc.map(i => `<:list:736274028179750922> ${i}`).join('\n'))
        if (getPatch.fix.length > 0) embed.addField('(' + getPatch.fix.length + `) \`Bugs fixados\``, getPatch.fix.map(i => `<:error:736274027756388353> ${i}`).join('\n'))

        .setFooter(`A cada EP novo, é resetado: Estrelas das empresas; Pontos de Maestria\nVeja um patch específico utilizando ${API.prefix}versão <versao>\nPatchs começaram a ser contados a partir de 2.0.0 e hoje está em ${patch}`)
        if (!API.owner.includes(msg.author.id)) {
            await msg.quote({ embeds: [embed] });
            return;
        } else {
            
            let embedmsg
            if (!msg.slash) embedmsg = await msg.channel.send({ embeds: [embed]});
            else embedmsg = await msg.quote({ embeds: [embed] })

            try {

                if (!msg.slash)await msg.delete()
                
            } catch {
                
            }
            embedmsg.react('762018420370833488');
            embedmsg.react('👍🏽');
            embedmsg.react('👎🏽');
        }

	}
};