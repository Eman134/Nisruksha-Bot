module.exports = {
  name: 'fundo',
  aliases: ['background', 'bg', 'wallpaper'],
  category: 'Social',
  description: 'Muda a imagem de fundo no seu perfil',
  mastery: 7,
	async execute(API, msg) {

        const Discord = API.Discord;
        if (msg.slash) {
          const embedtemp = await API.sendError(msg, 'Para este comando você precisa digitar em sua forma original', 'fundo')
          await msg.quote({ embeds: [embedtemp]})
          return 
        }

		    if (msg.attachments.size < 1) {
            const embedtemp = await API.sendError(msg, 'Você não enviou uma imagem junto do comando!\nRecomendado imagens 1200x750')
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let attachment = msg.attachments.first()
        let url = attachment.url;

        if (!attachment.name.match(/.(jpg|jpeg|png)$/i)){
          const embedtemp = await API.sendError(msg, `O arquivo que você enviou não é uma imagem!\nFormatos disponíveis: jpg, jpeg, png. (Seu arquivo: ${attachment.name.split('.')[attachment.name.split('.').length-1]})`)
          await msg.quote({ embeds: [embedtemp]})
          return;
        }

        if(attachment.size > 1050000) {
          const embedtemp = await API.sendError(msg, `A imagem que você enviou é muito pesada! Por favor envie uma imagem mais leve.\nTamanho do arquivo: **${(attachment.size/1000000).toFixed(1)}/1 MB**`)
          await msg.quote({ embeds: [embedtemp]})
          return;
        }

        API.setInfo(msg.author, 'players', 'bglink', url)

        const embed = new Discord.MessageEmbed()
        .setColor('#8adb5e')
        .setDescription(`Seu background foi definido para:`)
        .setImage(url);
        await msg.quote({ embeds: [embed] });

        const embed2 = new Discord.MessageEmbed()
        .setColor('#8adb5e')
        .setDescription(`Background de \`${msg.author.tag} | ${msg.author.id}\``)
        .setImage(url);
        try{
            await API.client.channels.cache.get('736383144499871765').send({ embeds: [embed2] });
        }catch{

        }

	}
};