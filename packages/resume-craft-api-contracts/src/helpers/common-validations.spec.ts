import { Type } from '@sinclair/typebox';
import Ajv from 'ajv';
import addErrors from 'ajv-errors';
import addFormats from 'ajv-formats';

import { CommonValidations, DescriptionType, formatAjvErrors, convertToMinutes } from './common-validations';
import { ajvSchemaValidator } from './schema-ajv-validator';

describe('CommonValidations', () => {
    let ajv: Ajv;

    beforeEach(() => {
        ajv = new Ajv({
            allErrors: true,
            coerceTypes: false,
            strict: false,
            verbose: true,
            $data: true,
            messages: true,
        });

        addFormats(ajv);
        addErrors(ajv);
    });

    describe('uuid', () => {
        it('should validate correct UUID format', () => {
            const schema = CommonValidations.uuid();
            const validate = ajv.compile(schema);

            expect(validate('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
            expect(validate('invalid-uuid')).toBe(false);
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.uuid({
                errorMessages: {
                    type: 'Custom type error',
                    format: 'Custom format error',
                },
            });

            expect(schema.errorMessage?.type).toBe('Custom type error');
            expect(schema.errorMessage?.format).toBe('Custom format error');
        });
    });

    describe('differentValues', () => {
        it('should validate different values for specified fields', () => {
            const schema = CommonValidations.differentValues('field1', 'field2');
            const validate = ajv.compile({
                type: 'object',
                properties: {
                    field1: { type: 'string' },
                    field2: { type: 'string' },
                },
                allOf: [schema],
            });
            expect(
                validate({
                    field1: '123e4567-e89b-12d3-a456-426614174000',
                    field2: '123e4567-e89b-12d3-a456-426614174000',
                })
            ).toBe(false);
            expect(
                validate({
                    field1: '123e4567-e89b-12d3-a456-426614174000',
                    field2: 'different-uuid',
                })
            ).toBe(true);
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.differentValues('field1', 'field2', {
                errorMessage: 'Custom error message',
            });
            const validate = ajv.compile({
                type: 'object',
                properties: {
                    field1: { type: 'string' },
                    field2: { type: 'string' },
                },
                allOf: [schema],
            });

            expect(validate({ field1: 'same-value', field2: 'same-value' })).toBe(false);
            expect(validate.errors?.[0].message).toBe('Custom error message');
        });
    });

    describe('email', () => {
        it('should validate valid email addresses', () => {
            const schema = CommonValidations.email();
            const validate = ajv.compile(schema);

            expect(validate('test@example.com')).toBe(true);
            expect(validate('user.name+tag@domain.co.uk')).toBe(true);
            expect(validate('invalid-email')).toBe(false);
            expect(validate('@domain.com')).toBe(false);
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.email({
                errorMessages: {
                    type: 'Email is required',
                    format: 'Please enter a valid email',
                },
            });
            const validate = ajv.compile(schema);

            expect(validate('invalid-email')).toBe(false);
        });
    });

    describe('phone', () => {
        it('should validate phone numbers', () => {
            const schema = CommonValidations.phone();
            const validate = ajv.compile(schema);

            expect(validate('+1234567890')).toBe(true);
            expect(validate('1234567890')).toBe(true);
            expect(validate('invalid')).toBe(false);
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.phone({
                errorMessages: {
                    pattern: 'Invalid phone number format',
                },
            });
            const validate = ajv.compile(schema);

            expect(validate('abc')).toBe(false);
        });
    });

    describe('url', () => {
        it('should validate URLs', () => {
            const schema = CommonValidations.url();
            const validate = ajv.compile(schema);

            expect(validate('https://example.com')).toBe(true);
            expect(validate('http://sub.domain.com/path')).toBe(true);
            expect(validate('not-a-url')).toBe(false);
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.url({
                errorMessages: {
                    format: 'Please enter a valid URL',
                },
            });
            const validate = ajv.compile(schema);

            expect(validate('invalid-url')).toBe(false);
        });
    });

    describe('date', () => {
        it('should validate dates', () => {
            const schema = CommonValidations.date();
            const validate = ajv.compile(schema);

            expect(validate('2023-12-31')).toBe(true);
            expect(validate('2023/12/31')).toBe(false);
            expect(validate('invalid-date')).toBe(false);
        });

        it('should enforce YYYY-MM-DD format', () => {
            const schema = CommonValidations.date();
            const validate = ajv.compile(schema);

            expect(validate('2023-01-01')).toBe(true);
            expect(validate('01-01-2023')).toBe(false);
            expect(validate('2023-1-1')).toBe(false);
        });
    });

    describe('conditionalRequired', () => {
        it('should require field based on condition', () => {
            const schema = Type.Object(
                {
                    type: Type.String({ enum: ['A', 'B'] }),
                    extraField: Type.Optional(Type.String()),
                },
                {
                    allOf: [
                        CommonValidations.conditionalRequired(
                            'extraField',
                            { type: { const: 'A' } },
                            'Extra field is required for type A'
                        ),
                    ],
                }
            );
            const validate = ajv.compile(schema);

            expect(validate({ type: 'B' })).toBe(true);
            expect(validate({ type: 'A' })).toBe(false);
            expect(validate({ type: 'A', extraField: 'value' })).toBe(true);
        });
    });

    describe('customField', () => {
        it('should validate custom field definitions', () => {
            const schema = CommonValidations.customField({
                maxFields: 2,
                allowedTypes: ['text', 'number'],
            });
            const validate = ajv.compile(schema);

            const validFields = [
                { name: 'Field1', type: 'text' },
                { name: 'Field2', type: 'number' },
            ];

            const invalidFields = [
                { name: 'Field1', type: 'text' },
                { name: 'Field2', type: 'invalid' },
            ];

            expect(validate(validFields)).toBe(true);
            expect(validate(invalidFields)).toBe(false);
        });

        it('should enforce maximum fields limit', () => {
            const schema = CommonValidations.customField({ maxFields: 1 });
            const validate = ajv.compile(schema);

            const tooManyFields = [
                { name: 'Field1', type: 'text' },
                { name: 'Field2', type: 'text' },
            ];

            expect(validate(tooManyFields)).toBe(false);
        });

        it('should validate field options for select type', () => {
            const schema = CommonValidations.customField();
            const validate = ajv.compile(schema);

            const fieldWithOptions = [
                {
                    name: 'Selection',
                    type: 'select',
                    options: ['Option1', 'Option2'],
                },
            ];

            const fieldWithoutOptions = [
                {
                    name: 'Selection',
                    type: 'select',
                },
            ];

            expect(validate(fieldWithOptions)).toBe(true);
            expect(validate(fieldWithoutOptions)).toBe(true);
        });
    });

    describe('name', () => {
        it('should validate names with default settings', () => {
            const schema = CommonValidations.name();
            const validate = ajv.compile(schema);

            expect(validate('John Doe')).toBe(true);
            expect(validate('John-Doe')).toBe(true);
            expect(validate('Invalid@Name')).toBe(true);
        });
    });

    describe('uuidArray', () => {
        it('should validate array of UUIDs', () => {
            const schema = CommonValidations.uuidArray({ minItems: 1, maxItems: 3 });
            const validate = ajv.compile(schema);

            const validUUIDs = ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-34d6-b789-012345678901'];

            expect(validate(validUUIDs)).toBe(true);
            expect(validate([])).toBe(false);
            expect(validate(['invalid-uuid'])).toBe(false);
        });
    });

    describe('description', () => {
        it('should validate descriptions based on type', () => {
            const schema = CommonValidations.description({
                type: DescriptionType.Summary,
            });
            const validate = ajv.compile(schema);

            expect(validate('A valid summary')).toBe(true);
            expect(validate('a')).toBe(false);
            expect(validate('a'.repeat(256))).toBe(false);
        });

        it('should allow any content when HTML is enabled', () => {
            const schema = CommonValidations.description({
                type: DescriptionType.Detailed,
                allowHtml: true,
                minLength: 5,
            });
            const validate = ajv.compile(schema);

            expect(validate('<p>Valid HTML content</p>')).toBe(true);
            expect(validate('Plain text')).toBe(true);
            expect(validate('<script>alert("xss")</script>')).toBe(true);
            expect(validate('Special @#$% chars')).toBe(true);
            expect(validate('tiny')).toBe(false);
            expect(validate('a'.repeat(6000))).toBe(false);
        });

        it('should restrict content when HTML is not allowed', () => {
            const schema = CommonValidations.description({
                type: DescriptionType.Summary,
                allowHtml: false,
                minLength: 5,
            });
            const validate = ajv.compile(schema);

            expect(validate('Regular text')).toBe(true);
            expect(validate('Text with spaces')).toBe(true);
            expect(validate('Text with, punctuation!')).toBe(true);
            expect(validate('<p>HTML content</p>')).toBe(true);
            expect(validate('Special @#$% chars')).toBe(true);
        });
    });

    describe('search', () => {
        it('should validate search queries', () => {
            const schema = CommonValidations.search({
                minLength: 3,
                maxLength: 50,
            });
            const validate = ajv.compile(schema);

            expect(validate('valid search')).toBe(true);
            expect(validate('ab')).toBe(false);
            expect(validate('a'.repeat(51))).toBe(false);
        });

        it('should handle special characters based on configuration', () => {
            const restrictedSchema = CommonValidations.search({
                allowSpecialChars: false,
            });
            const permissiveSchema = CommonValidations.search({
                allowSpecialChars: true,
            });

            const validateRestricted = ajv.compile(restrictedSchema);
            const validatePermissive = ajv.compile(permissiveSchema);

            // Valid for both schemas
            expect(validateRestricted('simple search')).toBe(true);
            expect(validatePermissive('simple search')).toBe(true);
            expect(validateRestricted('search123')).toBe(true);
            expect(validatePermissive('search123')).toBe(true);
            expect(validateRestricted('search-term')).toBe(true);
            expect(validatePermissive('search-term')).toBe(true);
            expect(validateRestricted('search!')).toBe(true);
            expect(validatePermissive('search!')).toBe(true);
            expect(validateRestricted('search?')).toBe(true);
            expect(validatePermissive('search?')).toBe(true);
            expect(validateRestricted('search*')).toBe(true);
            expect(validatePermissive('search*')).toBe(true);
            expect(validateRestricted('search()')).toBe(false);
            expect(validatePermissive('search()')).toBe(true);

            // Valid only for permissive schema
            expect(validateRestricted('search@term')).toBe(false);
            expect(validatePermissive('search@term')).toBe(true);
            expect(validateRestricted('search#term')).toBe(false);
            expect(validatePermissive('search#term')).toBe(true);
            expect(validateRestricted('search$term')).toBe(false);
            expect(validatePermissive('search$term')).toBe(true);
            expect(validateRestricted('search%term')).toBe(false);
            expect(validatePermissive('search%term')).toBe(true);
            expect(validateRestricted('search&term')).toBe(false);
            expect(validatePermissive('search&term')).toBe(true);
            expect(validateRestricted('search+term')).toBe(false);
            expect(validatePermissive('search+term')).toBe(true);
            expect(validateRestricted('search=term')).toBe(false);
            expect(validatePermissive('search=term')).toBe(true);
            expect(validateRestricted('search/term')).toBe(false);
            expect(validatePermissive('search/term')).toBe(true);
            expect(validateRestricted('search\\term')).toBe(false);
            expect(validatePermissive('search\\term')).toBe(true);
            expect(validateRestricted('search|term')).toBe(false);
            expect(validatePermissive('search|term')).toBe(true);
            expect(validateRestricted('search:term')).toBe(false);
            expect(validatePermissive('search:term')).toBe(true);
            expect(validateRestricted('search;term')).toBe(false);
            expect(validatePermissive('search;term')).toBe(true);
            expect(validateRestricted('search"term')).toBe(false);
            expect(validatePermissive('search"term')).toBe(true);
            expect(validateRestricted("search'term")).toBe(false);
            expect(validatePermissive("search'term")).toBe(true);
            expect(validateRestricted('search<term>')).toBe(false);
            expect(validatePermissive('search<term>')).toBe(true);
        });
    });

    describe('enumValue', () => {
        enum TestEnum {
            A = 'A',
            B = 'B',
            C = 'C',
        }

        it('should validate enum values', () => {
            const schema = CommonValidations.enumValue(TestEnum);
            const validate = ajv.compile(schema);

            expect(validate('A')).toBe(true);
            expect(validate('B')).toBe(true);
            expect(validate('D')).toBe(false);
        });

        it('should handle default values', () => {
            const schema = CommonValidations.enumValue(TestEnum, {
                default: TestEnum.A,
            });
            const validate = ajv.compile(schema);
            const data = undefined;

            expect(validate(data)).toBe(false);
        });

        it('should work without default value', () => {
            const schema = CommonValidations.enumValue(TestEnum);
            const validate = ajv.compile(schema);

            expect(schema.default).toBeUndefined();
            expect(validate('A')).toBe(true);
        });
    });

    describe('pattern', () => {
        it('should validate custom patterns', () => {
            const schema = CommonValidations.pattern({
                pattern: '^TICKET-\\d{4}$',
                example: 'TICKET-0001',
            });
            const validate = ajv.compile(schema);

            expect(validate('TICKET-0001')).toBe(true);
            expect(validate('INVALID-0001')).toBe(false);
        });
    });

    describe('uniqueArray', () => {
        it('should validate arrays with unique values', () => {
            const schema = CommonValidations.uniqueArray({
                itemSchema: CommonValidations.name(),
                minItems: 1,
                maxItems: 3,
            });
            const validate = ajv.compile(schema);

            expect(validate(['John', 'Jane'])).toBe(true);
            expect(validate(['John', 'John'])).toBe(false);
            expect(validate([])).toBe(false);
            expect(validate(['A', 'B', 'C', 'D'])).toBe(false);
        });
    });

    describe('optional', () => {
        it('should make fields optional but validate when present', () => {
            const schema = CommonValidations.optional(CommonValidations.email());
            const validate = ajv.compile(schema);

            expect(validate(undefined)).toBe(false);
            expect(validate('test@example.com')).toBe(true);
            expect(validate('invalid-email')).toBe(false);
        });
    });

    describe('durationFormat', () => {
        it('should validate valid duration formats', () => {
            const schema = CommonValidations.durationFormat();
            const validFormats = [
                '1w',
                '1d',
                '1h',
                '30m',
                '1w2d', // no space
                '1d 6h', // with space
                '2h30m', // no space
                '1w 2d 3h 30m', // multiple spaces
                '1W2D3H30M', // uppercase no space
                '1w 2d3h30m', // mixed spacing
            ];

            validFormats.forEach((format) => {
                const result = ajvSchemaValidator(schema, format);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        it('should reject invalid duration formats', () => {
            const schema = CommonValidations.durationFormat();
            const validate = ajv.compile(schema);

            const invalidFormats = [
                '1x', // invalid unit
                'h', // missing number
                '30min', // invalid unit format
                '-1h', // negative number
                '1.5h', // decimal number
                '24:00', // time format
                '', // empty string
                'invalid', // invalid text
                '1h 1h', // duplicate unit
                '1y', // invalid unit
            ];

            invalidFormats.forEach((format) => {
                const isValid = validate(format);
                expect(isValid).toBe(false);
                expect(validate.errors).toBeDefined();
                expect(validate.errors?.[0].message).toBe(
                    'Please enter a valid duration (e.g., 1w 2d, 5h 30m). Use w (weeks), d (days), h (hours), m (minutes)'
                );
            });
        });
    });

    describe('queryFilter', () => {
        it('should validate basic filter array with default settings', () => {
            const schema = CommonValidations.queryFilter();
            const validate = ajv.compile(schema);

            const validFilters = [
                { field: 'status', operator: 'eq', value: 'active' },
                { field: 'createdAt', operator: 'gt', value: '2023-01-01' },
                { field: 'priority', operator: 'in', value: ['high', 'medium'] },
            ];

            expect(validate(validFilters)).toBe(true);
        });

        it('should validate filters with allowed fields restriction', () => {
            const schema = CommonValidations.queryFilter({
                allowedFields: ['status', 'priority'],
            });
            const validate = ajv.compile(schema);

            const validFilters = [
                { field: 'status', operator: 'eq', value: 'active' },
                { field: 'priority', operator: 'in', value: ['high', 'medium'] },
            ];

            const invalidFilters = [{ field: 'unknownField', operator: 'eq', value: 'test' }];

            expect(validate(validFilters)).toBe(true);
            expect(validate(invalidFilters)).toBe(false);
        });

        it('should validate filters with allowed operators restriction', () => {
            const schema = CommonValidations.queryFilter({
                allowedOperators: ['eq', 'in'],
            });
            const validate = ajv.compile(schema);

            const validFilters = [
                { field: 'status', operator: 'eq', value: 'active' },
                { field: 'priority', operator: 'in', value: ['high', 'medium'] },
            ];

            const invalidFilters = [{ field: 'createdAt', operator: 'gt', value: '2023-01-01' }];

            expect(validate(validFilters)).toBe(true);
            expect(validate(invalidFilters)).toBe(false);
        });

        it('should enforce maximum number of filters', () => {
            const schema = CommonValidations.queryFilter({
                maxFilters: 2,
            });
            const validate = ajv.compile(schema);

            const validFilters = [
                { field: 'status', operator: 'eq', value: 'active' },
                { field: 'priority', operator: 'in', value: ['high'] },
            ];

            const tooManyFilters = [
                { field: 'status', operator: 'eq', value: 'active' },
                { field: 'priority', operator: 'in', value: ['high'] },
                { field: 'createdAt', operator: 'gt', value: '2023-01-01' },
            ];

            expect(validate(validFilters)).toBe(true);
            expect(validate(tooManyFilters)).toBe(false);
        });

        it('should validate different value types', () => {
            const schema = CommonValidations.queryFilter();
            const validate = ajv.compile(schema);

            const filtersWithDifferentTypes = [
                { field: 'status', operator: 'eq', value: 'active' }, // string
                { field: 'age', operator: 'gt', value: 25 }, // number
                { field: 'isActive', operator: 'eq', value: true }, // boolean
                { field: 'tags', operator: 'in', value: ['tag1', 'tag2'] }, // array of strings
                { field: 'scores', operator: 'between', value: [80, 100] }, // array of numbers
                { field: 'deletedAt', operator: 'eq', value: null }, // null
            ];

            expect(validate(filtersWithDifferentTypes)).toBe(true);
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.queryFilter({
                allowedFields: ['status', 'priority'],
                allowedOperators: ['eq', 'in'],
                maxFilters: 2,
                errorMessages: {
                    invalidField: 'Custom field error',
                    invalidOperator: 'Custom operator error',
                    maxFilters: 'Custom max filters error',
                },
            });

            // Check if error messages are properly set in schema
            expect(schema.items.properties.field.errorMessage?.enum).toBe('Custom field error');
            expect(schema.items.properties.operator.errorMessage?.enum).toBe('Custom operator error');
            expect(schema.errorMessage?.maxItems).toBe('Custom max filters error');
        });

        it('should reject invalid filter structures', () => {
            const schema = CommonValidations.queryFilter();
            const validate = ajv.compile(schema);

            const invalidStructures = [
                null,
                {},
                [{ invalid: 'structure' }],
                [{ field: 'status' }], // missing operator and value
                [{ field: 'status', operator: 'eq' }], // missing value
                [{ operator: 'eq', value: 'test' }], // missing field
                [{ field: null, operator: 'eq', value: 'test' }], // invalid field type
                [{ field: 'status', operator: null, value: 'test' }], // invalid operator type
            ];

            invalidStructures.forEach((invalid) => {
                expect(validate(invalid)).toBe(false);
                expect(validate.errors).toBeDefined();
            });
        });
    });

    describe('stringArray', () => {
        const schema = Type.Object({
            tags: CommonValidations.stringArray({
                minItems: 1,
                maxItems: 3,
                errorMessages: {
                    type: 'Tags must be an array of strings',
                    items: 'Tags cannot contain special characters or be empty',
                },
            }),
        });

        it('should validate valid string array', () => {
            const result = ajvSchemaValidator(schema, {
                tags: ['tag1', 'tag2'],
            });
            expect(result.isValid).toBe(true);
            expect(result.errors).toBeNull();
        });

        describe('special character validation', () => {
            const invalidInputs = [
                {
                    case: 'contains @',
                    input: ['valid', 'test@email.com', 'also-valid'],
                    description: 'email format',
                },
                {
                    case: 'contains #',
                    input: ['valid', '#hashtag', 'also-valid'],
                    description: 'hashtag',
                },
                {
                    case: 'contains "',
                    input: ['Hello!', 'World'],
                    description: 'exclamation mark',
                },
                {
                    case: 'contains .',
                    input: ['hello.world', 'test'],
                    description: 'dot',
                },
                {
                    case: 'contains /',
                    input: ['path/to/file', 'test'],
                    description: 'forward slash',
                },
                {
                    case: 'contains \\',
                    input: ['path\\to\\file', 'test'],
                    description: 'backslash',
                },
                {
                    case: 'contains $',
                    input: ['$money', 'test'],
                    description: 'dollar sign',
                },
                {
                    case: 'contains %',
                    input: ['100%', 'test'],
                    description: 'percent',
                },
                {
                    case: 'contains &',
                    input: ['this&that', 'test'],
                    description: 'ampersand',
                },
                {
                    case: 'contains *',
                    input: ['wild*card', 'test'],
                    description: 'asterisk',
                },
                {
                    case: 'contains ()',
                    input: ['test(1)', 'test'],
                    description: 'parentheses',
                },
                {
                    case: 'contains []',
                    input: ['test[1]', 'test'],
                    description: 'square brackets',
                },
                {
                    case: 'contains {}',
                    input: ['test{1}', 'test'],
                    description: 'curly braces',
                },
                {
                    case: 'contains |',
                    input: ['this|that', 'test'],
                    description: 'pipe',
                },
                {
                    case: 'contains ;',
                    input: ['command;', 'test'],
                    description: 'semicolon',
                },
                {
                    case: 'contains :',
                    input: ['time:now', 'test'],
                    description: 'colon',
                },
                {
                    case: 'contains "',
                    input: ['"quoted"', 'test'],
                    description: 'double quotes',
                },
                {
                    case: "contains '",
                    input: ["'quoted'", 'test'],
                    description: 'single quotes',
                },
                {
                    case: 'contains `',
                    input: ['`backtick`', 'test'],
                    description: 'backticks',
                },
                {
                    case: 'contains ,',
                    input: ['one,two', 'test'],
                    description: 'comma',
                },
                {
                    case: 'contains <>',
                    input: ['<tag>', 'test'],
                    description: 'angle brackets',
                },
                {
                    case: 'contains unicode',
                    input: ['café', 'test'],
                    description: 'unicode characters',
                },
                {
                    case: 'contains emoji',
                    input: ['happy😊', 'test'],
                    description: 'emoji',
                },
            ];

            invalidInputs.forEach(({ case: testCase, input, description }) => {
                it(`should reject strings that ${testCase}`, () => {
                    const result = ajvSchemaValidator(schema, { tags: input });
                    expect(result.isValid).toBe(false);
                    expect(result.errors?.[0].message).toBe('Tags cannot contain special characters or be empty');
                });
            });
        });

        describe('valid inputs', () => {
            const validInputs = [
                {
                    case: 'simple words',
                    input: ['hello', 'world'],
                },
                {
                    case: 'words with numbers',
                    input: ['hello123', 'world456'],
                },
                {
                    case: 'words with hyphens',
                    input: ['hello-world', 'test-123'],
                },
                {
                    case: 'words with underscores',
                    input: ['hello_world', 'test_123'],
                },
                {
                    case: 'words with spaces',
                    input: ['hello world', 'test 123'],
                },
                {
                    case: 'mixed case',
                    input: ['HelloWorld', 'Test123'],
                },
                {
                    case: 'single characters',
                    input: ['a', 'b', 'c'],
                },
                {
                    case: 'single numbers',
                    input: ['1', '2', '3'],
                },
            ];

            validInputs.forEach(({ case: testCase, input }) => {
                it(`should accept ${testCase}`, () => {
                    const result = ajvSchemaValidator(schema, { tags: input });
                    expect(result.isValid).toBe(true);
                    expect(result.errors).toBeNull();
                });
            });
        });

        it('should reject empty array when minItems is set', () => {
            const result = ajvSchemaValidator(schema, {
                tags: [],
            });
            expect(result.isValid).toBe(false);
            expect(result.errors?.[0].message).toBe('Must have at least 1 items');
        });

        it('should reject array with only empty strings', () => {
            const result = ajvSchemaValidator(schema, {
                tags: ['', '', ''],
            });
            expect(result.isValid).toBe(false);
            expect(result.errors?.[0].message).toBe('Tags cannot contain special characters or be empty');
        });

        it('should reject array with whitespace-only strings', () => {
            const result = ajvSchemaValidator(schema, {
                tags: ['valid', '   ', 'also-valid'],
            });
            expect(result.isValid).toBe(false);
            expect(result.errors?.[0].message).toBe('Tags cannot contain special characters or be empty');
        });

        it('should reject array exceeding maxItems', () => {
            const result = ajvSchemaValidator(schema, {
                tags: ['tag1', 'tag2', 'tag3', 'tag4'],
            });
            expect(result.isValid).toBe(false);
            expect(result.errors?.[0].message).toBe('Cannot exceed 3 items');
        });

        it('should reject non-array value', () => {
            const result = ajvSchemaValidator(schema, {
                tags: 'not-an-array',
            });
            expect(result.isValid).toBe(false);
            expect(result.errors?.[0].message).toBe('Tags must be an array of strings');
        });

        it('should reject array with non-string items', () => {
            const result = ajvSchemaValidator(schema, {
                tags: ['tag1', 123, 'tag3'],
            });
            expect(result.isValid).toBe(false);
            expect(result.errors?.[0].message).toBe('Tags must be an array of strings');
        });

        describe('when minItems and maxItems are not set', () => {
            const schemaWithoutLimits = Type.Object({
                tags: CommonValidations.stringArray({
                    errorMessages: {
                        type: 'Tags must be an array of strings',
                        items: 'Tags cannot contain special characters or be empty',
                    },
                }),
            });

            it('should accept empty array', () => {
                const result = ajvSchemaValidator(schemaWithoutLimits, {
                    tags: [],
                });
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject array with empty strings even without limits', () => {
                const result = ajvSchemaValidator(schemaWithoutLimits, {
                    tags: ['valid', '', 'also-valid'],
                });
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Tags cannot contain special characters or be empty');
            });

            it('should accept array with many valid items', () => {
                const result = ajvSchemaValidator(schemaWithoutLimits, {
                    tags: Array(10).fill('tag'),
                });
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        describe('when used with optional()', () => {
            const optionalSchema = Type.Object({
                tags: CommonValidations.optional(
                    CommonValidations.stringArray({
                        minItems: 1,
                        maxItems: 3,
                        errorMessages: {
                            type: 'Tags must be an array of strings',
                            items: 'Tags cannot contain special characters or be empty',
                        },
                    })
                ),
            });

            it('should accept undefined value', () => {
                const result = ajvSchemaValidator(optionalSchema, {});
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should validate array when provided', () => {
                const result = ajvSchemaValidator(optionalSchema, {
                    tags: ['tag1', 'tag2'],
                });
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject array with empty strings when provided', () => {
                const result = ajvSchemaValidator(optionalSchema, {
                    tags: ['valid', '', 'also-valid'],
                });
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Tags cannot contain special characters or be empty');
            });

            it('should reject empty array when provided', () => {
                const result = ajvSchemaValidator(optionalSchema, {
                    tags: [],
                });
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Must have at least 1 items');
            });
        });

        describe('with custom error messages', () => {
            const customSchema = Type.Object({
                keywords: CommonValidations.stringArray({
                    minItems: 1,
                    maxItems: 2,
                    errorMessages: {
                        type: 'Keywords must be provided as an array of strings',
                        items: 'Keywords cannot contain special characters or be empty',
                    },
                }),
            });

            it('should use custom error message for type validation', () => {
                const result = ajvSchemaValidator(customSchema, {
                    keywords: 'not-an-array',
                });
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Keywords must be provided as an array of strings');
            });

            it('should use custom error message for empty strings', () => {
                const result = ajvSchemaValidator(customSchema, {
                    keywords: ['valid', ''],
                });
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Keywords cannot contain special characters or be empty');
            });
        });
    });

    describe('objectArray', () => {
        it('should validate array of objects', () => {
            const itemSchema = Type.Object({
                id: Type.String(),
                value: Type.Number(),
            });

            const schema = CommonValidations.objectArray(itemSchema, {
                minItems: 1,
                maxItems: 3,
            });
            const validate = ajv.compile(schema);

            expect(validate([{ id: '1', value: 100 }])).toBe(true);
            expect(validate([])).toBe(false);
            expect(validate([{ id: '1', value: 'invalid' }])).toBe(false);
        });
    });

    describe('pattern', () => {
        it('should validate against custom pattern', () => {
            const schema = CommonValidations.pattern({
                pattern: '^[A-Z]{3}\\d{3}$',
                example: 'ABC123',
            });
            const validate = ajv.compile(schema);

            expect(validate('ABC123')).toBe(true);
            expect(validate('abc123')).toBe(false);
        });
    });

    describe('uniqueArray', () => {
        it('should validate array with unique items', () => {
            const itemSchema = Type.Object({
                id: Type.String(),
                value: Type.Number(),
            });

            const schema = CommonValidations.uniqueArray({
                itemSchema,
                minItems: 1,
                maxItems: 3,
            });
            const validate = ajv.compile(schema);

            const validItems = [
                { id: '1', value: 100 },
                { id: '2', value: 200 },
            ];
            const duplicateItems = [
                { id: '1', value: 100 },
                { id: '1', value: 100 },
            ];

            expect(validate(validItems)).toBe(true);
            expect(validate(duplicateItems)).toBe(false);
        });
    });

    describe('search', () => {
        it('should validate search strings', () => {
            const schema = CommonValidations.search({
                minLength: 3,
                maxLength: 50,
                allowSpecialChars: false,
            });
            const validate = ajv.compile(schema);

            expect(validate('valid search')).toBe(true);
            expect(validate('ab')).toBe(false);
            expect(validate('search@with#special')).toBe(false);
        });
    });

    describe('optional', () => {
        it('should make fields optional', () => {
            const schema = Type.Object({
                required: Type.String(),
                optional: CommonValidations.optional(Type.String()),
            });
            const validate = ajv.compile(schema);

            expect(validate({ required: 'value' })).toBe(true);
            expect(validate({ required: 'value', optional: 'value' })).toBe(true);
            expect(validate({})).toBe(false);
        });
    });

    describe('durationFormat', () => {
        it('should validate duration format', () => {
            const schema = CommonValidations.durationFormat();
            const validate = ajv.compile(schema);

            expect(validate('1h')).toBe(true);
            expect(validate('30m')).toBe(true);
            expect(validate('2d')).toBe(true);
            expect(validate('invalid')).toBe(false);
        });
    });

    describe('queryFilter', () => {
        it('should validate query filters', () => {
            const schema = CommonValidations.queryFilter({
                allowedFields: ['name', 'age'],
                allowedOperators: ['eq', 'gt'],
                maxFilters: 2,
            });
            const validate = ajv.compile(schema);

            const validFilters = [
                { field: 'name', operator: 'eq', value: 'John' },
                { field: 'age', operator: 'gt', value: 18 },
            ];

            expect(validate(validFilters)).toBe(true);
            expect(validate([{ field: 'invalid', operator: 'eq', value: 'test' }])).toBe(false);
        });
    });

    describe('version', () => {
        it('should validate semver format', () => {
            const schema = CommonValidations.version({ format: 'semver' });
            const validate = ajv.compile(schema);

            // Valid semver formats
            expect(validate('1.0.0')).toBe(true);
            expect(validate('10.20.30')).toBe(true);
            expect(validate('0.0.1')).toBe(true);

            // Invalid formats
            expect(validate('1.0')).toBe(false);
            expect(validate('1')).toBe(false);
            expect(validate('invalid')).toBe(false);
            expect(validate('1.0.0.0')).toBe(false);
        });

        it('should validate integer format', () => {
            const schema = CommonValidations.version({ format: 'integer' });
            const validate = ajv.compile(schema);

            // Valid integer versions
            expect(validate('1')).toBe(true);
            expect(validate('123')).toBe(true);
            expect(validate('0')).toBe(true);

            // Invalid formats
            expect(validate('1.0')).toBe(false);
            expect(validate('abc')).toBe(false);
            expect(validate('-1')).toBe(false);
            expect(validate('1.2.3')).toBe(false);
        });

        it('should use custom error messages', () => {
            const result = ajvSchemaValidator(
                Type.Object({
                    version: CommonValidations.version({
                        format: 'semver',
                        errorMessages: {
                            type: 'Version is required',
                            format: 'Invalid version format',
                        },
                    }),
                }),
                { version: 'invalid' }
            );

            expect(result.isValid).toBe(false);
            expect(result.errors?.[0].message).toBe('Invalid version format');
        });
    });

    describe('dateRange', () => {
        it('should validate correct date format', () => {
            const schema = CommonValidations.dateRange();
            const validate = ajv.compile(schema);

            expect(validate('2024-03-20')).toBe(true);
            expect(validate('2024-12-31')).toBe(true);
            expect(validate('2024-01-01')).toBe(true);
            expect(validate('invalid-date')).toBe(false);
            expect(validate('2024/03/20')).toBe(false);
            expect(validate('20-03-2024')).toBe(false);
        });

        it('should validate date format with custom error messages', () => {
            const schema = CommonValidations.dateRange({
                errorMessages: {
                    type: 'Custom type error',
                    format: 'Custom format error',
                },
            });

            expect(schema.errorMessage?.type).toBe('Custom type error');
            expect(schema.errorMessage?.pattern).toBe('Custom format error');
        });

        it('should handle default value', () => {
            const schema = CommonValidations.dateRange({
                default: '2024-03-20',
            });

            expect(schema.default).toBe('2024-03-20');
        });
    });

    describe('timeRange', () => {
        it('should validate correct time format', () => {
            const schema = CommonValidations.timeRange();
            const validate = ajv.compile(schema);

            expect(validate('09:00')).toBe(true);
            expect(validate('17:30')).toBe(true);
            expect(validate('23:59')).toBe(true);
            expect(validate('09:00:00')).toBe(true);
            expect(validate('17:30:00')).toBe(true);
            expect(validate('23:59:59')).toBe(true);

            expect(validate('invalid-time')).toBe(false);
            expect(validate('24:00')).toBe(false);
            expect(validate('24:00:00')).toBe(false);
            expect(validate('09:60')).toBe(false);
            expect(validate('09:60:00')).toBe(false);
            expect(validate('09:00:60')).toBe(false);
            expect(validate('9:00')).toBe(false);
            expect(validate('09:0')).toBe(false);
            expect(validate('09:00:0')).toBe(false);
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.timeRange({
                errorMessages: {
                    type: 'Custom type error',
                    format: 'Custom format error',
                },
            });

            expect(schema.errorMessage?.type).toBe('Custom type error');
            expect(schema.errorMessage?.pattern).toBe('Custom format error');
        });
    });

    describe('formatAjvErrors', () => {
        it('should handle null or undefined errors', () => {
            expect(formatAjvErrors(null)).toEqual([]);
            expect(formatAjvErrors(undefined)).toEqual([]);
        });

        it('should format required field errors', () => {
            const errors = [
                {
                    keyword: 'required',
                    instancePath: '',
                    schemaPath: '#/required',
                    params: { missingProperty: 'email' },
                    message: 'must have required property email',
                },
            ];

            const formatted = formatAjvErrors(errors);
            expect(formatted).toEqual([
                {
                    field: 'email',
                    message: "The field 'email' is required",
                },
            ]);
        });

        it('should format type errors', () => {
            const errors = [
                {
                    keyword: 'type',
                    instancePath: '/age',
                    schemaPath: '#/properties/age/type',
                    params: { type: 'number' },
                    message: 'must be number',
                },
            ];

            const formatted = formatAjvErrors(errors);
            expect(formatted).toEqual([
                {
                    field: 'age',
                    message: 'age must be a number',
                    path: ['age'],
                },
            ]);
        });

        it('should format format errors', () => {
            const errors = [
                {
                    keyword: 'format',
                    instancePath: '/email',
                    schemaPath: '#/properties/email/format',
                    params: { format: 'email' },
                    message: 'must match format "email"',
                },
            ];

            const formatted = formatAjvErrors(errors);
            expect(formatted).toEqual([
                {
                    field: 'email',
                    message: 'Please enter a valid email address',
                    path: ['email'],
                },
            ]);
        });

        it('should format enum errors', () => {
            const errors = [
                {
                    keyword: 'enum',
                    instancePath: '/status',
                    schemaPath: '#/properties/status/enum',
                    params: { allowedValues: ['active', 'inactive'] },
                    message: 'must be equal to one of the allowed values',
                },
            ];

            const formatted = formatAjvErrors(errors);
            expect(formatted).toEqual([
                {
                    field: 'status',
                    message: 'Must be one of: active, inactive',
                    path: ['status'],
                },
            ]);
        });

        it('should format nested path errors', () => {
            const errors = [
                {
                    keyword: 'type',
                    instancePath: '/user/address/zipCode',
                    schemaPath: '#/properties/user/properties/address/properties/zipCode/type',
                    params: { type: 'string' },
                    message: 'must be string',
                },
            ];

            const formatted = formatAjvErrors(errors);
            expect(formatted).toEqual([
                {
                    field: 'user.address.zipCode',
                    message: 'user.address.zipCode must be a string',
                    path: ['user', 'address', 'zipCode'],
                },
            ]);
        });

        it('should format array errors', () => {
            const errors = [
                {
                    keyword: 'type',
                    instancePath: '/items/0/quantity',
                    schemaPath: '#/properties/items/items/properties/quantity/type',
                    params: { type: 'number' },
                    message: 'must be number',
                },
            ];

            const formatted = formatAjvErrors(errors);
            expect(formatted).toEqual([
                {
                    field: 'items[0].quantity',
                    message: 'items[0].quantity must be a number',
                    path: ['items', '0', 'quantity'],
                },
            ]);
        });

        it('should handle additional properties errors', () => {
            const errors = [
                {
                    keyword: 'additionalProperties',
                    instancePath: '',
                    schemaPath: '#/additionalProperties',
                    params: { additionalProperty: 'unknownField' },
                    message: 'must NOT have additional properties',
                },
            ];

            const formatted = formatAjvErrors(errors);
            expect(formatted).toEqual([
                {
                    field: 'unknownField',
                    message: "The property 'unknownField' is not allowed",
                },
            ]);
        });

        it('should prioritize custom error messages', () => {
            const errors = [
                {
                    keyword: 'errorMessage',
                    instancePath: '/email',
                    schemaPath: '#/properties/email/errorMessage',
                    params: {
                        errors: [
                            {
                                keyword: 'format',
                                instancePath: '/email',
                                schemaPath: '#/properties/email/format',
                                params: { format: 'email' },
                            },
                        ],
                    },
                    message: 'Custom email validation failed',
                },
            ];

            const formatted = formatAjvErrors(errors);
            expect(formatted).toEqual([
                {
                    field: 'email',
                    message: 'Custom email validation failed',
                    path: ['email'],
                },
            ]);
        });

        it('should handle multiple errors for the same field', () => {
            const errors = [
                {
                    keyword: 'minLength',
                    instancePath: '/password',
                    schemaPath: '#/properties/password/minLength',
                    params: { limit: 8 },
                    message: 'must NOT be shorter than 8 characters',
                },
                {
                    keyword: 'pattern',
                    instancePath: '/password',
                    schemaPath: '#/properties/password/pattern',
                    params: { pattern: '^(?=.*[A-Z])' },
                    message: 'must match pattern "^(?=.*[A-Z])"',
                },
            ];

            const formatted = formatAjvErrors(errors);

            expect(formatted.length).toBe(1);
            expect(formatted[0].field).toBe('password');
        });
    });

    describe('pattern validation tests', () => {
        describe('name pattern', () => {
            it('should validate names with allowed characters', () => {
                const schema = CommonValidations.name();
                const validate = ajv.compile(schema);

                // Valid names
                expect(validate('John Doe')).toBe(true);
                expect(validate('John-Doe')).toBe(true);
                expect(validate('John_Doe')).toBe(true);
                expect(validate('John123')).toBe(true);
                expect(validate('123')).toBe(true);
                expect(validate('a-b_c 123')).toBe(true);
            });
        });

        describe('phone pattern', () => {
            it('should validate various phone number formats', () => {
                const schema = CommonValidations.phone();
                const validate = ajv.compile(schema);

                expect(validate('1234567890')).toBe(true);
                expect(validate('+1234567890')).toBe(true);
                expect(validate('(123)4567890')).toBe(true);
                expect(validate('(123)456-7890')).toBe(true);
                expect(validate('123-456-7890')).toBe(true);
                expect(validate('123.456.7890')).toBe(true);
                expect(validate('123-456-789012')).toBe(true);

                // Invalid phone numbers
                expect(validate('123')).toBe(false);
                expect(validate('123-456')).toBe(false);
                expect(validate('123-456-78')).toBe(false);
                expect(validate('123-456-789')).toBe(false);
                expect(validate('123-456-7890-1234')).toBe(false);
                expect(validate('abc-def-ghij')).toBe(false);
                expect(validate('123 456 7890')).toBe(false);
            });
        });

        describe('date pattern', () => {
            it('should validate ISO date format (YYYY-MM-DD)', () => {
                const schema = CommonValidations.date();
                const validate = ajv.compile(schema);

                // Valid dates
                expect(validate('2023-01-01')).toBe(true);
                expect(validate('2023-12-31')).toBe(true);
                expect(validate('2023-02-28')).toBe(true);
                expect(validate('2024-02-29')).toBe(true);

                // Invalid dates
                expect(validate('01-01-2023')).toBe(false);
                expect(validate('2023/01/01')).toBe(false);
                expect(validate('2023-1-1')).toBe(false);
                expect(validate('23-01-01')).toBe(false);
                expect(validate('2023-01-32')).toBe(false);
                expect(validate('2023-13-01')).toBe(false);
                expect(validate('2023-00-01')).toBe(false);
                expect(validate('2023-01-00')).toBe(false);
            });
        });

        describe('dateRange pattern', () => {
            it('should validate date format with regex pattern', () => {
                const schema = CommonValidations.dateRange();
                const validate = ajv.compile(schema);

                // Valid dates
                expect(validate('2023-01-01')).toBe(true);
                expect(validate('2023-12-31')).toBe(true);
                expect(validate('2023-02-28')).toBe(true);
                expect(validate('2024-02-29')).toBe(true);

                // Invalid dates
                expect(validate('01-01-2023')).toBe(false);
                expect(validate('2023/01/01')).toBe(false);
                expect(validate('2023-1-1')).toBe(false);
                expect(validate('23-01-01')).toBe(false);
                expect(validate('2023-01-32')).toBe(false);
                expect(validate('2023-13-01')).toBe(false);
                expect(validate('2023-00-01')).toBe(false);
                expect(validate('2023-01-00')).toBe(false);
                expect(validate('2023-01')).toBe(false);
                expect(validate('2023')).toBe(false);
            });
        });

        describe('timeRange pattern', () => {
            it('should validate time format with regex pattern', () => {
                const schema = CommonValidations.timeRange();
                const validate = ajv.compile(schema);

                // Valid times
                expect(validate('00:00')).toBe(true);
                expect(validate('00:00:00')).toBe(true);
                expect(validate('12:30')).toBe(true);
                expect(validate('12:30:45')).toBe(true);
                expect(validate('23:59')).toBe(true);
                expect(validate('23:59:59')).toBe(true);

                // Invalid times
                expect(validate('24:00')).toBe(false);
                expect(validate('23:60')).toBe(false);
                expect(validate('23:59:60')).toBe(false);
                expect(validate('1:30')).toBe(false);
                expect(validate('12:5')).toBe(false);
                expect(validate('12:30:5')).toBe(false);
                expect(validate('12-30')).toBe(false);
                expect(validate('12:30 AM')).toBe(false);
                expect(validate('12h30m')).toBe(false);
            });
        });

        describe('durationFormat pattern', () => {
            it('should validate complex duration patterns', () => {
                const schema = CommonValidations.durationFormat();
                const validate = ajv.compile(schema);

                // Additional valid formats
                expect(validate('1w3d5h15m')).toBe(true);
                expect(validate('1W 3D 5H 15M')).toBe(true);
                expect(validate('10w')).toBe(true);
                expect(validate('20d')).toBe(true);
                expect(validate('48h')).toBe(true);
                expect(validate('90m')).toBe(true);
                expect(validate('1w 3d')).toBe(true);
                expect(validate('5h 30m')).toBe(true);
                expect(validate('1d 12h')).toBe(true);
                expect(validate('1w 2d 3h')).toBe(true);
                expect(validate('1d 6h 30m')).toBe(true);
                expect(validate('1w 6h 30m')).toBe(true);
                expect(validate('999w')).toBe(true);
                expect(validate('999W')).toBe(true);

                // Invalid formats
                expect(validate('1ww')).toBe(false);
                expect(validate('1w2w')).toBe(false);
                expect(validate('1w 2w')).toBe(false);
                expect(validate('w1')).toBe(false);
                expect(validate('1.5h')).toBe(false);
                expect(validate('-1h')).toBe(false);
                expect(validate('1h+')).toBe(false);
                expect(validate('1h 2m 3s')).toBe(false);
                expect(validate('1week')).toBe(false);
                expect(validate('1 w')).toBe(false);
                expect(validate('')).toBe(false);
            });
        });

        describe('search pattern', () => {
            it('should validate search queries with and without special characters', () => {
                const restrictedSchema = CommonValidations.search({
                    allowSpecialChars: false,
                });
                const permissiveSchema = CommonValidations.search({
                    allowSpecialChars: true,
                });

                const validateRestricted = ajv.compile(restrictedSchema);
                const validatePermissive = ajv.compile(permissiveSchema);

                // Valid for both schemas
                expect(validateRestricted('simple search')).toBe(true);
                expect(validatePermissive('simple search')).toBe(true);
                expect(validateRestricted('search123')).toBe(true);
                expect(validatePermissive('search123')).toBe(true);
                expect(validateRestricted('search-term')).toBe(true);
                expect(validatePermissive('search-term')).toBe(true);
                expect(validateRestricted('search!')).toBe(true);
                expect(validatePermissive('search!')).toBe(true);
                expect(validateRestricted('search?')).toBe(true);
                expect(validatePermissive('search?')).toBe(true);
                expect(validateRestricted('search*')).toBe(true);
                expect(validatePermissive('search*')).toBe(true);
                expect(validateRestricted('search()')).toBe(false);
                expect(validatePermissive('search()')).toBe(true);

                // Valid only for permissive schema
                expect(validateRestricted('search@term')).toBe(false);
                expect(validatePermissive('search@term')).toBe(true);
                expect(validateRestricted('search#term')).toBe(false);
                expect(validatePermissive('search#term')).toBe(true);
                expect(validateRestricted('search$term')).toBe(false);
                expect(validatePermissive('search$term')).toBe(true);
                expect(validateRestricted('search%term')).toBe(false);
                expect(validatePermissive('search%term')).toBe(true);
                expect(validateRestricted('search&term')).toBe(false);
                expect(validatePermissive('search&term')).toBe(true);
                expect(validateRestricted('search+term')).toBe(false);
                expect(validatePermissive('search+term')).toBe(true);
                expect(validateRestricted('search=term')).toBe(false);
                expect(validatePermissive('search=term')).toBe(true);
                expect(validateRestricted('search/term')).toBe(false);
                expect(validatePermissive('search/term')).toBe(true);
                expect(validateRestricted('search\\term')).toBe(false);
                expect(validatePermissive('search\\term')).toBe(true);
                expect(validateRestricted('search|term')).toBe(false);
                expect(validatePermissive('search|term')).toBe(true);
                expect(validateRestricted('search:term')).toBe(false);
                expect(validatePermissive('search:term')).toBe(true);
                expect(validateRestricted('search;term')).toBe(false);
                expect(validatePermissive('search;term')).toBe(true);
                expect(validateRestricted('search"term')).toBe(false);
                expect(validatePermissive('search"term')).toBe(true);
                expect(validateRestricted("search'term")).toBe(false);
                expect(validatePermissive("search'term")).toBe(true);
                expect(validateRestricted('search<term>')).toBe(false);
                expect(validatePermissive('search<term>')).toBe(true);
            });
        });

        describe('description pattern', () => {
            it('should validate descriptions with and without HTML', () => {
                const plainTextSchema = CommonValidations.description({
                    type: DescriptionType.Summary,
                    allowHtml: false,
                });
                const htmlSchema = CommonValidations.description({
                    type: DescriptionType.Summary,
                    allowHtml: true,
                });

                const validatePlainText = ajv.compile(plainTextSchema);
                const validateHtml = ajv.compile(htmlSchema);

                // Valid for both schemas
                expect(validatePlainText('Simple description')).toBe(true);
                expect(validateHtml('Simple description')).toBe(true);
                expect(validatePlainText('Description with numbers 123')).toBe(true);
                expect(validateHtml('Description with numbers 123')).toBe(true);
                expect(validatePlainText('Description with punctuation, like this!')).toBe(true);
                expect(validateHtml('Description with punctuation, like this!')).toBe(true);
                expect(validatePlainText('Description with (parentheses)')).toBe(true);
                expect(validateHtml('Description with (parentheses)')).toBe(true);
                expect(validatePlainText('Description with-dash')).toBe(true);
                expect(validateHtml('Description with-dash')).toBe(true);

                // HTML content should be valid for both schemas based on the implementation
                expect(validatePlainText('<p>HTML content</p>')).toBe(true);
                expect(validateHtml('<p>HTML content</p>')).toBe(true);
                expect(validatePlainText('Special @#$% chars')).toBe(true);
                expect(validateHtml('Special @#$% chars')).toBe(true);
                expect(validatePlainText('Email: test@example.com')).toBe(true);
                expect(validateHtml('Email: test@example.com')).toBe(true);
                expect(validatePlainText('URL: https://example.com')).toBe(true);
                expect(validateHtml('URL: https://example.com')).toBe(true);
                expect(validatePlainText('Symbols: @#$%^&*+=[]{}|\\:;"\'<>,.?/')).toBe(true);
                expect(validateHtml('Symbols: @#$%^&*+=[]{}|\\:;"\'<>,.?/')).toBe(true);
            });
        });

        describe('version pattern', () => {
            it('should validate semver and integer version formats', () => {
                const semverSchema = CommonValidations.version({ format: 'semver' });
                const integerSchema = CommonValidations.version({ format: 'integer' });

                const validateSemver = ajv.compile(semverSchema);
                const validateInteger = ajv.compile(integerSchema);

                // Valid semver versions
                expect(validateSemver('0.0.0')).toBe(true);
                expect(validateSemver('1.0.0')).toBe(true);
                expect(validateSemver('10.20.30')).toBe(true);
                expect(validateSemver('999.999.999')).toBe(true);

                // Invalid semver versions
                expect(validateSemver('1.0')).toBe(false);
                expect(validateSemver('1')).toBe(false);
                expect(validateSemver('1.0.0.0')).toBe(false);
                expect(validateSemver('v1.0.0')).toBe(false);
                expect(validateSemver('1.0.0-alpha')).toBe(false);
                expect(validateSemver('1.0.0+build')).toBe(false);
                expect(validateSemver('01.1.1')).toBe(true);
                expect(validateSemver('1.01.1')).toBe(true);
                expect(validateSemver('1.1.01')).toBe(true);

                // Valid integer versions
                expect(validateInteger('0')).toBe(true);
                expect(validateInteger('1')).toBe(true);
                expect(validateInteger('42')).toBe(true);
                expect(validateInteger('999')).toBe(true);
                expect(validateInteger('01')).toBe(true);

                // Invalid integer versions
                expect(validateInteger('1.0')).toBe(false);
                expect(validateInteger('v1')).toBe(false);
                expect(validateInteger('-1')).toBe(false);
                expect(validateInteger('1a')).toBe(false);
                expect(validateInteger('1.2.3')).toBe(false);
            });
        });

        describe('stringArray pattern', () => {
            it('should validate string arrays with allowed characters', () => {
                const schema = Type.Object({
                    tags: CommonValidations.stringArray({
                        minItems: 1,
                        maxItems: 3,
                    }),
                });

                const validInputs = [
                    {
                        case: 'alphanumeric with spaces',
                        input: ['tag with spaces', 'another tag'],
                    },
                    {
                        case: 'with hyphens',
                        input: ['tag-with-hyphens', 'another-tag'],
                    },
                    {
                        case: 'with underscores',
                        input: ['tag_with_underscores', 'another_tag'],
                    },
                    {
                        case: 'mixed characters',
                        input: ['tag-with_mixed-chars', 'tag 123'],
                    },
                    {
                        case: 'uppercase and lowercase',
                        input: ['TAG', 'tag', 'Tag'],
                    },
                ];

                validInputs.forEach(({ case: testCase, input }) => {
                    const result = ajvSchemaValidator(schema, { tags: input });
                    expect(result.isValid).toBe(true);
                    expect(result.errors).toBeNull();
                });

                const invalidInputs = [
                    {
                        case: 'contains +',
                        input: ['tag+plus', 'tag'],
                    },
                    {
                        case: 'contains =',
                        input: ['tag=equals', 'tag'],
                    },
                    {
                        case: 'contains ^',
                        input: ['tag^caret', 'tag'],
                    },
                    {
                        case: 'contains ~',
                        input: ['tag~tilde', 'tag'],
                    },
                    {
                        case: 'contains `',
                        input: ['tag`backtick', 'tag'],
                    },
                    {
                        case: 'contains ?',
                        input: ['tag?question', 'tag'],
                    },
                    {
                        case: 'contains !',
                        input: ['tag!exclamation', 'tag'],
                    },
                ];

                invalidInputs.forEach(({ case: testCase, input }) => {
                    const result = ajvSchemaValidator(schema, { tags: input });
                    expect(result.isValid).toBe(false);
                });
            });
        });
    });

    describe('hexColor', () => {
        it('should validate correct hex color format', () => {
            const schema = CommonValidations.hexColor();
            const validate = ajv.compile(schema);

            // Valid hex colors
            expect(validate('#FF5733')).toBe(true); // 6-character
            expect(validate('#00FF00')).toBe(true); // 6-character
            expect(validate('#000000')).toBe(true); // 6-character
            expect(validate('#FFFFFF')).toBe(true); // 6-character
            expect(validate('#123456')).toBe(true); // 6-character
            expect(validate('#abcdef')).toBe(true); // 6-character lowercase
            expect(validate('#ABCDEF')).toBe(true); // 6-character uppercase
            expect(validate('#F00')).toBe(true); // 3-character
            expect(validate('#0F0')).toBe(true); // 3-character
            expect(validate('#00F')).toBe(true); // 3-character
            expect(validate('#FF5733FF')).toBe(true); // 8-character with alpha
            expect(validate('#FF573380')).toBe(true); // 8-character with alpha
            expect(validate('#FF573300')).toBe(true); // 8-character with alpha

            // Invalid hex colors
            expect(validate('#FF573')).toBe(false); // Too short
            expect(validate('#FF57333')).toBe(false); // Too long
            expect(validate('FF5733')).toBe(false); // Missing #
            expect(validate('#FF573G')).toBe(false); // Invalid character
            expect(validate('#ff5733')).toBe(true); // Lowercase is valid
        });

        it('should handle special characters and edge cases', () => {
            const schema = CommonValidations.hexColor();
            const validate = ajv.compile(schema);

            // Special characters
            expect(validate('#@#$%^&')).toBe(false);
            expect(validate('#!@#$%^')).toBe(false);
            expect(validate('#*&^%$#')).toBe(false);
            expect(validate('#123!@#')).toBe(false);
            expect(validate('#abc@#$')).toBe(false);

            // Edge cases
            expect(validate('#0000000')).toBe(false); // 7 digits
            expect(validate('#00000')).toBe(false); // 5 digits
            expect(validate('#000')).toBe(true); // 3 digits (valid)
            expect(validate('#0')).toBe(false); // 1 digit
            expect(validate('#')).toBe(false); // Just hash
            expect(validate('')).toBe(false); // Empty string
            expect(validate(' ')).toBe(false); // Space
            expect(validate('  #FF5733')).toBe(false); // Leading spaces
            expect(validate('#FF5733  ')).toBe(false); // Trailing spaces
            expect(validate('#FF 5733')).toBe(false); // Space in middle
        });

        it('should handle mixed case and format variations', () => {
            const schema = CommonValidations.hexColor();
            const validate = ajv.compile(schema);

            // Mixed case variations
            expect(validate('#Ff5733')).toBe(true);
            expect(validate('#fF5733')).toBe(true);
            expect(validate('#FF5733')).toBe(true);
            expect(validate('#ff5733')).toBe(true);
            expect(validate('#FF5733')).toBe(true);
            expect(validate('#Ff5F33')).toBe(true);
            expect(validate('#fF5f33')).toBe(true);
            expect(validate('#Ff5')).toBe(true); // 3-character mixed case
            expect(validate('#fF5')).toBe(true); // 3-character mixed case
            expect(validate('#Ff5733Ff')).toBe(true); // 8-character mixed case

            // Format variations
            expect(validate('0xFF5733')).toBe(false); // 0x prefix
            expect(validate('0x#FF5733')).toBe(false); // Mixed prefixes
            expect(validate('##FF5733')).toBe(false); // Double hash
            expect(validate('#FF5733#')).toBe(false); // Hash at end
            expect(validate('#FF-5733')).toBe(false); // Hyphen
            expect(validate('#FF_5733')).toBe(false); // Underscore
            expect(validate('#FF.5733')).toBe(false); // Dot
        });

        it('should handle numeric and non-numeric values', () => {
            const schema = CommonValidations.hexColor();
            const validate = ajv.compile(schema);

            // Numeric values
            expect(validate('#123456')).toBe(true);
            expect(validate('#000000')).toBe(true);
            expect(validate('#999999')).toBe(true);
            expect(validate('#111111')).toBe(true);
            expect(validate('#987654')).toBe(true);
            expect(validate('#123')).toBe(true); // 3-character numeric
            expect(validate('#000')).toBe(true); // 3-character zeros
            expect(validate('#123456FF')).toBe(true); // 8-character numeric with alpha

            // Non-numeric values
            expect(validate('#abcdef')).toBe(true);
            expect(validate('#ABCDEF')).toBe(true);
            expect(validate('#aBcDeF')).toBe(true);
            expect(validate('#AbCdEf')).toBe(true);
            expect(validate('#a1b2c3')).toBe(true);
            expect(validate('#A1B2C3')).toBe(true);
            expect(validate('#abc')).toBe(true); // 3-character non-numeric
            expect(validate('#ABC')).toBe(true); // 3-character uppercase
            expect(validate('#abcdefFF')).toBe(true); // 8-character with alpha
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.hexColor({
                errorMessages: {
                    type: 'Color must be text',
                    pattern: 'Must be a valid hex color code (e.g., #FF5733, #F00, or #FF5733FF)',
                },
            });
            const validate = ajv.compile(schema);

            expect(validate('invalid')).toBe(false);
            expect(validate.errors?.[0].message).toBe(
                'Must be a valid hex color code (e.g., #FF5733, #F00, or #FF5733FF)'
            );
        });

        it('should handle required field validation', () => {
            const schema = CommonValidations.hexColor({ required: true });
            const validate = ajv.compile(schema);

            expect(validate(undefined)).toBe(false);
            expect(validate(null)).toBe(false);
            expect(validate('')).toBe(false);
            expect(validate('#FF5733')).toBe(true);
            expect(validate('#F00')).toBe(true);
            expect(validate('#FF5733FF')).toBe(true);
        });

        it('should handle different data types', () => {
            const schema = CommonValidations.hexColor();
            const validate = ajv.compile(schema);

            // Different data types
            expect(validate(123456)).toBe(false); // Number
            expect(validate(true)).toBe(false); // Boolean
            expect(validate({})).toBe(false); // Object
            expect(validate([])).toBe(false); // Array
            expect(validate(() => {})).toBe(false); // Function
            expect(validate(new Date())).toBe(false); // Date
            expect(validate(/regex/)).toBe(false); // RegExp
            expect(validate(Symbol('test'))).toBe(false); // Symbol
            expect(validate(BigInt(123))).toBe(false); // BigInt
        });

        it('should handle unicode and special characters', () => {
            const schema = CommonValidations.hexColor();
            const validate = ajv.compile(schema);

            // Unicode characters
            expect(validate('#FF5733\u00A0')).toBe(false); // Non-breaking space
            expect(validate('#FF5733\u200B')).toBe(false); // Zero-width space
            expect(validate('#FF5733\uFEFF')).toBe(false); // Zero-width no-break space
            expect(validate('#FF5733\u2028')).toBe(false); // Line separator
            expect(validate('#FF5733\u2029')).toBe(false); // Paragraph separator

            // Special characters
            expect(validate('#FF5733\n')).toBe(false); // Newline
            expect(validate('#FF5733\t')).toBe(false); // Tab
            expect(validate('#FF5733\r')).toBe(false); // Carriage return
            expect(validate('#FF5733\b')).toBe(false); // Backspace
            expect(validate('#FF5733\f')).toBe(false); // Form feed
        });
    });

    describe('emoji', () => {
        it('should validate single emoji characters', () => {
            const schema = CommonValidations.emoji();
            const validate = ajv.compile(schema);

            // Valid single emojis
            expect(validate('😊')).toBe(true);
            expect(validate('👍')).toBe(true);
            expect(validate('❤️')).toBe(true);
            expect(validate('🎉')).toBe(true);
            expect(validate('🚀')).toBe(true);
            expect(validate('🌟')).toBe(true);
            expect(validate('🎨')).toBe(true);
            expect(validate('🎭')).toBe(true);
            expect(validate('🎪')).toBe(true);
            expect(validate('🎯')).toBe(true);
        });

        it('should validate emoji with modifiers', () => {
            const schema = CommonValidations.emoji();
            const validate = ajv.compile(schema);

            // Emojis with skin tone modifiers
            expect(validate('👍🏽')).toBe(true);
            expect(validate('👋🏿')).toBe(true);
            expect(validate('👋🏻')).toBe(true);
            expect(validate('👋🏼')).toBe(true);
            expect(validate('👋🏾')).toBe(true);

            // Emojis with gender modifiers
            expect(validate('👨‍💻')).toBe(true);
            expect(validate('👩‍💻')).toBe(true);
            expect(validate('👨‍👩‍👧‍👦')).toBe(true);
        });

        it('should validate emoji sequences', () => {
            const schema = CommonValidations.emoji();
            const validate = ajv.compile(schema);

            // Valid emoji sequences
            expect(validate('👨‍👩‍👧‍👦')).toBe(true); // Family
            expect(validate('🏳️‍🌈')).toBe(true); // Rainbow flag
            expect(validate('🏴‍☠️')).toBe(true); // Pirate flag
            expect(validate('👨‍💻')).toBe(true); // Technologist
            expect(validate('👩‍💻')).toBe(true); // Female technologist
            expect(validate('🇺🇸')).toBe(true); // Flag
            expect(validate('🇺🇿')).toBe(true); // Flag
            expect(validate('🇱🇷')).toBe(true); // Flag
        });

        it('should reject invalid emoji formats', () => {
            const schema = CommonValidations.emoji();
            const validate = ajv.compile(schema);

            // Invalid formats
            expect(validate('abc')).toBe(false); // Regular text
            expect(validate('123')).toBe(false); // Numbers
            expect(validate('!@#')).toBe(false); // Special characters
            expect(validate('😊😊')).toBe(false); // Multiple emojis
            expect(validate('😊 ')).toBe(false); // Emoji with space
            expect(validate(' 😊')).toBe(false); // Space with emoji
            expect(validate('😊abc')).toBe(false); // Emoji with text
            expect(validate('abc😊')).toBe(false); // Text with emoji
            expect(validate('🇱🇷🇱🇷')).toBe(false); // Flag
        });

        it('should handle edge cases', () => {
            const schema = CommonValidations.emoji();
            const validate = ajv.compile(schema);

            // Edge cases
            expect(validate('')).toBe(false); // Empty string
            expect(validate(' ')).toBe(false); // Space
            expect(validate('  ')).toBe(false); // Multiple spaces
            expect(validate('\n')).toBe(false); // Newline
            expect(validate('\t')).toBe(false); // Tab
            expect(validate('😊\n')).toBe(false); // Emoji with newline
            expect(validate('\n😊')).toBe(false); // Newline with emoji
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.emoji({
                errorMessages: {
                    type: 'Must be an emoji',
                    pattern: 'Please provide a single valid emoji',
                },
            });
            const validate = ajv.compile(schema);

            expect(validate('invalid')).toBe(false);
            expect(validate.errors?.[0].message).toBe('Please provide a single valid emoji');
        });

        it('should handle different data types', () => {
            const schema = CommonValidations.emoji();
            const validate = ajv.compile(schema);

            // Different data types
            expect(validate(123)).toBe(false); // Number
            expect(validate(true)).toBe(false); // Boolean
            expect(validate({})).toBe(false); // Object
            expect(validate([])).toBe(false); // Array
            expect(validate(() => {})).toBe(false); // Function
            expect(validate(new Date())).toBe(false); // Date
            expect(validate(/regex/)).toBe(false); // RegExp
            expect(validate(Symbol('test'))).toBe(false); // Symbol
            expect(validate(BigInt(123))).toBe(false); // BigInt
        });

        it('should handle unicode and special characters', () => {
            const schema = CommonValidations.emoji();
            const validate = ajv.compile(schema);

            // Unicode characters
            expect(validate('😊\u00A0')).toBe(false); // Non-breaking space
            expect(validate('😊\u200B')).toBe(false); // Zero-width space
            expect(validate('😊\uFEFF')).toBe(false); // Zero-width no-break space
            expect(validate('😊\u2028')).toBe(false); // Line separator
            expect(validate('😊\u2029')).toBe(false); // Paragraph separator

            // Special characters
            expect(validate('😊\n')).toBe(false); // Newline
            expect(validate('😊\t')).toBe(false); // Tab
            expect(validate('😊\r')).toBe(false); // Carriage return
            expect(validate('😊\b')).toBe(false); // Backspace
            expect(validate('😊\f')).toBe(false); // Form feed
        });

        it('should validate various emoji categories', () => {
            const schema = CommonValidations.emoji();
            const validate = ajv.compile(schema);

            // Smileys and emotions
            expect(validate('😀')).toBe(true);
            expect(validate('😃')).toBe(true);
            expect(validate('😄')).toBe(true);
            expect(validate('😁')).toBe(true);
            expect(validate('😅')).toBe(true);

            // People and body
            expect(validate('👋')).toBe(true);
            expect(validate('👌')).toBe(true);
            expect(validate('✌️')).toBe(true);
            expect(validate('🤝')).toBe(true);
            expect(validate('👏')).toBe(true);

            // Animals and nature
            expect(validate('🐶')).toBe(true);
            expect(validate('🐱')).toBe(true);
            expect(validate('🐼')).toBe(true);
            expect(validate('🌺')).toBe(true);
            expect(validate('🌸')).toBe(true);

            // Food and drink
            expect(validate('🍕')).toBe(true);
            expect(validate('🍔')).toBe(true);
            expect(validate('🍟')).toBe(true);
            expect(validate('🍦')).toBe(true);
            expect(validate('🍩')).toBe(true);

            // Activities
            expect(validate('⚽')).toBe(true);
            expect(validate('🎮')).toBe(true);
            expect(validate('🎨')).toBe(true);
            expect(validate('🎭')).toBe(true);
            expect(validate('🎪')).toBe(true);

            // Travel and places
            expect(validate('✈️')).toBe(true);
            expect(validate('🚗')).toBe(true);
            expect(validate('🚲')).toBe(true);
            expect(validate('🗽')).toBe(true);
            expect(validate('🗼')).toBe(true);

            // Objects
            expect(validate('⌚')).toBe(true);
            expect(validate('📱')).toBe(true);
            expect(validate('💻')).toBe(true);
            expect(validate('⌨️')).toBe(true);
            expect(validate('🖥️')).toBe(true);

            // Symbols
            expect(validate('❤️')).toBe(true);
            expect(validate('💯')).toBe(true);
            expect(validate('✅')).toBe(true);
            expect(validate('❌')).toBe(true);
            expect(validate('⚠️')).toBe(true);
        });
    });

    describe('ownership', () => {
        const validateOwnership = (value: unknown) => ajvSchemaValidator(CommonValidations.ownership(), value);

        it('should validate single ownership value - assigned:me', () => {
            const value = 'assigned:me';
            const { isValid, errors } = validateOwnership(value);

            expect(isValid).toBe(true);
            expect(errors).toBeNull();
        });

        it('should validate single ownership value - created:me', () => {
            const value = 'created:me';
            const { isValid, errors } = validateOwnership(value);

            expect(isValid).toBe(true);
            expect(errors).toBeNull();
        });

        it('should validate single ownership value with UUID', () => {
            const value = 'created:123e4567-e89b-12d3-a456-426614174000';
            const { isValid, errors } = validateOwnership(value);

            expect(isValid).toBe(true);
            expect(errors).toBeNull();
        });

        it('should reject comma-separated ownership values', () => {
            const value = 'assigned:me, created:me, created:123e4567-e89b-12d3-a456-426614174000';
            const { isValid, errors } = validateOwnership(value);

            expect(isValid).toBe(false);
            expect(errors).toBeTruthy();
        });

        it('should reject invalid ownership format', () => {
            const value = 'invalid:format';
            const { isValid, errors } = validateOwnership(value);

            expect(isValid).toBe(false);
            expect(errors).toBeTruthy();
        });

        it('should reject invalid UUID in created ownership', () => {
            const value = 'created:invalid-uuid';
            const { isValid, errors } = validateOwnership(value);

            expect(isValid).toBe(false);
            expect(errors).toBeTruthy();
        });

        it('should reject non-string input', () => {
            const value = 123;
            const { isValid, errors } = validateOwnership(value);

            expect(isValid).toBe(false);
            expect(errors).toBeTruthy();
        });

        it('should reject empty string', () => {
            const value = '';
            const { isValid, errors } = validateOwnership(value);

            expect(isValid).toBe(false);
            expect(errors).toBeTruthy();
        });

        it('should use custom error messages when provided', () => {
            const customOwnership = CommonValidations.ownership({
                errorMessages: {
                    type: 'Custom type error',
                    pattern: 'Custom pattern error',
                },
            });

            expect(customOwnership.errorMessage?.pattern).toBe('Custom pattern error');

            const value = 'invalid:format';
            const { isValid } = ajvSchemaValidator(customOwnership, value);
            expect(isValid).toBe(false);
        });
    });

    describe('unixTimestamp', () => {
        it('should validate a valid timestamp', () => {
            const schema = CommonValidations.unixTimestamp();
            const result = ajvSchemaValidator(schema, '1672531200');
            expect(result.isValid).toBe(true);
        });

        it('should validate a valid millisecond timestamp', () => {
            const schema = CommonValidations.unixTimestamp();
            const result = ajvSchemaValidator(schema, '1672531200000');
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid timestamps', () => {
            const schema = CommonValidations.unixTimestamp();
            const invalidValues = ['0', '123456789', '12345678901234', '123.456', '-1234567890', '0123456789'];

            invalidValues.forEach((value) => {
                const result = ajvSchemaValidator(schema, value);
                expect(result.isValid).toBe(false);
            });
        });

        it('should use custom error messages when provided', () => {
            const schema = CommonValidations.unixTimestamp({
                errorMessages: {
                    type: 'Custom type error',
                    pattern: 'Custom pattern error',
                },
            });

            expect(schema.errorMessage?.type).toBe('Custom type error');
            expect(schema.errorMessage?.pattern).toBe('Custom pattern error');

            const result = ajvSchemaValidator(schema, 'invalid');
            expect(result.isValid).toBe(false);
        });
    });

    describe('fieldDefinitionValidation', () => {
        const TestFieldTypeEnum = {
            label: 'label',
            text: 'text',
            textarea: 'textarea',
            date: 'date',
            people: 'people',
            number: 'number',
            dropdown: 'dropdown',
        } as const;

        const validUUID = '123e4567-e89b-12d3-a456-426614174000';
        const validUUID2 = '987fcdeb-51a2-34d6-b789-012345678901';

        describe('label field type', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should validate label field with array of strings', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'label',
                    selectedValue: ['tag1', 'tag2', 'tag3'],
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject label field with non-array selectedValue', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'label',
                    selectedValue: 'not an array',
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for label fields must be an array of strings');
            });

            it('should reject label field with array of non-strings', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'label',
                    selectedValue: [123, 456, 789],
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for label fields must be an array of strings');
            });

            it('should allow label field without selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'label',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        describe('dropdown field type', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should validate dropdown field with array of strings', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'dropdown',
                    selectedValue: ['option1', 'option2'],
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject dropdown field with non-array selectedValue', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'dropdown',
                    selectedValue: 'single option',
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe(
                    'Selected value for dropdown fields must be an array of strings'
                );
            });

            it('should allow dropdown field without selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'dropdown',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        describe('text field type', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should validate text field with string selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'text',
                    selectedValue: 'This is some text content',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject text field with non-string selectedValue', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'text',
                    selectedValue: 123,
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for text fields must be a string');
            });

            it('should allow text field without selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'text',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        describe('textarea field type', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should validate textarea field with string selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'textarea',
                    selectedValue: 'This is a longer text content for textarea field',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject textarea field with non-string selectedValue', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'textarea',
                    selectedValue: ['array', 'of', 'strings'],
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for textarea fields must be a string');
            });

            it('should allow textarea field without selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'textarea',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        describe('date field type', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should validate date field with number selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'date',
                    selectedValue: 1672531200000, // Unix timestamp
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject date field with non-number selectedValue', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'date',
                    selectedValue: '2023-01-01',
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for date fields must be a number');
            });

            it('should allow date field without selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'date',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        describe('number field type', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should validate number field with number selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'number',
                    selectedValue: 42,
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should validate number field with decimal selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'number',
                    selectedValue: 3.14159,
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject number field with non-number selectedValue', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'number',
                    selectedValue: '42',
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for number fields must be a number');
            });

            it('should allow number field without selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'number',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        describe('files field type', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should reject files field with non-array selectedValue', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'files',
                    selectedValue: validUUID,
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for files fields must be an array of UUIDs');
            });

            it('should reject files field with array of non-UUIDs', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'files',
                    selectedValue: ['not-a-uuid', 'also-not-a-uuid'],
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for files fields must be an array of UUIDs');
            });
        });

        describe('people field type', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should validate people field with array of UUIDs', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'people',
                    selectedValue: [validUUID, validUUID2],
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should reject people field with non-array selectedValue', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'people',
                    selectedValue: validUUID,
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for people fields must be an array of UUIDs');
            });

            it('should reject people field with array of non-UUIDs', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'people',
                    selectedValue: ['john-doe', 'jane-smith'],
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for people fields must be an array of UUIDs');
            });

            it('should allow people field without selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'people',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });
        });

        describe('required fields validation', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should require customFieldDefinitionId', () => {
                const invalidData = {
                    fieldType: 'text',
                    selectedValue: 'some text',
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe("The field 'customFieldDefinitionId' is required");
            });

            it('should require fieldType', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    selectedValue: 'some text',
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe("The field 'fieldType' is required");
            });

            it('should validate customFieldDefinitionId as UUID', () => {
                const invalidData = {
                    customFieldDefinitionId: 'not-a-uuid',
                    fieldType: 'text',
                    selectedValue: 'some text',
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Must be a valid UUID');
            });

            it('should validate fieldType as enum value', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'invalid-type',
                    selectedValue: 'some text',
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe(
                    'Invalid field type. Must be one of: label, text, textarea, date, people, number, dropdown'
                );
            });
        });

        describe('custom error messages', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
                errorMessages: {
                    invalidFieldType: 'Custom field type error',
                    invalidSelectedValue: 'Custom selected value error',
                },
            });

            it('should use custom error message for invalid selected value', () => {
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'text',
                    selectedValue: 123,
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for text fields must be a string');
            });
        });

        describe('edge cases', () => {
            const schema = CommonValidations.fieldDefinitionValidation({
                fieldTypeEnum: TestFieldTypeEnum,
            });

            it('should handle empty string selectedValue for text fields', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'text',
                    selectedValue: '',
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should handle empty array selectedValue for label fields', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'label',
                    selectedValue: [],
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should handle zero as selectedValue for number fields', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'number',
                    selectedValue: 0,
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should handle negative numbers as selectedValue for number fields', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'number',
                    selectedValue: -42,
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should handle null selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'text',
                    selectedValue: null,
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(false);
                expect(result.errors?.[0].message).toBe('Selected value for text fields must be a string');
            });

            it('should handle undefined selectedValue', () => {
                const validData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'text',
                    selectedValue: undefined,
                };

                const result = ajvSchemaValidator(schema, validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toBeNull();
            });

            it('should filter out generic "must match then schema" error when specific child error exists', () => {
                // This test verifies that when we have both a generic "must match then schema" error
                // and a specific error for selectedValue, only the specific error is shown
                const invalidData = {
                    customFieldDefinitionId: validUUID,
                    fieldType: 'date',
                    selectedValue: 'not a number', // This should trigger both errors
                };

                const result = ajvSchemaValidator(schema, invalidData);
                expect(result.isValid).toBe(false);

                // Should only have one error, not both the generic and specific ones
                expect(result.errors).toHaveLength(1);
                expect(result.errors?.[0].message).toBe('Selected value for date fields must be a number');
                expect(result.errors?.[0].field).toBe('selectedValue');

                // Should NOT have the generic "must match then schema" error
                const hasGenericError = result.errors?.some((error) => error.message === 'must match "then" schema');
                expect(hasGenericError).toBe(false);
            });
        });
    });

    describe('convertToMinutes', () => {
        it('should convert hours to minutes', () => {
            expect(convertToMinutes(2, 'hours')).toBe(120);
            expect(convertToMinutes(1, 'hours')).toBe(60);
            expect(convertToMinutes(0.5, 'hours')).toBe(30);
        });

        it('should convert days to minutes', () => {
            expect(convertToMinutes(1, 'days')).toBe(1440);
            expect(convertToMinutes(2, 'days')).toBe(2880);
            expect(convertToMinutes(0.5, 'days')).toBe(720);
        });

        it('should return original value for unknown units', () => {
            expect(convertToMinutes(30, 'minutes')).toBe(30);
            expect(convertToMinutes(100, 'unknown')).toBe(100);
            expect(convertToMinutes(0, 'invalid')).toBe(0);
        });

        it('should handle edge cases', () => {
            expect(convertToMinutes(0, 'hours')).toBe(0);
            expect(convertToMinutes(0, 'days')).toBe(0);
            expect(convertToMinutes(-1, 'hours')).toBe(-60);
            expect(convertToMinutes(-1, 'days')).toBe(-1440);
        });
    });

    describe('enumArray', () => {
        enum TestEnum {
            A = 'A',
            B = 'B',
            C = 'C',
        }

        it('should validate array of enum values', () => {
            const schema = CommonValidations.enumArray(TestEnum);
            const validate = ajv.compile(schema);

            expect(validate(['A', 'B'])).toBe(true);
            expect(validate(['A'])).toBe(true);
            expect(validate(['A', 'B', 'C'])).toBe(true);
            expect(validate(['A', 'D'])).toBe(false);
            expect(validate(['invalid'])).toBe(false);
        });

        it('should enforce minimum and maximum items', () => {
            const schema = CommonValidations.enumArray(TestEnum, {
                minItems: 2,
                maxItems: 3,
            });
            const validate = ajv.compile(schema);

            expect(validate(['A', 'B'])).toBe(true);
            expect(validate(['A', 'B', 'C'])).toBe(true);
            expect(validate(['A'])).toBe(false);
            expect(validate(['A', 'B', 'C', 'A'])).toBe(false);
        });

        it('should handle empty array', () => {
            const schema = CommonValidations.enumArray(TestEnum);
            const validate = ajv.compile(schema);

            expect(validate([])).toBe(true);
        });

        it('should reject non-array values', () => {
            const schema = CommonValidations.enumArray(TestEnum);
            const validate = ajv.compile(schema);

            expect(validate('A')).toBe(false);
            expect(validate(123)).toBe(false);
            expect(validate({})).toBe(false);
            expect(validate(null)).toBe(false);
        });

        it('should reject array with non-string items', () => {
            const schema = CommonValidations.enumArray(TestEnum);
            const validate = ajv.compile(schema);

            expect(validate(['A', 123])).toBe(false);
            expect(validate(['A', {}])).toBe(false);
            expect(validate(['A', null])).toBe(false);
        });
    });

    describe('mimeType', () => {
        it('should validate correct MIME type formats', () => {
            const schema = CommonValidations.mimeType();
            const validate = ajv.compile(schema);

            // Valid MIME types
            expect(validate('image/jpeg')).toBe(true);
            expect(validate('image/png')).toBe(true);
            expect(validate('application/pdf')).toBe(true);
            expect(validate('text/plain')).toBe(true);
            expect(validate('application/json')).toBe(true);
            expect(validate('video/mp4')).toBe(true);
            expect(validate('audio/mpeg')).toBe(true);
            expect(validate('multipart/form-data')).toBe(true);
            expect(validate('application/x-www-form-urlencoded')).toBe(true);
            expect(validate('text/html; charset=utf-8')).toBe(false); // Parameters not allowed in basic validation
            expect(validate('IMAGE/JPEG')).toBe(false); // Uppercase not allowed
            expect(validate('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
        });

        it('should reject invalid MIME type formats', () => {
            const schema = CommonValidations.mimeType();
            const validate = ajv.compile(schema);

            // Invalid MIME types
            expect(validate('image')).toBe(false); // Missing subtype
            expect(validate('/jpeg')).toBe(false); // Missing type
            expect(validate('image/')).toBe(false); // Missing subtype
            expect(validate('image jpeg')).toBe(false); // Missing slash
            expect(validate('image\\jpeg')).toBe(false); // Wrong separator
            expect(validate('IMAGE/JPEG')).toBe(false); // Uppercase not allowed in basic validation
            expect(validate('image/jpeg/png')).toBe(false); // Too many parts
            expect(validate('')).toBe(false); // Empty string
            expect(validate('a')).toBe(false); // Too short
            expect(validate('a'.repeat(128))).toBe(false); // Too long
        });

        it('should validate MIME types with special characters', () => {
            const schema = CommonValidations.mimeType();
            const validate = ajv.compile(schema);

            // MIME types with special characters (these should be valid according to RFC 6838)
            expect(validate('application/x-www-form-urlencoded')).toBe(true);
            expect(validate('application/vnd.ms-excel')).toBe(true);
            expect(validate('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
            expect(validate('text/vnd.fly')).toBe(true);
            expect(validate('application/x-shockwave-flash')).toBe(true);
        });

        it('should enforce length constraints', () => {
            const schema = CommonValidations.mimeType();
            const validate = ajv.compile(schema);

            // Test minimum length
            expect(validate('a/b')).toBe(true); // Exactly 3 characters
            expect(validate('a')).toBe(false); // 1 character (too short)

            // Test maximum length
            const longMimeType = `application/${'x'.repeat(115)}`; // Exactly 127 characters
            expect(validate(longMimeType)).toBe(true);

            const tooLongMimeType = `application/${'x'.repeat(126)}`; // 137 characters
            expect(validate(tooLongMimeType)).toBe(false);
        });

        it('should use custom error messages', () => {
            const schema = CommonValidations.mimeType({
                errorMessages: {
                    type: 'Custom type error',
                    pattern: 'Custom pattern error',
                    minLength: 'Custom min length error',
                    maxLength: 'Custom max length error',
                },
            });
            const validate = ajv.compile(schema);

            expect(validate('invalid')).toBe(false);
            expect(validate.errors?.[0].message).toBe('Custom pattern error');
        });

        it('should handle different data types', () => {
            const schema = CommonValidations.mimeType();
            const validate = ajv.compile(schema);

            // Different data types
            expect(validate(123)).toBe(false); // Number
            expect(validate(true)).toBe(false); // Boolean
            expect(validate({})).toBe(false); // Object
            expect(validate([])).toBe(false); // Array
            expect(validate(() => {})).toBe(false); // Function
            expect(validate(new Date())).toBe(false); // Date
            expect(validate(/regex/)).toBe(false); // RegExp
            expect(validate(Symbol('test'))).toBe(false); // Symbol
            expect(validate(BigInt(123))).toBe(false); // BigInt
        });

        it('should handle edge cases', () => {
            const schema = CommonValidations.mimeType();
            const validate = ajv.compile(schema);

            // Edge cases
            expect(validate(' ')).toBe(false); // Space
            expect(validate('  ')).toBe(false); // Multiple spaces
            expect(validate('\n')).toBe(false); // Newline
            expect(validate('\t')).toBe(false); // Tab
            expect(validate('image/jpeg\n')).toBe(false); // MIME type with newline
            expect(validate('\nimage/jpeg')).toBe(false); // Newline with MIME type
            expect(validate('image/jpeg ')).toBe(false); // MIME type with trailing space
            expect(validate(' image/jpeg')).toBe(false); // MIME type with leading space
        });

        it('should validate common MIME type categories', () => {
            const schema = CommonValidations.mimeType();
            const validate = ajv.compile(schema);

            // Image types
            expect(validate('image/jpeg')).toBe(true);
            expect(validate('image/png')).toBe(true);
            expect(validate('image/gif')).toBe(true);
            expect(validate('image/webp')).toBe(true);
            expect(validate('image/svg+xml')).toBe(true);

            // Text types
            expect(validate('text/plain')).toBe(true);
            expect(validate('text/html')).toBe(true);
            expect(validate('text/css')).toBe(true);
            expect(validate('text/javascript')).toBe(true);
            expect(validate('text/xml')).toBe(true);

            // Application types
            expect(validate('application/json')).toBe(true);
            expect(validate('application/xml')).toBe(true);
            expect(validate('application/pdf')).toBe(true);
            expect(validate('application/zip')).toBe(true);
            expect(validate('application/x-www-form-urlencoded')).toBe(true);

            // Video types
            expect(validate('video/mp4')).toBe(true);
            expect(validate('video/webm')).toBe(true);
            expect(validate('video/ogg')).toBe(true);

            // Audio types
            expect(validate('audio/mpeg')).toBe(true);
            expect(validate('audio/wav')).toBe(true);
            expect(validate('audio/ogg')).toBe(true);

            // Multipart types
            expect(validate('multipart/form-data')).toBe(true);
            expect(validate('multipart/mixed')).toBe(true);
        });
    });

    describe('dependencyChain', () => {
        it('should validate simple dependency chain', () => {
            const schema = Type.Object(
                {
                    level1: Type.String({ enum: ['A', 'B', 'C'] }),
                    level2: Type.Optional(Type.String({ enum: ['X', 'Y', 'Z'] })),
                },
                {
                    allOf: [
                        CommonValidations.dependencyChain([
                            {
                                field: 'level2',
                                dependsOn: { level1: ['A', 'B'] },
                                errorMessage: 'Level 2 is required when Level 1 is A or B',
                            },
                        ]),
                    ],
                }
            );
            const validate = ajv.compile(schema);

            // Valid cases
            expect(validate({ level1: 'C' })).toBe(true);
            expect(validate({ level1: 'A', level2: 'X' })).toBe(true);
            expect(validate({ level1: 'B', level2: 'Y' })).toBe(true);

            // Invalid cases
            expect(validate({ level1: 'A' })).toBe(false);
            expect(validate({ level1: 'B' })).toBe(false);
        });

        it('should validate multiple dependencies', () => {
            const schema = Type.Object(
                {
                    category: Type.String({ enum: ['tech', 'design', 'marketing'] }),
                    priority: Type.String({ enum: ['low', 'medium', 'high'] }),
                    assignee: Type.Optional(Type.String()),
                    dueDate: Type.Optional(Type.String()),
                },
                {
                    allOf: [
                        CommonValidations.dependencyChain([
                            {
                                field: 'assignee',
                                dependsOn: { category: ['tech', 'design'] },
                                errorMessage: 'Assignee is required for tech and design categories',
                            },
                            {
                                field: 'dueDate',
                                dependsOn: { priority: ['high'] },
                                errorMessage: 'Due date is required for high priority items',
                            },
                        ]),
                    ],
                }
            );
            const validate = ajv.compile(schema);

            // Valid cases
            expect(validate({ category: 'marketing', priority: 'low' })).toBe(true);
            expect(validate({ category: 'tech', priority: 'low', assignee: 'john' })).toBe(true);
            expect(
                validate({
                    category: 'design',
                    priority: 'high',
                    assignee: 'jane',
                    dueDate: '2024-01-01',
                })
            ).toBe(true);

            // Invalid cases
            expect(validate({ category: 'tech', priority: 'low' })).toBe(false);
            expect(validate({ category: 'design', priority: 'high', assignee: 'jane' })).toBe(false);
        });

        it('should validate wildcard dependencies', () => {
            const schema = Type.Object(
                {
                    type: Type.String(),
                    config: Type.Optional(Type.String()),
                },
                {
                    allOf: [
                        CommonValidations.dependencyChain([
                            {
                                field: 'config',
                                dependsOn: { type: '*' },
                                errorMessage: 'Config is required for all types',
                            },
                        ]),
                    ],
                }
            );
            const validate = ajv.compile(schema);

            // Valid cases
            expect(validate({ type: 'any', config: 'some-config' })).toBe(true);
            expect(validate({ type: 'another', config: 'another-config' })).toBe(true);

            // Invalid cases
            expect(validate({ type: 'any' })).toBe(false);
            expect(validate({ type: 'another' })).toBe(false);
        });

        it('should use custom error messages', () => {
            const schema = Type.Object(
                {
                    status: Type.String({ enum: ['active', 'inactive'] }),
                    reason: Type.Optional(Type.String()),
                },
                {
                    allOf: [
                        CommonValidations.dependencyChain([
                            {
                                field: 'reason',
                                dependsOn: { status: ['inactive'] },
                                errorMessage: 'Please provide a reason for deactivation',
                            },
                        ]),
                    ],
                }
            );
            const validate = ajv.compile(schema);

            expect(validate({ status: 'active' })).toBe(true);
            expect(validate({ status: 'inactive' })).toBe(false);
        });

        it('should handle complex nested dependencies', () => {
            const schema = Type.Object(
                {
                    department: Type.String({
                        enum: ['engineering', 'sales', 'support'],
                    }),
                    role: Type.String({ enum: ['manager', 'developer', 'analyst'] }),
                    permissions: Type.Optional(Type.Array(Type.String())),
                },
                {
                    allOf: [
                        CommonValidations.dependencyChain([
                            {
                                field: 'permissions',
                                dependsOn: {
                                    department: ['engineering'],
                                    role: ['manager'],
                                },
                                errorMessage: 'Permissions are required for engineering managers',
                            },
                        ]),
                    ],
                }
            );
            const validate = ajv.compile(schema);

            // Valid cases
            expect(validate({ department: 'sales', role: 'analyst' })).toBe(true);
            expect(validate({ department: 'engineering', role: 'developer' })).toBe(true);
            expect(
                validate({
                    department: 'engineering',
                    role: 'manager',
                    permissions: ['read', 'write'],
                })
            ).toBe(true);

            // Invalid cases
            expect(validate({ department: 'engineering', role: 'manager' })).toBe(false);
        });
    });
});
