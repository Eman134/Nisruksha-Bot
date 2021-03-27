module.exports = {
    name: 'salvar',
    aliases: ['save'],
    category: 'none',
    description: 'Salva os arquivos do bot manualmente',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        let desc1 = "<a:loading:736625632808796250> Escrevendo pastas e arquivos"
        let desc2 = "<a:loading:736625632808796250> Enviando arquivo 'lastsave.zip'"
        let desc3 = "<a:loading:736625632808796250> Enviando arquivo 'lastsave-resources.zip'"
        let desc4 = "<a:loading:736625632808796250> Enviando arquivo 'lastsave-psd.zip'"
        let desc5 = "<a:loading:736625632808796250> Enviando arquivo 'lastsave-psd2.zip'"
        let desc6 = "<a:loading:736625632808796250> Enviando arquivo 'lastsave-site.zip'"
        embed.setDescription(desc1)
        let msg2 = await msg.quote(embed);

        let size = 0

        let init = Date.now()

        try{
            var AdmZip = require('adm-zip');
            var zip = new AdmZip();
            var zip2 = new AdmZip();
            var zip3 = new AdmZip();
            var zip4 = new AdmZip();
            var zip5 = new AdmZip();
            const client = API.client;
            zip.addLocalFolder("./_classes/", '_classes');
            zip.addLocalFolder("./_json/", '_json');
            zip.addLocalFolder("./commands/", 'commands');
            zip.addLocalFolder("./events/", 'events');
            zip.addLocalFolder("./fonts/", 'fonts');
            zip2.addLocalFolder("./resources/", 'resources');
            zip3.addLocalFolder("./psd/", 'psd');
            zip4.addLocalFolder("./psd-2/", 'psd-2');
            zip.addLocalFolder("./_localdata/profiles/", '_localdata/profiles');
            zip5.addLocalFolder("./site/", 'site');
            zip.addLocalFile("./bot.js");
            zip.addLocalFile("./package.json");
            zip.addLocalFile("./run.bat");
    
            zip.writeZip("./_localdata/lastsave.zip");
            zip2.writeZip("./_localdata/lastsave-resources.zip");
            zip3.writeZip("./_localdata/lastsave-psd.zip");
            zip4.writeZip("./_localdata/lastsave-psd2.zip");
            zip5.writeZip("./_localdata/lastsave-site.zip");

            desc1 = "✅ Pastas e arquivos escritos"
            embed.setDescription(desc1 + '\n' + desc2)
            
        } catch (err) {
            desc1 = "❌ Erro ao escrever pastas e arquivos"
            embed.setDescription(desc1)
        } finally {
            msg2.edit(embed)
        }
    
        let ch = client.channels.cache.get('736791946756096002');

        await ch.send(`~~-----------------------------------------------------~~`)
        
        try {
            

            await ch.send(`${API.getFormatedDate()}`, {
                files: [
                    "./_localdata/lastsave.zip"
                ]
                }).then((cmsg) => {
                    
                    size += cmsg.attachments.first().size

                });


            desc2 = "✅ Arquivo 'lastsave.zip' enviado"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3)

        } catch (err) {
            desc2 = "❌ Erro ao enviar arquivo 'lastsave.zip'"
            embed.setDescription(desc1  + '\n' +  desc2)
        } finally {
            msg2.edit(embed)
        }
            
       
        try {
            

            await ch.send(`${API.getFormatedDate()}`, {
                files: [
                    "./_localdata/lastsave-resources.zip"
                ]
                }).then((cmsg) => {
                    
                    size += cmsg.attachments.first().size

                });

            desc3 = "✅ Arquivo 'lastsave-resources.zip' enviado"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3  + '\n' +  desc4)

        } catch (err) {
            desc3 = "❌ Erro ao enviar arquivo 'lastsave-resources.zip'"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3)
        } finally {
            msg2.edit(embed)
        }


        try {
            

            await ch.send(`${API.getFormatedDate()}`, {
                files: [
                    "./_localdata/lastsave-psd.zip"
                ]
                }).then((cmsg) => {
                    
                    size += cmsg.attachments.first().size

                });

            desc4 = "✅ Arquivo 'lastsave-psd.zip' enviado"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3  + '\n' +  desc4 + '\n' + desc5)

        } catch (err) {
            desc4 = "❌ Erro ao enviar arquivo 'lastsave-psd.zip'"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3 + '\n' + desc4)
        } finally {
            msg2.edit(embed)
        }


        try {
            

            await ch.send(`${API.getFormatedDate()}`, {
                files: [
                    "./_localdata/lastsave-psd2.zip"
                ]
                }).then((cmsg) => {
                    
                    size += cmsg.attachments.first().size

                });

            desc5 = "✅ Arquivo 'lastsave-psd2.zip' enviado"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3  + '\n' +  desc4 + '\n' + desc5 + '\n' + desc6)

        } catch (err) {
            desc5 = "❌ Erro ao enviar arquivo 'lastsave-psd2.zip'"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3 + '\n' + desc4 + '\n' + desc5)
        } finally {
            msg2.edit(embed)
        }


        try {
            

            await ch.send(`${API.getFormatedDate()}`, {
                files: [
                    "./_localdata/lastsave-site.zip"
                ]
                }).then((cmsg) => {
                    
                    size += cmsg.attachments.first().size

                });

            desc6 = "✅ Arquivo 'lastsave-site.zip' enviado"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3  + '\n' +  desc4 + '\n' + desc5 + '\n' + desc6)
            

        } catch (err) {
            desc6 = "❌ Erro ao enviar arquivo 'lastsave-site.zip'"
            embed.setDescription(desc1  + '\n' +  desc2  + '\n' +  desc3 + '\n' + desc4 + '\n' + desc5 + '\n' + desc6)
        } finally {
            embed.addField('📰 Informações de save', 'Realizado em: `' + API.getFormatedDate() + '`\nTamanho total (aproximado): `' + (size / 1024 / 1024).toFixed(2) + 'MB`' + '\nTempo decorrido: `' + API.ms2(Date.now()-init) + '`')
            msg2.edit(embed)
        }

        await ch.send(`~~-----------------------------------------------------~~`)
        API.lastsave = API.getFormatedDate();
        

	}
};