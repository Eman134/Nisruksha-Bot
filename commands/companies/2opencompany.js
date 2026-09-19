const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()

const options = (option) => {
    
    option.setName('setor').setDescription('Digite o nome do setor para abrir')
    
    for (const name of ['agricultura', 'exploração', 'pescaria', 'processamento']) {
        option.addChoice(name.toUpperCase(), name)
    }
    
    return option.setRequired(true)
}

data.addStringOption(options)
.addStringOption(option => option.setName('nome').setDescription('Digite o nome da empresa').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","client","company","createButton","eco","format","money","money2","money2emoji","moneyemoji","rowComponents","sendError","townExtension"],
    name: 'abrirempresa',
    aliases: ['criarempresa', 'opencompany', 'abrire'],
    category: 'Empresas',
    description: 'Abra uma empresa de algum setor em seu nome e customize-a',
    data,
    mastery: 60,
	async execute(interaction, svcDiscord, svcClient, svcCompany, svcCreateButton, svcEco, svcFormat, svcMoney, svcMoney2, svcMoney2emoji, svcMoneyemoji, svcRowComponents, svcSendError, svcTownExtension) {
        const setor = interaction.options.getString('setor');
        const nome = interaction.options.getString('nome');

        let e = svcCompany.e;
        
        if (!(Object.keys(e).includes(setor))) {
            const embedtemp = await svcSendError(interaction, `Você precisa digitar um setor de empresa existente!\nUtilize \`/setores\` para visualizar os setores disponíveis.`, 'abrirempresa <setor> <nome>')
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (nome.length > 30) {
            const embedtemp = await svcSendError(interaction, `A nome de sua empresa não pode conter mais de 30 caracteres!`, 'abrirempresa <setor> <nome>')
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (await svcCompany.check.hasCompany(interaction.user.id)) {
            const embedtemp = await svcSendError(interaction, `Você não pode abrir mais de uma empresa!`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await svcCompany.check.isWorker(interaction.user.id)) {
            const embedtemp = await svcSendError(interaction, `Você precisa sair da sua empresa atual para abrir outra!`)
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
        
        let playerobj = await DatabaseManager.get(interaction.user.id, 'machines')
        let playerobj2 = await DatabaseManager.get(interaction.user.id, 'players')
        const req = 10;
        const name = nome;
        const type = e[setor].tipo;
        const icon = e[setor].icon;
        let townname = await svcTownExtension.getTownName(interaction.user.id);
        let cristais = await svcEco.points.get(interaction.user.id)
        
        const embed = new svcDiscord.MessageEmbed()
        .addField(`📃 Informações da Empresa`, `Nome: **${name}**\nSetor: **${icon} ${setor.charAt(0).toUpperCase() + setor.slice(1)}**\nLocalização: **${townname}**`)
        .addField(`🧾 Contratos`, `\`Termos de Compromisso\`\n${svcFormat(r1)} ${svcMoney} ${svcMoneyemoji}\n\`Compensação de Trabalho\`\n${svcFormat(r2)} ${svcMoney} ${svcMoneyemoji}\n\`Autorização de Recebimento\`\n${svcFormat(r3)} ${svcMoney} ${svcMoneyemoji}\n\`Instrumento Particular\`\n${svcFormat(r4)} ${svcMoney} ${svcMoneyemoji}`)
        .addField(`📑 Requisitos de proposta`, `Nível mínimo: **${req}** ${playerobj.level >= req ? '✅':'❌'}\nMoedas: **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** ${playerobj2.svcMoney >= total ? '✅':'❌'}${c1 > 0 ? `\nCristais: **${svcFormat(c1)} ${svcMoney2} ${svcMoney2emoji}** ${cristais >= c1 ? '✅':'❌'}`:''}`)
        .setColor('#00e061')
        .setFooter('Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa')
		
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.abrirempresa.defer_update'));
            reacted = true;
            collector.stop();
            
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Abertura cancelada', `
                Você cancelou a abertura da empresa **${icon} ${name}**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            playerobj = await DatabaseManager.get(interaction.user.id, 'machines')
            playerobj2 = await DatabaseManager.get(interaction.user.id, 'players')
            
            cristais = await svcEco.points.get(interaction.user.id)

            if (playerobj.level < req) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui nível o suficiente para abrir uma empresa!\nSeu nível atual: **${playerobj.level}/${req}**\nVeja seu progresso atual utilizando \`/perfil\``)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (playerobj2.svcMoney < total) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui dinheiro o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${svcFormat(playerobj2.svcMoney)}/${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}**`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            if (cristais < c1) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui cristais o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${svcFormat(cristais)}/${svcFormat(c1)} ${svcMoney2} ${svcMoney2emoji}**`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (await svcCompany.check.isWorker(interaction.user.id)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você precisa sair da sua empresa atual para abrir outra!`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (await svcCompany.check.hasCompany(interaction.user.id)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não pode abrir mais de uma empresa!`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            let cont = false;
            try {
                const companies = await DatabaseManager.findMany('companies');
                for (const r of companies) {
                    if (r.name.toLowerCase() == name.toLowerCase()) {
                        cont = true;
                        break;
                    }
                }
            }catch (err) { 
                svcClient.emit('error', err)
                throw err 
            }
            
            if (cont) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Já possui uma empresa com este nome! Pense em outro`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            const code = await svcCompany.create(interaction.user, {
                type,
                icon,
                name,
                setor
            })
            
            svcEco.svcMoney.remove(interaction.user.id, total)
            svcEco.points.remove(interaction.user.id, c1)
            svcEco.addToHistory(interaction.user.id, `Nova empresa | - ${svcFormat(total)} ${svcMoneyemoji}${c1 > 0 ? ` | - ${svcFormat(c1)} ${svcMoney2emoji}`:''}`)
            townname = await svcTownExtension.getTownName(interaction.user.id);
            embed
            .addField(`✅ Sucesso na abertura`, `Parabéns, você acaba de abrir a empresa **${svcCompany.e[svcCompany.types[type]].icon} ${name}**\nCódigo da empresa: **${code}**`)
            .setColor('#00e061')
            .setFooter('Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa')
            interaction.editReply({ embeds: [embed], components: [] });
            return

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria abrir a empresa **${svcCompany.e[svcCompany.types[type]].icon} ${name}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });
        





	}
};
