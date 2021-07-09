module.exports = {

    name: "raw",
    execute: async(API, dados) => {
        const client = API.client;
        const Discord = API.Discord;

        if (dados.t != 'MESSAGE_REACTION_ADD') return;
        
        let member
        try {
            member = await client.users.fetch(dados.d.user_id);
        } catch (err) {
            return client.emit('error', err)
        }
        if (member.bot) return;
        if (dados.d.message_id != '780145465529729034') return;
        const guild = client.guilds.cache.get('693150851396796446');
        const ch = client.channels.cache.get('780136326510673930');
        let msg

        await ch.messages.fetch(dados.d.message_id)
            .then(message => {
                msg = message
                msg.react('🐝').catch()
                msg.react('🐞').catch()
                msg.react('🦋').catch()
                msg.react('🦂').catch()
            })
            .catch((err) => {
                console.log(err.stack)
                client.emit('error', err)
            });

        const reaction = msg.reactions.cache.get(dados.d.emoji.name)
        if (!reaction) return
        await reaction.users.remove(dados.d.user_id);
        if (['🐝', '🦂', '🦋', '🐞'].includes(reaction.emoji.name) == false) return;

        let info = await msg.quote({ content: `Criando nova thread...` })
        setTimeout(function(){info.delete()}, 6000);
             
        let fetched = guild.channels.cache.find(r => r.name.includes(`${member.id.slice(0,4)}`));
        if (fetched){
            info.edit({ content: `Você já possui um canal de thread! ${fetched}` })
            return;
        }

        const newch = await guild.channels.create(`${reaction.emoji.name}-${member.id.slice(0,4)}`, {parent: '745440984476811415'});

        newch.permissionOverwrites.create(member, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            READ_MESSAGE_HISTORY: true,
            ATTACH_FILES: true
        })

        
        
        let embed = new API.Discord.MessageEmbed()
        .setDescription(`Olá ${member}, detalhe-nos sobre o bug!`)
        .setColor('#443c3c')
        const embedmsg = await newch.send({ embeds: [embed] })
        
        info.edit(`Thread ${newch} criada com sucesso!`)
    }
}
