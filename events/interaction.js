const prisma = require('../_classes/prisma');
const config = require('../_classes/config');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const clientService = require('../_classes/services/clientService');
const companyService = require('../_classes/services/company');
const playersService = require('../_classes/services/players');
const runtime = require('../_classes/services/runtime');
const UtilityService = require('../_classes/services/utilityService');
const utility = new UtilityService();
const { reportError } = require('../_classes/debug');

module.exports = {
    name: 'interactionCreate',
    execute: async (interaction) => {
        if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

        const client = clientService.current;
        const command = interaction.commandName;
        if (interaction.guild && interaction.channel) {
            interaction.url = `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${interaction.id}`;
        }

        const commandFile = client.commands.get(command);
        if (!commandFile) return;

        try {
            const blocked = await checkAll(interaction, {
                req: commandFile.perm || 1,
                mastery: commandFile.mastery || 0,
                companytype: commandFile.companytype
            });
            if (blocked) return;
            await commandFile.execute(interaction);
        } catch (error) {
            const normalized = reportError(error, 'discord.interaction', {
                command,
                userId: interaction.user?.id,
                guildId: interaction.guild?.id,
                channelId: interaction.channel?.id
            });
            await replyInteractionError(interaction, command, normalized);
        }
    }
};

async function replyInteractionError(interaction, command, error) {
    const errorMessage = `Ocorreu um erro ao executar /${command}. O erro foi registrado para investigação.`;
    try {
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
                components: [new TextDisplayBuilder().setContent(errorMessage)],
                flags: Discord.MessageFlags.IsComponentsV2
            });
        } else {
            await interaction.reply({
                components: [new TextDisplayBuilder().setContent(errorMessage)],
                flags: Discord.MessageFlags.Ephemeral | Discord.MessageFlags.IsComponentsV2
            });
        }
    } catch (replyError) {
        reportError(replyError, 'discord.interaction.error_reply', { command, originalError: error.stack });
    }
}

