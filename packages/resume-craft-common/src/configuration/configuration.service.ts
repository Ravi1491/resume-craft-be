import { Injectable } from '@nestjs/common';

import { LoggerFactory } from '../logger';
import { Config } from './configuration.types';

@Injectable()
export class ConfigurationService {
    private readonly logger = LoggerFactory.getLogger(ConfigurationService.name);

    constructor(private readonly config: Config) {
        this.logger.debug(`${ConfigurationService.name} Initialized`);
    }

    getConfig() {
        return this.config;
    }
}
