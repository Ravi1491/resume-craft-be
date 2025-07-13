import { HttpExceptionOptions } from '@nestjs/common';

import { ProbeError } from './probe.error';

export class LivenessProbeError extends ProbeError {
    constructor(options?: HttpExceptionOptions) {
        super('Liveness probe failed', options);
    }
}
