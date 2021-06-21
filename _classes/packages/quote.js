const { Message } = require("discord.js");

Message.prototype.quote = async function (x) {

  x.allowedMentions = { repliedUser: false}

  if (x.mention) x.allowedMentions = { repliedUser: true}
  
  x.reply = { messageReference: this.id }

  return await this.channel.send(x);
}

//module.exports = replyQuote
