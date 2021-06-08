const helpExtension = {

    category: []

};

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

helpExtension.addCommand = async function(command) {
  if (command.category != 'none' && !(helpExtension.category.includes(command.category))) {
    helpExtension.category.push(command.category)
  }
}

module.exports = helpExtension;