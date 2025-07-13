import { type Static, Type } from '@sinclair/typebox';

import { CommonValidations } from '../../helpers/common-validations';
import { GenericApiResponseType, getGenericApiResponseTypeSchema } from '../response';
import { CreateUserSchema, CreateUserType } from './user';

export const CreateUserRequestSchema = Type.Object(
    {
        name: CommonValidations.name({
            min: 2,
            max: 100,
            errorMessages: {
                minLength: 'Name must be at least 2 characters',
                maxLength: 'Name cannot exceed 100 characters',
            },
        }),
        email: CommonValidations.email({
            errorMessages: {
                type: 'Email is required',
                format: 'Please enter a valid email address',
            },
        }),
        phone: CommonValidations.optional(Type.String()),
        profileImageUrl: CommonValidations.optional(Type.String()),
    },
    {
        $id: 'CreateUserRequest',
        additionalProperties: false,
        errorMessage: {
            additionalProperties: 'Additional properties are not allowed in the request',
        },
    }
);

export type CreateUserRequestType = Static<typeof CreateUserRequestSchema>;
export type CreateUserResponseType = GenericApiResponseType<CreateUserType>;
export type CreateUserRespType = GenericApiResponseType<CreateUserRequestType>;

export const CreateUserReqOpenApiSchema = JSON.parse(JSON.stringify(CreateUserRequestSchema));
export const CreateUserRespSchema = getGenericApiResponseTypeSchema(CreateUserSchema);
export const CreateUserRespOpenApiSchema = JSON.parse(JSON.stringify(CreateUserRespSchema));
