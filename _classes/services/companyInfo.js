const prisma = require('../prisma');

class CompanyInfoService {
    constructor() {
    }

    async set(userId, companyId, field, value) {
        const user_id = BigInt(userId);
        const company_id = String(companyId);
        return prisma.companies.upsert({
            where: { company_id_user_id: { company_id, user_id } },
            update: { [field]: value },
            create: {
                company_id,
                user_id,
                curriculum: [],
                workers: [],
                rend: [],
                [field]: value
            }
        });
    }
}

module.exports = new CompanyInfoService();
