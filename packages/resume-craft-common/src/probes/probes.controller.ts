import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';

import { LoggerFactory } from '../logger';
import { ApiControllerTags } from '../nest';
import { ProbesService } from './probes.service';

@Controller('/')
@ApiControllerTags('Health Probe', 'System health check and monitoring endpoints')
export class ProbesController {
    private readonly logger = LoggerFactory.getLogger(ProbesController.name);

    constructor(private readonly probesService: ProbesService) {
        this.logger.debug(`${ProbesController.name} Initialize probes`);
    }

    @Get('/')
    @HealthCheck()
    serviceUpCheck() {
        return this.probesService.healthProbe();
    }

    @Get('/health')
    handleHealthCheck() {
        return this.probesService.healthProbe();
    }

    @Get('/startUpProbe')
    handleStartUpProbe() {
        return this.probesService.startUpProbe();
    }

    @Get('/livenessProbe')
    handleLivenessProbe() {
        return this.probesService.livenessProbe();
    }

    @Get('/readinessProbe')
    readinessProbeProbe() {
        return this.probesService.readinessProbe();
    }
}
