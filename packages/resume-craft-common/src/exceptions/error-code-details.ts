import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from './error-codes';
import { ExceptionDetailType } from './types';

const ERROR_CODE_DETAILS: Record<ErrorCode, ExceptionDetailType> = {
    [ErrorCode.PARTIAL_CHANGE]: {
        httpStatus: HttpStatus.PARTIAL_CONTENT,
        message: 'Partial Change',
        ufMessage: 'Your request was only partially completed. Some changes may not have been applied.',
        httpStatusCodeText: 'Bad Request',
    },
    [ErrorCode.INVALID_INPUT]: {
        httpStatus: HttpStatus.BAD_REQUEST,
        message: 'Invalid Input',
        ufMessage: 'The provided input is invalid. Please check your input and try again.',
        httpStatusCodeText: 'Bad Request',
    },
    [ErrorCode.THIRDPARTY_SERVICE_ERROR]: {
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Third Party Service Error',
        ufMessage: 'We encountered an issue while connecting to an external service. Please try again later.',
        httpStatusCodeText: 'Internal Server Error',
    },
    [ErrorCode.DATABASE_ERROR]: {
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database Error',
        ufMessage: 'We encountered a database error. Please try again later or contact support if the issue persists.',
        httpStatusCodeText: 'Internal Server Error',
    },
    [ErrorCode.INTERNAL_SERVER_ERROR]: {
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        ufMessage:
            'We encountered an internal server error. Please try again later or contact support if the issue persists.',
        httpStatusCodeText: 'Internal Server Error',
    },
    [ErrorCode.UNEXPECTED_ERROR]: {
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unexpected Error',
        ufMessage:
            'We encountered an unexpected error. Please try again later or contact support if the issue persists.',
        httpStatusCodeText: 'Internal Server Error',
    },
    [ErrorCode.AUTHORIZATION_ERROR]: {
        httpStatus: HttpStatus.UNAUTHORIZED,
        message: 'Authorization Error',
        ufMessage:
            'You are not authorized to access this resource. Please contact support if you believe this is an error.',
        httpStatusCodeText: 'Unauthorized',
    },
};

export const getErrorCodeDetails = (code: ErrorCode): ExceptionDetailType => {
    return ERROR_CODE_DETAILS[code];
};
