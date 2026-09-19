const machinesService = require('../../_classes/services/machines');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const itemsService = require('../../_classes/services/items');
const playersService = require('../../_classes/services/players');
const Discord = require('discord.js');
const runtime = require('../../_classes/services/runtime');
const economyService = require('../../_classes/services/economy');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const prisma = require('../../_classes/prisma');

const { readFileSync } = require('fs')

const jsonStringores = readFileSync('./_json/ores.json', 'utf8')
const customerores = JSON.parse(jsonStringores);

const minérios = customerores

const options = (option) => {
    option.setName('minério').setDescription('Selecione um minério para venda')
    minérios.map(key => {
        option.addChoices({ name: key.name, value: key.name })
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
	async execute(interaction) {

        let minério = interaction.options.getString('minério')
        let quantia = interaction.options.getString('quantia')

        const armsize = await machinesService.storage.getSize(interaction.user.id);

        if (armsize <= 0) {
            const embedtemp = await utility.sendError(interaction, `Você não possui recursos no seu armazém para vender!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (minério != null && (!await itemsService.exists(minério))) {
            const embedtemp = await utility.sendError(interaction, `Você precisa identificar um minério EXISTENTE para venda!\nVerifique os recursos disponíveis utilizando \`/armazém\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (minério != null) minério = minério.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        quantia = quantia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

        if ((utility.isInt(quantia) == false) && quantia != 'tudo') {
            const embedtemp = await utility.sendError(interaction, `Você precisa identificar uma quantia para venda!`, `vender <tudo | quantia> [minério]\n/vender tudo\n/vender tudo cobre\n/vender 500 pedra`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (utility.isInt(quantia) && minério == null) {
            const embedtemp = await utility.sendError(interaction, `Você precisa identificar um produto para venda!`, `vender <tudo | quantia> [minério]\n/vender tudo\n/vender tudo cobre\n/vender 500 pedra`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let type;
        let id = '';
        if (minério != null) id = minério

        if (quantia == 'tudo' && minério == null) {
            type = 0;
        }

        let obj = await itemsService.getObj();
        const user_id = BigInt(interaction.user.id)
        const obj2 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })

        if (quantia == 'tudo' && minério != null) {

            if (obj2[id] <= 0) {
                const embedtemp = await utility.sendError(interaction, `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            type = 1;
        }

        if (utility.isInt(quantia) && minério != null) {
            type = 2;
            if (parseInt(quantia) <= 0) {
                const embedtemp = await utility.sendError(interaction, `Você não pode vender essa quantia de \`${id.charAt(0).toUpperCase() + id.slice(1)}\`!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            if (obj2[id] <= 0) {
                const embedtemp = await utility.sendError(interaction, `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (parseInt(quantia) > obj2[id]) {
                const embedtemp = await utility.sendError(interaction, `Você não possui **${quantia}g** de \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
        }

        const check = await playersService.cooldown.check(interaction.user.id, "venda");
        if (check) {

            playersService.cooldown.message(interaction, 'venda', 'vender minérios novamente')

            return;
        }

        playersService.cooldown.set(interaction.user.id, "venda", 35);

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

        const playerobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })

        const taxa = playerobj.mvp != null ? 0.01 : 0.03

        const totaltaxa = Math.round(total*taxa);

        total = Math.round(total - totaltaxa);

        const embed = new Discord.EmbedBuilder();
        embed.setColor('#606060');
        embed.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })

        embed.addFields({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `
        Você deseja vender **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${utility.format(total)} ${utility.money}** ${utility.moneyemoji} **(${taxa*100}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa)**?` })

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let selled = false;
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            selled = true;
            collector.stop();
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.vender.defer_update'); });
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Venda cancelada', value: `
                Você cancelou a venda de **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${utility.format(total)} ${utility.money}** ${utility.moneyemoji} **(${taxa*100}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa)**.` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            let obj3 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })

            switch (type) {
                case 0:

                    let armsize2 = await machinesService.storage.getSize(interaction.user.id);

                    if (armsize2 <= 0) {
                        embed.addFields({ name: '❌ Venda cancelada', value: `Você não possui recursos no seu armazém para vender!` })
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    //for (const key in obj) {
                        for (const r of obj.minerios) {
                            await itemsService.set(interaction.user.id, r.name, 0)
                        }
                    //}
                    break;
                case 1:

                    if (obj3[id] <= 0) {
                        embed.addFields({ name: '❌ Venda cancelada', value: `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!` })
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    await itemsService.set(interaction.user.id, id, 0)
                    break;
                case 2:

                    if (obj3[id] <= 0) {
                        embed.addFields({ name: '❌ Venda cancelada', value: `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!` })
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    if (parseInt(quantia) > obj3[id]) {
                        embed.addFields({ name: '❌ Venda cancelada', value: `Você não possui **${quantia}g** de \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!` })
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    await itemsService.set(interaction.user.id, id, obj2[id] - parseInt(quantia))
                    break;
            }
            
            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addFields({ name: '✅ Sucesso na venda', value: `
            Você vendeu **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${utility.format(total)} ${utility.money}** ${utility.moneyemoji} **(${taxa*100}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa)**.` })
            if(runtime.debug) embed.addFields({ name: '<:error:736274027756388353> Depuração', value: `\n\`\`\`js\nSize: ${totalsize > 1000 ? Math.round(totalsize/1000) + 'kg': totalsize + 'g'}\nTotal: $${utility.format(total)}\nResposta em: ${Date.now()-interaction.createdTimestamp}ms\`\`\`` })
            await interaction.editReply({ embeds: [embed], components: [] });
            await economyService.addToHistory(interaction.user.id, `Venda | + ${utility.format(total)} ${utility.moneyemoji}`)
            await economyService.money.add(interaction.user.id, total)
            if (totaltaxa > 0) {
                await economyService.money.globaladd(totaltaxa)
            }
        });
        
        collector.on('end', collected => {
            playersService.cooldown.set(interaction.user.id, "venda", 0);
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `
            Você iria vender **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${utility.format(total)} ${utility.money}** ${utility.moneyemoji} **(${taxa*100}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa)**, porém o tempo expirou!` })
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
