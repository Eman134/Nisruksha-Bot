const Discord = require('discord.js');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
module.exports = {
    name: 'estamina',
    aliases: ['stamina', 'est', 'st'],
    category: 'Players',
    description: 'Visualiza as informações da sua estamina',
    mastery: 10,
	async execute(interaction) {

        
        let time = await playersService.stamina.time(interaction.user.id)
        let staminamax = 1000;
        let stamina = await playersService.stamina.get(interaction.user.id)

        if (stamina < 0) {
            await playersService.stamina.subset(interaction.user.id, 0)
            stamina = await playersService.stamina.get(interaction.user.id)
        }

		const buildStaminaContainer = (value, description, color) => new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**🔸 Estamina de \`${interaction.user.tag}\`: [${value}/${staminamax}]**\n${description}`));
        const initialDescription = stamina < staminamax
            ? `Irá recuperar completamente em: \`${utility.ms(time)}\`\n**Reaja com ⏰ para ser relembrado quando sua estamina recarregar**\nOBS: A estamina não recupera enquanto estiver usando!`
            : 'Estamina já está completamente cheia!\nOBS: A estamina não recupera enquanto estiver usando!';
        const container = buildStaminaContainer(stamina, initialDescription, 0xe06f0b);
        const embedinteraction = (await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        if (stamina == staminamax) return;
        embedinteraction.react('⏰')

        const filter = (reaction, user) => {
            return reaction.emoji.name === '⏰' && user.id === interaction.user.id;
        };
        
        const collector = embedinteraction.createReactionCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            reacted = true;
            const e1 = await playersService.stamina.get(interaction.user.id);
            const e2 = 1000
            const e3 = await playersService.stamina.time(interaction.user.id);
            const updatedContainer = buildStaminaContainer(e1, `Irá recuperar completamente em: \`${utility.ms(e3)}\`\n**Você será relembrado quando sua estamina recarregar!**\nOBS: A estamina não recupera enquanto estiver usando!`, 0x42f569);
            interaction.editReply({ components: [updatedContainer], flags: Discord.MessageFlags.IsComponentsV2 });
            collector.stop();
            if (await cacheListsService.remember.includes(interaction.user.id, "estamina")) return;
            await cacheListsService.remember.add(interaction.user.id, interaction.channel.id, "estamina");
            async function rem(){
                if (await playersService.stamina.get(interaction.user.id) >= 1000) {
                  await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Relatório de estamina: ${await playersService.stamina.get(interaction.user.id)}/1000`)], flags: Discord.MessageFlags.IsComponentsV2 })
                    await cacheListsService.remember.remove(interaction.user.id, "estamina")
                    return;
                } else {
                    setTimeout(function(){rem()}, await playersService.stamina.time(interaction.user.id)+1000)
                }
            }  
            rem();
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            let time = await playersService.stamina.time(interaction.user.id);
            let st = await playersService.stamina.get(interaction.user.id);
            const expiredContainer = buildStaminaContainer(st, `Irá recuperar completamente em: \`${utility.ms(time)}\`\nOBS: A estamina não recupera enquanto estiver usando!`, 0xe06f0b);
            interaction.editReply({ components: [expiredContainer], flags: Discord.MessageFlags.IsComponentsV2 });
        });

	}
};
