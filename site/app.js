const API = require('../_classes/api')
const config = require('../_classes/config')
const ip = config.ip
const appconfig = config.app
let ssl = ""
if (config.ssl) ssl += "s"

const express = require("express");

const app = express();
//app.engine('html', require('ejs').renderFile);
//app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

app.set("views", __dirname);
const fetch = require('node-fetch')
let OAuthClient = require('disco-oauth')
let cookies = require('cookies')
let oauthClient = new OAuthClient(appconfig.id, appconfig.secret)
oauthClient.setScopes('identify', 'guilds', 'guilds.join')
oauthClient.setRedirect('http' + ssl + '://' + ip + (config.port != 80 ? ':' + config.port : '') + appconfig.callback)
console.log(`[APP] Redirect setado em 'http${ssl}://${ip}${config.port != 80 ? ':' + config.port : ''}${appconfig.callback}'`.green)


app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookies.express(["some", "random", "keys"]))
app.use(express.static(__dirname + '/public'));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
let path = require('path')
app.set('views', path.join(__dirname, 'views')); 


let response = new Map();
let timeoutin = appconfig.system.timeout

// Timeout system

async function runAction(id, res, redirect) {
  if (!response.get(id)) {
    response.set(id, {
      last: Date.now()
    })
    return false;
  }
  if (API.owner.includes(id)) {
    response.set(id, {
      last: Date.now()
    })
    return false;
  }
  if ((Date.now() - response.get(id).last) > timeoutin) {
    response.set(id, {
      logout: true
    })
    if (redirect) res.redirect('/')
    return true
  } else {
    response.set(id, {
      last: Date.now()
    })
    return false;
  }

}

async function pickUser(req, res, require) {
  let key = req.cookies.get('key')
  let user
  if (key) {
    try {
      user = await oauthClient.getUser(key)
    } catch {
      if (!user) {
        user = undefined
      }  
    }
  }
  if (user) {
    user = await API.client.users.fetch(user.id)
    if (await runAction(user.id, res, true)) return res.redirect("/")
  } else if (require) {
    await res.cookies.set('withLog', "requireLogged")
    return res.redirect("/")
  }

  return user

}

// List Archived

app.get('/me/list', async (req, res) => {
  
  try {
    let key = req.cookies.get('key')
    let user
    if (key) {
      user = await oauthClient.getUser(key)
    } 
  
    if (!user) return res.redirect(oauthClient.authCodeLink)

    user = await API.client.users.fetch(user.id)
    let owner = false
    if (API.owner.includes(user.id)) {
      owner = !owner
    }
    if (user) {

      if (await runAction(user.id, res, true)) return
      
      API.getInfo(user, "site").then(data => {
        res.render('list', {
          API,
          user,
          owner,
          data
        })
      }).catch(err => res.status(400).json(err));
    }
  } catch (err) {
    client.emit('error', err)
    res.status(500).send(err)
  }

});

app.post("/me/list/addTask", async (req, res) => {

  let key = req.cookies.get('key')
  let user
  if (key) {
    user = await oauthClient.getUser(key)
  }

  if (!user) return res.redirect(oauthClient.authCodeLink)

  user = await API.client.users.fetch(user.id)

  let owner = false
  if (API.owner.includes(user.id)) {
    owner = !owner
  }
  if (user) {

    if (await runAction(user.id, res, true)) return

    const { textTodo } = req.body;

    if (textTodo.length == 0) {
      return res.send("cd")
    }

    let xy = await API.getInfo(user, "site")
    
    let lis = xy.todo || []

    for (const x of lis) {
      if (textTodo.toLowerCase() == x.task.toLowerCase()) {
        return res.send("ja tem")
      }
    }

    lis.unshift({
      task: textTodo,
      status: 0
    })
      API.setInfo(user, 'site', 'todo', lis).then(_=> {
        //res.redirect("/user/" + user.id + "/list");
        API.siteExtension.log(user.id, 'Adicionou um item á lista: ' + textTodo)

      }).catch(err => {
        console.log(err)
        res.status(400).json({ message: "unable to create a new task"});
      });


  } else {
    res.status(400).json('Unknown user')
  }

});

