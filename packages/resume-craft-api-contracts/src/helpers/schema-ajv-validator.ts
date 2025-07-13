import { TSchema } from '@sinclair/typebox';
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import addErrors from 'ajv-errors';
import addFormats from 'ajv-formats';

import { formatAjvErrors } from './common-validations';

// Interface for time-based target validation
interface TimeTarget {
    resolveWithinUnit: 'months' | 'days' | 'hours' | 'minutes';
    resolveWithinValue: number;
    respondWithinUnit: 'months' | 'days' | 'hours' | 'minutes';
    respondWithinValue: number;
}

// Options for schema validation
interface ValidationOptions {
    strict?: boolean;
    debug?: boolean;
    customMessages?: Record<string, string>;
}

// Interface representing a validation error
interface ValidationError {
    field: string;
    message: string;
    path?: string[];
}

// Interface representing the result of schema validation
export interface ValidationResult {
    isValid: boolean;
    errors: Array<ValidationError> | null;
    rawErrors?: ErrorObject[];
}

/**
 * AJV instance configured with required features for schema validation
 * @remarks
 * - Collects all errors instead of stopping at first error
 * - Strict type checking without coercion
 * - Verbose error output for debugging
 * - Supports $data references for dynamic values
 * - Enables custom error messages
 */
const ajv = new Ajv({
    allErrors: true, // Return all errors, not just the first one
    coerceTypes: false, // Don't try to coerce value types
    strict: false, // Don't enforce strict mode
    verbose: true, // Enable verbose error output
    $data: true, // Enable $data references for dynamic values
    messages: true, // Enable custom error messages
});

addFormats(ajv);
addErrors(ajv);

// Custom AJV keyword for validating non-empty strings
ajv.addKeyword({
    keyword: 'isNotEmpty',
    type: 'string',
    validate: (schema: unknown, data: string) => {
        return data.trim().length > 0;
    },
    error: {
        message: 'should not be empty',
    },
});

// Custom AJV keyword for optional empty string validation
ajv.addKeyword({
    keyword: 'allowEmpty',
    type: 'string',
    validate: (schema: unknown, data: string) => {
        return true; // Always valid - allows empty strings
    },
});

// Add this helper function at the top level
const convertToMinutes = (value: number, unit: string): number => {
    switch (unit.toLowerCase()) {
        case 'months':
            return value * 30 * 24 * 60; // Approximate month as 30 days
        case 'days':
            return value * 24 * 60;
        case 'hours':
            return value * 60;
        case 'minutes':
            return value;
        default:
            return value;
    }
};

/**
 * Custom AJV keyword for validating time relationships in service level targets
 * @param schema - Unused schema parameter
 * @param data - Array of time targets to validate
 * @returns true if all resolution times are greater than response times
 */
ajv.addKeyword({
    keyword: 'validateTimeRelation',
    type: 'array',
    validate: function validate(schema: unknown, data: Array<TimeTarget>) {
        if (!Array.isArray(data) || !data.length) {
            return true;
        }
        return !data.some((target) => {
            const resolveMinutes = convertToMinutes(target.resolveWithinValue, target.resolveWithinUnit);
            const respondMinutes = convertToMinutes(target.respondWithinValue, target.respondWithinUnit);
            return resolveMinutes <= respondMinutes;
        });
    },
    error: {
        message: 'Resolution time must be strictly greater than response time for each severity level',
    },
});

/**
 * Custom AJV keyword for validating unique escalation orders
 * @param schema - Unused schema parameter
 * @param data - Array of objects containing escalation orders
 * @returns true if all escalation orders are unique
 */
ajv.addKeyword({
    keyword: 'validateUniqueEscalationOrders',
    type: 'array',
    validate: function validate(schema: unknown, data: Array<{ escalationOrder: number }>) {
        if (!Array.isArray(data) || !data.length) {
            return true;
        }
        const orders = data.map((item) => item.escalationOrder);
        return new Set(orders).size === orders.length;
    },
    error: {
        message: 'Escalation orders must be unique',
    },
});

/**
 * Custom AJV keyword for validating unique severity levels
 * @param schema - Unused schema parameter
 * @param data - Array of objects containing severity levels
 * @returns true if all severity levels are unique
 */
ajv.addKeyword({
    keyword: 'validateUniqueSeverityLevels',
    type: 'array',
    validate: function validate(schema: unknown, data: Array<{ severity: string }>) {
        if (!Array.isArray(data) || !data.length) {
            return true;
        }
        const severities = data.map((item) => item.severity);
        return new Set(severities).size === severities.length;
    },
    error: {
        message: 'Service level targets must have unique severity levels',
    },
});

/**
 * Custom AJV keyword for validating unique policy IDs
 * @param schema - Unused schema parameter
 * @param data - Array of objects containing policy IDs
 * @returns true if all policy IDs are unique
 */
ajv.addKeyword({
    keyword: 'validateUniquePolicyIds',
    type: 'array',
    validate: function validate(schema: unknown, data: Array<{ policyId: string }>) {
        if (!Array.isArray(data) || !data.length) {
            return true;
        }
        const policyIds = data.map((item) => item.policyId);
        return new Set(policyIds).size === policyIds.length;
    },
    error: {
        message: 'Policy IDs must be unique',
    },
});

