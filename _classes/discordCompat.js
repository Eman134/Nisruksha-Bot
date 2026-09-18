const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

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
        return this.addFields({ name, value, inline });
    }

    setAuthor(name, iconURL, url) {
        if (typeof name === 'object') return super.setAuthor(name);
        return super.setAuthor({ name, iconURL, url });
    }

    setFooter(text, iconURL) {
        if (typeof text === 'object') return super.setFooter(text);
        return super.setFooter({ text, iconURL });
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

Discord.MessageEmbed = LegacyEmbedBuilder;
Discord.MessageActionRow = Discord.ActionRowBuilder;
Discord.MessageButton = LegacyButtonBuilder;
Discord.MessageSelectMenu = Discord.StringSelectMenuBuilder;
Discord.MessageAttachment = LegacyAttachmentBuilder;

module.exports = Discord;
