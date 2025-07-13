import { BadRequestException } from '@nestjs/common';

import { LoggerAdapter, LoggerFactory } from '../../../logger';
import { ajvSchemaValidator } from '../../../schema-validator';
import { SchemaAjvValidationPipe } from './schema-ajv-validation.pipe';

jest.mock('../../../schema-validator', () => ({
    ajvSchemaValidator: jest.fn(),
}));

describe('SchemaAjvValidationPipe', () => {
    let pipe: SchemaAjvValidationPipe;
    const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
    };

    beforeEach(() => {
        LoggerFactory.getLogger = () => mockLogger as unknown as LoggerAdapter;
        pipe = new SchemaAjvValidationPipe({});
    });

    it('should be defined', () => {
        expect(pipe).toBeDefined();
    });

    it('should return the value if validation is successful', () => {
        (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });
        const value = { test: 'data' };
        expect(pipe.transform(value)).toBe(value);
        expect(mockLogger.debug).toHaveBeenCalledWith('validated');
    });

    it('should throw BadRequestException if validation throws an error', () => {
        const error = new Error('Validation error');
        (ajvSchemaValidator as jest.Mock).mockImplementation(() => {
            throw error;
        });

        expect(() => pipe.transform({})).toThrow(BadRequestException);
        expect(mockLogger.error).toHaveBeenCalledWith(error.toString());
    });

    it('should throw BadRequestException with errors if validation fails', () => {
        const validationErrors = [
            { field: 'name', message: 'Required' },
            { field: 'age', message: 'Must be a number' },
        ];

        (ajvSchemaValidator as jest.Mock).mockReturnValue({
            isValid: false,
            errors: validationErrors,
        });

        expect(() => pipe.transform({})).toThrow(BadRequestException);
        expect(mockLogger.error).toHaveBeenCalledWith({
            ref: 'Request schema validation failed',
            error: validationErrors,
        });
    });

    it('should log debug message when initialized', () => {
        new SchemaAjvValidationPipe({});
        expect(mockLogger.debug).toHaveBeenCalledWith('SchemaAjvValidationPipe Initialized');
    });
});
