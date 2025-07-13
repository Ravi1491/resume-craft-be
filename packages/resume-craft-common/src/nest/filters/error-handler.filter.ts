import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

import { ApiMetadataKeys, ApiStatus, VALIDATION_FAIL_ERROR_MESSAGE } from '../../constants';
import { ErrorCode, ResumeCraftException } from '../../exceptions';
import { getNestErrorCodeFromHttpStatus } from '../../exceptions/nest-exceptions';
import { ExceptionResponseType } from '../../exceptions/types';
import { LoggerFactory } from '../../logger';
import { ResumeCraftRequest, ResumeCraftResponse } from '../../types';

type ExtractedErrData = {
    code: string;
    cause: unknown;
    message: string;
    ufMessage: string;
    details: unknown;
    statusCode: number;
};
@Catch(Error)
export class ErrorHandlerFilter implements ExceptionFilter {
    private readonly logger = LoggerFactory.getLogger('ErrorHandlerFilter');

    catch(err: Error, host: ExecutionContextHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<ResumeCraftResponse>();
        const request = ctx.getRequest<ResumeCraftRequest>();
        const apiName = request?.context ? request.context[ApiMetadataKeys.API_NAME] : '';
        const { statusCode, message, cause, details, ufMessage, code } = this._extractErrorDetails(err);
        this.logger.error({
            message,
            cause,
            details,
            statusCode,
            apiName,
        });

        response.status(statusCode).json({
            status: ApiStatus.ERROR,
            message,
            errors: [
                {
                    apiName,
                    message: ufMessage,
                    // Don't want to reveal internal details if it's not a validation error
                    ...(message === VALIDATION_FAIL_ERROR_MESSAGE && cause
                        ? {
                              cause,
                          }
                        : {}),
                    code,
                    details,
                },
            ],
            timestamp: Date.now(),
        });
    }

    protected _extractErrorDetails(err: Error): ExtractedErrData {
        if (err instanceof ResumeCraftException) {
            const { code, message, ufMessage, details } = err.getResponse() as ExceptionResponseType;
            const statusCode = err.getStatus();
            return {
                code,
                cause: err.cause,
                message,
                ufMessage,
                details,
                statusCode,
            };
        }

        if (err instanceof HttpException) {
            const statusCode = err.getStatus();
            const { message, cause } = err;
            const details = err.getResponse() as {
                statusCode: number;
                message: string;
            };
            const code =
                details?.message === VALIDATION_FAIL_ERROR_MESSAGE
                    ? ErrorCode.INVALID_INPUT
                    : getNestErrorCodeFromHttpStatus(statusCode);

            if (details?.message) {
                delete details.message;
            }

            if (details?.statusCode) {
                delete details.statusCode;
            }

            return {
                code,
                cause,
                message,
                ufMessage:
                    message === VALIDATION_FAIL_ERROR_MESSAGE
                        ? 'Please check your input and try again. Some required fields are missing or invalid.'
                        : 'An error occurred while processing the request.',
                details,
                statusCode,
            };
        }

        const cause = err;
        const { message } = err;
        const ufMessage = 'An error occurred while processing the request.';
        const code = ErrorCode.INTERNAL_SERVER_ERROR;
        const statusCode = 500;

        return {
            statusCode,
            code,
            cause,
            message,
            ufMessage,
            details: null,
        };
    }
}
