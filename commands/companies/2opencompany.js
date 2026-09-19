const companyService = require('../../_classes/services/company');
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const economyService = require('../../_classes/services/economy');
const clientService = require('../../_classes/services/clientService');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()

const options = (option) => {
    
    option.setName('setor').setDescription('Digite o nome do setor para abrir')
    
    for (i = 0; i < Object.keys(companyService.e).length; i++) {
        const sector = companyService.e[Object.keys(companyService.e)[i]]
        const name = Object.keys(companyService.e)[i]
        if (sector.description) option.addChoices({ name: name.toUpperCase(), value: name })
    }
    
    return option.setRequired(true)
}

data.addStringOption(options)
.addStringOption(option => option.setName('nome').setDescription('Digite o nome da empresa').setRequired(true))

const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'abrirempresa',
    aliases: ['criarempresa', 'opencompany', 'abrire'],
    category: 'Empresas',
    description: 'Abra uma empresa de algum setor em seu nome e customize-a',
    data,
    mastery: 60,
	async execute(interaction) {

        
        const setor = interaction.options.getString('setor');
        const nome = interaction.options.getString('nome');

        let e = companyService.e;
        
        if (!(Object.keys(e).includes(setor))) {
            const embedtemp = await utility.sendError(interaction, `Você precisa digitar um setor de empresa existente!\nUtilize \`/setores\` para visualizar os setores disponíveis.`, 'abrirempresa <setor> <nome>')
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (nome.length > 30) {
            const embedtemp = await utility.sendError(interaction, `A nome de sua empresa não pode conter mais de 30 caracteres!`, 'abrirempresa <setor> <nome>')
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (await companyService.check.hasCompany(interaction.user.id)) {
            const embedtemp = await utility.sendError(interaction, `Você não pode abrir mais de uma empresa!`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await companyService.check.isWorker(interaction.user.id)) {
            const embedtemp = await utility.sendError(interaction, `Você precisa sair da sua empresa atual para abrir outra!`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let total = 0;

        let r1 = 75000;
        let r2 = 50000;
        let r3 = 50000;
        let r4 = 25000;
        let c1 = 125;

        total = r1+r2+r3+r4
        
        const user_id = BigInt(interaction.user.id)
        let playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
        let playerobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
        const req = 10;
        const name = nome;
        const type = e[setor].tipo;
        const icon = e[setor].icon;
        let townname = await townsService.getTownName(interaction.user.id);
        let cristais = await economyService.points.get(interaction.user.id)
        
        const embed = new Discord.EmbedBuilder()
        .addFields({ name: `📃 Informações da Empresa`, value: `Nome: **${name}**\nSetor: **${icon} ${setor.charAt(0).toUpperCase() + setor.slice(1)}**\nLocalização: **${townname}**` })
        .addFields({ name: `🧾 Contratos`, value: `\`Termos de Compromisso\`\n${utility.format(r1)} ${utility.money} ${utility.moneyemoji}\n\`Compensação de Trabalho\`\n${utility.format(r2)} ${utility.money} ${utility.moneyemoji}\n\`Autorização de Recebimento\`\n${utility.format(r3)} ${utility.money} ${utility.moneyemoji}\n\`Instrumento Particular\`\n${utility.format(r4)} ${utility.money} ${utility.moneyemoji}` })
        .addFields({ name: `📑 Requisitos de proposta`, value: `Nível mínimo: **${req}** ${playerobj.level >= req ? '✅':'❌'}\nMoedas: **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** ${playerobj2.money >= total ? '✅':'❌'}${c1 > 0 ? `\nCristais: **${utility.format(c1)} ${utility.money2} ${utility.money2emoji}** ${cristais >= c1 ? '✅':'❌'}`:''}` })
        .setColor('#00e061')
        .setFooter({ text: 'Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa' })
		
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.abrirempresa.defer_update'));
            reacted = true;
            collector.stop();
            
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Abertura cancelada', value: `
                Você cancelou a abertura da empresa **${icon} ${name}**.` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
            playerobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
            
            cristais = await economyService.points.get(interaction.user.id)

            if (playerobj.level < req) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha na abertura', value: `Você não possui nível o suficiente para abrir uma empresa!\nSeu nível atual: **${playerobj.level}/${req}**\nVeja seu progresso atual utilizando \`/perfil\`` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (playerobj2.money < total) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha na abertura', value: `Você não possui dinheiro o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${utility.format(playerobj2.money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            if (cristais < c1) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha na abertura', value: `Você não possui cristais o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${utility.format(cristais)}/${utility.format(c1)} ${utility.money2} ${utility.money2emoji}**` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (await companyService.check.isWorker(interaction.user.id)) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha na abertura', value: `Você precisa sair da sua empresa atual para abrir outra!` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (await companyService.check.hasCompany(interaction.user.id)) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha na abertura', value: `Você não pode abrir mais de uma empresa!` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            let cont = false;
            try {
                const companies = await prisma.companies.findMany();
                for (const r of companies) {
                    if (r.name.toLowerCase() == name.toLowerCase()) {
                        cont = true;
                        break;
                    }
                }
            }catch (err) { 
                clientService.current.emit('error', err)
                throw err 
            }
            
            if (cont) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha na abertura', value: `Já possui uma empresa com este nome! Pense em outro` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            const code = await companyService.create(interaction.user, {
                type,
                icon,
                name,
                setor
            })
            
            economyService.money.remove(interaction.user.id, total)
            economyService.points.remove(interaction.user.id, c1)
            economyService.addToHistory(interaction.user.id, `Nova empresa | - ${utility.format(total)} ${utility.moneyemoji}${c1 > 0 ? ` | - ${utility.format(c1)} ${utility.money2emoji}`:''}`)
            townname = await townsService.getTownName(interaction.user.id);
            embed
            .addFields({ name: `✅ Sucesso na abertura`, value: `Parabéns, você acaba de abrir a empresa **${companyService.e[companyService.types[type]].icon} ${name}**\nCódigo da empresa: **${code}**` })
            .setColor('#00e061')
            .setFooter({ text: 'Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa' })
            interaction.editReply({ embeds: [embed], components: [] });
            return

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `Você iria abrir a empresa **${companyService.e[companyService.types[type]].icon} ${name}**, porém o tempo expirou.` })
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });
        





	}
};