async function checkAll(interaction, { req, mastery: masteryRequired = 0, companytype }) {
    const user_id = BigInt(interaction.user.id);
    const server_id = BigInt(interaction.guild.id);
    const global_id = BigInt(config.app.id);
    const player = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } });
    const server = await prisma.servers.upsert({ where: { server_id }, update: { server_id }, create: { server_id } });
    const global = await prisma.globals.upsert({ where: { user_id: global_id }, update: { user_id: global_id }, create: { user_id: global_id, keys: [], remember: [], processing: [] } });
    const client = clientService.current;

    if (config.app.id === '726943606761324645' && interaction.channel.id !== '703293776788979812' && player.perm < 4) {
        await interaction.reply({
            components: [new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> Você não pode utilizar o bot BETA neste canal!`)
            )],
            flags: Discord.MessageFlags.IsComponentsV2
        });
        return true;
    }

    if (await playersService.cooldown.check(interaction.user.id, 'antispam')) return true;
    playersService.cooldown.set(interaction.user.id, 'antispam', 3);

    if (player.perm === 0) {
        if (await playersService.cooldown.check(interaction.user.id, 'banned')) return true;
        playersService.cooldown.set(interaction.user.id, 'banned', 60);
        client.emit('fail', { interaction, type: 'ban', sendMe: true, desc: `<:banido:756525777981276331> Você está **BANIDO** do Nisruksha!\nMotivo: ${player.banreason}` });
        return true;
    }

    if (server.status === 2 && player.perm < 4) {
        await interaction.guild.leave();
        client.emit('fail', { interaction, type: 'ban', sendMe: true, desc: `<:banido:756525777981276331> Este servidor está **BANIDO** do Nisruksha!\nMotivo: ${server.banreason}\n[MEU SERVIDOR](https://bit.ly/svnisru)` });
        return true;
    }
    if (server.status === 1 && player.perm < 4) {
        client.emit('fail', { interaction, type: 'no-permitted', sendMe: true, desc: '<:error:736274027756388353> Este servidor não está permitido o uso de comandos!' });
        return true;
    }
    if (player.perm < 4 && global.status === 2) {
        client.emit('fail', { interaction, type: 'manutenção', sendMe: true, desc: `⚙ **O BOT ESTÁ EM MODO MANUTENÇÃO NO MOMENTO!**\nMotivo: **${global.man}**` });
        return true;
    }

    const accountAge = Date.now() - new Date(interaction.user.createdAt).getTime();
    if (accountAge < 86400000 * 7) {
        client.emit('fail', { interaction, type: 'conta recente', sendMe: true, desc: `Você poderá usar o bot em \`${utility.ms(86400000 * 7 - accountAge)}\`` });
        return true;
    }

    if (global.status === 0) {
        try {
            const member = await client.guilds.cache.get('693150851396796446').members.fetch(interaction.user.id, { force: true, cache: true });
            if (!member) return true;
        } catch (error) {
            reportError(error, 'discord.interaction.official_guild_check', { userId: interaction.user?.id, guildId: interaction.guild?.id });
            return true;
        }
    }

    if (req > 1 && player.perm < req) {
        playersService.cooldown.set(interaction.user.id, 'antispam', 3);
        await interaction.reply({
            components: [new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> Você não possui permissões necessárias para executar isto.`)
            )],
            flags: Discord.MessageFlags.IsComponentsV2
        });
        return true;
    }

    const me = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
    const permissions = interaction.channel.permissionsFor(me);
    const requiredPermissions = [
        ['EmbedLinks', 'INSERIR LINKS'], ['AttachFiles', 'ANEXAR ARQUIVOS'],
        ['UseExternalEmojis', 'EMOJIS EXTERNOS'], ['AddReactions', 'ADICIONAR REAÇÕES'],
        ['ReadMessageHistory', 'LER HISTÓRICO']
    ];
    const missing = requiredPermissions.filter(([permission]) => !permissions.has(permission));
    if (missing.length > 0 && player.perm < 4) {
        client.emit('fail', { interaction, type: 'sem permissão', sendMe: true, desc: 'O bot necessita das permissões necessárias para executar este comando.' });
        return true;
    }

    if (player.mvp != null && Date.now() - player.mvp > 0) {
        const message = new ContainerBuilder()
            .setAccentColor(0xf21a0f)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Opa, deslizou ai?'),
                new TextDisplayBuilder().setContent('Seu **MVP** acaba de ter seu tempo expirado!')
            );
        await interaction.channel.send({ components: [message], flags: Discord.MessageFlags.IsComponentsV2 });
        await prisma.players.update({ where: { user_id }, data: { mvp: null } });
        if (player.perm === 3) await prisma.players.update({ where: { user_id }, data: { perm: 1 } });
    }

    if (await playersService.cooldown.check(interaction.user.id, 'global')) {
        if (await playersService.cooldown.check(interaction.user.id, 'antispam')) return true;
        const message = await playersService.cooldown.message(interaction, 'global', 'digitar outro comando');
        setTimeout(() => message.delete(), 5000);
        playersService.cooldown.set(interaction.user.id, 'antispam', 10);
        return true;
    }

    playersService.cooldown.set(interaction.user.id, 'global', Math.round((4500 - player.perm * 500) / 1000));
    runtime.commandsExecuted += 1;
    runtime.playersSeen.add(String(interaction.user.id));
    await prisma.globals.update({ where: { user_id: global_id }, data: { totalcmd: { increment: BigInt(1) } } });
    await prisma.players.update({ where: { user_id }, data: { cmdsexec: { increment: 1 } } });
    await prisma.servers.update({ where: { server_id }, data: { cmdsexec: { increment: 1 } } });
    await prisma.servers.update({ where: { server_id }, data: { lastcmd: Date.now() } });

    const masteryCooldown = await playersService.cooldown.check(interaction.user.id, 'mastery');
    if (!masteryCooldown) await playersService.addMastery(interaction.user.id, masteryRequired + 1);
    else playersService.cooldown.set(interaction.user.id, 'mastery', 120);

    if (companytype && companytype > 0 && !(await companyService.check.hasCompany(interaction.user.id)) && !(await companyService.check.isWorker(interaction.user.id))) {
        await interaction.reply({
            components: [new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> Você deve ser funcionário ou possuir uma empresa para realizar esta ação!`)
            )],
            flags: Discord.MessageFlags.IsComponentsV2
        });
        return true;
    }

    return false;
}
