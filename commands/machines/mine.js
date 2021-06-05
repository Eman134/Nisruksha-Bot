module.exports = {
    name: 'minerar',
    aliases: ['m', 'mine'],
    category: 'Maquinas',
    description: 'Inicia sua máquina e cava as profundezas encontrando minérios sob a energia solar',
    mastery: 25,
	async execute(API, msg) {

        const Discord = API.Discord;
        const isFull = await API.maqExtension.storage.isFull(msg.author);
        const hasMachine = await API.maqExtension.has(msg.author);

        if (!(hasMachine)) {
            const embedtemp = await API.sendError(msg, `Você ainda não possui uma máquina!\nAcesse \`${API.prefix}loja maquinas\` para visualizar as maquinas disponíveis`)
            await msg.quote(embedtemp)
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'mining')) {
            const embedtemp = await API.sendError(msg, `Você já encontra-se minerando no momento! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})`)
            await msg.quote(embedtemp)
            return;
        }

		if (isFull) {
            const embedtemp = await API.sendError(msg, `Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize \`${API.prefix}armazém\` para visualizar seus recursos\nUtilize \`${API.prefix}vender\` para vender os recursos`)
            await msg.quote(embedtemp)
            return;
        }

        let playerobj = await API.getInfo(msg.author, 'machines');
        let maqid = playerobj.machine;

        let maq = API.shopExtension.getProduct(maqid);

        if (playerobj.durability <= Math.round(5*maq.durability/100)) {
            const embedtemp = await API.sendError(msg, `Sua máquina não possui durabilidade o suficiente para minerar!\nUtilize \`${API.prefix}loja reparos\` para visualizar os reparos disponíveis`)
            await msg.quote(embedtemp)
            return;
        }

        const eng = await API.maqExtension.getEnergy(msg.author);

        const engmax = await API.maqExtension.getEnergyMax(msg.author);

        if (eng < Math.round(15*engmax/100)) {
            const embedtemp = await API.sendError(msg, `Sua máquina precisa de no mínimo ${Math.round(15*engmax/100)} de energia para ligar\nVisualize a energia utilizando \`${API.prefix}energia\``)
            await msg.quote(embedtemp)
            return;
        }

        let init = Date.now();
        let profundidade = await API.maqExtension.getDepth(msg.author)

        let energymax = await API.maqExtension.getEnergyMax(msg.author)
        let progress = API.getProgress(8, '<:energyfull:741675235010674849>', '<:energyempty:741675234796503041>', await API.maqExtension.getEnergy(msg.author), energymax);

        let ep = await API.maqExtension.getEquipedPieces(msg.author);
        let armazematual = await API.maqExtension.storage.getSize(msg.author);
        let armazemmax = await API.maqExtension.storage.getMax(msg.author);
        let obj6 = await API.getInfo(msg.author, "machines");

        let timeupdate = API.maqExtension.update*1000

        const array = obj6.slots == null ? [] : obj6.slots
        for (const i of array){
            if (API.shopExtension.getProduct(i).typeeffect == 4) {
            timeupdate -= Math.round(API.shopExtension.getProduct(i).size*1000)
            };
        }

        let btn = API.createButton('stopBtn', 'red', 'Parar mineração')

        const embed = new Discord.MessageEmbed();
        embed.setTitle(`${maq.icon} ${maq.name}`).setColor("#36393f")
        embed.setDescription(`Minerador: ${msg.author}`);
        embed.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${armazematual}/${armazemmax}]g\nTotal coletado: 0g\nColetado neste update: 0g`)
        embed.addField(`<:info:736274028515295262> Informações da máquina`, `${ep == null || ep.length == 0?'\nChipes: Nenhum instalado\n': `\nChipes: [${ep.map((i) => `${API.shopExtension.getProduct(i).icon}`).join(', ')}]\n`}Profundidade: ${profundidade}m\nDurabilidade: ${Math.round(100*obj6.durability/maq.durability)}%`)
        embed.addField(`⛏ Informações de mineração`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEnergia: ${progress}`)
        embed.setFooter(`Tempo de atualização: ${timeupdate/1000} segundos\nTempo minerando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        
        let embedmsg
        try {
            embedmsg = await msg.quote(embed)
        } catch {
            API.cacheLists.waiting.remove(msg.author, 'mining');
            return
        }
        API.cacheLists.waiting.add(msg.author, embedmsg, 'mining');

        let totalcoletado = 0;
        let coletadox = new Map();

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id

        async function edit() {

            try{

                let profundidade = await API.maqExtension.getDepth(msg.author)

                let playerobj = await API.getInfo(msg.member, 'machines');
                let maqid = playerobj.machine;
                let maq = API.shopExtension.getProduct(maqid);

                let chipe = false
                const array00 = playerobj.slots == null ? [] : playerobj.slots
                for (const i of array00){
                    if (API.shopExtension.getProduct(i).typeeffect == 5) {
                        chipe = true
                        break;
                    };
                }

                const obj2 = await API.maqExtension.ores.gen(maq, profundidade, chipe);
                let sizeMap = new Map();
                let round = 0;
                let xp = API.random(15, 35);
                xp = await API.playerUtils.execExp(msg, xp);
                await API.maqExtension.removeEnergy(msg.author, 1);
				
                let rd = API.random(1, 16) * (maq.tier+1);
                if (playerobj.durability <= Math.round(maq.durability/100)) {
                    API.setInfo(msg.author, 'machines', 'durability', 0)

                } else {
                    const array = playerobj.slots == null ? [] : playerobj.slots
                    for (const i of array){
                        if (API.shopExtension.getProduct(i).typeeffect == 3) {
                        rd -= Math.round(API.shopExtension.getProduct(i).size*rd/100)
                        };
                    }
                    API.setInfo(msg.author, 'machines', 'durability', playerobj.durability-rd)
                }
                
                for await (const r of obj2) {


                    let size = r.size;

                    let arMax = await API.maqExtension.storage.getMax(msg.author);

                    if (await API.maqExtension.storage.getSize(msg.author)+size >= arMax) {
                        size -= (await API.maqExtension.storage.getSize(msg.author)+size-arMax)
                    }
                    totalcoletado += size;
                    if (coletadox.has(r.name)) coletadox.set(r.name, coletadox.get(r.name)+size)
                    else coletadox.set(r.name, size)
                    sizeMap.set(r.name, size)
                    API.maqExtension.storage.giveOre(msg.author, r.name, size)
                    round += size;

                    if (await API.maqExtension.storage.getSize(msg.author)+size >= arMax) break;
                    
                }
                
                let armazemmax2 = await API.maqExtension.storage.getMax(msg.author);
                ep = await API.maqExtension.getEquipedPieces(msg.author);
                let energymax = await API.maqExtension.getEnergyMax(msg.author)
                const e = await API.maqExtension.getEnergy(msg.author);
                let progress2 = API.getProgress(8, '<:energyfull:741675235010674849>', '<:energyempty:741675234796503041>', e+1, energymax);
                embed.fields = [];
                const obj6 = await API.getInfo(msg.author, "machines");
                const arsize = await API.maqExtension.storage.getSize(msg.author);
                
                await embed.setDescription(`Minerador: ${msg.author}`);
                await embed.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${arsize}/${armazemmax2}]g\nTotal coletado: ${totalcoletado}g\nColetado neste update: ${round}g`)
                await embed.addField(`<:info:736274028515295262> Informações da máquina`, `${ep == null || ep.length == 0?'\nChipes: Nenhum instalado\n': `\nChipes: [${ep.map((i) => `${API.shopExtension.getProduct(i).icon}`).join(', ')}]\n`}Profundidade: ${profundidade}m\nDurabilidade: ${Math.round(100*obj6.durability/maq.durability)}%`)
                await embed.addField(`⛏ Informações de mineração`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nEnergia: ${progress2}`)
                embed.setFooter(`Tempo de atualização: ${timeupdate/1000} segundos\nTempo minerando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                
                for await (const r of obj2) {
                    let qnt = sizeMap.get(r.name);
                    if (qnt == undefined) qnt = 0;
                    if (qnt < 1) qnt = 0;
                    embed.addField(`${r.icon} ${r.name.charAt(0).toUpperCase() + r.name.slice(1)} +${qnt}g`, `\`\`\`autohotkey\nColetado: ${coletadox.get(r.name) == undefined ? '0':coletadox.get(r.name)}g\`\`\``, true)
                }
                try{
                    await embedmsg.edit({embed, component: API.rowButton([btn]) }).catch()
                }catch{
					API.cacheLists.waiting.remove(msg.author, 'mining')
                    return
                }
                playerobj = await API.getInfo(msg.member, 'machines');
                if (playerobj.durability <= Math.round(maq.durability/100)) {
                    const embedtemp = await API.sendErrorM(msg, `Sua máquina não possui durabilidade para continuar minerando! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})\nUtilize \`${API.prefix}loja reparos\` para visualizar os reparos disponíveis`)
                    await msg.quote(embedtemp)
                    API.cacheLists.waiting.remove(msg.author, 'mining')
                    embedmsg.reactions.removeAll();
                    btn.setDisabled()
                    await embedmsg.edit({embed, component: API.rowButton([btn]), mention: true }).catch()
                    return;
                }

                if (await API.maqExtension.storage.getSize(msg.author) >= armazemmax2) {
                    const embedtemp = await API.sendErrorM(msg, `Seu armazém lotou enquanto você minerava! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})\nUtilize \`${API.prefix}armazém\` para visualizar seus recursos\nUtilize \`${API.prefix}vender\` para vender os recursos`)
                    await msg.quote(embedtemp)
                    API.cacheLists.waiting.remove(msg.author, 'mining')
                    embedmsg.reactions.removeAll();
                    btn.setDisabled()
                    await embedmsg.edit({embed, component: API.rowButton([btn]), mention: true }).catch()
                    return;
                }
                if (e+1 < 1) {
                    const embedtemp = await API.sendErrorM(msg, `A energia de sua máquina esgotou! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})\nVisualize a energia utilizando \`${API.prefix}energia\``)
                    
                    await msg.quote(embedtemp)
                    API.cacheLists.waiting.remove(msg.author, 'mining')
                    embedmsg.reactions.removeAll();
                    btn.setDisabled()
                    await embedmsg.edit({ embed, component: API.rowButton([btn]), mention: true }).catch()
                    return;
                }

                let stopped = false

                const collector = embedmsg.createButtonCollector(filter, { time: timeupdate });

                collector.on('collect', (b) => {
                    if (b.id == 'stopBtn') {
                        b.defer()
                        stopped = true;
                        collector.stop();
                    }
                });

                collector.on('end', async collected => {
                    if (stopped) {
                        embedmsg.reactions.removeAll();
                        btn.setDisabled()
                        await embedmsg.edit({embed, component: API.rowButton([btn]) }).catch()
                        const embedtemp = await API.sendError(msg, `Você parou o funcionamento da sua máquina!`)
                        await msg.quote({ embed: embedtemp, refer: embedmsg.id })
                        API.cacheLists.waiting.remove(msg.author, 'mining')
                    } else {edit();}
                });
            }catch (err){
                API.client.emit('error', err)
                console.log(err)
            }
        }
        edit();
	}
};