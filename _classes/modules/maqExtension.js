const API = require("../api.js");

const Database = require('../manager/DatabaseManager');
const DatabaseManager = new Database();

const ores = {};

ores.gen = async function(maq, profundidade, chips) {

    const oreobj = API.itemExtension.getObj().minerios;

    let oreobj2nomine = 1

    if (!5) {
      oreobj = oreobj.filter((ore) => !ore.nomine )
    } else {
      oreobj2nomine = 2
    }

    const genchips = { }
    
    for (const i of chips){
      
      const productchip = API.shopExtension.getProduct(i.id)
      if (productchip.type == 5 && productchip.typeeffect) {
        genchips["chipe" + productchip.typeeffect] = { ...i, icon: productchip.icon, genchipid: "chipe" + productchip.typeeffect }
      }

    }

    let gtotal = calcGTotal(profundidade)

    function calcGTotal(pew2) {
        
        let gtotal = 225;
        gtotal += (pew2*2)/1;
        gtotal += API.random(1, API.random(2, Math.round((pew2*2)*0.76)))
        gtotal += (pew2*2)*2

        gtotal -= (pew2*2)/(maq.tier+1)

        gtotal = Math.round(gtotal);

        return gtotal
    }

    let por = maq.tier * 10;
    let array = [];
    for (i = 0; i < maq.tier+oreobj2nomine; i++) {
        if (oreobj[i]) {
            if (oreobj[i].name.includes('fragmento')) {
              if (genchips.chipe5) {
                oreobj[i].size = API.random(2, 4);
                array.push({ oreobj: oreobj[i], orechips: { chipe5: genchips["chipe5"] } })
              }
            } else {
              let t = Math.round(((oreobj[i].por+1)/(parseFloat(`2.${API.random(6, 9)}${API.random(0, 9)}`)))*gtotal/100);
              t += Math.round(((por/(i+1))/2)*gtotal/100);
              t *= 23/100;
              t = Math.round((oreobj[i].name == 'pedra' ? t * ((maq.tier+1)*1.9):t)/2);

              const activechips = []

              if (genchips.chipe6 && API.random(0, 100) < API.random(1, 10)) {
                t *= 2
                activechips.push(genchips.chipe6)
              }
              if (genchips.chipe7 && API.random(0, 100) < API.random(1, 10)) {
                t /= 2
                activechips.push(genchips.chipe7)
              }
              if (genchips.chipe8 && API.random(0, 100) < API.random(1, 20)) {
                
                if (oreobj[i].name == 'pedra') {
                  if (API.random(0, 100) < API.random(40, 80)) {
                    t /= 4
                    activechips.push(genchips.chipe8)
                  }
                } else {
                  if (API.random(0, 100) < API.random(5, 15)) {
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
  const obj = await DatabaseManager.get(user_id, 'storage');
  let sizeperlevel = storage.sizeperlevel;
  let x = obj.storage * sizeperlevel;
  return x;
}

storage.getSize = async function(user_id) {
  let size = 0;
  const obj = API.itemExtension.getObj();
  await DatabaseManager.setIfNotExists(user_id, 'storage')
  const text =  `SELECT * FROM storage WHERE user_id = $1;`, values = [user_id]
  let res = await DatabaseManager.query(text, values)
  res = res.rows[0]
  for (const r of obj.minerios) {
    size += res[r.name];
  }
  return size;
}

storage.getPrice = async function(user_id, level, max2) {
  const obj = await DatabaseManager.get(user_id, 'storage');
  let max
  let pricetotal = 0
  if (!level) {
    max = await maqExtension.storage.getMax(user_id);
    if (max2) max = max2
    max += (max*7.8/50)*5.15
    pricetotal = max
  } else {
    let levelatual = obj.storage

    for (i = 0; i < level; i++) {

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

  maqExtension.lastcot = API.getFormatedDate()

  const oreslist = API.itemExtension.getObj().minerios

  for (i = 0; i < oreslist.length; i++) {
    if (API.random(0, 100) < 30) {
      
      
      let x = {
        update: "",
        price: API.random(API.itemExtension.getObj().minerios[i].price.min, API.itemExtension.getObj().minerios[i].price.max, true).toFixed(2)
      }

      let mudou = (API.itemExtension.getObj().minerios[i].price.atual-x.price).toFixed(2)

      if (mudou < 0) mudou *= -1

      if (mudou == 0) {
        return API.itemExtension.getObj().minerios[i].price.ultimoupdate = ""
      }

      mudou = mudou*2/2
      
      x.update = ((x.price < API.itemExtension.getObj().minerios[i].price.atual) ? "<:down:833837888546275338> " : "<:up:833837888634486794> ") + mudou.toString()

      API.itemExtension.getObj().minerios[i].price.updates.unshift({ price: x.price, date: API.getFormatedDate(true) })
      API.itemExtension.getObj().minerios[i].price.updates = API.itemExtension.getObj().minerios[i].price.updates.slice(0, 10)
      API.itemExtension.getObj().minerios[i].price.ultimoupdate = x.update

      API.itemExtension.getObj().minerios[i].price.atual = x.price*2/2
    } else {
      API.itemExtension.getObj().minerios[i].price.ultimoupdate = ""
    }
  }
}

maqExtension.get = async function(user_id) {
  const obj = await DatabaseManager.get(user_id, 'machines')
  return obj.machine;
}

maqExtension.has = async function(user_id) {
  const obj = await DatabaseManager.get(user_id, 'machines')
  return obj.machine != 0;
}

maqExtension.getEnergy = async function(user_id) {

  const obj = await DatabaseManager.get(user_id, 'machines')
  const obj2 = await DatabaseManager.get(user_id, 'players')

  let energia = obj.energy;

  let r = 0;

  const array = obj.slots == null ? [] : obj.slots
  for (const i of array){
    const chipproduct = API.shopExtension.getProduct(i.id)
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

  if (!energia || energia == null || energia == NaN) energia = 0

  time *= 1000

  return { energia, energiamax, time };
}

maqExtension.setEnergy = async function(user_id, valor) {

  if (valor == null) valor = 0

  DatabaseManager.set(user_id, 'machines', 'energy', valor)
}

maqExtension.removeEnergy = async function(user_id, valor) {
  let r = 0;

  const obj2 = await DatabaseManager.get(user_id, 'players')
  let recover = maqExtension.recoverenergy[obj2.perm]

  const energyobj = await API.maqExtension.getEnergy(user_id)

  let f = Date.now()-((energyobj.energia-r-valor)*(recover*1000));
  await API.maqExtension.setEnergy(user_id, f);
}

maqExtension.setEnergyMax = async function(user_id, valor) {
  DatabaseManager.set(user_id, 'machines', 'energymax', valor)
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
  let playerobj = await DatabaseManager.get(user_id, 'machines');
  let maqid = playerobj.machine;
  let maq = API.shopExtension.getProduct(maqid);
  let r = 0;
  const array = await API.itemExtension.getEquippedChips(user_id);
  for (const i of array){
    const chipproduct = API.shopExtension.getProduct(i.id)
    if (chipproduct.typeeffect == 2) r += chipproduct.sizeeffect;
  }
  return maq.profundidade+r
}

maqExtension.getMaintenance = async function(user_id, getDefault) {

  const machinesobj = await DatabaseManager.get(user_id, 'machines')
  const machineproduct = API.shopExtension.getProduct(machinesobj.machine);

  function genMaintenance(name, pricemultiplier, defaultValue, invert) {
    if (!getDefault) {
      var user_maintenance = machinesobj[name] == 0 ? Math.round(defaultValue/100*machineproduct[name]) : machinesobj[name];
    } else {
      var user_maintenance = machinesobj[name]
    }
    const max_maintenance = machineproduct[name]
    const maintenance_percent = parseFloat((user_maintenance / max_maintenance * 100).toFixed(2))
    const percenttemp = name == 'pressure' && maintenance_percent < 20 ? 100-maintenance_percent : (invert ? (100-maintenance_percent) : maintenance_percent)
    const maintenance_price = Math.round(((percenttemp/100*max_maintenance)*pricemultiplier)*(machineproduct.tier+1))
    return [user_maintenance, max_maintenance, maintenance_percent, maintenance_price]
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

module.exports = maqExtension;