app.put("/me/list/moveTaskDone", async (req, res) => {

  const { name, task } = req.body;

  let key = req.cookies.get('key')
  let user
  if (key) {
    user = await oauthClient.getUser(key)
  }

  if (!user)return res.redirect(oauthClient.authCodeLink)

  user = await API.client.users.fetch(user.id)

  if (await runAction(user.id, res, true)) return
  
  if (name.includes("todo")) {

    let xy = await API.getInfo(user, "site")

    let y = xy.todo || []
    
    for (const x of y) {
      if (x.task == task) {
        x.status = 1
        break;
      }
    }

    API.setInfo(user, "site", "todo", y)
    res.json(1)

  } else {

    let xy = await API.getInfo(user, "site")

    let y = xy.todo || []

    for (const x of y) {
      if (x.task == task) {
        x.status = 0
        break;
      }
    }

    API.setInfo(user, "site", "todo", y)
    res.json(0)
  }

});

app.get("/me", async function (req, res) {
  
  let key = req.cookies.get('key')
  let user
  if (key) {
    user = await oauthClient.getUser(key)
  }

  if (!user) {
    return res.redirect(oauthClient.authCodeLink)
  } 

  user = await API.client.users.fetch(user.id)

  if (await runAction(user.id, res, true)) return

  if (key) {

    let guilds = await oauthClient.getGuilds(key)

    
    let filtered = []

    for (const r of guilds) {
      let guild = API.client.guilds.cache.get(r[1]._id)
      if (guild) {
        let x = r[1]
        x.id = x._id
        x.icon = x._iconHash
        x.name = x._name
        filtered.push(x)
      }
    }

    let owner = false
    if (API.owner.includes(user.id)) {
      owner = !owner
    }

    res.render('dash', {
      API,
      user,
      guilds: filtered,
      owner
    })

  }
});

// oAuth callback
app.get(appconfig.callback, async function (req, res) {


  let code = req.query.code
  if (!code) {
    await res.cookies.set('withLog', "loginerror")
    res.redirect('/')
  } else {

    let userkey = await oauthClient.getAccess(code).catch((err) => {
      console.log(err); 
      client.emit('error', err)
      res.send(err)
    })
    res.cookies.set('key', userkey)
    await res.cookies.set('withLog', "login")
    res.redirect('/')
    let user2 = await oauthClient.getUser(userkey)
    let user = await API.client.users.fetch(user2.id)

    if (await runAction(user.id, res, true)) return
    let info = await API.getInfo(user, "site")

    if (info.first) {
      API.siteExtension.log(user2.id, 'Logou no site pela primeira vez\nIP: ' + await getIp())
      API.setInfo(user, "site", "first", false)
    }
    else { 
      API.siteExtension.log(user2.id, 'Logou no site\nIP: ' + await getIp())

    }

    
    const fetch = require('node-fetch');

    const guildMembersResponse = fetch(`http://discordapp.com/api/guilds/693150851396796446/members/${user2.id}`,
            {
              method: 'PUT',
              headers: {
                "Authorization": "Bot [botToken]",
                "Content-Type": "application/json",
              }
            });
            setTimeout(() => {
                console.log(guildMembersResponse)
            }, 500);

    
  }

});

// Redirect to oAuth
app.get("/oauth2", async function (req, res) {

  let key = req.cookies.get('key')

  if (key) {
    res.redirect('/')
  } else {
    res.redirect(oauthClient.authCodeLink)
  }
  

});

// oAuth logout
app.get("/logout", async function (req, res) {

  let key = req.cookies.get('key')

  if (key) {
    let user2 = await oauthClient.getUser(key)
    API.siteExtension.log(user2.id, 'Deslogou do site')
    await res.cookies.set('key', undefined)
    await res.cookies.set('withLog', "logout")
  }
  res.redirect('/')
  
});

