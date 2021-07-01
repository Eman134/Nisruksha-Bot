const API = require("../api.js");

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
      client.emit('error', err)
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
    return shopExtension.obj;
}

shopExtension.formatPages = async function(embed, { currentpage, totalpages }, product, member, stopComponents) {
  let playerobj = await API.getInfo(member, 'machines');
  let maqid = playerobj.machine;
  let maq = API.shopExtension.getProduct(maqid);
  const productscurrentpage = []

  const perRow = 3

  for (i = (currentpage-1)*perRow; i < ((currentpage-1)*perRow)+perRow; i++) {
    let p = product[i];
    if (!p) break;
    let price = p.price;
    if (p.type == 4){price=Math.round(((price * maq.durability/100)*0.45)*(maq.tier+1));}
        
    let formated = `Preço: ${price > 0 ? `\`${API.format(price)} ${API.money}\` ${API.moneyemoji}` : ''}${p.price2 ? ' e `' + p.price2 + ' ' + API.money2 + '` ' + API.money2emoji : ''}${p.price3 ? '`' + p.price3 + ' ' + API.tp.name + '` ' + API.tp.emoji : ''}`

    if (p.buyable) {
      formated += `\nUtilize ${API.prefix}comprar ${p.id}`
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
    embed.addField(`${p['icon'] == undefined ? '' : p['icon'] + ' '}${p['name']} ┆ ID: ${p['id']}`, formated, false)
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
        client.emit('error', err)
        return '`Error on load shop list`';
        
    }
    return '**' + array.join(', ').replace(/, /g, "**, **").toUpperCase() + '**'
}


shopExtension.categoryExists = function(cat) {
  const obj = shopExtension.getShopObj();
  let array = Object.keys(obj);
  return array.includes(cat);
}

shopExtension.editPage = async function(cat, msg, embedmsg, products, embed, page, totalpages) {
  
  const filter = i => i.user.id === msg.author.id;

  let currentpage = page;
  
  let collector = embedmsg.createMessageComponentInteractionCollector({ filter, time: 30000 });
  
  collector.on('collect', async(b) => {

      if (!(b.user.id === msg.author.id)) return
      
      embed.fields = [];

      let components = []

      let stopComponents = false

      if (b.customID == 'forward'){
        if (currentpage < totalpages) currentpage += 1;
      } if (b.customID == 'backward') {
        if (currentpage > 1) currentpage -= 1;
      } if (b.customID == 'stop') {
        collector.stop()
        embed.setColor('#a60000')
        components = []
        stopComponents = true
      }

      embed.setTitle(`${cat} ${currentpage}/${totalpages}`);

      if (b.customID != 'stop' && b.customID != 'forward' && b.customID != 'backward') {
        collector.stop()
        await API.shopExtension.execute(msg, API.shopExtension.getProduct(b.customID));
        components = []
        stopComponents = true
      }

      components = await shopExtension.formatPages(embed, { currentpage, totalpages }, products, msg.author, stopComponents);

      await embedmsg.edit({ embeds: [embed], components });
      collector.resetTimer();

      b.deferUpdate().catch()


  });
  
  collector.on('end', async collected => {
    await embedmsg.edit({ embeds: [embed], components: [] });
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
  let obj

  const { readFileSync } = require('fs')
  const path = './_json/shop.json'
  try {
    if (path) {
      const jsonString = readFileSync(path, 'utf8')
      const customer = JSON.parse(jsonString);
      obj = customer;
    } else {
      console.log('File path is missing from shopExtension!')
      shopExtension.obj = '`Error on load shop list`';
    }
  } catch (err) {
      console.log('Error parsing JSON string:', err);
      shopExtension.obj = '`Error on load shop list`';
      API.client.emit('error', err)
  }

  let array = Object.keys(obj);
  let product;
  for (i = 0; i < array.length; i++) {
    for (_i = 0; _i < obj[array[i]].length; _i++) {
      let _id = obj[array[i]][_i]['id'];
      if (id == _id) {
        product = obj[array[i]][_i];
        return product;
      }
    }
  }
  return product;
}

shopExtension.execute = async function(msg, p) {

  if (!p.buyable) {
    let obj = API.shopExtension.getShopObj();
    let array = Object.keys(obj);
    const embedtemp = await API.sendError(msg, `Este produto não está disponível para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
    await msg.quote({ embeds: [embedtemp]})
    return;
  }

  const embed = new API.Discord.MessageEmbed();
  embed.setColor('#606060');
  embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
  let price = p.price;
  let torp = 0;
  let playerobj = await API.getInfo(msg.author, 'machines');
  let maqid = playerobj.machine;
  let maq = API.shopExtension.getProduct(maqid);
  if (p.type == 4){torp=price;price = Math.round(((price * maq.durability/100)*0.45)*(maq.tier+1))}

  const formatprice = `${price > 0 ? API.format(price)  +  ' ' + API.money + ' ' + API.moneyemoji: ''}${p.price2 > 0 ? ` e ${p.price2} ${API.money2} ${API.money2emoji}`:''}${p.price3 > 0 ? `${p.price3} ${API.tp.name} ${API.tp.emoji}`:''}`

  embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
  Você deseja comprar **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**?`)

  const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
  const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

  let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] });

  const filter = i => i.user.id === msg.author.id;

  let collector = embedmsg.createMessageComponentInteractionCollector({ filter, time: 30000 });
  let buyed = false;

  collector.on('collect', async(b) => {

    if (!(b.user.id === msg.author.id)) return

    buyed = true;
    collector.stop();
    embed.fields = [];
    b.deferUpdate().catch()

    if (b.customID == 'confirm'){

      const money = await API.eco.money.get(msg.author);
      const points = await API.eco.points.get(msg.author);
      const obj2 = await API.getInfo(msg.author, "machines")

      const convites = await API.eco.tp.get(msg.author)

      if (!(money >= price)) {
        embed.setColor('#a60000');
        embed.addField('❌ Falha na compra', `Você não possui dinheiro suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeu dinheiro atual: **${API.format(money)}/${API.format(price)} ${API.money} ${API.moneyemoji}**`)
        await embedmsg.edit({ embeds: [embed], components: [] });
			  return;

      }if(p.price2 > 0 && !(points >= p.price2)){
        embed.setColor('#a60000');
        embed.addField('❌ Falha na compra', `Você não possui cristais suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeus cristais atuais: **${API.format(points)}/${API.format(p.price2)} ${API.money2} ${API.money2emoji}**`)
        await embedmsg.edit({ embeds: [embed], components: [] });
        return;

      }if(p.price3 > 0 && !(convites.points >= p.price3)){
          embed.setColor('#a60000');
          embed.addField('❌ Falha na compra', `Você não possui ${API.tp.name} o suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeus ${API.tp.name} atuais: **${API.format(convites.points)}/${API.format(p.price3)} ${API.tp.name} ${API.tp.emoji}**`)
          await embedmsg.edit({ embeds: [embed], components: [] });
          return; 
      }if (p.level > 0 && obj2.level < p.level) {
        embed.setColor('#a60000');
        embed.addField('❌ Falha na compra', `Você não possui nível o suficiente para comprar isto!\nSeu nível atual: **${obj2.level}/${p.level}**\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
        await embedmsg.edit({ embeds: [embed], components: [] });
        return;
      }

      let cashback = 0;
      switch(p.type) {

        case 1:

          if (API.cacheLists.waiting.includes(msg.author, 'mining')) {
            embed.setColor('#a60000');
            embed.addField('❌ Falha na compra', `Você não pode realizar uma compra de uma máquina enquanto estiver minerando!`)
            await embedmsg.edit({ embeds: [embed], components: [] });
            return;
          }

          let cmaq = await API.maqExtension.get(msg.author)

          if (p.id > cmaq+1) {
            embed.setColor('#a60000');
            embed.addField('❌ Falha na compra', `Você precisa comprar a máquina em ordem por id!\nSua próxima máquina é a **${API.shopExtension.getProduct(cmaq+1).name}**`)
            await embedmsg.edit({ embeds: [embed], components: [] });
            return;
          }

          let prc = API.shopExtension.getProduct(cmaq).price;
          if (prc > 0) {
            if (!(7*prc/100 < 1)) {
              cashback = Math.round(7*prc/100);
            }
          }

          let pieces = await API.itemExtension.getEquipedPieces(msg.author);

          for (i = 0; i < pieces.length; i++){
              const pic = await API.getInfo(msg.author, 'storage')
              await API.setInfo(msg.author, 'storage', `"piece:${pieces[i]}"`, pic[`piece:${pieces[i]}`]+1)
          }

          API.setInfo(msg.author, 'machines', `slots`, [])
          API.setInfo(msg.author, 'machines', 'machine', p.id);
          API.setInfo(msg.author, 'machines', 'durability', p.durability)
			    API.setInfo(msg.author, 'machines', 'energy', 0)

          break;

        case 2:
          API.eco.token.add(msg.author, p.token)
          break;

        case 3:
          API.setInfo(msg.author, 'players_utils', 'backpack', p.id)
          break;
        
        case 4:

          if (API.cacheLists.waiting.includes(msg.author, 'mining')) {
            embed.setColor('#a60000');
            embed.addField('❌ Falha na compra', `Você não pode realizar reparos de uma máquina enquanto estiver minerando!`)
            await embedmsg.edit({ embeds: [embed], components: [] });
            return;
          }

          playerobj = await API.getInfo(msg.author, 'machines');
          maqid = playerobj.machine;
          maq = API.shopExtension.getProduct(maqid);

          if ((playerobj.durability + (torp*maq.durability/100)) > maq.durability) {
            API.setInfo(msg.author, 'machines', 'durability', maq.durability)
          } else {
            API.setInfo(msg.author, 'machines', 'durability', playerobj.durability + (torp*maq.durability/100))
          }

          break;
        
        case 5:

          playerobj = await API.getInfo(msg.author, 'storage');
          API.setInfo(msg.author, 'storage', `"piece:${p.id}"`, playerobj[`piece:${p.id}`] + 1)

          break;
            
        case 6:
          API.frames.add(msg.author, p.frameid)
          break;
        
        case 7:
          API.eco.points.add(msg.author, p.size)
          break;

        case 8:
          API.setInfo(msg.author, 'players_utils', 'profile_color', p.pcolorid)
          break;

        default:
          break;
          
      }
          
      embed.setColor('#5bff45');
      embed.addField('✅ Sucesso na compra', `Você comprou **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**.${cashback > 0 ? `\nVocê recebeu um cashback de 7% do valor da sua máquina antiga! (**${API.format(cashback)} ${API.money}** ${API.moneyemoji})` : ''}${p.type == 5?`\nUtilize \`${API.prefix}máquina\` para visualizar seus chipes!`:''}`)
      
      if(API.debug) embed.addField('<:error:736274027756388353> Depuração', `\n\`\`\`js\n${JSON.stringify(p, null, '\t').slice(0, 1000)}\nResposta em: ${Date.now()-msg.createdTimestamp}ms\`\`\``)
          
      await embedmsg.edit({ embeds: [embed], components: [] });
          
      await API.eco.money.remove(msg.author, price);
          
      API.eco.points.remove(msg.author, p.price2);
          
      if (p.price3 > 0) API.eco.tp.remove(msg.author, p.price3)
          
      if (cashback > 0) {
        await API.eco.money.add(msg.author, cashback);
        await API.eco.addToHistory(msg.author, `Cashback | + ${API.format(cashback)} ${API.moneyemoji}`)
      }
      
      await API.eco.addToHistory(msg.author, `Compra ${p.icon ? p.icon+' ':''}| - ${formatprice}`)

      const embedcmd = new API.Discord.MessageEmbed()
          .setColor('#b8312c')
          .setTimestamp()
          .setTitle('🛒 | Loja')
          .addField('Produto', `**${p.icon + ' ' + p.name}**\n${formatprice}`)
          .addField('<:mention:788945462283075625> Membro', `${msg.author.tag} (\`${msg.author.id}\`)`)
          .addField('<:channel:788949139390988288> Canal', `\`${msg.channel.name} (${msg.channel.id})\``)
          .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
          .setFooter(msg.guild.name + " | " + msg.guild.id, msg.guild.iconURL())
          API.client.channels.cache.get('826177953796587530').send({ embeds: [embedcmd]});
    
    
    } if (b.customID == 'cancel'){

          embed.setColor('#a60000');
          embed.addField('❌ Compra cancelada', `Você cancelou a compra de **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**.`)
          await embedmsg.edit({ embeds: [embed], components: [] });
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
    embedmsg.edit({ embeds: [embed], components: [] });
    return;

  });

}

module.exports = shopExtension;