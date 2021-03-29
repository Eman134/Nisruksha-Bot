const API = require("../api.js");

const stamina = {};

stamina.get = async function(member) {
  const obj = await API.getInfo(member, 'players')
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

stamina.time = async function(member) {
  const obj = await API.getInfo(member, 'players')
  let stamina = obj.stamina;
  let res = (Date.now()/1000)-(stamina/1000);
  let time = 1000*30 - res;
  time = Math.round(time)
  return time*1000;
}

stamina.set = async function(member, valor) {
  API.setInfo(member, 'players', 'stamina', valor)
}
stamina.subset = async function(member, valor) {
  API.maqExtension.stamina.set(member, Date.now()-(30000*(valor)))
}

stamina.remove = async function(member, valor) {
  let r = 1;
  let f = Date.now()-((await API.maqExtension.stamina.get(member)-r-valor)*30000);
  await API.maqExtension.stamina.set(member, f);
}

const ores = {

  obj: {}

};
(async() => {

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
    
    bigobj["drops"] = list
      
  } catch (err) {
      console.log('Error parsing JSON string:', err);
      ores.obj = `Error on pick ores obj`;
      client.emit('error', err)
  }
  ores.obj = bigobj;

  loadToStorage(bigobj)

})()

ores.getObj = function() {
  return ores.obj;
}

ores.checkExists = function(args, k) {
  let obj = maqExtension.ores.getObj();
  let id = args.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!k) key = "minerios"
  else key = k
 // for (const key in obj) {
      for (const r of obj[key]) {
        let _id = r.name;
        if (id.replace(/"/g, '') == _id.replace(/"/g, '')) return true;
      }
 // }
  return false;
}

ores.getDrop = function(args, k) {
  let obj = ores.getObj();
  let id = args
  if (!k) key = "drops"
  else key = k
 // for (const key in obj) {
      for (const r of obj[key]) {
        let _id = r.name;
        if (id.replace(/"/g, '') == _id.replace(/"/g, '')) return r;
      }
 // }
  return undefined;
}

const storage = {

  sizeperlevel: 1200

};

storage.giveOre = async function(member, ore, value) {
  let ore2 = ore.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let obj = await API.getInfo(member, "storage");
  API.setInfo(member, "storage", ore2, obj[ore2] + value);
}

storage.setOre = async function(member, ore, value) {
  API.setInfo(member, "storage", ore.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), value);
}

storage.getMax = async function(member) {
  const obj = await API.getInfo(member, 'storage');
  let sizeperlevel = storage.sizeperlevel;
  let x = obj.storage * sizeperlevel;
  return x;
}

storage.getSize = async function(member) {
  let size = 0;
  let obj = maqExtension.ores.getObj();
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

storage.getPrice = async function(member, max2) {
  let max = await maqExtension.storage.getMax(member);
  if (max2) max = max2
  max += (max*7.8/50)*5.15
  return Math.round(max);
}

storage.isFull = async function(member) {
  const max = await storage.getMax(member);
  const size = await storage.getSize(member);
  return size >= max;
}

const maqExtension = {
  ores: ores, 
  storage,
  stamina,
  update: 20,
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

async function loadToStorage(obj) {
  for (const key in obj) {
    for (const r of obj[key]) {
      const text =  `ALTER TABLE storage ADD COLUMN IF NOT EXISTS ${r.name} double precision NOT NULL DEFAULT 0;`
      try {
          API.db.pool.query(text);
      } catch (err) {
          console.log('Não foi possível carregar o banco de dados devido a falta de tabelas')
          client.emit('error', err)
          process.exit()
      }
    }
  }

  let obj2 = API.shopExtension.getShopObj();

  let placasobjkeys = Object.keys(obj2)

  let placas = []

  for (i = 0; i < placasobjkeys.length; i++) {
    for (ai = 0; ai < obj2[placasobjkeys[i]].length; ai++){
      if (obj2[placasobjkeys[i]][ai].type == 5) {
        placas.push(obj2[placasobjkeys[i]][ai])
      }
    }
  }

  for (const r of placas) {
      const text =  `ALTER TABLE storage ADD COLUMN IF NOT EXISTS "piece:${r.id}" double precision NOT NULL DEFAULT 0;`
      try {
          API.db.pool.query(text);
      } catch (err) {
          console.log('Não foi possível carregar o banco de dados devido a falta de tabelas')
          client.emit('error', err)
          process.exit()
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

  await API.shopExtension.reload();

  const array = obj.slots == null ? [] : obj.slots
  for (const i of array){
    if (API.shopExtension.getProduct(i).typeeffect == 1) {
      r += API.shopExtension.getProduct(i).size
    };
  }

  return obj.energymax+r;
}

maqExtension.setEnergy = async function(member, valor) {
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

maqExtension.getSlotMax = function(level) {
  let r = ((((level)-((level)%6))/6));
  return r > 5 ? 5 : r;
}

maqExtension.getPieces = async function(member) {

    let obj = API.shopExtension.getShopObj();

    let placasobjkeys = Object.keys(obj)

    let placas = []

    for (i = 0; i < placasobjkeys.length; i++) {
      for (ai = 0; ai < obj[placasobjkeys[i]].length; ai++){
        if (obj[placasobjkeys[i]][ai].type == 5) {
          placas.push(obj[placasobjkeys[i]][ai])
        }
      }
    }
    
    const text =  `SELECT * FROM storage WHERE user_id=${member.id};`
    let res;
    let array = [];
    try {
        res = await API.db.pool.query(text);
        res = res.rows[0];
    } catch (err) {
        console.log(err.stack)
        client.emit('error', err)
    }

    if (res == null || res == undefined) return [];

    for (const r of placas) {
      if (res['piece:' + r.id] > 0) {
        let robj = r;
        robj.size = res['piece:' + r.id]
        array.push(robj)
      }
    }
    return array;
}

maqExtension.getDepth = async function(member) {
  let playerobj = await API.getInfo(member, 'machines');
  let maqid = playerobj.machine;
  let maq = API.shopExtension.getProduct(maqid);
  let r = 0;
  const array = await maqExtension.getEquipedPieces(member);
  for (const i of array){
    if (API.shopExtension.getProduct(i).typeeffect == 2) r = r+API.shopExtension.getProduct(i).size;
  }
  return maq.profundidade+r
}

maqExtension.getEquipedPieces = async function(member) {
  const obj = await API.getInfo(member, 'machines')
  return obj.slots == null ? [] : obj.slots;
}

maqExtension.givePiece = async function(member, piece) {
  let array = await maqExtension.getEquipedPieces(member);

  if (array == null) array = [];

  array.push(piece);
  API.setInfo(member, 'machines', 'slots', array);
}

module.exports = maqExtension;