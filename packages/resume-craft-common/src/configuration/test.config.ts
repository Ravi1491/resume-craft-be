import { Config } from './configuration.types';

export const TestConfig: Config = {
    env: 'test',
    userEnv: '',
    nodeEnv: 'test',
    port: 3000,
    dataSource: {
        host: 'host',
        port: 5432,
        database: 'testDB',
        username: 'testUser',
        password: 'testPassword',
    },
};
