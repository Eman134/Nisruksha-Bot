
const API = require("../api.js");

const Database = require('../manager/DatabaseManager');
const DatabaseManager = new Database();

const debugmode = false

const stars = {};
{
    stars.add = async function(user_id, company_id, options) {
        
        let memberobj = await DatabaseManager.get(user_id, 'players')
        let company = await get.companyById(company_id)
        
        let obj = (memberobj.companyact != null ? memberobj.companyact : {
            score: 0,
            last: Date.now(),
            rend: 0
        })
        
        if (options.score) {

            options.score = parseFloat(options.score).toFixed(2)
            
            API.setCompanieInfo(company.user_id, company_id, 'score', parseFloat(company.score) + parseFloat(options.score))
            obj.score = (parseFloat(obj.score) + parseFloat(options.score)).toFixed(2)
            obj.score = parseFloat(obj.score).toFixed(2)
            
        }
        
        if (options.rend) {
            obj.rend = parseInt(obj.rend) + Math.round(parseInt(options.rend))
        }
        
        obj.last = Date.now()
        
        obj.score = parseFloat(obj.score).toFixed(2)
        obj.rend = Math.round(parseInt(obj.rend))
        
        DatabaseManager.set(user_id, 'players', 'companyact', obj)
    }

    stars.gen = function() {
        let x1 = API.random(0, 3)
        let x2 = API.random(2, 6)

        let y = parseFloat('0.' + x1 + '' + x2)
        return y.toFixed(2)
    }

}

const check = {};
{
check.hasCompany = async function(user_id){
    let cont = false;
    try {
        let res = await DatabaseManager.query(`SELECT * FROM companies;`);
        for (const r of res.rows) {
            if (r.user_id == user_id && r.type != 0) {
                cont = true;
                break;
            }
        }
    }catch (err) { 
        API.client.emit('error', err)
        throw err 
    }

    return cont
}

check.isWorker = async function(user_id) {
    const obj = await DatabaseManager.get(user_id, 'players')
    const company = await get.companyById(obj.company)
    if (!company) {
        await DatabaseManager.set(user_id, 'players', 'company', null)
        return false
    }
    return obj.company != null;
}

check.hasVacancies = async function(company_id) {
    let result = true;

    try {
        const owner = await API.company.get.ownerById(company_id)
        const res = await DatabaseManager.query(`SELECT * FROM companies WHERE company_id=$1 AND user_id=$2;`, [company_id, owner.id]);
        if (res.rows[0].workers != null && res.rows[0].workers != undefined && res.rows[0].workers.length >= res.rows[0].funcmax) result = false;
        if (res.rows[0].openvacancie == false) result = false;

    }catch (err){
        API.client.emit('error', err)
        throw err
    }

    return result
}
check.hasVacanciesByCompany = async function(company) {
    let result = true;

    try {
        if (company.workers != null && company.workers != undefined && company.workers.length >= company.funcmax) result = false;
        if (company.openvacancie == false) result = false;

    }catch (err){
        API.client.emit('error', err)
        throw err
    }

    return result
}
}

const get = {};
{
get.maxWorkers = async function(company_id) {
    let result = 3;

    try {
        let res = await API.company.get.companyById(company_id)
        result = res.funcmax

    }catch (err){
        API.client.emit('error', err)
        throw err
    }

    return result
}

get.companyById = async function(company_id) {
    let res
    try {
        
        const owner = await API.company.get.ownerById(company_id)

        if (owner == null) return undefined

        res = await DatabaseManager.query(`SELECT * FROM companies WHERE company_id=$1 AND user_id=$2;`, [company_id, owner.id]);

        res = res.rows[0];

    }catch (err){
        API.client.emit('error', err)
        throw err
    }

    return res;
}

get.ownerById = async function(company_id) {
    let res
    try {
        
        res = await DatabaseManager.query(`SELECT * FROM companies WHERE company_id=$1;`, [company_id]);

        res = res.rows[0];

    }catch (err){
        API.client.emit('error', err)
        throw err
    }

    if (!res) return null

    let result = await API.client.users.fetch(res.user_id)

    return result;
}

get.idByOwner = async function(user_id) {
    let res
    try {

        res = await DatabaseManager.query(`SELECT * FROM companies WHERE user_id=$1;`, [user_id]);

        res = res.rows[0];

    }catch (err){
        API.client.emit('error', err)
        throw err
    }

    if (res == undefined) return null

    let result = res.company_id

    return result;
}

get.companyByOwnerId = async function(user_id) {
    let res
    try {

        res = await DatabaseManager.query(`SELECT * FROM companies WHERE user_id=$1;`, [user_id]);

        res = res.rows[0];

    }catch (err){
        API.client.emit('error', err)
        throw err
    }

    if (res == undefined) return null

    let result = res

    return result;
}
}

