const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const machinesService = require('../../_classes/services/machines');
const economyService = require('../../_classes/services/economy');
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('quantia').setDescription('Selecione uma quantia para upar o armazém').setRequired(true))

module.exports = {
    name: 'upararmazém',
    aliases: ['upararmazem', 'uparm', 'uparestoque', 'upstorage'],
    category: 'Maquinas',
    description: 'Faz upgrade de espaço do seu armazém',
    data,
    mastery: 20,
	async execute(interaction) {

        
        let quantia = interaction.options.getInteger('quantia')

        if (quantia < 1) {
            const embedtemp = await utility.sendError(interaction, `Você não pode upar essa quantia de níveis!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (quantia > 25) {
            const embedtemp = await utility.sendError(interaction, `Você só pode upar até 25 níveis de armazém por vez!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let size = await machinesService.storage.getSize(interaction.user.id);
        let max = await machinesService.storage.getMax(interaction.user.id);
        let r1 = quantia;
        let pricea = await machinesService.storage.getPrice(interaction.user.id, r1)
        let price = Math.round(await machinesService.storage.getPrice(interaction.user.id, r1)*1.40)
        const user_id = BigInt(interaction.user.id)
        let obj = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
        let lvl = obj.storage;
        
		const embed = new Discord.EmbedBuilder()
        .setColor('#5634eb')
        .setTitle('Armazém de ' + interaction.user.username)
        .addFields({ name: '<:storageinfo:738427915531845692> Informações', value: `Peso atual: **[${utility.format(size)}/${utility.format(max)}]g**\nNível do armazém: **${utility.format(lvl)} (+${r1})**\nPreço do aprimoramento: **${utility.format(price)} ${utility.moneyemoji}**\n\nOBS: Um custo adicional foi implementado para\n aumentar diversos níveis de uma vez [+\`${Math.round(price-pricea)} ${utility.money}\` ${utility.moneyemoji}]\nCaso não deseja pagar esta taxa, aumente o nível 1 por vez com \`/armazém\`` })
        embed.addFields({ name: '<:waiting:739967127502454916> Aguardando resposta', value: 'Aprimorar o armazém [<:upgrade:738434840457642054>]' })

        const btn0 = utility.createButton('upgrade', 'SECONDARY', 'Upgrade', '738434840457642054')

        const embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 20000 });

        let reacted
        let err = false;
        let pago = 0;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            let ap = false;
            size = await machinesService.storage.getSize(interaction.user.id);
            max = await machinesService.storage.getMax(interaction.user.id);
            const money = await economyService.money.get(interaction.user.id);

            reacted = true;
            embed.fields = [];
            if (b.customId == 'upgrade'){
                if (price > money) {
                    embed.setColor('#a60000')
                    .addFields({ name: '❌ Aprimoramento mal sucedido!', value: `Você não possui dinheiro suficiente para realizar este aprimoramento!\nSeu dinheiro atual: **${utility.format(money)}/${utility.format(price)} ${utility.money} ${utility.moneyemoji}**` })
                    .setFooter({ text: '' })
                    err = true;
                } else {
                    embed.setColor('#5bff45');
                    pago += price;
                    await prisma.storage.update({ where: { user_id }, data: { storage: lvl+r1 } })
                    let obj55 = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
                    let lvl55 = obj55.storage;
                    embed.addFields({ name: '<:upgrade:738434840457642054> Aprimoramento realizado com sucesso!', value: `Peso máximo: **${utility.format(max)}g (+${r1*machinesService.storage.sizeperlevel})**\nNível do armazém: **${utility.format(lvl55)} (+${r1})**\nPreço pago: **${utility.format(pago)} ${utility.money} ${utility.moneyemoji}**` })
                    .setFooter({ text: '' })
                    economyService.money.remove(interaction.user.id, price)
                    economyService.addToHistory(interaction.user.id, `Aprimoramento Armazém | - ${utility.format(price)} ${utility.moneyemoji}`)
                    ap = true;
                }
                collector.stop()
            }
            try {
                if (embedinteraction)interaction.editReply({ embeds: [embed], components: [] });
            }catch (err){
                clientService.current.emit('error', err)
            }
            if (err)collector.stop()
            
        });
        
        collector.on('end', collected => {
            try {
                if (embedinteraction){
                    if (!reacted) {
                    embed.fields = [];
                    embed.addFields({ name: '<:storageinfo:738427915531845692> Informações', value: `Peso atual: **[${utility.format(size)}/${utility.format(max)}]g**\nNível do armazém: **${utility.format(lvl)} (+${r1})**\nPreço do aprimoramento: **${utility.format(price)} ${utility.moneyemoji}**\n\nOBS: Um custo adicional foi implementado para\n aumentar diversos níveis de uma vez [+\`${Math.round(price-pricea)} ${utility.money}\` ${utility.moneyemoji}]\nCaso não deseja pagar esta taxa, aumente o nível 1 por vez com \`/armazém\`` })
                    embed.addFields({ name: '❌ Sessão encerrada', value: 'O tempo de reação foi expirado!' })
                    .setFooter({ text: '' })
                    interaction.editReply({ embeds: [embed], components: [] });}
                }
            }catch (err){
                clientService.current.emit('error', err)
            }
        });

	}
};
