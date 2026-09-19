const Discord = require('../../_classes/discordCompat');
const config = require('../../_classes/config');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const playersService = require('../../_classes/services/players');
const runtime = require('../../_classes/services/runtime');
const badgesService = require('../../_classes/services/badges');
const framesService = require('../../_classes/services/frames');
const economyService = require('../../_classes/services/economy');
const crateExtensionService = require('../../_classes/services/crateExtension');
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
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
	async execute(interaction) {

        
        async function getItem() {
            const globalobj = await DatabaseManager.get(config.app.id, 'globals')
                
            const objgkeys = globalobj.keys || [];
        
            const key = interaction.options.getString('chave')
            const item = objgkeys.find(x => x.key == key)
        
            if (!item) {
                const embedtemp = await utility.sendError(interaction, 'Essa chave de ativação é inexistente!')
                return await interaction.reply({ embeds: [embedtemp]})
            }

            return { item, objgkeys }
        }

        const { item, objgkeys } = await getItem()

        const check = await playersService.cooldown.check(interaction.user.id, "usekey");
        if (check) {
            playersService.cooldown.message(interaction, 'usekey', 'usar uma chave')
            return;
        }

        playersService.cooldown.set(interaction.user.id, "usekey", 30);

        let size = item.size || 0
        let time = item.time || 0

        const embed = new Discord.MessageEmbed()
		.setDescription(`Você deseja usar a **🔑 Chave de Ativação**?\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
        
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.usarchave.defer_update'));
            reacted = true;
            collector.stop();
            const embed = new Discord.MessageEmbed()
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Uso de chave cancelado', `
                Você cancelou o uso da **🔑 Chave de Ativação**.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            const { item, objgkeys } = await getItem()
            
            if (runtime.debug)console.log(`Index of key ${objgkeys.indexOf(item)}`)
            objgkeys.splice(objgkeys.indexOf(item), 1)
            
            switch (item.form.type) {
                case 0:
                    const pobj = await DatabaseManager.get(interaction.user.id, 'players')
                    const perm = pobj.perm
                    badgesService.add(interaction.user.id, 1)
                    await framesService.add(interaction.user.id, 3)
                    await framesService.add(interaction.user.id, 4)
                    DatabaseManager.set(interaction.user.id, 'players', 'mvp', pobj.mvp == null || pobj.mvp <= 0 ? (Date.now()+item.time) : (pobj.mvp+item.time))
                    if (perm == 1) DatabaseManager.set(interaction.user.id, 'players', 'perm', 3)
                    break;
                case 1:
                    economyService.money.add(interaction.user.id, item.size)
                    break;
                case 2:
                    economyService.token.add(interaction.user.id, item.size)
                    break;
                case 3:
                    economyService.points.add(interaction.user.id, item.size)
                    break;
                case 4:
                    crateExtensionService.give(interaction.user.id, item.id, item.size)
                default:
                    break;
            }

            await DatabaseManager.set(config.app.id, 'globals', 'keys', objgkeys)

            embed.setColor('#5bff45');
            embed.addField('✅ Chave usada com sucesso', `Você usou uma **🔑 Chave de Ativação**!\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
            interaction.editReply({ embeds: [embed], components: [] });

			let cchannel = await clientService.current.channels.cache.get(interaction.channel.id)

            const embed2 = new Discord.MessageEmbed()
            .setTitle(`✅ Chave usada`)
            .setDescription(`Quem usou: ${interaction.user} \`${interaction.user.id}\`
Local em que usou: #${cchannel.name} 🡮 ${interaction.guild.name} 🡮 \`${interaction.guild.id}\`
Chave usada: **${item.key}**

Produto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração do ${item.form.name}: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}

`)
            .setColor(`#5bff45`)
            let ch = await clientService.current.channels.cache.get('758711135284232263')
            ch.send({ embeds: [embed2] });

            playersService.cooldown.set(interaction.user.id, "usekey", 0);

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria usar a **🔑 Chave de Ativação**, porém o tempo expirou.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
            interaction.editReply({ embeds: [embed], components: [] });
            playersService.cooldown.set(interaction.user.id, "usekey", 0);
            return;
        });

	}
};
