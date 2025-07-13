export class ConfigValidationError extends Error {
    constructor(message: string) {
        super(`ConfigValidationError: ${message}`);
    }
}
