const util = require('util');

function normalizeError(error) {
    if (error instanceof Error) return error;
    if (typeof error === 'string') return new Error(error);
    return new Error(util.inspect(error, { depth: 6 }));
}

function reportError(error, context, details = {}) {
    const normalized = normalizeError(error);
    console.error(`[ERROR] ${JSON.stringify({
        timestamp: new Date().toISOString(),
        context,
        message: normalized.message,
        stack: normalized.stack,
        ...details
    })}`);
    return normalized;
}

function reportWarning(message, context, details = {}) {
    console.warn(`[WARN] ${JSON.stringify({
        timestamp: new Date().toISOString(),
        context,
        message,
        ...details
    })}`);
}

module.exports = { normalizeError, reportError, reportWarning };
