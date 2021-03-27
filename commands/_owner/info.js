module.exports = {
    name: 'info',
    aliases: [],
    category: 'none',
    description: 'Veja uma variável e um valor do banco de dados',
	async execute(API, msg) {
        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        send(API, msg)

	}
};

async function sendCmdsExec(API, msg, array) {

    if (array.length == 0 || array == null) {
        return;
    }

    if (array[0] == undefined) return

    const embed = new API.Discord.MessageEmbed()
        .setColor(`RANDOM`)
        .addField(`📕 Comandos executados`, `${array.map((s, index) => `${index+1}º \`${s.server.name}\` (${s.server.id}) \`${s.cmdsexec} comandos\``).join('\n')}`)
        .setTimestamp()
    msg.quote(embed)

}

async function sendInative(API, msg, array) {

    if (array.length == 0 || array == null) {
        return;
    }

    if (array[0] == undefined) return

    const embed = new API.Discord.MessageEmbed()
        .setColor(`RANDOM`)
        .addField(`💤 Inativos`, `${array.map(s => `${s.rank}º \`${s.server.name}\` (${s.server.id}) Inativo á: \`${s.lastcmd == 0 ? 'Nunca executou' : (API.ms2(Date.now()-s.lastcmd))}\``).join('\n')}`)
        .setTimestamp()
    msg.quote(embed)

}

async function send(API, msg) {

    try {

        const text =  `SELECT * FROM servers;`
        let array = [];
        try {
            let res = await API.db.pool.query(text);
            array = res.rows;
        } catch (err) {
            console.log(err.stack)
            client.emit('error', err)
        }

        array = array.filter((sv) => sv.lastcmd !== 0)

        let array1 = array.sort(function(a, b){
            return b.cmdsexec - a.cmdsexec;
        });

        array1 = array1.slice(0, 10)

        var rank1 = 1;
        for (var i = 0; i < array1.length; i++) {

            let server = await API.client.guilds.cache.get(`${array1[i].server_id}`);
            if (server) {

                array1[i].server = server;
                array1[i].rank = rank1;
                rank1++;

            } else {
                console.log('remove ' + array1[i].server_id)
                const text =  `UPDATE servers SET lastcmd = $2 WHERE server_id=$1;`,
                values = [array1[i].server_id, 0]
                try {
                    await API.db.pool.query(text, values);
                } catch (err) {
                    console.log(err.stack)
                    client.emit('error', err)
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

            let server = await API.client.guilds.cache.get(`${array2[i].server_id}`);
            if (server) {
                array2[i].server = server;
                array2[i].rank = rank2;

                rank2++;
            } else {
                const text =  `UPDATE servers SET lastcmd = $2 WHERE server_id=$1;`,
                values = [array2[i].server_id, null]
                try {
                    await API.db.pool.query(text, values);
                } catch (err) {
                    console.log(err.stack)
                    client.emit('error', err)
                }
                array2.splice(i, 1)

            }
        }

        
        const embed = new API.Discord.MessageEmbed()
        .setTitle(`Painel de Moderação | Visão Geral`)
        .setColor(`RANDOM`)
        .setDescription(`📃 Registrados: **${array.length}**\n📕 Mais comandos: **${array1[0].server.name}** (${array1[0].server.id}) \`${array1[0].cmdsexec} comandos\`\n💤 Mais inativo: **${array2[0].server.name}** (${array2[0].server.id}) \`${array2[0].lastcmd == 0 ? 'Nunca executou' : (API.ms2(Date.now()-array2[0].lastcmd))}\``)
        .setTimestamp()
        await msg.quote(embed)
        await sendCmdsExec(API, msg, array1)
        await sendInative(API, msg, array2)

        if (array.length == 0) return

        if (array1[0].server == undefined) {
            return
        }

    }catch (err){
        client.emit('error', err)
        console.log(err.stack)
    }

}
