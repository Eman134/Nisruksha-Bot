const helpExtension = {

    category: [],
    cmds: [],
    desc: [],
    aliases: []

};

const API = require("../api.js");

helpExtension.getCategoryList = function() {
    return '**' + helpExtension.category.join(', ').replace(/, /g, "**, **").toUpperCase() + '**'
}

helpExtension.categoryExists = function(cat) {
    let loop = 0;
    let result = false;
    while (loop < helpExtension.category.length) {
        if (helpExtension.category[loop] === cat) {
          result = true
          break
        } else {
          ++loop
        }
    }
    return result;
}

helpExtension.getCommandList = function(cat) {
    let loop = 0;
    let list = [];
    while (loop < helpExtension.getCommandObj(cat).length) {
        
        list.push(`\`${API.prefix}${helpExtension.getCommandObj(cat)[loop]}\` <:arrow:737370913204600853> ${helpExtension.getDescObj(cat)[loop]}${helpExtension.getAliasObj(cat)[loop] == undefined || helpExtension.getAliasObj(cat)[loop].length < 1 || helpExtension.getAliasObj(cat)[loop] == false? '': `\n › Alcunhas: [\`${helpExtension.getAliasObj(cat)[loop].slice(0, 5).map(a => `${a}`).join(', ')}\`]`}\n`);
        if (list.length == helpExtension.getCommandObj(cat).length) {
            break;
        }
        loop++

    }
    return list.join('\n');

}

helpExtension.getCommandObj = function(cat) {
    let result = null
    let loop = 0

    while (loop < helpExtension.category.length) {
        if (helpExtension.category[loop] === cat) {
          result = loop
          break
        } else {
          ++loop
        }
    }
    if (result == null) {
        return null;
    }
    return helpExtension.cmds[result]

}

helpExtension.getDescObj = function(cat) {
    let result = null
    let loop = 0

    while (loop < helpExtension.category.length) {
        if (helpExtension.category[loop] === cat) {
          result = loop
          break
        } else {
          ++loop
        }
    }
    if (result == null) {
        return null;
    }
    return helpExtension.desc[result]


}

helpExtension.getAliasObj = function(cat) {
  let result = null
  let loop = 0

  while (loop < helpExtension.category.length) {
      if (helpExtension.category[loop] === cat) {
        result = loop
        break
      } else {
        ++loop
      }
  }
  if (result == null) {
      return null;
  }
  return helpExtension.aliases[result]


}

helpExtension.addCommand = async function(command, x) {
    let name = x;
    let aliases = command.aliases;

    if (!(command.category == 'none')) {
        if (!(helpExtension.category.includes(command.category))) {
          helpExtension.category.push(command.category)
        }
  
        if (helpExtension.cmds.length == 0) {
          helpExtension.cmds.push([name])
          helpExtension.desc.push([command.description])
          helpExtension.aliases.push([aliases])
      } else {
        let result
        let loop = 0
  
        while (loop < helpExtension.category.length) {
          if (helpExtension.category[loop] === command.category) {
            result = loop
            break
          } else {
            ++loop
          }
        }
  
        if (helpExtension.cmds[result] == undefined) {
          (helpExtension.cmds).push([name])
        } else {
          (helpExtension.cmds[result]).push(name)
        }
  
        if (helpExtension.desc[result] == undefined) {
          (helpExtension.desc).push([command.description])
        } else {
          (helpExtension.desc[result]).push(command.description)
        }

        if (helpExtension.aliases[result] == undefined) {
          (helpExtension.aliases).push([aliases])
        } else {
          (helpExtension.aliases[result]).push(aliases)
        }
  
      }
  
    }
}

module.exports = helpExtension;