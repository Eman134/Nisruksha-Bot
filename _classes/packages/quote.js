const { APIMessage, Message } = require("discord.js");

Message.prototype.quote = async function (c, o) {

  const content = c
  const options = o

  const { data: parsed, files } = await APIMessage
    .create(this, content, options)
    .resolveData()
    .resolveFiles()

  let x = { data: { ...parsed } }.data

  x.allowedMentions = { repliedUser: false}

  if (!options) {
    if (typeof content === 'object') {
      x = { ...x, ...content }
      if (content.mention) {
        x.allowedMentions = { repliedUser: true}
      }
    }
  } else {
    x = { ...x, ...options }
    if (options.mention) {
      x.allowedMentions = { repliedUser: true}
    }
  }
  
  x.reply = { messageReference: this.id }

  return await this.channel.send({ ...x });

}