const jobs = { 
    explore: {
        mobs: {
            obj: {}
        },
        equips: {
            obj: {}
        },
    },
    fish: {
        update: 5,
        rods: {
            obj: {}
        },
        list: {
            obj: {}
        }
    },
    agriculture: {
        update: 15
    },
    process: {
        update: 40,
        tools: {
            obj: {}
        },
        current: [],
        lastprocess: new Map()
    }
};

// Exploração
{

    jobs.explore.mobs.get = function() {
        if (Object.keys(jobs.explore.mobs.obj).length == 0) jobs.explore.mobs.load();
        return jobs.explore.mobs.obj;
    }

    jobs.explore.mobs.load = function() {

        const { readFileSync } = require('fs')
        const path = './_json/companies/exploration/mobs.json'
        try {
        if (path) {
            const jsonString = readFileSync(path, 'utf8')
            const customer = JSON.parse(jsonString);
            jobs.explore.mobs.obj = customer;
            if (API.debug) console.log(`Mob list loaded`)
        } else {
            console.log('File path is missing from shopExtension!')
            jobs.explore.mobs.obj = '`Error on load mob list`';
        }
        } catch (err) {
            console.log('Error parsing JSON string:', err);
            jobs.explore.mobs.obj = '`Error on load mob list`';
            API.client.emit('error', err)
        }
    
    }

    jobs.explore.searchMob = function(level) {

        let mobs = jobs.explore.mobs.get();

        let filteredmobs = mobs.filter((mob) => level+1 >= mob.level)

        if (filteredmobs.length == 0) {

            filteredmobs = mobs.slice((level-5 < 0 ? 0 : level-5), level+1)

            if (filteredmobs.length == 0) {

                API.company.jobs.explore.mobs.obj = []

                mobs = jobs.explore.mobs.get();

                filteredmobs = mobs.filter((mob) => level+1 >= mob.level)

                if (filteredmobs.length == 0) {

                    API.client.emit('error', 'Search mob fail: filteredmobs length == 0\nLevel: ' + level)
                    console.log('error', 'Search mob fail: filteredmobs length == 0\nLevel: ' + level)
                    return undefined

                }

            }
		}

        filteredmobs.sort(function(a, b){
            return b.level - a.level;
        });

        filteredmobs = filteredmobs.slice(0, 6)

        filteredmobs.sort(function(a, b){
            return a.level - b.level;
        });
        
        var generateProportion = function() {
            var max = 100,
              segmentMax = 60,
              tempResults = [],
              remaining = max,
              segments = filteredmobs.length,
              finalResults = [];
              
              //create a series of random numbers and push them into an array
             for (var i = 1; i <= segments; i++) {
                 var r = Math.random() * segmentMax;
              if (i === segments) {
                  // the final segment is just what's left after the other randoms are added up
                  r = remaining;
              }
              tempResults.push(r);
              // subtract them from the total
              remaining -= r;
              // no segment can be larger than what's remaining
              segmentMax = remaining;
            }
            
            //randomly shuffle the array into a new array
            while (tempResults.length > 0) {
                var index = Math.floor(Math.random() * tempResults.length);
                finalResults = finalResults.concat(tempResults.splice(index, 1));
            }
            return finalResults;
        }
        
        //let resultmob = filteredmobs[API.random(0, tonum)]

        var proportion = generateProportion();
        proportion.sort(function(a, b){
            return b - a;
        });
        let tonum = 0;
        let totalchance = 0;
        for (const r of filteredmobs) {
            r.chance = Math.round(proportion[tonum])
            totalchance += Math.round(proportion[tonum]);
            tonum++;
        }

        if (totalchance < 100) {
            filteredmobs[0].chance += 100-totalchance
        }
        
        filteredmobs.sort(function(a, b){
            return a.chance - b.chance;
        });

        if (API.debug) console.log(filteredmobs)

        let resultmob
        let cr = API.random(0, 100)
        let acc = 0;
        for (const r of filteredmobs) {
            acc += r.chance;
            if (cr < acc) {
                resultmob = r;
                break;
            }
        }
        
        resultmob.csta = resultmob.sta
        if (API.random(0, 50) < 25)resultmob.level += API.random(0, 3)
        else if (resultmob.level > 10) resultmob.level -= API.random(0, 3)
        if (API.debug)console.log(resultmob)
        return resultmob;

    }

    jobs.explore.equips.get = function(level, qnt) {
        if (Object.keys(jobs.explore.equips.obj).length == 0) jobs.explore.equips.load();

        let equipobj = jobs.explore.equips.obj;
        
        let filteredequips = equipobj.filter((r) => level+1 >= r.level).sort(function(a, b){
            return b.level - a.level;
        });

        if (filteredequips.length == 0) return undefined;

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

        filteredequips = filteredequips.slice(0, qnt*2);

        shuffle(filteredequips)

        filteredequips = filteredequips.slice(0, qnt)

        if (API.debug)console.log(`${filteredequips.map(e => e.name).join(', ')}`.yellow)
        for (const r of filteredequips) {

            if(!r.dmg) r.dmg = r.level+1*((120-(r.chance*1.13))*0.75/2)
            r.dmg = Math.round(r.dmg);

        }

        filteredequips.sort(function(a, b){
            return b.dmg - a.dmg;
        });


        return filteredequips;

    }

    jobs.explore.equips.load = function() {
        const { readFileSync } = require('fs')
        const path = './_json/companies/exploration/equip.json'
        try {
        if (path) {
            const jsonString = readFileSync(path, 'utf8')
            const customer = JSON.parse(jsonString);
            jobs.explore.equips.obj = customer;
            if (API.debug) console.log(`Equip list loaded`.yellow)
        } else {
            console.log('File path is missing from shopExtension!')
            jobs.explore.equips.obj = '`Error on load equip list`';
        }
        } catch (err) {
            console.log('Error parsing JSON string:', err);
            jobs.explore.equips.obj = '`Error on load equip list`';
            API.client.emit('error', err)
        }
    }

}

