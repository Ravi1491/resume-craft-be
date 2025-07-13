import { Static, Type } from '@sinclair/typebox';

import { API_STATUS } from '../constants';

const ErrorDetailSchema = Type.Object({
    apiName: Type.String(),
    message: Type.String(),
    code: Type.String(),
    details: Type.Optional(Type.Unknown()),
    cause: Type.Optional(Type.Unknown()),
});

export const ErrorResponseSchema = Type.Object({
    status: Type.Union([Type.Literal(API_STATUS.ERROR)]),
    message: Type.String(),
    errors: Type.Array(ErrorDetailSchema),
});

export type ErrorResponseType = Static<typeof ErrorResponseSchema>;
export const ErrorResponseOpenApiSchema = JSON.parse(JSON.stringify(ErrorResponseSchema));
