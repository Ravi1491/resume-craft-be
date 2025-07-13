import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

import { LoggerFactory } from '../logger';

@Injectable()
export class AxiosService {
    private readonly logger = LoggerFactory.getLogger(AxiosService.name);
    private readonly axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({ timeout: 30000 });

        axiosRetry(this.axiosInstance, {
            retries: 3,
            retryDelay: (retryCount) => {
                const delay = 2 ** retryCount * 100;
                this.logger.debug(`Retry attempt ${retryCount}, waiting ${delay}ms`);
                return delay;
            },
            retryCondition: (error) => {
                const shouldRetry = error.response?.status === 500 || !error.response;
                if (shouldRetry) {
                    this.logger.debug(`Retrying request due to error: ${error.message}`);
                }
                return shouldRetry;
            },
        });
    }

    getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }
}
