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
    API.client.emit('error', err)
}

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()

const options = (option) => {
    option.setName('versão').setDescription('Digite uma versão para visualizar as modificações que ocorreram nela')
    Object.keys(patchobj).forEach(key => {
        option.addChoice(key, key)
    })
    return option.setRequired(false)
}

data.addStringOption(options)

module.exports = {
    name: 'versão',
    aliases: ['versao', 'patch', 'att', 'temporada'],
    category: 'Outros',
    description: 'Visualize o último patch de atualizações do bot',
    data,
    mastery: 20,
	async execute(API, interaction) {

        const version = interaction.options.getString('versão')

        let patch

        if (version == null) {
            patch = API.version
        } else {
            patch = version
        }

        if (!Object.keys(patchobj).includes(patch)) {
            patch = API.version
        }

        const frameadded = await API.frames.add(interaction.user.id, 15)
        const badgeadded = await API.badges.add(interaction.user.id, 3)

        let getPatch = patchobj[patch] || patchobj[API.version + '']

        const Discord = API.Discord;
    
        const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        if (getPatch.title) embed.setTitle(getPatch.title)
        embed.setDescription(`**Versão ${patch}**${getPatch.obs ? '\n'+getPatch.obs:''}`)
        embed.addField('(' + getPatch.chn.length + `) \`Mudanças\``, getPatch.chn.length == 0 ? '**Não ocorreu mudanças**' : getPatch.chn.map(i => `<:changed:762022788038525008> ${i}`).join('\n'))
        embed.addField('(' + getPatch.add.slice(0, 10).length + `) \`Adições\``, getPatch.add.length == 0 ? '**Não ocorreu adições**' : getPatch.add.slice(0, 10).map(i => `<:added:762022787773759498> ${i}`).join('\n'))
        if (getPatch.add.length > 10) embed.addField('(' + getPatch.add.slice(10, 20).length + `) \`Adições\``, getPatch.add.length == 0 ? '**Não ocorreu adições**' : getPatch.add.slice(10, 20).map(i => `<:added:762022787773759498> ${i}`).join('\n'))
        embed.addField('(' + getPatch.rem.length + `) \`Remoções\``, getPatch.rem.length == 0 ? '**Não ocorreu remoções**' : getPatch.rem.map(i => `<:removed:762022787954245642> ${i}`).join('\n'))
        if (getPatch.alc && getPatch.alc.length > 0) embed.addField('(' + getPatch.alc.length + `) \`Novas alcunhas\``, getPatch.alc.map(i => `<:list:736274028179750922> ${i}`).join('\n'))
        if (getPatch.fix && getPatch.fix.length > 0) embed.addField('(' + getPatch.fix.length + `) \`Bugs fixados\``, getPatch.fix.map(i => `<:error:736274027756388353> ${i}`).join('\n'))
        .setFooter(`A cada EP novo, é resetado: Estrelas das empresas; Pontos de Maestria\nVeja um patch específico utilizando /versão <versao>\nPatchs começaram a ser contados a partir de 2.0.0 e hoje está em ${patch}`)
        if (!API.owner.includes(interaction.user.id)) {
            await interaction.reply({ embeds: [embed] });
        } else {
            interaction.reply('loading').then(async () => {
                try {
                    await interaction.deleteReply()
                    const embedinteraction = await interaction.channel.send({ embeds: [embed], fetchReply: true })
                    embedinteraction.react('762018420370833488');
                    embedinteraction.react('👍🏽');
                    embedinteraction.react('👎🏽');
                } catch (error) {
                    console.log(error)
                }
            })
        }

        if (frameadded.includes('Added') || badgeadded.includes('Added')) {
            interaction.followUp({ content: `${interaction.user}, você recebeu um novo frame e um novo badge de temporada!`, ephemeral: true })
        }
        
	}
};