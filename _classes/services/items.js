const prisma = require('../prisma');
const clientService = require('./clientService');
const shopExtension = {
  getProduct: (...args) => require('./shop').getProduct(...args),
  getShopObj: (...args) => require('./shop').getShopObj(...args)
};
const UtilityService = require('./utilityService');
const cacheLists = require('./cacheLists');
const { reportError } = require('../debug');
const ITEM_FILES = [
  './_json/ores.json',
  './_json/companies/exploration/drops_monsters.json',
  './_json/companies/agriculture/seeds.json',
  './_json/companies/fish/mobs.json',
  './_json/usaveis.json',
  './_json/companies/process/drops.json'
];
class ItemsService {
constructor() {
const utility = new UtilityService();
const clone = utility.clone.bind(utility);
const itemExtension = this;
const storageField = (name) => String(name).replace(/^"|"$/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[: ]/g, '_');
const getPlayersUtils = (user_id) => {
  const key = BigInt(user_id);
  return prisma.players_utils.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key } });
};
const getStorage = (user_id) => {
  const key = BigInt(user_id);
  return prisma.storage.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key } });
};
const getMachines = (user_id) => {
  const key = BigInt(user_id);
  return prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] } });
};
const updateStorage = (user_id, name, value) => {
  const key = BigInt(user_id);
  return prisma.storage.upsert({
    where: { user_id: key },
    update: { [storageField(name)]: value },
    create: { user_id: key, [storageField(name)]: value }
  });
};
const incrementStorage = (user_id, name, value) => {
  const key = BigInt(user_id);
  return prisma.storage.upsert({
    where: { user_id: key },
    update: { [storageField(name)]: { increment: value } },
    create: { user_id: key, [storageField(name)]: value }
  });
};
itemExtension.getObj = async function() {
  return cacheLists.json.composite('items', ITEM_FILES.map((filePath) => ({ path: filePath })), ([ores, ...dropLists]) => ({
    minerios: ores,
    drops: dropLists.flat()
  }));
}

itemExtension.saveObj = async function(obj) {
  const version = await cacheLists.json.version(ITEM_FILES.map((filePath) => ({ path: filePath })));
  return cacheLists.json.save(null, 'items', obj, version);
}

itemExtension.exists = async function(args, k) {
  const obj = await itemExtension.getObj();
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

    const utilsobj = await getPlayersUtils(interaction.user.id)

    let backpackid = utilsobj.backpack;
    let backpack = await shopExtension.getProduct(backpackid);

    const maxitens = backpack.customitem.itensmax
    const maxtypes = backpack.customitem.typesmax

    
    for (const y of dp) {
        
        let arrayitens = await itemExtension.getInv(interaction.user.id, true, true)
        let curinfo = await getStorage(interaction.user.id)
        let rsize = curinfo[storageField(y.name)];
        let csize = await getStorage(interaction.user.id)
        csize2 = csize[storageField(y.name)]
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
            await updateStorage(interaction.user.id, y.name, s)
            
        }
    }

    for (const y of dp) {
        y.size = y.sz
    }

    return { descartados, colocados }

}

itemExtension.get = async function(args) {
    let obj = await this.getObj();
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
  await incrementStorage(user_id, ore, value);
}

itemExtension.set = async function(user_id, ore, value) {
  await getStorage(user_id);
  await updateStorage(user_id, ore, value);
}

itemExtension.getChips = async function(user_id) {

    const obj = await shopExtension.getShopObj();

    let placasobjkeys = Object.keys(obj)

    let placas = []

    for (i = 0; i < placasobjkeys.length; i++) {
      for (ai = 0; ai < obj[placasobjkeys[i]].length; ai++){
        if (obj[placasobjkeys[i]][ai].type == 5) {
          placas.push(obj[placasobjkeys[i]][ai])
        }
      }
    }
    
    let res;
    let array = [];
    try {
        res = await getStorage(user_id);
    } catch (err) {
        clientService.current?.emit('error', err)
    }

    if (res == null || res == undefined) return [];
    
    for (const r of placas) {
      if (res[`piece_${r.id}`] > 0) {
          let robj = clone(r);
        robj.size = res[`piece_${r.id}`]
        array.push(robj)
      }
    }

    return array;
}

itemExtension.getEquippedChips = async function(user_id) {
  const obj = await getMachines(user_id)
  const chips = obj.slots == null ? [] : obj.slots
  for (const chip of chips) {
    if (typeof chip == 'object') {
      chip.durabilitypercent = chip.durability / (await shopExtension.getProduct(chip.id)).durability * 100;
    }
  }
  return obj.slots == null ? [] : obj.slots;
}

itemExtension.unequipChip = async function(user_id, slot) {
  try {
    let chips = await itemExtension.getEquippedChips(user_id);
    if (!chips[slot]) return;
    if (chips[slot].durabilitypercent == 100) {
      await incrementStorage(user_id, `piece_${chips[slot].id}`, 1)
    }
    chips.length == 1 ? chips = null : chips.splice(slot, 1)
    await prisma.machines.update({ where: { user_id: BigInt(user_id) }, data: { slots: chips || [] } })
    return chips
  } catch (error) {
    reportError(error, 'items.unequip_chip', { userId: user_id, slot });
  }
}

itemExtension.unequipAllChips = async function(user_id) {
  try {
    let chips = await itemExtension.getEquippedChips(user_id);
    for (i = 0; i < chips.length; i++){
      if (chips[i].durabilitypercent == 100) {
        await incrementStorage(user_id, `piece_${chips[i].id}`, 1)
      }
    }
    await prisma.machines.update({ where: { user_id: BigInt(user_id) }, data: { slots: [] } })
  } catch (error) {
    reportError(error, 'items.unequip_all_chips', { userId: user_id });
  }
}

itemExtension.removeChipsDurability = async function(user_id, amount) {
  try {

    let chips = await itemExtension.getEquippedChips(user_id);

    chips = chips.filter((chip) => chip.durability - amount > 0)

    for (i = 0; i < chips.length; i++){
      chips[i].durability -= amount
    }
    
    await prisma.machines.update({ where: { user_id: BigInt(user_id) }, data: { slots: chips || [] } })

  } catch (error) {
    clientService.current?.emit('error', error)
  }
  
}

itemExtension.givePiece = async function(user_id, piece) {
  let array = await itemExtension.getEquippedChips(user_id);
  if (array == null) array = [];
  array.push(piece);
  await prisma.machines.update({ where: { user_id: BigInt(user_id) }, data: { slots: array } });
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
  let obj = await itemExtension.getObj();
  let obj2 = obj
  let res;
  await getStorage(user_id)
    try {
      res = await getStorage(user_id);
  } catch (err) {
      clientService.current?.emit('error', err)
  }
  
  let arrayitens = []
  for (const rddd of obj2.drops) {
      let t1 = clone(rddd)
      let rsize = res[storageField(t1.name)];
      t1.size = rsize
      t1.qnt = rsize
      arrayitens.push(t1);
  }

  if (filtered) arrayitens = arrayitens.filter(x => x.size > 0)
  if (length) return arrayitens.length
  return arrayitens
}

}
}

module.exports = new ItemsService();
