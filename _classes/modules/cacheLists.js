const API = require("../api");

const Database = require('../manager/DatabaseManager');
const DatabaseManager = new Database();

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

waiting.includes = function(user_id, list){

    const map = waiting.get(list)

    return map.current.includes(user_id)
}

waiting.getLink = function(user_id, list) {
    const map = waiting.get(list)
    return map.links.get(user_id)
}

waiting.remove = function(user_id, list){

  const map = waiting.get(list)

  const index = map.current.indexOf(user_id);
  if (index > -1) {
    map.current.splice(index, 1);
  }

  waiting.update(list, map)

}

waiting.add = function(user_id, interaction, list) {

  const map = waiting.get(list)

  if (!(map.current.includes(user_id))) {
    map.current.push(user_id)
    map.links.set(user_id, interaction.url)
  }

  waiting.update(list, map)

}
}

const remember = {}
const remembermap = new Map();
{

  remember.get = function(){return remembermap}

  remember.loadold = async function(type, user_id, channel){

    let from
    let to
    var time = 0

    switch (type) {
      case "energia":

        var { energia, energiamax, time } = await API.maqExtension.getEnergy(user_id)
        
        from = energia
        to = energiamax
        if (time > 0) time = time+1000

        break;
      case "estamina":
        from = await API.playerUtils.stamina.get(user_id)
        to = 1000
        time = await API.playerUtils.stamina.time(user_id)+1000
      default:
        break;
    }

    if (from >= to) {
        if (remember.includes(user_id, type)) {
            channel.send({ content: `🔁 | <@${user_id}> Relatório de ${type}: ${from}/${to}` })
            remember.remove(user_id, type)
        }
        return;
    } else {
        setTimeout(async function(){remember.loadold(type, user_id, channel)}, time)
    }

  }

  remember.load = async function(){
    const globalobj = await DatabaseManager.get(API.id, 'globals');
    const globalremember = globalobj.remember
    if (globalremember == null) return
    for (const b of globalremember) {
      if (b != null) remembermap.set(b.memberid, b)
    }

    let keys = Array.from( remembermap.values());

      for (i = 0; i < keys.length; i++) {
        
        if (keys[i]) {
          if (keys[i] && keys[i]["energia"] && keys[i]["energia"].active){
            if (keys[i]["energia"] !== undefined) {
              try {
                const channel = (await API.client.channels.fetch(keys[i]["energia"].channelid)) || (API.client.channels.cache.get(keys[i]["energia"].channelid))
                if (!channel) return
                this.loadold("energia", keys[i].memberid, channel)
              } catch {

              }
            }
          } if (keys[i] && keys[i]["estamina"] && keys[i]["estamina"].active){
            if (keys[i]["estamina"] !== undefined) {
              try {
                const channel = (await API.client.channels.fetch(keys[i]["estamina"].channelid)) || (API.client.channels.cache.get(keys[i]["estamina"].channelid))
                if (!channel) return
                this.loadold("estamina", keys[i].memberid, channel)
              } catch {

              }
            }
          } if (((!keys[i]["energia"] || !keys[i]["energia"].active) && (!keys[i]["estamina"] || !keys[i]["estamina"].active))) {
            remembermap.delete(keys[i].memberid)
          }
        }

      }

      this.save()

  }

  remember.save = async function(){
    let keys = Array.from( remembermap.values() );
    DatabaseManager.set(API.id, 'globals', 'remember', keys)
  }

  remember.includes = function(user_id, type) {
    return remembermap.has(user_id) && remembermap.get(user_id)[type] && remembermap.get(user_id)[type].active
  }

  remember.add = function(user_id, channelid, type) {

    let obj = {
      memberid: user_id
    }

    if (remembermap.has(user_id)) {
      obj = remembermap.get(user_id)
    }

    obj[type] = {
      channelid,
      active: false
    }

    if (!this.includes(user_id, type)) {
      obj[type].active = true
      obj[type].channelid = channelid
      remembermap.set(user_id, obj)
    }

    this.save()
  }

  remember.remove = function(user_id, type) {
    
    if (this.includes(user_id, type)) {
      let obj = remembermap.get(user_id)
      obj[type].active = false
      remembermap.set(user_id, obj)
    }

    const mapped = remembermap.get(user_id)

    if ((!mapped["energia"] || !mapped["energia"].active) && (!mapped["estamina"] || !mapped["estamina"].active)) {
      remembermap.delete(user_id)
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