// Agricultura
{
    jobs.agriculture.calculatePlantTime = function(plant, adubacao) {

        let ms = 0;

        let seedPerArea = (Math.round(plant.qnt/plant.area))+2

        ms = (200-adubacao)*seedPerArea*(230000)
        ms += (plant.price*500000)+1

        return Math.round(ms)
    }
}

// Pescaria
{

    jobs.formatStars = function(stars) {
        return '⭐'.repeat(stars)
    }

    jobs.fish.rods.get = function(level) {

        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;
          
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
          
              // Pick a remaining element...
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex -= 1;
          
              // And swap it with the current element.
              temporaryValue = array[currentIndex];
              array[currentIndex] = array[randomIndex];
              array[randomIndex] = temporaryValue;
            }
          
            return array;
        }

        let filteredequips = jobs.fish.rods.possibilities(level)

        shuffle(filteredequips)

        return filteredequips[0];

    }

    jobs.fish.rods.possibilities = function(level) {
        if (Object.keys(jobs.fish.rods.obj).length == 0) jobs.fish.rods.load();

        let equipobj = jobs.fish.rods.obj;
        
        let num = 0;
        let filteredequips = [];
        for (const r of equipobj) {
              
            
            if (level >= r.level) {
                filteredequips.push(r);
            }

            num++;
        }

        if (filteredequips.length == 0) return undefined;

        filteredequips.sort(function(a, b){
            return b.level - a.level;
        });

        filteredequips = filteredequips.slice(0, 3)

        return filteredequips;

    }

    jobs.fish.rods.load = function() {
        const { readFileSync } = require('fs')
        const path = './_json/companies/fish/rods.json'
        try {
        if (path) {
            const jsonString = readFileSync(path, 'utf8')
            const customer = JSON.parse(jsonString);
            jobs.fish.rods.obj = customer;
            if (API.debug) console.log(`rods list loaded`.yellow)
        } else {
            console.log('File path is missing from shopExtension!')
            jobs.fish.rods.obj = '`Error on load rods list`';
        }
        } catch (err) {
            console.log('Error parsing JSON string:', err);
            jobs.fish.rods.obj = '`Error on load rods list`';
            API.client.emit('error', err)
        }
    }

    jobs.fish.list.get = function(profundidademin, profundidademax) {

        if (Object.keys(jobs.fish.list.obj).length == 0) jobs.fish.list.load();

        let fishobj = jobs.fish.list.obj;
        
        let filteredfish = fishobj.filter((r) => {
            return r.profundidade >= profundidademin && r.profundidade <= profundidademax
        }).sort(function(a, b){
            return b.profundidade - a.profundidade;
        }).slice(0, 7)

        if (filteredfish.length == 0) return undefined;

        return filteredfish;

    }

    jobs.fish.list.load = function() {
        const { readFileSync } = require('fs')
        const path = './_json/companies/fish/mobs.json'
        try {
        if (path) {
            const jsonString = readFileSync(path, 'utf8')
            const customer = JSON.parse(jsonString);
            jobs.fish.list.obj = customer;
            if (API.debug) console.log(`fish list loaded`.yellow)
        } else {
            console.log('File path is missing from shopExtension!')
            jobs.fish.list.obj = '`Error on load fish list`';
        }
        } catch (err) {
            console.log('Error parsing JSON string:', err);
            jobs.fish.list.obj = '`Error on load fish list`';
            API.client.emit('error', err)
        }
    }


}

