
async function formatList(API, embed2, page2) {

    embed2.setColor('#4870c7')
    let page = page2
    let array = [];
    try {
        let res = await API.db.pool.query(`SELECT * FROM companies;`);
        array = res.rows.filter((x) => x.company_id != null && x.company_id != '');
    } catch (error) {
        client.emit('error', err)
        throw error
    }

    array.sort(function(a, b) {
        return b.score - a.score;
    })

    embed2.fields = []

    embed2.setTitle(`📃 | Lista de Empresas`)
    
    if (array.length < 1) {
        embed2.setDescription(`❌ Ainda não possui empresas registradas!\nAbra sua empresa agora usando \`${API.prefix}abrirempresa\``)
    } else {
        
        let totalpages = array.length % 6;
        if (totalpages == 0) totalpages = (array.length)/6;
        else totalpages = ((array.length-totalpages)/6)+1;
        
        if (page > totalpages) page = 1;
        
            embed2.setDescription(`**Página atual: ${page}/${totalpages}**\nPara navegar entre as páginas use \`${API.prefix}empresas <página>\`\nUtilize \`${API.prefix}verempresa <código>\` para visualizar as informações de uma empresa`)
            
            array = array.slice((page*6)-6, page*6);
            
            for (const r of array) {
                let owner = await API.client.users.fetch(r.user_id);
                let vagas = await API.company.check.hasVacancies(r.company_id);
                let func = (r.workers == null ? `0/${await API.company.get.maxWorkers(r.company_id)}`: `${r.workers.length}/${await API.company.get.maxWorkers(r.company_id)}`)
                let locname = API.townExtension.getTownNameByNum(r.loc)
                let curriculum = r.curriculum == null ? 0 : r.curriculum.length;
                embed2.addField(`${API.company.e[API.company.types[r.type]].icon} ${r.name} [⭐ ${r.score.toFixed(2)}]`, `Setor: ${API.company.e[API.company.types[r.type]].icon} **${API.company.types[r.type].charAt(0).toUpperCase() + API.company.types[r.type].slice(1)}**\nFundador: \`${owner.tag}\` (\`${owner.id}\`)\nCódigo: **${r.company_id}**\nLocalização: **${locname}**\nTaxa de venda: ${r.taxa}%\nFuncionários: ${func}\nCurrículos pendentes: ${curriculum}/10\nVagas abertas: ${vagas == true ? `🟢 \`${API.prefix}enviarcurriculo ${r.company_id}\``: `🔴`}`);
            }

        return { totalpages, currentpage: page2 }
        
    }

}

module.exports = {
    name: 'empresas',
    aliases: ['companies'],
    category: 'Empresas',
    description: 'Visualiza as empresas existentes',
    options: [{
        name: 'página',
        type: 'INTEGER',
        description: 'Digite o número da página para pesquisar empresas',
        required: false
    }],
    mastery: 30,
	async execute(API, msg) {

        let args = API.args(msg);
		const Discord = API.Discord;

        const embed = new Discord.MessageEmbed()

        let components

        function reworkButtons({ currentpage, totalpages }) {

            const butnList = []
            components = []
      
            butnList.push(API.createButton('backward', 'PRIMARY', '', '852241487064596540', (currentpage == 1 ? true : false)))
            butnList.push(API.createButton('forward', 'PRIMARY', '', '737370913204600853', (currentpage == totalpages ? true : false)))

            components.push(API.rowComponents(butnList))
      
            return components
      
        }
        let returned
        if (args.length == 1 && API.isInt(args[0]) && parseInt(args[0]) > 0) {
            returned = await formatList(API, embed, parseInt(args[0]));
        } else {
            returned = await formatList(API, embed, 1);
        }

        let currentpage = returned.currentpage
        let totalpages = returned.totalpages

        reworkButtons({ currentpage, totalpages })

        const embedmsg = await msg.quote({ embeds: [embed], components });

        if (returned.currentpage == returned.totalpages || returned.totalpages == 0) return

        const filter = i => i.user.id === msg.author.id;
        
        let collector = embedmsg.createMessageComponentCollector({ filter, time: 30000 });
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === msg.author.id)) return
            
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);

            if (b.customId == 'forward'){
                if (currentpage < totalpages) currentpage += 1;
            } else if (b.customId == 'backward') {
                if (currentpage > 1) currentpage -= 1;
            } 

            reworkButtons({ currentpage, totalpages })
            
            returned = await formatList(API, embed, currentpage);
           
            embedmsg.edit({ embeds: [embed], components });

            collector.resetTimer();
        });
        
        collector.on('end', collected => {
            embedmsg.edit({ embeds: [embed], components: [] });
        });
        
	}
};