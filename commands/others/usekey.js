const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('chave').setDescription('Coloque a chave para resgatar a recompensa da mesma').setRequired(true))

module.exports = {
    requiredServices: ["Discord","badges","client","crateExtension","createButton","debug","eco","frames","id","ms","playerUtils","rowComponents","sendError"],
    name: 'usarchave',
    aliases: ['ativarchave', 'usarkey', 'usekey'],
    category: 'Outros',
    description: 'Resgata um produto de uma chave de ativação',
    data,
    mastery: 15,
	async execute(interaction, svcDiscord, svcBadges, svcClient, svcCrateExtension, svcCreateButton, svcDebug, svcEco, svcFrames, svcId, svcMs, svcPlayerUtils, svcRowComponents, svcSendError) {
        async function getItem() {
            const globalobj = await DatabaseManager.get(svcId, 'globals')
                
            const objgkeys = globalobj.keys || [];
        
            const key = interaction.options.getString('chave')
            const item = objgkeys.find(x => x.key == key)
        
            if (!item) {
                const embedtemp = await svcSendError(interaction, 'Essa chave de ativação é inexistente!')
                return await interaction.reply({ embeds: [embedtemp]})
            }

            return { item, objgkeys }
        }

        const { item, objgkeys } = await getItem()

        const check = await svcPlayerUtils.cooldown.check(interaction.user.svcId, "usekey");
        if (check) {
            svcPlayerUtils.cooldown.message(interaction, 'usekey', 'usar uma chave')
            return;
        }

        svcPlayerUtils.cooldown.set(interaction.user.svcId, "usekey", 30);

        let size = item.size || 0
        let time = item.time || 0

        const embed = new svcDiscord.MessageEmbed()
		.setDescription(`Você deseja usar a **🔑 Chave de Ativação**?\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
        
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.svcId === interaction.user.svcId;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.svcId === interaction.user.svcId)) return
            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.usarchave.defer_update'));
            reacted = true;
            collector.stop();
            const embed = new svcDiscord.MessageEmbed()
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Uso de chave cancelado', `
                Você cancelou o uso da **🔑 Chave de Ativação**.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            const { item, objgkeys } = await getItem()
            
            if (svcDebug)console.log(`Index of key ${objgkeys.indexOf(item)}`)
            objgkeys.splice(objgkeys.indexOf(item), 1)
            
            switch (item.form.type) {
                case 0:
                    const pobj = await DatabaseManager.get(interaction.user.svcId, 'players')
                    const perm = pobj.perm
                    svcBadges.add(interaction.user.svcId, 1)
                    await svcFrames.add(interaction.user.svcId, 3)
                    await svcFrames.add(interaction.user.svcId, 4)
                    DatabaseManager.set(interaction.user.svcId, 'players', 'mvp', pobj.mvp == null || pobj.mvp <= 0 ? (Date.now()+item.time) : (pobj.mvp+item.time))
                    if (perm == 1) DatabaseManager.set(interaction.user.svcId, 'players', 'perm', 3)
                    break;
                case 1:
                    svcEco.money.add(interaction.user.svcId, item.size)
                    break;
                case 2:
                    svcEco.token.add(interaction.user.svcId, item.size)
                    break;
                case 3:
                    svcEco.points.add(interaction.user.svcId, item.size)
                    break;
                case 4:
                    svcCrateExtension.give(interaction.user.svcId, item.svcId, item.size)
                default:
                    break;
            }

            await DatabaseManager.set(svcId, 'globals', 'keys', objgkeys)

            embed.setColor('#5bff45');
            embed.addField('✅ Chave usada com sucesso', `Você usou uma **🔑 Chave de Ativação**!\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
            interaction.editReply({ embeds: [embed], components: [] });

			let cchannel = await svcClient.channels.cache.get(interaction.channel.svcId)

            const embed2 = new svcDiscord.MessageEmbed()
            .setTitle(`✅ Chave usada`)
            .setDescription(`Quem usou: ${interaction.user} \`${interaction.user.svcId}\`
Local em que usou: #${cchannel.name} 🡮 ${interaction.guild.name} 🡮 \`${interaction.guild.svcId}\`
Chave usada: **${item.key}**

Produto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração do ${item.form.name}: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}

`)
            .setColor(`#5bff45`)
            let ch = await svcClient.channels.cache.get('758711135284232263')
            ch.send({ embeds: [embed2] });

            svcPlayerUtils.cooldown.set(interaction.user.svcId, "usekey", 0);

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new svcDiscord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria usar a **🔑 Chave de Ativação**, porém o tempo expirou.\nProduto: **${item.form.icon} ${item.form.name}**${item.form.requiret == true ? `\nDuração: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
            interaction.editReply({ embeds: [embed], components: [] });
            svcPlayerUtils.cooldown.set(interaction.user.svcId, "usekey", 0);
            return;
        });

	}
};