// Processamento
{

    jobs.process.load = async function() {

        const list = await jobs.process.get()

        for (let xilist = 0; xilist < list.length; xilist++) {

            jobs.process.loopProcess(list[xilist])

            if (debugmode) console.log('Loading: ' + list[xilist])

        }

        setInterval(async function() {

            const list2 = await jobs.process.get()

            for (xilist = 0; xilist < list2.length; xilist++) {

                const member = await API.client.users.fetch(list2[xilist])

                if (!jobs.process.current.includes(member.id)) {
                    jobs.process.current.push(member.id)
                    jobs.process.loopProcess(member.id)
                    if (debugmode) throw new Error(('Debugged 1: ' + member.id + ': está em processo :' + jobs.process.current.includes(member.id) + ': último processo :' + API.ms(Date.now()-jobs.process.lastprocess.get(member.id))));
                } else if (!jobs.process.lastprocess.get(member.id) || (jobs.process.lastprocess.get(member.id) && Date.now()-jobs.process.lastprocess.get(member.id) > 60000*30)) {
                    API.cacheLists.waiting.add(member.id, { url: '' }, 'working');
                    jobs.process.loopProcess(member.id)
                    if (debugmode) throw new Error(('Debugged 2: ' + member.id + ': está em processo :' + jobs.process.current.includes(member.id) + ': último processo :' + API.ms(Date.now()-jobs.process.lastprocess.get(member.id))));
                }

                if (debugmode) console.log('Debugging: ' + member.id + ': está em processo :' + jobs.process.current.includes(member.id) + ': último processo :' + API.ms(Date.now()-jobs.process.lastprocess.get(member.id)))

            }

        }, 1800000)
        
    }

    jobs.process.loopProcess = async function(user_id) {

        if (!await jobs.process.includes(user_id)) return

        async function st() {

            try {
                
                const players_utils = await DatabaseManager.get(user_id, 'players_utils')

                let processjson = players_utils.process

                if (processjson == null) {
                    API.cacheLists.waiting.remove(user_id, 'working');
                    return jobs.process.remove(user_id)
                }

                const inprocs = processjson.in.filter(processo => processo.fragments.current > 0)

                if (inprocs.length <= 0) {

                    jobs.process.remove(user_id)
                    API.cacheLists.waiting.remove(user_id, 'working');

                } else {

                    if (!API.shopExtension) return

                    const obj = await DatabaseManager.get(user_id, "machines")

                    let maq = API.shopExtension.getProduct(obj.machine);

                    for (let inprocsi = 0; inprocsi < inprocs.length; inprocsi++) {

                        const tool = processjson.tools[inprocs[inprocsi].tool]

                        const indexProcess = processjson.in.indexOf(inprocs[inprocsi])

                        if (inprocs[inprocsi].tool == 0 && API.random(0, 100) < 25) {
                            const percentdurability = Math.round(1*tool.durability.max/100)
                            if (processjson.tools[inprocs[inprocsi].tool].durability.current - percentdurability <= 0) {
                                processjson.tools[inprocs[inprocsi].tool].durability.current = 0
                            } else {
                                processjson.tools[inprocs[inprocsi].tool].durability.current -= percentdurability
                            }
                        }
                        if (inprocs[inprocsi].tool == 1 && API.random(0, 100) < 25) {
                            if (processjson.tools[inprocs[inprocsi].tool].fuel.current - processjson.tools[inprocs[inprocsi].tool].fuel.consume <= 0) {
                                processjson.tools[inprocs[inprocsi].tool].fuel.current = 0
                            } else {
                                processjson.tools[inprocs[inprocsi].tool].fuel.current -= processjson.tools[inprocs[inprocsi].tool].fuel.consume
                            }
                        }

                        function sendDrop() {

                            const check0 = API.random(0, 100) < 35
                            const check1 = (API.random(0, tool.potency.max) < tool.potency.current)
                            const check2 = (API.random(0, 100) < Math.round(tool.potency.current/tool.potency.max*100))

                            if (check0 && check1 && check2) {
                                    
                                const gnR = API.random(0, 100, true)

                                let chance = 0
                                let selectedRarity
                                for (const ri in tool.drops) {
                                    chance += tool.drops[ri]
                                    if (gnR <= chance) {
                                        selectedRarity = ri
                                        break;
                                    }
                                }

                                if (!selectedRarity) selectedRarity = "common"

                                const drops = API.itemExtension.getObj().drops.filter((r) => r.levelprocess)

                                let filtereddrop = drops.filter((r) => r.rarity == selectedRarity && obj.level+6 >= r.levelprocess)
                                
                                filtereddrop = filtereddrop.sort(function(a, b){
                                    return b.levelprocess - a.levelprocess;
                                }).slice(0, 8)

                                filtereddrop = filtereddrop[API.random(0, filtereddrop.length-1)]

                                if (filtereddrop) {
                                    const droplist = processjson.in[indexProcess].drops || []
                                    const dropInList = droplist.find((r) => r.name == filtereddrop.name)
                                    if (dropInList) {
                                        const indexDropInList = processjson.in[indexProcess].drops.indexOf(dropInList)
                                        if (indexDropInList >= 0) {
                                            droplist[indexDropInList].quantia += 1
                                            droplist[indexDropInList].size += 1
                                        }
                                    } else {
                                        filtereddrop.size = 1
                                        filtereddrop.quantia = 1
                                        droplist.push(filtereddrop)
                                    }
                                    processjson.in[indexProcess].drops = droplist
                                }
                                
                                const xpbase = API.random(6, 25)

                                processjson.in[indexProcess].xpbase += xpbase // ADICIONAR XP BASE
                                processjson.in[indexProcess].xp += Math.round((xpbase * (maq.tier+1))/1.35) // ADICIONAR XP TOTAL
                                processjson.in[indexProcess].score = parseFloat(API.company.stars.gen()).toFixed(2) // ADICIONAR SCORE

                            }

                        }

                        function processed() {
                            sendDrop()
                            processjson.in[indexProcess].fragments.current -= 1

                            processjson.tools[inprocs[inprocsi].tool].toollevel.exp += API.random(30, 130)

                            const maxexp = processjson.tools[inprocs[inprocsi].tool].toollevel.max*processjson.tools[inprocs[inprocsi].tool].toollevel.max*100

                            if (processjson.tools[inprocs[inprocsi].tool].toollevel.exp >= maxexp) {
                                processjson.tools[inprocs[inprocsi].tool].toollevel.exp = 0
                                if (processjson.tools[inprocs[inprocsi].tool].toollevel.current < processjson.tools[inprocs[inprocsi].tool].toollevel.max) {
                                    processjson.tools[inprocs[inprocsi].tool].toollevel.current += 1

                                    if (processjson.tools[inprocs[inprocsi].tool].toollevel.current >= processjson.tools[inprocs[inprocsi].tool].toollevel.max) {

                                        const newtool = API.company.jobs.process.tools.search(obj.level, inprocs[inprocsi].tool)

                                        if (processjson.tools[inprocs[inprocsi].tool].name != newtool.name) {
                                            processjson.tools[inprocs[inprocsi].tool] = newtool
                                        } else {
                                            processjson.tools[inprocs[inprocsi].tool].toollevel.current = Math.round(processjson.tools[inprocs[inprocsi].tool].toollevel.max/2)
                                        }

                                    }

                                }
                            }

                        }

                        if (inprocs[inprocsi].tool == 0 && processjson.tools[inprocs[inprocsi].tool].durability.current > 0) {
                            processed()
                            API.cacheLists.waiting.add(user_id, { url: '' }, 'working');
                        } if(inprocs[inprocsi].tool == 1 && processjson.tools[inprocs[inprocsi].tool].fuel.current > 0) {
                            processed()
                            API.cacheLists.waiting.add(user_id, { url: '' }, 'working');
                        }
                        
                        if ((processjson.tools[0].durability.current <= 0) && (processjson.tools[1].fuel.current <= 0)) {
                            API.cacheLists.waiting.remove(user_id, 'working');
                            await jobs.process.remove(user_id)
                            return
                        }

                    }

                    DatabaseManager.set(user_id, 'players_utils', 'process', processjson)

                    const timetoone = API.company.jobs.process.calculateTime(processjson.tools[processjson.in[0].tool].potency.current, 1)

                    if (debugmode) console.log(API.getFormatedDate() + ' Processed | ' + user_id + ' | ' + API.ms2(timetoone))

                    jobs.process.lastprocess.set(user_id, Date.now())

                    setTimeout(() => { st( )}, timetoone)

                }


            } catch (error) {
                throw error
            }
            
        }

        if (!jobs.process.current.includes(user_id)) {
            jobs.process.current.push(user_id)
            if (debugmode) console.log('Starting: ' + user_id)
        }

        st()

    } 

    jobs.process.get = async function() {

        const globalobj = await DatabaseManager.get(API.id, 'globals');
        const processinglist = globalobj.processing
        
        if (processinglist == null) return []
    
        return processinglist
    
    }
    
    jobs.process.includes = async function(user_id){
    
        const list = await jobs.process.get()
    
        return list.includes(user_id)
    }
    
    jobs.process.remove = async function(user_id){
    
      const list = await jobs.process.get()
    
      const index = list.indexOf(user_id);
      if (index > -1) {
        list.splice(index, 1);
        await DatabaseManager.set(API.id, 'globals', 'processing', list)
      }

      if (jobs.process.current.indexOf(user_id) > -1) {
        jobs.process.current.splice(jobs.process.current.indexOf(user_id), 1);
      }
    
    }
    
    jobs.process.add = async function(user_id) {
    
      const list = await jobs.process.get()
    
      if (!(list.includes(user_id))) {
        list.push(user_id)
        await DatabaseManager.set(API.id, 'globals', 'processing', list)
        jobs.process.loopProcess(user_id)
      } 
    
    }

    jobs.process.tools.load = function() {
        const { readFileSync } = require('fs')
        const path = './_json/companies/process/tools.json'
        try {
        if (path) {
            const jsonString = readFileSync(path, 'utf8')
            const customer = JSON.parse(jsonString);
            jobs.process.tools.obj = customer;
            if (API.debug) console.log(`Tools list loaded`.yellow)
        } else {
            console.log('File path is missing from shopExtension!')
            jobs.process.tools.obj = '`Error on load tools list`';
        }
        } catch (err) {
            console.log('Error parsing JSON string:', err);
            jobs.process.tools.obj = '`Error on load tools list`';
            API.client.emit('error', err)
        }

    }

    
    jobs.process.tools.search = function(level, tooltype) {

        if (Object.keys(jobs.process.tools.obj.length == 0)) jobs.process.tools.load();

        let equipobj = jobs.process.tools.obj[tooltype];
        
        let filteredequip = equipobj.filter((r) => level >= r.level).sort(function(a, b){
            return b.level - a.level;
        })[0]

        return filteredequip;

    }

    jobs.process.translatePotency = function(potency) {

        if (potency < 40) return "Baixa potência"

        if (potency < 70) return "Média potência"

        if (potency < 100) return "Alta potência"

        return "Não foi possível definir a potência"
    }

    jobs.process.calculateTime = function(potency, qnt) {

        let ms = qnt*jobs.process.update*1250*(potency/12)

        return Math.round(ms)
    }

}

