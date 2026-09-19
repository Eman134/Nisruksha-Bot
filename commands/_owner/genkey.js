const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const crateExtensionService = require('../../_classes/services/crateExtension');
const config = require('../../_classes/config');
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('tipochave').setDescription('Digite o tipo de chave que deseja gerar')
  .addChoices({ name: 'MVP', value: 'MVP' })
  .addChoices({ name: 'MOEDAS', value: 'MOEDAS' })
  .addChoices({ name: 'FICHAS', value: 'FICHAS' })
  .addChoices({ name: 'CRISTAIS', value: 'CRISTAIS' })
  .addChoices({ name: 'CAIXA', value: 'CAIXA' })
.setRequired(true))
.addStringOption(option => option.setName('durqnt').setDescription('Digite a quantidade ou duração da chave').setRequired(false))
.addStringOption(option => option.setName('args2').setDescription('Caixa').setRequired(false))

module.exports = {
    name: 'gerarkey',
    aliases: ['gerarchave', 'gchave', 'gkey', 'genkey'],
    category: 'none',
    description: 'Gera uma chave de ativação com um produto de recompensa',
    data,
    perm: 5,
	async execute(interaction) {

        
        let types = {
            'MVP': {
                icon: '<:mvp:758717273304465478>',
                name: 'MVP',
                requiret: true,
                requiresize: false,
                type: 0
            },
            'MOEDAS': {
                icon: `${utility.moneyemoji}`,
                name: `${utility.money}`,
                requiret: false,
                requiresize: true,
                requireid: false,
                type: 1
            },
            'FICHAS': {
                icon: `${utility.money3emoji}`,
                name: `${utility.money3}`,
                requiret: false,
                requiresize: true,
                requireid: false,
                type: 2
            },
            'CRISTAIS': {
                icon: `${utility.money2emoji}`,
                name: `${utility.money2}`,
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
        const id = (interaction.options.getString('durqnt'));
        const args2 = (interaction.options.getString('args2'));

        if (Object.keys(types).includes(choose) == false) {
            const embedtemp = await utility.sendError(interaction, `Você precisa especificar um tipo de chave existente!\n \n**Lista de Tipos**\n\`${Object.keys(types).join(', ')}.\``, `gerarchave MVP 1mo 30d 10h 30m 30s\n/gerarchave money 100\n/gerarchave caixa 1 5`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (types[choose].requireid == true && args2 == null) {
            const embedtemp = await utility.sendError(interaction, 'Você precisa especificar um id de caixa', `gerarchave caixa 1 5`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let time = 0;
        if (types[choose].requiret == true) {

            const timesplit = id.split(" ");
            
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
        if (types[choose].requiresize == true && !utility.isInt(id)) {
            const embedtemp = await utility.sendError(interaction, 'Você precisa especificar uma quantia para a o produto', `gerarchave ${types[choose].name} 10000`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
    
        if (types[choose].requireid == true){
            size = parseInt(args2)
            types[choose].icon = crateExtensionService.obj[id.toString()].icon
            types[choose].name = crateExtensionService.obj[id.toString()].name
        }
        if (types[choose].requiresize == true){
            size = parseInt(id)
        }
        
		const embed = new Discord.EmbedBuilder()
		.setDescription(`Você deseja gerar uma nova **🔑 Chave de Ativação**?\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}`, ``)
        
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            reacted = true;
            collector.stop();
            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.genkey.defer_update'));

            const embed = new Discord.EmbedBuilder()
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Geração de chave cancelada', value: `
                Você cancelou a geração de uma nova **🔑 Chave de Ativação**.\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}` })
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
            if (id) obj.id = id
            
            const globalobj = await DatabaseManager.get(config.app.id, 'globals');

            const objgkeys = globalobj.keys
            let clist = []
            if (objgkeys != null) {
                clist = objgkeys
            }
            clist.push(obj)

            DatabaseManager.set(config.app.id, 'globals', 'keys', clist);

            const embed2 = new Discord.EmbedBuilder()
            .setTitle(`🔑 Nova chave gerada`)
            .setDescription(`Quem gerou: ${interaction.user} \`${interaction.user.id}\`
Local em que gerou: ${interaction.channel} 🡮 ${interaction.guild.name} 🡮 \`${interaction.guild.id}\`
Chave gerada: **${key}**

Produto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}

**Objeto gerado:**
\`\`\`js
${JSON.stringify(obj, null, '\t').slice(0, 1000)}
\`\`\``).setColor(`#fc8c03`)

            let ch = await clientService.current.channels.cache.get('758711135284232263')
            let createdinteraction = await ch.send({ embeds: [embed2] });

            embed.setColor('#5bff45');
            embed.addFields({ name: '✅ Chave criada com sucesso', value: `
            Você gerou uma nova **🔑 Chave de Ativação**, visualize-a [CLICANDO AQUI](${`https://discordapp.com/channels/${ch.guild.id}/${ch.id}/${createdinteraction.id}`})` })
            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new Discord.EmbedBuilder();
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `Você iria gerar uma nova **🔑 Chave de Ativação**, porém o tempo expirou.\nProduto: **${types[choose].icon} ${types[choose].name}**${types[choose].requiret == true ? `\nDuração: **${utility.ms(time, true)}**`: ''}${size > 0 ? `\nQuantia: **${size}**`:''}` })
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
