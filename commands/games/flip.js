const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const economyService = require('../../_classes/services/economy');
const config = require('../../_classes/config');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const prisma = require('../../_classes/prisma');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Selecione um membro para realizar a aposta').setRequired(true))
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))

module.exports = {
    name: 'girar',
    aliases: ['flip'],
    category: 'Jogos',
    description: 'Aposte em cara ou coroa e duplique suas fichas',
    data,
    mastery: 10,
	async execute(interaction) {

                
        const check = await playersService.cooldown.check(interaction.user.id, "flip");
        if (check) {

            playersService.cooldown.message(interaction, 'flip', 'apostar um giro contra um membro')

            return;
        }

        const aposta = interaction.options.getInteger('fichas');
        const member = interaction.options.getUser('membro')
        
        if (member.id == interaction.user.id) {
            const embedtemp = await utility.sendError(interaction, 'Você precisa mencionar outra pessoa para usar o flip', 'girar @membro <quantia | tudo>')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const townauthor = await townsService.getTownName(interaction.user.id)
        const townmember = await townsService.getTownName(member.id)

        if (!(townsService.games[townauthor].includes('flip'))) {
            const embedtemp = await utility.sendError(interaction, `A casa de jogos da sua vila não possui o jogo **FLIP**!\nJogos disponíveis na sua vila: **${townsService.games[townauthor].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (!(townsService.games[townmember].includes('flip'))) {
            const embedtemp = await utility.sendError(interaction, `A casa de jogos de ${member} não possui o jogo **FLIP**!\nJogos disponíveis na vila do mesmo: **${townsService.games[townmember].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta < 1) {
            const embedtemp = await utility.sendError(interaction, `A quantia mínima de apostas é de 1 ficha!`, `girar @membro <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (aposta > 5000) {
            const embedtemp = await utility.sendError(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `girar @membro <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await utility.sendError(interaction, `Você não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        const tokenmember = await economyService.token.get(member.id)

        if (tokenmember < aposta) {
            const embedtemp = await utility.sendError(interaction, `O membro ${member} não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let confirm = {}

        confirm[interaction.user.id] = '<a:loading:736625632808796250>'
        confirm[member.id] = '<a:loading:736625632808796250>'

        playersService.cooldown.set(interaction.user.id, "flip", 60);
        playersService.cooldown.set(member.id, "flip", 60);

        const embed = new Discord.EmbedBuilder()
        .setTitle('Giro')
        .setColor('#42e3d0')
		.setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${utility.money3}\` ${utility.money3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
        .addFields({ name: '<a:loading:736625632808796250> Aguardando confirmações', value: `${interaction.user} ${confirm[interaction.user.id]}\n${member} ${confirm[member.id]}` })
        
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = (button) => true

        let reacted = {}
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id || b.user.id === member.id)) return
            collector.resetTimer()
            playersService.cooldown.set(interaction.user.id, "flip", 60);
            playersService.cooldown.set(member.id, "flip", 60);
            reacted[b.user.id] = true
            if (b.customId == 'cancel'){
                confirm[b.user.id] = '❌'
            } else {
                confirm[b.user.id] = '✅'
            }

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.flip.defer_update'); });

            const embed = new Discord.EmbedBuilder()
            .setTitle('Giro')
            .setColor('#a60000')
            .setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${utility.money3}\` ${utility.money3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
            if (confirm[interaction.user.id] == '<a:loading:736625632808796250>' || confirm[member.id] == '<a:loading:736625632808796250>') {
                embed.addFields({ name: '<a:loading:736625632808796250> Aguardando confirmações', value: `${interaction.user} ${confirm[interaction.user.id]}\n${member} ${confirm[member.id]}` })
                return interaction.editReply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])] })
            }

            collector.stop()
            if (confirm[interaction.user.id] == '❌' && confirm[member.id] == '❌') {
                embed.addFields({ name: '❌ Aposta cancelada', value: `Os dois jogadores cancelaram a aposta!` })
            } else if (confirm[interaction.user.id] == '❌') {
                embed.addFields({ name: '❌ Aposta cancelada', value: `O membro ${interaction.user} cancelou a aposta!` })
            } else if (confirm[member.id] == '❌') {
                embed.addFields({ name: '❌ Aposta cancelada', value: `O membro ${member} não aceitou a aposta!` })
            } else if (confirm[interaction.user.id] == '✅' && confirm[member.id] == '✅') {

                const token = await economyService.token.get(interaction.user.id)

                if (token < aposta) {
                    embed.addFields({ name: '❌ Aposta cancelada', value: `${interaction.user} não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\`` })
                    return interaction.editReply({ embeds: [embed], components: [] });
                }
                const tokenmember = await economyService.token.get(member.id)

                if (tokenmember < aposta) {
                    embed.addFields({ name: '❌ Aposta cancelada', value: `${member} não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\`` })
                    return interaction.editReply({ embeds: [embed], components: [] });
                }

                let fresponse = ""
                let response = "cara"
                let lado = "cara"

                const rd = utility.random(0, 100)

                if (rd < 50) response = "coroa"

                if (response == lado) { // Author ganhou
                    fresponse += `Caiu em **CARA** e ${interaction.user} foi o ganhador das \`${utility.format(aposta)} ${utility.money3}\` ${utility.money3emoji}`
                    economyService.token.add(interaction.user.id, aposta);
                    economyService.token.remove(member.id, aposta);

                    economyService.addToHistory(interaction.user.id, `Flip ${member} | + ${utility.format(aposta)} ${utility.money3emoji}`);
                    economyService.addToHistory(member.id, `Flip ${interaction.user} | - ${utility.format(aposta)} ${utility.money3emoji}`);
                } else { // Membro ganhou
                    fresponse += `Caiu em **COROA** e ${member} foi o ganhador das \`${utility.format(aposta)} ${utility.money3}\` ${utility.money3emoji}`
                    economyService.token.add(member.id, aposta);
                    economyService.token.remove(interaction.user.id, aposta);

                    economyService.addToHistory(member.id, `Flip ${interaction.user} | + ${utility.format(aposta)} ${utility.money3emoji}`);
                    economyService.addToHistory(interaction.user.id, `Flip ${member} | - ${utility.format(aposta)} ${utility.money3emoji}`);
                }
                
                async function applyBet(rd) {

                    const user_id = BigInt(config.app.id)
                    const globalobj = await prisma.globals.upsert({ where: { user_id }, update: { user_id }, create: { user_id, keys: [], remember: [], processing: [] } });
                    
                    const bets = globalobj.bets

                    let jsonbet = {
                        "flip": []
                    }
                    
                    if (bets != null) {
                        jsonbet = bets
                    }
            
                    jsonbet.flip.unshift(rd)
                    jsonbet.flip = jsonbet.flip.slice(0, 100)
            
                    await prisma.globals.update({ where: { user_id }, data: { bets: jsonbet } })

                    let chancemedia = 0
            
                    for (i = 0; i < jsonbet.flip.length; i++) {
                        chancemedia += jsonbet.flip[i]
                    }

                    return (chancemedia/jsonbet.flip.length).toFixed(3)
                }

                const chances = await applyBet(rd, response) 
                embed.setColor('#5bff45');
                embed.addFields({ name: '✅ Aposta realizada', value: fresponse + (chances ? `\nChances: \`${chances} cara/coroa\``:'') })
                playersService.cooldown.set(interaction.user.id, "flip", 0);
                playersService.cooldown.set(member.id, "flip", 0);
            }
            
            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            playersService.cooldown.set(interaction.user.id, "flip", 0);
            playersService.cooldown.set(member.id, "flip", 0);
            if (reacted[interaction.user.id] == true && reacted[member.id] == true) return;

            const embed = new Discord.EmbedBuilder()
            .setTitle('Giro')
            .setColor('#a60000')
            .setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${utility.money3}\` ${utility.money3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
            .addFields({ name: '❌ Tempo expirado', value: `Um jogador não aceitou ou negou a aposta em tempo suficiente, a aposta foi cancelada!` })
            interaction.editReply({ embeds: [embed], components: [] });

            return;
        });

    
    }
};