const company = {
    check,
    get,
    stars,
    jobs,
    e: {
        'agricultura': {
            tipo: 1, 
            icon: '<:icon1:745663998854430731>',
            description: 'Um setor de empresa onde você tem a liberdade de adquirir lotes de terras pelas vilas e fazer suas plantações, assim gerando recursos e vendendo-os.'
        },
        'exploração': {
            tipo: 2, 
            icon: '<:icon2:745663998938316951>',
            description: 'O setor de empresa perfeito para você que gosta de muita ação, você irá caçar pelas vilas monstros e abatendo-os, conseguindo recursos muito valiosos!'
        },
        'tecnologia': {
            tipo: 3, 
            icon: '<:icon3:745663998871076904>',
            description: ''
        }, 
        'hackeamento': {
            tipo: 4, 
            icon: '<:icon4:745663998887854080>',
            description: ''
        }, 
        'segurança': {
            tipo: 5, 
            icon: '<:icon5:745663998900568235>',
            description: ''
        },
        'pescaria': {
            tipo: 6, 
            icon: '<:icon6:830966666082910228>',
            description: 'Nesse setor você compra varas de pesca e dá upgrade nelas para alcançar maiores profundidades, fique rico vendendo peixes, que vença o melhor pescador!'
        },
        'processamento': {
            tipo: 7, 
            icon: '<:icon7:851946616738152478>',
            description: 'Com o setor de processamento você pode preparar, melhorar e escolher dentre algumas ferramentas para poder processar seus fragmentos e minérios coletados, podendo vendê-los a um preço alto.'
        }
    },
    types: {
        1: 'agricultura',
        2: 'exploração',
        3: 'tecnologia',
        4: 'hackeamento',
        5: 'segurança',
        6: 'pescaria',
        7: 'processamento'
    }
};

