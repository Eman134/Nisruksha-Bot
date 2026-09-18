const { Message } = require("discord.js");
const { reportError } = require('../debug');

async function quote(x) {

  x.allowedMentions = { repliedUser: false}

  if (x.mention) x.allowedMentions = { repliedUser: true}
  
  x.reply = { messageReference: this.id }

  let interaction 
  try {
  
    interaction = await this.channel.send(x);
    
  } catch (error) {
    reportError(error, 'quote.send');
    throw error;
  }
    
  return interaction
}

//module.exports = replyQuote
