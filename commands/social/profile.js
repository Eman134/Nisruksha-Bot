const playersService = require('../../_classes/services/players');
const shopService = require('../../_classes/services/shop');
const imagesService = require('../../_classes/services/images');
const framesService = require('../../_classes/services/frames');
const prisma = require('../../_classes/prisma');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja o perfil de algum membro'))

module.exports = {
    name: 'perfil',
    aliases: ['p', 'profile', 'level'],
    category: 'Social',
    description: 'Veja suas informações como nível e tenha um perfil bonito',
    data,
    mastery: 6,
	async execute(interaction) {
        
        let member = interaction.options.getUser('membro') || interaction.user

        const check = await playersService.cooldown.check(interaction.user.id, "profile");
        if (check) {

            playersService.cooldown.message(interaction, 'profile', 'visualizar um perfil')

            return;
        }

        playersService.cooldown.set(interaction.user.id, "profile", 10);

        await interaction.reply({ content: `<a:loading:736625632808796250> Carregando informações do perfil` })

        const user_id = BigInt(member.id)
        const playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
        const obj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
        const players_utils = await prisma.players_utils.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
        const mastery = await playersService.getMastery(member.id)
        const maqimg = (await shopService.getProduct(playerobj.machine)).img;
        let bio = obj.bio;
        let perm = obj.perm;
        let textcolor = '#dedcde'
        let colors = {
            1: '#ffffff',
            2: '#2f7a78',
            3: '#739f3d',
            4: '#ff6f36',
            5: '#7936ff'
        }

        const profileimage = await imagesService.imagegens.get('profile.js')({

            textcolor,
            boxescolor: colors[perm],
            name: member.username.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z</>.,+÷=_!@#$%^&*()'":;{}?¿ ])/g, '').trim() + '.',
            bio: bio.replace(/<prefixo>/g, '/'),
            mastery,
            url: {
                bg: obj.bglink,
                avatar: member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
                maq: maqimg,
                badges: (!obj.badges || obj.badges == null || obj.badges.length == 0 ? undefined : obj.badges)
            },
            frame: (obj.frames != null && obj.frames[0] != 0 ? await framesService.get(obj.frames[0]) : undefined),
            reps: Number(obj.reps),
            level: playerobj.level,
            xp: playerobj.xp,
            perm,
            profile_color: players_utils.profile_color

        })

        await interaction.editReply({ content: null, files: [profileimage] } );

	}
};
