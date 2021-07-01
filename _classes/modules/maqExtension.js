const API = require("../api.js");

const ores = {};

ores.gen = async function(maq, profundidade, chip) {

    let oreobj = API.itemExtension.getObj().minerios;

    let oreobj2nomine = 1

    if (!chip) {
      oreobj = oreobj.filter((ore) => !ore.nomine )
    } else {
      oreobj2nomine = 2
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
            if (chip && oreobj[i].name.includes('fragmento')) {
              oreobj[i].size = API.random(2, 4);
              array.push(oreobj[i])
            } else {
              let t = Math.round(((oreobj[i].por+1)/(parseFloat(`2.${API.random(6, 9)}${API.random(0, 9)}`)))*gtotal/100);
              t += Math.round(((por/(i+1))/2)*gtotal/100);
              t *= 23/100;
              t = Math.round((oreobj[i].name == 'pedra' ? t * ((maq.tier+1)*1.9):t)/2);
              oreobj[i].size = t;
              array.push(oreobj[i])
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

storage.getMax = async function(member) {
  const obj = await API.getInfo(member, 'storage');
  let sizeperlevel = storage.sizeperlevel;
  let x = obj.storage * sizeperlevel;
  return x;
}

storage.getSize = async function(member) {
  let size = 0;
  const obj = API.itemExtension.getObj();
  await API.setPlayer(member, 'storage')
  let res;
  const text =  `SELECT * FROM storage WHERE user_id = $1;`,
  values = [member.id]
  try {
    res2 = await API.db.pool.query(text, values);
    res = res2.rows[0]
  } catch (err) {
    console.log(err.stack)
    client.emit('error', err)
  }
  //for (const key in obj) {
    for (const r of obj.minerios) {
      size += res[r.name];
    }
  //}
  return size;
}

storage.getPrice = async function(member, level, max2) {
  const obj = await API.getInfo(member, 'storage');
  let max
  let pricetotal = 0
  if (!level) {
    max = await maqExtension.storage.getMax(member);
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

storage.isFull = async function(member) {
  const max = await storage.getMax(member);
  const size = await storage.getSize(member);
  return size >= max;
}

const maqExtension = {
  ores: ores, 
  storage,
  update: 20,
  lastcot: "",
  proxcot: 0,
  recoverenergy: {
    1: 60,
    2: 58,
    3: 56,
    4: 54,
    5: 52
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

maqExtension.get = async function(member) {
  const obj = await API.getInfo(member, 'machines')
  return obj.machine;
}

maqExtension.has = async function(member) {
  const obj = await API.getInfo(member, 'machines')
  return obj.machine != 0;
}

maqExtension.getEnergy = async function(member) {

  const obj = await API.getInfo(member, 'machines')
  let energia = obj.energy;
  
  let energiamax = await maqExtension.getEnergyMax(member);
  
  let res = (Date.now()/1000)-(energia/1000);
  
  const obj2 = await API.getInfo(member, 'players')
  let recover = maqExtension.recoverenergy[obj2.perm]

  let time = energiamax*recover - res;
  time = Math.round(time)
  if (time < 1){ 
    energia = energiamax;
  } else {
    energia = (energiamax-((time-(time%recover))/recover))-1;
  }

  if (!energia || energia == null || energia == NaN) return 0

  return energia;
}

maqExtension.getEnergyTime = async function(member) {
  const obj = await API.getInfo(member, 'machines')
  let energia = obj.energy;
  let energiamax = await maqExtension.getEnergyMax(member);

  const obj2 = await API.getInfo(member, 'players')
  let recover = maqExtension.recoverenergy[obj2.perm]

  let res = (Date.now()/1000)-(energia/1000);
  let time = energiamax*recover - res;
  time = Math.round(time)
  return time*1000;
}

maqExtension.getEnergyMax = async function(member) {

  const obj = await API.getInfo(member, 'machines')

  let r = 0;

  const array = obj.slots == null ? [] : obj.slots
  for (const i of array){
    if (API.shopExtension.getProduct(i).typeeffect == 1) {
      r += API.shopExtension.getProduct(i).size
    };
  }

  return obj.energymax+r;
}

maqExtension.setEnergy = async function(member, valor) {

  if (valor == null) valor = 0

  API.setInfo(member, 'machines', 'energy', valor)
}

maqExtension.removeEnergy = async function(member, valor) {
  let r = 0;

  const obj2 = await API.getInfo(member, 'players')
  let recover = maqExtension.recoverenergy[obj2.perm]

  let f = Date.now()-((await API.maqExtension.getEnergy(member)-r-valor)*(recover*1000));
  await API.maqExtension.setEnergy(member, f);
}

maqExtension.setEnergyMax = async function(member, valor) {
  API.setInfo(member, 'machines', 'energymax', valor)
}

maqExtension.getSlotMax = function(level, mvp) {
  let r = ((((level)-((level)%6))/6));

  let res = r > 5 ? 5 : r

  if (!mvp) {
    if (res > 4) res = 4
  }

  return res;
}

maqExtension.getDepth = async function(member) {
  let playerobj = await API.getInfo(member, 'machines');
  let maqid = playerobj.machine;
  let maq = API.shopExtension.getProduct(maqid);
  let r = 0;
  const array = await API.itemExtension.getEquipedPieces(member);
  for (const i of array){
    if (API.shopExtension.getProduct(i).typeeffect == 2) r = r+API.shopExtension.getProduct(i).size;
  }
  return maq.profundidade+r
}

module.exports = maqExtension;