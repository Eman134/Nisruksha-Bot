module.exports = {
    name: 'molduras',
    aliases: ["frames"],
    category: 'Social',
    description: 'Faça a escolha da moldura que será apresentada em seu perfil',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;

        const obj = await API.getInfo(msg.author, "players")

        let frames = obj.frames

        if (frames == null || frames.length == 0) {
            const embedtemp = await API.sendError(msg, 'Você não possui molduras disponíveis para serem apresentadas.')
            await msg.quote(embedtemp)
            return;
        }

        frames = frames.filter((i) => i != '0')

        const total = frames.length
        let current = 1

        const check = await API.playerUtils.cooldown.check(msg.author, "molduras");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'molduras', 'visualizar suas molduras')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "molduras", 30);

        let btn1 = API.createButton('sBtn', 'gray', 'Equipar', '✅')
        let btn2 = API.createButton('nBtn', 'gray', 'Desequipar', '❌')
        let btn3 = API.createButton('b1Btn', 'blurple', '', '⏪')
        let btn4 = API.createButton('b0Btn', 'gray', '', '◀')
        let btn5 = API.createButton('f0Btn', 'gray', '', '▶')
        let btn6 = API.createButton('f1Btn', 'blurple', '', '⏩')

        if (total < 2) {
            btn3.setDisabled()
            btn4.setDisabled()
            btn5.setDisabled()
            btn6.setDisabled()
        }

        if (current == 1 && total > 1) {
            btn3.setDisabled()
            btn4.setDisabled()
            btn5.setDisabled(false)
            btn6.setDisabled(false)
        }

        btnRow0 = API.rowButton([btn1, btn2])
        btnRow1 = API.rowButton([btn3, btn4, btn5, btn6])
        
		const embed = new Discord.MessageEmbed()
        .setTitle('🖼 Moldura ' + current + '/' + total + ' | ' + API.frames.get(frames[0]).name)
        .setImage(API.frames.get(frames[0]).url)
        .setColor('#60ced6')
        
        const embedmsg = await msg.quote({ embed, components: [ btnRow0, btnRow1] });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 30000 });

        collector.on('collect', async (b) => {

            collector.resetTimer();

            API.playerUtils.cooldown.set(msg.author, "molduras", 30);

            if (b.id == 'f0Btn'){
                if (current < total) current += 1;
            } if (b.id == 'b0Btn'){
                if (current > 1) current -= 1;
            }

            if (b.id == 'f1Btn'){
                current = total;
            } if (b.id == 'b1Btn'){
                current = 1;
            }

            if (current == 1) {
                btn3.setDisabled()
                btn4.setDisabled()
                btn5.setDisabled(false)
                btn6.setDisabled(false)
            } else if (current == total) {
                btn3.setDisabled(false)
                btn4.setDisabled(false)
                btn5.setDisabled()
                btn6.setDisabled()
            } else {
                btn3.setDisabled(false)
                btn4.setDisabled(false)
                btn5.setDisabled(false)
                btn6.setDisabled(false)
            }

            btnRow0 = API.rowButton([btn1, btn2])
            btnRow1 = API.rowButton([btn3, btn4, btn5, btn6])

            const frame = API.frames.get(frames[current-1])

            embed.setTitle('🖼 Moldura ' + current + '/' + total + ' | ' + frame.name)

            if (b.id == 'nBtn') {
                
                API.frames.reforge(msg.author, 0)

                embed.setColor('#a60000');
                embed.setDescription('❌ Moldura desequipada')
                embed.setImage(API.frames.get(frames[0]).url)
                await embedmsg.edit({ embed, components: [ btnRow0, btnRow1] });

                b.defer()

                return collector.stop();

            } else if (b.id == 'sBtn'){

                API.frames.reforge(msg.author, frame.id)

                embed.setColor('#5bff45');
                embed.setDescription('✅ Moldura equipada')
                embed.setImage(frame.url)
                await embedmsg.edit({ embed, components: [ btnRow0, btnRow1] });

                b.defer()
                
                return collector.stop();

            } else {
                
                embed.setImage(frame.url)
                await embedmsg.edit({ embed, components: [ btnRow0, btnRow1] });

                b.defer()

            }

            

        });
        
        collector.on('end', b => {

            API.playerUtils.cooldown.set(msg.author, "molduras", 0);

        });

	}
};