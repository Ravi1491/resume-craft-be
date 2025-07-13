import { type Static, Type } from '@sinclair/typebox';

const DataSourceConfigType = Type.Object({
    host: Type.Optional(Type.String()),
    port: Type.Optional(Type.Number()),
    database: Type.Optional(Type.String()),
    username: Type.Optional(Type.String()),
    password: Type.Optional(Type.String()),
});

const ConfigType = Type.Object({
    port: Type.Number(),
    env: Type.String(),
    nodeEnv: Type.Optional(Type.String()),
    userEnv: Type.String(),
    dataSource: DataSourceConfigType,
});

export type DataSourceConfig = Static<typeof DataSourceConfigType>;
export type SecretsManagerDBConfig = Static<typeof DataSourceConfigType>;
export type Config = Static<typeof ConfigType>;

export const DataSourceConfigValidationSchema = DataSourceConfigType;
export const ConfigValidationSchema = ConfigType;
