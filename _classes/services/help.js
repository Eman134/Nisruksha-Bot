class HelpService {
    constructor() {
        this.category = [];
    }

    getCategoryList() {
        return '**' + this.category.join(', ').replace(/, /g, "**, **").toUpperCase() + '**';
    }

    getCategoryListObj() {
        return this.category;
    }

    categoryExists(category) {
        return this.category.includes(category);
    }

    addCommand(command) {
        if (command.category !== 'none' && !this.category.includes(command.category)) {
            this.category.push(command.category);
        }
    }
}

module.exports = new HelpService();
