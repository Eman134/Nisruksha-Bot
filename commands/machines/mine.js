module.exports = {
    name: 'minerar',
    aliases: ['m', 'mine'],
    category: 'Maquinas',
    description: 'Inicia sua máquina e cava as profundezas encontrando minérios sob a energia solar',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const isFull = await API.maqExtension.storage.isFull(msg.author);
        const hasMachine = await API.maqExtension.has(msg.author);

        if (!(hasMachine)) {
            API.sendError(msg, `Você ainda não possui uma máquina!\nAcesse \`${API.prefix}loja maquinas\` para visualizar as maquinas disponíveis`)
            return;
        }

		if (isFull) {
            API.sendError(msg, `Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize \`${API.prefix}armazém\` para visualizar seus recursos\nUtilize \`${API.prefix}vender\` para vender os recursos`)
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'mining')) {
            API.sendError(msg, `Você já encontra-se minerando no momento! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})`)
            return;
        }

        let playerobj = await API.getInfo(msg.author, 'machines');
        let maqid = playerobj.machine;
        let maq = API.shopExtension.getProduct(maqid);
        if (playerobj.durability <= Math.round(5*maq.durability/100)) {
            API.sendError(msg, `Sua máquina não possui durabilidade o suficiente para minerar!\nUtilize \`${API.prefix}loja reparos\` para visualizar os reparos disponíveis`)
            return;
        }

        const eng = await API.maqExtension.getEnergy(msg.author);
        const engmax = await API.maqExtension.getEnergyMax(msg.author);

        if (eng < Math.round(15*engmax/100)) {
            API.sendError(msg, `Sua máquina precisa de no mínimo ${Math.round(15*engmax/100)} de energia para ligar\nVisualize a energia utilizando \`${API.prefix}energia\``)
            return;
        }

        let init = Date.now();
        let profundidade = await API.maqExtension.getDepth(msg.author)
        let gtotal = calcGTotal(profundidade)

        function calcGTotal(profundidade) {
            let gtotal = 225;
            gtotal += profundidade/1.5;
            gtotal += API.random(1, API.random(2, Math.round(profundidade*0.76)))
            gtotal += profundidade*2

            gtotal -= profundidade/(maq.tier+1)

            gtotal = Math.round(gtotal);

            return gtotal
        }

        let energymax = await API.maqExtension.getEnergyMax(msg.author)
        let progress = API.getProgress(8, '<:energyfull:741675235010674849>', '<:energyempty:741675234796503041>', await API.maqExtension.getEnergy(msg.author), energymax);

        let ep = await API.maqExtension.getEquipedPieces(msg.author);
        let armazematual = await API.maqExtension.storage.getSize(msg.author);
        let armazemmax = await API.maqExtension.storage.getMax(msg.author);
        let obj6 = await API.getInfo(msg.author, "machines");
        const embed = new Discord.MessageEmbed();
        embed.setTitle(`${maq.name}`)
        embed.setDescription(`Minerador: ${msg.author}`);
        embed.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${armazematual}/${armazemmax}]g\nTotal coletado: 0g\nColetado neste update: 0g`)
        embed.addField(`${maq.icon ? maq.icon + ' ':''}Informações da máquina`, `${ep == null || ep.length == 0?'\nPlacas: Nenhuma instalada\n': `\nPlacas: [${ep.map((i) => `${API.shopExtension.getProduct(i).icon}`).join(', ')}]\n`}Profundidade: ${profundidade}m\nDurabilidade: ${Math.round(100*obj6.durability/maq.durability)}%`)
        embed.addField(`⛏ Informações de mineração`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEnergia: ${progress}`)
        embed.setFooter(`Reaja com 🔴 para parar a máquina\nTempo de atualização: ${API.maqExtension.update} segundos\nTempo minerando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        
        let embedmsg
        try {
            embedmsg = await msg.quote(embed).then((ems) => embedmsg = ems).catch();
        } catch {}
        embedmsg.react('🔴')
        API.cacheLists.waiting.add(msg.author, embedmsg, 'mining');

        let oreobj = API.maqExtension.ores.getObj().minerios;

        function gen(){
            let por = maq.tier * 10;
            let array = [];
            for (i = 0; i < maq.tier+1; i++) {
                if (oreobj[i] != undefined) {
                    let t = Math.round(((oreobj[i].por+1)/(parseFloat(`2.${API.random(6, 9)}${API.random(0, 9)}`)))*gtotal/100);
                    t += Math.round(((por/(i+1))/2)*gtotal/100);
                    t *= 23/100;
                    t = Math.round((oreobj[i].name == 'pedra' ? t * ((maq.tier+1)*1.9):t)/2);
                    oreobj[i].size = t;
                    array.push(oreobj[i])
                }
            }
            return array;
        }

        let totalcoletado = 0;
        let coletadox = new Map();

        const filter = (reaction, user) => {
            return reaction.emoji.name === '🔴' && user.id === msg.author.id;
        };

        async function edit() {

            try{

                const obj2 = gen();
                let sizeMap = new Map();
                let round = 0;
                let xp = API.random(15, 35);
                API.playerUtils.execExp(msg, xp);
                await API.maqExtension.removeEnergy(msg.author, 1);
                let playerobj = await API.getInfo(msg.member, 'machines');
                let maqid = playerobj.machine;
                let maq = API.shopExtension.getProduct(maqid);
				
                let rd = API.random(1, 15) * (maq.tier+1);
                if (playerobj.durability <= Math.round(maq.durability/100)) {
                    API.setInfo(msg.author, 'machines', 'durability', 0)

                } else API.setInfo(msg.author, 'machines', 'durability', playerobj.durability-rd)
                
                for await(const r of obj2) {


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
                let profundidade = await API.maqExtension.getDepth(msg.author)
                await embed.setDescription(`Minerador: ${msg.author}`);
                await embed.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${arsize}/${armazemmax2}]g\nTotal coletado: ${totalcoletado}g\nColetado neste update: ${round}g`)
                await embed.addField(`${maq.icon ? maq.icon + ' ':''}Informações da máquina`, `${ep == null || ep.length == 0?'\nPlacas: Nenhuma instalada\n': `\nPlacas: [${ep.map((i) => `${API.shopExtension.getProduct(i).icon}`).join(', ')}]\n`}Profundidade: ${profundidade}m\nDurabilidade: ${Math.round(100*obj6.durability/maq.durability)}%`)
                await embed.addField(`⛏ Informações de mineração`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nEnergia: ${progress2}`)
                embed.setFooter(`Reaja com 🔴 para parar a máquina\nTempo de atualização: ${API.maqExtension.update} segundos\nTempo minerando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                for await (const r of obj2) {
                    let qnt = sizeMap.get(r.name);
                    if (qnt == undefined) qnt = 0;
                    if (qnt < 1) qnt = 0;
                    embed.addField(`${r.icon} ${r.name.charAt(0).toUpperCase() + r.name.slice(1)} +${qnt}g`, `\`\`\`autohotkey\nColetado: ${coletadox.get(r.name) == undefined ? '0':coletadox.get(r.name)}g\`\`\``, true)
                }
                try{
                    await embedmsg.edit({embed, allowedMentions: {"parse": []}}).catch()
                }catch{
					API.cacheLists.waiting.remove(msg.author, 'mining')
                    return
                }
                playerobj = await API.getInfo(msg.member, 'machines');
                if (playerobj.durability <= Math.round(1*maq.durability/100)) {
                    API.sendErrorM(msg, `Sua máquina não possui durabilidade para continuar minerando! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})\nUtilize \`${API.prefix}loja reparos\` para visualizar os reparos disponíveis`)
                    API.cacheLists.waiting.remove(msg.author, 'mining')
                    embedmsg.reactions.removeAll();
                    return;
                }

                if (await API.maqExtension.storage.getSize(msg.author) >= armazemmax2) {
                    API.sendErrorM(msg, `Seu armazém lotou enquanto você minerava! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})\nUtilize \`${API.prefix}armazém\` para visualizar seus recursos\nUtilize \`${API.prefix}vender\` para vender os recursos`)
                    API.cacheLists.waiting.remove(msg.author, 'mining')
                    embedmsg.reactions.removeAll();
                    return;
                }
                if (e+1 < 1) {
                    API.sendErrorM(msg, `A energia de sua máquina esgotou! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'mining')})\nVisualize a energia utilizando \`${API.prefix}energia\``)
                    API.cacheLists.waiting.remove(msg.author, 'mining')
                    embedmsg.reactions.removeAll();
                    return;
                }

                let reacted = false
                const collector = embedmsg.createReactionCollector(filter, { time: API.maqExtension.update*1000 });

                collector.on('collect', (reaction, user) => {
                    if (reaction.emoji.name == '🔴') {
                        reacted = true;
                        collector.stop();
                    }
                });

                collector.on('end', collected => {
                    if (reacted) {
                        embedmsg.reactions.removeAll();
                        API.sendError(msg, `Você parou o funcionamento da sua máquina!`)
                        API.cacheLists.waiting.remove(msg.author, 'mining')
                    } else {edit();}
                });
            }catch (err){
                client.emit('error', err)
            }
        }
        edit();
	}
};