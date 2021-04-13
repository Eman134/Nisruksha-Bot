

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
{
  remember.includes = function() {
    
  }
}

module.exports = {

    waiting,
    rememberenergy: [],
    rememberstamina: []
    
}