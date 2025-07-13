import { Injectable } from '@nestjs/common';
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

import { ConfigurationService } from '../../../configuration';
import { LoggerAdapter, LoggerFactory } from '../../../logger';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
    logger: LoggerAdapter;

    constructor(private readonly configurationService: ConfigurationService) {
        this.logger = LoggerFactory.getLogger(MongooseConfigService.name);
    }

    async createMongooseOptions(): Promise<MongooseModuleOptions> {
        const { DB_HOST = '', DB_NAME = '' } = process.env;
        const uri = `${DB_HOST}/${DB_NAME}`;

        this.logger.debug({
            DB_DATA: {
                DB_HOST: DB_HOST,
                DB_NAME: DB_NAME,
            },
        });

        return {
            uri,
            dbName: DB_NAME,
            appName: 'resume-craft-mgmt-app',
            readPreference: 'secondaryPreferred',
            maxPoolSize: 50,
            minPoolSize: 10,
            maxIdleTimeMS: 0,
            connectTimeoutMS: 0,
            waitQueueTimeoutMS: 20 * 1000,
            autoIndex: false,
            autoCreate: false,
            serverSelectionTimeoutMS: 60 * 1000, // 1 minutes to block for server selection before throwing an exception.
            socketTimeoutMS: 0, // No timeout, meaning the client can wait indefinitely for a response
        };
    }
}
