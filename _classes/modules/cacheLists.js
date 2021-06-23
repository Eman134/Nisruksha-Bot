const API = require("../api");


const waiting = {}
const waitingmap = new Map();
{
waiting.get = function(list) {

    if (!waitingmap.has(list)) {
        waitingmap.set(list, { 
            current: [], 
            links: new Map()
        })
    }

    return waitingmap.get(list)

}

waiting.length = function(list) {

    const map = waiting.get(list)

    return map.current.length

}

waiting.update = function(list, value) { 

    waiting.get(list)

    waitingmap.set(list, value)

    //API.updateBotInfo();

}

waiting.includes = function(member, list){

    const map = waiting.get(list)

    return map.current.includes(member.id)
}

waiting.getLink = function(member, list) {

    const map = waiting.get(list)

    return map.links.get(member.id)
}

waiting.remove = function(member, list){

  const map = waiting.get(list)

  const index = map.current.indexOf(member.id);
  if (index > -1) {
    map.current.splice(index, 1);
  }

  waiting.update(list, map)

}

waiting.add = function(member, msg, list) {

  const map = waiting.get(list)

  if (!(map.current.includes(member.id))) {
    map.current.push(member.id)
    map.links.set(member.id, msg.url)
  }

  waiting.update(list, map)

}
}

const remember = {}
const remembermap = new Map();
{

  remember.get = function(){return remembermap}

  remember.loadold = async function(type, member, channel){

    let from
    let to
    let time

    switch (type) {
      case "energia":
        
        from = await API.maqExtension.getEnergy(member)
        to = await API.maqExtension.getEnergyMax(member)
        time = await API.maqExtension.getEnergyTime(member)+1000

        break;
      case "estamina":
        from = await API.playerUtils.stamina.get(member)
        to = 1000
        time = await API.playerUtils.stamina.time(member)+1000
      default:
        break;
    }

    if (from >= eval(to)) {
        if (remember.includes(member, type)) {
            channel.send({ content: `🔁 | ${member} Relatório de ${type}: ${from}/${to}` })
            remember.remove(member, type)
        }
        return;
    } else {
        setTimeout(async function(){remember.loadold(type, member, channel)}, time)
    }

  }

  remember.load = async function(){
    let globalremember = await API.getGlobalInfo('remember');
    if (globalremember == null) return
    for (const b of globalremember) {
      if (b != null) remembermap.set(b.memberid, b)
    }

    
    let keys = Array.from( remembermap.values());

      for (i = 0; i < keys.length; i++) {
        
        if (keys[i]) {
          if (keys[i]["energia"] && keys[i]["energia"].active){
            if (!keys[i]["energia"]) return
            const fetched = await API.client.users.fetch(keys[i].memberid)
            const channel = (await API.client.channels.fetch(keys[i]["energia"].channelid)) || (API.client.channels.cache.get(keys[i]["energia"].channelid))
            if (!channel) return
            this.loadold("energia", fetched, channel)
          } if (keys[i]["estamina"] && keys[i]["estamina"].active){
            if (!keys[i]["estamina"]) return
            const fetched = await API.client.users.fetch(keys[i].memberid)
            const channel = (await API.client.channels.fetch(keys[i]["estamina"].channelid)) || (API.client.channels.cache.get(keys[i]["estamina"].channelid))
            if (!channel) return
            this.loadold("estamina", fetched, channel)

          } if ((!keys[i]["energia"] || !keys[i]["energia"].active) && (!keys[i]["estamina"] || !keys[i]["estamina"].active)) {
            remembermap.delete(keys[i].memberid)
          }
        }

      }

      this.save()

  }

  remember.save = async function(){
    let keys = Array.from( remembermap.values() );
    API.setGlobalInfo('remember', keys)
  }

  remember.includes = function(member, type) {
    return remembermap.has(member.id) && remembermap.get(member.id)[type] && remembermap.get(member.id)[type].active
  }

  remember.add = function(member, channelid, type) {

    let obj = {
      memberid: member.id
    }

    if (remembermap.has(member.id)) {
      obj = remembermap.get(member.id)
    }

    obj[type] = {
      channelid,
      active: false
    }

    if (!this.includes(member, type)) {
      obj[type].active = true
      remembermap.set(member.id, obj)
    }

    this.save()
  }

  remember.remove = function(member, type) {
    
    if (this.includes(member, type)) {
      let obj = remembermap.get(member.id)
      obj[type].active = false
      remembermap.set(member.id, obj)
    }

    const mapped = remembermap.get(member.id)

    if ((!mapped["energia"] || !mapped["energia"].active) && (!mapped["estamina"] || !mapped["estamina"].active)) {
      remembermap.delete(member.id)
    }

    this.save()
  }

}

module.exports = {

    waiting,
    remember,
    rememberenergy: [],
    rememberstamina: []
    
}