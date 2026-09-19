const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const companyInfo = require('../../_classes/services/companyInfo');
const clientService = require('../../_classes/services/clientService');
const playersService = require('../../_classes/services/players');
const { SlashCommandBuilder } = require('@discordjs/builders');
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
.addStringOption(option => option.setName('valor').setDescription('Digite o valor que a edição necessita').setRequired(false))

module.exports = {
    name: 'editarempresa',
    aliases: ['editarempresa', 'companyedit', 'companyedit'],
    category: 'Empresas',
    description: 'Personalize sua empresa do comando verempresa',
    data,
    mastery: 50,
    async execute(interaction) {

          const Discord = Discord

          const edição = interaction.options.getString('edição').toLowerCase();
          const valor = interaction.options.getString('valor')

          const embed = new Discord.EmbedBuilder().setColor(`#fc7b03`)
        
          if (!(await companyService.check.hasCompany(interaction.user.id))) {
              const embedtemp = await utility.sendError(interaction, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\``)
           	  await interaction.reply({ embeds: [embedtemp]})
              return;
          }
        
          const companyid = await companyService.get.idByOwner(interaction.user.id)

          const pricenome = 35
            
          if (['background', 'bg', 'logo', 'desc', 'description', 'descrição', 'setarvaga', 'vaga', 'vagas', 'setvaga', 'taxa', 'nome', 'name'].includes(edição) == false) {
            embed.setDescription(`🐻 Olá, sou o Teddy e estou aqui para te auxiliar.\nVeja alguns comandos possíveis relacionados a editarempresa:\n \n\`/editarempresa background\` - Envie uma imagem junto do comando e seta o background da empresa no \`/veremp\`\n\`/editarempresa logo\` - Envie uma imagem junto do comando e seta a logo da empresa\n\`/editarempresa desc <texto>\` - Seta a descrição da sua empresa.\n\`/editarempresa vagas <on|off>\` - Seta a disponibilidade de vagas.\n\`/editarempresa taxa <1-50%>\` - Seta a taxa da empresa.\n\`/editarempresa nome <novonome>\` - Modifica o nome da sua empresa. ${pricenome} ⭐`)
            await interaction.reply({ embeds: [embed] });
            return;
          }

          if (edição == 'background') {

            if (valor == null) {
              const embedtemp = await utility.sendError(interaction, 'Você precisa colocar uma url de imagem para o background!\nRecomendado imagens 700x450')
           	  await interaction.reply({ embeds: [embedtemp]})
              return;
            }
    
            companyInfo.set(interaction.user.id, companyid, 'bglink', url)
  
            embed
              .setColor('#8adb5e')
              .setDescription(`O background da sua empresa foi definido para:`)
              .setFooter({ text: `Você pode visualizar as mudanças usando /veremp` })
              .setImage(url);
              await interaction.reply({ embeds: [embed] });
            const embed2 = new Discord.EmbedBuilder()
              .setColor('#8adb5e')
              .setDescription(`Background da **EMPRESA** de \`${interaction.user.tag} | ${interaction.user.id}\``)
              .setImage(url);
              try{
                clientService.current.guilds.cache.get('693150851396796446').channels.cache.get('736383144499871765').send({ embeds: [embed2] });
              }catch (err){
                clientService.current.emit('error', err)
              }

          } else if (edição == 'logo') {

              if (valor == null) {
                const embedtemp = await utility.sendError(interaction, 'Você precisa colocar uma url de imagem para o background!\nRecomendado imagens 700x450')
                await interaction.reply({ embeds: [embedtemp]})
                return;
              }
              
              companyInfo.set(interaction.user.id, companyid, 'logo', url)
    
              embed
                .setColor('#8adb5e')
                .setDescription(`A logo da sua empresa foi definida para:`)
                .setFooter({ text: `Você pode visualizar as mudanças usando /veremp` })
                .setImage(url);
                await interaction.reply({ embeds: [embed] });
                const embed2 = new Discord.EmbedBuilder()
                .setColor('#8adb5e')
                .setDescription(`Logo da **EMPRESA** de \`${interaction.user.tag} | ${interaction.user.id}\``)
                .setImage(url);
              try{
                clientService.current.guilds.cache.get('693150851396796446').channels.cache.get('736383144499871765').send({ embeds: [embed2] });
              }catch (err){
                clientService.current.emit('error', err)
              }

        } else if (edição.startsWith('desc')) {

            if (valor == null) {
              const embedtemp = await utility.sendError(interaction, 'Você precisa definir um texto para setar como descrição', 'editarempresa desc <texto>')
           	  await interaction.reply({ embeds: [embedtemp]})
              return;
            }
            
            if (valor.length > 50) {
              const embedtemp = await utility.sendError(interaction, 'Você não pode colocar uma descrição com mais de 50 caracteres\nQuantia de caracteres da descrição: ' + valor.length + '/50', 'editarempresa desc <texto>')
           	  await interaction.reply({ embeds: [embedtemp]})
              return;
            }
            companyInfo.set(interaction.user.id, companyid, "descr", valor)

            embed
            .setColor('#8adb5e')
            .setFooter({ text: `Você pode visualizar as mudanças usando /veremp` })
            .setDescription(`A descrição da sua empresa foi definida para:
            \`\`\`${valor}\`\`\``)
            .setFooter({ text: 'Quantia de caracteres da descrição: ' + valor.length + '/50' })
            await interaction.reply({ embeds: [embed] });

        } else if (edição.startsWith('vaga')) {
          if (valor == null) {
            const embedtemp = await utility.sendError(interaction, `Você deve indicar se deseja liberar as vagas da empresa ou não **[on/off]**`, `editarempresa vagas off`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
          }

          let boo = false;

          if (valor != 'on' && valor != 'off') {
              const embedtemp = await utility.sendError(interaction, `Você deve indicar se deseja liberar as vagas da empresa ou não **[on/off]**`, `editarempresa vagas off`)
           	  await interaction.reply({ embeds: [embedtemp]})
              return;
          }

          boo = (valor == 'on' ? boo = true : boo = false)

          const embed = new Discord.EmbedBuilder()
          .setColor((boo ? '#5bff45':'#a60000'))
          .setDescription('Você setou as vagas da sua empresa para ' +  (boo ? '🟢':'🔴')  + ' **' + valor + '**')
          await interaction.reply({ embeds: [embed] })
          const companyid = await companyService.get.idByOwner(interaction.user.id)
          companyInfo.set(interaction.user.id, companyid, 'openvacancie', boo)

        } else if (edição.startsWith('taxa')) {

          if (valor == null) {
            const embedtemp = await utility.sendError(interaction, `Você deve digitar o valor da taxa para funcionários! **[1%-50%]**\nA taxa padrão é de **25%**`, `editarempresa taxa 25%`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
          }

          let taxa = valor.replace(/%/g, '')

          if (!utility.isInt(taxa)) {
              const embedtemp = await utility.sendError(interaction, `Você deve digitar o valor da taxa __EM NÚMERO__ para funcionários! **[1%-50%]**\nA taxa padrão é de **25%**`, `editarempresa taxa 25%`)
           	  await interaction.reply({ embeds: [embedtemp]})
              return;
          }
          taxa = parseInt(taxa)
          if (taxa < 1 || taxa > 50) {
              const embedtemp = await utility.sendError(interaction, `Você deve digitar o valor da taxa entre 1% e 50%! **[1%-50%]**\nA taxa padrão é de **25%**`, `editarempresa taxa 25%`)
           	  await interaction.reply({ embeds: [embedtemp]})
              return;
          }


          const embed = new Discord.EmbedBuilder()
          .setColor(Math.floor(Math.random() * 0xffffff))
          .setDescription('Você setou a taxa da sua empresa para __' + taxa + '%__')
          await interaction.reply({ embeds: [embed] })
          const companyid = await companyService.get.idByOwner(interaction.user.id)
          companyInfo.set(interaction.user.id, companyid, 'taxa', taxa)

          playersService.cooldown.set(interaction.user.id, "settaxa", 86400);

        } else if (edição.startsWith('name') || edição.startsWith('nome')) {

          const company = await companyService.get.companyByOwnerId(interaction.user.id)

          if (valor == null) {
            const embedtemp = await utility.sendError(interaction, `Você deve digitar o novo nome para a sua empresa`, `editarempresa nome <nome>`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
          }

          let novonome = valor

          const embed = new Discord.EmbedBuilder();
          embed.setColor('#606060');
          embed.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
          
          embed.addFields({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `
          Você deseja gastar ${pricenome} ⭐ e trocar o nome da sua empresa para **${novonome}**?` })
          
          const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
          const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

          let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

          const filter = i => i.user.id === interaction.user.id;
          
          const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
          let reacted = false;
          collector.on('collect', async (b) => {

              if (!(b.user.id === interaction.user.id)) return
              
              if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.editarempresa.defer_update'); });
              reacted = true;
              collector.stop();
              embed.fields = [];

              if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Alteração cancelada', value: `
                Você cancelou a troca de nome da sua empresa para **${novonome}**.` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

              if ((company.score < pricenome)) {
                  embed.setColor('#a60000');
                  embed.addFields({ name: '❌ Falha na alteração', value: `A sua empresa não possui score o suficiente para realizar a troca de nome!\nScore: **${utility.format(company.score.toFixed(2))}/${utility.format(pricenome)} ⭐**` })
                  interaction.editReply({ embeds: [embed], components: [] });
                  return;
              }

              companyInfo.set(interaction.user.id, company.company_id, 'score', parseFloat(company.score) - pricenome)

              embed.setColor('#5bff45')
              .setTitle('')
              embed.addFields({ name: '✅ Nome modificado', value: `
              Você gastou ${pricenome} ⭐ da empresa para modificar o nome da sua empresa para **${novonome}**.` })
              embed.setFooter({ text: '' })
              interaction.editReply({ embeds: [embed], components: [] });

              companyInfo.set(interaction.user.id, company.company_id, 'name', novonome)
              playersService.cooldown.set(interaction.user.id, "setname", 86400*2);

          });
          
          collector.on('end', async collected => {
              if (reacted) return;

              embed.fields = [];

              embed.setColor('#a60000')
              .addFields({ name: '❌ Tempo expirado', value: `Você iria gastar ${pricenome} ⭐ para alterar o nome da sua empresa para **${novonome}**, porém o tempo expirou!` })
              interaction.editReply({ embeds: [embed], components: [] });

          });

        }

        playersService.cooldown.set(interaction.user.id, "seecompany", 0);
  
      }
  };
