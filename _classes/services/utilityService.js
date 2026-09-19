const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');

class UtilityService {
    constructor() {
        this.money = 'moedas';
        this.moneyemoji = '<:moneybag:736290479406317649>';
        this.money2 = 'cristais';
        this.money2emoji = '<:estilhas:743176785986060390>';
        this.money3 = 'fichas';
        this.money3emoji = '<:ficha:741827151879471115>';
        this.tp = { name: 'pontos temporais', emoji: '<:tp:841870541274087455>' };
        this.mastery = { name: 'pontos de maestria', emoji: '🔰' };
    }

    format(value) {
        return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }

    toNumber(value) {
        return parseInt((value + '').replace(/k/g, '000').replace(/m/g, '000000').replace(/b/g, '000000000'));
    }

    random(min, max, doubled = false) {
        return doubled ? min + (max - min) * Math.random() : Math.floor(Math.random() * (max - min) + min);
    }

    isInt(value) {
        if (isNaN(value)) return false;
        const parsed = parseFloat(value);
        return (parsed | 0) === parsed;
    }

    isOdd(value) {
        return Math.abs(value % 2) === 1;
    }

    uptime() {
        const uptime = process.uptime();
        const days = Math.floor((uptime % 31536000) / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.round(uptime % 60);
        return (days > 0 ? days + ' dias, ' : '') + (hours > 0 ? hours + ' horas, ' : '') +
            (minutes > 0 ? minutes + ' minutos, ' : '') + (seconds > 0 ? seconds + ' segundos' : '');
    }

    ms(milliseconds, compact = false) {
        const labels = compact ? ['mo', 'd', 'h', 'm e', 's'] : ['mêses', 'dias', 'horas', 'minutos e', 'segundos'];
        const pad = (value, size = 2) => ('00' + value).slice(-size);
        let seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        seconds %= 60;
        const hours = Math.floor(minutes / 60);
        const normalizedMinutes = minutes % 60;
        let days = Math.floor(hours / 24);
        const normalizedHours = hours % 24;
        const months = Math.floor(days / 30);
        days %= 30;
        return (months > 0 ? pad(months) + ' ' + labels[0] + ', ' : '') +
            (days > 0 ? pad(days) + ' ' + labels[1] + ', ' : '') +
            (normalizedHours > 0 ? pad(normalizedHours) + ' ' + labels[2] + ', ' : '') +
            (normalizedMinutes > 0 ? pad(normalizedMinutes) + ' ' + labels[3] + ' ' : '') +
            pad(seconds) + ' ' + labels[4];
    }

    getFormatedDate(onlyHour = false) {
        const moment = require('moment');
        moment.suppressDeprecationWarnings = true;
        const date = moment(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        return date.format(onlyHour ? 'HH:mm' : 'DD/MM/YYYY [|] HH:mm');
    }

    sendError(interaction, message, usage) {
        return new ContainerBuilder()
            .setAccentColor(0xb8312c)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**${interaction.user.tag}**\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`)
            );
    }

    createButton(id, style, label, emoji, disabled) {
        const buttonStyle = typeof style === 'string' ? style.charAt(0) + style.slice(1).toLowerCase() : style;
        const button = new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle[buttonStyle]);
        if (label !== undefined && label !== null && String(label).length > 0) button.setLabel(String(label).slice(0, 80));
        if (emoji) button.setEmoji(this.normalizeEmoji(emoji));
        if (style === 'LINK') button.setURL(id.toString());
        else button.setCustomId(id);
        if (disabled) button.setDisabled(true);
        return button;
    }

    rowComponents(components) {
        return new Discord.ActionRowBuilder().addComponents(...components);
    }

    createMenu({ id, placeholder, min, max }, options) {
        return new Discord.StringSelectMenuBuilder()
            .setCustomId(id)
            .setPlaceholder(placeholder)
            .setMinValues(min)
            .setMaxValues(max)
            .addOptions(options.map((option) => ({ ...option, emoji: option.emoji ? this.normalizeEmoji(option.emoji) : undefined })));
    }

    getProgress(maxTicks, tickCharacter, emptyCharacter, current, max, asPercent) {
        const percentage = current / max;
        const progress = Math.round(maxTicks * percentage);
        return '[' + tickCharacter.repeat(progress) + emptyCharacter.repeat(maxTicks - progress) + '] ' +
            (asPercent ? Math.round(percentage * 100) + '%' : '(' + current + '/' + max + ')');
    }

    getMultipleArgs(interaction, index) {
        const parts = interaction.content.split(/ /g);
        const prefix = parts.slice(0, index).join(' ') + ' ';
        return interaction.content.startsWith(prefix) ? interaction.content.substring(prefix.length) : prefix;
    }

    normalizeEmoji(emoji) {
        if (!emoji) return emoji;
        const customEmoji = typeof emoji === 'string' && emoji.match(/^<a?:[^:>]+:(\d+)>$/);
        return customEmoji ? '🔘' : emoji;
    }

    clone(value) {
        if (value === null || typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map((item) => this.clone(item));
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.clone(item)]));
    }
}

module.exports = UtilityService;
