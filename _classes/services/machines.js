const prisma = require('../prisma');
const itemExtension = require('./items');
const shopExtension = {
    getProduct: (...args) => require('./shop').getProduct(...args)
};
const UtilityService = require('./utilityService');

class MachinesService {
constructor() {
const utility = new UtilityService();
const getFormatedDate = utility.getFormatedDate.bind(utility);
const random = utility.random.bind(utility);
const ores = {};
const storageField = (name) => String(name ?? '')
  .replace(/^"|"$/g, '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[: ]/g, '_');
ores.gen = async function(maq, profundidade, chips) {

    const itemCatalog = await itemExtension.getObj();
    const oreobj = itemCatalog.minerios.map((ore) => ({ ...ore }));

    const oreobj2nomine = 2;

    const genchips = { }
    
    for (const i of chips){
      
      const productchip = await shopExtension.getProduct(i.id)
      if (productchip.type == 5 && productchip.typeeffect) {
        genchips["chipe" + productchip.typeeffect] = { ...i, icon: productchip.icon, genchipid: "chipe" + productchip.typeeffect }
      }

    }

    let gtotal = calcGTotal(profundidade)

    function calcGTotal(pew2) {
        
        let gtotal = 225;
        gtotal += (pew2*2)/1;
        gtotal += random(1, random(2, Math.round((pew2*2)*0.76)))
        gtotal += (pew2*2)*2

        gtotal -= (pew2*2)/(maq.tier+1)

        gtotal = Math.round(gtotal);

        return gtotal
    }

    let por = maq.tier * 10;
    let array = [];
    for (let i = 0; i < maq.tier + oreobj2nomine; i++) {
        if (oreobj[i]) {
            if (oreobj[i].name.includes('fragmento')) {
              if (genchips.chipe5) {
                oreobj[i].size = random(2, 4);
                array.push({ oreobj: oreobj[i], orechips: { chipe5: genchips["chipe5"] } })
              }
            } else {
              let t = Math.round(((oreobj[i].por+1)/(parseFloat(`2.${random(6, 9)}${random(0, 9)}`)))*gtotal/100);
              t += Math.round(((por/(i+1))/2)*gtotal/100);
              t *= 23/100;
              t = Math.round((oreobj[i].name == 'pedra' ? t * ((maq.tier+1)*1.9):t)/2);

              const activechips = []

              if (genchips.chipe6 && random(0, 100) < random(1, 10)) {
                t *= 2
                activechips.push(genchips.chipe6)
              }
              if (genchips.chipe7 && random(0, 100) < random(1, 10)) {
                t /= 2
                activechips.push(genchips.chipe7)
              }
              if (genchips.chipe8 && random(0, 100) < random(1, 20)) {
                
                if (oreobj[i].name == 'pedra') {
                  if (random(0, 100) < random(40, 80)) {
                    t /= 4
                    activechips.push(genchips.chipe8)
                  }
                } else {
                  if (random(0, 100) < random(5, 15)) {
                    t /= 2
                    activechips.push(genchips.chipe8)
                  }
                }

              }

              oreobj[i].size = Math.round(t);

              const chipsstring = []
              const orechips = {}

              for (const chip of activechips) {
                chipsstring.push(chip.icon)
                orechips[chip.genchipid] = chip
              }

              array.push({ oreobj: oreobj[i], orechips, chipsstring })
            }
        } else {
          break;
        }
    }

    return array;

}

const storage = {

  sizeperlevel: 1000

};

storage.getMax = async function(user_id) {
  const key = BigInt(user_id);
  const obj = await prisma.storage.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key }, select: { storage: true } });
  let sizeperlevel = storage.sizeperlevel;
  let x = obj.storage * sizeperlevel;
  return x;
}

storage.getSize = async function(user_id) {
  const obj = await itemExtension.getObj();
  const key = BigInt(user_id);
  const res = await prisma.storage.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key } });
  return obj.minerios.reduce((size, ore) => size + (Number(res[storageField(ore.name)]) || 0), 0);
}

storage.getPrice = async function(user_id, level, max2) {
   const key = BigInt(user_id);
   const obj = await prisma.storage.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key }, select: { storage: true } });
  let max
  let pricetotal = 0
  if (!level) {
    max = await maqExtension.storage.getMax(user_id);
    if (max2) max = max2
    max += (max*7.8/50)*5.15
    pricetotal = max
  } else {
    let levelatual = obj.storage

    for (let i = 0; i < level; i++) {

      max = levelatual * storage.sizeperlevel;
      if (max2) max = max2
      max += (max*7.8/50)*5.15

      pricetotal += max
      
      levelatual++

    }
  }
  
  return Math.round(pricetotal);
}

storage.isFull = async function(user_id) {
  const max = await storage.getMax(user_id);
  const size = await storage.getSize(user_id);
  return size >= max;
}

const maqExtension = {
  ores: ores, 
  storage,
  update: 12,
  lastcot: "",
  proxcot: 0,
  recoverenergy: {
    1: 60,
    2: 58,
    3: 52,
    4: 51,
    5: 50
  },
  recoverstamina: {
    1: 30,
    2: 29,
    3: 28,
    4: 28,
    5: 25
  }
};

