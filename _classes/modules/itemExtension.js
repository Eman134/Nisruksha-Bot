const API = require("../api.js");
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

itemExtension.give = async function(msg, dp) {

    let descartados = []
    let colocados = []

    for (const y of dp) {
        if (!y.size) y.size = 1
        y.sz = y.size
    }

    const utilsobj = await API.getInfo(msg.author, 'players_utils')

    let backpackid = utilsobj.backpack;
    let backpack = API.shopExtension.getProduct(backpackid);

    const maxitens = backpack.customitem.itensmax
    const maxtypes = backpack.customitem.typesmax

    
    for (const y of dp) {
        
        let arrayitens = await API.itemExtension.getInv(msg.author, true, true)
        let curinfo = await API.getInfo(msg.author, 'storage')
        let rsize = curinfo[y.name.replace(/"/g, "")];
        let csize = await API.getInfo(msg.author, 'storage')
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
            await API.setInfo(msg.author, 'storage', y.name, s)
            
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

itemExtension.add = async function(member, ore, value) {
  let ore2 = ore.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const obj = await API.getInfo(member, "storage");
  API.setInfo(member, "storage", ore2, obj[ore2] + value);
}

itemExtension.set = async function(member, ore, value) {
  API.setInfo(member, "storage", ore.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), value);
}

itemExtension.loadToStorage = async function(obj) {
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
          API.client.emit('error', err)
          process.exit()
      }
  }

}

itemExtension.getPieces = async function(member) {

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

itemExtension.getEquipedPieces = async function(member) {
  const obj = await API.getInfo(member, 'machines')
  return obj.slots == null ? [] : obj.slots;
}

itemExtension.givePiece = async function(member, piece) {
  let array = await itemExtension.getEquipedPieces(member);

  if (array == null) array = [];

  array.push(piece);
  API.setInfo(member, 'machines', 'slots', array);
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

itemExtension.getInv = async function(member, filtered, length) {
  let obj = API.itemExtension.getObj();
  let obj2 = obj
  let res;
  await API.setPlayer(member, 'storage')
  const text =  `SELECT * FROM storage WHERE user_id = $1;`,
  values = [member.id]
  try {
      let res2 = await API.db.pool.query(text, values);
      res = res2.rows[0]
  } catch (err) {
      console.log(err.stack)
      client.emit('error', err)
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