const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportWarning } = require('./debug');

function sanitizeEmojiText(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/<a?:([A-Za-z0-9_]+):\d+>/g, ':$1:');
}

let stringOptionPrototype;
new SlashCommandBuilder().addStringOption(option => {
    stringOptionPrototype = option.constructor.prototype;
    return option;
});

stringOptionPrototype.addChoice = function(name, value) {
    return this.addChoices({ name, value });
};

class LegacyEmbedBuilder extends Discord.EmbedBuilder {
    setColor(color) {
        if (color === 'RANDOM') color = Math.floor(Math.random() * 0xffffff);
        return super.setColor(color);
    }

    addField(name, value, inline = false) {
        return this.addFields({ name: sanitizeEmojiText(name), value: sanitizeEmojiText(value), inline });
    }

    addFields(...fields) {
        const normalizedFields = fields.flat().map((field) => ({
            ...field,
            name: sanitizeEmojiText(String(field.name ?? '')).slice(0, 256),
            value: sanitizeEmojiText(String(field.value ?? '')).slice(0, 1024)
        }));
        const availableFields = Math.max(0, 25 - (this.data.fields?.length ?? 0));
        if (normalizedFields.length > availableFields && !this._fieldLimitWarningShown) {
            reportWarning('Embed field limit reached; extra fields were discarded', 'discord.embed.fields', {
                discarded: normalizedFields.length - availableFields
            });
            this._fieldLimitWarningShown = true;
        }
        if (availableFields === 0) return this;
        return super.addFields(...normalizedFields.slice(0, availableFields));
    }

    setTitle(title) {
        return super.setTitle(sanitizeEmojiText(title));
    }

    setDescription(description) {
        return super.setDescription(sanitizeEmojiText(description));
    }

    setAuthor(name, iconURL, url) {
        if (typeof name === 'object') return super.setAuthor({ ...name, name: sanitizeEmojiText(name.name) });
        return super.setAuthor({ name: sanitizeEmojiText(name), iconURL, url });
    }

    setFooter(text, iconURL) {
        if (typeof text === 'object') return super.setFooter({ ...text, text: sanitizeEmojiText(text.text) });
        return super.setFooter({ text: sanitizeEmojiText(text), iconURL });
    }
}

class LegacyButtonBuilder extends Discord.ButtonBuilder {
    setStyle(style) {
        if (typeof style === 'string') {
            const name = style.charAt(0).toUpperCase() + style.slice(1).toLowerCase();
            style = Discord.ButtonStyle[name] ?? style;
        }
        return super.setStyle(style);
    }
}

class LegacyAttachmentBuilder extends Discord.AttachmentBuilder {
    constructor(attachment, name) {
        super(attachment, typeof name === 'string' ? { name } : name);
    }
}

function patchReplyMethod(InteractionClass) {
    if (!InteractionClass?.prototype?.reply || InteractionClass.prototype.reply.__nisrukshaPatched) return;

    const reply = InteractionClass.prototype.reply;
    const wrappedReply = function(options) {
        if (!options || (!options.fetchReply && !options.withResponse)) return reply.call(this, options);

        const { fetchReply, withResponse, ...payload } = options;
        return reply.call(this, { ...payload, withResponse: true }).then((response) => {
            return response?.resource?.message || this.fetchReply();
        });
    };

    wrappedReply.__nisrukshaPatched = true;
    InteractionClass.prototype.reply = wrappedReply;
}

patchReplyMethod(Discord.ChatInputCommandInteraction);
patchReplyMethod(Discord.ContextMenuCommandInteraction);
patchReplyMethod(Discord.MessageComponentInteraction);
patchReplyMethod(Discord.ModalSubmitInteraction);

Discord.MessageEmbed = LegacyEmbedBuilder;
Discord.MessageActionRow = Discord.ActionRowBuilder;
Discord.MessageButton = LegacyButtonBuilder;
Discord.MessageSelectMenu = Discord.StringSelectMenuBuilder;
Discord.MessageAttachment = LegacyAttachmentBuilder;

module.exports = Discord;
