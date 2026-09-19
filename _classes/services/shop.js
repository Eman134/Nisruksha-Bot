const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const prisma = require('../prisma');
const clientService = require('./clientService');
const cacheLists = require('./cacheLists');
const contentCatalog = require('./contentCatalog');
const economyService = require('./economy');
const frames = require('./frames');
const itemExtension = require('./items');
const maqExtension = require('./machines');
const runtime = require('./runtime');
const UtilityService = require('./utilityService');
class ShopService {
constructor() {
const utility = new UtilityService();
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
const sendError = utility.sendError.bind(utility);
const tp = utility.tp;
const { reportError } = require('../debug');
const shopExtension = this;

shopExtension.loadItens = async function() {
  return contentCatalog.items;
}

shopExtension.load = async function() {
  return contentCatalog.initialize();
}

shopExtension.getShopObj = async function() {
  return clone(contentCatalog.shop);
}

shopExtension.formatPages = async function(container, { currentpage, totalpages }, product, user_id, stopComponents) {
  const key = BigInt(user_id);
  const playerobj = await prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] }, select: { machine: true, level: true } });
  let maqid = playerobj.machine;
  let maq = await shopExtension.getProduct(maqid);
  const productscurrentpage = []

  const perRow = 3

  let pobj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] }, select: { mvp: true } })
  
  for (let i = (currentpage - 1) * perRow; i < ((currentpage - 1) * perRow) + perRow; i++) {
    const p = product[i];
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
      let oreobj = (await itemExtension.getObj()).minerios;
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
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${p['icon'] == undefined ? '' : p['icon'] + ' '}${p['name']} ┆ ID: ${p['id']}${discount > 0 ? ` ┆ Desconto: ${discount}%` : ''}**\n${formated}`));
    productscurrentpage.push(p)
  }

  if (product.length == 0) container.addTextDisplayComponents(new TextDisplayBuilder().setContent('**❌ Oops, um problema inesperado ocorreu**\nEsta categoria não possui produtos ainda!'));

  if (stopComponents) return []

  function reworkButtons() {

      const butnList = []
      const components = []

      butnList.push(createButton('backward', 'PRIMARY', '', '852241487064596540', (currentpage == 1 ? true : false)))
      butnList.push(createButton('stop', 'SECONDARY', '', '🔴'))
      butnList.push(createButton('forward', 'PRIMARY', '', '737370913204600853', (currentpage == totalpages ? true : false)))

       for (const product of productscurrentpage) {
          if (!product) break
          butnList.push(createButton(product.id.toString(), 'SECONDARY', product.id.toString(), product.icon.split(':')[2] ? product.icon.split(':')[2].replace('>', '') : product.icon, !product.buyable))
      }

      let totalcomponents = butnList.length % perRow;
      if (totalcomponents == 0) totalcomponents = (butnList.length)/perRow;
      else totalcomponents = ((butnList.length-totalcomponents)/perRow);

      totalcomponents += 1

       for (let x = 0; x < totalcomponents; x++) {
          const var1 = (x+1)*perRow-perRow
          const var2 = ((x+1)*perRow)
           const rowBtn = new ActionRowBuilder().addComponents(...butnList.slice(var1, var2))
          if (rowBtn.components.length > 0) components.push(rowBtn)

      }

      return components

  }

  return reworkButtons()

}

shopExtension.getShopList = async function() {
    const categories = Object.keys(await shopExtension.getShopObj());
    return `**${categories.join(', ').replace(/, /g, '**, **').toUpperCase()}**`;
}

shopExtension.categoryExists = async function(cat) {
  const obj = await shopExtension.getShopObj();
  return Object.hasOwn(obj, cat);
}

shopExtension.editPage = async function(cat, interaction, embedinteraction, products, embed, page, totalpages) {
  const filter = i => i.user.id === interaction.user.id;
  let currentpage = page;
  let stopped = false;

  const renderPage = async (stopComponents = false) => {
    const container = new ContainerBuilder()
      .setAccentColor(stopComponents ? 0xa60000 : 0xbf772a)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${cat} ${currentpage}/${totalpages}`));
    const components = await shopExtension.formatPages(container, { currentpage, totalpages }, products, interaction.user.id, stopComponents);
    return { container, components };
  };

  const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
  collector.on('collect', async (b) => {
      if (!(b.user.id === interaction.user.id)) return;

      let stopComponents = false;
      if (b.customId == 'forward' && currentpage < totalpages) currentpage += 1;
      if (b.customId == 'backward' && currentpage > 1) currentpage -= 1;
      if (b.customId == 'stop') {
        stopComponents = true;
        stopped = true;
        collector.stop();
      }

      const product = await shopExtension.getProduct(b.customId);
      if (product) stopComponents = true;
      const rendered = await renderPage(stopComponents);

      if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'shop.defer_update'));
      if (product) {
        collector.stop();
        await shopExtension.execute(interaction, product);
        return;
      }

      await interaction.editReply({ components: [rendered.container, ...rendered.components], flags: Discord.MessageFlags.IsComponentsV2 });
      collector.resetTimer();
  });

  collector.on('end', async () => {
    if (stopped) return;
    const rendered = await renderPage(true);
    await interaction.editReply({ components: [rendered.container], flags: Discord.MessageFlags.IsComponentsV2 });
  });

}

