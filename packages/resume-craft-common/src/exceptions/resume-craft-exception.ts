import { HttpException } from '@nestjs/common';

import { LoggerFactory } from '../logger';
import { getErrorCodeDetails } from './error-code-details';
import { ErrorCode } from './error-codes';
import { getNestErrorCodeDetails, getNestErrorCodeFromHttpStatus, NestErrorCtor } from './nest-exceptions';
import { ErrorDetailInJsonType, ExceptionOptions, ExceptionResponseType } from './types';

export class ResumeCraftException extends HttpException {
    private readonly _errorDetailsInJson: ErrorDetailInJsonType;

    constructor(code: ErrorCode, options?: ExceptionOptions) {
        const logger = LoggerFactory.getLogger('ResumeCraftException');
        const { cause, message, description, details } = options || {};
        const errDetails = getErrorCodeDetails(code) || getNestErrorCodeDetails(code as string as NestErrorCtor);
        const { httpStatus, message: errMessage, ufMessage, httpStatusCodeText } = errDetails;

        let causeResult: unknown;
        if (cause instanceof ResumeCraftException) {
            causeResult = cause.getJson();
        } else if (cause instanceof Error) {
            causeResult = {
                error: cause?.toString(),
                message: cause.message,
                stack: cause.stack,
                originalCause: cause,
            };
        } else {
            causeResult = cause;
        }

        const errorDetailsInJson = {
            message,
            cause: causeResult,
            details,
            statusCode: errDetails.httpStatus,
        };

        logger.error(errorDetailsInJson);
        super(
            {
                message: message || errMessage,
                ufMessage,
                code,
                details,
                httpStatusCodeText,
            } as ExceptionResponseType,
            httpStatus,
            {
                cause,
                description,
            }
        );
        this._errorDetailsInJson = errorDetailsInJson;
    }

    static fromError(
        error: Error,
        // eslint-disable-next-line default-param-last
        errorCode: ErrorCode = ErrorCode.UNEXPECTED_ERROR,
        options?: ExceptionOptions
    ): ResumeCraftException {
        if (error instanceof ResumeCraftException) {
            return error;
        }

        if (error instanceof HttpException) {
            const ctorName = error.constructor.name;
            const { code } =
                ctorName === 'HttpException'
                    ? {
                          code: getNestErrorCodeFromHttpStatus(error.getStatus()),
                      }
                    : getNestErrorCodeDetails(ctorName as NestErrorCtor);

            return new ResumeCraftException(code, {
                cause: error.cause,
                details: error.getResponse(),
            });
        }

        return new ResumeCraftException(errorCode, {
            cause: error,
            ...(options || {}),
        });
    }

    getJson() {
        return this._errorDetailsInJson;
    }
}
