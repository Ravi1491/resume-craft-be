import { BadRequestException } from '@nestjs/common';

import { LoggerAdapter, LoggerFactory } from '../../../logger';
import { validate } from '../../../schema-validator';
import { SchemaValidationPipe } from './schema-validation.pipe';

jest.mock('../../../schema-validator', () => ({
    validate: jest.fn(),
}));

describe('SchemaValidationPipe', () => {
    let pipe: SchemaValidationPipe;
    const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
    };

    beforeEach(() => {
        LoggerFactory.getLogger = () => mockLogger as unknown as LoggerAdapter;
        pipe = new SchemaValidationPipe({ type: 'object' });
    });

    it('should be defined', () => {
        expect(pipe).toBeDefined();
    });

    it('should log debug message when initialized', () => {
        expect(mockLogger.debug).toHaveBeenCalledWith('SchemaValidationPipe Initialized');
    });

    describe('transform', () => {
        it('should return the value and log debug message if validation is successful', () => {
            (validate as jest.Mock).mockReturnValue({ isValid: true });
            const value = { test: 'data' };

            const result = pipe.transform(value);

            expect(result).toBe(value);
            expect(mockLogger.debug).toHaveBeenCalledWith('validated');
            expect(validate).toHaveBeenCalledWith({ type: 'object' }, value);
        });

        it('should throw BadRequestException with cause if validation fails', () => {
            const validationErrors = 'validation error message';
            (validate as jest.Mock).mockReturnValue({
                isValid: false,
                errors: validationErrors,
            });
            const value = { invalid: 'data' };

            try {
                pipe.transform(value);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.cause).toBe(validationErrors);
                expect(mockLogger.error).toHaveBeenCalledWith({
                    ref: 'Request schema validation failed',
                    error: validationErrors,
                });
            }
        });

        it('should throw BadRequestException and log error if validation throws', () => {
            const validationError = new Error('Validation error');
            (validate as jest.Mock).mockImplementation(() => {
                throw validationError;
            });
            const value = { test: 'data' };

            try {
                pipe.transform(value);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe('Validation failed');
                expect(mockLogger.error).toHaveBeenCalledWith(validationError.toString());
            }
        });

        it('should handle empty validation errors', () => {
            (validate as jest.Mock).mockReturnValue({
                isValid: false,
                errors: undefined,
            });
            const value = { test: 'data' };

            try {
                pipe.transform(value);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(mockLogger.error).toHaveBeenCalledWith({
                    ref: 'Request schema validation failed',
                    error: undefined,
                });
            }
        });
    });
});
