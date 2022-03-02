const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('item').setDescription('Escreva o nome do item que você deseja usar').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'usaritem',
    aliases: ['useitem', 'uitem', 'usari'],
    category: 'Players',
    description: 'Faz o uso de um item usável da sua mochila',
    data,
    mastery: 10,
	async execute(API, interaction) {

        const Discord = API.Discord;

        let id = interaction.options.getString('item');
        
        if (!API.itemExtension.exists(id, 'drops')) {
            const embedtemp = await API.sendError(interaction, `Você precisa identificar um item EXISTENTE para uso!\nVerifique os itens disponíveis utilizando \`/mochila\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        const drop = API.itemExtension.get(id)
        id = id.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        
        if (!drop.usavel) {
            const embedtemp = await API.sendError(interaction, `O item ${drop.icon} \`${drop.displayname}\` não é usável!\nDica: Os itens usáveis possuem um sufixo '💫' em seu nome na mochila.`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        const obj2 = await DatabaseManager.get(interaction.user.id, 'storage')
        if (obj2[drop.name.replace(/"/g, '')] <= 0) {
            const embedtemp = await API.sendError(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para usar!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "usaritem");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'usaritem', 'usar itens novamente')

            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "usaritem", 15);

        const quantia = 1
        
        const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja utilizar o item **${drop.icon} ${drop.displayname}** da sua mochila?\nDescrição do item: \`${drop.desc}\``)
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async(b) => {

            reacted = true;
            collector.stop();
            embed.fields = [];
            b.deferUpdate()

            const obj2 = await DatabaseManager.get(interaction.user.id, 'storage')
            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                embed.setColor('#a60000');
                embed.addField('❌ Uso cancelado', `
                Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para usar!`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Uso cancelado', `
                Você cancelou o uso de **${drop.icon} ${drop.displayname}**.\nDescrição do item: \`${drop.desc}\``)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            function sucessEmbed() {
                embed.setColor('#5bff45');
                embed.addField('✅ Item usado', `Você usou **${drop.icon} ${drop.displayname}**\nDescrição do item: \`${drop.desc}\``)
                interaction.editReply({ embeds: [embed], components: [] });
            }

            switch (drop.type) {
                case 1:

                    const isFull = await API.maqExtension.storage.isFull(interaction.user.id);

                    if (isFull) {
                        embed.setColor('#a60000');
                        embed.addField('❌ Uso cancelado', `Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize \`/armazém\` para visualizar seus recursos\nUtilize \`/vender\` para vender os recursos`)
                        interaction.editReply({ embeds: [embed], components: [] });
                        return
                    }

                    const embed2 = new Discord.MessageEmbed();
                    embed2.setTitle(`${drop.icon} ${drop.displayname}`).setColor("#2ed1ce")
                    
                    let totalcoletado = 0;
                    let coletadox = new Map();

                    async function edit() {

                        try{

                            let profundidade = await API.maqExtension.getDepth(interaction.user.id)

                            let playerobj = await DatabaseManager.get(interaction.user.id, 'machines');
                            let maqid = playerobj.machine;
                            const maq1 = API.shopExtension.getProduct(maqid);
                            const maq = API.clone(maq1);
                            
                            maq.tier = drop.tier+2
                        
                            const obj2 = await API.maqExtension.ores.gen(maq, profundidade*drop.tier*5, []);

                            let sizeMap = new Map();

                            let round = 0;
                            let xp = API.random(15, 35)*drop.tier;
                            xp = await API.playerUtils.execExp(interaction, xp);

                            for (const r of obj2) {
            
                                const ore = r.oreobj
            
                                let size = ore.size*drop.tier;
                
                                let arMax = await API.maqExtension.storage.getMax(interaction.user.id);
                
                                if (await API.maqExtension.storage.getSize(interaction.user.id)+size >= arMax) {
                                    size -= (await API.maqExtension.storage.getSize(interaction.user.id)+size-arMax)
                                }
                                totalcoletado += size;
                                if (coletadox.has(ore.name)) coletadox.set(ore.name, coletadox.get(ore.name)+size)
                                else coletadox.set(ore.name, size)
                                sizeMap.set(ore.name, size)
                                API.itemExtension.add(interaction.user.id, ore.name, size)
                                round += size;
                
                                if (await API.maqExtension.storage.getSize(interaction.user.id)+size >= arMax) break;
                                    
                            }
                            
                            let armazemmax2 = await API.maqExtension.storage.getMax(interaction.user.id);
                            embed2.fields = [];
                            const obj6 = await DatabaseManager.get(interaction.user.id, "machines");
                            const arsize = await API.maqExtension.storage.getSize(interaction.user.id);

                            await embed2.setDescription(`Minerador: ${interaction.user}`);
                            await embed2.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${arsize}/${armazemmax2}]g\nTotal coletado: ${totalcoletado}g\nColetado neste update: ${round}g`)
                            await embed2.addField(`💥 Informações de explosão`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nTier da dinamite: ${drop.tier}`)

                            for await (const r of obj2) {

                                const ore = r.oreobj

                                let qnt = sizeMap.get(ore.name);
                                if (qnt == undefined) qnt = 0;
                                if (qnt < 1) qnt = 0;

                                embed2.addField(`${ore.icon} ${ore.name.charAt(0).toUpperCase() + ore.name.slice(1)} +${qnt}g`, `\`\`\`autohotkey\nColetado: ${coletadox.get(ore.name) == undefined ? '0':coletadox.get(ore.name)}g\`\`\``, true)
                            }

                            try{
                                await interaction.editReply({ embeds: [embed2], components: [] }).catch()
                            }catch{
                                return
                            }
                        }catch (err){
                            API.client.emit('error', err)
                            console.log(err)
                        }
                    }

                    await edit()

                    break;

                case 2:
                    await API.playerUtils.stamina.add(interaction.user.id, drop.value);
                    sucessEmbed()
                    break;

                case 3:
                    API.playerUtils.execExp(interaction, drop.value, true);
                    sucessEmbed()
                    break;

                default:
                    embedinteraction.delete()
                    interaction.reply({ content: 'Ocorreu um erro ao utilizar o item, contate algum moderador do bot.'})

            }
            API.itemExtension.add(interaction.user.id, drop.name, -quantia)

        });
        
        collector.on('end', async collected => {
            API.playerUtils.cooldown.set(interaction.user.id, "usaritem", 0);
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria usar **${drop.icon} ${drop.displayname}**, porém o tempo expirou!\nDescrição do item: \`${drop.desc}\``)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};