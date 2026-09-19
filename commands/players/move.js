const Discord = require('../../_classes/discordCompat');
const cacheListsService = require('../../_classes/services/cacheLists');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const townsService = require('../../_classes/services/towns');
const playersService = require('../../_classes/services/players');
const economyService = require('../../_classes/services/economy');
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
	async execute(interaction) {

        
        let vila = interaction.options.getString('vila');

        if (await cacheListsService.waiting.includes(interaction.user.id, 'mining')) {
            const embedtemp = await utility.sendError(interaction, `Você não pode se mover enquanto minera! [[VER MINERAÇÃO]](${await cacheListsService.waiting.getLink(interaction.user.id, 'mining')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (await cacheListsService.waiting.includes(interaction.user.id, 'fishing')) {
            const embedtemp = await utility.sendError(interaction, `Você não pode se mover enquanto pesca! [[VER PESCA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'fishing')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (await cacheListsService.waiting.includes(interaction.user.id, 'hunting')) {
            const embedtemp = await utility.sendError(interaction, `Você não pode se mover enquanto caça! [[VER CAÇA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'hunting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (await cacheListsService.waiting.includes(interaction.user.id, 'collecting')) {
            const embedtemp = await utility.sendError(interaction, `Você não pode se mover enquanto coleta! [[VER COLETA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'collecting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (await cacheListsService.waiting.includes(interaction.user.id, 'digging')) {
            const embedtemp = await utility.sendError(interaction, `Você não pode se mover enquanto escava um tesouro! [[VER ESCAVAÇÃO]](${await cacheListsService.waiting.getLink(interaction.user.id, 'digging')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }


        let atual = await townsService.getTownNum(interaction.user.id);
        let prox = townsService.getTownNumByName(vila);

        if (atual == prox) {
            const embedtemp = await utility.sendError(interaction, `Você já se encontra nesta vila!\nUtilize \`/mapa\` para visualizar as vilas existentes.`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let stamina = await playersService.stamina.get(interaction.user.id)
        let staminamax = 1000;

        if (stamina < 100) {
            
            const embedtemp = await utility.sendError(interaction, `Você não possui estamina o suficiente para se mover!\nPara mover entre vilas gasta 100 pontos de Estamina.\n🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${staminamax}]**`)
            await interaction.reply({ embeds: [embedtemp]})
            return;

        }
        
        const check = await playersService.cooldown.check(interaction.user.id, "move");
        if (check) {

            playersService.cooldown.message(interaction, 'move', 'mover-se pelas vilas')

            return;
        }
        playersService.cooldown.set(interaction.user.id, "move", 60*5);
        
        townsService.population[townsService.getTownNameByNum(prox)]++;
        townsService.population[townsService.getTownNameByNum(atual)]--;

        DatabaseManager.set(interaction.user.id, 'towns', 'loc', prox);
        let assaltado = false;
        let total = 0;
        let money = await economyService.money.get(interaction.user.id);
        let assaltantes = utility.random(1, 10);
        if (utility.random(0, 100) < 50) assaltado = true;
        if (assaltado) {
            if (money < 1) {
                assaltado = false;
            } else {
                total = Math.round( (assaltantes*5)*money/100);
                if (total < 1) {
                    assaltado = false;
                } else {
                    economyService.money.remove(interaction.user.id, total);
                    economyService.money.globaladd(total);
                    economyService.addToHistory(interaction.user.id, `Assalto | - ${utility.format(total)} ${utility.moneyemoji}`)
                }
            }
        }
        
        playersService.stamina.remove(interaction.user.id, 149)
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription(`Você usou 100 pontos de Estamina 🔸 e se moveu da vila **${townsService.getTownNameByNum(atual)}** para a vila **${townsService.getTownNameByNum(prox)}**${assaltado ? `\n🏴‍☠️ No meio de sua travessia você foi assaltado por ${assaltantes} assaltantes e perdeu ${assaltantes*5}% (${utility.format(total)} ${utility.money} ${utility.moneyemoji}) do seu dinheiro!\n**Dica: Deposite seu dinheiro no banco para não ser assaltado!**` : ''}`)
        await interaction.reply({ embeds: [embed], mention: true });

	}
};
