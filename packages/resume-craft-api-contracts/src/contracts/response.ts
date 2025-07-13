import { Static, TObject, TProperties, Type } from '@sinclair/typebox';

import { API_STATUS, ApiStatus } from '../constants';

const ApiStatusSchema = Type.Union([Type.Literal(API_STATUS.SUCCESS), Type.Literal(API_STATUS.ERROR)]);
export type ApiStatusType = Static<typeof ApiStatusSchema>;

export type GenericApiResponseType<ResponseDataType> = {
    status: `${ApiStatus.SUCCESS}`;
    message: string;
    result: ResponseDataType;
};

export type ListApiResponseType<ResponseDataType> = GenericApiResponseType<{
    listOfItems: ResponseDataType[];
    size: number;
    q?: string;
    nextPageToken: number | string;
    filter?: string;
    sortBy?: string;
    total?: number;
    totalRecords?: number;
    meta?: Record<string, unknown>;
}>;

export type ListAllApiResponseType<ResponseDataType> = GenericApiResponseType<{
    listOfItems: ResponseDataType[];
}>;

export type OffsetPaginatedResponseType<ResponseDataType> = GenericApiResponseType<{
    listOfItems: ResponseDataType[];
    page: number;
    pageSize: number;
    filter?: string;
    q?: string;
    sortColumn?: string;
    sortOrder?: string;
    totalPages?: number;
    total?: number;
    meta?: Record<string, unknown>;
}>;

export function getGenericApiResponseTypeSchema<T extends TProperties>(resDataSchema: TObject<T>) {
    return Type.Object({
        status: Type.Union([Type.Literal(API_STATUS.SUCCESS)]),
        message: Type.String({ minLength: 1 }),
        result: resDataSchema,
    });
}

export const getListAllApiGenericResponseTypeSchema = <T extends TProperties, U extends TProperties>(
    listItemSchema: TObject<T>,
    additionalProps: TObject<U> = Type.Object({}) as TObject<U>
) => {
    return getGenericApiResponseTypeSchema(
        Type.Composite([
            Type.Object({
                listOfItems: Type.Array(listItemSchema),
            }),
            additionalProps,
        ])
    );
};

export const getListApiGenericResponseTypeSchema = <T extends TProperties, U extends TProperties>(
    listItemSchema: TObject<T>,
    additionalProps: TObject<U> = Type.Object({}) as TObject<U>
) => {
    return getGenericApiResponseTypeSchema(
        Type.Composite([
            Type.Object({
                listOfItems: Type.Array(listItemSchema),
                size: Type.Number(),
                nextPageToken: Type.Number(),
                q: Type.Optional(Type.String()),
                filter: Type.Optional(Type.String()),
                sortBy: Type.Optional(Type.String()),
                total: Type.Optional(Type.Number()),
                totalRecords: Type.Optional(Type.Number()),
                meta: Type.Optional(Type.Record(Type.String(), Type.Any())),
            }),
            additionalProps,
        ])
    );
};

export const createOffsetPaginatedResponseSchema = <T extends TProperties, U extends TProperties>(
    listItemSchema: TObject<T>,
    additionalProps: TObject<U> = Type.Object({}) as TObject<U>
) => {
    return getGenericApiResponseTypeSchema(
        Type.Composite([
            Type.Object({
                listOfItems: Type.Array(listItemSchema),
                page: Type.Number(),
                pageSize: Type.Number(),
                total: Type.Number(),
                totalPages: Type.Number(),
                sortColumn: Type.Optional(Type.String()),
                sortOrder: Type.Optional(Type.String()),
                q: Type.Optional(Type.String()),
                search: Type.Optional(Type.String()),
                filter: Type.Optional(Type.String()),
                meta: Type.Optional(Type.Record(Type.String(), Type.Any())),
            }),
            additionalProps,
        ])
    );
};
