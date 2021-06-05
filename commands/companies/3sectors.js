module.exports = {
    name: 'setores',
    aliases: ['sectors'],
    category: 'Empresas',
    description: 'Visualiza os setores de empresas disponíveis',
    options: [],
    mastery: 30,
	async execute(API, msg) {

		const Discord = API.Discord;

        const embed = new Discord.MessageEmbed()
        .setTitle('👨🏽‍🌾 | Setores de Empresas')
        .addField('**<:icon1:745663998854430731> Agricultura**', `Um setor de empresa onde você tem a liberdade de adquirir lotes de terras pelas vilas e fazer suas plantações, assim gerando recursos e vendendo-os.`)
        .addField('**<:icon2:745663998938316951> Exploração**', `O setor de empresa perfeito para você que gosta de muita ação, você irá caçar pelas vilas monstros e abatendo-os, conseguindo recursos muito valiosos, só tome cuidado com as masmorras!`)
        .addField('**<:icon6:830966666082910228> Pescaria**', `Nesse setor você compra iscas, melhore a sua vara de pesca e fique rico vendendo peixes, que vença o melhor pescador!`)
        //.addField('**<:icon3:745663998871076904> Tecnologia**', `Este setor de empresa é para você que gosta de fabricar diferentes tipos de peças, como por exemplo mini baterias que recarregam energia e equipamentos para venda ou troca, peças que podem ajudar muito o progresso. E você mesmo produz estas peças! (shhhhh, cuidado com os hackers...!)`)
        //.addField('**<:icon4:745663998887854080> Hackeamento**', `Aquele setor de empresa pilantra, onde você aproveita das boas virtudes das pessoas e das empresas, sabotando-os e conseguindo uma renda de dinheiro ilegal.`)
        //.addField('**<:icon5:745663998900568235> Segurança**', `Para aqueles que tem ódio dos hackers e dos ladrões, é a escolha perfeita! Com esse setor de empresa você poderá realizar contrato com empresas e pessoas por dinheiro, e oferecendo sua proteção á elas.`)
        await msg.quote(embed);

	}
};