const DatabaseManager = require('../manager/DatabaseManager');

class CompanyInfoService {
    constructor() {
        this.database = new DatabaseManager();
    }

    async set(userId, companyId, field, value) {
        await this.database.setIfNotExists(userId, 'companies');
        await this.database.set(userId, 'companies', 'company_id', companyId);
        return this.database.set(userId, 'companies', field, value);
    }
}

module.exports = new CompanyInfoService();
