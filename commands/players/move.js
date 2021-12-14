const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('vila').setDescription('Selecione a vila para a qual deseja se mover')
  .addChoice('Nishigami', 'Nishigami')
  .addChoice('Tyris', 'Tyris')
  .addChoice('Harotec', 'Harotec')
  .addChoice('Massibi', 'Massibi')
  .setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'mover',
    aliases: ['move'],
    category: 'Players',
    description: 'Mova-se para uma outra vila específica',
    data,
    mastery: 25,
	async execute(API, interaction) {

        const Discord = API.Discord;

        let vila = interaction.options.getString('vila');

        if (API.cacheLists.waiting.includes(interaction.user.id, 'mining')) {
            const embedtemp = await API.sendError(interaction, `Você não pode se mover enquanto minera! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(interaction.user.id, 'mining')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (API.cacheLists.waiting.includes(interaction.user.id, 'fishing')) {
            const embedtemp = await API.sendError(interaction, `Você não pode se mover enquanto pesca! [[VER PESCA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'fishing')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (API.cacheLists.waiting.includes(interaction.user.id, 'hunting')) {
            const embedtemp = await API.sendError(interaction, `Você não pode se mover enquanto caça! [[VER CAÇA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'hunting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (API.cacheLists.waiting.includes(interaction.user.id, 'collecting')) {
            const embedtemp = await API.sendError(interaction, `Você não pode se mover enquanto coleta! [[VER COLETA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'collecting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (API.cacheLists.waiting.includes(interaction.user.id, 'digging')) {
            const embedtemp = await API.sendError(interaction, `Você não pode se mover enquanto escava um tesouro! [[VER ESCAVAÇÃO]](${API.cacheLists.waiting.getLink(interaction.user.id, 'digging')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }


        let atual = await API.townExtension.getTownNum(interaction.user.id);
        let prox = API.townExtension.getTownNumByName(vila);

        if (atual == prox) {
            const embedtemp = await API.sendError(interaction, `Você já se encontra nesta vila!\nUtilize \`/mapa\` para visualizar as vilas existentes.`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let stamina = await API.playerUtils.stamina.get(interaction.user.id)
        let staminamax = 1000;

        if (stamina < 100) {
            
            const embedtemp = await API.sendError(interaction, `Você não possui estamina o suficiente para se mover!\nPara mover entre vilas gasta 100 pontos de Estamina.\n🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${staminamax}]**`)
            await interaction.reply({ embeds: [embedtemp]})
            return;

        }
        
        const check = await API.playerUtils.cooldown.check(interaction.user.id, "move");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'move', 'mover-se pelas vilas')

            return;
        }
        API.playerUtils.cooldown.set(interaction.user.id, "move", 60*5);
        
        API.townExtension.population[API.townExtension.getTownNameByNum(prox)]++;
        API.townExtension.population[API.townExtension.getTownNameByNum(atual)]--;

        DatabaseManager.set(interaction.user.id, 'towns', 'loc', prox);
        let assaltado = false;
        let total = 0;
        let money = await API.eco.money.get(interaction.user.id);
        let assaltantes = API.random(1, 10);
        if (API.random(0, 100) < 50) assaltado = true;
        if (assaltado) {
            if (money < 1) {
                assaltado = false;
            } else {
                total = Math.round( (assaltantes*5)*money/100);
                if (total < 1) {
                    assaltado = false;
                } else {
                    API.eco.money.remove(interaction.user.id, total);
                    API.eco.money.globaladd(total);
                    API.eco.addToHistory(interaction.user.id, `Assalto | - ${API.format(total)} ${API.moneyemoji}`)
                }
            }
        }
        
        API.playerUtils.stamina.remove(interaction.user.id, 149)
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription(`Você usou 100 pontos de Estamina 🔸 e se moveu da vila **${API.townExtension.getTownNameByNum(atual)}** para a vila **${API.townExtension.getTownNameByNum(prox)}**${assaltado ? `\n🏴‍☠️ No meio de sua travessia você foi assaltado por ${assaltantes} assaltantes e perdeu ${assaltantes*5}% (${API.format(total)} ${API.money} ${API.moneyemoji}) do seu dinheiro!\n**Dica: Deposite seu dinheiro no banco para não ser assaltado!**` : ''}`)
        await interaction.reply({ embeds: [embed], mention: true });

	}
};