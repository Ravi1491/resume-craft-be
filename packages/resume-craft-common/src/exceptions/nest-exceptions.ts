import { HttpStatus } from '@nestjs/common';

import { ExceptionDetailType } from './types';

/**
 * This is based on nestjs built in errors -
 * https://docs.nestjs.com/exception-filters#built-in-http-exceptions
 * Note: This is not to be exported outside aqau-common package.
 * This is only used by simpplr-exception to convert HttpException -> CommsPlannerException.
 */
export enum NestErrorCtor {
    BadRequestException = 'BadRequestException',
    UnauthorizedException = 'UnauthorizedException',
    NotFoundException = 'NotFoundException',
    ForbiddenException = 'ForbiddenException',
    NotAcceptableException = 'NotAcceptableException',
    RequestTimeoutException = 'RequestTimeoutException',
    ConflictException = 'ConflictException',
    GoneException = 'GoneException',
    HttpVersionNotSupportedException = 'HttpVersionNotSupportedException',
    PayloadTooLargeException = 'PayloadTooLargeException',
    UnsupportedMediaTypeException = 'UnsupportedMediaTypeException',
    UnprocessableEntityException = 'UnprocessableEntityException',
    InternalServerErrorException = 'InternalServerErrorException',
    NotImplementedException = 'NotImplementedException',
    ImATeapotException = 'ImATeapotException',
    MethodNotAllowedException = 'MethodNotAllowedException',
    BadGatewayException = 'BadGatewayException',
    ServiceUnavailableException = 'ServiceUnavailableException',
    GatewayTimeoutException = 'GatewayTimeoutException',
    PreconditionFailedException = 'PreconditionFailedException',
}

const NEST_ERROR_CODE_DETAILS: Record<NestErrorCtor, ExceptionDetailType & { code: string }> = {
    [NestErrorCtor.BadRequestException]: {
        code: NestErrorCtor.BadRequestException,
        httpStatus: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
        ufMessage: 'The request could not be understood by the server.',
        httpStatusCodeText: 'Bad Request',
    },
    [NestErrorCtor.UnauthorizedException]: {
        code: NestErrorCtor.UnauthorizedException,
        httpStatus: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        ufMessage: 'You are not authorized to perform this action.',
        httpStatusCodeText: 'Unauthorized',
    },
    [NestErrorCtor.NotFoundException]: {
        code: NestErrorCtor.NotFoundException,
        httpStatus: HttpStatus.NOT_FOUND,
        message: 'Not Found',
        ufMessage: 'The requested resource could not be found.',
        httpStatusCodeText: 'Not Found',
    },
    [NestErrorCtor.ForbiddenException]: {
        code: NestErrorCtor.ForbiddenException,
        httpStatus: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
        ufMessage: 'You do not have permission to access this resource.',
        httpStatusCodeText: 'Forbidden',
    },
    [NestErrorCtor.NotAcceptableException]: {
        code: NestErrorCtor.NotAcceptableException,
        httpStatus: HttpStatus.NOT_ACCEPTABLE,
        message: 'Not Acceptable',
        ufMessage: 'The server cannot produce a response matching the list of acceptable values.',
        httpStatusCodeText: 'Not Acceptable',
    },
    [NestErrorCtor.RequestTimeoutException]: {
        code: NestErrorCtor.RequestTimeoutException,
        httpStatus: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request Timeout',
        ufMessage: 'The server timed out waiting for the request.',
        httpStatusCodeText: 'Request Timeout',
    },
    [NestErrorCtor.ConflictException]: {
        code: NestErrorCtor.ConflictException,
        httpStatus: HttpStatus.CONFLICT,
        message: 'Conflict',
        ufMessage: 'The request could not be completed due to a conflict with the current state of the resource.',
        httpStatusCodeText: 'Conflict',
    },
    [NestErrorCtor.GoneException]: {
        code: NestErrorCtor.GoneException,
        httpStatus: HttpStatus.GONE,
        message: 'Gone',
        ufMessage: 'The requested resource is no longer available.',
        httpStatusCodeText: 'Gone',
    },
    [NestErrorCtor.HttpVersionNotSupportedException]: {
        code: NestErrorCtor.HttpVersionNotSupportedException,
        httpStatus: HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
        message: 'HTTP Version Not Supported',
        ufMessage: 'The server does not support the HTTP protocol version used in the request.',
        httpStatusCodeText: 'HTTP Version Not Supported',
    },
    [NestErrorCtor.PayloadTooLargeException]: {
        code: NestErrorCtor.PayloadTooLargeException,
        httpStatus: HttpStatus.PAYLOAD_TOO_LARGE,
        message: 'Payload Too Large',
        ufMessage: 'The request is larger than the server is able or willing to process.',
        httpStatusCodeText: 'Payload Too Large',
    },
    [NestErrorCtor.UnsupportedMediaTypeException]: {
        code: NestErrorCtor.UnsupportedMediaTypeException,
        httpStatus: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        message: 'Unsupported Media Type',
        ufMessage: 'The request entity has a media type which the server or resource does not support.',
        httpStatusCodeText: 'Unsupported Media Type',
    },
    [NestErrorCtor.UnprocessableEntityException]: {
        code: NestErrorCtor.UnprocessableEntityException,
        httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Unprocessable Entity',
        ufMessage:
            'The server understands the content type of the request entity, but was unable to process the contained instructions.',
        httpStatusCodeText: 'Unprocessable Entity',
    },
    [NestErrorCtor.InternalServerErrorException]: {
        code: NestErrorCtor.InternalServerErrorException,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        ufMessage: 'The server encountered an unexpected condition which prevented it from fulfilling the request.',
        httpStatusCodeText: 'Internal Server Error',
    },
    [NestErrorCtor.NotImplementedException]: {
        code: NestErrorCtor.NotImplementedException,
        httpStatus: HttpStatus.NOT_IMPLEMENTED,
        message: 'Not Implemented',
        ufMessage: 'The server does not support the functionality required to fulfill the request.',
        httpStatusCodeText: 'Not Implemented',
    },
    [NestErrorCtor.ImATeapotException]: {
        code: NestErrorCtor.ImATeapotException,
        httpStatus: HttpStatus.I_AM_A_TEAPOT,
        message: "I'm a teapot",
        ufMessage: 'The server is a teapot and refuses to brew coffee.',
        httpStatusCodeText: "I'm a teapot",
    },
    [NestErrorCtor.MethodNotAllowedException]: {
        code: NestErrorCtor.MethodNotAllowedException,
        httpStatus: HttpStatus.METHOD_NOT_ALLOWED,
        message: 'Method Not Allowed',
        ufMessage: 'The method specified in the request is not allowed for the resource identified by the request URI.',
        httpStatusCodeText: 'Method Not Allowed',
    },
    [NestErrorCtor.BadGatewayException]: {
        code: NestErrorCtor.BadGatewayException,
        httpStatus: HttpStatus.BAD_GATEWAY,
        message: 'Bad Gateway',
        ufMessage:
            'The server, while acting as a gateway or proxy, received an invalid response from the upstream server.',
        httpStatusCodeText: 'Bad Gateway',
    },
    [NestErrorCtor.ServiceUnavailableException]: {
        code: NestErrorCtor.ServiceUnavailableException,
        httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service Unavailable',
        ufMessage:
            'The server is currently unable to handle the request due to a temporary overloading or maintenance of the server.',
        httpStatusCodeText: 'Service Unavailable',
    },
    [NestErrorCtor.GatewayTimeoutException]: {
        code: NestErrorCtor.GatewayTimeoutException,
        httpStatus: HttpStatus.GATEWAY_TIMEOUT,
        message: 'Gateway Timeout',
        ufMessage:
            'The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.',
        httpStatusCodeText: 'Gateway Timeout',
    },
    [NestErrorCtor.PreconditionFailedException]: {
        code: NestErrorCtor.PreconditionFailedException,
        httpStatus: HttpStatus.PRECONDITION_FAILED,
        message: 'Precondition Failed',
        ufMessage: 'The server does not meet one of the preconditions that the requester put on the request.',
        httpStatusCodeText: 'Precondition Failed',
    },
};

