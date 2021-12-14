const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('chave').setDescription('Coloque a chave para resgatar a recompensa da mesma').setRequired(true))

module.exports = {
    name: 'usarchave',
    aliases: ['ativarchave', 'usarkey', 'usekey'],
    category: 'Outros',
    description: 'Resgata um produto de uma chave de ativação',
    data,
    mastery: 15,
	async execute(API, interaction) {

        const Discord = API.Discord;

        async function getItem() {
            const globalobj = await DatabaseManager.get(API.id, 'globals')
                
            const objgkeys = globalobj.keys || [];
        
            const key = interaction.options.getString('chave')
            const item = objgkeys.find(x => x.key == key)
        
            if (!item) {
                const embedtemp = await API.sendError(interaction, 'Essa chave de ativação é inexistente!')
                return await interaction.reply({ embeds: [embedtemp]})
            }

            return { item, objgkeys }
        }

        const { item, objgkeys } = await getItem()

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "usekey");
        if (check) {
            API.playerUtils.cooldown.message(interaction, 'usekey', 'usar uma chave')
            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "usekey", 30);

        let size = item.size || 0
        let time = item.time || 0

        const embed = new Discord.MessageEmbed()
		.setDescription(`Você deseja usar a **🔑 Chave de Ativação**?\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            if (!b.deferred) b.deferUpdate().then().catch();
            reacted = true;
            collector.stop();
            const embed = new API.Discord.MessageEmbed()
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Uso de chave cancelado', `
                Você cancelou o uso da **🔑 Chave de Ativação**.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            const { item, objgkeys } = await getItem()
            
            if (API.debug)console.log(`Index of key ${objgkeys.indexOf(item)}`)
            objgkeys.splice(objgkeys.indexOf(item), 1)
            
            switch (item.form.type) {
                case 0:
                    const pobj = await DatabaseManager.get(interaction.user.id, 'players')
                    const perm = pobj.perm
                    API.badges.add(interaction.user.id, 1)
                    await API.frames.add(interaction.user.id, 3)
                    await API.frames.add(interaction.user.id, 4)
                    DatabaseManager.set(interaction.user.id, 'players', 'mvp', pobj.mvp == null || pobj.mvp <= 0 ? (Date.now()+item.time) : (pobj.mvp+item.time))
                    if (perm == 1) DatabaseManager.set(interaction.user.id, 'players', 'perm', 3)
                    break;
                case 1:
                    API.eco.money.add(interaction.user.id, item.size)
                    break;
                case 2:
                    API.eco.token.add(interaction.user.id, item.size)
                    break;
                case 3:
                    API.eco.points.add(interaction.user.id, item.size)
                    break;
                case 4:
                    API.crateExtension.give(interaction.user.id, item.id, item.size)
                default:
                    break;
            }

            await DatabaseManager.set(API.id, 'globals', 'keys', objgkeys)

            embed.setColor('#5bff45');
            embed.addField('✅ Chave usada com sucesso', `Você usou uma **🔑 Chave de Ativação**!\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
            interaction.editReply({ embeds: [embed], components: [] });

			let cchannel = await API.client.channels.cache.get(interaction.channel.id)

            const embed2 = new API.Discord.MessageEmbed()
            .setTitle(`✅ Chave usada`)
            .setDescription(`Quem usou: ${interaction.user} \`${interaction.user.id}\`
Local em que usou: #${cchannel.name} 🡮 ${interaction.guild.name} 🡮 \`${interaction.guild.id}\`
Chave usada: **${item.key}**

Produto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração do ${item.form.name}: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}

`)
            .setColor(`#5bff45`)
            let ch = await API.client.channels.cache.get('758711135284232263')
            ch.send({ embeds: [embed2] });

            API.playerUtils.cooldown.set(interaction.user.id, "usekey", 0);

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria usar a **🔑 Chave de Ativação**, porém o tempo expirou.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${API.ms2(time)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
            interaction.editReply({ embeds: [embed], components: [] });
            API.playerUtils.cooldown.set(interaction.user.id, "usekey", 0);
            return;
        });

	}
};