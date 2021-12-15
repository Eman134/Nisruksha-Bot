const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
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
	async execute(API, interaction) {

        const Discord = API.Discord;
        const client = API.client;

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "flip");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'flip', 'apostar um giro contra um membro')

            return;
        }

        const aposta = interaction.options.getInteger('fichas');
        const member = interaction.options.getUser('membro')
        
        if (member.id == interaction.user.id) {
            const embedtemp = await API.sendError(interaction, 'Você precisa mencionar outra pessoa para usar o flip', 'girar @membro <quantia | tudo>')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const townauthor = await API.townExtension.getTownName(interaction.user.id)
        const townmember = await API.townExtension.getTownName(member.id)

        if (!(API.townExtension.games[townauthor].includes('flip'))) {
            const embedtemp = await API.sendError(interaction, `A casa de jogos da sua vila não possui o jogo **FLIP**!\nJogos disponíveis na sua vila: **${API.townExtension.games[townauthor].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (!(API.townExtension.games[townmember].includes('flip'))) {
            const embedtemp = await API.sendError(interaction, `A casa de jogos de ${member} não possui o jogo **FLIP**!\nJogos disponíveis na vila do mesmo: **${API.townExtension.games[townmember].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta < 1) {
            const embedtemp = await API.sendError(interaction, `A quantia mínima de apostas é de 1 ficha!`, `girar @membro <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (aposta > 5000) {
            const embedtemp = await API.sendError(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `girar @membro <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const token = await API.eco.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await API.sendError(interaction, `Você não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        const tokenmember = await API.eco.token.get(member.id)

        if (tokenmember < aposta) {
            const embedtemp = await API.sendError(interaction, `O membro ${member} não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para apostar!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let confirm = {}

        confirm[interaction.user.id] = '<a:loading:736625632808796250>'
        confirm[member.id] = '<a:loading:736625632808796250>'

        API.playerUtils.cooldown.set(interaction.user.id, "flip", 60);
        API.playerUtils.cooldown.set(member.id, "flip", 60);

        const embed = new Discord.MessageEmbed()
        .setTitle('Giro')
        .setColor('#42e3d0')
		.setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${API.money3}\` ${API.money3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
        .addField('<a:loading:736625632808796250> Aguardando confirmações', `${interaction.user} ${confirm[interaction.user.id]}\n${member} ${confirm[member.id]}`)
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = (button) => true

        let reacted = {}
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id || b.user.id === member.id)) return
            collector.resetTimer()
            API.playerUtils.cooldown.set(interaction.user.id, "flip", 60);
            API.playerUtils.cooldown.set(member.id, "flip", 60);
            reacted[b.user.id] = true
            if (b.customId == 'cancel'){
                confirm[b.user.id] = '❌'
            } else {
                confirm[b.user.id] = '✅'
            }

            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);

            const embed = new Discord.MessageEmbed()
            .setTitle('Giro')
            .setColor('#a60000')
            .setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${API.money3}\` ${API.money3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
            if (confirm[interaction.user.id] == '<a:loading:736625632808796250>' || confirm[member.id] == '<a:loading:736625632808796250>') {
                embed.addField('<a:loading:736625632808796250> Aguardando confirmações', `${interaction.user} ${confirm[interaction.user.id]}\n${member} ${confirm[member.id]}`)
                return interaction.editReply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] })
            }

            collector.stop()
            if (confirm[interaction.user.id] == '❌' && confirm[member.id] == '❌') {
                embed.addField('❌ Aposta cancelada', `Os dois jogadores cancelaram a aposta!`)
            } else if (confirm[interaction.user.id] == '❌') {
                embed.addField('❌ Aposta cancelada', `O membro ${interaction.user} cancelou a aposta!`)
            } else if (confirm[member.id] == '❌') {
                embed.addField('❌ Aposta cancelada', `O membro ${member} não aceitou a aposta!`)
            } else if (confirm[interaction.user.id] == '✅' && confirm[member.id] == '✅') {

                const token = await API.eco.token.get(interaction.user.id)

                if (token < aposta) {
                    embed.addField('❌ Aposta cancelada', `${interaction.user} não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
                    return interaction.editReply({ embeds: [embed], components: [] });
                }
                const tokenmember = await API.eco.token.get(member.id)

                if (tokenmember < aposta) {
                    embed.addField('❌ Aposta cancelada', `${member} não possui \`${aposta} ${API.money3}\` ${API.money3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
                    return interaction.editReply({ embeds: [embed], components: [] });
                }

                let fresponse = ""
                let response = "cara"
                let lado = "cara"

                const rd = API.random(0, 100)

                if (rd < 50) response = "coroa"

                if (response == lado) { // Author ganhou
                    fresponse += `Caiu em **CARA** e ${interaction.user} foi o ganhador das \`${API.format(aposta)} ${API.money3}\` ${API.money3emoji}`
                    API.eco.token.add(interaction.user.id, aposta);
                    API.eco.token.remove(member.id, aposta);

                    API.eco.addToHistory(interaction.user.id, `Flip ${member} | + ${API.format(aposta)} ${API.money3emoji}`);
                    API.eco.addToHistory(member.id, `Flip ${interaction.user} | - ${API.format(aposta)} ${API.money3emoji}`);
                } else { // Membro ganhou
                    fresponse += `Caiu em **COROA** e ${member} foi o ganhador das \`${API.format(aposta)} ${API.money3}\` ${API.money3emoji}`
                    API.eco.token.add(member.id, aposta);
                    API.eco.token.remove(interaction.user.id, aposta);

                    API.eco.addToHistory(member.id, `Flip ${interaction.user} | + ${API.format(aposta)} ${API.money3emoji}`);
                    API.eco.addToHistory(interaction.user.id, `Flip ${member} | - ${API.format(aposta)} ${API.money3emoji}`);
                }
                
                async function applyBet(rd) {

                    const globalobj = await DatabaseManager.get(API.id, 'globals');
                    
                    const bets = globalobj.bets

                    let jsonbet = {
                        "flip": []
                    }
                    
                    if (bets != null) {
                        jsonbet = bets
                    }
            
                    jsonbet.flip.unshift(rd)
                    jsonbet.flip = jsonbet.flip.slice(0, 100)
            
                    DatabaseManager.set(API.id, 'globals', 'bets', jsonbet)

                    let chancemedia = 0
            
                    for (i = 0; i < jsonbet.flip.length; i++) {
                        chancemedia += jsonbet.flip[i]
                    }

                    return (chancemedia/jsonbet.flip.length).toFixed(3)
                }

                const chances = await applyBet(rd, response) 
                embed.setColor('#5bff45');
                embed.addField('✅ Aposta realizada', fresponse + (chances ? `\nChances: \`${chances} cara/coroa\``:''))
                API.playerUtils.cooldown.set(interaction.user.id, "flip", 0);
                API.playerUtils.cooldown.set(member.id, "flip", 0);
            }
            
            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            API.playerUtils.cooldown.set(interaction.user.id, "flip", 0);
            API.playerUtils.cooldown.set(member.id, "flip", 0);
            if (reacted[interaction.user.id] == true && reacted[member.id] == true) return;

            const embed = new Discord.MessageEmbed()
            .setTitle('Giro')
            .setColor('#a60000')
            .setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${API.money3}\` ${API.money3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
            .addField('❌ Tempo expirado', `Um jogador não aceitou ou negou a aposta em tempo suficiente, a aposta foi cancelada!`)
            interaction.editReply({ embeds: [embed], components: [] });

            return;
        });

    
    }
};