shopExtension.checkIdExists = async function(id) {
  const obj = await shopExtension.getShopObj();
  for (const products of Object.values(obj)) {
    if (products.some((product) => product.id === id || String(product.id) === String(id))) return true;
  }
  return false;
}

shopExtension.getProduct = async function(id) {
  const objProduct = await shopExtension.getShopObj();
  for (const products of Object.values(objProduct)) {
    const product = products.find((entry) => entry.id === id || String(entry.id) === String(id));
    if (product) return product;
  }
  return undefined;
}

shopExtension.execute = async function(interaction, p) {

  if (!p.buyable) {
    const obj = await shopExtension.getShopObj();
    let array = Object.keys(obj);
    const container = await sendError(interaction, `Este produto não está disponível para compra!\nVisualize uma lista de produtos disponíveis`, `loja <${array.join(' | ').toUpperCase()}>`)
    if (interaction.replied) await interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
    else await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
    return;
  }

  let color = 0x606060;
  let fields = [];
  const renderPurchase = () => new ContainerBuilder()
    .setAccentColor(color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**${interaction.user.tag}**`),
      ...fields.map(({ name, value }) => new TextDisplayBuilder().setContent(`**${name}**\n${value}`))
    );
  
  const key = BigInt(interaction.user.id);
  let pobj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] }, select: { mvp: true } });
  
  let discountmvp = Math.round(pobj.mvp ? 5 : 0);
  let discount = Math.round(p.discount + discountmvp);
  let price = Math.round(discount > 0 ? p.price*(100-discount)/100 : p.price);

  const formatprice = `${price > 0 ? format(price)  +  ' ' + money + ' ' + moneyemoji: ''}${p.price2 > 0 ? ` e ${p.price2} ${money2} ${money2emoji}`:''}${p.price3 > 0 ? `${p.price3} ${tp.name} ${tp.emoji}`:''}`

  fields.push({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `
  Você deseja comprar **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**?` })

  const btn0 = createButton('confirm', 'SECONDARY', '', '✅')
  const btn1 = createButton('cancel', 'SECONDARY', '', '❌')

  const alltoedit = {
    components: [renderPurchase(), new ActionRowBuilder().addComponents(btn0, btn1)],
    flags: Discord.MessageFlags.IsComponentsV2
  };

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
    if (buyed) return;

    buyed = true;
    collector.stop();
    fields = [];

    if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'shop.defer_update'));

    if (b.customId === 'confirm'){

      const money = await eco.money.get(interaction.user.id);
      const points = await eco.points.get(interaction.user.id);
      const obj2 = await prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] }, select: { level: true } })

      const convites = await eco.tp.get(interaction.user.id)

      if (!(money >= price)) {
        color = 0xa60000;
        fields.push({ name: '❌ Falha na compra', value: `Você não possui dinheiro suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeu dinheiro atual: **${format(money)}/${format(price)} ${money} ${moneyemoji}**` });
        await embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
			  return;

      }if(p.price2 > 0 && !(points >= p.price2)){
        color = 0xa60000;
        fields.push({ name: '❌ Falha na compra', value: `Você não possui cristais suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeus cristais atuais: **${format(points)}/${format(p.price2)} ${money2} ${money2emoji}**` });
        await embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
        return;

      }if(p.price3 > 0 && !(convites.points >= p.price3)){
        color = 0xa60000;
        fields.push({ name: '❌ Falha na compra', value: `Você não possui ${tp.name} o suficiente para comprar **${p.icon ? p.icon+' ':''}${p.name}**!\nSeus ${tp.name} atuais: **${format(convites.points)}/${format(p.price3)} ${tp.name} ${tp.emoji}**` });
        await embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
        return; 
      }if (p.level > 0 && obj2.level < p.level) {
        color = 0xa60000;
        fields.push({ name: '❌ Falha na compra', value: `Você não possui nível o suficiente para comprar isto!\nSeu nível atual: **${obj2.level}/${p.level}**\nVeja seu progresso atual utilizando \`/perfil\`` });
        await embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
        return;
      }

      let cashback = 0;
      switch(p.type) {

        case 1:

          if (await cacheLists.waiting.includes(interaction.user.id, 'mining')) {
            color = 0xa60000;
            fields.push({ name: '❌ Falha na compra', value: 'Você não pode realizar uma compra de uma máquina enquanto estiver minerando!' });
            await embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
          }

           const cmaq = await maqExtension.get(interaction.user.id)

          if (p.id > cmaq+1) {
            const proxmaq = await shopExtension.getProduct(cmaq+1)
            color = 0xa60000;
            fields.push({ name: '❌ Falha na compra', value: `Você precisa comprar a máquina em ordem por id!\nSua próxima máquina é a **${proxmaq.icon} ${proxmaq.name}**` });
            await embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
          }

           const prc = (await shopExtension.getProduct(cmaq)).price;
          if (prc > 0) {
            if (!(7*prc/100 < 1)) {
              cashback = Math.round(7*prc/100);
            }
          }

          await prisma.machines.update({ where: { user_id: BigInt(interaction.user.id) }, data: {
            machine: p.id,
            durability: p.durability,
            pressure: Math.round(p.pressure / 2),
            refrigeration: p.refrigeration,
            pollutants: 0,
            energy: 0
          } });
           await itemExtension.unequipAllChips(interaction.user.id);

          break;

        case 2:
           await eco.token.add(interaction.user.id, p.token);
          break;

        case 3:
          await prisma.players_utils.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key }, select: { user_id: true } });
          await prisma.players_utils.update({ where: { user_id: BigInt(interaction.user.id) }, data: { backpack: p.id } })
          break;
        
        case 4:

          break;
        
        case 5:

          await prisma.storage.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key }, select: { user_id: true } });
          await prisma.storage.update({ where: { user_id: BigInt(interaction.user.id) }, data: { [`piece_${p.id}`]: { increment: 1 } } })

          break;
            
        case 6:
           await frames.add(interaction.user.id, p.frameid);
          break;
        
        case 7:
           await eco.points.add(interaction.user.id, p.size);
          break;

        case 8:
          await prisma.players_utils.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key }, select: { user_id: true } });
          await prisma.players_utils.update({ where: { user_id: BigInt(interaction.user.id) }, data: { profile_color: p.pcolorid } })
          break;

        default:
          break;
          
      }
          
      color = 0x5bff45;
       fields.push({ name: '✅ Sucesso na compra', value: `Você comprou **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**.${cashback > 0 ? `\nVocê recebeu um cashback de 7% do valor da sua máquina antiga! (**${format(cashback)} ${money}** ${moneyemoji})` : ''}${p.type == 5?`\nUtilize \`/maquina\` para visualizar seus chipes!`:''}` });

       if(debug) fields.push({ name: '<:error:736274027756388353> Depuração', value: `\n\`\`\`js\n${JSON.stringify(p, null, '\t').slice(0, 1000)}\nResposta em: ${Date.now()-interaction.createdTimestamp}ms\`\`\`` });

       await embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
          
      await eco.money.remove(interaction.user.id, price);
          
       await eco.points.remove(interaction.user.id, p.price2);
          
       if (p.price3 > 0) await eco.tp.remove(interaction.user.id, p.price3);
          
      if (cashback > 0) {
        await eco.money.add(interaction.user.id, cashback);
        await eco.addToHistory(interaction.user.id, `Cashback | + ${format(cashback)} ${moneyemoji}`)
      }
      
      await eco.addToHistory(interaction.user.id, `Compra ${p.icon ? p.icon+' ':''}| - ${formatprice}`)

      const logContainer = new ContainerBuilder()
          .setAccentColor(0xb8312c)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${interaction.user.tag}**\n## 🛒 | Loja`),
            new TextDisplayBuilder().setContent(`**Produto**\n**${p.icon + ' ' + p.name}**\n${formatprice}`),
            new TextDisplayBuilder().setContent(`**<:mention:788945462283075625> Membro**\n${interaction.user.tag} (\`${interaction.user.id}\`)`),
            new TextDisplayBuilder().setContent(`**<:channel:788949139390988288> Canal**\n\`${interaction.channel.name} (${interaction.channel.id})\``),
            new TextDisplayBuilder().setContent(`-# ${interaction.guild.name} | ${interaction.guild.id} | <t:${Math.floor(Date.now() / 1000)}:F>`)
          );
      await clientService.current?.channels.cache.get('826177953796587530')?.send({ components: [logContainer], flags: Discord.MessageFlags.IsComponentsV2 });
    
    
    } if (b.customId === 'cancel'){

          color = 0xa60000;
           fields.push({ name: '❌ Compra cancelada', value: `Você cancelou a compra de **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**.` });
          await embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
          return;
    }
      
    collector.resetTimer();
  });
  
  collector.on('end', collected => {

    if (buyed) return
    fields = [];
    color = 0xa60000;
    fields.push({ name: '❌ Tempo expirado', value: `
    Você iria comprar **${p.icon ? p.icon+' ':''}${p.name}** pelo preço de **${formatprice}**, porém o tempo expirou!` })
    embedinteraction.edit({ components: [renderPurchase()], flags: Discord.MessageFlags.IsComponentsV2 });
    return;

  });

}

shopExtension.forceDiscount = async function() {

  const obj = await shopExtension.getShopObj()

  let array = Object.keys(obj);

  for (let i = 0; i < array.length; i++) {

    const discountpercategory = random(0, Math.round(obj[array[i]].length/4))

    for (let discounti = 0; discounti < discountpercategory; discounti++) {
      const discount = random(0, obj[array[i]].length)
      obj[array[i]][discount].discount = random(1, 10)
    }

  }

  await contentCatalog.saveShop(obj);

}

}
}

module.exports = new ShopService();
