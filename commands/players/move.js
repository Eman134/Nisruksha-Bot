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
    requiredServices: ["Discord","cacheLists","eco","format","money","moneyemoji","playerUtils","random","sendError","townExtension"],
    name: 'mover',
    aliases: ['move'],
    category: 'Players',
    description: 'Mova-se para uma outra vila específica',
    data,
    mastery: 25,
	async execute(interaction, svcDiscord, svcCacheLists, svcEco, svcFormat, svcMoney, svcMoneyemoji, svcPlayerUtils, svcRandom, svcSendError, svcTownExtension) {
        let vila = interaction.options.getString('vila');

        if (await svcCacheLists.waiting.includes(interaction.user.id, 'mining')) {
            const embedtemp = await svcSendError(interaction, `Você não pode se mover enquanto minera! [[VER MINERAÇÃO]](${await svcCacheLists.waiting.getLink(interaction.user.id, 'mining')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (await svcCacheLists.waiting.includes(interaction.user.id, 'fishing')) {
            const embedtemp = await svcSendError(interaction, `Você não pode se mover enquanto pesca! [[VER PESCA]](${await svcCacheLists.waiting.getLink(interaction.user.id, 'fishing')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (await svcCacheLists.waiting.includes(interaction.user.id, 'hunting')) {
            const embedtemp = await svcSendError(interaction, `Você não pode se mover enquanto caça! [[VER CAÇA]](${await svcCacheLists.waiting.getLink(interaction.user.id, 'hunting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (await svcCacheLists.waiting.includes(interaction.user.id, 'collecting')) {
            const embedtemp = await svcSendError(interaction, `Você não pode se mover enquanto coleta! [[VER COLETA]](${await svcCacheLists.waiting.getLink(interaction.user.id, 'collecting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (await svcCacheLists.waiting.includes(interaction.user.id, 'digging')) {
            const embedtemp = await svcSendError(interaction, `Você não pode se mover enquanto escava um tesouro! [[VER ESCAVAÇÃO]](${await svcCacheLists.waiting.getLink(interaction.user.id, 'digging')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }


        let atual = await svcTownExtension.getTownNum(interaction.user.id);
        let prox = svcTownExtension.getTownNumByName(vila);

        if (atual == prox) {
            const embedtemp = await svcSendError(interaction, `Você já se encontra nesta vila!\nUtilize \`/mapa\` para visualizar as vilas existentes.`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let stamina = await svcPlayerUtils.stamina.get(interaction.user.id)
        let staminamax = 1000;

        if (stamina < 100) {
            
            const embedtemp = await svcSendError(interaction, `Você não possui estamina o suficiente para se mover!\nPara mover entre vilas gasta 100 pontos de Estamina.\n🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${staminamax}]**`)
            await interaction.reply({ embeds: [embedtemp]})
            return;

        }
        
        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "move");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'move', 'mover-se pelas vilas')

            return;
        }
        svcPlayerUtils.cooldown.set(interaction.user.id, "move", 60*5);
        
        svcTownExtension.population[svcTownExtension.getTownNameByNum(prox)]++;
        svcTownExtension.population[svcTownExtension.getTownNameByNum(atual)]--;

        DatabaseManager.set(interaction.user.id, 'towns', 'loc', prox);
        let assaltado = false;
        let total = 0;
        let svcMoney = await svcEco.svcMoney.get(interaction.user.id);
        let assaltantes = svcRandom(1, 10);
        if (svcRandom(0, 100) < 50) assaltado = true;
        if (assaltado) {
            if (svcMoney < 1) {
                assaltado = false;
            } else {
                total = Math.round( (assaltantes*5)*svcMoney/100);
                if (total < 1) {
                    assaltado = false;
                } else {
                    svcEco.svcMoney.remove(interaction.user.id, total);
                    svcEco.svcMoney.globaladd(total);
                    svcEco.addToHistory(interaction.user.id, `Assalto | - ${svcFormat(total)} ${svcMoneyemoji}`)
                }
            }
        }
        
        svcPlayerUtils.stamina.remove(interaction.user.id, 149)
		const embed = new svcDiscord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription(`Você usou 100 pontos de Estamina 🔸 e se moveu da vila **${svcTownExtension.getTownNameByNum(atual)}** para a vila **${svcTownExtension.getTownNameByNum(prox)}**${assaltado ? `\n🏴‍☠️ No meio de sua travessia você foi assaltado por ${assaltantes} assaltantes e perdeu ${assaltantes*5}% (${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}) do seu dinheiro!\n**Dica: Deposite seu dinheiro no banco para não ser assaltado!**` : ''}`)
        await interaction.reply({ embeds: [embed], mention: true });

	}
};
