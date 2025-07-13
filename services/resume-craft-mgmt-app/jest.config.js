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
                // astTransformers: {
                //     before: [],
                //     after: [],
                // },
            },
        ],
    },
    setupFilesAfterEnv: [path.join(__dirname, '../../jest.setup.js')],
};
