// Silent mock logger instance - all methods do nothing
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    updateConfig: jest.fn(),
    logLevel: 'info',
};

// Mock the Logger class
class Logger {
    static getInstance() {
        return mockLogger;
    }
}

// Silent LoggerAdapter - all methods do nothing
class MockLoggerAdapter {
    constructor() {
        this.scope = null;
    }

    setScope(scope) {
        this.scope = scope;
    }

    log(message) {
        mockLogger.info(message);
    }

    error(message) {
        mockLogger.error(message);
    }

    warn(message) {
        mockLogger.warn(message);
    }

    debug(message) {
        mockLogger.debug(message);
    }
}


// Disable all logging before tests
beforeAll(() => {
    jest.clearAllMocks();
});

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
    jest.resetModules();
});
