const crateExtension = {

    obj: {}
    
};
const API = require("../api.js");

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    while (0 !== currentIndex) {

      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

crateExtension.load = async function() {

    const { readFileSync } = require('fs')
    const path = './_json/crates.json'
    try {
      if (path) {
        const jsonString = readFileSync(path, 'utf8')
        const customer = JSON.parse(jsonString);
        crateExtension.obj = customer;
      } else {
        console.log('File path is missing from crateExtension!')
        return `Error on pick crates obj`;
      }
    } catch (err) {
        console.log('Error parsing JSON string:', err);
        client.emit('error', err)
        return `Error on pick crates obj`;
    }

    let obj = crateExtension.obj;
    for (const key in obj) {
        const text =  `ALTER TABLE storage ADD COLUMN IF NOT EXISTS "crate:${key}" double precision NOT NULL DEFAULT 0;`
        try {
            await API.db.pool.query(text);
        } catch (err) {
            console.log(err.stack)
        }
    }
}

crateExtension.getCrates = async function(member) {

    let obj = crateExtension.obj;
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
    if (res) {
        for (const key in obj) {
            try{
            array.push(`${key};${res[`crate:${key}`]}`)
            }catch (err){
                client.emit('error', err)
            }
        }
    }
    return array;
}

crateExtension.getReward = function(id, size) {

    let arr = [];
    if (!size || size == 1) {
        let cr = API.random(0, 100)
        
        let crateobj = API.crateExtension.obj[id.toString()]
        
        let array2 = crateobj.rewards;
        
        if (typeof crateobj.rewards == 'string') {
            const droparr = API.itemExtension.getObj().drops

            let droparray = droparr

            array2 = shuffle(droparray)
            
            arr.push(array2[API.random(0, array2.length-1)]);
            
        } else {
            
            array2.sort(function(a, b){
                return a.chance - b.chance;
            });
            let acc = 0;
            for (const r of array2) {
                acc += r.chance;
                if (cr < acc) {
                    arr.push(r);
                    break;
                }
            }

        }

    } else {
        for (i = 0; i < size; i++){
            arr.push(crateExtension.getReward(id)[0]);
        }
    }

    return arr;
}

crateExtension.give = async function(member, id, quantia) {
    let obj = await API.getInfo(member, "storage");
    API.setInfo(member, "storage", `"crate:${id}"`, obj[`crate:${id}`] + quantia);
}

crateExtension.load();

module.exports = crateExtension;