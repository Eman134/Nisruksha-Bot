const { APIMessage, Message } = require("discord.js-light");

Message.prototype.quote = async function (content, options) {
  const reference = {
    message_id: (
      !!content && !options
        ? typeof content === 'object' && content.messageID
        : options && options.messageID
    ) || this.id,
    message_channel: this.channel.id
  }

  let arr //= {"parse": []}

  if (typeof content === 'object' && content.mention) {
    arr = undefined
  }

  const { data: parsed, files } = await APIMessage
    .create(this, content, options)
    .resolveData()
    .resolveFiles()

  let msg 
  
  try {
    msg = await this.client.api.channels[this.channel.id].messages.post({
      data: { ...parsed, message_reference: reference, allowed_mentions: arr },
      files
    })
  } catch { 
    msg = await this.client.api.channels[this.channel.id].messages.post({
      data: { ...parsed},
      files
    })
  }

  await this.channel.messages.fetch(msg.id)
            .then(message => msg = message)
            .catch((err) => {
                console.log(err.stack)
            });

  return msg
}