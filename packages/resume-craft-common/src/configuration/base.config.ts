import { config } from 'dotenv';
import path from 'path';

import { Config } from './configuration.types';

if (process.env.LOCAL === 'true') {
    const envPath = path.resolve(__dirname).split(`packages/`);
    config({ path: `${envPath[0]}.env` });

    // // Load environment-specific .env file if ENV is set
    // if (process.env.ENV) {
    //     const envSpecificPath = `${envPath[0]}.env.${process.env.ENV.toLowerCase()}`;
    //     logger.debug({ envSpecificPath });
    //     config({ path: envSpecificPath, override: true });
    // }
}

export const BaseConfig: Config = {
    env: process.env.ENV,
    nodeEnv: process.env.NODE_ENV,
    userEnv: process.env.USER_ENV,
    port: +process.env.PORT,
    dataSource: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
    },
};
