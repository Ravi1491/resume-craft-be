import { HttpExceptionOptions } from '@nestjs/common';

import { ProbeError } from './probe.error';

export class StartUpProbeError extends ProbeError {
    constructor(options?: HttpExceptionOptions) {
        super('Startup probe failed', options);
    }
}
