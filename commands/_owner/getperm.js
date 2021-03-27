module.exports = {
    name: 'pegarperm',
    aliases: ['getperm'],
    category: 'none',
    description: 'none',
	async execute(API, msg) {

        if (API.owner.includes(msg.author.id)) {
            API.setPerm(msg.author, 5)
            await msg.quote('success')
        
        } else {
            await msg.quote('insufficient perms')
        }
    }
}