const Discord = require('../discordCompat');
const DatabaseManager = require('../manager/DatabaseManager');
const crateService = require('./crateExtension');
const imageService = require('./images');
const shopService = require('./shop');
const UtilityService = require('./utilityService');

class PlayersService {
    constructor() {
        this.database = new DatabaseManager();
        this.utility = new UtilityService();
        this.cooldown = {};
        this.stamina = {};
        this.configureCooldown();
        this.configureStamina();
    }

    async execExp(interaction, xpp, pure) {
        if (!interaction || xpp == null) return;
        const machine = await this.database.get(interaction.user.id, 'machines');
        const product = shopService.getProduct(machine.machine);
        const xp = pure ? xpp : Math.round((xpp * (product.tier + 1)) / 1.35);

        if (machine.xp + xp >= machine.level * 1980) {
            await this.database.set(interaction.user.id, 'machines', 'level', machine.level + 1);
            await this.database.set(interaction.user.id, 'machines', 'xp', 0);
            const slot = (machine.level + 1) % 6 === 0 && ((machine.level + 1) / 6) < 5;
            const levelupImage = await imageService.imagegens.get('levelup.js')({
                level: machine.level,
                avatar: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })
            });
            const embed = new Discord.MessageEmbed()
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setImage('attachment://image.png')
                .addField('🥇 Recompensas', `**3x <:caixaup:782307290295435304> Caixa up**! Utilize \`/mochila\` para visualizar suas caixas.${slot ? '\nVocê recebeu +1 Slot de Aprimoramento para máquinas!' : ''}`)
                .setFooter(`Você evoluiu do nível ${machine.level} para o nível ${machine.level + 1}`)
                .setColor('RANDOM');
            await crateService.give(interaction.user.id, 2, 3);
            await interaction.channel.send({ embeds: [embed], mention: true, files: [levelupImage] });
        } else {
            await this.database.increment(interaction.user.id, 'machines', 'xp', xp);
        }
        await this.database.increment(interaction.user.id, 'machines', 'totalxp', xp);
        return xp;
    }

    configureCooldown() {
        this.cooldown.check = async (userId, name) => (await this.cooldown.get(userId, name)) >= 1;
        this.cooldown.get = async (userId, name) => {
            const record = await this.database.get(userId, 'cooldowns');
            if (!record || record === '0;0') {
                await this.cooldown.set(userId, name, 0);
                return 0;
            }
            const value = record[name];
            if (typeof value !== 'string') return 0;
            const [startedAt, duration] = value.split(';').map(Number);
            if (!Number.isFinite(startedAt) || !Number.isFinite(duration)) return 0;
            return Math.round(duration - ((Date.now() - startedAt) / 1000)) * 1000;
        };
        this.cooldown.set = (userId, name, milliseconds) => this.database.set(userId, 'cooldowns', name, `${Date.now()};${milliseconds}`);
        this.cooldown.message = async (interaction, name, text) => {
            const embed = new Discord.MessageEmbed()
                .setColor('#b8312c')
                .setDescription(`🕑 Aguarde mais \`${this.utility.ms(await this.cooldown.get(interaction.user.id, name))}\` para ${text}.`)
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
            return interaction.reply({ embeds: [embed] });
        };
    }

    async addMastery(userId, value) {
        return this.database.increment(userId, 'players', 'mastery', value);
    }

    async getMastery(userId) {
        const player = await this.database.get(userId, 'players');
        return player.mastery;
    }

    configureStamina() {
        this.stamina.get = async (userId) => {
            const player = await this.database.get(userId, 'players');
            const elapsed = Math.round(30000 - ((Date.now() - player.stamina) / 1000));
            return elapsed < 1 ? 1000 : 1000 - ((elapsed - (elapsed % 30)) / 30) - 1;
        };
        this.stamina.time = async (userId) => {
            const player = await this.database.get(userId, 'players');
            return Math.round(30000 - ((Date.now() - player.stamina) / 1000)) * 1000;
        };
        this.stamina.set = (userId, value) => this.database.set(userId, 'players', 'stamina', value);
        this.stamina.subset = (userId, value) => this.stamina.set(userId, Date.now() - (30000 * value));
        this.stamina.remove = async (userId, value) => this.stamina.subset(userId, await this.stamina.get(userId) - value);
        this.stamina.add = async (userId, value) => this.stamina.subset(userId, await this.stamina.get(userId) + value);
    }
}

module.exports = new PlayersService();
