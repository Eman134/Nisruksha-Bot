const runtime = require('../../_classes/services/runtime');
const clientService = require('../../_classes/services/clientService');
const framesService = require('../../_classes/services/frames');
const badgesService = require('../../_classes/services/badges');
const Discord = require('discord.js');
const config = require('../../_classes/config');
let patch = ''
let patchobj
const { reportError } = require('../../_classes/debug');

const { readFileSync } = require('fs')
const path = './_json/patch.json'
try {
  if (path) {
    const jsonString = readFileSync(path, 'utf8')
    const customer = JSON.parse(jsonString);
    patchobj = customer;
  } else {
    console.log('File path is missing from patchobj!')
    if (runtime.debug) console.log(`Error on load patch obj`);
  }
} catch (err) {
    if (runtime.debug) console.log(`Error on load patch obj`);
    clientService.current.emit('error', err)
}

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()

const options = (option) => {
    option.setName('versão').setDescription('Digite uma versão para visualizar as modificações que ocorreram nela')
    Object.keys(patchobj).forEach(key => {
        option.addChoices({ name: key, value: key })
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
	async execute(interaction) {

        const version = interaction.options.getString('versão')

        let patch

        if (version == null) {
            patch = require('{root}/package.json').version
        } else {
            patch = version
        }

        if (!Object.keys(patchobj).includes(patch)) {
            patch = require('{root}/package.json').version
        }

        const frameadded = await framesService.add(interaction.user.id, 15)
        const badgeadded = await badgesService.add(interaction.user.id, 3)

        let getPatch = patchobj[patch] || patchobj[require('{root}/package.json').version + '']

            
        const embed = new Discord.EmbedBuilder()
        .setColor(Math.floor(Math.random() * 0xffffff))
        if (getPatch.title) embed.setTitle(getPatch.title)
        embed.setDescription(`**Versão ${patch}**${getPatch.obs ? '\n'+getPatch.obs:''}`)
        embed.addFields({ name: '(' + getPatch.chn.length + `) \`Mudanças\``, value: getPatch.chn.length == 0 ? '**Não ocorreu mudanças**' : getPatch.chn.map(i => `<:changed:762022788038525008> ${i}`).join('\n') })
        embed.addFields({ name: '(' + getPatch.add.slice(0, 10).length + `) \`Adições\``, value: getPatch.add.length == 0 ? '**Não ocorreu adições**' : getPatch.add.slice(0, 10).map(i => `<:added:762022787773759498> ${i}`).join('\n') })
        if (getPatch.add.length > 10) embed.addFields({ name: '(' + getPatch.add.slice(10, 20).length + `) \`Adições\``, value: getPatch.add.length == 0 ? '**Não ocorreu adições**' : getPatch.add.slice(10, 20).map(i => `<:added:762022787773759498> ${i}`).join('\n') })
        embed.addFields({ name: '(' + getPatch.rem.length + `) \`Remoções\``, value: getPatch.rem.length == 0 ? '**Não ocorreu remoções**' : getPatch.rem.map(i => `<:removed:762022787954245642> ${i}`).join('\n') })
        if (getPatch.alc && getPatch.alc.length > 0) embed.addFields({ name: '(' + getPatch.alc.length + `) \`Novas alcunhas\``, value: getPatch.alc.map(i => `<:list:736274028179750922> ${i}`).join('\n') })
        if (getPatch.fix && getPatch.fix.length > 0) embed.addFields({ name: '(' + getPatch.fix.length + `) \`Bugs fixados\``, value: getPatch.fix.map(i => `<:error:736274027756388353> ${i}`).join('\n') })
        .setFooter({ text: `A cada EP novo, é resetado: Estrelas das empresas; Pontos de Maestria\nVeja um patch específico utilizando /versão <versao>\nPatchs começaram a ser contados a partir de 2.0.0 e hoje está em ${patch}` })
        if (!config.owner.includes(interaction.user.id)) {
            await interaction.reply({ embeds: [embed] });
        } else {
            interaction.reply('loading').then(async () => {
                try {
                    await interaction.deleteReply()
                    const embedinteraction = await interaction.channel.send({ embeds: [embed] })
                    embedinteraction.react('762018420370833488');
                    embedinteraction.react('👍🏽');
                    embedinteraction.react('👎🏽');
                } catch (error) {
                    reportError(error, 'command.patch.publish');
                }
            })
        }

        if (frameadded.includes('Added') || badgeadded.includes('Added')) {
            interaction.followUp({ content: `${interaction.user}, você recebeu um novo frame e um novo badge de temporada!`, flags: Discord.MessageFlags.Ephemeral })
        }
        
	}
};
