const prisma = require('../prisma');
const clientService = require('./clientService');
const shopExtension = {
  getProduct: (...args) => require('./shop').getProduct(...args),
  getShopObj: (...args) => require('./shop').getShopObj(...args)
};
const UtilityService = require('./utilityService');
const contentCatalog = require('./contentCatalog');
const { reportError } = require('../debug');
class ItemsService {
constructor() {
const utility = new UtilityService();
const clone = utility.clone.bind(utility);
const itemExtension = this;
const normalizeItemName = (name) => String(name ?? '')
  .replace(/^"|"$/g, '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();
const storageField = (name) => normalizeItemName(name).replace(/[: ]/g, '_');
const getStorage = (userId, select) => {
  const user_id = BigInt(userId);
  return prisma.storage.upsert({
    where: { user_id },
    update: { user_id },
    create: { user_id },
    ...(select ? { select } : {})
  });
};
const updateStorage = (userId, name, value) => {
  const user_id = BigInt(userId);
  const field = storageField(name);
  return prisma.storage.upsert({
    where: { user_id },
    update: { [field]: value },
    create: { user_id, [field]: value }
  });
};
const incrementStorage = (userId, name, value) => {
  const user_id = BigInt(userId);
  const field = storageField(name);
  return prisma.storage.upsert({
    where: { user_id },
    update: { [field]: { increment: value } },
    create: { user_id, [field]: value }
  });
};
itemExtension.getObj = async function() {
  return contentCatalog.items;
}

itemExtension.saveObj = async function(obj) {
  return contentCatalog.saveItems(obj);
}

itemExtension.exists = async function(args, k) {
  if (args == null) return false;
  const obj = await itemExtension.getObj();
  const id = normalizeItemName(args);
  const items = obj[k || 'minerios'] || [];
  return items.some((item) => id === normalizeItemName(item.name) || id === normalizeItemName(item.displayname));
}

itemExtension.give = async function(interaction, dp) {
  const discarded = [];
  const placed = [];
  const userId = interaction.user.id;
  const user_id = BigInt(userId);
  const drops = dp.map((drop) => {
    const size = Number(drop.size) || 1;
    return { ...drop, size, sz: size };
  });

  const { backpack: backpackId } = await prisma.players_utils.upsert({
    where: { user_id },
    update: { user_id },
    create: { user_id },
    select: { backpack: true }
  });
  const backpack = await shopExtension.getProduct(backpackId);
  const maxItems = Number(backpack.customitem.itensmax);
  const maxTypes = Number(backpack.customitem.typesmax);
  const storage = await getStorage(userId);
  let itemTypeCount = (await itemExtension.getInv(userId, true, true));

  for (const drop of drops) {
    const currentSize = Number(storage[storageField(drop.name)]) || 0;
    const requestedSize = Number(drop.sz) || 1;
    const acceptedSize = Math.min(requestedSize, Math.max(0, maxItems - currentSize));

    if ((currentSize === 0 && itemTypeCount >= maxTypes) || acceptedSize === 0) {
      discarded.push(drop);
      continue;
    }

    drop.size = acceptedSize;
    drop.sz = acceptedSize;
    const newSize = currentSize + acceptedSize;
    await updateStorage(userId, drop.name, newSize);
    storage[storageField(drop.name)] = newSize;
    if (currentSize === 0) itemTypeCount += 1;
    placed.push(drop);
  }

  return { descartados: discarded, colocados: placed };
}

itemExtension.get = async function(args) {
  if (args == null) return undefined;
  const obj = await this.getObj();
  const id = normalizeItemName(args);
  for (const items of Object.values(obj)) {
    const item = items.find((entry) => id === normalizeItemName(entry.name) || id === normalizeItemName(entry.displayname));
    if (item) return item;
  }
  return undefined;
}

itemExtension.add = async function(user_id, ore, value) {
  await incrementStorage(user_id, ore, value);
}

itemExtension.set = async function(user_id, ore, value) {
  await updateStorage(user_id, ore, value);
}

itemExtension.getChips = async function(user_id) {

    const obj = await shopExtension.getShopObj();

    const placas = Object.values(obj).flat().filter((product) => product.type === 5);
    
    let res;
    let array = [];
    try {
        res = await getStorage(user_id);
    } catch (err) {
        clientService.current?.emit('error', err)
    }

    if (res == null) return [];
    
    for (const r of placas) {
      if (res[`piece_${r.id}`] > 0) {
          const robj = clone(r);
        robj.size = res[`piece_${r.id}`];
        array.push(robj)
      }
    }

    return array;
}

itemExtension.getEquippedChips = async function(user_id) {
  const key = BigInt(user_id);
  const obj = await prisma.machines.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, slots: [] }, select: { slots: true } })
  const chips = obj.slots == null ? [] : obj.slots;
  for (const chip of chips) {
    if (chip && typeof chip === 'object') {
      const product = await shopExtension.getProduct(chip.id);
      if (product?.durability) chip.durabilitypercent = chip.durability / product.durability * 100;
    }
  }
  return chips;
}

itemExtension.unequipChip = async function(user_id, slot) {
  try {
    let chips = await itemExtension.getEquippedChips(user_id);
    if (!chips[slot]) return;
    if (chips[slot].durabilitypercent == 100) {
      const field = `piece_${chips[slot].id}`;
      await incrementStorage(user_id, field, 1);
    }
    if (chips.length === 1) chips = [];
    else chips.splice(slot, 1);
    await prisma.machines.update({ where: { user_id: BigInt(user_id) }, data: { slots: chips } });
    return chips
  } catch (error) {
    reportError(error, 'items.unequip_chip', { userId: user_id, slot });
  }
}

itemExtension.unequipAllChips = async function(user_id) {
  try {
    let chips = await itemExtension.getEquippedChips(user_id);
    for (const chip of chips) {
      if (chip.durabilitypercent === 100) {
        await incrementStorage(user_id, `piece_${chip.id}`, 1);
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

    for (const chip of chips) {
      chip.durability -= amount;
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
  const obj = await itemExtension.getObj();
  let res;
  try {
    res = await getStorage(user_id);
  } catch (err) {
    clientService.current?.emit('error', err);
    return length ? 0 : [];
  }

  const items = obj.drops.map((drop) => {
    const item = clone(drop);
    const size = Number(res[storageField(item.name)]) || 0;
    item.size = size;
    item.qnt = size;
    return item;
  });
  const inventory = filtered ? items.filter((item) => item.size > 0) : items;
  return length ? inventory.length : inventory;
}

}
}

module.exports = new ItemsService();
