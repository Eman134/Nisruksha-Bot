const API = require("../../_classes/api");

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

let bg

loadbg()

async function loadbg() {
    bg = await API.img.loadImage(`resources/backgrounds/profile/profile.png`)
}

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
	async execute(API, interaction) {
        
        let member = interaction.options.getUser('membro') || interaction.user

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "profile");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'profile', 'visualizar um perfil')

            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "profile", 10);

        await interaction.reply({ content: `<a:loading:736625632808796250> Carregando informações do perfil` })

        const playerobj = await DatabaseManager.get(member.id, 'machines')
        const obj = await DatabaseManager.get(member.id, "players")
        const players_utils = await DatabaseManager.get(member.id, "players_utils")
        const mastery = await API.playerUtils.getMastery(member.id)
        const maqimg = API.shopExtension.getProduct(playerobj.machine).img;
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

        const profileimage = await API.img.imagegens.get('profile.js')(API, {

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
            frame: (obj.frames != null && obj.frames[0] != 0 ? API.frames.get(obj.frames[0]) : undefined),
            reps: obj.reps,
            level: playerobj.level,
            xp: playerobj.xp,
            perm,
            profile_color: players_utils.profile_color

        })

        await interaction.editReply({ content: null, files: [profileimage] } );

	}
};