const runtime = require('../../_classes/services/runtime');
const clientService = require('../../_classes/services/clientService');
const framesService = require('../../_classes/services/frames');
const badgesService = require('../../_classes/services/badges');
const Discord = require('discord.js');
const config = require('../../_classes/config');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
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

            
        const fields = [
            { name: '(' + getPatch.chn.length + `) \`Mudanças\``, value: getPatch.chn.length == 0 ? '**Não ocorreu mudanças**' : getPatch.chn.map(i => `<:changed:762022788038525008> ${i}`).join('\n') },
            { name: '(' + getPatch.add.slice(0, 10).length + `) \`Adições\``, value: getPatch.add.length == 0 ? '**Não ocorreu adições**' : getPatch.add.slice(0, 10).map(i => `<:added:762022787773759498> ${i}`).join('\n') }
        ];
        if (getPatch.add.length > 10) fields.push({ name: '(' + getPatch.add.slice(10, 20).length + `) \`Adições\``, value: getPatch.add.length == 0 ? '**Não ocorreu adições**' : getPatch.add.slice(10, 20).map(i => `<:added:762022787773759498> ${i}`).join('\n') });
        fields.push({ name: '(' + getPatch.rem.length + `) \`Remoções\``, value: getPatch.rem.length == 0 ? '**Não ocorreu remoções**' : getPatch.rem.map(i => `<:removed:762022787954245642> ${i}`).join('\n') });
        if (getPatch.alc && getPatch.alc.length > 0) fields.push({ name: '(' + getPatch.alc.length + `) \`Novas alcunhas\``, value: getPatch.alc.map(i => `<:list:736274028179750922> ${i}`).join('\n') });
        if (getPatch.fix && getPatch.fix.length > 0) fields.push({ name: '(' + getPatch.fix.length + `) \`Bugs fixados\``, value: getPatch.fix.map(i => `<:error:736274027756388353> ${i}`).join('\n') });
        const container = new ContainerBuilder()
            .setAccentColor(Math.floor(Math.random() * 0xffffff))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                getPatch.title ? `## ${getPatch.title}` : '',
                `**Versão ${patch}**${getPatch.obs ? '\n' + getPatch.obs : ''}`,
                ...fields.map(field => `**${field.name}**\n${field.value}`),
                `-# A cada EP novo, é resetado: Estrelas das empresas; Pontos de Maestria\nVeja um patch específico utilizando /versão <versao>\nPatchs começaram a ser contados a partir de 2.0.0 e hoje está em ${patch}`
            ].filter(Boolean).join('\n\n')));
        if (!config.owner.includes(interaction.user.id)) {
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
        } else {
            interaction.reply({ components: [new TextDisplayBuilder().setContent('loading')], flags: Discord.MessageFlags.IsComponentsV2 }).then(async () => {
                try {
                    await interaction.deleteReply()
                    const embedinteraction = await interaction.channel.send({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
                    embedinteraction.react('762018420370833488');
                    embedinteraction.react('👍🏽');
                    embedinteraction.react('👎🏽');
                } catch (error) {
                    reportError(error, 'command.patch.publish');
                }
            })
        }

        if (frameadded.includes('Added') || badgeadded.includes('Added')) {
            interaction.followUp({ components: [new TextDisplayBuilder().setContent(`${interaction.user}, você recebeu um novo frame e um novo badge de temporada!`)], flags: Discord.MessageFlags.IsComponentsV2 | Discord.MessageFlags.Ephemeral })
        }
        
	}
};
