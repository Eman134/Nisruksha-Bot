const { APIMessage, Message } = require("discord.js");

Message.prototype.quote = async function (content, options) {
  const reference = {
    message_id: (
      !!content && !options
        ? typeof content === 'object' && content.messageID
        : options && options.messageID
    ) || this.id,
    message_channel: this.channel.id
  }

  let arr = {"replied_user": false}

  if (typeof content === 'object' && content.mention) {
    arr.replied_user = true
  }

  const { data: parsed, files } = await APIMessage
    .create(this, content, options)
    .resolveData()
    .resolveFiles()

  let msg 
  
  try {
    msg = await this.client.api.channels[this.channel.id].messages.post({
      data: { ...parsed, message_reference: reference, allowed_mentions: arr, allowedMentions: arr },
      files
    })
  } catch { 
    try {
    msg = await this.client.api.channels[this.channel.id].messages.post({
      data: { ...parsed},
      files
    })
    } catch {
      
    }
  }

  if (!msg) return

  await this.channel.messages.fetch(msg.id)
            .then(message => msg = message)
            .catch();

  return msg
}