const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))

module.exports = {
    requiredServices: ["Discord","createButton","eco","format","id","money3","money3emoji","playerUtils","random","rowComponents","sendError","townExtension"],
    name: 'roleta',
    aliases: ['roullete'],
    category: 'Jogos',
    description: 'Aposte em frutas e multiplique sua aposta',
    data,
    mastery: 3,
	async execute(interaction, svcDiscord, svcCreateButton, svcEco, svcFormat, svcId, svcMoney3, svcMoney3emoji, svcPlayerUtils, svcRandom, svcRowComponents, svcSendError, svcTownExtension) {
        const aposta = interaction.options.getInteger('fichas');

        const check = await svcPlayerUtils.cooldown.check(interaction.user.svcId, "roullete");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'roullete', 'girar a roleta')

            return;
        }

        if (!(svcTownExtension.games[await svcTownExtension.getTownName(interaction.user.svcId)].includes('roleta'))) {
            const embedtemp = await svcSendError(interaction, `A casa de jogos da sua vila não possui o jogo **ROLETA**!\nJogos disponíveis na sua vila: **${svcTownExtension.games[await svcTownExtension.getTownName(interaction.user.svcId)].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta < 5) {
            const embedtemp = await svcSendError(interaction, `A quantia mínima de apostas é de 5 fichas!`, `roleta 5`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta > 5000) {
            const embedtemp = await svcSendError(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `roleta 5000`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const token = await svcEco.token.get(interaction.user.svcId)

        if (token < aposta) {
            const embedtemp = await svcSendError(interaction, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        const multiplier = {
            '🍊': 1.2,
            '🍓': 1.5,
            '🍐': 3,
            '🍇': 6.5
        }

        const embed = new svcDiscord.MessageEmbed()
        .setColor('#4e5052')
        .setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))
        .setTitle(`⭕ Roleta`)
        .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
        .setFooter(`⭕ Informações da sua aposta:\nEscolha uma fruta para apostar`, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))
        
        const btn0 = svcCreateButton('🍊', 'SECONDARY', '', '🍊')
        const btn1 = svcCreateButton('🍓', 'SECONDARY', '', '🍓')
        const btn2 = svcCreateButton('🍐', 'SECONDARY', '', '🍐')
        const btn3 = svcCreateButton('🍇', 'SECONDARY', '', '🍇')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1, btn2, btn3])], withResponse: true });

        const filter = i => i.user.svcId === interaction.user.svcId;
            
        const collector = await embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let selected;
        let reacted = false
        collector.on('collect', async (b) => {

            selected = b.customId;
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.roleta.defer_update'); });
            reacted = true

            let array = [];
            let rolnum = svcRandom(15, 20)
            let currentnum = 0;
            async function roll(){

                if (array.length == 0) {
                    for (i = 0; i < 11; i++) {
                        let svcRandom = svcRandom(0, 100);

                        if (svcRandom < 45) {
                            array.push('🍊')
                        }else if (svcRandom < 76) {
                            array.push('🍓')
                        }else if (svcRandom < 95) {
                            array.push('🍐')
                        }else if (svcRandom >= 95) {
                            array.push('🍇')
                        }
                    }
                } else {
                    array.splice(0, 1);
                    let svcRandom = svcRandom(0, 100);

                    if (svcRandom < 45) {
                        array.push('🍊')
                    }else if (svcRandom < 76) {
                        array.push('🍓')
                    }else if (svcRandom < 90) {
                        array.push('🍐')
                    }else if (svcRandom < 100) {
                        array.push('🍇')
                    }
                }
                
                const embed2 = new svcDiscord.MessageEmbed()
                .setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))
                .setColor('#4e5052')
                .setTitle(`⭕ Roleta`)
                .addField(`Sua aposta`, `Aposta: ${svcFormat(aposta)} ${svcMoney3} ${svcMoney3emoji}\nFruta: ${selected} (${multiplier[selected]}x)`, true)
                .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
                .setDescription(`**<a:loading:736625632808796250> Girando a roleta**\n${'<:rol2:742058057110126674>'.repeat(5)}<:rol2s:742058927163965620>${'<:rol2:742058057110126674>'.repeat(5)}\n${array.join('')}\n${'<:rol1:742058057051144272>'.repeat(5)}<:rol1s:742058927021359145>${'<:rol1:742058057051144272>'.repeat(5)}`)
                currentnum++;
                if (rolnum > currentnum) {
                    currentnum++;
                    setTimeout(function(){roll()}, 1550);
                } else {
                    let title
                    let emote
                    if (selected == array[5]) {
                        svcEco.addToHistory(interaction.user.svcId, `Roleta | + ${svcFormat(Math.round(aposta*multiplier[selected])-aposta)} ${svcMoney3emoji}`);
                        embed2.setColor('#56fc03');title = '**✅ VOCÊ GANHOU!!**'; emote = '✅'; 
                        await svcEco.token.add(interaction.user.svcId, (Math.round(aposta*multiplier[selected])-aposta));svcPlayerUtils.cooldown.set(interaction.user.svcId, "roullete", 0);
                    }
                    else {
                        svcEco.addToHistory(interaction.user.svcId, `Roleta | - ${svcFormat(aposta)} ${svcMoney3emoji}`);
                        embed2.setColor('#fc0324');
                        title = '**❌ VOCÊ PERDEU!!**'; 
                        emote = '❌'; 
                        await svcEco.token.remove(interaction.user.svcId, aposta);
                        svcEco.token.add(svcId, aposta);
                        svcPlayerUtils.cooldown.set(interaction.user.svcId, "roullete", 0);
                    }
                    embed2.fields = [];
                    embed2.addField(`Sua aposta`, `Aposta: ${svcFormat(aposta)} ${svcMoney3} ${svcMoney3emoji}\nFruta: ${selected} (${multiplier[selected]}x)\n${emote} ${emote == '✅' ? `Lucro: ${(Math.round(aposta*multiplier[selected])-aposta)}`: `Prejuízo: ${aposta}`} ${svcMoney3} ${svcMoney3emoji}`, true)
                    .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
                    .setDescription(`${title}\n${'<:rol2:742058057110126674>'.repeat(5)}<:rol2s:742058927163965620>${'<:rol2:742058057110126674>'.repeat(5)}\n${array.join('')}\n${'<:rol1:742058057051144272>'.repeat(5)}<:rol1s:742058927021359145>${'<:rol1:742058057051144272>'.repeat(5)}`)
                    svcPlayerUtils.cooldown.set(interaction.user.svcId, "roullete", 0);
                }
                interaction.editReply({ embeds: [embed2], components: [] });
            }

            roll();

            collector.stop();
        });

        collector.on('end', async collected => {

            if (reacted) return

            interaction.editReply({ embeds: [embed], components: [] });

            return;
        });

        svcPlayerUtils.cooldown.set(interaction.user.svcId, "roullete", 60);
    
    }
};
