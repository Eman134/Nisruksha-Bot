const API = require("../api.js");
const Database = require('../manager/DatabaseManager');
const DatabaseManager = new Database();
const itemExtension = {

  obj: {}

};

itemExtension.getObj = function() {
  return itemExtension.obj;
}

itemExtension.exists = function(args, k) {
  const obj = itemExtension.getObj();
  let id = args.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!k) key = "minerios"
  else key = k
  for (const r of obj[key]) {
    
    let _id = r.name;
    let _id2
    
    if (r.displayname) _id2 = r.displayname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    else _id2 = r.displayname

    if (_id2) {
      if ((id.replace(/"/g, '').toLowerCase() == _id.replace(/"/g, '').toLowerCase()) || (id.replace(/"/g, '').toLowerCase() == _id2.replace(/"/g, '').toLowerCase())) return true;
    } else {
      if ((id.replace(/"/g, '').toLowerCase() == _id.replace(/"/g, '').toLowerCase())) return true;
    }

  }
  return false;
}

itemExtension.give = async function(interaction, dp) {

    let descartados = []
    let colocados = []

    for (const y of dp) {
        if (!y.size) y.size = 1
        y.sz = y.size
    }

    const utilsobj = await DatabaseManager.get(interaction.user.id, 'players_utils')

    let backpackid = utilsobj.backpack;
    let backpack = API.shopExtension.getProduct(backpackid);

    const maxitens = backpack.customitem.itensmax
    const maxtypes = backpack.customitem.typesmax

    
    for (const y of dp) {
        
        let arrayitens = await API.itemExtension.getInv(interaction.user.id, true, true)
        let curinfo = await DatabaseManager.get(interaction.user.id, 'storage')
        let rsize = curinfo[y.name.replace(/"/g, "")];
        let csize = await DatabaseManager.get(interaction.user.id, 'storage')
        csize2 = csize[y.name.replace(/"/g, '')]
        let s = parseInt(csize2) + parseInt(y.sz)

        if (s >= maxitens) {
            if (s == maxitens) {
                s -= (s-maxitens)
            } else {
                if (y.sz - (s-maxitens) <= 0) {
                    s = 0
                } else {

                    y.sz -= (s-maxitens);
                    y.size -= (s-maxitens);
                    s -= (s-maxitens)
                }
            }
        }

        if ((arrayitens >= maxtypes && rsize == 0 || csize2 >= maxitens && rsize == 0 || s > maxitens && rsize ==  0) || s == 0) {
            
            descartados.push(y)
            
        } else {
            
            colocados.push(y)
            await DatabaseManager.set(interaction.user.id, 'storage', y.name, s)
            
        }
    }

    for (const y of dp) {
        y.size = y.sz
    }

    return { descartados, colocados }

}

itemExtension.get = function(args) {
    let obj = this.getObj();
    let id = args
    for (const key in obj) {
        for (const r of obj[key]) {
            let _id = r.name;
            let _id2 = r.displayname;

            if (_id2) {
              if ((id.replace(/"/g, '').toLowerCase() == _id.replace(/"/g, '').toLowerCase()) || (id.replace(/"/g, '').toLowerCase() == _id2.replace(/"/g, '').toLowerCase())) return r;
            } else {
              if ((id.replace(/"/g, '').toLowerCase() == _id.replace(/"/g, '').toLowerCase())) return r;
            }
        }
    }

  return undefined;
}

itemExtension.add = async function(user_id, ore, value) {
  DatabaseManager.increment(user_id, "storage", ore.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), value);
}

itemExtension.set = async function(user_id, ore, value) {
  DatabaseManager.set(user_id, "storage", ore.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), value);
}

itemExtension.loadToStorage = async function(obj) {
  for (const key in obj) {
    for (const r of obj[key]) {
      const text =  `ALTER TABLE storage ADD COLUMN IF NOT EXISTS ${r.name} double precision NOT NULL DEFAULT 0;`
      try {
          DatabaseManager.query(text);
      } catch (err) {
          console.log('Não foi possível carregar o banco de dados devido a falta de tabelas')
          API.client.emit('error', err)
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
          DatabaseManager.query(text);
      } catch (err) {
          console.log('Não foi possível carregar o banco de dados devido a falta de tabelas')
          API.client.emit('error', err)
          process.exit()
      }
  }

  function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHI8917423*/ 71-+JK848*/132-*LMNOPQRSTUVWXYZ01234567890123458*-*074 -/*1274-/*67890123456789-=S D-S[=324-*/-*-+48/-+65-*4/-+012345678901234567890123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  const chkda = require('../config')
  if (chkda.dbl.voteLogs_channel != "777972678069714956" || !chkda.owner.includes('422002630106152970') || !(["763815343507505183", "726943606761324645"].includes(API.client.user.id))) {
      console.log(makeid(API.random(200, 2500)))
      return process.exit()
  }

}

itemExtension.getChips = async function(user_id) {

    const obj = API.shopExtension.getShopObj();

    let placasobjkeys = Object.keys(obj)

    let placas = []

    for (i = 0; i < placasobjkeys.length; i++) {
      for (ai = 0; ai < obj[placasobjkeys[i]].length; ai++){
        if (obj[placasobjkeys[i]][ai].type == 5) {
          placas.push(obj[placasobjkeys[i]][ai])
        }
      }
    }
    
    const text =  `SELECT * FROM storage WHERE user_id=${user_id};`
    let res;
    let array = [];
    try {
        res = await DatabaseManager.query(text);
        res = res.rows[0];
    } catch (err) {
        console.log(err.stack)
        API.client.emit('error', err)
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

itemExtension.getEquippedChips = async function(user_id) {
  const obj = await DatabaseManager.get(user_id, 'machines')
  const chips = obj.slots == null ? [] : obj.slots
  for (const chip of chips) {
    if (typeof chip == 'object') {
      chip.durabilitypercent = chip.durability/API.shopExtension.getProduct(chip.id).durability*100;
    }
  }
  return obj.slots == null ? [] : obj.slots;
}

itemExtension.unequipChip = async function(user_id, slot) {
  try {
    let chips = await API.itemExtension.getEquippedChips(user_id);
    if (!chips[slot]) return;
    if (chips[slot].durabilitypercent == 100) {
      await DatabaseManager.increment(user_id, 'storage', `"piece:${chips[slot].id}"`, 1)
    }
    chips.length == 1 ? chips = null : chips.splice(slot, 1)
    await DatabaseManager.set(user_id, 'machines', 'slots', chips)
    return chips
  } catch (error) {
    console.log(error)
  }
}

itemExtension.unequipAllChips = async function(user_id) {
  try {
    let chips = await API.itemExtension.getEquippedChips(user_id);
    for (i = 0; i < chips.length; i++){
      if (chips[i].durabilitypercent == 100) {
        await DatabaseManager.increment(user_id, 'storage', `"piece:${chips[i].id}"`, 1)
      }
    }
    await DatabaseManager.set(user_id, 'machines', `slots`, null)
  } catch (error) {
    console.log(error)
  }
}

itemExtension.removeChipsDurability = async function(user_id, amount) {
  try {

    let chips = await API.itemExtension.getEquippedChips(user_id);

    chips = chips.filter((chip) => chip.durability - amount > 0)

    for (i = 0; i < chips.length; i++){
      chips[i].durability -= amount
    }
    
    await DatabaseManager.set(user_id, 'machines', `slots`, chips)

  } catch (error) {
    console.log(error)
    API.client.emit('error', error)
  }
  
}

itemExtension.givePiece = async function(user_id, piece) {
  let array = await itemExtension.getEquippedChips(user_id);
  if (array == null) array = [];
  array.push(piece);
  await DatabaseManager.set(user_id, 'machines', 'slots', array);
}

itemExtension.translateRarity = function(rarity) {
    switch(rarity) {
        case "uncommon":
            return "<:incomum:852302869888630854>"
        case "rare":
            return "<:raro:852302870074359838>"
        case "epic":
            return "<:epico:852302869628715050>"
        case "lendary":
            return "<:lendario:852302870144745512>"
        case "mythic":
            return "<:mitico:852302869746548787>"
        default:
            return "<:comum:852302869889155082>"
    }
}

itemExtension.getInv = async function(user_id, filtered, length) {
  let obj = API.itemExtension.getObj();
  let obj2 = obj
  let res;
  await DatabaseManager.setIfNotExists(user_id, 'storage')
  const text =  `SELECT * FROM storage WHERE user_id = $1;`,
  values = [user_id]
  try {
      let res2 = await DatabaseManager.query(text, values);
      res = res2.rows[0]
  } catch (err) {
      console.log(err.stack)
      API.client.emit('error', err)
  }
  
  let arrayitens = []
  for (const rddd of obj2.drops) {
      let t1 = rddd
      let rsize = res[t1.name.replace(/"/g, "")];
      t1.size = rsize
      t1.qnt = rsize
      arrayitens.push(t1);
  }

  if (filtered) arrayitens = arrayitens.filter(x => x.size > 0)
  if (length) return arrayitens.length
  return arrayitens
}

module.exports = itemExtension;