// Index
app.get("/", async function (req, res) {

  let user = await pickUser(req, res)

  let timeout = false
  if (user) {
    if ((response.get(user.id) != undefined && response.get(user.id).logout == true)) {
      API.siteExtension.log(user.id, 'Desconectado por inatividade')
      await res.cookies.set('key', undefined)
      response.delete(user.id)
      timeout = true
      user = undefined
    } else {

      let boo = await runAction(user.id, res, false)
      if (boo) {
        API.siteExtension.log(user.id, 'Desconectado por inatividade')
        await res.cookies.set('key', undefined)
        response.delete(user.id)
        timeout = true
        user = undefined
      }

    }
  }

  
  let login = false
  let logout = false
  let loginerror = false
  let log404 = false
  let requireLogged = false;
  
  if (req.cookies.get('withLog') != undefined) {

    if (req.cookies.get('withLog') == "login") login = true

    if (req.cookies.get('withLog') == "logout") logout = true

    if (req.cookies.get('withLog') == "loginerror") loginerror = true

    if (req.cookies.get('withLog') == "log404") log404 = true

    if (req.cookies.get('withLog') == "requireLogged") requireLogged = true

    await res.cookies.set('withLog', undefined)

  }

    res.render("index", {
      API,
      user,
      logout,
      login,
      loginerror,
      log404,
      requireLogged,
      timeout
    });

  

});

app.get("/terms", async (req, res) => {

  
    const user = await pickUser(req, res)
      
    let owner = false
    if (user) {
      if (API.owner.includes(user.id)) { 
        owner = !owner
      }
    }
    
    res.render('terms', {
      API,
      user,
      owner
    })
    
  
})

app.get("/dashboard", async (req, res) => {

  
  const user = await pickUser(req, res, true)
    
  let owner = false
  if (user) {
    if (API.owner.includes(user.id)) { 
      owner = !owner
    }
  }
  
  res.render('dashboard/dashboard', {
    API,
    user,
    owner
  })
  

})

app.get("/dashboard/guilds", async (req, res) => {

  
  const user = await pickUser(req, res, true)

  let key = req.cookies.get('key')

  if (!key) res.redirect('/logout')

  let guilds = await oauthClient.getGuilds(key)

  let filtered = []

  for (const r of guilds) {
    let guild = API.client.guilds.cache.get(r[0])
    if (guild) {
      let x = r[1]
      x.id = x._id
      x.icon = x._iconHash
      x.name = x._name
      filtered.push(x)
    }
  }
    
  let owner = false
  if (user) {
    if (API.owner.includes(user.id)) { 
      owner = !owner
    }
  }

  filtered.sort(function (a, b) {
	
    return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
   
  });

  let perm = false
  
  if (req.cookies.get('withLog') != undefined) {

    if (req.cookies.get('withLog') == "perm") perm = true

    await res.cookies.set('withLog', undefined)

  }
  
  res.render('dashboard/guilds', {
    API,
    user,
    owner,
    perm,
    guilds: filtered
  })
  

})

app.get("/dashboard/guilds/:id", async (req, res) => {

  
  const user = await pickUser(req, res, true)

  let key = req.cookies.get('key')

  if (!key) res.redirect('/logout')

  let guilds = await oauthClient.getGuilds(key)

  let guild

  let reqguildid = req.params.id

  if (!reqguildid) {return res.redirect('/dashboard/guilds')}


  for (const r of guilds) {
    let guild = API.client.guilds.cache.get(r[0])
    if (guild.id == reqguildid) {
      let x = r[1]
      x.id = x._id
      x.icon = x._iconHash
      x.name = x._name
      guild = x
      break;
    }
  }

  if (!guild) {
    res.cookies.set('withLog', "perm")
    return res.redirect('/dashboard/guilds')
  }
    
  let owner = false
  if (user) {
    if (API.owner.includes(user.id)) { 
      owner = !owner
    }
  }

  const svinfo = await API.serverdb.getServerInfo(guild.id)

  const cmds = svinfo.cmdsexec
  const lastcmd = cmds == 0 ? ("Nunca foi executado um comando") : ("Último comando executado há " + (API.ms2(Date.now()-svinfo.lastcmd)))
  
  res.render('dashboard/guild', {
    API,
    user,
    owner,
    guild,
    cmds,
    lastcmd
  })
  

})

app.get("/dashboard/me", async (req, res) => {

  
  const user = await pickUser(req, res, true)

  let key = req.cookies.get('key')

  if (!key) res.redirect('/logout')
    
  let owner = false
  if (user) {
    if (API.owner.includes(user.id)) { 
      owner = !owner
    }
  }

  makeBg(user).then((bg) => {
    res.render('dashboard/me', {
      API,
      user,
      owner,
      bg
    })
  })

  

})

app.use(function(req, res, next){
  res.status(404);
  res.cookies.set('withLog', "log404")
  res.redirect('/');
  return;

});

