const Discord = require('discord.js');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
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

		const embed = new Discord.EmbedBuilder()
	    .setColor('#e06f0b')
        if (stamina < staminamax) embed.addFields({ name: `🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${staminamax}]**`, value: `Irá recuperar completamente em: \`${utility.ms(time)}\`\n**Reaja com ⏰ para ser relembrado quando sua estamina recarregar**\nOBS: A estamina não recupera enquanto estiver usando!` })
        else embed.addFields({ name: `🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${staminamax}]**`, value: `Estamina já está completamente cheia!\nOBS: A estamina não recupera enquanto estiver usando!` })
        const embedinteraction = (await interaction.reply({ embeds: [embed], withResponse: true })).resource.message;
        if (stamina == staminamax) return;
        embedinteraction.react('⏰')

        const filter = (reaction, user) => {
            return reaction.emoji.name === '⏰' && user.id === interaction.user.id;
        };
        
        const collector = embedinteraction.createReactionCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            reacted = true;
            const embed2 = new Discord.EmbedBuilder()
            const e1 = await playersService.stamina.get(interaction.user.id);
            const e2 = 1000
            const e3 = await playersService.stamina.time(interaction.user.id);
            embed2.addFields({ name: `🔸 Estamina de \`${interaction.user.tag}\`: **[${e1}/${e2}]**`, value: `Irá recuperar completamente em: \`${utility.ms(e3)}\`\n**Você será relembrado quando sua estamina recarregar!**\nOBS: A estamina não recupera enquanto estiver usando!` })
            embed2.setColor('#42f569')
            interaction.editReply({ embeds: [embed2]});
            collector.stop();
            if (await cacheListsService.remember.includes(interaction.user.id, "estamina")) return;
            await cacheListsService.remember.add(interaction.user.id, interaction.channel.id, "estamina");
            async function rem(){
                if (await playersService.stamina.get(interaction.user.id) >= 1000) {
                 await interaction.reply({ content: `Relatório de estamina: ${await playersService.stamina.get(interaction.user.id)}/1000`, mention: true})
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
            embed.fields = []
            embed.setColor('#e06f0b')
            embed.addFields({ name: `🔸 Estamina de \`${interaction.user.tag}\`: **[${st}/${1000}]**`, value: `Irá recuperar completamente em: \`${utility.ms(time)}\`\nOBS: A estamina não recupera enquanto estiver usando!` })
            interaction.editReply({ embeds: [embed] });
        });

	}
};
