const { MessageFlags } = require('discord.js');
const { TextDisplayBuilder } = require('@discordjs/builders');
const { reportError } = require('../debug');

async function quote(x) {

  x.allowedMentions = { repliedUser: false}

  if (x.mention) x.allowedMentions = { repliedUser: true}
  
  x.reply = { messageReference: this.id }

  let interaction 
  try {
  
    interaction = await this.channel.send({
      components: [new TextDisplayBuilder().setContent(x.content || '')],
      allowedMentions: x.allowedMentions,
      reply: x.reply,
      flags: MessageFlags.IsComponentsV2
    });
    
  } catch (error) {
    reportError(error, 'quote.send');
    throw error;
  }
    
  return interaction
}

//module.exports = replyQuote
