const { Message } = require("discord.js");

Message.prototype.quote = async function (x) {

  x.allowedMentions = { repliedUser: false}

  if (x.mention) x.allowedMentions = { repliedUser: true}
  
  x.reply = { messageReference: this.id }

  let msg 
  try {
  
    msg = await this.channel.send(x);
    
  } catch {

  }
    
  return msg
}

//module.exports = replyQuote
