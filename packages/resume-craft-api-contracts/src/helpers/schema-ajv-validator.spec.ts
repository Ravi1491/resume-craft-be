import { Type } from '@sinclair/typebox';

import { ajvSchemaValidator } from './schema-ajv-validator';

describe('ajvSchemaValidator', () => {
    beforeAll(() => {
        process.env.TEST = 'true';
    });

    afterAll(() => {
        delete process.env.TEST;
    });
    describe('successful validation', () => {
        it('should return isValid true and null errors for valid data', () => {
            const schema = Type.Object(
                {
                    name: Type.String(),
                    age: Type.Number(),
                },
                { required: ['name', 'age'] }
            );

            const value = {
                name: 'John Doe',
                age: 30,
            };

            const result = ajvSchemaValidator(schema, value);
            expect(result.isValid).toBe(true);
            expect(result.errors).toBeNull();
        });

        it('should handle debug option with valid data', () => {
            const schema = Type.Object(
                {
                    name: Type.String(),
                    age: Type.Number(),
                },
                { required: ['name', 'age'] }
            );

            const value = {
                name: 'John Doe',
                age: 30,
            };

            const result = ajvSchemaValidator(schema, value, { debug: true });
            expect(result.isValid).toBe(true);
            expect(result.errors).toBeNull();
            expect(result.rawErrors).toBeNull();
        });
    });

    describe('validation failures', () => {
        it('should return isValid false and errors for missing required field', () => {
            const schema = Type.Object(
                {
                    name: Type.String(),
                    age: Type.Number(),
                },
                { required: ['name', 'age'] }
            );

            const value = {
                name: 'John Doe',
            };

            const result = ajvSchemaValidator(schema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    field: 'age',
                    message: expect.stringContaining('required'),
                }),
            ]);
        });

        it('should return isValid false and errors for wrong type', () => {
            const schema = Type.Object(
                {
                    age: Type.Number(),
                },
                { required: ['age'] }
            );

            const value = {
                age: '30',
            };

            const result = ajvSchemaValidator(schema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    field: 'age',
                    message: expect.stringContaining('number'),
                }),
            ]);
        });

        it('should handle debug option with invalid data', () => {
            const schema = Type.Object(
                {
                    age: Type.Number(),
                },
                { required: ['age'] }
            );

            const value = {
                age: '30',
            };

            const result = ajvSchemaValidator(schema, value, { debug: true });
            expect(result.isValid).toBe(false);
            expect(result.errors).not.toBeNull();
            expect(result.rawErrors).not.toBeNull();
        });

        it('should handle schema compilation errors', () => {
            // Create an invalid schema that will cause AJV to throw an error
            const invalidSchema = {
                type: 'object',
                properties: {
                    test: {
                        type: ['string', 'number'], // Valid array of types
                        format: 'non-existent-format', // Invalid format that will cause compilation error
                    },
                },
                additionalProperties: 'not-a-boolean', // This should be a boolean, causing a schema error
            } as any;

            const value = { test: 'value' };

            const result = ajvSchemaValidator(invalidSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                {
                    field: '_schema',
                    message: 'Invalid schema configuration',
                },
            ]);
        });
    });

    describe('format validation', () => {
        it('should validate email format', () => {
            const schema = Type.Object(
                {
                    email: Type.String({ format: 'email' }),
                },
                { required: ['email'] }
            );

            const invalidValue = {
                email: 'invalid-email',
            };

            const validValue = {
                email: 'test@example.com',
            };

            const invalidResult = ajvSchemaValidator(schema, invalidValue);
            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.errors).toEqual([
                expect.objectContaining({
                    field: 'email',
                    message: expect.stringContaining('email'),
                }),
            ]);

            const validResult = ajvSchemaValidator(schema, validValue);
            expect(validResult.isValid).toBe(true);
            expect(validResult.errors).toBeNull();
        });
    });

    describe('custom error messages', () => {
        it('should return custom error message when specified', () => {
            const schema = Type.Object(
                {
                    age: Type.Number({
                        minimum: 18,
                        errorMessage: {
                            minimum: 'Age must be 18 or older',
                        },
                    }),
                },
                { required: ['age'] }
            );

            const value = {
                age: 16,
            };

            const result = ajvSchemaValidator(schema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    field: 'age',
                    message: 'Age must be 18 or older',
                }),
            ]);
        });

        it('should override error messages with customMessages option', () => {
            const schema = Type.Object(
                {
                    age: Type.Number({
                        minimum: 18,
                    }),
                },
                { required: ['age'] }
            );

            const value = {
                age: 16,
            };

            const result = ajvSchemaValidator(schema, value, {
                customMessages: {
                    minimum: 'Custom minimum value error message',
                },
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    field: 'age',
                    message: 'Custom minimum value error message',
                }),
            ]);
        });
    });

    describe('nested object validation', () => {
        it('should validate nested objects', () => {
            const schema = Type.Object(
                {
                    user: Type.Object(
                        {
                            address: Type.Object(
                                { street: Type.String(), city: Type.String() },
                                { required: ['street', 'city'] }
                            ),
                        },
                        { required: ['address'] }
                    ),
                },
                { required: ['user'] }
            );

            const invalidValue = {
                user: {
                    address: {
                        street: '123 Main St',
                    },
                },
            };

            const result = ajvSchemaValidator(schema, invalidValue);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                {
                    field: 'city',
                    message: "The field 'city' is required",
                    path: ['user', 'address'],
                },
            ]);
        });
    });

    describe('time unit validation', () => {
        const timeValidationSchema = Type.Object({
            serviceLevelTargets: Type.Array(
                Type.Object({
                    respondWithinValue: Type.Number(),
                    respondWithinUnit: Type.String(),
                    resolveWithinValue: Type.Number(),
                    resolveWithinUnit: Type.String(),
                }),
                { validateTimeRelation: true }
            ),
        });

        it('should validate when resolve time is greater than response time', () => {
            const value = {
                serviceLevelTargets: [
                    {
                        respondWithinValue: 30,
                        respondWithinUnit: 'minutes',
                        resolveWithinValue: 2,
                        resolveWithinUnit: 'hours',
                    },
                ],
            };

            const result = ajvSchemaValidator(timeValidationSchema, value);
            expect(result.isValid).toBe(true);
            expect(result.errors).toBeNull();
        });

        it('should reject when resolve time is less than response time', () => {
            const value = {
                serviceLevelTargets: [
                    {
                        respondWithinValue: 2,
                        respondWithinUnit: 'hours',
                        resolveWithinValue: 30,
                        resolveWithinUnit: 'minutes',
                    },
                ],
            };

            const result = ajvSchemaValidator(timeValidationSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: 'Resolution time must be strictly greater than response time for each severity level',
                }),
            ]);
        });

        it('should validate complex time unit combinations', () => {
            const value = {
                serviceLevelTargets: [
                    {
                        respondWithinValue: 5,
                        respondWithinUnit: 'days',
                        resolveWithinValue: 1,
                        resolveWithinUnit: 'months',
                    },
                    {
                        respondWithinValue: 12,
                        respondWithinUnit: 'hours',
                        resolveWithinValue: 2,
                        resolveWithinUnit: 'days',
                    },
                ],
            };

            const result = ajvSchemaValidator(timeValidationSchema, value);
            expect(result.isValid).toBe(true);
            expect(result.errors).toBeNull();
        });

        it('should reject when resolve time equals response time in different units', () => {
            const value = {
                serviceLevelTargets: [
                    {
                        respondWithinValue: 1,
                        respondWithinUnit: 'days',
                        resolveWithinValue: 24,
                        resolveWithinUnit: 'hours',
                    },
                ],
            };

            const result = ajvSchemaValidator(timeValidationSchema, value);
            expect(result.isValid).toBe(false);
        });

        it('should handle empty array for validateTimeRelation', () => {
            const value = {
                serviceLevelTargets: [],
            };

            const result = ajvSchemaValidator(timeValidationSchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('unique escalation orders validation', () => {
        const escalationOrderSchema = Type.Object({
            steps: Type.Array(
                Type.Object({
                    escalationOrder: Type.Number(),
                    name: Type.String(),
                }),
                { validateUniqueEscalationOrders: true }
            ),
        });

        it('should validate unique escalation orders', () => {
            const value = {
                steps: [
                    { escalationOrder: 1, name: 'Step 1' },
                    { escalationOrder: 2, name: 'Step 2' },
                    { escalationOrder: 3, name: 'Step 3' },
                ],
            };

            const result = ajvSchemaValidator(escalationOrderSchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject duplicate escalation orders', () => {
            const value = {
                steps: [
                    { escalationOrder: 1, name: 'Step 1' },
                    { escalationOrder: 1, name: 'Step 2' },
                    { escalationOrder: 3, name: 'Step 3' },
                ],
            };

            const result = ajvSchemaValidator(escalationOrderSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Escalation orders must be unique'),
                }),
            ]);
        });

        it('should handle empty array for validateUniqueEscalationOrders', () => {
            const value = {
                steps: [],
            };

            const result = ajvSchemaValidator(escalationOrderSchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('unique severity levels validation', () => {
        const severityLevelSchema = Type.Object({
            serviceLevels: Type.Array(
                Type.Object({
                    severity: Type.String(),
                    description: Type.String(),
                }),
                { validateUniqueSeverityLevels: true }
            ),
        });

        it('should validate unique severity levels', () => {
            const value = {
                serviceLevels: [
                    { severity: 'high', description: 'High severity' },
                    { severity: 'medium', description: 'Medium severity' },
                    { severity: 'low', description: 'Low severity' },
                ],
            };

            const result = ajvSchemaValidator(severityLevelSchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject duplicate severity levels', () => {
            const value = {
                serviceLevels: [
                    { severity: 'high', description: 'High severity' },
                    { severity: 'high', description: 'Another high severity' },
                    { severity: 'low', description: 'Low severity' },
                ],
            };

            const result = ajvSchemaValidator(severityLevelSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Service level targets must have unique severity levels'),
                }),
            ]);
        });

        it('should handle empty array for validateUniqueSeverityLevels', () => {
            const value = {
                serviceLevels: [],
            };

            const result = ajvSchemaValidator(severityLevelSchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('unique policy IDs validation', () => {
        const policySchema = Type.Object({
            policies: Type.Array(
                Type.Object({
                    policyId: Type.String(),
                    name: Type.String(),
                }),
                { validateUniquePolicyIds: true }
            ),
        });

        it('should validate unique policy IDs', () => {
            const value = {
                policies: [
                    { policyId: 'policy1', name: 'Policy 1' },
                    { policyId: 'policy2', name: 'Policy 2' },
                    { policyId: 'policy3', name: 'Policy 3' },
                ],
            };

            const result = ajvSchemaValidator(policySchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject duplicate policy IDs', () => {
            const value = {
                policies: [
                    { policyId: 'policy1', name: 'Policy 1' },
                    { policyId: 'policy1', name: 'Policy 2' },
                    { policyId: 'policy3', name: 'Policy 3' },
                ],
            };

            const result = ajvSchemaValidator(policySchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Policy IDs must be unique'),
                }),
            ]);
        });

        it('should handle empty array for validateUniquePolicyIds', () => {
            const value = {
                policies: [],
            };

            const result = ajvSchemaValidator(policySchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('unique positions validation', () => {
        const positionsSchema = Type.Object({
            tickets: Type.Array(
                Type.Object({
                    position: Type.Number(),
                    title: Type.String(),
                }),
                { validateUniquePositions: true }
            ),
        });

        it('should validate unique positions', () => {
            const value = {
                tickets: [
                    { position: 1, title: 'Ticket 1' },
                    { position: 2, title: 'Ticket 2' },
                    { position: 3, title: 'Ticket 3' },
                ],
            };

            const result = ajvSchemaValidator(positionsSchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject duplicate positions', () => {
            const value = {
                tickets: [
                    { position: 1, title: 'Ticket 1' },
                    { position: 1, title: 'Ticket 2' },
                    { position: 3, title: 'Ticket 3' },
                ],
            };

            const result = ajvSchemaValidator(positionsSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Positions must be unique'),
                }),
            ]);
        });

        it('should handle empty array for validateUniquePositions', () => {
            const value = {
                tickets: [],
            };

            const result = ajvSchemaValidator(positionsSchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('unique ticket IDs validation', () => {
        const ticketSchema = Type.Object({
            tickets: Type.Array(
                Type.Object({
                    ticketId: Type.String(),
                    title: Type.String(),
                }),
                { validateUniqueTicketIds: true }
            ),
        });

        it('should validate unique ticket IDs', () => {
            const value = {
                tickets: [
                    { ticketId: 'ticket1', title: 'Ticket 1' },
                    { ticketId: 'ticket2', title: 'Ticket 2' },
                    { ticketId: 'ticket3', title: 'Ticket 3' },
                ],
            };

            const result = ajvSchemaValidator(ticketSchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject duplicate ticket IDs', () => {
            const value = {
                tickets: [
                    { ticketId: 'ticket1', title: 'Ticket 1' },
                    { ticketId: 'ticket1', title: 'Ticket 2' },
                    { ticketId: 'ticket3', title: 'Ticket 3' },
                ],
            };

            const result = ajvSchemaValidator(ticketSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Ticket IDs must be unique'),
                }),
            ]);
        });

        it('should handle empty array for validateUniqueTicketIds', () => {
            const value = {
                tickets: [],
            };

            const result = ajvSchemaValidator(ticketSchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('time range validation', () => {
        const timeRangeSchema = Type.Object({
            schedule: Type.Object(
                {
                    startTime: Type.String(),
                    endTime: Type.String(),
                },
                { validateTimeRange: true }
            ),
        });

        it('should validate valid time range', () => {
            const value = {
                schedule: {
                    startTime: '09:00',
                    endTime: '17:00',
                },
            };

            const result = ajvSchemaValidator(timeRangeSchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid time range', () => {
            const value = {
                schedule: {
                    startTime: '17:00',
                    endTime: '09:00',
                },
            };

            const result = ajvSchemaValidator(timeRangeSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Start time must be before end time'),
                }),
            ]);
        });

        it('should handle missing time values', () => {
            const value = {
                schedule: {
                    startTime: '',
                    endTime: '',
                },
            };

            const result = ajvSchemaValidator(timeRangeSchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('future date validation', () => {
        const futureDateSchema = Type.Object({
            holiday: Type.String({ validateFutureDate: true }),
        });

        it('should validate date in the future', () => {
            // Get a future date (next year)
            const today = new Date();
            const nextYear = today.getFullYear() + 1;
            const futureDate = `01-01-${nextYear}`;

            const value = {
                holiday: futureDate,
            };

            const result = ajvSchemaValidator(futureDateSchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject date in the past', () => {
            // Get a past date (last year)
            const today = new Date();
            const lastYear = today.getFullYear() - 1;
            const pastDate = `01-01-${lastYear}`;

            const value = {
                holiday: pastDate,
            };

            const result = ajvSchemaValidator(futureDateSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Holiday date cannot be in the past'),
                }),
            ]);
        });
    });

    describe('isNotEmpty validation', () => {
        const nonEmptySchema = Type.Object({
            name: Type.String({ isNotEmpty: true }),
        });

        it('should validate non-empty string', () => {
            const value = {
                name: 'John Doe',
            };

            const result = ajvSchemaValidator(nonEmptySchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject empty string', () => {
            const value = {
                name: '   ',
            };

            const result = ajvSchemaValidator(nonEmptySchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('should not be empty'),
                }),
            ]);
        });
    });

    describe('allowEmpty validation', () => {
        const allowEmptySchema = Type.Object({
            description: Type.String({ allowEmpty: true }),
        });

        it('should validate empty string with allowEmpty', () => {
            const value = {
                description: '',
            };

            const result = ajvSchemaValidator(allowEmptySchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('unique field option names validation', () => {
        const fieldOptionSchema = Type.Object({
            fieldOptions: Type.Array(
                Type.Object({
                    name: Type.String(),
                    value: Type.String(),
                }),
                { validateUniqueFieldOptionNames: true }
            ),
        });

        it('should validate unique field option names (case insensitive)', () => {
            const value = {
                fieldOptions: [
                    { name: 'Option 1', value: 'value1' },
                    { name: 'Option 2', value: 'value2' },
                    { name: 'Option 3', value: 'value3' },
                ],
            };

            const result = ajvSchemaValidator(fieldOptionSchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject duplicate field option names (case insensitive)', () => {
            const value = {
                fieldOptions: [
                    { name: 'Option 1', value: 'value1' },
                    { name: 'OPTION 1', value: 'value2' },
                    { name: 'Option 3', value: 'value3' },
                ],
            };

            const result = ajvSchemaValidator(fieldOptionSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Field options must have unique names (case insensitive)'),
                }),
            ]);
        });

        it('should handle empty array for validateUniqueFieldOptionNames', () => {
            const value = {
                fieldOptions: [],
            };

            const result = ajvSchemaValidator(fieldOptionSchema, value);
            expect(result.isValid).toBe(true);
        });
    });

    describe('field option orders validation', () => {
        const fieldOptionOrderSchema = Type.Object({
            fieldOptions: Type.Array(
                Type.Object({
                    order: Type.Number(),
                    name: Type.String(),
                }),
                { validateFieldOptionOrders: true }
            ),
        });

        it('should validate valid field option orders', () => {
            const value = {
                fieldOptions: [
                    { order: 1, name: 'Option 1' },
                    { order: 2, name: 'Option 2' },
                    { order: 3, name: 'Option 3' },
                ],
            };

            const result = ajvSchemaValidator(fieldOptionOrderSchema, value);
            expect(result.isValid).toBe(true);
        });

        it('should reject non-sequential orders', () => {
            const value = {
                fieldOptions: [
                    { order: 1, name: 'Option 1' },
                    { order: 3, name: 'Option 2' }, // Gap in sequence
                    { order: 4, name: 'Option 3' },
                ],
            };

            const result = ajvSchemaValidator(fieldOptionOrderSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Field option orders must be in sequence starting from 1'),
                }),
            ]);
        });

        it('should reject orders not starting from 1', () => {
            const value = {
                fieldOptions: [
                    { order: 2, name: 'Option 1' }, // Doesn't start with 1
                    { order: 3, name: 'Option 2' },
                    { order: 4, name: 'Option 3' },
                ],
            };

            const result = ajvSchemaValidator(fieldOptionOrderSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Field option orders must be in sequence starting from 1'),
                }),
            ]);
        });

        it('should reject out-of-order sequence', () => {
            const value = {
                fieldOptions: [
                    { order: 1, name: 'Option 1' },
                    { order: 3, name: 'Option 2' },
                    { order: 2, name: 'Option 3' }, // Out of order
                ],
            };

            const result = ajvSchemaValidator(fieldOptionOrderSchema, value);
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: expect.stringContaining('Field option orders must be in sequence starting from 1'),
                }),
            ]);
        });

        it('should handle empty array', () => {
            const value = {
                fieldOptions: [],
            };

            const result = ajvSchemaValidator(fieldOptionOrderSchema, value);
            expect(result.isValid).toBe(true);
        });
    });
});
