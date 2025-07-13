import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from './error-codes';

export type ExceptionOptions = {
    cause?: unknown;
    message?: string;
    description?: string;
    details?: unknown;
};

export type ExceptionResponseType = {
    message: string;
    ufMessage: string;
    code: ErrorCode;
    details?: unknown;
    httpStatusCodeText: string;
};

export type ExceptionDetailType = Omit<ExceptionResponseType, 'code'> & {
    httpStatus: HttpStatus;
};

export type ErrorDetailInJsonType = {
    message: string;
    cause: unknown;
    details: unknown;
    statusCode: HttpStatus;
};
