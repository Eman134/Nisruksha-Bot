const Discord = require('discord.js');
const prisma = require('../prisma');
const crateService = require('./crateExtension');
const imageService = require('./images');
const shopService = require('./shop');
const UtilityService = require('./utilityService');

class PlayersService {
    constructor() {
        this.utility = new UtilityService();
        this.cooldown = {};
        this.stamina = {};
        this.configureCooldown();
        this.configureStamina();
    }

    async execExp(interaction, xpp, pure) {
        if (!interaction || xpp == null) return;
        const user_id = BigInt(interaction.user.id);
        const machine = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
        const product = shopService.getProduct(machine.machine);
        const xp = pure ? xpp : Math.round((xpp * (product.tier + 1)) / 1.35);

        if (machine.xp + xp >= machine.level * 1980) {
            await prisma.machines.update({ where: { user_id }, data: { level: machine.level + 1, xp: 0 } });
            const slot = (machine.level + 1) % 6 === 0 && ((machine.level + 1) / 6) < 5;
            const levelupImage = await imageService.imagegens.get('levelup.js')({
                level: machine.level,
                avatar: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })
            });
            const embed = new Discord.EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                .setImage('attachment://image.png')
                .addFields({ name: '🥇 Recompensas', value: `**3x <:caixaup:782307290295435304> Caixa up**! Utilize \`/mochila\` para visualizar suas caixas.${slot ? '\nVocê recebeu +1 Slot de Aprimoramento para máquinas!' : ''}` })
                .setFooter({ text: `Você evoluiu do nível ${machine.level} para o nível ${machine.level + 1}` })
                .setColor(Math.floor(Math.random() * 0xffffff));
            await crateService.give(interaction.user.id, 2, 3);
            await interaction.channel.send({ embeds: [embed], mention: true, files: [levelupImage] });
        } else {
            await prisma.machines.update({ where: { user_id }, data: { xp: { increment: xp } } });
        }
        await prisma.machines.update({ where: { user_id }, data: { totalxp: { increment: xp } } });
        return xp;
    }

    configureCooldown() {
        this.cooldown.check = async (userId, name) => (await this.cooldown.get(userId, name)) >= 1;
        this.cooldown.get = async (userId, name) => {
            const key = BigInt(userId);
            const record = await prisma.cooldowns.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key } });
            if (!record || record[name] === '0;0') {
                await this.cooldown.set(userId, name, 0);
                return 0;
            }
            const value = record[name];
            if (typeof value !== 'string') return 0;
            const [startedAt, duration] = value.split(';').map(Number);
            if (!Number.isFinite(startedAt) || !Number.isFinite(duration)) return 0;
            return Math.round(duration - ((Date.now() - startedAt) / 1000)) * 1000;
        };
        this.cooldown.set = (userId, name, milliseconds) => {
            const user_id = BigInt(userId);
            const value = `${Date.now()};${milliseconds}`;
            return prisma.cooldowns.upsert({ where: { user_id }, update: { [name]: value }, create: { user_id, [name]: value } });
        };
        this.cooldown.message = async (interaction, name, text) => {
            const embed = new Discord.EmbedBuilder()
                .setColor('#b8312c')
                .setDescription(`🕑 Aguarde mais \`${this.utility.ms(await this.cooldown.get(interaction.user.id, name))}\` para ${text}.`)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) });
            return interaction.reply({ embeds: [embed] });
        };
    }

    async addMastery(userId, value) {
        const user_id = BigInt(userId);
        return prisma.players.upsert({ where: { user_id }, update: { mastery: { increment: BigInt(value) } }, create: { user_id, frames: [], badges: [], mastery: BigInt(value) } });
    }

    async getMastery(userId) {
        const user_id = BigInt(userId);
        const player = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
        return Number(player.mastery);
    }

    configureStamina() {
        this.stamina.get = async (userId) => {
            const user_id = BigInt(userId);
            const player = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
            const elapsed = Math.round(30000 - ((Date.now() - Number(player.stamina)) / 1000));
            return elapsed < 1 ? 1000 : 1000 - ((elapsed - (elapsed % 30)) / 30) - 1;
        };
        this.stamina.time = async (userId) => {
            const user_id = BigInt(userId);
            const player = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
            return Math.round(30000 - ((Date.now() - Number(player.stamina)) / 1000)) * 1000;
        };
        this.stamina.set = (userId, value) => {
            const user_id = BigInt(userId);
            const stamina = BigInt(value);
            return prisma.players.upsert({ where: { user_id }, update: { stamina }, create: { user_id, stamina, frames: [], badges: [] } });
        };
        this.stamina.subset = (userId, value) => this.stamina.set(userId, Date.now() - (30000 * value));
        this.stamina.remove = async (userId, value) => this.stamina.subset(userId, await this.stamina.get(userId) - value);
        this.stamina.add = async (userId, value) => this.stamina.subset(userId, await this.stamina.get(userId) + value);
    }
}

module.exports = new PlayersService();
