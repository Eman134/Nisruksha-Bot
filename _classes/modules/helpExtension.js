const helpExtension = {

    category: []

};

helpExtension.getCategoryList = function() {
    return '**' + this.category.join(', ').replace(/, /g, "**, **").toUpperCase() + '**'
}

helpExtension.getCategoryListObj = function() {
    return this.category
}

helpExtension.categoryExists = function(cat) {
    return this.category.includes(cat);
}

helpExtension.addCommand = async function(command) {
  if (command.category != 'none' && !(this.category.includes(command.category))) {
    this.category.push(command.category)
  }
}

module.exports = helpExtension;