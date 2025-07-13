import { BaseConfig } from './base.config';
import { Config } from './configuration.types';

export const getEnvConfig = async (): Promise<Config> => {
    return BaseConfig;
};
