const fs = require('fs');
const path = require('path');

const serviceAliases = {
    eco: 'economyService', company: 'companyService', crateExtension: 'crateService',
    events: 'eventService', frames: 'frameService', badges: 'badgeService', img: 'imageService',
    itemExtension: 'itemService', maqExtension: 'machineService', playerUtils: 'playerService',
    shopExtension: 'shopService', townExtension: 'townService', cacheLists: 'cacheService'
};

function parameterName(name) {
    return `svc${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function processDirectory(directory) {
    for (const filename of fs.readdirSync(directory)) {
        const filePath = path.join(directory, filename);
        if (fs.statSync(filePath).isDirectory()) processDirectory(filePath);
        if (!filename.endsWith('.js')) continue;
        let source = fs.readFileSync(filePath, 'utf8');
        const match = source.match(/requiredServices:\s*(\[[^\]]*\])/);
        if (!match) continue;
        const required = JSON.parse(match[1]);
        const bodyStart = source.indexOf('async execute');
        if (bodyStart < 0) continue;
        let header = source.slice(0, bodyStart);
        let body = source.slice(bodyStart);

        for (const name of required) {
            const current = serviceAliases[name] || name;
            const parameter = parameterName(name);
            body = body.replace(new RegExp(`\\b${current}\\b`, 'g'), parameter);
        }
        const parameters = required.map(parameterName);
        body = body.replace(/async execute\(interaction, [^)]*\)/, (signature) => {
            const tail = signature.slice(signature.indexOf(',') + 1, -1).split(',').map((value) => value.trim()).filter(Boolean);
            const preservedTail = tail.filter((value) => !parameters.includes(value));
            return `async execute(interaction, ${parameters.concat(preservedTail).join(', ')})`;
        });
        body = body.replace(/^\s*const (svc[A-Za-z0-9_$]+) = \1;\r?\n/gm, '');
        source = header + body;
        fs.writeFileSync(filePath, source);
    }
}

processDirectory(path.resolve(__dirname, '../commands'));
