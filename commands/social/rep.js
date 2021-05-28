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
            const embedtemp = await API.sendError(msg, 'Você precisa mencionar um membro para dar reputação', 'rep @membro')
            await msg.quote(embedtemp)
            return
        } else {
            member = msg.mentions.users.first();
        }

        if (member.id == msg.author.id) {
            const embedtemp = await API.sendError(msg, 'Você precisa mencionar outra pessoa para dar reputação', 'rep @membro')
            await msg.quote(embedtemp)
            return
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "rep");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'rep', 'dar outra reputação')

            return;
        }

        let cmaq = await API.maqExtension.get(msg.author)

        if (cmaq < 102) {
            const embedtemp = await API.sendError(msg, `Você precisa ter no mínimo a ${API.shopExtension.getProduct(102).icon} ${API.shopExtension.getProduct(102).name} para dar rep á alguém!`)
            await msg.quote(embedtemp)
            return
        }

        let { reps } = await API.getInfo(member, "players")
        
        API.playerUtils.cooldown.set(msg.author, "rep", 43200)

        API.setInfo(member, "players", "reps", parseInt(reps)+1)

        await msg.quote('Você deu **+1 REP** para **' + member.tag + '**!')

    },
};