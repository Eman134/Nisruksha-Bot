const itemsService = require('../../_classes/services/items');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const playersService = require('../../_classes/services/players');
const companyService = require('../../_classes/services/company');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const runtime = require('../../_classes/services/runtime');
const economyService = require('../../_classes/services/economy');
const companyInfo = require('../../_classes/services/companyInfo');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const prisma = require('../../_classes/prisma');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de algum item ou "tudo" para vender').setRequired(true))
.addStringOption(option => option.setName('item').setDescription('Selecione um item para venda').setRequired(false))

function buildMessage(interaction, { color = '#b8312c', title, value }) {
    return new ContainerBuilder()
        .setAccentColor(parseInt(color.slice(1), 16))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent([
            `**${interaction.user.tag}**`,
            title ? `**${title}**` : '',
            value
        ].filter(Boolean).join('\n\n')));
}

function buildError(interaction, message, usage) {
    return buildMessage(interaction, { value: `<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}` });
}

module.exports = {
    name: 'venderitem',
    aliases: ['sellitem', 'vitem', 'vi', 'si', 'venderi'],
    category: 'Economia',
    description: 'Vende tods os ítens ou específicos da sua mochila',
    data,
    mastery: 50,
	async execute(interaction) {

        let item = interaction.options.getString('item')
        let quantia = interaction.options.getString('quantia')

        const armsize = await itemsService.getInv(interaction.user.id, true, true);

        if (armsize <= 0) {
            await interaction.reply({ components: [buildError(interaction, `Você não possui itens na sua mochila para vender!`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (item != null && !await itemsService.exists(item, 'drops')) {
            await interaction.reply({ components: [buildError(interaction, `Você precisa identificar um item EXISTENTE para venda!\nVerifique os itens disponíveis utilizando \`/mochila\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (item != null) item = item.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        quantia = quantia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

        if ((utility.isInt(quantia) == false) && quantia != 'tudo') {
            await interaction.reply({ components: [buildError(interaction, `Você precisa identificar uma quantia para venda!`, `venderitem <tudo | quantia> [nome do item]\n/venderitem tudo\n/venderitem tudo olho\n/venderitem 10 Carne de monstro`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (utility.isInt(quantia) && item == null) {
            await interaction.reply({ components: [buildError(interaction, `Você precisa identificar um item para venda!`, `venderitem <tudo | quantia> [nome do item]\n/venderitem tudo\n/venderitem tudo olho\n/venderitem 10 Carne de monstro`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        let type;
        let id = '';
        let drop
        let realname = ""
        if (item != null) {id = item; drop = await itemsService.get(id) }
        if (drop) realname = drop.name
        if (quantia == 'tudo' && item == null) {
            type = 0;
        }

        let obj = await itemsService.getObj();
        const user_id = BigInt(interaction.user.id)
        const obj2 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })

        if (quantia == 'tudo' && item != null) {

            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                await interaction.reply({ components: [buildError(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }

            type = 1;
        }

        if (utility.isInt(quantia) && item != null) {
            type = 2;
            if (parseInt(quantia) <= 0) {
                await interaction.reply({ components: [buildError(interaction, `Você não pode vender essa quantia de ${drop.icon} \`${drop.displayname}\`!`)], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }
            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                await interaction.reply({ components: [buildError(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }

            if (parseInt(quantia) > obj2[drop.name.replace(/"/g, '')]) {
                await interaction.reply({ components: [buildError(interaction, `Você não possui **${quantia}x** ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }
        }

        const check = await playersService.cooldown.check(interaction.user.id, "vendaitem");
        if (check) {
            playersService.cooldown.message(interaction, 'vendaitem', 'vender itens novamente')
            return;
        }

        playersService.cooldown.set(interaction.user.id, "vendaitem", 35);

        let total = 0;
        let totalsize = 0;
        let caseprice = 0;
        switch (type) {
            case 0:
                //for (const key in obj) {
                    for (const r of obj.drops) {
                        total += obj2[r.name.replace(/"/g, '')]*r.price;
                        totalsize += obj2[r.name.replace(/"/g, '')]
                    }
                //}
                break;
            case 1:
                total += obj2[drop.name.replace(/"/g, '')]*drop.price;
                totalsize = obj2[drop.name.replace(/"/g, '')];
                break;
            case 2:

                totalsize = parseInt(quantia);
                total += parseInt(quantia)*drop.price;
                break;
        }
        total = Math.round(total);

        let company;
        let pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
        
        if (await companyService.check.isWorker(interaction.user.id)) {
            company = await companyService.get.companyById(pobj.company);
        } else {
            company = await companyService.get.companyByOwnerId(interaction.user.id);
        }

        let owner
        
        if (company) owner = await companyService.get.ownerById(company.company_id);

        let totaltaxa = 0
        if (company) totaltaxa = Math.round(company.taxa*total/100)

        let totalantes = total
        
        let container = buildMessage(interaction, { color: '#606060', title: '<a:loading:736625632808796250> Aguardando confirmação', value: `
        Você deseja vender **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${utility.format(total)} ${utility.money}** ${utility.moneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa da empresa)**`}?` })
        
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ components: [container, new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let selled = false;
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            selled = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.venderitem.defer_update'); });
            if (b.customId == 'cancel'){
                container = buildMessage(interaction, { color: '#a60000', title: '❌ Venda cancelada', value: `
                Você cancelou a venda de **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${utility.format(total)} ${utility.money}** ${utility.moneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa da empresa)**`}.` });
                interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            let obj3 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })

            switch (type) {
                case 0:

                    let armsize2 = await itemsService.getInv(interaction.user.id, true, true);

                    if (armsize2 <= 0) {
                        container = buildMessage(interaction, { color: '#a60000', title: '❌ Venda cancelada', value: 'Você não possui itens na sua mochila para vender!' });
                        interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
                        return;
                    }

                    //for (const key in obj) {
                        for (const r of obj.drops) {
                            await itemsService.set(interaction.user.id, r.name, 0)
                        }
                    //}
                    break;
                case 1:

                    if (obj3[drop.name.replace(/"/g, '')] <= 0) {
                        container = buildMessage(interaction, { color: '#a60000', title: '❌ Venda cancelada', value: `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!` });
                        interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
                        return;
                    }

                    await itemsService.set(interaction.user.id, realname, 0)
                    break;
                case 2:

                    if (obj3[drop.name.replace(/"/g, '')] <= 0) {
                        container = buildMessage(interaction, { color: '#a60000', title: '❌ Venda cancelada', value: `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!` });
                        interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
                        return;
                    }

                    if (parseInt(quantia) > obj3[drop.name.replace(/"/g, '')]) {
                        container = buildMessage(interaction, { color: '#a60000', title: '❌ Venda cancelada', value: `Você não possui **${quantia}x** de ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!` });
                        interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
                        return;
                    }

                    await itemsService.set(interaction.user.id, realname, obj3[drop.name.replace(/"/g, '')] - parseInt(quantia))
                    break;
            }

            
            pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
            
            if (await companyService.check.isWorker(interaction.user.id)) {
                company = await companyService.get.companyById(pobj.company);
            } else {
                company = await companyService.get.companyByOwnerId(interaction.user.id);
            }
            if (company) owner = await companyService.get.ownerById(company.company_id);

            totaltaxa = 0
            if (company) totaltaxa = Math.round(company.taxa*total/100)

            totalantes = total
            total = Math.round(total-totaltaxa)

            if (owner && interaction.user.id == owner.id) {
                total = totalantes
            }
            
            let successValue = `
            Você vendeu **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${utility.format(totalantes)} ${utility.money}** ${utility.moneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa da empresa)**`}.`
            if(runtime.debug) successValue += `\n\n**<:error:736274027756388353> Depuração**\n\`\`\`js\nSize: ${totalsize > 1000 ? Math.round(totalsize/1000) + 'kg': totalsize + 'g'}\nTotal: $${utility.format(total)}\nResposta em: ${Date.now()-interaction.createdTimestamp}ms\`\`\``
            container = buildMessage(interaction, { color: '#5bff45', title: '✅ Sucesso na venda', value: successValue });
            await interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            await economyService.addToHistory(interaction.user.id, `Venda | + ${utility.format(total)} ${utility.moneyemoji}`)

            await economyService.money.add(interaction.user.id, total)
            
            if (!company || (owner && interaction.user.id == owner.id)) return
            let rend = company.rend || []
            rend.unshift(totaltaxa)
            rend = rend.slice(0, 10)

            await companyInfo.set(owner.id, company.company_id, 'rend', rend)

            await economyService.bank.add(owner.id, totaltaxa)

            companyService.stars.add(interaction.user.id, company.company_id, { rend: totaltaxa })

        });
        
        collector.on('end', collected => {
            playersService.cooldown.set(interaction.user.id, "vendaitem", 0);
            if (selled) return
            container = buildMessage(interaction, { color: '#a60000', title: '❌ Tempo expirado', value: `
            Você iria vender **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${utility.format(total)} ${utility.money}** ${utility.moneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa da empresa)**`}, porém o tempo expirou!` });
            interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
