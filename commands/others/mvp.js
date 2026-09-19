const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const runtime = require('../../_classes/services/runtime');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'mvp',
    aliases: ['vip'],
    category: 'Outros',
    description: 'Veja as vantagens e caso você tenha um MVP veja o tempo restante',
    mastery: 15,
	async execute(interaction) {

                                                
                const embed = new Discord.EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                .setTitle(`Doe para o nosso projeto`)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields({ name: `<:list:736274028179750922> Quais as vantagens?`, value: `
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

` })
                .setColor(Math.floor(Math.random() * 0xffffff))
                .addFields({ name: `<:mvp:758717273304465478> Como adquirir um MVP?`, value: `

🔗 Para adquirir um MVP basta utilizar \`/doar\` e ver as informações

` }).setTimestamp()

            let pobj = await DatabaseManager.get(interaction.user.id, 'players')
            if (runtime.debug)console.log(Date.now()-pobj.mvp)
            if (pobj.mvp != null) {
                embed.addFields({ name: `<:info:736274028515295262> Informações do seu MVP`, value: `Tempo restante: **${compactTime((Date.now()-pobj.mvp)*-1)}**` })
            }

            if (interaction.replied) return interaction.channel.send({ embeds: [embed]})
            await interaction.reply({ embeds: [embed] });
        
        
	}
};
