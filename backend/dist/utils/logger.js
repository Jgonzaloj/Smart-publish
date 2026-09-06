"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const SENSITIVE_KEYS = ['password', 'token', 'jwt', 'secret', 'access_token', 'refresh_token', 'authorization'];
function sanitize(data) {
    if (!data || typeof data !== 'object')
        return data;
    if (Array.isArray(data))
        return data.map(sanitize);
    const cleaned = {};
    for (const [key, val] of Object.entries(data)) {
        if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
            cleaned[key] = '***REDACTED***';
        }
        else if (typeof val === 'object' && val !== null) {
            cleaned[key] = sanitize(val);
        }
        else {
            cleaned[key] = val;
        }
    }
    return cleaned;
}
class Logger {
    isProduction = process.env.NODE_ENV === 'production';
    formatOutput(level, message, context, data) {
        const payload = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(context && { context }),
            ...(data && { data: sanitize(data) })
        };
        if (this.isProduction) {
            const jsonStr = JSON.stringify(payload);
            if (level === 'error') {
                console.error(jsonStr);
            }
            else if (level === 'warn') {
                console.warn(jsonStr);
            }
            else {
                console.log(jsonStr);
            }
        }
        else {
            const prefix = `[${payload.timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''}:`;
            if (level === 'error') {
                console.error(prefix, message, data ? sanitize(data) : '');
            }
            else if (level === 'warn') {
                console.warn(prefix, message, data ? sanitize(data) : '');
            }
            else if (level === 'debug') {
                console.debug(prefix, message, data ? sanitize(data) : '');
            }
            else {
                console.log(prefix, message, data ? sanitize(data) : '');
            }
        }
    }
    info(message, context, data) {
        this.formatOutput('info', message, context, data);
    }
    warn(message, context, data) {
        this.formatOutput('warn', message, context, data);
    }
    error(message, context, data) {
        this.formatOutput('error', message, context, data);
    }
    debug(message, context, data) {
        this.formatOutput('debug', message, context, data);
    }
}
exports.logger = new Logger();
