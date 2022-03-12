const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

const { readFileSync } = require('fs')

const jsonStringores = readFileSync('./_json/ores.json', 'utf8')
const customerores = JSON.parse(jsonStringores);

const minérios = customerores

const options = (option) => {
    option.setName('minério').setDescription('Selecione um minério para venda')
    minérios.map(key => {
        option.addChoice(key.name, key.name)
    })
    return option.setRequired(false)
}

const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de algum minério ou "tudo" para vender').setRequired(true))
.addStringOption(options)

module.exports = {
    name: 'vender',
    aliases: ['sell', 'v', 's'],
    category: 'Economia',
    description: 'Vende todos os recursos ou específicos do seu armazém',
    data,
    mastery: 50,
	async execute(API, interaction) {

        let minério = interaction.options.getString('minério')
        let quantia = interaction.options.getString('quantia')

        const armsize = await API.maqExtension.storage.getSize(interaction.user.id);

        if (armsize <= 0) {
            const embedtemp = await API.sendError(interaction, `Você não possui recursos no seu armazém para vender!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (minério != null && (!API.itemExtension.exists(minério))) {
            const embedtemp = await API.sendError(interaction, `Você precisa identificar um minério EXISTENTE para venda!\nVerifique os recursos disponíveis utilizando \`/armazém\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (minério != null) minério = minério.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        quantia = quantia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

        if ((API.isInt(quantia) == false) && quantia != 'tudo') {
            const embedtemp = await API.sendError(interaction, `Você precisa identificar uma quantia para venda!`, `vender <tudo | quantia> [minério]\n/vender tudo\n/vender tudo cobre\n/vender 500 pedra`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (API.isInt(quantia) && minério == null) {
            const embedtemp = await API.sendError(interaction, `Você precisa identificar um produto para venda!`, `vender <tudo | quantia> [minério]\n/vender tudo\n/vender tudo cobre\n/vender 500 pedra`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let type;
        let id = '';
        if (minério != null) id = minério

        if (quantia == 'tudo' && minério == null) {
            type = 0;
        }

        let obj = API.itemExtension.getObj();
        const obj2 = await DatabaseManager.get(interaction.user.id, 'storage')

        if (quantia == 'tudo' && minério != null) {

            if (obj2[id] <= 0) {
                const embedtemp = await API.sendError(interaction, `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            type = 1;
        }

        if (API.isInt(quantia) && minério != null) {
            type = 2;
            if (parseInt(quantia) <= 0) {
                const embedtemp = await API.sendError(interaction, `Você não pode vender essa quantia de \`${id.charAt(0).toUpperCase() + id.slice(1)}\`!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            if (obj2[id] <= 0) {
                const embedtemp = await API.sendError(interaction, `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (parseInt(quantia) > obj2[id]) {
                const embedtemp = await API.sendError(interaction, `Você não possui **${quantia}g** de \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
        }

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "venda");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'venda', 'vender minérios novamente')

            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "venda", 35);

        let total = 0;
        let totalsize = 0;
        let caseprice = 0;
        switch (type) {
            case 0:
                //for (const key in obj) {
                    for (const r of obj.minerios) {
                        total += obj2[r.name]*r.price.atual;
                        totalsize += obj2[r.name]
                    }
                //}
                break;
            case 1:
                //for (const key in obj) {
                    for (const r of obj.minerios) {
                        let _id = r.name;
                        if (id == _id) caseprice = r.price.atual;
                    }
                //}
                total += obj2[id]*caseprice;
                totalsize = obj2[id];
                break;
            case 2:
                //for (const key in obj) {
                    for (const r of obj.minerios) {
                        let _id = r.name;
                        if (id == _id) caseprice = r.price.atual;
                    }
                //}
                totalsize = parseInt(quantia);
                total += parseInt(quantia)*caseprice;
                break;
        }

        const playerobj = await DatabaseManager.get(interaction.user.id, 'players')

        const taxa = playerobj.mvp != null ? 0.01 : 0.03

        const totaltaxa = Math.round(total*taxa);

        total = Math.round(total - totaltaxa);

        const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja vender **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji} **(${taxa*100}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa)**?`)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let selled = false;
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            selled = true;
            collector.stop();
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Venda cancelada', `
                Você cancelou a venda de **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji} **(${taxa*100}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa)**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            let obj3 = await DatabaseManager.get(interaction.user.id, 'storage')

            switch (type) {
                case 0:

                    let armsize2 = await API.maqExtension.storage.getSize(interaction.user.id);

                    if (armsize2 <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui recursos no seu armazém para vender!`)
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    //for (const key in obj) {
                        for (const r of obj.minerios) {
                            API.itemExtension.set(interaction.user.id, r.name, 0)
                        }
                    //}
                    break;
                case 1:

                    if (obj3[id] <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    API.itemExtension.set(interaction.user.id, id, 0)
                    break;
                case 2:

                    if (obj3[id] <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    if (parseInt(quantia) > obj3[id]) {
                        embed.addField('❌ Venda cancelada', `Você não possui **${quantia}g** de \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    API.itemExtension.set(interaction.user.id, id, obj2[id]-parseInt(quantia))
                    break;
            }
            
            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Sucesso na venda', `
            Você vendeu **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji} **(${taxa*100}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa)**.`)
            if(API.debug) embed.addField('<:error:736274027756388353> Depuração', `\n\`\`\`js\nSize: ${totalsize > 1000 ? Math.round(totalsize/1000) + 'kg': totalsize + 'g'}\nTotal: $${API.format(total)}\nResposta em: ${Date.now()-interaction.createdTimestamp}ms\`\`\``)
            interaction.editReply({ embeds: [embed], components: [] });
            API.eco.addToHistory(interaction.user.id, `Venda | + ${API.format(total)} ${API.moneyemoji}`)
            API.eco.money.add(interaction.user.id, total)
            if (totaltaxa > 0) {
                API.eco.money.globaladd(totaltaxa)
            }
        });
        
        collector.on('end', collected => {
            API.playerUtils.cooldown.set(interaction.user.id, "venda", 0);
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria vender **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji} **(${taxa*100}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa)**, porém o tempo expirou!`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};