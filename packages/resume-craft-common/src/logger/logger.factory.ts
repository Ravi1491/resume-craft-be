import { Logger } from '@nestjs/common';

import { LoggerAdapter } from './logger.adapter';

export class LoggerFactory {
    public static getLogger(scope?: string): LoggerAdapter {
        const logger = new Logger();
        const loggerAdapter = new LoggerAdapter(logger);

        if (scope) {
            loggerAdapter.setScope(scope);
        }

        return loggerAdapter;
    }

    public static async updateLogger(): Promise<'log' | 'error' | 'warn' | 'debug'> {
        let newLogLevel: 'log' | 'error' | 'warn' | 'debug';
        let source: string;

        if (process.env.LOCAL === 'true') {
            newLogLevel = process.env.LOG_LEVEL as 'log' | 'error' | 'warn' | 'debug';
            source = 'Environment Variable';
        } else {
            newLogLevel = process.env.LOG_LEVEL as 'log' | 'error' | 'warn' | 'debug';
            source = 'Environment Variable';
        }

        const logger = new Logger();
        logger.debug({ msg: 'Updating log level', newLogLevel, source });

        return newLogLevel;
    }
}
