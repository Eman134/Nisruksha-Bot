const util = require('util');

const ANSI = {
    reset: '\x1b[0m',
    gray: '\x1b[90m',
    red: '\x1b[31;1m',
    yellow: '\x1b[33;1m',
    cyan: '\x1b[36;1m'
};

const IMPORTANT_DETAIL_KEYS = new Set([
    'command', 'context', 'file', 'operation', 'reason', 'type', 'code',
    'errno', 'syscall', 'status', 'statusCode', 'table', 'key', 'shardId',
    'userId', 'guildId', 'channelId', 'interactionId', 'memberId', 'ownerId',
    'companyId', 'messageId'
]);

const SECRET_KEY = /token|password|secret|authorization|cookie|credential|api.?key/i;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LINES = 20;

function supportsColor() {
    return Boolean(process.stderr.isTTY) && !process.env.NO_COLOR;
}

function colorize(value, color) {
    return supportsColor() ? `${ANSI[color]}${value}${ANSI.reset}` : value;
}

function redact(value) {
    return String(value)
        .replace(/(token|password|secret|authorization|cookie|api[_-]?key)(\s*[:=]\s*)[^\s,}]+/gi, '$1$2[REDACTED]')
        .replace(/(Bearer\s+)[^\s]+/gi, '$1[REDACTED]');
}

function truncate(value, length = MAX_MESSAGE_LENGTH) {
    const text = redact(value);
    return text.length > length ? `${text.slice(0, length)}...` : text;
}

function formatDetailValue(value) {
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return truncate(value, 300);
    }
    return truncate(util.inspect(value, { depth: 2, breakLength: 120, compact: true }), 300);
}

function getImportantDetails(details) {
    return Object.entries(details || {})
        .filter(([key, value]) => !SECRET_KEY.test(key) && value !== undefined && IMPORTANT_DETAIL_KEYS.has(key))
        .map(([key, value]) => `  ${key}: ${formatDetailValue(value)}`);
}

function getErrorMetadata(error) {
    return ['code', 'status', 'statusCode', 'errno', 'syscall']
        .filter((key) => error[key] !== undefined && error[key] !== null)
        .map((key) => `  ${key}: ${formatDetailValue(error[key])}`);
}

function formatStack(error) {
    const stack = truncate(error.stack || `${error.name}: ${error.message}`, 4000);
    return stack.split('\n').slice(0, MAX_STACK_LINES).map((line) => `    ${line}`).join('\n');
}

function normalizeError(error) {
    if (error instanceof Error) return error;
    if (typeof error === 'string') return new Error(error);
    return new Error(util.inspect(error, { depth: 6 }));
}

function reportError(error, context, details = {}) {
    const normalized = normalizeError(error);
    const detailLines = getImportantDetails(details);
    const lines = [
        `${colorize(`[${new Date().toISOString()}]`, 'gray')} ${colorize('ERROR', 'red')} ${colorize(context || 'unknown', 'cyan')}`,
        `  message: ${truncate(normalized.message)}`,
        `  name: ${normalized.name}`,
        ...getErrorMetadata(normalized),
        ...detailLines,
        colorize('  stack:', 'gray'),
        formatStack(normalized)
    ];
    console.error(lines.join('\n'));
    return normalized;
}

function reportWarning(message, context, details = {}) {
    const detailLines = getImportantDetails(details);
    const lines = [
        `${colorize(`[${new Date().toISOString()}]`, 'gray')} ${colorize('WARN', 'yellow')} ${colorize(context || 'unknown', 'cyan')}`,
        `  message: ${truncate(message)}`,
        ...detailLines
    ];
    console.warn(lines.join('\n'));
}

module.exports = { normalizeError, reportError, reportWarning };
