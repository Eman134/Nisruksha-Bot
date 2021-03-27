module.exports = {
    name: 'empresaedit',
    aliases: ['empresaedit', 'companyedit', 'companyedit'],
    category: 'Empresas',
    description: 'Personalize sua empresa do comando verempresa',
      async execute(API, msg) {
  
          const boolean = await API.checkAll(msg);
          if (boolean) return;

          const args = API.args(msg)
          const Discord = API.Discord

          const embed = new Discord.MessageEmbed().setColor(`#fc7b03`)
        
          if (!(await API.company.check.hasCompany(msg.author))) {
              API.sendError(msg, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\``)
              return;
          }
        
          const companyid = await API.company.get.idByOwner(msg.author)

          if (args.length == 0) {
              embed.setDescription(`🐻 Olá, sou o Teddy e estou aqui para te auxiliar.\nVeja alguns comandos possíveis relacionados a empresaedit:\n \n\`${API.prefix}empresaedit background\` - Envie uma imagem junto do comando e seta o background da empresa no \`${API.prefix}veremp\`\n\`${API.prefix}empresaedit logo\` - Envie uma imagem junto do comando e seta a logo da empresa\n\`${API.prefix}empresaedit desc <texto>\` - Seta a descrição da sua empresa.`)
              await msg.quote(embed);
              return;
            }
            
            let ch = args[0].toLowerCase();
            
          if (['background', 'bg', 'logo', 'desc', 'description', 'descrição'].includes(ch) == false) {
            embed.setDescription(`🐻 Olá, sou o Teddy e estou aqui para te auxiliar.\nVeja alguns comandos possíveis relacionados a empresaedit:\n \n\`${API.prefix}empresaedit background\` - Envie uma imagem junto do comando e seta o background da empresa no \`${API.prefix}veremp\`\n\`${API.prefix}empresaedit logo\` - Envie uma imagem junto do comando e seta a logo da empresa\n\`${API.prefix}empresaedit desc <texto>\` - Seta a descrição da sua empresa.`)
            await msg.quote(embed);
            return;
          }

          if (ch == 'background' || ch == 'bg') {

            const attachment = msg.attachments.array()
              if (attachment.length < 1) {
              API.sendError(msg, 'Você não enviou uma imagem junto do comando!\nRecomendado imagens 700x450')
              return;
            }
    
            let url = attachment[0].url;
    
            if (!attachment[0].name.match(/.(jpg|jpeg|png|gif)$/i)){
              API.sendError(msg, `O arquivo que você enviou não é uma imagem!\nFormatos disponíveis: jpg, jpeg, png. (Seu arquivo: ${attachment[0].name.split('.')[attachment[0].name.split('.').length-1]})`)
              return;
            }
    
            if(attachment[0].size > 1050000) {
              API.sendError(msg, `A imagem que você enviou é muito pesada! Por favor envie uma imagem mais leve.\nTamanho do arquivo: **${(attachment[0].size/1000000).toFixed(1)}/1 MB**`)
              return;
            }
    
            API.setCompanieInfo(msg.author, companyid, 'bglink', url)
  
            embed
              .setColor('#8adb5e')
              .setDescription(`O background da sua empresa foi definido para:`)
              .setFooter(`Você pode visualizar as mudanças usando ${API.prefix}veremp`)
              .setImage(url);
              await msg.quote(embed);
            const embed2 = new Discord.MessageEmbed()
              .setColor('#8adb5e')
              .setDescription(`Background da **EMPRESA** de \`${msg.author.tag} | ${msg.author.id}\``)
              .setImage(url);
              try{
                API.client.guilds.cache.get('693150851396796446').channels.cache.get('736383144499871765').send(embed2);
              }catch (err){
                client.emit('error', err)
              }

          } else if (ch == 'logo') {

              const attachment = msg.attachments.array()
              if (attachment.length < 1) {
                API.sendError(msg, 'Você não enviou uma imagem junto do comando!\nRecomendado imagens 150x150')
                return;

              }
      
              let url = attachment[0].url;
      
              if (!attachment[0].name.match(/.(jpg|jpeg|png|gif)$/i)){
                API.sendError(msg, `O arquivo que você enviou não é uma imagem!\nFormatos disponíveis: jpg, jpeg, png. (Seu arquivo: ${attachment[0].name.split('.')[attachment[0].name.split('.').length-1]})`)
                return;
              }
              
              if(attachment[0].size > 1050000) {
                API.sendError(msg, `A imagem que você enviou é muito pesada! Por favor envie uma imagem mais leve.\nTamanho do arquivo: **${(attachment[0].size/1000000).toFixed(1)}/1 MB**`)
                return;
              }
              
              API.setCompanieInfo(msg.author, companyid, 'logo', url)
    
              embed
                .setColor('#8adb5e')
                .setDescription(`A logo da sua empresa foi definida para:`)
                .setFooter(`Você pode visualizar as mudanças usando ${API.prefix}veremp`)
                .setImage(url);
                await msg.quote(embed);
                const embed2 = new Discord.MessageEmbed()
                .setColor('#8adb5e')
                .setDescription(`Logo da **EMPRESA** de \`${msg.author.tag} | ${msg.author.id}\``)
                .setImage(url);
              try{
                API.client.guilds.cache.get('693150851396796446').channels.cache.get('736383144499871765').send(embed2);
              }catch (err){
                client.emit('error', err)
              }

        } else if (ch.startsWith('desc')) {

            if (args.length == 1) {
              API.sendError(msg, 'Você precisa definir um texto para setar como descrição', 'empresaedit desc <texto>')
              return;
            }
            
            if (API.getMultipleArgs(msg, 2).length > 50) {
              API.sendError(msg, 'Você não pode colocar uma descrição com mais de 50 caracteres\nQuantia de caracteres da descrição: ' + API.getMultipleArgs(msg, 1).length + '/50', 'empresaedit desc <texto>')
                return;
              }
            API.setCompanieInfo(msg.member, companyid, "descr", API.getMultipleArgs(msg, 2))

            embed
            .setColor('#8adb5e')
            .setFooter(`Você pode visualizar as mudanças usando ${API.prefix}veremp`)
            .setDescription(`A descrição da sua empresa foi definida para:
            \`\`\`${API.getMultipleArgs(msg, 2)}\`\`\``)
            .setFooter('Quantia de caracteres da descrição: ' + API.getMultipleArgs(msg, 2).length + '/50')
            await msg.quote(embed);
        }

        API.setCooldown(msg.author, "seecompany", 0);
  
      }
  };