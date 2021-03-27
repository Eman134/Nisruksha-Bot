const API = require("../api.js");

const playerUtils = {}

playerUtils.execExp = async function(msg, xp) {

    const Discord = API.Discord;
    const obj = await API.getInfo(msg.author, "machines")
  
    if (obj.xp + xp >= (obj.level*1980)) {
  
      API.setInfo(msg.author, "machines", "level", obj.level+1)
      API.setInfo(msg.author, "machines", "xp", 0);
  
      let slot = false;
      if ((obj.level+1)%6 == 0) {
          if ((((obj.level+1)-((obj.level+1)%6))/6) < 5) {
            slot = true;
          }
      }
  
      const embed = new Discord.MessageEmbed();
      embed.setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
      embed.setDescription(`🔥 Parabéns ${msg.author}!! Você chegou ao próximo nível! (${obj.level} -> ${obj.level+1})\nUtilize \`${API.prefix}perfil\` para visualizar seu progresso atual.`)
      embed.addField(`📦 Recompensas`, `**3x <:caixaup:782307290295435304> Caixa up**!\nUtilize \`${API.prefix}mochila\` para visualizar suas caixas.${slot ? `\n \nVocê recebeu **+1 Slot de Aprimoramento para máquinas**!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots.\nUtilize \`${API.prefix}loja placas\` para comprar placas para seus slots.` : ''}`)
      embed.setFooter(`Você evoluiu do nível ${obj.level} para o nível ${obj.level+1}`)
      embed.setColor('RANDOM');
  
      API.crateExtension.give(msg.author, 2, 3)
  
      await msg.quote(`${msg.author}`, embed);
  
    } else API.setInfo(msg.author, "machines", "xp", obj.xp+xp);
  
    API.setInfo(msg.author, "machines", "totalxp", obj.totalxp+xp);
  
  }

module.exports = playerUtils