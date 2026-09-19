module.exports = function createModule(dependencies) {
    const { Discord, crateExtension, db, img, ms, shopExtension } = dependencies;
const DatabaseManager = db;
const playerUtils = {
  cooldown: {},
  stamina: {}
}

playerUtils.execExp = async function(interaction, xpp, pure) {

    if (!interaction || xpp == null || xpp == undefined) return

    const obj = await DatabaseManager.get(interaction.user.id, "machines")

    const maq = shopExtension.getProduct(obj.machine);

    const xp = (pure ? xpp : Math.round((xpp * (maq.tier+1))/1.35))
  
    if (obj.xp + xp >= (obj.level*1980)) {
  
      DatabaseManager.set(interaction.user.id, "machines", "level", obj.level+1)
      DatabaseManager.set(interaction.user.id, "machines", "xp", 0);
  
      let slot = false;
      if ((obj.level+1)%6 == 0) {
          if ((((obj.level+1)-((obj.level+1)%6))/6) < 5) {
            slot = true;
          }
      }

    const levelupimage = await img.imagegens.get('levelup.js')({ img }, {

          level: obj.level,
          avatar: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),

      })

      const embed = new Discord.MessageEmbed();
      embed.setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
      embed.setImage('attachment://image.png')
      embed.addField(`🥇 Recompensas`, `**3x <:caixaup:782307290295435304> Caixa up**!
Utilize \`/mochila\` para visualizar suas caixas.${obj.level+1 == 3 ? `\n \nVocê liberou acesso ao sistema de **EMPRESAS** do bot e a partir daqui você já pode trabalhar em alguma empresa!`:''}${obj.level+1 == 10 ? `\n \nVocê liberou acesso a **CRIAÇÃO DE EMPRESAS**, utilize \`/abrirempresa\` para mais informações.`:''}${slot ? `\n \nVocê recebeu **+1 Slot de Aprimoramento para máquinas**!\nUtilize \`/maquina\` para visualizar seus slots.\nUtilize \`/loja chipes\` para comprar chipes para seus slots.` : ''}`)
      embed.setFooter(`Você evoluiu do nível ${obj.level} para o nível ${obj.level+1}`)
      embed.setColor('RANDOM');
  
      crateExtension.give(interaction.user.id, 2, 3)
  
      await interaction.channel.send({ embeds: [embed], mention: true, files: [levelupimage]});
  
    } else DatabaseManager.increment(interaction.user.id, "machines", "xp", xp);
  
    DatabaseManager.increment(interaction.user.id, "machines", "totalxp", xp);

    return xp
  
}

playerUtils.cooldown.check = async function(user_id, string) {
  let time = await playerUtils.cooldown.get(user_id, string)
  if (time < 1 ) return false;
  return true;
}

playerUtils.cooldown.get = async function(user_id, string) { 

  const obj = await DatabaseManager.get(user_id, "cooldowns");
  if (obj == null || obj == "0;0" || obj == undefined) {
      playerUtils.cooldown.set(user_id, string, 0);
      return 0;
  }
  let cooldown = obj[string];
  if (typeof cooldown !== 'string') return 0;

  const values = cooldown.split(';');
  if (values.length !== 2 || values.some((value) => value.trim() === '')) return 0;

  const [startedAt, duration] = values.map(Number);
  if (!Number.isFinite(startedAt) || !Number.isFinite(duration)) return 0;

  let res = (Date.now()/1000)-(startedAt/1000)
  let time = duration - res;
  time = Math.round(time)*1000
  return time;
}

playerUtils.cooldown.set = async function(user_id, string, ms) {
  DatabaseManager.set(user_id, "cooldowns", string, `${Date.now()};${ms}`);
}

playerUtils.cooldown.message = async function(interaction, vare, text) {
  let cooldown = await playerUtils.cooldown.get(interaction.user.id, vare);
  const embed = new Discord.MessageEmbed()
  .setColor('#b8312c')
  .setDescription('🕑 Aguarde mais `' + ms(cooldown) + '` para ' + text + '.')
  .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
  const embedinteraction = await interaction.reply({ embeds: [embed] });
  return embedinteraction;
}

playerUtils.addMastery = async function(user_id, value) {
  DatabaseManager.increment(user_id, 'players', 'mastery', value)
}

playerUtils.getMastery = async function (user_id) {
  let result
  let obj = await DatabaseManager.get(user_id, "players");
  result = obj["mastery"];
  return result;
}

playerUtils.stamina.get = async function(user_id) {
  const obj = await DatabaseManager.get(user_id, 'players')
  let stamina = obj.stamina;

  let res = (Date.now()/1000)-(stamina/1000);
  let time = 1000*30 - res;
  time = Math.round(time)
  if (time < 1){ 
    stamina = 1000;
  } else {
    stamina = (1000-((time-(time%30))/30))-1;
  }
  return stamina;
}

playerUtils.stamina.time = async function(user_id) {
  const obj = await DatabaseManager.get(user_id, 'players')
  let stamina = obj.stamina;
  let res = (Date.now()/1000)-(stamina/1000);
  let time = 1000*30 - res;
  time = Math.round(time)
  return time*1000;
}

playerUtils.stamina.set = async function(user_id, valor) {
  DatabaseManager.set(user_id, 'players', 'stamina', valor)
}
playerUtils.stamina.subset = async function(user_id, valor) {
  playerUtils.stamina.set(user_id, Date.now()-(30000*(valor)))
}

playerUtils.stamina.remove = async function(user_id, valor) {
  const get = await playerUtils.stamina.get(user_id)
  playerUtils.stamina.subset(user_id, get-valor)
}

playerUtils.stamina.add = async function(user_id, valor) {
  const get = await playerUtils.stamina.get(user_id)
  playerUtils.stamina.subset(user_id, get+valor)
}

return playerUtils;
};
