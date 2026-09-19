const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const playersService = require('../../_classes/services/players');
const clientService = require('../../_classes/services/clientService');
const imagesService = require('../../_classes/services/images');

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('empresa').setDescription('Digite o código da empresa para ver as informações dela').setRequired(false))

module.exports = {
	name: 'verempresa',
	aliases: ['empresa', 'seecompany', 'veremp', 'seecomp'],
    category: 'Empresas',
    description: 'Visualiza as informações da empresa onde você presta serviço ou de alguma existente',
	data,
    mastery: 60,
	async execute(interaction) {
		
		let member = interaction.user

		const códigoempresa = interaction.options.getString('empresa')

		const playerobj = await DatabaseManager.get(interaction.user.id, 'players')

		let company

		if (códigoempresa == null) {

			const hasCompany = await companyService.check.hasCompany(member.id)
			const isWorker = await companyService.check.isWorker(member.id)

			if (!hasCompany && !isWorker) {
				const embedtemp = await utility.sendError(interaction, `Você deve especificar o código da empresa para visualizar!\nPesquise empresas utilizando \`/empresas\``)
            	await interaction.reply({ embeds: [embedtemp]})
				return;
			}

			if (hasCompany) {
				company = await companyService.get.companyByOwnerId(member.id)
			} 
			if (isWorker) {
				company = await companyService.get.companyById(playerobj.company);
			}

		} else {
			company = await companyService.get.companyById(códigoempresa)
		}

		const check = await playersService.cooldown.check(interaction.user.id, "seecompany");
        if (check) {
            playersService.cooldown.message(interaction, 'seecompany', 'visualizar uma empresa')
            return;
        }

        playersService.cooldown.set(interaction.user.id, "seecompany", 0);
		
		if (!company){
			const embedtemp = await utility.sendError('Houve um erro ao tentar carregar informações da empresa desse membro!')
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
		const owner = await clientService.current.users.fetch(company.user_id)
		const username = owner.username
		const bglink = company.bglink
		const logo = company.logo
		const hasVacancies = await companyService.check.hasVacanciesByCompany(company);
		const type = company.type
		const name = company.name
		const score = company.score
		const descr = company.descr
		const workers = company.workers
		const loc = company.loc
		const taxa = company.taxa
		const company_id = company.company_id

		const companyimage = await imagesService.imagegens.get('seecompany.js')({
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