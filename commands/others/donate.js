const Database = require("../../_classes/manager/DatabaseManager")
const DatabaseManager = new Database()

module.exports = {
    name: 'doar',
    aliases: ['donate'],
    category: 'Outros',
    description: 'Veja as informações necessárias para realizar uma doação',
    mastery: 20,
	async execute(API, interaction) {

                const Discord = API.Discord;
                const client = API.client;

                const globalobj = await DatabaseManager.get(API.id, 'globals')

                const donates = globalobj.donates
                const totaldonates = globalobj.totaldonates
                
                const embed = new Discord.MessageEmbed()
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setTitle(`Doe para o nosso projeto`)
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter(`Nisruksha agradece :)`, client.user.displayAvatarURL())
                .addField(`<:info:736274028515295262> Introdução e explicação`, `Lembre-se primeiramente que é uma **doação**, e **não uma compra**, portanto as vantagens são um extra para ajudar quem contribui com o projeto.\nAo doar para o Nisruksha, você pode ajudar a manter a hospedagem do bot online e assim o bot ficando online também. Além de incentivar o criador do bot a trazer mais novidades, eventos e sorteios para a comunidade do bot. As vantagens são aplicadas para doações acima de \`R$4,99\` (Cristais são adicionados independente do valor da doação).`)
                .addField(`<:list:736274028179750922> Quais as vantagens?`, `
\`1.\` Um obrigado
\`2.\` Cargo Doador no servidor principal
\`3.\` Acesso a sorteios exclusivos para Doadores
\`4.\` Acesso ao desenvolvimento de novas versões
\`5.\` Chave de ativação de MVP com duração de 15 dias (\`/mvp\`)
Para cada \`R$1,00\` = 25 ${API.money2} ${API.money2emoji}

OBS: As vantagens são ativadas por cada doação
OBS2: Se você fizer um número de donates em um tempo menor, por exemplo doar \`R$5,00\` agora e doar a mesma quantia daqui 3 horas, a donate é contada como um todo de \`R$10,00\` e as vantagens serão agrupadas.        
`)
                .setColor(`RANDOM`)
                .addField(`<:mvp:758717273304465478> Doar pelo MERCADOPAGO`, `

🔗 [R$1,00](https://mpago.la/2JmgSMg)
🔗 [R$3,00](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=568626560-658d6e1b-3d4e-4e6f-95ca-f7cf493cff37)
🔗 [R$5,00](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=568626560-e3c0388d-8fdd-416b-ad98-765fcb7b83dd)
🔗 [R$10,00](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=568626560-51aa07f4-6ebb-444e-911e-ced6e4d02f5c)
🔗 [R$20,00](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=568626560-d499e48d-c174-4103-9415-7de8bc92d86d)
🔗 [R$50,00](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=568626560-844812e3-5e3c-4d61-a6ce-9622218899a1)
🔗 [R$100,00](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=568626560-47115992-0628-4709-87fa-6c4b5ca9f437)
🔗 PIX: kessdev09@gmail.com
`).setTimestamp()
//Total de doações: ${donates}
//Total em doações: R$${(totaldonates + "").replace('.', ',')}
            if (interaction.replied) return interaction.channel.send({ embeds: [embed]})
            await interaction.reply({ embeds: [embed] });
        
	}
};