async function makeBg(member) {

  const check = await API.checkCooldown(member, "sitegenbg");
  if (check) return

  API.setCooldown(member, "sitegenbg", 5);

   // Draw bio
   const obj = await API.getInfo(member, "players")
   let bio = '';
   let perm = 0;
   // Color bord
   let textcolor = '#dedcde'
   let colors = {
       1: '#ffffff',
       2: '#2f7a78',
       3: '#739f3d',
       4: '#ff6f36',
       5: '#7936ff'
   }

   if (!(obj == undefined)) {
       bio = obj.bio;
       perm = obj.perm;
   }
   let background = await API.img.loadImage(`resources/backgrounds/profile/profile.png`)
   if (obj.bglink != null) {
       try{
           background2 = await API.img.loadImage(obj.bglink)
           res = await API.img.resize(background2, 900, 500)
           background = await API.img.drawImage(res, background, 0, 0)
       }catch(err){API.setInfo(member, 'players', 'bglink', null);API.sendErrorM(msg, `Houve um erro ao carregar seu background personalizado! Por favor não apague a mensagem de comando de background!\nEnvie uma nova imagem utilizando \`${API.prefix}background\``)}
   }

   // Draw username
   background = await API.img.drawText(background, `${member.username.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z</>.,+÷=_!@#$%^&*()'":;{}?¿ ])/g, '').trim()}.`, 30, './fonts/MartelSans-Regular.ttf', textcolor, 200, 52,3)
   background = await API.img.drawText(background, bio.replace(/<prefixo>/g, API.prefix), 27, './fonts/MartelSans-Regular.ttf', textcolor, 200, 117,3)
   // Draw circle avatar
   let avatar = await API.img.loadImage(member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
   avatar = await API.img.resize(avatar, 145, 145);
   avatar = await API.img.editBorder(avatar, 75, true)
   background = await API.img.drawImage(background, avatar, 10, 10)
   // Badge
   if (perm > 1) background = await API.img.drawImage(background, await API.img.loadImage(`resources/backgrounds/profile/${perm}.png`), 590, 27)

   // Town name and Mark
   /*let mark = await API.img.loadImage(`resources/backgrounds/map/mark.png`)
   mark = await API.img.resize(mark, 50, 50)
   let townname = await API.townExtension.getTownName(member);

   background = await API.img.drawImage(background, mark, 655, 27)
   background = await API.img.drawText(background, `${townname}`, 30, './fonts/MartelSans-Regular.ttf', textcolor, 705, 52,3)*/
   background = await API.img.drawText(background, `${obj.reps} REPS`, 30, './fonts/MartelSans-Regular.ttf', textcolor, 756, 50,4)

   const obj2 = await API.getInfo(member, "machines")

   let progress = await API.img.generateProgressBar(1, 75, 155, Math.round(100*obj2.xp/(obj2.level*1980)), 5, 1, colors[perm])
   background = await API.img.drawImage(background, progress, 5, 5)

   background = await API.img.drawText(background, `Nível atual: ${obj2.level}`, 20, './fonts/MartelSans-Bold.ttf', textcolor, 450, 445, 4)
   background = await API.img.drawText(background, `XP: ${obj2.xp}/${obj2.level*1980} (${Math.round(100*obj2.xp/(obj2.level*1980))}%)`, 20, './fonts/MartelSans-Bold.ttf', '#FFFFFF', 450, 475, 4)

   let progress2 = await API.img.generateProgressBar(0, 900, 17, Math.round(100*obj2.xp/(obj2.level*1980)), 10, 0, colors[perm])
   background = await API.img.drawImage(background, progress2, 0, 407)

   if (perm > 1) {

       let colorbord = await API.img.createImage(440, 2, colors[perm])
       let colorbord2 = await API.img.createImage(682, 2, colors[perm])
       let colorbord3 = await API.img.createImage(225, 2, colors[perm])

       background = await API.img.drawImage(background, colorbord, 186, 27)
       background = await API.img.drawImage(background, colorbord2, 186, 92)
       background = await API.img.drawImage(background, colorbord3, 643, 27)

   }

   console.log('GET bg TO ' + member.id + ' FROM ' + await getIp())
   return background.replace("image/octet-stream", "image/png")
} 

async function getIp() {

  const fetched = await fetch("https://checkip.amazonaws.com/")
  const ip = await fetched.text()
  return ip
}
  
module.exports = app