import { Inject, Injectable } from '@nestjs/common';

import { ErrorCode, ResumeCraftException } from '../exceptions';
import { LoggerFactory } from '../logger';
import { DbService } from '../odm';
import { Initiable } from '../types';
import { ProbeResponseDto } from './dto/probes-response.dto';
import { StartUpProbeError } from './errors/startup-probe.error';
import { PROBE_OPTION_TOKEN } from './probe.constants';
import { ProbesOptions } from './probes.types';

@Injectable()
export class ProbesService {
    private readonly logger = LoggerFactory.getLogger(ProbesService.name);

    constructor(
        private readonly dbService: DbService,
        @Inject(PROBE_OPTION_TOKEN) private readonly probeOptions: ProbesOptions
    ) {}

    startUpProbe(): ProbeResponseDto {
        const initiableServices: Initiable[] = [this.dbService];

        initiableServices.forEach((initiableService) => {
            if (!initiableService.isInitialized) {
                throw new StartUpProbeError({
                    description: initiableService.constructor.name,
                });
            }
        });

        return {
            status: 'success',
        };
    }

    async healthProbe(): Promise<ProbeResponseDto> {
        return this._checkExternalDependencies();
    }

    async readinessProbe(): Promise<ProbeResponseDto> {
        return this._checkExternalDependencies();
    }

    async livenessProbe(): Promise<ProbeResponseDto> {
        return this._checkExternalDependencies();
    }

    protected async _checkExternalDependencies(): Promise<ProbeResponseDto> {
        try {
            const serviceNamesForErrorLog = ['db'];
            const dependencies = [this.dbService.checkConnection()];

            const readinessResponses = await Promise.all(dependencies);
            const failedIndex = readinessResponses.findIndex((response) => !response);
            if (failedIndex !== -1) {
                throw new ResumeCraftException(ErrorCode.UNEXPECTED_ERROR, {
                    message: `External dependencies are not ready for ${serviceNamesForErrorLog[failedIndex]}`,
                });
            }
        } catch (error: unknown) {
            this.logger.error({
                msg: `Error checking external dependencies`,
                error,
                stringifyError: JSON.stringify(error),
            });
            throw new ResumeCraftException(ErrorCode.UNEXPECTED_ERROR, { cause: error });
        }

        return {
            status: 'success',
            message: 'Ready',
        };
    }
}
