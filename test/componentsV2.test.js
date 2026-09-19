const test = require('node:test');
const assert = require('node:assert/strict');
const Discord = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = Discord;
const { normalizePayload } = require('../_classes/componentsV2');

test('converts content and embeds to Components V2', () => {
    const payload = normalizePayload({
        content: 'Mensagem principal',
        embeds: [new EmbedBuilder()
            .setColor('#b8312c')
            .setTitle('Titulo')
            .setDescription('Descricao')
            .addFields({ name: 'Campo', value: 'Valor' })],
        flags: Discord.MessageFlags.Ephemeral,
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ok').setLabel('OK').setStyle(ButtonStyle.Primary))]
    });

    assert.equal(payload.content, undefined);
    assert.equal(payload.embeds, undefined);
    assert.equal(payload.flags & Discord.MessageFlags.IsComponentsV2, Discord.MessageFlags.IsComponentsV2);
    assert.equal(payload.flags & Discord.MessageFlags.Ephemeral, Discord.MessageFlags.Ephemeral);

    const json = payload.components.map((component) => component.toJSON());
    assert.equal(json[0].type, 10);
    assert.equal(json[1].type, 1);
    assert.equal(json[2].type, 17);
    assert.match(json[2].components[0].content, /Titulo/);
    assert.match(json[2].components[0].content, /Descricao/);
});

test('converts string messages and keeps normalization idempotent', () => {
    const payload = normalizePayload('Mensagem simples');
    assert.equal(payload.flags, Discord.MessageFlags.IsComponentsV2);
    assert.equal(payload.components[0].toJSON().content, 'Mensagem simples');
    assert.equal(normalizePayload(payload), payload);
});

test('exposes uploaded files through Components V2', () => {
    const payload = normalizePayload({ files: [{ attachment: Buffer.from('x'), name: 'image.png' }] });
    assert.deepEqual(payload.components[0].toJSON(), { type: 13, file: { url: 'attachment://image.png' } });
});
