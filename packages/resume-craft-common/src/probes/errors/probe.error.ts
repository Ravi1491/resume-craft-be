import { HttpException, HttpExceptionOptions, HttpStatus } from '@nestjs/common';

export abstract class ProbeError extends HttpException {
    constructor(message: string, options?: HttpExceptionOptions) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, options);
    }
}
