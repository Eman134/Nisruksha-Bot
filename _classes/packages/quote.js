const { Message } = require("discord.js");

async function quote(x) {

  x.allowedMentions = { repliedUser: false}

  if (x.mention) x.allowedMentions = { repliedUser: true}
  
  x.reply = { messageReference: this.id }

  let interaction 
  try {
  
    interaction = await this.channel.send(x);
    
  } catch {

  }
    
  return interaction
}

//module.exports = replyQuote
