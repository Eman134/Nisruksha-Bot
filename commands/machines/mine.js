module.exports = {
    name: 'minerar',
    aliases: ['m', 'mine'],
    category: 'Maquinas',
    description: 'Inicia sua máquina e cava as profundezas encontrando minérios sob a energia solar',
    mastery: 25,
	async execute(API, msg) {
        
        const member = msg.author

        const Discord = API.Discord;
        const isFull = await API.maqExtension.storage.isFull(member);
        const hasMachine = await API.maqExtension.has(member);


        if (!(hasMachine)) {
            const embedtemp = await API.sendError(msg, `Você ainda não possui uma máquina!\nAcesse \`${API.prefix}loja maquinas\` para visualizar as maquinas disponíveis`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(member, 'mining')) {
            const embedtemp = await API.sendError(msg, `Você já encontra-se minerando no momento! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member, 'mining')})`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

		if (isFull) {
            const embedtemp = await API.sendError(msg, `Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize \`${API.prefix}armazém\` para visualizar seus recursos\nUtilize \`${API.prefix}vender\` para vender os recursos`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let playerobj = await API.getInfo(member, 'machines');
        let maqid = playerobj.machine;

        let maq = API.shopExtension.getProduct(maqid);

        if (playerobj.durability <= Math.round(5*maq.durability/100)) {
            const embedtemp = await API.sendError(msg, `Sua máquina não possui durabilidade o suficiente para minerar!\nUtilize \`${API.prefix}loja reparos\` para visualizar os reparos disponíveis`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        const eng = await API.maqExtension.getEnergy(member);

        const engmax = await API.maqExtension.getEnergyMax(member);

        if (eng < Math.round(15*engmax/100)) {
            const embedtemp = await API.sendError(msg, `Sua máquina precisa de no mínimo ${Math.round(15*engmax/100)} de energia para ligar\nVisualize a energia utilizando \`${API.prefix}energia\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "mine");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'mine', 'executar um comando de mineração')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "mine", 15);

        if (eng >= engmax) {
            API.cacheLists.waiting.remove({id: member.id }, 'mining')
        }

        let init = Date.now();
        let profundidade = await API.maqExtension.getDepth(member)

        let energymax = await API.maqExtension.getEnergyMax(member)
        let progress = API.getProgress(8, { 60: '<:energyfull:741675235010674849>', 30: '<:energy:850573316602200064>', 0: '<:energy:850573316728946698>' }, '<:energyempty:741675234796503041>', await API.maqExtension.getEnergy(member), energymax);

        let ep = await API.itemExtension.getEquipedPieces(member);
        let armazematual = await API.maqExtension.storage.getSize(member);
        let armazemmax = await API.maqExtension.storage.getMax(member);
        let obj6 = await API.getInfo(member, "machines");

        let timeupdate = API.maqExtension.update*1000

        const array = obj6.slots == null ? [] : obj6.slots
        for (const i of array){
            if (API.shopExtension.getProduct(i).typeeffect == 4) {
            timeupdate -= Math.round(API.shopExtension.getProduct(i).size*1000)
            };
        }

        let btn = API.createButton('stopBtn', 'DANGER', 'Parar mineração')

        const embed = new Discord.MessageEmbed();
        embed.setTitle(`${maq.icon} ${maq.name}`).setColor("#36393f")
        embed.setDescription(`Minerador: ${member}`);
        embed.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${armazematual}/${armazemmax}]g\nTotal coletado: 0g\nColetado neste update: 0g`)
        embed.addField(`<:info:736274028515295262> Informações da máquina`, `${ep == null || ep.length == 0?'\nChipes: Nenhum instalado\n': `\nChipes: [${ep.map((i) => `${API.shopExtension.getProduct(i).icon}`).join(', ')}]\n`}Profundidade: ${profundidade}m\nDurabilidade: ${Math.round(100*obj6.durability/maq.durability)}%`)
        embed.addField(`⛏ Informações de mineração`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${(100*obj6.xp/(obj6.level*1980)).toFixed(2)}%)\nEnergia: ${progress}`)
        embed.setFooter(`Tempo de atualização: ${timeupdate/1000} segundos\nTempo minerando: ${API.ms(Date.now()-init)}`, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        
        let embedmsg
        try {
            embedmsg = await msg.quote({ embeds: [embed] })
        } catch {
            API.cacheLists.waiting.remove(member, 'mining');
            return
        }
        API.cacheLists.waiting.add(member, embedmsg, 'mining');

        let totalcoletado = 0;
        let coletadox = new Map();

        async function edit() {

            try{

                let profundidade = await API.maqExtension.getDepth(member)

                let playerobj = await API.getInfo({ id: member.id }, 'machines');
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
                let xp = API.random(20, 40);
                xp = await API.playerUtils.execExp(msg, xp);
                await API.maqExtension.removeEnergy(member, 1);
				
                let rd = API.random(1, 16) * (maq.tier+1);
                if (playerobj.durability <= Math.round(maq.durability/100)) {
                    API.setInfo(member, 'machines', 'durability', 0)

                } else {
                    const array = playerobj.slots == null ? [] : playerobj.slots
                    for (const i of array){
                        if (API.shopExtension.getProduct(i).typeeffect == 3) {
                        rd -= Math.round(API.shopExtension.getProduct(i).size*rd/100)
                        };
                    }
                    API.setInfo(member, 'machines', 'durability', playerobj.durability-rd)
                }
                
                for await (const r of obj2) {


                    let size = r.size;

                    let arMax = await API.maqExtension.storage.getMax(member);

                    if (await API.maqExtension.storage.getSize(member)+size >= arMax) {
                        size -= (await API.maqExtension.storage.getSize(member)+size-arMax)
                    }
                    totalcoletado += size;
                    if (coletadox.has(r.name)) coletadox.set(r.name, coletadox.get(r.name)+size)
                    else coletadox.set(r.name, size)
                    sizeMap.set(r.name, size)
                    API.itemExtension.add(member, r.name, size)
                    round += size;

                    if (await API.maqExtension.storage.getSize(member)+size >= arMax) break;
                    
                }
                
                let armazemmax2 = await API.maqExtension.storage.getMax(member);
                ep = await API.itemExtension.getEquipedPieces(member);
                let energymax = await API.maqExtension.getEnergyMax(member)
                const e = await API.maqExtension.getEnergy(member);
                let progress2 = API.getProgress(8, { 60: '<:energyfull:741675235010674849>', 30: '<:energy:850573316602200064>', 0: '<:energy:850573316728946698>' }, '<:energyempty:741675234796503041>', e+1, energymax);
                embed.fields = [];
                const obj6 = await API.getInfo(member, "machines");
                const arsize = await API.maqExtension.storage.getSize(member);
                
                await embed.setDescription(`Minerador: ${member}`);
                await embed.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${arsize}/${armazemmax2}]g\nTotal coletado: ${totalcoletado}g\nColetado neste update: ${round}g`)
                await embed.addField(`<:info:736274028515295262> Informações da máquina`, `${ep == null || ep.length == 0?'\nChipes: Nenhum instalado\n': `\nChipes: [${ep.map((i) => `${API.shopExtension.getProduct(i).icon}`).join(', ')}]\n`}Profundidade: ${profundidade}m\nDurabilidade: ${Math.round(100*obj6.durability/maq.durability)}%`)
                await embed.addField(`⛏ Informações de mineração`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${(100*obj6.xp/(obj6.level*1980)).toFixed(2)}%) \`(+${xp} XP)\`\nEnergia: ${progress2}`)
                embed.setFooter(`Tempo de atualização: ${timeupdate/1000} segundos\nTempo minerando: ${API.ms(Date.now()-init)}`, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                
                for await (const r of obj2) {
                    let qnt = sizeMap.get(r.name);
                    if (qnt == undefined) qnt = 0;
                    if (qnt < 1) qnt = 0;
                    embed.addField(`${r.icon} ${r.name.charAt(0).toUpperCase() + r.name.slice(1)} +${qnt}g`, `\`\`\`autohotkey\nColetado: ${coletadox.get(r.name) == undefined ? '0':coletadox.get(r.name)}g\`\`\``, true)
                }
                try{
                    await embedmsg.edit({ embeds: [embed], components: [API.rowComponents([btn])] })
                }catch{
					API.cacheLists.waiting.remove(member, 'mining')
                    return
                }
                playerobj = await API.getInfo(member, 'machines');
                if (playerobj.durability <= Math.round(maq.durability/100)) {
                    API.cacheLists.waiting.remove(member, 'mining')
                    const embedtemp = await API.sendError(msg, `Sua máquina não possui durabilidade para continuar minerando! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member, 'mining')})\nUtilize \`${API.prefix}loja reparos\` para visualizar os reparos disponíveis`)
                    await msg.quote({ embeds: [embedtemp], mention: true })
                    await embedmsg.edit({ embeds: [embed], components: [], mention: true }).catch()
                    return;
                }

                if (await API.maqExtension.storage.getSize(member) >= armazemmax2) {
                    API.cacheLists.waiting.remove(member, 'mining')
                    const embedtemp = await API.sendError(msg, `Seu armazém lotou enquanto você minerava! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member, 'mining')})\nUtilize \`${API.prefix}armazém\` para visualizar seus recursos\nUtilize \`${API.prefix}vender\` para vender os recursos`)
                    await msg.quote({ embeds: [embedtemp], mention: true })
                    await embedmsg.edit({ embeds: [embed], components: [], mention: true }).catch()
                    return;
                }
                if (e+1 < 1) {
                    API.cacheLists.waiting.remove(member, 'mining')
                    const embedtemp = await API.sendError(msg, `A energia de sua máquina esgotou! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member, 'mining')})\nVisualize a energia utilizando \`${API.prefix}energia\``)
                    await msg.quote({ embeds: [embedtemp], mention: true })
                    await embedmsg.edit({ embeds: [embed], components: [], mention: true }).catch()
                    return;
                }

                let stopped = false

                const filter = i => i.user.id === member.id;

                const collector = embedmsg.createMessageComponentInteractionCollector({ filter, time: timeupdate });

                collector.on('collect', async (b) => {

                    if (b.customID == 'stopBtn') {
                        b.deferUpdate().catch()
                        stopped = true
                        btn.setDisabled()
                        API.cacheLists.waiting.remove(member, 'mining')
                        await embedmsg.edit({ embeds: [embed], components: [] }).catch()
                        collector.stop();
                    }
                });

                collector.on('end', async collected => {
                    if (stopped) {
                        API.cacheLists.waiting.remove(member, 'mining');
                        const embedtemp = await API.sendError(msg, `Você parou o funcionamento da sua máquina!`)
                        await msg.quote({ embeds: [embedtemp] })
                    } else {
                        edit();
                    }
                });

            }catch {
                API.cacheLists.waiting.remove(member, 'mining');
            }
        }
        try {
            await edit();
        } catch {
            API.cacheLists.waiting.remove(member, 'mining');
        }
	}
};