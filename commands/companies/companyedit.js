const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const companyInfo = require('../../_classes/services/companyInfo');
const clientService = require('../../_classes/services/clientService');
const playersService = require('../../_classes/services/players');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
    .addStringOption(option => option.setName('edição').setDescription('Digite a edição que irá ser realizada')
        .addChoices({ name: 'Editar logo', value: 'logo' })
        .addChoices({ name: 'Editar background', value: 'background' })
        .addChoices({ name: 'Editar descrição', value: 'desc' })
        .addChoices({ name: 'Editar liberação de vagas', value: 'vagas' })
        .addChoices({ name: 'Editar nome', value: 'nome' })
        .addChoices({ name: 'Editar taxa', value: 'taxa' })
        .setRequired(true))
    .addStringOption(option => option.setName('valor').setDescription('Digite o valor que a edição necessita').setRequired(false));

module.exports = {
    name: 'editarempresa',
    aliases: ['editarempresa', 'companyedit', 'companyedit'],
    category: 'Empresas',
    description: 'Personalize sua empresa do comando verempresa',
    data,
    mastery: 50,
    async execute(interaction) {
        const edição = interaction.options.getString('edição').toLowerCase();
        const valor = interaction.options.getString('valor');
        const errorText = message => new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\n${message}`);
        const replyError = message => interaction.reply({ components: [errorText(message)], flags: Discord.MessageFlags.IsComponentsV2 });
        const buildContainer = ({ color, title, description, fields = [], footer, image }) => {
            const container = new ContainerBuilder().setAccentColor(color);
            const texts = [];
            if (title) texts.push(new TextDisplayBuilder().setContent(`## ${title}`));
            if (description) texts.push(new TextDisplayBuilder().setContent(description));
            for (const [name, value] of fields) texts.push(new TextDisplayBuilder().setContent(`**${name}**\n${value}`));
            if (footer) texts.push(new TextDisplayBuilder().setContent(`-# ${footer}`));
            container.addTextDisplayComponents(...texts);
            if (image) container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(image)));
            return container;
        };

        if (!(await companyService.check.hasCompany(interaction.user.id))) {
            await replyError('Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize `/abrirempresa <setor> <nome>`');
            return;
        }

        const companyid = await companyService.get.idByOwner(interaction.user.id);
        const pricenome = 35;
        if (!['background', 'bg', 'logo', 'desc', 'description', 'descrição', 'setarvaga', 'vaga', 'vagas', 'setvaga', 'taxa', 'nome', 'name'].includes(edição)) {
            await interaction.reply({
                components: [buildContainer({ color: 0xfc7b03, description: `🐻 Olá, sou o Teddy e estou aqui para te auxiliar.\nVeja alguns comandos possíveis relacionados a editarempresa:\n \n\`/editarempresa background\` - Envie uma imagem junto do comando e seta o background da empresa no \`/veremp\`\n\`/editarempresa logo\` - Envie uma imagem junto do comando e seta a logo da empresa\n\`/editarempresa desc <texto>\` - Seta a descrição da sua empresa.\n\`/editarempresa vagas <on|off>\` - Seta a disponibilidade de vagas.\n\`/editarempresa taxa <1-50%>\` - Seta a taxa da empresa.\n\`/editarempresa nome <novonome>\` - Modifica o nome da sua empresa. ${pricenome} ⭐` })],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            return;
        }

        if (edição === 'background' || edição === 'bg') {
            if (valor == null) return replyError('Você precisa colocar uma url de imagem para o background!\nRecomendado imagens 700x450');
            companyInfo.set(interaction.user.id, companyid, 'bglink', valor);
            await interaction.reply({
                components: [buildContainer({ color: 0x8adb5e, description: 'O background da sua empresa foi definido para:', footer: 'Você pode visualizar as mudanças usando /veremp', image: valor })],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            try {
                clientService.current.guilds.cache.get('693150851396796446').channels.cache.get('736383144499871765').send({
                    components: [buildContainer({ color: 0x8adb5e, description: `Background da **EMPRESA** de \`${interaction.user.tag} | ${interaction.user.id}\``, image: valor })],
                    flags: Discord.MessageFlags.IsComponentsV2
                });
            } catch (err) {
                clientService.current.emit('error', err);
            }
        } else if (edição === 'logo') {
            if (valor == null) return replyError('Você precisa colocar uma url de imagem para o background!\nRecomendado imagens 700x450');
            companyInfo.set(interaction.user.id, companyid, 'logo', valor);
            await interaction.reply({
                components: [buildContainer({ color: 0x8adb5e, description: 'A logo da sua empresa foi definida para:', footer: 'Você pode visualizar as mudanças usando /veremp', image: valor })],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            try {
                clientService.current.guilds.cache.get('693150851396796446').channels.cache.get('736383144499871765').send({
                    components: [buildContainer({ color: 0x8adb5e, description: `Logo da **EMPRESA** de \`${interaction.user.tag} | ${interaction.user.id}\``, image: valor })],
                    flags: Discord.MessageFlags.IsComponentsV2
                });
            } catch (err) {
                clientService.current.emit('error', err);
            }
        } else if (edição.startsWith('desc')) {
            if (valor == null) return replyError('Você precisa definir um texto para setar como descrição');
            if (valor.length > 50) return replyError(`Você não pode colocar uma descrição com mais de 50 caracteres\nQuantia de caracteres da descrição: ${valor.length}/50`);
            companyInfo.set(interaction.user.id, companyid, 'descr', valor);
            await interaction.reply({ components: [buildContainer({ color: 0x8adb5e, description: `A descrição da sua empresa foi definida para:\n\`\`\`${valor}\`\`\``, footer: `Quantia de caracteres da descrição: ${valor.length}/50` })], flags: Discord.MessageFlags.IsComponentsV2 });
        } else if (edição.startsWith('vaga')) {
            if (valor == null || !['on', 'off'].includes(valor)) return replyError('Você deve indicar se deseja liberar as vagas da empresa ou não **[on/off]**');
            const boo = valor === 'on';
            await interaction.reply({ components: [buildContainer({ color: boo ? 0x5bff45 : 0xa60000, description: `Você setou as vagas da sua empresa para ${boo ? '🟢' : '🔴'} **${valor}**` })], flags: Discord.MessageFlags.IsComponentsV2 });
            companyInfo.set(interaction.user.id, companyid, 'openvacancie', boo);
        } else if (edição.startsWith('taxa')) {
            if (valor == null) return replyError('Você deve digitar o valor da taxa para funcionários! **[1%-50%]**\nA taxa padrão é de **25%**');
            let taxa = valor.replace(/%/g, '');
            if (!utility.isInt(taxa)) return replyError('Você deve digitar o valor da taxa EM NÚMERO para funcionários! **[1%-50%]**\nA taxa padrão é de **25%**');
            taxa = parseInt(taxa);
            if (taxa < 1 || taxa > 50) return replyError('Você deve digitar o valor da taxa entre 1% e 50%! **[1%-50%]**\nA taxa padrão é de **25%**');
            await interaction.reply({ components: [buildContainer({ color: Math.floor(Math.random() * 0xffffff), description: `Você setou a taxa da sua empresa para __${taxa}%__` })], flags: Discord.MessageFlags.IsComponentsV2 });
            companyInfo.set(interaction.user.id, companyid, 'taxa', taxa);
            playersService.cooldown.set(interaction.user.id, 'settaxa', 86400);
        } else if (edição.startsWith('name') || edição.startsWith('nome')) {
            const company = await companyService.get.companyByOwnerId(interaction.user.id);
            if (valor == null) return replyError('Você deve digitar o novo nome para a sua empresa');
            const novonome = valor;
            const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅');
            const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌');
            const message = (await interaction.reply({
                components: [buildContainer({ color: 0x606060, description: `**${interaction.user.tag}**\n**<a:loading:736625632808796250> Aguardando confirmação**\nVocê deseja gastar ${pricenome} ⭐ e trocar o nome da sua empresa para **${novonome}**?` }), new ActionRowBuilder().addComponents(btn0, btn1)],
                flags: Discord.MessageFlags.IsComponentsV2,
                withResponse: true
            })).resource.message;
            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 15000 });
            let reacted = false;
            collector.on('collect', async b => {
                if (b.user.id !== interaction.user.id) return;
                if (!b.deferred) b.deferUpdate().catch(error => { throw reportError(error, 'command.editarempresa.defer_update'); });
                reacted = true;
                collector.stop();
                if (b.customId === 'cancel') {
                    await interaction.editReply({ components: [buildContainer({ color: 0xa60000, fields: [['❌ Alteração cancelada', `Você cancelou a troca de nome da sua empresa para **${novonome}**.`]] })], flags: Discord.MessageFlags.IsComponentsV2 });
                    return;
                }
                if (company.score < pricenome) {
                    await interaction.editReply({ components: [buildContainer({ color: 0xa60000, fields: [['❌ Falha na alteração', `A sua empresa não possui score o suficiente para realizar a troca de nome!\nScore: **${utility.format(company.score.toFixed(2))}/${utility.format(pricenome)} ⭐**`]] })], flags: Discord.MessageFlags.IsComponentsV2 });
                    return;
                }
                companyInfo.set(interaction.user.id, company.company_id, 'score', parseFloat(company.score) - pricenome);
                await interaction.editReply({ components: [buildContainer({ color: 0x5bff45, fields: [['✅ Nome modificado', `Você gastou ${pricenome} ⭐ da empresa para modificar o nome da sua empresa para **${novonome}**.`]] })], flags: Discord.MessageFlags.IsComponentsV2 });
                companyInfo.set(interaction.user.id, company.company_id, 'name', novonome);
                playersService.cooldown.set(interaction.user.id, 'setname', 86400 * 2);
            });
            collector.on('end', async () => {
                if (reacted) return;
                await interaction.editReply({ components: [buildContainer({ color: 0xa60000, fields: [['❌ Tempo expirado', `Você iria gastar ${pricenome} ⭐ para alterar o nome da sua empresa para **${novonome}**, porém o tempo expirou!`]] })], flags: Discord.MessageFlags.IsComponentsV2 });
            });
        }
        playersService.cooldown.set(interaction.user.id, 'seecompany', 0);
    }
};
