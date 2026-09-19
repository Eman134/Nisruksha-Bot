const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const runtime = require('../../_classes/services/runtime');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const prisma = require('../../_classes/prisma');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'mvp',
    aliases: ['vip'],
    category: 'Outros',
    description: 'Veja as vantagens e caso você tenha um MVP veja o tempo restante',
    mastery: 15,
	async execute(interaction) {

                                                
                const fields = [
                    { name: `<:list:736274028179750922> Quais as vantagens?`, value: `
\`1.\` Energia recarrega mais rápido
\`2.\` Cor de destaque MVP no seu perfil
\`3.\` Uma bandeira de MVP no seu perfil
\`4.\` Menor cooldown em comandos
\`5.\` +2x Caixa comum no daily
\`6.\` Caça automática na exploração
\`7.\` 10% de Tempo de crescimento menor para agricultura
\`8.\` Aumenta em 10% a chance de pegar peixes na pescaria
\`9.\` Opção de subir anzol na pescaria
\`10.\` Molduras para perfil na ativação
\`11.\` Taxa de depósito reduzida [5% -> 2%]
\`12.\` Desconto global de 5% na loja
\`13.\` Taxa de venda de minérios reduzida [3% -> 1%]

OBS: As vantagens são ativas enquanto você possui um MVP!

` },
                    { name: `<:mvp:758717273304465478> Como adquirir um MVP?`, value: `

🔗 Para adquirir um MVP basta utilizar \`/doar\` e ver as informações

` }
                ];

            const user_id = BigInt(interaction.user.id)
            let pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
            if (runtime.debug)console.log(Date.now()-pobj.mvp)
            if (pobj.mvp != null) {
                fields.push({ name: `<:info:736274028515295262> Informações do seu MVP`, value: `Tempo restante: **${compactTime((Date.now()-pobj.mvp)*-1)}**` })
            }

            const container = new ContainerBuilder()
                .setAccentColor(Math.floor(Math.random() * 0xffffff))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                    `**${interaction.user.tag}**`,
                    '## Doe para o nosso projeto',
                    ...fields.map(field => `**${field.name}**\n${field.value}`)
                ].join('\n\n')))
                .addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: client.user.displayAvatarURL() } }));
            if (interaction.replied) return interaction.channel.send({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
        
        
	}
};
