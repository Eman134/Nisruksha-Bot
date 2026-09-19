const Discord = require('discord.js');
const DatabaseManagerClass = require('../manager/DatabaseManager');
const clientService = require('./clientService');
const cacheLists = require('./cacheLists');
const economyService = require('./economy');
const frames = require('./frames');
const itemExtension = require('./items');
const maqExtension = require('./machines');
const runtime = require('./runtime');
const UtilityService = require('./utilityService');
class ShopService {
constructor() {
const database = new DatabaseManagerClass();
const utility = new UtilityService();
const DatabaseManager = database;
const clone = utility.clone.bind(utility);
const createButton = utility.createButton.bind(utility);
const debug = runtime.debug;
const eco = economyService;
const format = utility.format.bind(utility);
const money = utility.money;
const money2 = utility.money2;
const money2emoji = utility.money2emoji;
const moneyemoji = utility.moneyemoji;
const random = utility.random.bind(utility);
const rowComponents = utility.rowComponents.bind(utility);
const sendError = utility.sendError.bind(utility);
const tp = utility.tp;
const { reportError } = require('../debug');

const shopExtension = this;

shopExtension.obj = {};
shopExtension.obj2 = {};

shopExtension.loadItens = async function() {
  const { readFileSync } = require('fs')

  let bigobj = {}

  try {

    
    const jsonStringores = readFileSync('./_json/ores.json', 'utf8')
    const customerores = JSON.parse(jsonStringores);
    bigobj["minerios"] = customerores
    
    // Load all itens

    let list = []
    
    const jsonStringdrops = readFileSync('./_json/companies/exploration/drops_monsters.json', 'utf8')
    const customerdrops = JSON.parse(jsonStringdrops);
    
    list = list.concat(customerdrops)
    
    const jsonStringseeds = readFileSync('./_json/companies/agriculture/seeds.json', 'utf8')
    const customerseeds = JSON.parse(jsonStringseeds);
    
    list = list.concat(customerseeds)

    const jsonStringfish = readFileSync('./_json/companies/fish/mobs.json', 'utf8')
    const customerfish = JSON.parse(jsonStringfish);
    
    list = list.concat(customerfish)

    const jsonStringusaveis = readFileSync('./_json/usaveis.json', 'utf8')
    const customerusaveis = JSON.parse(jsonStringusaveis);
    
    list = list.concat(customerusaveis)

    const jsonStringprocessdrops = readFileSync('./_json/companies/process/drops.json', 'utf8')
    const customerprocessdrops = JSON.parse(jsonStringprocessdrops);
    
    list = list.concat(customerprocessdrops)
    
    bigobj["drops"] = list
      
  } catch (err) {
      clientService.current?.emit('error', err)
  }
  itemExtension.obj = bigobj;

  return bigobj
}

shopExtension.load = async function() {

  const { readFileSync } = require('fs')
    const path = './_json/shop.json'
    try {
      if (path) {
        const jsonString = readFileSync(path, 'utf8')
        const customer = JSON.parse(jsonString);
        shopExtension.obj = customer;
        shopExtension.obj2 = customer;
      } else {
        console.log('File path is missing from shopExtension!')
        shopExtension.obj = '`Error on load shop list`';
      }
    } catch (err) {
        shopExtension.obj = '`Error on load shop list`';
        clientService.current?.emit('error', err)
    }

    await itemExtension.loadToStorage(await this.loadItens())

}

shopExtension.getShopObj = function() {
  const obj = clone(shopExtension.obj2);
  return obj;
}

shopExtension.formatPages = async function(embed, { currentpage, totalpages }, product, user_id, stopComponents) {
  const playerobj = await DatabaseManager.get(user_id, 'machines');
  let maqid = playerobj.machine;
  let maq = shopExtension.getProduct(maqid);
  const productscurrentpage = []

  const perRow = 3

  let pobj = await DatabaseManager.get(user_id, 'players')
  
  for (i = (currentpage-1)*perRow; i < ((currentpage-1)*perRow)+perRow; i++) {
    let p = product[i];
    if (!p) break;
    let discountmvp = Math.round(pobj.mvp ? 5 : 0);
    let discount = Math.round(p.discount + discountmvp);
    let price = Math.round(discount > 0 ? p.price*(100-discount)/100 : p.price);
    if (p.type == 4){price=Math.round(((price * maq.durability/100)*0.45)*(maq.tier+1));}
        
    let formated = `Preço: ${discount > 0 ? `~~\`${format(p.price)}\`~~ ` : ''}${price > 0 ? `\`${format(price)} ${money}\` ${moneyemoji}` : ''}${p.price2 ? ' e `' + p.price2 + ' ' + money2 + '` ' + money2emoji : ''}${p.price3 ? '`' + p.price3 + ' ' + tp.name + '` ' + tp.emoji : ''}`

    if (p.buyable) {
      formated += `\nUtilize /comprar ${p.id}`
    }
    if (p.token) {
      formated += '\nQuantia: ' + p.token + ' fichas'
    }
    if (p.customitem && p.customitem.typesmax) {
      formated += `\nMáximo de Tipos: **${p.customitem.typesmax}**\nQuantia máxima por item: **${p.customitem.itensmax}**`
    }
    if (p.tier) {
      var oreobj = itemExtension.getObj().minerios;
      oreobj = oreobj.filter((ore) => !ore.nomine)
      formated += `\nTier: ${p.tier} (${oreobj[p.tier].name} ${oreobj[p.tier].icon})`
    }
    if (p.profundidade) {
      formated += '\nProfundidade: ' + p.profundidade + 'm'
    }
    if (p.durability) {
      formated += '\nDurabilidade: ' + p.durability + 'u'
    }
    if (p.level && playerobj.level < p.level) {
      formated += '\n**Requer Nível ' + p.level + '**'
    }
    if (p.info) {
      formated += '\n' + p.info
    }
    embed.addFields({ name: `${p['icon'] == undefined ? '' : p['icon'] + ' '}${p['name']} ┆ ID: ${p['id']}${discount > 0 ? ` ┆ Desconto: ${discount}%` : ''}`, value: formated, inline: false })
    productscurrentpage.push(p)
  }

  if (product.length == 0) embed.addFields({ name: '❌ Oops, um problema inesperado ocorreu', value: 'Esta categoria não possui produtos ainda!' });

  if (stopComponents) return []

  function reworkButtons() {

      const butnList = []
      const components = []

      butnList.push(createButton('backward', 'PRIMARY', '', '852241487064596540', (currentpage == 1 ? true : false)))
      butnList.push(createButton('stop', 'SECONDARY', '', '🔴'))
      butnList.push(createButton('forward', 'PRIMARY', '', '737370913204600853', (currentpage == totalpages ? true : false)))

      for (i = 0; i < productscurrentpage.length; i++) {
         if (!productscurrentpage[i]) break
         butnList.push(createButton(productscurrentpage[i].id.toString(), 'SECONDARY', productscurrentpage[i].id.toString(), productscurrentpage[i].icon.split(':')[2] ? productscurrentpage[i].icon.split(':')[2].replace('>', '') : productscurrentpage[i].icon, !productscurrentpage[i].buyable ? true : false))
      }

      let totalcomponents = butnList.length % perRow;
      if (totalcomponents == 0) totalcomponents = (butnList.length)/perRow;
      else totalcomponents = ((butnList.length-totalcomponents)/perRow);

      totalcomponents += 1

      for (x = 0; x < totalcomponents; x++) {
          const var1 = (x+1)*perRow-perRow
          const var2 = ((x+1)*perRow)
          const rowBtn = rowComponents(butnList.slice(var1, var2))
          if (rowBtn.components.length > 0) components.push(rowBtn)

      }

      return components

  }

  return reworkButtons()

}

shopExtension.getShopList = function() {
    let array;
    const { readFileSync } = require('fs')
    const path = './_json/shop.json'
    try {
      if (path) {
        const jsonString = readFileSync(path, 'utf8')
        const customer = JSON.parse(jsonString);
        //console.log(customer)
        array = Object.keys(customer);
      } else {
        console.log('File path is missing from shopExtension!')
        return '`Error on load shop list`';
      }
    } catch (err) {
        clientService.current?.emit('error', err)
        return '`Error on load shop list`';
        
    }
    return '**' + array.join(', ').replace(/, /g, "**, **").toUpperCase() + '**'
}

shopExtension.categoryExists = function(cat) {
  const obj = shopExtension.getShopObj();
  let array = Object.keys(obj);
  return array.includes(cat);
}

shopExtension.editPage = async function(cat, interaction, embedinteraction, products, embed, page, totalpages) {
  
  const filter = i => i.user.id === interaction.user.id;

  let currentpage = page;
  
  let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

  let stopped = false
  
  collector.on('collect', async(b) => {

      if (!(b.user.id === interaction.user.id)) return
      
      embed.fields = [];

      let components = []

      let stopComponents = false

      if (b.customId == 'forward'){
        if (currentpage < totalpages) currentpage += 1;
      } if (b.customId == 'backward') {
        if (currentpage > 1) currentpage -= 1;
      } if (b.customId == 'stop') {
        embed.setColor('#a60000')
        components = []
        stopComponents = true
        stopped = true
        collector.stop()
      }

      embed.setTitle(`${cat} ${currentpage}/${totalpages}`);

      const product = shopExtension.getProduct(b.customId)
      
      if (product) stopComponents = true
      components = await shopExtension.formatPages(embed, { currentpage, totalpages }, products, interaction.user.id, stopComponents);
      
      if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'shop.defer_update'));

      if (product) {
        collector.stop()
        await shopExtension.execute(interaction, product);
        return
      }

      await interaction.editReply({ embeds: [embed], components });
      collector.resetTimer();

  });
  
  collector.on('end', async collected => {
    if (stopped) return
    await interaction.editReply({ embeds: [embed], components: [] });
  });

}

shopExtension.checkIdExists = function(id) {
  const obj = shopExtension.getShopObj();
  let array = Object.keys(obj);
  for (i = 0; i < array.length; i++) {
    for (_i = 0; _i < obj[array[i]].length; _i++) {
      let _id = obj[array[i]][_i]['id'];
      if (id == _id) return true;
    }
  }
  return false;
}

shopExtension.getProduct = function(id) {

  const objProduct = shopExtension.getShopObj()

  const array = Object.keys(objProduct);

  for (i = 0; i < array.length; i++) {
    for (_i = 0; _i < objProduct[array[i]].length; _i++) {
      let _id = objProduct[array[i]][_i]['id'];
      if (id == _id) {
        var product = objProduct[array[i]][_i];
        break;
      }
    }
  }

  return product;
}

shopExtension.execute = async function(interaction, p) {

  if (!p.buyable) {
    const obj = shopExtension.getShopObj();
    let array = Object.keys(obj);
    const embedtemp = await sendError(interaction, `Este produto não está disponível para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
    if (interaction.replied) await interaction.editReply({ embeds: [embedtemp]})
    else await interaction.reply({ embeds: [embedtemp]})
    return;
  }

  const embed = new Discord.EmbedBuilder();
  embed.setColor('#606060');
  embed.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
  
  let playerobj = await DatabaseManager.get(interaction.user.id, 'machines');
  let pobj = await DatabaseManager.get(interaction.user.id, 'players');
  
  let discountmvp = Math.round(pobj.mvp ? 5 : 0);
  let discount = Math.round(p.discount + discountmvp);
  let price = Math.round(discount > 0 ? p.price*(100-discount)/100 : p.price);

  const formatprice = `${price > 0 ? format(price)  +  ' ' + money + ' ' + moneyemoji: ''}${p.price2 > 0 ? ` e ${p.price2} ${money2} ${money2emoji}`:''}${p.price3 > 0 ? `${p.price3} ${tp.name} ${tp.emoji}`:''}`

  embed.addFields({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `
  Você deseja comprar **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**?` })

  const btn0 = createButton('confirm', 'SECONDARY', '', '✅')
  const btn1 = createButton('cancel', 'SECONDARY', '', '❌')

  const alltoedit = { embeds: [embed], components: [rowComponents([btn0, btn1])] }

  let embedinteraction

  if (interaction.replied) {
    embedinteraction = await interaction.followUp(alltoedit)
  } else {
    embedinteraction = (await interaction.reply({ ...alltoedit, withResponse: true })).resource.message
  }

  const filter = i => i.user.id === interaction.user.id;

  let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
  let buyed = false;

  collector.on('collect', async(b) => {

    if (!(b.user.id === interaction.user.id)) return

    buyed = true;
    collector.stop();
    embed.fields = [];

    if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'shop.defer_update'));

    if (b.customId == 'confirm'){

      const money = await eco.money.get(interaction.user.id);
      const points = await eco.points.get(interaction.user.id);
      const obj2 = await DatabaseManager.get(interaction.user.id, "machines")

      const convites = await eco.tp.get(interaction.user.id)

      if (!(money >= price)) {
        embed.setColor('#a60000');
        embed.addFields({ name: '❌ Falha na compra', value: `Você não possui dinheiro suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeu dinheiro atual: **${format(money)}/${format(price)} ${money} ${moneyemoji}**` })
        await embedinteraction.edit({ embeds: [embed], components: [] });
			  return;

      }if(p.price2 > 0 && !(points >= p.price2)){
        embed.setColor('#a60000');
        embed.addFields({ name: '❌ Falha na compra', value: `Você não possui cristais suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeus cristais atuais: **${format(points)}/${format(p.price2)} ${money2} ${money2emoji}**` })
        await embedinteraction.edit({ embeds: [embed], components: [] });
        return;

      }if(p.price3 > 0 && !(convites.points >= p.price3)){
        embed.setColor('#a60000');
        embed.addFields({ name: '❌ Falha na compra', value: `Você não possui ${tp.name} o suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeus ${tp.name} atuais: **${format(convites.points)}/${format(p.price3)} ${tp.name} ${tp.emoji}**` })
        await embedinteraction.edit({ embeds: [embed], components: [] });
        return; 
      }if (p.level > 0 && obj2.level < p.level) {
        embed.setColor('#a60000');
        embed.addFields({ name: '❌ Falha na compra', value: `Você não possui nível o suficiente para comprar isto!\nSeu nível atual: **${obj2.level}/${p.level}**\nVeja seu progresso atual utilizando \`/perfil\`` })
        await embedinteraction.edit({ embeds: [embed], components: [] });
        return;
      }

      let cashback = 0;
      switch(p.type) {

        case 1:

          if (await cacheLists.waiting.includes(interaction.user.id, 'mining')) {
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Falha na compra', value: 'Você não pode realizar uma compra de uma máquina enquanto estiver minerando!' })
            await embedinteraction.edit({ embeds: [embed], components: [] });
            return;
          }

          let cmaq = await maqExtension.get(interaction.user.id)

          if (p.id > cmaq+1) {
            const proxmaq = shopExtension.getProduct(cmaq+1)
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Falha na compra', value: `Você precisa comprar a máquina em ordem por id!\nSua próxima máquina é a **${proxmaq.icon} ${proxmaq.name}**` })
            await embedinteraction.edit({ embeds: [embed], components: [] });
            return;
          }

          let prc = shopExtension.getProduct(cmaq).price;
          if (prc > 0) {
            if (!(7*prc/100 < 1)) {
              cashback = Math.round(7*prc/100);
            }
          }

          DatabaseManager.set(interaction.user.id, 'machines', 'machine', p.id);
          DatabaseManager.set(interaction.user.id, 'machines', 'durability', p.durability)
          DatabaseManager.set(interaction.user.id, 'machines', 'pressure', Math.round(p.pressure/2))
          DatabaseManager.set(interaction.user.id, 'machines', 'refrigeration', p.refrigeration)
          DatabaseManager.set(interaction.user.id, 'machines', 'pollutants', 0)
			    DatabaseManager.set(interaction.user.id, 'machines', 'energy', 0)
          itemExtension.unequipAllChips(interaction.user.id);

          break;

        case 2:
          eco.token.add(interaction.user.id, p.token)
          break;

        case 3:
          DatabaseManager.set(interaction.user.id, 'players_utils', 'backpack', p.id)
          break;
        
        case 4:

          break;
        
        case 5:

          playerobj = await DatabaseManager.get(interaction.user.id, 'storage');
          DatabaseManager.set(interaction.user.id, 'storage', `"piece:${p.id}"`, playerobj[`piece:${p.id}`] + 1)

          break;
            
        case 6:
          frames.add(interaction.user.id, p.frameid)
          break;
        
        case 7:
          eco.points.add(interaction.user.id, p.size)
          break;

        case 8:
          DatabaseManager.set(interaction.user.id, 'players_utils', 'profile_color', p.pcolorid)
          break;

        default:
          break;
          
      }
          
      embed.setColor('#5bff45');
       embed.addFields({ name: '✅ Sucesso na compra', value: `Você comprou **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**.${cashback > 0 ? `\nVocê recebeu um cashback de 7% do valor da sua máquina antiga! (**${format(cashback)} ${money}** ${moneyemoji})` : ''}${p.type == 5?`\nUtilize \`/maquina\` para visualizar seus chipes!`:''}` })

       if(debug) embed.addFields({ name: '<:error:736274027756388353> Depuração', value: `\n\`\`\`js\n${JSON.stringify(p, null, '\t').slice(0, 1000)}\nResposta em: ${Date.now()-interaction.createdTimestamp}ms\`\`\`` })

      embedinteraction.edit({ embeds: [embed], components: [] });
          
      await eco.money.remove(interaction.user.id, price);
          
      eco.points.remove(interaction.user.id, p.price2);
          
      if (p.price3 > 0) eco.tp.remove(interaction.user.id, p.price3)
          
      if (cashback > 0) {
        await eco.money.add(interaction.user.id, cashback);
        await eco.addToHistory(interaction.user.id, `Cashback | + ${format(cashback)} ${moneyemoji}`)
      }
      
      await eco.addToHistory(interaction.user.id, `Compra ${p.icon ? p.icon+' ':''}| - ${formatprice}`)

      const embedcmd = new Discord.EmbedBuilder()
          .setColor('#b8312c')
          .setTimestamp()
          .setTitle('🛒 | Loja')
          .addFields(
            { name: 'Produto', value: `**${p.icon + ' ' + p.name}**\n${formatprice}` },
            { name: '<:mention:788945462283075625> Membro', value: `${interaction.user.tag} (\`${interaction.user.id}\`)` },
            { name: '<:channel:788949139390988288> Canal', value: `\`${interaction.channel.name} (${interaction.channel.id})\`` }
          )
          .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
          .setFooter({ text: interaction.guild.name + " | " + interaction.guild.id, iconURL: interaction.guild.iconURL() })
          clientService.current?.channels.cache.get('826177953796587530').send({ embeds: [embedcmd]});
    
    
    } if (b.customId == 'cancel'){

          embed.setColor('#a60000');
           embed.addFields({ name: '❌ Compra cancelada', value: `Você cancelou a compra de **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**.` })
          await embedinteraction.edit({ embeds: [embed], components: [] });
          return;
    }
      
    collector.resetTimer();
  });
  
  collector.on('end', collected => {

    if (buyed) return
    embed.fields = []
    embed.setColor('#a60000');
    embed.addFields({ name: '❌ Tempo expirado', value: `
    Você iria comprar **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**, porém o tempo expirou!` })
    embedinteraction.edit({ embeds: [embed], components: [] });
    return;

  });

}

shopExtension.forceDiscount = async function() {

  const obj = shopExtension.getShopObj()

  let array = Object.keys(obj);

  for (i = 0; i < array.length; i++) {

    const discountpercategory = random(0, Math.round(obj[array[i]].length/4))

    for (let discounti = 0; discounti < discountpercategory; discounti++) {
      const discount = random(0, obj[array[i]].length)
      obj[array[i]][discount].discount = random(1, 10)
    }

  }

  shopExtension.obj2 = obj;

}

}
}

module.exports = new ShopService();
