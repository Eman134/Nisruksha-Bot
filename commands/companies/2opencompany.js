const API = require('../../_classes/api');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()

const options = (option) => {
    
    option.setName('setor').setDescription('Digite o nome do setor para abrir')
    
    for (i = 0; i < Object.keys(API.company.e).length; i++) {
        const sector = API.company.e[Object.keys(API.company.e)[i]]
        const name = Object.keys(API.company.e)[i]
        if (sector.description) option.addChoice(name.toUpperCase(), name)
    }
    
    return option.setRequired(true)
}

data.addStringOption(options)
.addStringOption(option => option.setName('nome').setDescription('Digite o nome da empresa').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'abrirempresa',
    aliases: ['criarempresa', 'opencompany', 'abrire'],
    category: 'Empresas',
    description: 'Abra uma empresa de algum setor em seu nome e customize-a',
    data,
    mastery: 60,
	async execute(API, interaction) {

        const Discord = API.Discord;

        const setor = interaction.options.getString('setor');
        const nome = interaction.options.getString('nome');

        let e = API.company.e;
        
        if (!(Object.keys(e).includes(setor))) {
            const embedtemp = await API.sendError(interaction, `Você precisa digitar um setor de empresa existente!\nUtilize \`/setores\` para visualizar os setores disponíveis.`, 'abrirempresa <setor> <nome>')
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (nome.length > 30) {
            const embedtemp = await API.sendError(interaction, `A nome de sua empresa não pode conter mais de 30 caracteres!`, 'abrirempresa <setor> <nome>')
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (await API.company.check.hasCompany(interaction.user.id)) {
            const embedtemp = await API.sendError(interaction, `Você não pode abrir mais de uma empresa!`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await API.company.check.isWorker(interaction.user.id)) {
            const embedtemp = await API.sendError(interaction, `Você precisa sair da sua empresa atual para abrir outra!`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let total = 0;

        // Code Review - CodeSmell: Nomes de variáveis genéricos e crípticos (r1, r2, r3, r4, c1). Dificultam a legibilidade. Recomenda-se utilizar nomes descritivos (ex: contractCommitment, contractCompensation, crystalCost).
        let r1 = 75000;
        let r2 = 50000;
        let r3 = 50000;
        let r4 = 25000;
        let c1 = 125;

        total = r1+r2+r3+r4
        
        // Code Review - CodeSmell: Nomes de variáveis sequenciais genéricos (playerobj, playerobj2). O primeiro armazena as máquinas e o segundo o jogador. Recomenda-se usar nomes como playerMachines e playerData.
        let playerobj = await DatabaseManager.get(interaction.user.id, 'machines')
        let playerobj2 = await DatabaseManager.get(interaction.user.id, 'players')
        const req = 10;
        const name = nome;
        const type = e[setor].tipo;
        const icon = e[setor].icon;
        let townname = await API.townExtension.getTownName(interaction.user.id);
        let cristais = await API.eco.points.get(interaction.user.id)
        
        const embed = new Discord.MessageEmbed()
        .addField(`📃 Informações da Empresa`, `Nome: **${name}**\nSetor: **${icon} ${setor.charAt(0).toUpperCase() + setor.slice(1)}**\nLocalização: **${townname}**`)
        .addField(`🧾 Contratos`, `\`Termos de Compromisso\`\n${API.format(r1)} ${API.money} ${API.moneyemoji}\n\`Compensação de Trabalho\`\n${API.format(r2)} ${API.money} ${API.moneyemoji}\n\`Autorização de Recebimento\`\n${API.format(r3)} ${API.money} ${API.moneyemoji}\n\`Instrumento Particular\`\n${API.format(r4)} ${API.money} ${API.moneyemoji}`)
        .addField(`📑 Requisitos de proposta`, `Nível mínimo: **${req}** ${playerobj.level >= req ? '✅':'❌'}\nMoedas: **${API.format(total)} ${API.money} ${API.moneyemoji}** ${playerobj2.money >= total ? '✅':'❌'}${c1 > 0 ? `\nCristais: **${API.format(c1)} ${API.money2} ${API.money2emoji}** ${cristais >= c1 ? '✅':'❌'}`:''}`)
        .setColor('#00e061')
        .setFooter('Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa')
		
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 60000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!b.deferred) b.deferUpdate().then().catch();
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
            
            cristais = await API.eco.points.get(interaction.user.id)

            if (playerobj.level < req) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui nível o suficiente para abrir uma empresa!\nSeu nível atual: **${playerobj.level}/${req}**\nVeja seu progresso atual utilizando \`/perfil\``)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (playerobj2.money < total) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui dinheiro o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${API.format(playerobj2.money)}/${API.format(total)} ${API.money} ${API.moneyemoji}**`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            if (cristais < c1) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não possui cristais o suficiente para abrir uma empresa!\nSeu dinheiro atual: **${API.format(cristais)}/${API.format(c1)} ${API.money2} ${API.money2emoji}**`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (await API.company.check.isWorker(interaction.user.id)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você precisa sair da sua empresa atual para abrir outra!`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (await API.company.check.hasCompany(interaction.user.id)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Você não pode abrir mais de uma empresa!`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            // Code Review - CodeSmell: Variável com nome genérico 'cont' (abreviação de 'continua' ou 'contém'). Deveria ser descritiva como 'companyNameExists'.
            let cont = false;
            try {
                // Code Review - Falha de Arquitetura e Performance: Falta de encapsulamento em camadas e péssima performance de query. O comando executa SQL diretamente (acesso direto a dados) e carrega TODAS as empresas do banco de dados na memória do Node para verificar duplicidade em JS. Conforme o bot crescer, isso causará lentidão extrema e estouro de memória. O correto é usar uma camada de repositório e delegar o filtro para o banco (ex: SELECT 1 FROM companies WHERE LOWER(name) = $1 LIMIT 1).
                let res = await DatabaseManager.query(`SELECT * FROM companies;`);
                for (const r of res.rows) {
                    if (r.name.toLowerCase() == name.toLowerCase()) {
                        cont = true;
                        break;
                    }
                }
            }catch (err) { 
                API.client.emit('error', err)
                throw err 
            }
            
            if (cont) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na abertura', `Já possui uma empresa com este nome! Pense em outro`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            const code = await API.company.create(interaction.user, {
                type,
                icon,
                name,
                setor
            })
            
            API.eco.money.remove(interaction.user.id, total)
            API.eco.points.remove(interaction.user.id, c1)
            API.eco.addToHistory(interaction.user.id, `Nova empresa | - ${API.format(total)} ${API.moneyemoji}${c1 > 0 ? ` | - ${API.format(c1)} ${API.money2emoji}`:''}`)
            townname = await API.townExtension.getTownName(interaction.user.id);
            embed
            .addField(`✅ Sucesso na abertura`, `Parabéns, você acaba de abrir a empresa **${API.company.e[API.company.types[type]].icon} ${name}**\nCódigo da empresa: **${code}**`)
            .setColor('#00e061')
            .setFooter('Ao abrir a empresa você está em consentimento em receber DM\'S do bot de quando membros realizarem alguma ação na empresa')
            interaction.editReply({ embeds: [embed], components: [] });
            return

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria abrir a empresa **${API.company.e[API.company.types[type]].icon} ${name}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });
        





	}
};