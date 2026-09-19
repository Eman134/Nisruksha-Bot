const { createBot } = require('./bootstrap');

module.exports = class NisrukshaClient {
    constructor(config) {
        return createBot(config);
    }
};