company.create = async function(member, ob) {
    async function gen() {
        
        function makeid(length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345678901234567890123456789012345678901234567890123456789';
            var charactersLength = characters.length;
            for ( var i = 0; i < length; i++ ) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }

        let code = `${makeid(6)}`;
        
        try {
            let res = await DatabaseManager.query(`SELECT * FROM companies WHERE company_id=$1;`, [code]);
            const embed = new API.Discord.MessageEmbed();

            if (!res.rows[0]) {
                try {

                    townnum = await API.townExtension.getTownNum(member.id);
                    townname = await API.townExtension.getTownName(member.id);

                    embed.setTitle(`Nova empresa!`) 
                    .addField(`Informações da Empresa`, `Fundador: ${member}\nNome: **${ob.name}**\nSetor: **${ob.icon} ${ob.setor.charAt(0).toUpperCase() + ob.setor.slice(1)}**\nLocalização: **${townname}**\nCódigo: **${code}**`)
                    embed.setColor('#42f57e')
                    API.client.channels.cache.get('747490313765126336').send({ embeds: [embed]});;
                    await DatabaseManager.query(`DELETE FROM companies WHERE user_id=${member.id};`).catch();
                    await API.setCompanieInfo(member.id, code, 'company_id', code)
                    await API.setCompanieInfo(member.id, code, 'type', ob.type)
                    await API.setCompanieInfo(member.id, code, 'name', ob.name)
                    await API.setCompanieInfo(member.id, code, 'loc', townnum)

                    return code;
                }catch (err){
                    API.client.emit('error', err)
                    console.log(err)
                }
            } else {
                try{
                    embed.setDescription(`Failed on generating company ${ob.type}:${ob.name} with code ${code}; Try by ${member}`)
                    embed.setColor('#eb4828')
                    API.client.channels.cache.get('747490313765126336').send({ embeds: [embed]});;
                }catch (err){
                    API.client.emit('error', err)
                    console.log(err)
                }
                await gen();
            }
        } catch (err) {
            API.client.emit('error', err)
            throw err
        }



    }

    return await gen();

}

module.exports = company;