const ImageCharts = require('image-charts');

const API = require("../../_classes/api");

let bg

loadbg()

async function loadbg() {
    bg = await API.img.loadImage(`resources/backgrounds/company/background.png`)
}


module.exports = {
	name: 'verempresa',
	aliases: ['empresa', 'seecompany', 'veremp', 'seecomp'],
    category: 'Empresas',
    description: 'Visualiza as informações da empresa onde você presta serviço ou de alguma existente',
	options: [{
        name: 'empresa',
        type: 'STRING',
        description: 'Digite o código da empresa para ver as informações dela',
        required: false
    }],
    mastery: 60,
	async execute(API, msg) {
		
		let member;
		let args = API.args(msg);

		if (args.length == 0) {
			member = msg.author;
			
			if ( (!(await API.company.check.hasCompany(msg.author))) && (!(await API.company.check.isWorker(msg.author) ))) {
				const embedtemp = await API.sendError(msg, `Você não possui uma empresa e nem trabalha em uma para visualizar informações dela!\nPesquise empresas utilizando \`${API.prefix}empresas\`\nOu utilize \`${API.prefix}verempresa @donodeumaempresa\``)
            	await msg.quote({ embeds: [embedtemp]})
				return;
			}
			if (await API.company.check.isWorker(msg.author)) {

				let pobj = await API.getInfo(msg.author, 'players')
				member = await API.company.get.ownerById(pobj.company);

			}

		} else {

			if (msg.mentions.users.size == 1) {

				const res = await API.db.pool.query(`SELECT * FROM companies WHERE user_id=$1`, [msg.mentions.users.first().id]);

				if (res.rows[0]) {
					const owner = await API.company.get.ownerById(res.rows[0].company_id)
					member = owner;
				} else if(await API.company.check.isWorker(msg.mentions.users.first())){
					let usfunc = await API.getInfo(msg.mentions.users.first(), 'players')
					const owner = await API.company.get.ownerById(usfunc.company)
					member = owner;
				}

				if (!member) {
					const embedtemp = await API.sendError(msg, `O membro ${msg.mentions.users.first()} não é funcionário e nem dono de uma empresa!\nPesquise empresas utilizando \`${API.prefix}empresas\`\nOu utilize \`${API.prefix}verempresa @donodeumaempresa\``)
            		await msg.quote({ embeds: [embedtemp]})
					return;
				}

			} else {
				try {
					const res = await API.db.pool.query(`SELECT * FROM companies WHERE company_id=$1`, [args[0]]);

					if (res.rows[0] == undefined || res.rows[0] == null) {
						const embedtemp = await API.sendError(msg, `O id de empresa ${args[0]} é inexistente!\nPesquise empresas utilizando \`${API.prefix}empresas\`\nOu utilize \`${API.prefix}verempresa @donodeumaempresa\``)
            			await msg.quote({ embeds: [embedtemp]})
						return;
					} else {
						member = await API.client.users.fetch(res.rows[0].user_id)
					}
	
				}catch(err) {
					client.emit('error', err)
					throw err
				}
				
			}

		}

		const check = await API.playerUtils.cooldown.check(msg.author, "seecompany");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'seecompany', 'visualizar uma empresa')
            return;
        }

        API.playerUtils.cooldown.set(msg.author, "seecompany", 0);

		let res2 = await API.company.get.company(member)
		
		if (!res2){
			const embedtemp = await API.sendError('Houve um erro ao tentar carregarr informações da empresa desse membro!')
            await msg.quote({ embeds: [embedtemp]})
			return
		}
		let todel = await msg.quote({ content: `<a:loading:736625632808796250> Carregando informações da empresa` })

		let rend = '0,0'
		let rends = []
		if (res2.rend) {
			rend = ''
			for (const x of res2.rend) {
				rends.push(x.toString())
			}
			rends = rends.slice(0, 10).reverse()
			rend = rends.join(',')
			if (rends.length == 1) rend = '0,' + rend
		}

		let background = bg
        if (res2.bglink != null) {
            try{
                background2 = await API.img.loadImage(res2.bglink)
                res = await API.img.resize(background2, 700, 450)
                background = await API.img.drawImage(res, background, 0, 0)
            }catch(err){
				client.emit('error', err)
				API.setCompanieInfo(member, res2.company_id, 'bglink', null);
				const embedtemp = await API.sendError(msg, `Houve um erro ao carregar o background personalizado dessa empresa!`)
				await msg.quote({ embeds: [embedtemp], mention: true } )
			}
		}
		
		let logo
		if (res2.logo == null) {
			logo = await API.img.createImage(150, 150, '#915cf2')
			logo = await API.img.drawText(logo, `${API.prefix}empresaedit logo`, 12, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 75, 75, 4)
		} else {
			try{
				logo = await API.img.loadImage(res2.logo)
			}catch (err){
				client.emit('error', err)
				API.setCompanieInfo(member, res2.company_id, 'logo', null);
				const embedtemp = await API.sendError(msg, `Houve um erro ao carregar a logo personalizada dessa empresa!`)
				await msg.quote({ embeds: [embedtemp], mention: true } )

			}
		}

		logo = await API.img.resize(logo, 150, 150)
		//logo = await API.img.editBorder(logo, 5, false)
		background = await API.img.drawImage(background, logo, 38, 50)


		let companyicon = await API.img.loadImage(`resources/backgrounds/company/icon-${res2.type}.png`)
		companyicon = await API.img.resize(companyicon, 25, 25);
		
		background = await API.img.drawImage(background, companyicon, 218, 57)
		background = await API.img.drawText(background, `${res2.name}`, 20, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 254, 70,3)
		
        background = await API.img.drawText(background, `Fundador:`, 16, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 213, 185,3)
		background = await API.img.drawText(background, `@${member.username}`, 16, './resources/fonts/MartelSans-Regular.ttf', '#03e8fc', 295, 185,3)
		
        background = await API.img.drawText(background, `${res2.score.toFixed(2)}`, 20, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 620, 70,5)
        background = await API.img.drawText(background, `${res2.descr == null ? `Nenhuma descrição da empresa foi definida! ${API.prefix}empresaedit desc`: res2.descr}`, 15, './resources/fonts/Uni-Sans-Light.ttf', '#FFFFFF', 211, 105,3)
		
		// Fazer a url manualmente
		
		const chart_url = await ImageCharts()
	
		.chco('FFFFFF')
		//.chdl('Rendimentos')
		.chdls('FFFFFF,10')
		.chf('bg,s,2e2d2f')
		.chls('3,50,2')
		.chm('B,2e2d2f,0,0,0')
		.chma('10,20,5,10')
		.chs('465x190')
		.cht('lc')
		.chts('FFFFFF,20')
		.chtt('Rendimentos da empresa')
		.chxl(`0:|${rends.length} Último(s) rendimentos`)
		.chxs('0,FFFFFF,13|1,FFFFFF')
		.chxt('x,y')
		.chd(`a:${rend}`)
		
		.toURL();
		
		let chart = await API.img.loadImage(chart_url)
		chart = await API.img.resize(chart, 465, 190);
		background = await API.img.drawImage(background, chart, 198, 210)
		
		hide = await API.img.createImage(79, 13, '#2e2d2f')
		background = await API.img.drawImage(background, hide, 584, 210)

		// Infos

		background = await API.img.drawText(background, `Código: ${res2.company_id}`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 239,3)

		background = await API.img.drawText(background, `Taxa: ${res2.taxa}%`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 272,3)

		background = await API.img.drawText(background, `Loc: ${API.townExtension.getTownNameByNum(res2.loc)}`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 305,3)

		background = await API.img.drawText(background, `Funcionários: ${res2.workers ? res2.workers.length : 0}`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 338,3)
		
		let vagas = await API.company.check.hasVacancies(res2.company_id);

		let onoff = await API.img.loadImage(vagas ? 'https://cdn.discordapp.com/attachments/736274289254334504/768995522286714910/556678187786960897.png' : 'https://cdn.discordapp.com/attachments/736274289254334504/768995546127138856/556678417018257408.png')
		
		onoff = await API.img.resize(onoff, 20, 20)

		background = await API.img.drawImage(background, onoff, 95, 361)

		background = await API.img.drawText(background, `Vagas`, 15, './resources/fonts/MartelSans-Regular.ttf', '#FFFFFF', 50, 371,3)

		try {
			background = await API.img.resize(background, 950, 650)
			await API.img.sendImage(msg.channel, background, msg.id);
			todel.delete();
		}catch (err){
			console.log(err)
			client.emit('error', err)
		}

	}
};