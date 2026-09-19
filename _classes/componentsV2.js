const Discord = require('discord.js');
const {
    ContainerBuilder,
    FileBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    TextDisplayBuilder
} = require('@discordjs/builders');

const NORMALIZED = Symbol('componentsV2Normalized');
const COMPONENTS_V2 = Discord.MessageFlags.IsComponentsV2;

function splitText(value, size = 4000) {
    const text = String(value);
    const chunks = [];
    for (let index = 0; index < text.length; index += size) chunks.push(text.slice(index, index + size));
    return chunks.length > 0 ? chunks : [' '];
}

function addText(container, value) {
    if (value === undefined || value === null || value === '') return;
    for (const chunk of splitText(value)) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk));
}

function getEmbedData(embed) {
    if (!embed) return null;
    return typeof embed.toJSON === 'function' ? embed.toJSON() : embed;
}

function parseColor(color) {
    if (typeof color === 'number' && Number.isInteger(color)) return color;
    if (typeof color !== 'string') return null;
    const normalized = color.startsWith('#') ? color.slice(1) : color;
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
    return parseInt(normalized, 16);
}

function embedToContainer(embed) {
    const data = getEmbedData(embed);
    if (!data) return null;

    const container = new ContainerBuilder();
    const color = parseColor(data.color);
    if (color !== null) container.setAccentColor(color);

    const text = [];
    if (data.author?.name) text.push(`*${data.author.name}*`);
    if (data.title) text.push(data.url ? `## [${data.title}](${data.url})` : `## ${data.title}`);
    if (data.description) text.push(data.description);
    for (const field of data.fields || []) {
        text.push(`**${field.name || '\u200b'}**\n${field.value || '\u200b'}`);
    }
    if (data.footer?.text || data.timestamp) {
        const footer = data.footer?.text || '';
        const timestampValue = data.timestamp ? new Date(data.timestamp).getTime() : NaN;
        const timestamp = Number.isFinite(timestampValue) ? ` <t:${Math.floor(timestampValue / 1000)}:f>` : '';
        text.push(`-# ${footer}${timestamp}`.trim());
    }
    addText(container, text.join('\n\n'));

    if (data.image?.url || data.thumbnail?.url) {
        const gallery = new MediaGalleryBuilder();
        for (const url of [data.image?.url, data.thumbnail?.url].filter(Boolean)) {
            gallery.addItems(new MediaGalleryItemBuilder().setURL(url));
        }
        container.addMediaGalleryComponents(gallery);
    }
    if (text.length === 0 && !data.image?.url && !data.thumbnail?.url) addText(container, ' ');

    return container;
}

function getFileName(file) {
    if (!file) return null;
    if (file.name) return file.name;
    const data = typeof file.toJSON === 'function' ? file.toJSON() : file;
    if (data.name) return data.name;
    if (typeof data.attachment === 'string') return data.attachment.split(/[\\/]/).pop();
    return null;
}

function attachmentNameFromURL(url) {
    if (typeof url !== 'string' || !url.startsWith('attachment://')) return null;
    return url.slice('attachment://'.length);
}

function normalizePayload(input) {
    if (input && typeof input === 'object' && input[NORMALIZED]) return input;

    const payload = typeof input === 'string' ? { content: input } : { ...(input || {}) };
    const components = [...(payload.components || [])];
    const referencedFiles = new Set();

    if (payload.content !== undefined && payload.content !== null) {
        components.unshift(...splitText(payload.content).map((chunk) => new TextDisplayBuilder().setContent(chunk)));
    }
    for (const embed of payload.embeds || []) {
        const data = getEmbedData(embed);
        for (const url of [data?.image?.url, data?.thumbnail?.url]) {
            const name = attachmentNameFromURL(url);
            if (name) referencedFiles.add(name);
        }
        const container = embedToContainer(embed);
        if (container) components.push(container);
    }
    for (const file of payload.files || []) {
        const name = getFileName(file);
        if (name && !referencedFiles.has(name)) components.push(new FileBuilder().setURL(`attachment://${name}`));
    }

    delete payload.content;
    delete payload.embeds;
    delete payload.poll;
    delete payload.stickers;
    payload.components = components;
    payload.flags = new Discord.MessageFlagsBitField(payload.flags || 0).add(COMPONENTS_V2).bitfield;

    Object.defineProperty(payload, NORMALIZED, { value: true });
    return payload;
}

function wrapMethod(prototype, method, transform = normalizePayload) {
    if (!prototype || typeof prototype[method] !== 'function') return;
    const original = prototype[method];
    if (original[NORMALIZED]) return;

    function wrapped(first, ...rest) {
        return original.call(this, transform(first), ...rest);
    }
    Object.defineProperty(wrapped, NORMALIZED, { value: true });
    prototype[method] = wrapped;
}

function wrapSecondArgument(prototype, method, transform = normalizePayload) {
    if (!prototype || typeof prototype[method] !== 'function') return;
    const original = prototype[method];
    if (original[NORMALIZED]) return;

    function wrapped(first, second, ...rest) {
        return original.call(this, first, transform(second), ...rest);
    }
    Object.defineProperty(wrapped, NORMALIZED, { value: true });
    prototype[method] = wrapped;
}

function install() {
    for (const constructor of [
        Discord.CommandInteraction,
        Discord.MessageComponentInteraction,
        Discord.ModalSubmitInteraction,
        Discord.InteractionWebhook,
        Discord.WebhookClient,
        Discord.Message
    ]) {
        wrapMethod(constructor?.prototype, 'reply');
        wrapMethod(constructor?.prototype, 'editReply');
        wrapMethod(constructor?.prototype, 'followUp');
        wrapMethod(constructor?.prototype, 'send');
        wrapMethod(constructor?.prototype, 'edit');
        wrapSecondArgument(constructor?.prototype, 'editMessage');
    }

    for (const constructor of [Discord.BaseGuildTextChannel, Discord.DMChannel, Discord.ThreadChannel]) {
        wrapMethod(constructor?.prototype, 'send');
    }

    for (const constructor of [
        Discord.CommandInteraction,
        Discord.MessageComponentInteraction,
        Discord.ModalSubmitInteraction
    ]) {
        const addFlag = (options = {}) => ({
            ...options,
            flags: new Discord.MessageFlagsBitField(options.flags || 0).add(COMPONENTS_V2).bitfield
        });
        wrapMethod(constructor?.prototype, 'deferReply', addFlag);
        wrapMethod(constructor?.prototype, 'deferUpdate', addFlag);
    }
}

module.exports = { install, normalizePayload, embedToContainer };
