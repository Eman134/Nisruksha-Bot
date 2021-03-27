module.exports = {
    name: 'rep',
    aliases: ['addrep'],
    category: 'Social',
    description: 'Dê uma reputação a um amigo',
    async execute(API, msg) {
        const boolean = await API.checkAll(msg);
        if (boolean) return;
        const Discord = API.Discord;
        const client = API.client;
        
        let member;
        let args = API.args(msg)
        if (msg.mentions.users.size < 1) {
            return API.sendError(msg, 'Você precisa mencionar um membro para dar reputação', 'rep @membro')
        } else {
            member = msg.mentions.users.first();
        }

        if (member.id == msg.author.id) {
            return API.sendError(msg, 'Você precisa mencionar outra pessoa para dar reputação', 'rep @membro')
        }

        const check = await API.checkCooldown(msg.author, "rep");
        if (check) {

            let cooldown = await API.getCooldown(msg.author, "rep");
            const embed = new Discord.MessageEmbed()
            .setColor('#b8312c')
            .setDescription('🕑 Aguarde mais `' + API.ms(cooldown) + '` para dar outra reputação!')
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            await msg.quote(embed);
            return;
        }

        let cmaq = await API.maqExtension.get(msg.author)

        if (cmaq < 102) {
            return API.sendError(msg, `Você precisa ter no mínimo a ${API.shopExtension.getProduct(102).name} para dar rep á alguém!`)
        }

        let { reps } = await API.getInfo(member, "players")
        
        API.setCooldown(msg.author, "rep", 43200)

        API.setInfo(member, "players", "reps", parseInt(reps)+1)

        msg.quote('Você deu **+1 REP** para **' + member.tag + '**!')

    },
};