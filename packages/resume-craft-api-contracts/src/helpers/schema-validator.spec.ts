import { TSchema } from '@sinclair/typebox';

import { validate } from './schema-validator';

jest.mock('@sinclair/typebox/compiler');

describe('validate', () => {
    let mockValue: object;
    let mockSchema: TSchema;

    beforeEach(() => {
        mockSchema = {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                },
            },
        } as unknown as TSchema;

        mockValue = { name: 'John' };
        const { TypeCompiler } = jest.requireMock('@sinclair/typebox/compiler');
        TypeCompiler.Compile.mockReturnValue({
            Check: jest.fn(),
            Errors: jest.fn(),
        });
    });

    it('should validate the value against the schema successfully', () => {
        const { TypeCompiler } = jest.requireMock('@sinclair/typebox/compiler');
        const mockCompiler = TypeCompiler.Compile();
        const mockCheck = jest.fn().mockReturnValue(true);
        const mockErrors = jest.fn().mockReturnValue([]);

        mockCompiler.Check = mockCheck;
        mockCompiler.Errors = mockErrors;
        TypeCompiler.Compile.mockReturnValue(mockCompiler);

        const result = validate(mockSchema, mockValue);

        expect(TypeCompiler.Compile).toHaveBeenCalledWith(mockSchema);
        expect(mockCheck).toHaveBeenCalledWith(mockValue);
        expect(mockErrors).toHaveBeenCalledWith(mockValue);
        expect(result).toEqual({
            isValid: true,
            errors: '',
        });
    });

    it('should handle validation failure and return errors', () => {
        const { TypeCompiler } = jest.requireMock('@sinclair/typebox/compiler');
        const mockCompiler = TypeCompiler.Compile();
        const mockCheck = jest.fn().mockReturnValue(false);
        const mockError = [{ path: 'name', message: 'Should be a string' }];
        const mockErrors = jest.fn().mockReturnValue(mockError);

        mockCompiler.Check = mockCheck;
        mockCompiler.Errors = mockErrors;
        TypeCompiler.Compile.mockReturnValue(mockCompiler);

        const result = validate(mockSchema, mockValue);

        expect(TypeCompiler.Compile).toHaveBeenCalledWith(mockSchema);
        expect(mockCheck).toHaveBeenCalledWith(mockValue);
        expect(mockErrors).toHaveBeenCalledWith(mockValue);
        expect(result).toEqual({
            isValid: false,
            errors: JSON.stringify(mockError),
        });
    });
});
