const companyService = require('../../_classes/services/company');
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const economyService = require('../../_classes/services/economy');
const clientService = require('../../_classes/services/clientService');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()

const options = (option) => {
    
    option.setName('setor').setDescription('Digite o nome do setor para abrir')
    
    for (let i = 0; i < Object.keys(companyService.e).length; i++) {
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
            await interaction.reply({
                components: [new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\nVocê precisa digitar um setor de empresa existente!\nUtilize \`/setores\` para visualizar os setores disponíveis.\nExemplo de uso: \`/abrirempresa <setor> <nome>\``)],
                flags: Discord.MessageFlags.IsComponentsV2
            })
            return;
        }
        
        if (nome.length > 30) {
            await interaction.reply({
                components: [new TextDisplayBuilder().setContent(`<:error:736274027756388353> A nome de sua empresa não pode conter mais de 30 caracteres!\nExemplo de uso: \`/abrirempresa <setor> <nome>\``)],
                flags: Discord.MessageFlags.IsComponentsV2
            })
            return;
        }
        
        if (await companyService.check.hasCompany(interaction.user.id)) {
            await interaction.reply({
                components: [new TextDisplayBuilder().setContent('<:error:736274027756388353> Você não pode abrir mais de uma empresa!')],
                flags: Discord.MessageFlags.IsComponentsV2
            })
            return;
        }

        if (await companyService.check.isWorker(interaction.user.id)) {
            await interaction.reply({
                components: [new TextDisplayBuilder().setContent('<:error:736274027756388353> Você precisa sair da sua empresa atual para abrir outra!')],
                flags: Discord.MessageFlags.IsComponentsV2
            })
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
        

        const baseFields = [
            [`📃 Informações da Empresa`, `Nome: **${name}**\nSetor: **${icon} ${setor.charAt(0).toUpperCase() + setor.slice(1)}**\nLocalização: **${townname}**`],
            [`🧾 Contratos`, `\`Termos de Compromisso\`\n${utility.format(r1)} ${utility.money} ${utility.moneyemoji}\n\`Compensação de Trabalho\`\n${utility.format(r2)} ${utility.money} ${utility.moneyemoji}\n\`Autorização de Recebimento\`\n${utility.format(r3)} ${utility.money} ${utility.moneyemoji}\n\`Instrumento Particular\`\n${utility.format(r4)} ${utility.money} ${utility.moneyemoji}`],
            [`📑 Requisitos de proposta`, `Nível mínimo: **${req}** ${playerobj.level >= req ? '✅':'❌'}\nMoedas: **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** ${playerobj2.money >= total ? '✅':'❌'}${c1 > 0 ? `\nCristais: **${utility.format(c1)} ${utility.money2} ${utility.money2emoji}** ${cristais >= c1 ? '✅':'❌'}`:''}`]
        ];
        const footer = 'Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa';
        function buildCompanyContainer(color, extraField) {
            const fields = baseFields.concat(extraField ? [extraField] : []);
            return new ContainerBuilder()
                .setAccentColor(color)
                .addTextDisplayComponents(...fields.map(([fieldName, value]) => new TextDisplayBuilder().setContent(`**${fieldName}**\n${value}`)), new TextDisplayBuilder().setContent(`-# ${footer}`));
        }
		
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ components: [buildCompanyContainer(0x00e061), new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.abrirempresa.defer_update'));
            reacted = true;
            collector.stop();
            
            if (b.customId == 'cancel'){
                interaction.editReply({ components: [buildCompanyContainer(0xa60000, ['❌ Abertura cancelada', `Você cancelou a abertura da empresa **${icon} ${name}**.`])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            
            playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
            playerobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
            
            cristais = await economyService.points.get(interaction.user.id)

            if (playerobj.level < req) {
                interaction.editReply({ components: [buildCompanyContainer(0xa60000, ['❌ Falha na abertura', `Você não possui nível o suficiente para abrir uma empresa!\nSeu nível atual: **${playerobj.level}/${req}**\nVeja seu progresso atual utilizando \`/perfil\``])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            if (playerobj2.money < total) {
                interaction.editReply({ components: [buildCompanyContainer(0xa60000, ['❌ Falha na abertura', `Você não possui dinheiro o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${utility.format(playerobj2.money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**`])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }
            if (cristais < c1) {
                interaction.editReply({ components: [buildCompanyContainer(0xa60000, ['❌ Falha na abertura', `Você não possui cristais o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${utility.format(cristais)}/${utility.format(c1)} ${utility.money2} ${utility.money2emoji}**`])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            if (await companyService.check.isWorker(interaction.user.id)) {
                interaction.editReply({ components: [buildCompanyContainer(0xa60000, ['❌ Falha na abertura', 'Você precisa sair da sua empresa atual para abrir outra!'])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            if (await companyService.check.hasCompany(interaction.user.id)) {
                interaction.editReply({ components: [buildCompanyContainer(0xa60000, ['❌ Falha na abertura', 'Você não pode abrir mais de uma empresa!'])], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            let cont = false;
            try {
                const company = await prisma.companies.findFirst({
                    where: { name: { equals: name, mode: 'insensitive' } },
                    select: { company_id: true }
                });
                cont = company != null;
            }catch (err) { 
                clientService.current.emit('error', err)
                throw err 
            }
            
            if (cont) {
                interaction.editReply({ components: [buildCompanyContainer(0xa60000, ['❌ Falha na abertura', 'Já possui uma empresa com este nome! Pense em outro'])], flags: Discord.MessageFlags.IsComponentsV2 });
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
            interaction.editReply({ components: [buildCompanyContainer(0x00e061, [`✅ Sucesso na abertura`, `Parabéns, você acaba de abrir a empresa **${companyService.e[companyService.types[type]].icon} ${name}**\nCódigo da empresa: **${code}**`])], flags: Discord.MessageFlags.IsComponentsV2 });
            return

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            interaction.editReply({ components: [buildCompanyContainer(0xa60000, ['❌ Tempo expirado', `Você iria abrir a empresa **${companyService.e[companyService.types[type]].icon} ${name}**, porém o tempo expirou.`])], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });
        





	}
};
