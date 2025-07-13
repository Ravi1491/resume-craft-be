import { Static, Type } from '@sinclair/typebox';

export const DataSourceConfigType = Type.Object({
    host: Type.Optional(Type.String()),
    port: Type.Optional(Type.Number()),
    database: Type.Optional(Type.String()),
    username: Type.Optional(Type.String()),
    password: Type.Optional(Type.String()),
});

export type DataSourceConfig = Static<typeof DataSourceConfigType>;
