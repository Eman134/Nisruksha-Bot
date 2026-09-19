
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('empresa').setDescription('Digite o código da empresa para ver as informações dela').setRequired(false))

module.exports = {
    requiredServices: ["client","company","img","playerUtils","sendError"],
	name: 'verempresa',
	aliases: ['empresa', 'seecompany', 'veremp', 'seecomp'],
    category: 'Empresas',
    description: 'Visualiza as informações da empresa onde você presta serviço ou de alguma existente',
	data,
    mastery: 60,
	async execute(interaction, svcClient, svcCompany, svcImg, svcPlayerUtils, svcSendError) {
		
		let member = interaction.user

		const códigoempresa = interaction.options.getString('empresa')

		const playerobj = await DatabaseManager.get(interaction.user.id, 'players')

		let company

		if (códigoempresa == null) {

			const hasCompany = await svcCompany.check.hasCompany(member.id)
			const isWorker = await svcCompany.check.isWorker(member.id)

			if (!hasCompany && !isWorker) {
				const embedtemp = await svcSendError(interaction, `Você deve especificar o código da empresa para visualizar!\nPesquise empresas utilizando \`/empresas\``)
            	await interaction.reply({ embeds: [embedtemp]})
				return;
			}

			if (hasCompany) {
				company = await svcCompany.get.companyByOwnerId(member.id)
			} 
			if (isWorker) {
				company = await svcCompany.get.companyById(playerobj.company);
			}

		} else {
			company = await svcCompany.get.companyById(códigoempresa)
		}

		const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "seecompany");
        if (check) {
            svcPlayerUtils.cooldown.message(interaction, 'seecompany', 'visualizar uma empresa')
            return;
        }

        svcPlayerUtils.cooldown.set(interaction.user.id, "seecompany", 0);
		
		if (!company){
			const embedtemp = await svcSendError('Houve um erro ao tentar carregar informações da empresa desse membro!')
            await interaction.reply({ embeds: [embedtemp]})
			return
		}

		await interaction.reply({ content: `<a:loading:736625632808796250> Carregando informações da empresa` })

		let rend = '0,0'
		let rends = []
		if (company.rend) {
			rend = ''
			for (const x of company.rend) {
				rends.push(x.toString())
			}
			rends = rends.slice(0, 10).reverse()
			rend = rends.join(',')
			if (rends.length == 1) rend = '0,' + rend
		}
		const owner = await svcClient.users.fetch(company.user_id)
		const username = owner.username
		const bglink = company.bglink
		const logo = company.logo
		const hasVacancies = await svcCompany.check.hasVacanciesByCompany(company);
		const type = company.type
		const name = company.name
		const score = company.score
		const descr = company.descr
		const workers = company.workers
		const loc = company.loc
		const taxa = company.taxa
		const company_id = company.company_id

		const companyimage = await svcImg.imagegens.get('seecompany.js')(dependencies, {
			username,
			rend,
			rends,
			bglink,
			logo,
			hasVacancies,
			type,
			name,
			score,
			descr,
			workers,
			loc,
			taxa,
			company_id,
        })

        await interaction.editReply({ content: null, files: [companyimage] } );

	}
};