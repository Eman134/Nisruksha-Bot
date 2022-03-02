const API = require("../api.js");
const Database = require("../manager/DatabaseManager.js");
const DatabaseManager = new Database();

const shopExtension = {

  obj: {},
  obj2: {}

};

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
      console.log('Error parsing JSON string:', err);
      API.client.emit('error', err)
  }
  API.itemExtension.obj = bigobj;

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
        console.log('Error parsing JSON string:', err);
        shopExtension.obj = '`Error on load shop list`';
        API.client.emit('error', err)
    }

    await API.itemExtension.loadToStorage(await this.loadItens())

}

shopExtension.getShopObj = function() {
  const obj = API.clone(shopExtension.obj2);
  return obj;
}

shopExtension.formatPages = async function(embed, { currentpage, totalpages }, product, user_id, stopComponents) {
  const playerobj = await DatabaseManager.get(user_id, 'machines');
  let maqid = playerobj.machine;
  let maq = API.shopExtension.getProduct(maqid);
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
        
    let formated = `Preço: ${discount > 0 ? `~~\`${API.format(p.price)}\`~~ ` : ''}${price > 0 ? `\`${API.format(price)} ${API.money}\` ${API.moneyemoji}` : ''}${p.price2 ? ' e `' + p.price2 + ' ' + API.money2 + '` ' + API.money2emoji : ''}${p.price3 ? '`' + p.price3 + ' ' + API.tp.name + '` ' + API.tp.emoji : ''}`

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
      var oreobj = API.itemExtension.getObj().minerios;
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
    embed.addField(`${p['icon'] == undefined ? '' : p['icon'] + ' '}${p['name']} ┆ ID: ${p['id']}${discount > 0 ? ` ┆ Desconto: ${discount}%` : ''}`, formated, false)
    productscurrentpage.push(p)
  }

  if (product.length == 0) embed.addField('❌ Oops, um problema inesperado ocorreu', 'Esta categoria não possui produtos ainda!');

  if (stopComponents) return []

  function reworkButtons() {

      const butnList = []
      const components = []

      butnList.push(API.createButton('backward', 'PRIMARY', '', '852241487064596540', (currentpage == 1 ? true : false)))
      butnList.push(API.createButton('stop', 'SECONDARY', '', '🔴'))
      butnList.push(API.createButton('forward', 'PRIMARY', '', '737370913204600853', (currentpage == totalpages ? true : false)))

      for (i = 0; i < productscurrentpage.length; i++) {
         if (!productscurrentpage[i]) break
         butnList.push(API.createButton(productscurrentpage[i].id.toString(), 'SECONDARY', productscurrentpage[i].id.toString(), productscurrentpage[i].icon.split(':')[2] ? productscurrentpage[i].icon.split(':')[2].replace('>', '') : productscurrentpage[i].icon, !productscurrentpage[i].buyable ? true : false))
      }

      let totalcomponents = butnList.length % perRow;
      if (totalcomponents == 0) totalcomponents = (butnList.length)/perRow;
      else totalcomponents = ((butnList.length-totalcomponents)/perRow);

      totalcomponents += 1

      for (x = 0; x < totalcomponents; x++) {
          const var1 = (x+1)*perRow-perRow
          const var2 = ((x+1)*perRow)
          const rowBtn = API.rowComponents(butnList.slice(var1, var2))
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
        console.log('Error parsing JSON string:', err);
        API.client.emit('error', err)
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

      const product = API.shopExtension.getProduct(b.customId)
      
      if (product) stopComponents = true
      components = await shopExtension.formatPages(embed, { currentpage, totalpages }, products, interaction.user.id, stopComponents);
      
      if (!b.deferred) b.deferUpdate().then().catch();

      if (product) {
        collector.stop()
        await API.shopExtension.execute(interaction, product);
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
    const obj = API.shopExtension.getShopObj();
    let array = Object.keys(obj);
    const embedtemp = await API.sendError(interaction, `Este produto não está disponível para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
    if (interaction.replied) await interaction.editReply({ embeds: [embedtemp]})
    else await interaction.reply({ embeds: [embedtemp]})
    return;
  }

  const embed = new API.Discord.MessageEmbed();
  embed.setColor('#606060');
  embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
  
  let playerobj = await DatabaseManager.get(interaction.user.id, 'machines');
  let pobj = await DatabaseManager.get(interaction.user.id, 'players');
  
  let discountmvp = Math.round(pobj.mvp ? 5 : 0);
  let discount = Math.round(p.discount + discountmvp);
  let price = Math.round(discount > 0 ? p.price*(100-discount)/100 : p.price);

  const formatprice = `${price > 0 ? API.format(price)  +  ' ' + API.money + ' ' + API.moneyemoji: ''}${p.price2 > 0 ? ` e ${p.price2} ${API.money2} ${API.money2emoji}`:''}${p.price3 > 0 ? `${p.price3} ${API.tp.name} ${API.tp.emoji}`:''}`

  embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
  Você deseja comprar **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**?`)

  const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
  const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

  const alltoedit = { embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true }

  let embedinteraction

  if (interaction.replied) {
    embedinteraction = await interaction.followUp(alltoedit)
  } else {
    embedinteraction = await interaction.reply(alltoedit)
  }

  const filter = i => i.user.id === interaction.user.id;

  let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
  let buyed = false;

  collector.on('collect', async(b) => {

    if (!(b.user.id === interaction.user.id)) return

    buyed = true;
    collector.stop();
    embed.fields = [];

    if (!b.deferred) b.deferUpdate().then().catch();

    if (b.customId == 'confirm'){

      const money = await API.eco.money.get(interaction.user.id);
      const points = await API.eco.points.get(interaction.user.id);
      const obj2 = await DatabaseManager.get(interaction.user.id, "machines")

      const convites = await API.eco.tp.get(interaction.user.id)

      if (!(money >= price)) {
        embed.setColor('#a60000');
        embed.addField('❌ Falha na compra', `Você não possui dinheiro suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeu dinheiro atual: **${API.format(money)}/${API.format(price)} ${API.money} ${API.moneyemoji}**`)
        await embedinteraction.edit({ embeds: [embed], components: [] });
			  return;

      }if(p.price2 > 0 && !(points >= p.price2)){
        embed.setColor('#a60000');
        embed.addField('❌ Falha na compra', `Você não possui cristais suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeus cristais atuais: **${API.format(points)}/${API.format(p.price2)} ${API.money2} ${API.money2emoji}**`)
        await embedinteraction.edit({ embeds: [embed], components: [] });
        return;

      }if(p.price3 > 0 && !(convites.points >= p.price3)){
        embed.setColor('#a60000');
        embed.addField('❌ Falha na compra', `Você não possui ${API.tp.name} o suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeus ${API.tp.name} atuais: **${API.format(convites.points)}/${API.format(p.price3)} ${API.tp.name} ${API.tp.emoji}**`)
        await embedinteraction.edit({ embeds: [embed], components: [] });
        return; 
      }if (p.level > 0 && obj2.level < p.level) {
        embed.setColor('#a60000');
        embed.addField('❌ Falha na compra', `Você não possui nível o suficiente para comprar isto!\nSeu nível atual: **${obj2.level}/${p.level}**\nVeja seu progresso atual utilizando \`/perfil\``)
        await embedinteraction.edit({ embeds: [embed], components: [] });
        return;
      }

      let cashback = 0;
      switch(p.type) {

        case 1:

          if (API.cacheLists.waiting.includes(interaction.user.id, 'mining')) {
            embed.setColor('#a60000');
            embed.addField('❌ Falha na compra', `Você não pode realizar uma compra de uma máquina enquanto estiver minerando!`)
            await embedinteraction.edit({ embeds: [embed], components: [] });
            return;
          }

          let cmaq = await API.maqExtension.get(interaction.user.id)

          if (p.id > cmaq+1) {
            const proxmaq = API.shopExtension.getProduct(cmaq+1)
            embed.setColor('#a60000');
            embed.addField('❌ Falha na compra', `Você precisa comprar a máquina em ordem por id!\nSua próxima máquina é a **${proxmaq.icon} ${proxmaq.name}**`)
            await embedinteraction.edit({ embeds: [embed], components: [] });
            return;
          }

          let prc = API.shopExtension.getProduct(cmaq).price;
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
          API.itemExtension.unequipAllChips(interaction.user.id);

          break;

        case 2:
          API.eco.token.add(interaction.user.id, p.token)
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
          API.frames.add(interaction.user.id, p.frameid)
          break;
        
        case 7:
          API.eco.points.add(interaction.user.id, p.size)
          break;

        case 8:
          DatabaseManager.set(interaction.user.id, 'players_utils', 'profile_color', p.pcolorid)
          break;

        default:
          break;
          
      }
          
      embed.setColor('#5bff45');
      embed.addField('✅ Sucesso na compra', `Você comprou **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**.${cashback > 0 ? `\nVocê recebeu um cashback de 7% do valor da sua máquina antiga! (**${API.format(cashback)} ${API.money}** ${API.moneyemoji})` : ''}${p.type == 5?`\nUtilize \`/maquina\` para visualizar seus chipes!`:''}`)

      if(API.debug) embed.addField('<:error:736274027756388353> Depuração', `\n\`\`\`js\n${JSON.stringify(p, null, '\t').slice(0, 1000)}\nResposta em: ${Date.now()-interaction.createdTimestamp}ms\`\`\``)

      embedinteraction.edit({ embeds: [embed], components: [] });
          
      await API.eco.money.remove(interaction.user.id, price);
          
      API.eco.points.remove(interaction.user.id, p.price2);
          
      if (p.price3 > 0) API.eco.tp.remove(interaction.user.id, p.price3)
          
      if (cashback > 0) {
        await API.eco.money.add(interaction.user.id, cashback);
        await API.eco.addToHistory(interaction.user.id, `Cashback | + ${API.format(cashback)} ${API.moneyemoji}`)
      }
      
      await API.eco.addToHistory(interaction.user.id, `Compra ${p.icon ? p.icon+' ':''}| - ${formatprice}`)

      const embedcmd = new API.Discord.MessageEmbed()
          .setColor('#b8312c')
          .setTimestamp()
          .setTitle('🛒 | Loja')
          .addField('Produto', `**${p.icon + ' ' + p.name}**\n${formatprice}`)
          .addField('<:mention:788945462283075625> Membro', `${interaction.user.tag} (\`${interaction.user.id}\`)`)
          .addField('<:channel:788949139390988288> Canal', `\`${interaction.channel.name} (${interaction.channel.id})\``)
          .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
          .setFooter(interaction.guild.name + " | " + interaction.guild.id, interaction.guild.iconURL())
          API.client.channels.cache.get('826177953796587530').send({ embeds: [embedcmd]});
    
    
    } if (b.customId == 'cancel'){

          embed.setColor('#a60000');
          embed.addField('❌ Compra cancelada', `Você cancelou a compra de **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**.`)
          await embedinteraction.edit({ embeds: [embed], components: [] });
          return;
    }
      
    collector.resetTimer();
  });
  
  collector.on('end', collected => {

    if (buyed) return
    embed.fields = []
    embed.setColor('#a60000');
    embed.addField('❌ Tempo expirado', `
    Você iria comprar **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**, porém o tempo expirou!`)
    embedinteraction.edit({ embeds: [embed], components: [] });
    return;

  });

}

shopExtension.forceDiscount = async function() {

  const obj = shopExtension.getShopObj()

  let array = Object.keys(obj);

  for (i = 0; i < array.length; i++) {

    const discountpercategory = API.random(0, Math.round(obj[array[i]].length/4))

    for (let discounti = 0; discounti < discountpercategory; discounti++) {
      const discount = API.random(0, obj[array[i]].length)
      obj[array[i]][discount].discount = API.random(1, 10)
    }

  }

  shopExtension.obj2 = obj;

}

module.exports = shopExtension;