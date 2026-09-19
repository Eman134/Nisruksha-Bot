const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const crateExtensionService = require('../../_classes/services/crateExtension');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const errorContainer = (interaction, message, usage) => new ContainerBuilder()
    .setAccentColor(0xb8312c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`));
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('id-caixa').setDescription('Digite o id da caixa da sua mochila').setRequired(true))

module.exports = {
    name: 'recompensascaixa',
    aliases: ['recomcaixa', 'boxrewards', 'recc'],
    category: 'Players',
    description: 'Visualiza as recompensas de uma caixa misteriosa da sua mochila',
    data,
    mastery: 10,
	async execute(interaction) {

        
        const id = interaction.options.getInteger('id-caixa');

        const user_id = BigInt(interaction.user.id)
        const obj = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });

        const crateField = `crate_${id}`;
        if (obj[crateField] == null || obj[crateField] < 1 || obj[crateField] == undefined) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui uma caixa com este id!\nUtilize \`/mochila\` para visualizar suas caixas`, 'recc 1')], flags: Discord.MessageFlags.IsComponentsV2 })
			return;
        }

        const crateobj = await crateExtensionService.getCrate(id)
        if (!crateobj) return;
        let rewardsmap = "Esta caixa possui recompensas randômicas... Nunca se sabe o que pode vir dela."

        if (typeof crateobj.rewards != 'string') {
            
            rewardsmap = [...crateobj.rewards].sort(function(a, b){
                return b.chance - a.chance;
            }).map(r => `${r.icon} ${r.name} - \`(Chance de ${r.chance}%)\``).join('\n');

        }
        
		const container = new ContainerBuilder()
	    .setAccentColor(0x606060)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ${interaction.user.tag}\n🏅 Recompensas disponíveis\n \n${rewardsmap}`)
        );
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

	}
};
