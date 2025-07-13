import { Logger, LoggerService } from '@nestjs/common';

export class LoggerAdapter implements LoggerService {
    private scope?: string;

    constructor(private readonly loggerInstance: Logger) {}

    private printLog(level: 'log' | 'error' | 'warn' | 'debug', message: unknown) {
        if (this.scope) {
            this.loggerInstance[level](message);
            return;
        }

        this.loggerInstance[level](message);
    }

    private escapeNewlineCharacters(message: unknown): string {
        if (typeof message === 'string') {
            return message.replace(/\n/g, '\\n');
        }
        return message as string;
    }

    setScope(scope: string) {
        this.scope = scope;
    }

    log(message: unknown) {
        this.printLog('log', this.escapeNewlineCharacters(message));
    }
    error(message: unknown) {
        this.printLog('error', this.escapeNewlineCharacters(message));
    }
    warn(message: unknown) {
        this.printLog('warn', this.escapeNewlineCharacters(message));
    }
    debug(message: unknown) {
        this.printLog('debug', this.escapeNewlineCharacters(message));
    }
}
