const clientService = require('../../_classes/services/clientService');
const companyService = require('../../_classes/services/company');
const townsService = require('../../_classes/services/towns');
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();

const { reportError } = require('../../_classes/debug');

async function formatList(embed2, page2) {

    embed2.setColor('#4870c7')
    let page = page2
    let array = [];
    try {
        array = (await prisma.companies.findMany()).filter((x) => x.company_id != null && x.company_id != '');
    } catch (error) {
        clientService.current.emit('error', err)
        throw error
    }

    array.sort(function(a, b) {
        return b.score - a.score;
    })

    embed2.fields = []

    embed2.setTitle(`📃 | Lista de Empresas`)
    
    if (array.length < 1) {
        embed2.setDescription(`❌ Ainda não possui empresas registradas!\nAbra sua empresa agora usando \`/abrirempresa\``)
    } else {
        
        let totalpages = array.length % 6;
        if (totalpages == 0) totalpages = (array.length)/6;
        else totalpages = ((array.length-totalpages)/6)+1;
        
        if (page > totalpages) page = 1;
        
            embed2.setDescription(`**Página atual: ${page}/${totalpages}**\nPara navegar entre as páginas use \`/empresas <página>\`\nUtilize \`/verempresa <código>\` para visualizar as informações de uma empresa`)
            
            array = array.slice((page*6)-6, page*6);
            
            for (const r of array) {
                let owner = await clientService.current.users.fetch(String(r.user_id));
                let vagas = await companyService.check.hasVacancies(r.company_id);
                let func = (r.workers == null ? `0/${await companyService.get.maxWorkers(r.company_id)}`: `${r.workers.length}/${await companyService.get.maxWorkers(r.company_id)}`)
                let locname = townsService.getTownNameByNum(r.loc)
                let curriculum = r.curriculum == null ? 0 : r.curriculum.length;
                embed2.addFields({ name: `${companyService.e[companyService.types[r.type]].icon} ${r.name} [⭐ ${r.score.toFixed(2)}]`, value: `Setor: ${companyService.e[companyService.types[r.type]].icon} **${companyService.types[r.type].charAt(0).toUpperCase() + companyService.types[r.type].slice(1)}**\nFundador: ${owner} (\`${owner.id}\`)\nCódigo: **${r.company_id}**\nLocalização: **${locname}**\nTaxa de venda: ${r.taxa}%\nFuncionários: ${func}\nCurrículos pendentes: ${curriculum}/10\nVagas abertas: ${vagas == true ? `🟢 \`/enviarcurriculo ${r.company_id}\``: `🔴`}` });
            }

        return { totalpages, currentpage: page2 }
        
    }

}

const { SlashCommandBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('página').setDescription('Digite o número da página para pesquisar empresas').setRequired(false))

module.exports = {
    name: 'empresas',
    aliases: ['companies'],
    category: 'Empresas',
    description: 'Visualiza as empresas existentes',
    data,
    mastery: 30,
	async execute(interaction) {

        const página = interaction.options.getString('página')
		
        const embed = new Discord.EmbedBuilder()

        let components

        function reworkButtons({ currentpage, totalpages }) {

            const butnList = []
            components = []
      
            butnList.push(utility.createButton('backward', 'PRIMARY', '', '852241487064596540', (currentpage == 1 ? true : false)))
            butnList.push(utility.createButton('forward', 'PRIMARY', '', '737370913204600853', (currentpage == totalpages ? true : false)))

            components.push(utility.rowComponents(butnList))
      
            return components
      
        }
        let returned
        if (página != null && página > 0) {
            returned = await formatList(embed, página);
        } else {
            returned = await formatList(embed, 1);
        }

        let currentpage = returned.currentpage
        let totalpages = returned.totalpages

        reworkButtons({ currentpage, totalpages })

        const embedinteraction = (await interaction.reply({ embeds: [embed], components, withResponse: true })).resource.message;

        if (returned.currentpage == returned.totalpages || returned.totalpages == 0) return

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return
            
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.empresas.defer_update'); });

            if (b.customId == 'forward'){
                if (currentpage < totalpages) currentpage += 1;
            } else if (b.customId == 'backward') {
                if (currentpage > 1) currentpage -= 1;
            } 

            reworkButtons({ currentpage, totalpages })
            
            returned = await formatList(embed, currentpage);
           
            interaction.editReply({ embeds: [embed], components });

            collector.resetTimer();
        });
        
        collector.on('end', collected => {
            interaction.editReply({ embeds: [embed], components: [] });
        });
        
	}
};
