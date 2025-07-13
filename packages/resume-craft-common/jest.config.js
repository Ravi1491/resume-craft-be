const baseConfig = require('../../jest.config');
const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
    ...baseConfig,
    rootDir: 'src',
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: './tsconfig.json',
                isolatedModules: true,
            },
        ],
    },
    transformIgnorePatterns: ['/node_modules/(?!(@simpplr/comms-planner-api-contracts)/)'],
    setupFilesAfterEnv: [path.join(__dirname, '../../jest.setup.js')],
    maxWorkers: 1,
};