maqExtension.forceCot = async function() {

  maqExtension.lastcot = getFormatedDate()

  const itemCatalog = await itemExtension.getObj();
  const oreslist = itemCatalog.minerios

  for (let i = 0; i < oreslist.length; i++) {
    if (random(0, 100) < 30) {
      
      
      let x = {
        update: "",
        price: random(itemCatalog.minerios[i].price.min, itemCatalog.minerios[i].price.max, true).toFixed(2)
      }

      let mudou = (itemCatalog.minerios[i].price.atual-x.price).toFixed(2)

      if (mudou < 0) mudou *= -1

      if (mudou == 0) {
        itemCatalog.minerios[i].price.ultimoupdate = ""
        continue
      }

      mudou = mudou*2/2
      
      x.update = ((x.price < itemCatalog.minerios[i].price.atual) ? "<:down:833837888546275338> " : "<:up:833837888634486794> ") + mudou.toString()

      itemCatalog.minerios[i].price.updates.unshift({ price: x.price, date: getFormatedDate(true) })
      itemCatalog.minerios[i].price.updates = itemCatalog.minerios[i].price.updates.slice(0, 10)
      itemCatalog.minerios[i].price.ultimoupdate = x.update

      itemCatalog.minerios[i].price.atual = x.price*2/2
    } else {
      itemCatalog.minerios[i].price.ultimoupdate = ""
    }
  }
  await itemExtension.saveObj({ ...itemCatalog, minerios: itemCatalog.minerios });
}

maqExtension.get = async function(user_id) {
   const key = BigInt(user_id);
   const obj = await prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] }, select: { machine: true } })
  return obj.machine;
}

maqExtension.has = async function(user_id) {
   const key = BigInt(user_id);
   const obj = await prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] }, select: { machine: true } })
  return obj.machine != 0;
}

maqExtension.getEnergy = async function(user_id) {

   const key = BigInt(user_id);
   const obj = await prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] }, select: { energy: true, energymax: true, slots: true } })
   const obj2 = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] }, select: { perm: true } })

  let energia = obj.energy;

  let r = 0;

  const array = obj.slots == null ? [] : obj.slots
  for (const i of array){
    const chipproduct = await shopExtension.getProduct(i.id)
    if (chipproduct.typeeffect == 1) {
      r += chipproduct.sizeeffect
    };
  }

  const energiamax = obj.energymax+r;
  
  let recover = maqExtension.recoverenergy[obj2.perm]

  function getEnergyTime() {
    let res = (Date.now()/1000)-(energia/1000);
    let time = energiamax*recover - res;
    time = Math.round(time)
    return time;
  }

  let time = getEnergyTime()
  if (time < 1){ 
    energia = energiamax;
  } else {
    energia = (energiamax-((time-(time%recover))/recover))-1;
  }

  if (!Number.isFinite(energia)) energia = 0;

  time *= 1000

  return { energia, energiamax, time };
}

maqExtension.setEnergy = async function(user_id, valor) {

  if (valor == null) valor = 0

  await prisma.machines.upsert({ where: { user_id: BigInt(user_id) }, update: { energy: valor }, create: { user_id: BigInt(user_id), energy: valor, slots: [] } })
}

maqExtension.removeEnergy = async function(user_id, valor) {
  let r = 0;

   const key = BigInt(user_id);
   const obj2 = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] }, select: { perm: true } })
  let recover = maqExtension.recoverenergy[obj2.perm]

  const energyobj = await maqExtension.getEnergy(user_id)

  let f = Date.now()-((energyobj.energia-r-valor)*(recover*1000));
  await maqExtension.setEnergy(user_id, f);
}

maqExtension.setEnergyMax = async function(user_id, valor) {
  await prisma.machines.upsert({ where: { user_id: BigInt(user_id) }, update: { energymax: valor }, create: { user_id: BigInt(user_id), energymax: valor, slots: [] } })
}

maqExtension.getSlotMax = function(level, mvp) {
  let r = ((((level)-((level)%6))/6));

  let res = r > 5 ? 5 : r

  if (!mvp) {
    if (res > 4) res = 4
  }

  return res;
}

maqExtension.getDepth = async function(user_id) {
  const key = BigInt(user_id);
  let playerobj = await prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] }, select: { machine: true } });
  let maqid = playerobj.machine;
  let maq = await shopExtension.getProduct(maqid);
  let r = 0;
  const array = await itemExtension.getEquippedChips(user_id);
  for (const i of array){
    const chipproduct = await shopExtension.getProduct(i.id)
    if (chipproduct.typeeffect == 2) r += chipproduct.sizeeffect;
  }
  return maq.profundidade+r
}

maqExtension.getMaintenance = async function(user_id, getDefault) {

  const key = BigInt(user_id);
  const machinesobj = await prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] }, select: { machine: true, durability: true, pressure: true, pollutants: true, refrigeration: true } })
  const machineproduct = await shopExtension.getProduct(machinesobj.machine);

  function genMaintenance(name, pricemultiplier, defaultValue, invert) {
    const userMaintenance = !getDefault
      ? (machinesobj[name] === 0 ? Math.round(defaultValue / 100 * machineproduct[name]) : machinesobj[name])
      : machinesobj[name];
    const max_maintenance = machineproduct[name]
    const maintenance_percent = parseFloat((userMaintenance / max_maintenance * 100).toFixed(2))
    const percenttemp = name === 'pressure' && maintenance_percent < 20 ? 100 - maintenance_percent : (invert ? 100 - maintenance_percent : maintenance_percent)
    const maintenance_price = Math.round(((percenttemp / 100 * max_maintenance) * pricemultiplier) * (machineproduct.tier + 1))
    return [userMaintenance, max_maintenance, maintenance_percent, maintenance_price]
  }

  const durability = genMaintenance("durability", 0.45, 100, false)
  const pressure = genMaintenance("pressure", 0.00245, 50, false)
  const pollutants = genMaintenance("pollutants", 0.00545, 0, false)
  const refrigeration = genMaintenance("refrigeration", 0.00445, 100, true)

  return { 
    durability,
    pressure,
    pollutants,
    refrigeration,
  }

}

}
}

module.exports = new MachinesService();
