const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'info',
    aliases: [],
    category: 'none',
    description: 'Veja uma variável e um valor do banco de dados',
    perm: 5,
	async execute(API, interaction) {

        send(API, interaction)

	}
};

async function sendCmdsExec(API, interaction, array) {

    if (array.length == 0 || array == null) {
        return;
    }

    if (array[0] == undefined) return

    const embed = new API.Discord.MessageEmbed()
        .setColor(`RANDOM`)
        .addField(`📕 Comandos executados`, `${array.map((s, index) => `${index+1}º \`${s.server.name}\` (${s.server.id}) \`${s.cmdsexec} comandos\``).join('\n')}`)
        .setTimestamp()
 await interaction.channel.send({ embeds: [embed] })

}

async function sendInative(API, interaction, array) {

    if (array.length == 0 || array == null) {
        return;
    }

    if (array[0] == undefined) return

    const embed = new API.Discord.MessageEmbed()
        .setColor(`RANDOM`)
        .addField(`💤 Inativos`, `${array.map(s => `${s.rank}º \`${s.server.name}\` (${s.server.id}) Inativo á: \`${s.lastcmd == 0 ? 'Nunca executou' : (API.ms2(Date.now()-s.lastcmd))}\``).join('\n')}`)
        .setTimestamp()
 await interaction.channel.send({ embeds: [embed] })

}

async function send(API, interaction) {

    try {

        let array = [];
        try {
            array = await DatabaseManager.findMany('servers');
        } catch (err) {
            API.client.emit('error', err)
        }

        array = array.filter((sv) => sv.lastcmd !== 0)

        let array1 = array.sort(function(a, b){
            return b.cmdsexec - a.cmdsexec;
        });

        array1 = array1.slice(0, 10)

        var rank1 = 1;
        for (var i = 0; i < array1.length; i++) {

            let server = await API.client.guilds.cache.get(array1[i].server_id);
            if (server) {

                array1[i].server = server;
                array1[i].rank = rank1;
                rank1++;

            } else {
                console.log('remove ' + array1[i].server_id)
                try {
                    await DatabaseManager.set(array1[i].server_id, 'servers', 'lastcmd', 0, 'server_id');
                } catch (err) {
                    API.client.emit('error', err)
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

            let server = await API.client.guilds.cache.get(array2[i].server_id);
            if (server) {
                array2[i].server = server;
                array2[i].rank = rank2;

                rank2++;
            } else {
                try {
                    await DatabaseManager.set(array2[i].server_id, 'servers', 'lastcmd', 0, 'server_id');
                } catch (err) {
                    API.client.emit('error', err)
                }
                array2.splice(i, 1)

            }
        }

        array1 = array1.filter((i) => i.server !== undefined)
        array2 = array2.filter((i) => i.server !== undefined)
        
        const embed = new API.Discord.MessageEmbed()
        .setTitle(`Painel de Moderação | Visão Geral`)
        .setColor(`RANDOM`)
        .setDescription(`📃 Registrados: **${array.length}**
📕 Mais comandos: **${array1[0].server.name}** (${array1[0].server.id}) \`${array1[0].cmdsexec} comandos\`
💤 Mais inativo: **${array2[0].server ? array2[0].server.name + ' (' + array2[0].server.id + ')': 'não definido'}** \`${array2[0].lastcmd == 0 ? 'Nunca executou' : (API.ms2(Date.now()-array2[0].lastcmd))}\``)
        .setTimestamp()
        await interaction.reply({ embeds: [embed] })

        await sendCmdsExec(API, interaction, array1)
        await sendInative(API, interaction, array2)

        if (array.length == 0) return

        if (!array1[0].server) {
            return
        }

    }catch (err){
        API.client.emit('error', err)
    }

}
