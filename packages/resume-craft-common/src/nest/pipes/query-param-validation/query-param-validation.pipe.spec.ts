import { BadRequestException } from '@nestjs/common';
import { Type } from '@sinclair/typebox';

import { LoggerAdapter, LoggerFactory } from '../../../logger';
import { ajvSchemaValidator } from '../../../schema-validator';
import { QueryParamValidationPipe } from './query-param-validation.pipe';

jest.mock('../../../schema-validator', () => ({
    ajvSchemaValidator: jest.fn(),
}));

/**
 * Test suite for QueryParamValidationPipe
 * This pipe handles the transformation and validation of query parameters in NestJS applications.
 * It supports:
 * - Primitive value parsing (string, number, boolean, null, undefined)
 * - Array parsing from comma-separated strings
 * - Nested object parsing using dot notation
 * - Complex structures with mixed types
 */
describe('QueryParamValidationPipe', () => {
    let pipe: QueryParamValidationPipe;
    const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
    };

    beforeEach(() => {
        LoggerFactory.getLogger = () => mockLogger as unknown as LoggerAdapter;
        pipe = new QueryParamValidationPipe(Type.Object({}));
    });

    it('should be defined', () => {
        expect(pipe).toBeDefined();
    });

    it('should log debug message when initialized', () => {
        expect(mockLogger.debug).toHaveBeenCalledWith('QueryParamValidationPipe Initialized');
    });

    describe('transform', () => {
        /**
         * Tests for parsing primitive values from query parameters
         * These tests ensure that string values are correctly converted to their respective types
         * based on the schema definition.
         */
        describe('Primitive Value Parsing', () => {
            /**
             * Tests string value parsing
             * Ensures that string values are preserved as-is when the schema expects a string
             */
            it('should parse string values correctly', () => {
                const schema = Type.Object({
                    name: Type.String(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = { name: 'John' };
                const result = pipe.transform(value);

                expect(result).toEqual({ name: 'John' });
            });

            /**
             * Tests number value parsing
             * Ensures that string numbers are converted to actual numbers
             * Handles:
             * - Positive integers
             * - Negative numbers
             * - Decimal numbers
             * - Zero
             */
            it('should parse number values correctly', () => {
                const schema = Type.Object({
                    age: Type.Number(),
                    score: Type.Number(),
                    zero: Type.Number(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    age: '25',
                    score: '-10.5',
                    zero: '0',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    age: 25,
                    score: -10.5,
                    zero: 0,
                });
            });

            /**
             * Tests boolean value parsing
             * Ensures that string 'true' and 'false' are converted to actual boolean values
             * Handles:
             * - 'true' -> true
             * - 'false' -> false
             */
            it('should parse boolean values correctly', () => {
                const schema = Type.Object({
                    active: Type.Boolean(),
                    enabled: Type.Boolean(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    active: 'true',
                    enabled: 'false',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    active: true,
                    enabled: false,
                });
            });

            /**
             * Tests null and undefined value parsing
             * Ensures that string 'null' and 'undefined' are converted to actual null and undefined values
             * Handles:
             * - 'null' -> null
             * - 'undefined' -> undefined
             */
            it('should parse null and undefined values correctly', () => {
                const schema = Type.Object({
                    nullValue: Type.Null(),
                    undefinedValue: Type.Optional(Type.String()),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    nullValue: 'null',
                    undefinedValue: 'undefined',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    nullValue: null,
                    undefinedValue: undefined,
                });
            });

            /**
             * Tests empty string handling
             * Ensures that empty strings are handled correctly for different types
             */
            it('should handle empty strings correctly', () => {
                const schema = Type.Object({
                    string: Type.String(),
                    number: Type.Number(),
                    boolean: Type.Boolean(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    string: '',
                    number: '',
                    boolean: '',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    string: '',
                    number: '',
                    boolean: '',
                });
            });

            /**
             * Tests whitespace handling
             * Ensures that values with leading/trailing whitespace are handled correctly
             */
            it('should handle whitespace correctly', () => {
                const schema = Type.Object({
                    string: Type.String(),
                    number: Type.Number(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    string: '  value  ',
                    number: '  42  ',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    string: '  value  ',
                    number: 42,
                });
            });
        });

        /**
         * Tests for parsing array values from comma-separated strings
         * These tests ensure that arrays are correctly parsed and converted to their respective types
         * based on the schema definition.
         */
        describe('Array Value Parsing', () => {
            /**
             * Tests string array parsing
             * Ensures that comma-separated strings are converted to string arrays
             * Handles:
             * - Multiple values
             * - Values with spaces
             */
            it('should parse comma-separated string arrays', () => {
                const schema = Type.Object({
                    tags: Type.Array(Type.String()),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    tags: 'tag1,tag2,tag3',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    tags: ['tag1', 'tag2', 'tag3'],
                });
            });

            /**
             * Tests number array parsing
             * Ensures that comma-separated numbers are converted to number arrays
             * Handles:
             * - Positive integers
             * - Negative numbers
             * - Decimal numbers
             */
            it('should parse comma-separated number arrays', () => {
                const schema = Type.Object({
                    numbers: Type.Array(Type.Number()),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    numbers: '1,2,3,-4,5.5',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    numbers: [1, 2, 3, -4, 5.5],
                });
            });

            /**
             * Tests boolean array parsing
             * Ensures that comma-separated booleans are converted to boolean arrays
             * Handles:
             * - 'true' -> true
             * - 'false' -> false
             */
            it('should parse comma-separated boolean arrays', () => {
                const schema = Type.Object({
                    flags: Type.Array(Type.Boolean()),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    flags: 'true,false,true',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    flags: [true, false, true],
                });
            });

            /**
             * Tests single value array parsing
             * Ensures that single values are converted to single-item arrays
             * This is an edge case when only one value is provided
             */
            it('should handle single value arrays', () => {
                const schema = Type.Object({
                    tags: Type.Array(Type.String()),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    tags: 'single-tag',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    tags: ['single-tag'],
                });
            });

            /**
             * Tests empty array handling
             * Ensures that empty strings for array fields are handled correctly
             */
            it('should handle empty arrays', () => {
                const schema = Type.Object({
                    tags: Type.Array(Type.String()),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    tags: '',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    tags: [''],
                });
            });

            /**
             * Tests array with whitespace handling
             * Ensures that arrays with whitespace in values are handled correctly
             */
            it('should handle arrays with whitespace', () => {
                const schema = Type.Object({
                    tags: Type.Array(Type.String()),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    tags: 'tag1, tag2 , tag3',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    tags: ['tag1', 'tag2', 'tag3'],
                });
            });
        });

        /**
         * Tests for parsing nested objects using dot notation
         * These tests ensure that dot notation is correctly converted to nested object structures
         * based on the schema definition.
         */
        describe('Nested Object Parsing', () => {
            /**
             * Tests simple nested object parsing
             * Ensures that dot notation is converted to a simple nested object
             * Example: 'user.name' -> { user: { name: 'value' } }
             */
            it('should parse dot notation for simple nested objects', () => {
                const schema = Type.Object({
                    user: Type.Object({
                        name: Type.String(),
                        age: Type.Number(),
                    }),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    'user.name': 'John',
                    'user.age': '25',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    user: {
                        name: 'John',
                        age: 25,
                    },
                });
            });

            /**
             * Tests deeply nested object parsing
             * Ensures that dot notation works for deeply nested objects (4+ levels)
             * Example: 'a.b.c.d' -> { a: { b: { c: { d: 'value' } } } }
             */
            it('should parse dot notation for deeply nested objects', () => {
                const schema = Type.Object({
                    a: Type.Object({
                        b: Type.Object({
                            c: Type.Object({
                                d: Type.String(),
                            }),
                        }),
                    }),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    'a.b.c.d': 'value',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    a: {
                        b: {
                            c: {
                                d: 'value',
                            },
                        },
                    },
                });
            });

            /**
             * Tests mixed nested structures with arrays
             * Ensures that dot notation works with arrays in nested objects
             * Handles:
             * - Nested objects with arrays
             * - Multiple levels of nesting
             * - Different types of arrays (string, number, boolean)
             */
            it('should handle mixed nested structures with arrays', () => {
                const schema = Type.Object({
                    filter: Type.Object({
                        status: Type.Array(Type.String()),
                        priority: Type.Array(Type.Number()),
                        metadata: Type.Object({
                            tags: Type.Array(Type.String()),
                            flags: Type.Array(Type.Boolean()),
                        }),
                    }),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    'filter.status': 'active,pending',
                    'filter.priority': '1,2,3',
                    'filter.metadata.tags': 'tag1,tag2',
                    'filter.metadata.flags': 'true,false',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    filter: {
                        status: ['active', 'pending'],
                        priority: [1, 2, 3],
                        metadata: {
                            tags: ['tag1', 'tag2'],
                            flags: [true, false],
                        },
                    },
                });
            });

            /**
             * Tests nested object with empty values
             * Ensures that empty values in nested objects are handled correctly
             */
            it('should handle nested objects with empty values', () => {
                const schema = Type.Object({
                    user: Type.Object({
                        name: Type.String(),
                        email: Type.String(),
                    }),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    'user.name': '',
                    'user.email': '',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    user: {
                        name: '',
                        email: '',
                    },
                });
            });
        });

        /**
         * Tests for complex structure parsing
         * These tests ensure that the pipe can handle real-world complex query parameter structures
         * with mixed types, nested objects, and arrays.
         */
        describe('Complex Structure Parsing', () => {
            /**
             * Tests a complete pagination and filtering structure
             * This is a real-world example that combines:
             * - Pagination parameters
             * - Sorting parameters
             * - Column selection
             * - Multiple filter types
             * - Nested content filters
             * - Date range filters
             */
            it('should handle a complete pagination and filtering structure', () => {
                const schema = Type.Object({
                    page: Type.Number(),
                    pageSize: Type.Number(),
                    sortColumn: Type.String(),
                    sortOrder: Type.String(),
                    columns: Type.Array(Type.String()),
                    type: Type.Array(Type.String()),
                    priority: Type.Array(Type.String()),
                    status: Type.Array(Type.String()),
                    ownership: Type.Array(Type.String()),
                    content: Type.Object({
                        siteId: Type.Array(Type.String()),
                        status: Type.Array(Type.String()),
                    }),
                    from: Type.String(),
                    to: Type.String(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    page: '1',
                    pageSize: '40',
                    sortColumn: 'status',
                    sortOrder: 'desc',
                    columns: 'activity,name,etc',
                    type: 'page,newsletter,survey',
                    priority: 'low,medium,high',
                    status: 'open,inProgress,schedule,done,closed',
                    ownership: 'assigned:me,created:me,created:abc123-uuid',
                    'content.siteId': 'siteId1,siteId2',
                    'content.status': 'published',
                    from: '2024-01-01',
                    to: '2024-12-31',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    page: 1,
                    pageSize: 40,
                    sortColumn: 'status',
                    sortOrder: 'desc',
                    columns: ['activity', 'name', 'etc'],
                    type: ['page', 'newsletter', 'survey'],
                    priority: ['low', 'medium', 'high'],
                    status: ['open', 'inProgress', 'schedule', 'done', 'closed'],
                    ownership: ['assigned:me', 'created:me', 'created:abc123-uuid'],
                    content: {
                        siteId: ['siteId1', 'siteId2'],
                        status: ['published'],
                    },
                    from: '2024-01-01',
                    to: '2024-12-31',
                });
            });

            /**
             * Tests complex nested structure with optional fields
             * Ensures that optional fields in complex structures are handled correctly
             */
            it('should handle complex nested structure with optional fields', () => {
                const schema = Type.Object({
                    filter: Type.Object({
                        status: Type.Optional(Type.Array(Type.String())),
                        priority: Type.Optional(Type.Array(Type.Number())),
                        metadata: Type.Optional(
                            Type.Object({
                                tags: Type.Optional(Type.Array(Type.String())),
                                flags: Type.Optional(Type.Array(Type.Boolean())),
                            })
                        ),
                    }),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    'filter.status': 'active',
                    'filter.metadata.tags': 'tag1',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    filter: {
                        status: ['active'],
                        metadata: {
                            tags: ['tag1'],
                        },
                    },
                });
            });
        });

        /**
         * Tests for error handling
         * These tests ensure that the pipe correctly handles various error conditions
         * and throws appropriate exceptions with meaningful error messages.
         */
        describe('Error Handling', () => {
            /**
             * Tests validation failure handling
             * Ensures that the pipe throws a BadRequestException when:
             * - Required fields are missing
             * - Values don't match the schema
             * - Types don't match the schema
             */
            it('should throw BadRequestException if validation fails', () => {
                const schema = Type.Object({
                    name: Type.String(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({
                    isValid: false,
                    errors: [{ field: 'name', message: 'Required' }],
                });

                const value = {};

                expect(() => pipe.transform(value)).toThrow(BadRequestException);
                expect(mockLogger.error).toHaveBeenCalledWith({
                    ref: 'Query parameter validation failed',
                    error: [{ field: 'name', message: 'Required' }],
                });
            });

            /**
             * Tests validation error handling
             * Ensures that the pipe throws a BadRequestException when:
             * - The validation process itself throws an error
             * - The schema is invalid
             * - The validation library encounters an error
             */
            it('should throw BadRequestException if validation throws an error', () => {
                const error = new Error('Validation error');
                (ajvSchemaValidator as jest.Mock).mockImplementation(() => {
                    throw error;
                });

                expect(() => pipe.transform({})).toThrow(BadRequestException);
                expect(mockLogger.error).toHaveBeenCalledWith(error.toString());
            });

            /**
             * Tests non-object input handling
             * Ensures that the pipe handles non-object inputs gracefully by:
             * - Returning the input as-is if it's not an object
             * - Not attempting to parse or validate non-object inputs
             */
            it('should return the value as is if it is not an object', () => {
                const value = 'not an object';
                const result = pipe.transform(value as any);
                expect(result).toBe(value);
            });

            /**
             * Tests invalid number handling
             * Ensures that the pipe handles invalid number values correctly
             */
            it('should handle invalid number values', () => {
                const schema = Type.Object({
                    age: Type.Number(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    age: 'not-a-number',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    age: 'not-a-number',
                });
            });

            /**
             * Tests invalid boolean handling
             * Ensures that the pipe handles invalid boolean values correctly
             */
            it('should handle invalid boolean values', () => {
                const schema = Type.Object({
                    active: Type.Boolean(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    active: 'not-a-boolean',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    active: 'not-a-boolean',
                });
            });
        });

        describe('Type Parsing and Conversion', () => {
            /**
             * Tests type conversion for numbers
             * Ensures that various number formats are correctly parsed
             */
            it('should handle various number formats', () => {
                const schema = Type.Object({
                    integer: Type.Number(),
                    decimal: Type.Number(),
                    negative: Type.Number(),
                    scientific: Type.Number(),
                    zero: Type.Number(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    integer: '42',
                    decimal: '3.14159',
                    negative: '-123.45',
                    scientific: '1.23e-4',
                    zero: '0',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    integer: 42,
                    decimal: 3.14159,
                    negative: -123.45,
                    scientific: 0.000123,
                    zero: 0,
                });
            });

            /**
             * Tests type conversion for booleans
             * Ensures that various boolean representations are correctly parsed
             */
            it('should handle various boolean representations', () => {
                const schema = Type.Object({
                    true1: Type.Boolean(),
                    true2: Type.Boolean(),
                    false1: Type.Boolean(),
                    false2: Type.Boolean(),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    true1: 'true',
                    true2: 'TRUE',
                    false1: 'false',
                    false2: 'FALSE',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    true1: true,
                    true2: 'TRUE',
                    false1: false,
                    false2: 'FALSE',
                });
            });

            /**
             * Tests type conversion for arrays of different types
             * Ensures that arrays maintain their type consistency
             */
            it('should maintain type consistency in arrays', () => {
                const schema = Type.Object({
                    numbers: Type.Array(Type.Number()),
                    booleans: Type.Array(Type.Boolean()),
                    strings: Type.Array(Type.String()),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    numbers: '1,2.5,-3,0',
                    booleans: 'true,false,true',
                    strings: 'hello,world,123,true',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    numbers: [1, 2.5, -3, 0],
                    booleans: [true, false, true],
                    strings: ['hello', 'world', '123', 'true'],
                });
            });

            /**
             * Tests type conversion for nested objects with mixed types
             * Ensures that type conversion works correctly in nested structures
             */
            it('should handle type conversion in nested objects', () => {
                const schema = Type.Object({
                    user: Type.Object({
                        id: Type.Number(),
                        isActive: Type.Boolean(),
                        scores: Type.Array(Type.Number()),
                        metadata: Type.Object({
                            lastLogin: Type.Number(),
                            tags: Type.Array(Type.String()),
                        }),
                    }),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    'user.id': '123',
                    'user.isActive': 'true',
                    'user.scores': '95.5,87,100',
                    'user.metadata.lastLogin': '1647123456',
                    'user.metadata.tags': 'admin,premium,verified',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    user: {
                        id: 123,
                        isActive: true,
                        scores: [95.5, 87, 100],
                        metadata: {
                            lastLogin: 1647123456,
                            tags: ['admin', 'premium', 'verified'],
                        },
                    },
                });
            });

            /**
             * Tests type conversion for optional fields
             * Ensures that optional fields are handled correctly with type conversion
             */
            it('should handle type conversion for optional fields', () => {
                const schema = Type.Object({
                    required: Type.Number(),
                    optional: Type.Optional(Type.Number()),
                    optionalArray: Type.Optional(Type.Array(Type.Number())),
                    optionalNested: Type.Optional(
                        Type.Object({
                            value: Type.Number(),
                        })
                    ),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    required: '42',
                    optional: '123',
                    optionalArray: '1,2,3',
                    'optionalNested.value': '456',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    required: 42,
                    optional: 123,
                    optionalArray: [1, 2, 3],
                    optionalNested: {
                        value: 456,
                    },
                });
            });

            /**
             * Tests type conversion for null and undefined values
             * Ensures that null and undefined are handled correctly in different contexts
             */
            it('should handle null and undefined values correctly', () => {
                const schema = Type.Object({
                    nullValue: Type.Null(),
                    optionalNull: Type.Optional(Type.Null()),
                    undefinedValue: Type.Optional(Type.String()),
                    arrayWithNull: Type.Array(Type.Union([Type.String(), Type.Null()])),
                });

                pipe = new QueryParamValidationPipe(schema);
                (ajvSchemaValidator as jest.Mock).mockReturnValue({ isValid: true });

                const value = {
                    nullValue: 'null',
                    optionalNull: 'null',
                    undefinedValue: 'undefined',
                    arrayWithNull: 'value1,null,value2',
                };

                const result = pipe.transform(value);

                expect(result).toEqual({
                    nullValue: null,
                    optionalNull: null,
                    undefinedValue: undefined,
                    arrayWithNull: ['value1', null, 'value2'],
                });
            });
        });
    });
});
