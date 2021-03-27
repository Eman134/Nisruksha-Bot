
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

    embed2.setTitle(`📃 | Lista de Empresas`)
    
    if (array.length < 1) {
        embed2.setDescription(`❌ Ainda não possui empresas registradas!\nAbra sua empresa agora usando \`${API.prefix}abrirempresa\``)
    } else {
        
        let totalpages = 1+((array.length-(array.length % 6))/6);

        if (page > totalpages) page = 1;
        
            embed2.setDescription(`**Página atual: ${page}/${totalpages}**\nPara navegar entre as páginas use \`${API.prefix}empresas <página>\`\nUtilize \`${API.prefix}verempresa <código>\` para visualizar as informações de uma empresa`)
            
            array.slice((page*6)-6, page*6);
            
            for (const r of array) {
                let owner = await API.client.users.fetch(r.user_id);
                let vagas = await API.company.check.hasVacancies(r.company_id);
                let func = (r.workers == null ? `0/${await API.company.get.maxWorkers(r.company_id)}`: `${r.workers.length}/${await API.company.get.maxWorkers(r.company_id)}`)
                let locname = API.townExtension.getTownNameByNum(r.loc)
                let curriculum = r.curriculum == null ? 0 : r.curriculum.length;
                embed2.addField(`${API.company.e[API.company.types[r.type]].icon} ${r.name} [⭐ ${r.score.toFixed(2)}]`, `Setor: ${API.company.e[API.company.types[r.type]].icon} **${API.company.types[r.type].charAt(0).toUpperCase() + API.company.types[r.type].slice(1)}**\nFundador: ${owner} (\`${owner.id}\`)\nCódigo: **${r.company_id}**\nLocalização: **${locname}**\nTaxa de venda: ${r.taxa}%\nFuncionários: ${func}\nCurrículos pendentes: ${curriculum}/10\nVagas abertas: ${vagas == true ? `🟢 \`${API.prefix}enviarcurriculo ${r.company_id}\``: `🔴`}`);
            }
        
    }

}

module.exports = {
    name: 'empresas',
    aliases: ['companies'],
    category: 'Empresas',
    description: 'Visualiza as empresas existentes',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        let args = API.args(msg);
		const Discord = API.Discord;

        const embed = new Discord.MessageEmbed()
        
        if (args.length == 1 && API.isInt(args[0]) && parseInt(args[0]) > 0) {
            await formatList(API, embed, parseInt(args[0]));
        } else {
            await formatList(API, embed, 1);
        }
        
        await msg.quote(embed);
        
	}
};