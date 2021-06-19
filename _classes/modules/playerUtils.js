const API = require("../api.js");

const playerUtils = {
  cooldown: {}
}

let bglevelup

loadbg()

async function loadbg() {
    bglevelup = await API.img.loadImage(`resources/backgrounds/profile/levelup.png`)
}

playerUtils.execExp = async function(msg, xpp) {

    if (!msg || xpp == null || xpp == undefined) return

    const Discord = API.Discord;
    const obj = await API.getInfo(msg.author, "machines")

    let maq = API.shopExtension.getProduct(obj.machine);

    let xp = Math.round((xpp * (maq.tier+1))/1.35)
  
    if (obj.xp + xp >= (obj.level*1980)) {
  
      API.setInfo(msg.author, "machines", "level", obj.level+1)
      API.setInfo(msg.author, "machines", "xp", 0);
  
      let slot = false;
      if ((obj.level+1)%6 == 0) {
          if ((((obj.level+1)-((obj.level+1)%6))/6) < 5) {
            slot = true;
          }
      }

      let background = bglevelup

      // Draw username
      background = await API.img.drawText(background, obj.level + '', 60, './resources/fonts/Uni-Sans-Thin.ttf', '#ffffff', 35, 75, 4)
      background = await API.img.drawText(background, (obj.level+1) + '', 60, './resources/fonts/Uni-Sans-Thin.ttf', '#ffffff', 365, 75, 4)
      // Draw avatar
      let avatar = await API.img.loadImage(msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
      avatar = await API.img.resize(avatar, 100, 100);
      background = await API.img.drawImage(background, avatar, 150, 25)

      const attachment = await API.img.getAttachment(background, 'levelup.png')
  
      const embed = new Discord.MessageEmbed();
      embed.setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
      .attachFiles([attachment])
      embed.setImage('attachment://levelup.png')
      embed.addField(`🥇 Recompensas`, `**3x <:caixaup:782307290295435304> Caixa up**!
Utilize \`${API.prefix}mochila\` para visualizar suas caixas.${obj.level+1 == 3 ? `\n \nVocê liberou acesso ao sistema de **EMPRESAS** do bot e a partir daqui você já pode trabalhar em alguma empresa!`:''}${obj.level+1 == 10 ? `\n \nVocê liberou acesso a **CRIAÇÃO DE EMPRESAS**, utilize \`${API.prefix}abrirempresa\` para mais informações.`:''}${slot ? `\n \nVocê recebeu **+1 Slot de Aprimoramento para máquinas**!\nUtilize \`${API.prefix}maquina\` para visualizar seus slots.\nUtilize \`${API.prefix}loja chipes\` para comprar chipes para seus slots.` : ''}`)
      embed.setFooter(`Você evoluiu do nível ${obj.level} para o nível ${obj.level+1}`)
      embed.setColor('RANDOM');
  
      API.crateExtension.give(msg.author, 2, 3)
  
      await msg.quote({content: msg.author, embed, mention: true});
  
    } else API.setInfo(msg.author, "machines", "xp", obj.xp+xp);
  
    API.setInfo(msg.author, "machines", "totalxp", obj.totalxp+xp);

    return xp
  
}

playerUtils.cooldown.check = async function(member, string) {
  let time = await API.playerUtils.cooldown.get(member, string)
  if (time < 1 ) return false;
  return true;
}

playerUtils.cooldown.get = async function(member, string) { 

  const text =  `ALTER TABLE cooldowns ADD COLUMN IF NOT EXISTS ${string} text NOT NULL DEFAULT '0;0';`
  await API.db.pool.query(text);

  const obj = await API.getInfo(member, "cooldowns");
  if (obj == null || obj == "0;0" || obj == undefined) {
      API.playerUtils.cooldown.set(member, string, 0);
      return 0;
  }
  let cooldown = obj[string];
  let res = (Date.now()/1000)-(parseInt(cooldown.split(";")[0])/1000)
  let time = parseInt(cooldown.split(";")[1]) - res;
  time = Math.round(time)*1000
  return time;
}

playerUtils.cooldown.set = async function(member, string, ms) {

  const text =  `ALTER TABLE cooldowns ADD COLUMN IF NOT EXISTS ${string} text NOT NULL DEFAULT '0;0';`
  await API.db.pool.query(text);

  API.setInfo(member, "cooldowns", string, `${Date.now()};${ms}`);
}

playerUtils.cooldown.message = async function(msg, vare, text) {
  let cooldown = await API.playerUtils.cooldown.get(msg.author, vare);
  const embed = new API.Discord.MessageEmbed()
  .setColor('#b8312c')
  .setDescription('🕑 Aguarde mais `' + API.ms(cooldown) + '` para ' + text + '.')
  .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
  const embedmsg = await msg.quote(embed);
  return embedmsg;
}

playerUtils.addMastery = async function(member, value) {
  let obj = await API.getInfo(member, "players");
  API.setInfo(member, "players", "mastery", parseInt(obj.mastery) + parseInt(value));
}

playerUtils.getMastery = async function (member) {
  let result
  let obj = await API.getInfo(member, "players");
  result = obj["mastery"];
  return result;
}

module.exports = playerUtils