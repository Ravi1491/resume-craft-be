import { Global, Module } from '@nestjs/common';

import { validate } from '../schema-validator';
import { BaseConfig } from './base.config';
import { ConfigValidationError } from './config-validation.error';
import { ConfigurationService } from './configuration.service';
import { Config, ConfigValidationSchema } from './configuration.types';
import { getEnvConfig } from './env.config';

@Global()
@Module({
    providers: [
        {
            provide: ConfigurationService,
            useFactory: async () => {
                let config: Config;
                if (process.env.LOCAL === 'true') {
                    config = BaseConfig;
                } else {
                    config = await getEnvConfig();
                }

                const validationResult = validate(ConfigValidationSchema, config);
                if (!validationResult.isValid) {
                    throw new ConfigValidationError(validationResult.errors);
                }

                return new ConfigurationService(config);
            },
        },
    ],
    exports: [ConfigurationService],
})
export class ConfigurationModule {}