/**
 * Custom AJV keyword for validating unique positions in ticket orders
 * @param schema - Unused schema parameter
 * @param data - Array of objects containing position values
 * @returns true if all positions are unique
 */
ajv.addKeyword({
    keyword: 'validateUniquePositions',
    type: 'array',
    validate: function validate(schema: unknown, data: Array<{ position: number }>) {
        if (!Array.isArray(data) || !data.length) {
            return true;
        }
        const positions = data.map((item) => item.position);
        return new Set(positions).size === positions.length;
    },
    error: {
        message: 'Positions must be unique',
    },
});

/**
 * Custom AJV keyword for validating unique ticket IDs
 * @param schema - Unused schema parameter
 * @param data - Array of objects containing ticketId values
 * @returns true if all ticket IDs are unique
 */
ajv.addKeyword({
    keyword: 'validateUniqueTicketIds',
    type: 'array',
    validate: function validate(schema: unknown, data: Array<{ ticketId: string }>) {
        if (!Array.isArray(data) || !data.length) {
            return true;
        }
        const ticketIds = data.map((item) => item.ticketId);
        return new Set(ticketIds).size === ticketIds.length;
    },
    error: {
        message: 'Ticket IDs must be unique',
    },
});

// Custom AJV keyword for validating time range (start time before end time)
ajv.addKeyword({
    keyword: 'validateTimeRange',
    type: 'object',
    validate: function validate(schema: unknown, data: { startTime: string; endTime: string }) {
        if (!data.startTime || !data.endTime) {
            return true;
        }

        const [startHour, startMinute] = data.startTime.split(':').map(Number);
        const [endHour, endMinute] = data.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        return startMinutes < endMinutes;
    },
    error: {
        message: 'Start time must be before end time',
    },
});

// Custom AJV keyword for validating that a date is not in the past
ajv.addKeyword({
    keyword: 'validateFutureDate',
    type: 'string',
    validate: function validate(schema: unknown, data: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [month, day, year] = data.split('-').map(Number);
        const holidayDate = new Date(year, month - 1, day);
        holidayDate.setHours(0, 0, 0, 0);

        return holidayDate >= today;
    },
    error: {
        message: 'Holiday date cannot be in the past',
    },
});

/**
 * Custom AJV keyword for validating unique field option names
 */
ajv.addKeyword({
    keyword: 'validateUniqueFieldOptionNames',
    type: 'array',
    validate: function validate(schema: unknown, data: Array<{ name: string }>) {
        if (!Array.isArray(data) || !data.length) {
            return true;
        }

        // Check for unique names (case insensitive)
        const names = data.map((item) => item.name.toLowerCase());
        return new Set(names).size === names.length;
    },
    error: {
        message: 'Field options must have unique names (case insensitive)',
    },
});

/**
 * Custom AJV keyword for validating field option orders
 * - Ensures orders are in sequence 1,2,3... (no sorting)
 */
ajv.addKeyword({
    keyword: 'validateFieldOptionOrders',
    type: 'array',
    validate: function validate(schema: unknown, data: Array<{ order: number }>) {
        if (!Array.isArray(data) || !data.length) {
            return true;
        }

        const orders = data.map((item) => item.order);

        // Check if first order is 1
        if (orders[0] !== 1) {
            return false;
        }

        // Check if orders are in sequence without gaps
        return !orders.some((order, index) => index > 0 && order !== orders[index - 1] + 1);
    },
    error: {
        message: 'Field option orders must be in sequence starting from 1 (e.g., 1,2,3...)',
    },
});

/**
 * Validates data against a TypeBox schema using AJV
 * @param schema - TypeBox schema to validate against
 * @param value - Data to validate
 * @param options - Optional validation configuration
 * @returns Validation result containing status and any errors
 *
 * @example
 * ```typescript
 * const schema = Type.Object({
 *   name: Type.String(),
 *   age: Type.Number()
 * });
 *
 * const result = ajvSchemaValidator(schema, { name: "John", age: 30 });
 * if (result.isValid) {
 *   // Data is valid
 * } else {
 *   console.log(result.errors);
 * }
 * ```
 */
export const ajvSchemaValidator = <T extends TSchema>(
    schema: T,
    value: unknown,
    options?: ValidationOptions
): ValidationResult => {
    try {
        const validateFn: ValidateFunction = ajv.compile(schema);
        const isValid = validateFn(value);

        if (options?.customMessages && validateFn.errors) {
            validateFn.errors = validateFn.errors.map((error) => {
                const customMessage = options.customMessages[error.keyword];
                if (customMessage) {
                    return { ...error, message: customMessage };
                }
                return error;
            });
        }

        const formattedErrors = isValid || !validateFn.errors ? null : formatAjvErrors(validateFn.errors);
        return {
            isValid,
            errors: formattedErrors,
            ...(options?.debug && { rawErrors: validateFn.errors || null }),
        };
    } catch (error) {
        if (!process.env.TEST) {
            console.error('[CommsPlannerApiContract] Schema validation error:', error);
        }
        return {
            isValid: false,
            errors: [{ field: '_schema', message: 'Invalid schema configuration' }],
        };
    }
};
