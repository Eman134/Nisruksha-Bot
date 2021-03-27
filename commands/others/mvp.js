module.exports = {
    name: 'mvp',
    aliases: ['vip'],
    category: 'Outros',
    description: 'Veja as vantagens e caso você tenha um MVP veja o tempo restante',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
                if (boolean) return;

                const Discord = API.Discord;
                const client = API.client;
                
                const embed = new Discord.MessageEmbed()
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setTitle(`Doe para o nosso projeto`)
                .setThumbnail(client.user.displayAvatarURL())
                .addField(`<:list:736274028179750922> Quais as vantagens?`, `
\`1.\` Energia recarrega mais rápido
\`2.\` Cor de destaque MVP no seu perfil
\`3.\` Uma bandeira de MVP no seu perfil
\`4.\` Menor cooldown em comandos
\`5.\` Caixa comum no daily

OBS: As vantagens são ativas enquanto você possui um MVP!

`)
//\`5.\` No sistema de empresas possui algumas pequenas vantagens
                .setColor(`RANDOM`)
                .addField(`<:mvp:758717273304465478> Como adquirir um MVP?`, `

🔗 Para adquirir um MVP basta utilizar \`${API.prefix}doar\` e ver as informações

`).setTimestamp()
                let pobj = await API.getInfo(msg.author, 'players')
                if (API.debug)console.log(Date.now()-pobj.mvp)
                if (pobj.mvp != null && pobj.perm == 3) {
                    embed.addField(`<:info:736274028515295262> Informações do seu MVP`, `Tempo restante: **${API.ms2((Date.now()-pobj.mvp)*-1)}**`)
                }
                msg.quote(embed);
        
        
	}
};