const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('tipochave').setDescription('Digite o tipo de chave que deseja gerar')
  .addChoice('MVP', 'MVP')
  .addChoice('MOEDAS', 'MOEDAS')
  .addChoice('FICHAS', 'FICHAS')
  .addChoice('CRISTAIS', 'CRISTAIS')
  .addChoice('CAIXA', 'CAIXA')
.setRequired(true))
.addStringOption(option => option.setName('durqnt').setDescription('Digite a quantidade ou duração da chave').setRequired(false))
.addStringOption(option => option.setName('args2').setDescription('Caixa').setRequired(false))

module.exports = {
    requiredServices: ["Discord","client","crateExtension","createButton","id","isInt","money","money2","money2emoji","money3","money3emoji","moneyemoji","ms","rowComponents","sendError"],
    name: 'gerarkey',
    aliases: ['gerarchave', 'gchave', 'gkey', 'genkey'],
    category: 'none',
    description: 'Gera uma chave de ativação com um produto de recompensa',
    data,
    perm: 5,
	async execute(interaction, svcDiscord, svcClient, svcCrateExtension, svcCreateButton, svcId, svcIsInt, svcMoney, svcMoney2, svcMoney2emoji, svcMoney3, svcMoney3emoji, svcMoneyemoji, svcMs, svcRowComponents, svcSendError) {
        let types = {
            'MVP': {
                icon: '<:mvp:758717273304465478>',
                name: 'MVP',
                requiret: true,
                requiresize: false,
                type: 0
            },
            'MOEDAS': {
                icon: `${svcMoneyemoji}`,
                name: `${svcMoney}`,
                requiret: false,
                requiresize: true,
                requireid: false,
                type: 1
            },
            'FICHAS': {
                icon: `${svcMoney3emoji}`,
                name: `${svcMoney3}`,
                requiret: false,
                requiresize: true,
                requireid: false,
                type: 2
            },
            'CRISTAIS': {
                icon: `${svcMoney2emoji}`,
                name: `${svcMoney2}`,
                requiret: false,
                requiresize: true,
                requireid: false,
                type: 3
            },
            'CAIXA': {
                icon: '',
                name: '',
                requiret: false,
                requiresize: false,
                requireid: true,
                type: 4
            }
        }

        const choose = (interaction.options.getString('tipochave')).toUpperCase();
        const svcId = (interaction.options.getString('durqnt'));
        const args2 = (interaction.options.getString('args2'));

        if (Object.keys(types).includes(choose) == false) {
            const embedtemp = await svcSendError(interaction, `Você precisa especificar um tipo de chave existente!\n \n**Lista de Tipos**\n\`${Object.keys(types).join(', ')}.\``, `gerarchave MVP 1mo 30d 10h 30m 30s\n/gerarchave svcMoney 100\n/gerarchave caixa 1 5`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (types[choose].requireid == true && args2 == null) {
            const embedtemp = await svcSendError(interaction, 'Você precisa especificar um svcId de caixa', `gerarchave caixa 1 5`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let time = 0;
        if (types[choose].requiret == true) {

            const timesplit = svcId.split(" ");
            
            for (const r of timesplit) {
                if (r.includes('mo')) {
                    time += parseInt(r.replace('mo', ''))*30*24*60*60*1000
                }
                else if (r.includes('d')) {
                    time += parseInt(r.replace('d', ''))*24*60*60*1000
                }
                else if (r.includes('h')) {
                    time += parseInt(r.replace('h', ''))*60*60*1000
                }
                else if (r.includes('m')) {
                    time += parseInt(r.replace('m', ''))*60*1000
                }
                else if (r.includes('s')) {
                    time += parseInt(r.replace('s', ''))*1000
                }

            }

        }

        let size = 0;
        if (types[choose].requiresize == true && !svcIsInt(svcId)) {
            const embedtemp = await svcSendError(interaction, 'Você precisa especificar uma quantia para a o produto', `gerarchave ${types[choose].name} 10000`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
    
        if (types[choose].requireid == true){
            size = parseInt(args2)
            types[choose].icon = svcCrateExtension.obj[svcId.toString()].icon
            types[choose].name = svcCrateExtension.obj[svcId.toString()].name
        }
        if (types[choose].requiresize == true){
            size = parseInt(svcId)
        }
        
		const embed = new svcDiscord.MessageEmbed()
		.setDescription(`Você deseja gerar uma nova **🔑 Chave de Ativação**?\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
        
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.svcId === interaction.user.svcId;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            reacted = true;
            collector.stop();
            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.genkey.defer_update'));

            const embed = new svcDiscord.MessageEmbed()
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Geração de chave cancelada', `
                Você cancelou a geração de uma nova **🔑 Chave de Ativação**.\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            function makeid(length) {
                var result = '';
                var characters = '012345678901234567890123456789012345678901234567890123456789';
                var charactersLength = characters.length;
                for ( var i = 0; i < length; i++ ) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                return result;
            }

            let key = `${makeid(3)}-${makeid(3)}-${makeid(3)}-${makeid(3)}-N`

            let obj = {
                key: key,
                form: types[choose]
            }

            if (time) obj.time = time
            if (size) obj.size = size
            if (svcId) obj.svcId = svcId
            
            const globalobj = await DatabaseManager.get(svcId, 'globals');

            const objgkeys = globalobj.keys
            let clist = []
            if (objgkeys != null) {
                clist = objgkeys
            }
            clist.push(obj)

            DatabaseManager.set(svcId, 'globals', 'keys', clist);

            const embed2 = new svcDiscord.MessageEmbed()
            .setTitle(`🔑 Nova chave gerada`)
            .setDescription(`Quem gerou: ${interaction.user} \`${interaction.user.svcId}\`
Local em que gerou: ${interaction.channel} 🡮 ${interaction.guild.name} 🡮 \`${interaction.guild.svcId}\`
Chave gerada: **${key}**

Produto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}

**Objeto gerado:**
\`\`\`js
${JSON.stringify(obj, null, '\t').slice(0, 1000)}
\`\`\``).setColor(`#fc8c03`)

            let ch = await svcClient.channels.cache.get('758711135284232263')
            let createdinteraction = await ch.send({ embeds: [embed2] });

            embed.setColor('#5bff45');
            embed.addField('✅ Chave criada com sucesso', `
            Você gerou uma nova **🔑 Chave de Ativação**, visualize-a [CLICANDO AQUI](${`https://discordapp.com/channels/${ch.guild.svcId}/${ch.svcId}/${createdinteraction.svcId}`})`)
            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new svcDiscord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria gerar uma nova **🔑 Chave de Ativação**, porém o tempo expirou.\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${svcMs(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
