module.exports = {
  name: 'fundo',
  aliases: ['background', 'bg', 'wallpaper'],
  category: 'Social',
  description: 'Muda a imagem de fundo no seu perfil',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const attachment = msg.attachments.array()
		    if (attachment.length < 1) {
            API.sendError(msg, 'Você não enviou uma imagem junto do comando!\nRecomendado imagens 1200x750')
            return;
        }

        let url = attachment[0].url;

        if (!attachment[0].name.match(/.(jpg|jpeg|png|gif)$/i)){
          API.sendError(msg, `O arquivo que você enviou não é uma imagem!\nFormatos disponíveis: jpg, jpeg, png, gif. (Seu arquivo: ${attachment[0].name.split('.')[attachment[0].name.split('.').length-1]})`)
          return;
        }

        if(attachment[0].size > 1050000) {
          API.sendError(msg, `A imagem que você enviou é muito pesada! Por favor envie uma imagem mais leve.\nTamanho do arquivo: **${(attachment[0].size/1000000).toFixed(1)}/1 MB**`)
          return;
        }

        API.setInfo(msg.author, 'players', 'bglink', url)

        const embed = new Discord.MessageEmbed()
        .setColor('#8adb5e')
        .setDescription(`Seu background foi definido para:`)
        .setImage(url);
        await msg.quote(embed);

        const embed2 = new Discord.MessageEmbed()
        .setColor('#8adb5e')
        .setDescription(`Background de \`${msg.author.tag} | ${msg.author.id}\``)
        .setImage(url);
        try{
            await API.client.channels.cache.get('736383144499871765').send(embed2);
        }catch{

        }

	}
};