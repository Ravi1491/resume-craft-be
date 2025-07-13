import { type Static, Type } from '@sinclair/typebox';

import { CommonValidations } from '../helpers/common-validations';

export enum RequestSortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export const GenericGetApiRequestSchema = Type.Object({
    size: Type.Optional(Type.String()),
    nextPageToken: Type.Optional(Type.String()),
});

export type GenericGetApiRequestType<RequestAdditionalPropertiesType = unknown> = Static<
    typeof GenericGetApiRequestSchema
> &
    RequestAdditionalPropertiesType;

export const PaginationSchema = Type.Object({
    page: Type.Optional(
        Type.String({
            default: 1,
            description: 'Page number',
        })
    ),
    pageSize: Type.Optional(
        Type.String({
            default: 40,
            description: 'Items per page',
        })
    ),
    q: CommonValidations.optional(
        CommonValidations.search({
            maxLength: 50,
            allowSpecialChars: true,
            errorMessages: {
                type: 'Search term must be text',
                pattern: 'Search contains invalid characters',
            },
        })
    ),
    filter: Type.Optional(Type.String({ description: 'Filter' })),
    sortOrder: CommonValidations.optional(
        CommonValidations.enumValue(RequestSortOrder, {
            errorMessages: {
                type: `Sort order must be one of: ${Object.values(RequestSortOrder).join(', ')}`,
                enum: `Invalid sort order. Allowed values are: ${Object.values(RequestSortOrder).join(', ')}`,
            },
            default: RequestSortOrder.DESC,
        })
    ),
});
export type PaginationQueryType = Static<typeof PaginationSchema>;