const HTTP_CODE_TO_NEST_ERROR_CODE = {
    [HttpStatus.BAD_REQUEST]: NestErrorCtor.BadRequestException,
    [HttpStatus.UNAUTHORIZED]: NestErrorCtor.UnauthorizedException,
    [HttpStatus.NOT_FOUND]: NestErrorCtor.NotFoundException,
    [HttpStatus.FORBIDDEN]: NestErrorCtor.ForbiddenException,
    [HttpStatus.NOT_ACCEPTABLE]: NestErrorCtor.NotAcceptableException,
    [HttpStatus.REQUEST_TIMEOUT]: NestErrorCtor.RequestTimeoutException,
    [HttpStatus.CONFLICT]: NestErrorCtor.ConflictException,
    [HttpStatus.GONE]: NestErrorCtor.GoneException,
    [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: NestErrorCtor.HttpVersionNotSupportedException,
    [HttpStatus.PAYLOAD_TOO_LARGE]: NestErrorCtor.PayloadTooLargeException,
    [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: NestErrorCtor.UnsupportedMediaTypeException,
    [HttpStatus.UNPROCESSABLE_ENTITY]: NestErrorCtor.UnprocessableEntityException,
    [HttpStatus.INTERNAL_SERVER_ERROR]: NestErrorCtor.InternalServerErrorException,
    [HttpStatus.NOT_IMPLEMENTED]: NestErrorCtor.NotImplementedException,
    [HttpStatus.I_AM_A_TEAPOT]: NestErrorCtor.ImATeapotException,
    [HttpStatus.METHOD_NOT_ALLOWED]: NestErrorCtor.MethodNotAllowedException,
    [HttpStatus.BAD_GATEWAY]: NestErrorCtor.BadGatewayException,
    [HttpStatus.SERVICE_UNAVAILABLE]: NestErrorCtor.ServiceUnavailableException,
    [HttpStatus.GATEWAY_TIMEOUT]: NestErrorCtor.GatewayTimeoutException,
    [HttpStatus.PRECONDITION_FAILED]: NestErrorCtor.PreconditionFailedException,
};

export function getNestErrorCodeDetails(code: NestErrorCtor) {
    return NEST_ERROR_CODE_DETAILS[code];
}

export function getNestErrorCodeFromHttpStatus(httpStatus: number) {
    return HTTP_CODE_TO_NEST_ERROR_CODE[httpStatus];
}
