const helpExtension = {

    category: []

};

helpExtension.getCategoryList = function() {
    return '**' + helpExtension.category.join(', ').replace(/, /g, "**, **").toUpperCase() + '**'
}

helpExtension.getCategoryListObj = function() {
    return helpExtension.category
}

helpExtension.categoryExists = function(cat) {
    return this.category.includes(cat);
}

helpExtension.addCommand = async function(command) {
  if (command.category != 'none' && !(helpExtension.category.includes(command.category))) {
    helpExtension.category.push(command.category)
  }
}

module.exports = helpExtension;