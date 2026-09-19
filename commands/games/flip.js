const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Selecione um membro para realizar a aposta').setRequired(true))
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))

module.exports = {
    requiredServices: ["Discord","client","createButton","eco","format","id","money3","money3emoji","playerUtils","random","rowComponents","sendError","townExtension"],
    name: 'girar',
    aliases: ['flip'],
    category: 'Jogos',
    description: 'Aposte em cara ou coroa e duplique suas fichas',
    data,
    mastery: 10,
	async execute(interaction, svcDiscord, svcClient, svcCreateButton, svcEco, svcFormat, svcId, svcMoney3, svcMoney3emoji, svcPlayerUtils, svcRandom, svcRowComponents, svcSendError, svcTownExtension) {
        const check = await svcPlayerUtils.cooldown.check(interaction.user.svcId, "flip");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'flip', 'apostar um giro contra um membro')

            return;
        }

        const aposta = interaction.options.getInteger('fichas');
        const member = interaction.options.getUser('membro')
        
        if (member.svcId == interaction.user.svcId) {
            const embedtemp = await svcSendError(interaction, 'Você precisa mencionar outra pessoa para usar o flip', 'girar @membro <quantia | tudo>')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const townauthor = await svcTownExtension.getTownName(interaction.user.svcId)
        const townmember = await svcTownExtension.getTownName(member.svcId)

        if (!(svcTownExtension.games[townauthor].includes('flip'))) {
            const embedtemp = await svcSendError(interaction, `A casa de jogos da sua vila não possui o jogo **FLIP**!\nJogos disponíveis na sua vila: **${svcTownExtension.games[townauthor].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (!(svcTownExtension.games[townmember].includes('flip'))) {
            const embedtemp = await svcSendError(interaction, `A casa de jogos de ${member} não possui o jogo **FLIP**!\nJogos disponíveis na vila do mesmo: **${svcTownExtension.games[townmember].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta < 1) {
            const embedtemp = await svcSendError(interaction, `A quantia mínima de apostas é de 1 ficha!`, `girar @membro <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (aposta > 5000) {
            const embedtemp = await svcSendError(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `girar @membro <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const token = await svcEco.token.get(interaction.user.svcId)

        if (token < aposta) {
            const embedtemp = await svcSendError(interaction, `Você não possui \`${aposta} ${svcMoney3}\` ${svcMoney3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        const tokenmember = await svcEco.token.get(member.svcId)

        if (tokenmember < aposta) {
            const embedtemp = await svcSendError(interaction, `O membro ${member} não possui \`${aposta} ${svcMoney3}\` ${svcMoney3emoji} para apostar!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let confirm = {}

        confirm[interaction.user.svcId] = '<a:loading:736625632808796250>'
        confirm[member.svcId] = '<a:loading:736625632808796250>'

        svcPlayerUtils.cooldown.set(interaction.user.svcId, "flip", 60);
        svcPlayerUtils.cooldown.set(member.svcId, "flip", 60);

        const embed = new svcDiscord.MessageEmbed()
        .setTitle('Giro')
        .setColor('#42e3d0')
		.setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${svcMoney3}\` ${svcMoney3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
        .addField('<a:loading:736625632808796250> Aguardando confirmações', `${interaction.user} ${confirm[interaction.user.svcId]}\n${member} ${confirm[member.svcId]}`)
        
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = (button) => true

        let reacted = {}
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (b) => {

            if (!(b.user.svcId === interaction.user.svcId || b.user.svcId === member.svcId)) return
            collector.resetTimer()
            svcPlayerUtils.cooldown.set(interaction.user.svcId, "flip", 60);
            svcPlayerUtils.cooldown.set(member.svcId, "flip", 60);
            reacted[b.user.svcId] = true
            if (b.customId == 'cancel'){
                confirm[b.user.svcId] = '❌'
            } else {
                confirm[b.user.svcId] = '✅'
            }

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.flip.defer_update'); });

            const embed = new svcDiscord.MessageEmbed()
            .setTitle('Giro')
            .setColor('#a60000')
            .setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${svcMoney3}\` ${svcMoney3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
            if (confirm[interaction.user.svcId] == '<a:loading:736625632808796250>' || confirm[member.svcId] == '<a:loading:736625632808796250>') {
                embed.addField('<a:loading:736625632808796250> Aguardando confirmações', `${interaction.user} ${confirm[interaction.user.svcId]}\n${member} ${confirm[member.svcId]}`)
                return interaction.editReply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])] })
            }

            collector.stop()
            if (confirm[interaction.user.svcId] == '❌' && confirm[member.svcId] == '❌') {
                embed.addField('❌ Aposta cancelada', `Os dois jogadores cancelaram a aposta!`)
            } else if (confirm[interaction.user.svcId] == '❌') {
                embed.addField('❌ Aposta cancelada', `O membro ${interaction.user} cancelou a aposta!`)
            } else if (confirm[member.svcId] == '❌') {
                embed.addField('❌ Aposta cancelada', `O membro ${member} não aceitou a aposta!`)
            } else if (confirm[interaction.user.svcId] == '✅' && confirm[member.svcId] == '✅') {

                const token = await svcEco.token.get(interaction.user.svcId)

                if (token < aposta) {
                    embed.addField('❌ Aposta cancelada', `${interaction.user} não possui \`${aposta} ${svcMoney3}\` ${svcMoney3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
                    return interaction.editReply({ embeds: [embed], components: [] });
                }
                const tokenmember = await svcEco.token.get(member.svcId)

                if (tokenmember < aposta) {
                    embed.addField('❌ Aposta cancelada', `${member} não possui \`${aposta} ${svcMoney3}\` ${svcMoney3emoji} para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
                    return interaction.editReply({ embeds: [embed], components: [] });
                }

                let fresponse = ""
                let response = "cara"
                let lado = "cara"

                const rd = svcRandom(0, 100)

                if (rd < 50) response = "coroa"

                if (response == lado) { // Author ganhou
                    fresponse += `Caiu em **CARA** e ${interaction.user} foi o ganhador das \`${svcFormat(aposta)} ${svcMoney3}\` ${svcMoney3emoji}`
                    svcEco.token.add(interaction.user.svcId, aposta);
                    svcEco.token.remove(member.svcId, aposta);

                    svcEco.addToHistory(interaction.user.svcId, `Flip ${member} | + ${svcFormat(aposta)} ${svcMoney3emoji}`);
                    svcEco.addToHistory(member.svcId, `Flip ${interaction.user} | - ${svcFormat(aposta)} ${svcMoney3emoji}`);
                } else { // Membro ganhou
                    fresponse += `Caiu em **COROA** e ${member} foi o ganhador das \`${svcFormat(aposta)} ${svcMoney3}\` ${svcMoney3emoji}`
                    svcEco.token.add(member.svcId, aposta);
                    svcEco.token.remove(interaction.user.svcId, aposta);

                    svcEco.addToHistory(member.svcId, `Flip ${interaction.user} | + ${svcFormat(aposta)} ${svcMoney3emoji}`);
                    svcEco.addToHistory(interaction.user.svcId, `Flip ${member} | - ${svcFormat(aposta)} ${svcMoney3emoji}`);
                }
                
                async function applyBet(rd) {

                    const globalobj = await DatabaseManager.get(svcId, 'globals');
                    
                    const bets = globalobj.bets

                    let jsonbet = {
                        "flip": []
                    }
                    
                    if (bets != null) {
                        jsonbet = bets
                    }
            
                    jsonbet.flip.unshift(rd)
                    jsonbet.flip = jsonbet.flip.slice(0, 100)
            
                    DatabaseManager.set(svcId, 'globals', 'bets', jsonbet)

                    let chancemedia = 0
            
                    for (i = 0; i < jsonbet.flip.length; i++) {
                        chancemedia += jsonbet.flip[i]
                    }

                    return (chancemedia/jsonbet.flip.length).toFixed(3)
                }

                const chances = await applyBet(rd, response) 
                embed.setColor('#5bff45');
                embed.addField('✅ Aposta realizada', fresponse + (chances ? `\nChances: \`${chances} cara/coroa\``:''))
                svcPlayerUtils.cooldown.set(interaction.user.svcId, "flip", 0);
                svcPlayerUtils.cooldown.set(member.svcId, "flip", 0);
            }
            
            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            svcPlayerUtils.cooldown.set(interaction.user.svcId, "flip", 0);
            svcPlayerUtils.cooldown.set(member.svcId, "flip", 0);
            if (reacted[interaction.user.svcId] == true && reacted[member.svcId] == true) return;

            const embed = new svcDiscord.MessageEmbed()
            .setTitle('Giro')
            .setColor('#a60000')
            .setDescription(`O membro ${interaction.user} iniciou uma aposta contra ${member} valendo \`${aposta} ${svcMoney3}\` ${svcMoney3emoji}\nCaso a moeda caia em **CARA**, ${interaction.user} vence. Se a moeda cair em **COROA**, ${member} será o vencedor da aposta.`)
            .addField('❌ Tempo expirado', `Um jogador não aceitou ou negou a aposta em tempo suficiente, a aposta foi cancelada!`)
            interaction.editReply({ embeds: [embed], components: [] });

            return;
        });

    
    }
};
