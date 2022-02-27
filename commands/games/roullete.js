const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))

module.exports = {
    name: 'roleta',
    aliases: ['roullete'],
    category: 'Jogos',
    description: 'Aposte em frutas e multiplique sua aposta',
    data,
    mastery: 3,
	async execute(API, interaction) {

        const Discord = API.Discord;

        const aposta = interaction.options.getInteger('fichas');

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "roullete");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'roullete', 'girar a roleta')

            return;
        }

        if (!(API.townExtension.games[await API.townExtension.getTownName(interaction.user.id)].includes('roleta'))) {
            const embedtemp = await API.sendError(interaction, `A casa de jogos da sua vila não possui o jogo **ROLETA**!\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(interaction.user.id)].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta < 5) {
            const embedtemp = await API.sendError(interaction, `A quantia mínima de apostas é de 5 fichas!`, `roleta 5`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta > 5000) {
            const embedtemp = await API.sendError(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `roleta 5000`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const token = await API.eco.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await API.sendError(interaction, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        const multiplier = {
            '🍊': 1.2,
            '🍓': 1.5,
            '🍐': 3,
            '🍇': 6.5
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#4e5052')
        .setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setTitle(`⭕ Roleta`)
        .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
        .setFooter(`⭕ Informações da sua aposta:\nEscolha uma fruta para apostar`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        const btn0 = API.createButton('🍊', 'SECONDARY', '', '🍊')
        const btn1 = API.createButton('🍓', 'SECONDARY', '', '🍓')
        const btn2 = API.createButton('🍐', 'SECONDARY', '', '🍐')
        const btn3 = API.createButton('🍇', 'SECONDARY', '', '🍇')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1, btn2, btn3])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
            
        const collector = await embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let selected;
        let reacted = false
        collector.on('collect', async (b) => {

            selected = b.customId;
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            reacted = true

            let array = [];
            let rolnum = API.random(15, 20)
            let currentnum = 0;
            async function roll(){

                if (array.length == 0) {
                    for (i = 0; i < 11; i++) {
                        let random = API.random(0, 100);

                        if (random < 45) {
                            array.push('🍊')
                        }else if (random < 76) {
                            array.push('🍓')
                        }else if (random < 95) {
                            array.push('🍐')
                        }else if (random >= 95) {
                            array.push('🍇')
                        }
                    }
                } else {
                    array.splice(0, 1);
                    let random = API.random(0, 100);

                    if (random < 45) {
                        array.push('🍊')
                    }else if (random < 76) {
                        array.push('🍓')
                    }else if (random < 90) {
                        array.push('🍐')
                    }else if (random < 100) {
                        array.push('🍇')
                    }
                }
                
                const embed2 = new Discord.MessageEmbed()
                .setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setColor('#4e5052')
                .setTitle(`⭕ Roleta`)
                .addField(`Sua aposta`, `Aposta: ${API.format(aposta)} ${API.money3} ${API.money3emoji}\nFruta: ${selected} (${multiplier[selected]}x)`, true)
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
                        API.eco.addToHistory(interaction.user.id, `Roleta | + ${API.format(Math.round(aposta*multiplier[selected])-aposta)} ${API.money3emoji}`);
                        embed2.setColor('#56fc03');title = '**✅ VOCÊ GANHOU!!**'; emote = '✅'; 
                        await API.eco.token.add(interaction.user.id, (Math.round(aposta*multiplier[selected])-aposta));API.playerUtils.cooldown.set(interaction.user.id, "roullete", 0);
                    }
                    else {
                        API.eco.addToHistory(interaction.user.id, `Roleta | - ${API.format(aposta)} ${API.money3emoji}`);
                        embed2.setColor('#fc0324');
                        title = '**❌ VOCÊ PERDEU!!**'; 
                        emote = '❌'; 
                        await API.eco.token.remove(interaction.user.id, aposta);
                        API.eco.token.add(API.id, aposta);
                        API.playerUtils.cooldown.set(interaction.user.id, "roullete", 0);
                    }
                    embed2.fields = [];
                    embed2.addField(`Sua aposta`, `Aposta: ${API.format(aposta)} ${API.money3} ${API.money3emoji}\nFruta: ${selected} (${multiplier[selected]}x)\n${emote} ${emote == '✅' ? `Lucro: ${(Math.round(aposta*multiplier[selected])-aposta)}`: `Prejuízo: ${aposta}`} ${API.money3} ${API.money3emoji}`, true)
                    .addField(`Informações de Jogo`, `\`🍊\` ${multiplier['🍊']}x\n\`🍓\` ${multiplier['🍓']}x\n\`🍐\` ${multiplier['🍐']}x\n\`🍇\` ${multiplier['🍇']}x`, true)
                    .setDescription(`${title}\n${'<:rol2:742058057110126674>'.repeat(5)}<:rol2s:742058927163965620>${'<:rol2:742058057110126674>'.repeat(5)}\n${array.join('')}\n${'<:rol1:742058057051144272>'.repeat(5)}<:rol1s:742058927021359145>${'<:rol1:742058057051144272>'.repeat(5)}`)
                    API.playerUtils.cooldown.set(interaction.user.id, "roullete", 0);
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

        API.playerUtils.cooldown.set(interaction.user.id, "roullete", 60);
    
    }
};