module.exports = {
    name: 'template',
    aliases: [],
    category: 'none',
    description: 'none',
	async execute(API, msg) {

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()
		.setDescription(`**Reaja com os itens abaixo p/ interação**\n \n👨🏽‍🌾 Tipos de Empresas\n \n📃 Empresas Existentes`, ``)

        const btn0 = API.createButton('confirm', 'grey', '', '✅')
        const btn1 = API.createButton('cancel', 'grey', '', '❌')

        let embedmsg = await msg.quote({ embed, components: [API.rowButton([btn0, btn1])] });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {
            reacted = true;
            collector.stop();
            embed.fields = [];
            b.defer()
            if (b.id == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Currículo cancelado', `
                Você cancelou o envio de currículo para a empresa **${company.name}**.`)
                embedmsg.edit({ embed });
                return;
            }

            embed.setColor('#5bff45');
            embed.addField('✅ Currículo enviado', `
            Você enviou o currículo para a empresa **${company.name}**!\nAguarde uma resposta da empresa.\nOBS: Para receber uma resposta você deve manter sua DM liberada.`)
            embedmsg.edit({ embed });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria enviar o currículo para a empresa **${API.company.e[API.company.types[1]].icon}**, porém o tempo expirou.`)
            embedmsg.edit({ embed });
            return;
        });

	}
};