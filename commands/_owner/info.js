const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'info',
    aliases: [],
    category: 'none',
    description: 'Veja uma variável e um valor do banco de dados',
    perm: 5,
	async execute(interaction) {

        send(interaction)

	}
};

async function sendCmdsExec(interaction, array) {

    if (array.length == 0 || array == null) {
        return;
    }

    if (array[0] == undefined) return

    const embed = new Discord.EmbedBuilder()
        .setColor(Math.floor(Math.random() * 0xffffff))
        .addFields({ name: `📕 Comandos executados`, value: `${array.map((s, index) => `${index+1}º \`${s.server.name}\` (${s.server.id}) \`${s.cmdsexec} comandos\``).join('\n')}` })
        .setTimestamp()
 await interaction.channel.send({ embeds: [embed] })

}

async function sendInative(interaction, array) {

    if (array.length == 0 || array == null) {
        return;
    }

    if (array[0] == undefined) return

    const embed = new Discord.EmbedBuilder()
        .setColor(Math.floor(Math.random() * 0xffffff))
        .addFields({ name: `💤 Inativos`, value: `${array.map(s => `${s.rank}º \`${s.server.name}\` (${s.server.id}) Inativo á: \`${s.lastcmd == 0 ? 'Nunca executou' : (compactTime(Date.now()-s.lastcmd))}\``).join('\n')}` })
        .setTimestamp()
 await interaction.channel.send({ embeds: [embed] })

}

async function send(interaction) {

    try {

        let array = [];
        try {
            array = await prisma.servers.findMany();
        } catch (err) {
            clientService.current.emit('error', err)
        }

        array = array.filter((sv) => sv.lastcmd !== 0)

        let array1 = array.sort(function(a, b){
            return b.cmdsexec - a.cmdsexec;
        });

        array1 = array1.slice(0, 10)

        var rank1 = 1;
        for (var i = 0; i < array1.length; i++) {

            let server = await clientService.current.guilds.cache.get(String(array1[i].server_id));
            if (server) {

                array1[i].server = server;
                array1[i].rank = rank1;
                rank1++;

            } else {
                console.log('remove ' + array1[i].server_id)
                try {
                    await prisma.servers.update({ where: { server_id: array1[i].server_id }, data: { lastcmd: 0 } });
                } catch (err) {
                    clientService.current.emit('error', err)
                }
                array1.splice(i, 1)

            }

        }

        let array2 = array.sort(function(a, b){
            return a.lastcmd - b.lastcmd;
        });

        array2 = array2.slice(0, 10)

        var rank2 = 1;
        for (var i = 0; i < array2.length; i++) {

            let server = await clientService.current.guilds.cache.get(String(array2[i].server_id));
            if (server) {
                array2[i].server = server;
                array2[i].rank = rank2;

                rank2++;
            } else {
                try {
                    await prisma.servers.update({ where: { server_id: array2[i].server_id }, data: { lastcmd: 0 } });
                } catch (err) {
                    clientService.current.emit('error', err)
                }
                array2.splice(i, 1)

            }
        }

        array1 = array1.filter((i) => i.server !== undefined)
        array2 = array2.filter((i) => i.server !== undefined)
        
        const embed = new Discord.EmbedBuilder()
        .setTitle(`Painel de Moderação | Visão Geral`)
        .setColor(Math.floor(Math.random() * 0xffffff))
        .setDescription(`📃 Registrados: **${array.length}**
📕 Mais comandos: **${array1[0].server.name}** (${array1[0].server.id}) \`${array1[0].cmdsexec} comandos\`
💤 Mais inativo: **${array2[0].server ? array2[0].server.name + ' (' + array2[0].server.id + ')': 'não definido'}** \`${array2[0].lastcmd == 0 ? 'Nunca executou' : (compactTime(Date.now()-array2[0].lastcmd))}\``)
        .setTimestamp()
        await interaction.reply({ embeds: [embed] })

        await sendCmdsExec(interaction, array1)
        await sendInative(interaction, array2)

        if (array.length == 0) return

        if (!array1[0].server) {
            return
        }

    }catch (err){
        clientService.current.emit('error', err)
    }

}
