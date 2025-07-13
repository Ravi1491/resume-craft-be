import { BadRequestException, PipeTransform } from '@nestjs/common';
import { TSchema } from '@sinclair/typebox';

import { LoggerFactory } from '../../../logger';
import { ajvSchemaValidator } from '../../../schema-validator';

type PrimitiveValue = string | number | boolean | null | undefined;
type QueryParamArray = PrimitiveValue[];
type QueryParamObject = {
    [key: string]: PrimitiveValue | QueryParamArray | QueryParamObject;
};
type ValidatorResponse = {
    isValid: boolean;
    errors?: {
        field: string;
        message: string;
    }[];
};

/**
 * A NestJS pipe that transforms and validates query parameters according to a TypeBox schema.
 * It supports:
 * - Converting string values to their appropriate types (string, number, boolean, null, undefined)
 * - Parsing comma-separated values into arrays
 * - Handling nested objects using dot notation
 * - Validating the transformed values against a TypeBox schema
 */
export class QueryParamValidationPipe implements PipeTransform {
    private readonly logger = LoggerFactory.getLogger(QueryParamValidationPipe.name);

    constructor(private readonly schema: TSchema) {
        this.logger.debug(`${QueryParamValidationPipe.name} Initialized`);
    }

    /**
     * Converts a string value to its appropriate primitive type.
     * Handles:
     * - Boolean values ('true'/'false')
     * - Null values ('null')
     * - Undefined values ('undefined')
     * - Numbers (including decimals and negative numbers)
     * - JSON strings
     * - Regular strings
     *
     * @example
     * parseValue('true') => true
     * parseValue('false') => false
     * parseValue('null') => null
     * parseValue('undefined') => undefined
     * parseValue('42') => 42
     * parseValue('-3.14') => -3.14
     * parseValue('{"name":"John"}') => { name: 'John' }
     * parseValue('hello') => 'hello'
     */
    private parseValue(value: string): PrimitiveValue {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (value === 'undefined') return undefined;

        const num = Number(value);
        if (!Number.isNaN(num) && value !== '') return num;

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    /**
     * Sets a value in a nested object structure using dot notation.
     * Creates intermediate objects as needed.
     *
     * @example
     * // Input: {}, 'user.profile.name', 'John'
     * // Result: { user: { profile: { name: 'John' } } }
     *
     * // Input: {}, 'settings.theme.color', '#fff'
     * // Result: { settings: { theme: { color: '#fff' } } }
     *
     * // Input: { user: { age: 25 } }, 'user.name', 'John'
     * // Result: { user: { age: 25, name: 'John' } }
     */
    private setNestedValue(obj: QueryParamObject, path: string, value: PrimitiveValue | QueryParamArray): void {
        const keys = path.split('.');
        let current = obj;

        keys.slice(0, -1).forEach((key) => {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key] as QueryParamObject;
        });

        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
    }

    /**
     * Checks if a TypeBox schema represents an array type.
     *
     * @example
     * isArrayType(Type.Array(Type.String())) => true
     * isArrayType(Type.Object({})) => false
     * isArrayType(Type.String()) => false
     */
    private isArrayType(schema: TSchema): boolean {
        return schema.type === 'array';
    }

    /**
     * Retrieves the schema for a nested property using a path array.
     * Returns undefined if the path doesn't exist in the schema.
     *
     * @example
     * const schema = Type.Object({
     *   user: Type.Object({
     *     profile: Type.Object({
     *       name: Type.String()
     *     })
     *   })
     * });
     *
     * getPropertySchema(schema, ['user', 'profile', 'name'])
     * // Returns: Type.String()
     *
     * getPropertySchema(schema, ['user', 'age'])
     * // Returns: undefined
     */
    private getPropertySchema(schema: TSchema, path: string[]): TSchema | undefined {
        if (schema.type !== 'object') return undefined;

        return path.reduce((currentSchema, key) => {
            if (!currentSchema || currentSchema.type !== 'object') return undefined;
            const properties = currentSchema.properties as Record<string, TSchema>;
            return properties?.[key];
        }, schema);
    }

    /**
     * Parses a string value into an array based on the schema type.
     * Handles both single values and comma-separated strings.
     *
     * @example
     * // String array schema
     * const stringSchema = Type.Array(Type.String());
     * parseArrayValue('a,b,c', stringSchema) => ['a', 'b', 'c']
     * parseArrayValue('single', stringSchema) => ['single']
     *
     * // Number array schema
     * const numberSchema = Type.Array(Type.Number());
     * parseArrayValue('1,2,3', numberSchema) => [1, 2, 3]
     * parseArrayValue('42', numberSchema) => [42]
     *
     * // Boolean array schema
     * const booleanSchema = Type.Array(Type.Boolean());
     * parseArrayValue('true,false', booleanSchema) => [true, false]
     * parseArrayValue('true', booleanSchema) => [true]
     */
    private parseArrayValue(value: string | string[], schema: TSchema): PrimitiveValue[] {
        const items =
            typeof value === 'string' && value.includes(',')
                ? value.split(',').map((v) => v.trim())
                : [value as string];

        const itemType = schema.items;
        if (!itemType) {
            return items;
        }

        return itemType.type === 'string' ? items : items.map((v) => this.parseValue(v));
    }

    /**
     * Parses a single value based on whether it contains commas.
     * If it contains commas, splits it into an array.
     *
     * @example
     * parseSingleValue('hello') => 'hello'
     * parseSingleValue('42') => 42
     * parseSingleValue('true') => true
     * parseSingleValue('a,b,c') => ['a', 'b', 'c']
     * parseSingleValue('1,2,3') => [1, 2, 3]
     * parseSingleValue('true,false') => [true, false]
     */
    private parseSingleValue(value: string): PrimitiveValue | PrimitiveValue[] {
        return value.includes(',') ? value.split(',').map((v) => this.parseValue(v.trim())) : this.parseValue(value);
    }

    /**
     * Transforms query parameters into a structured object according to the schema.
     * Handles:
     * - Dot notation for nested objects
     * - Comma-separated values for arrays
     * - Type conversion based on schema
     * - Array conversion for schema-defined array types
     *
     * @example
     * const schema = Type.Object({
     *   name: Type.String(),
     *   age: Type.Number(),
     *   tags: Type.Array(Type.String()),
     *   user: Type.Object({
     *     profile: Type.Object({
     *       active: Type.Boolean()
     *     })
     *   })
     * });
     *
     * const input = {
     *   name: 'John',
     *   age: '25',
     *   tags: 'admin,user',
     *   'user.profile.active': 'true'
     * };
     *
     * parseQueryParams(input)
     * // Returns:
     * // {
     * //   name: 'John',
     * //   age: 25,
     * //   tags: ['admin', 'user'],
     * //   user: {
     * //     profile: {
     * //       active: true
     * //     }
     * //   }
     * // }
     */
    private parseQueryParams(value: Record<string, string>): QueryParamObject {
        const result: QueryParamObject = {};

        // First pass: Handle dot notation
        Object.entries(value).forEach(([key, val]) => {
            if (key.includes('.')) {
                this.setNestedValue(result, key, val);
            } else {
                result[key] = val;
            }
        });

        // Second pass: Transform values based on schema
        const parseAndTransform = (obj: QueryParamObject, path: string[] = []): QueryParamObject => {
            return Object.entries(obj).reduce((acc, [key, val]) => {
                const currentPath = [...path, key];
                const propertySchema = this.getPropertySchema(this.schema, currentPath);

                // Handle nested objects
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                    acc[key] = parseAndTransform(val, currentPath);
                    return acc;
                }

                // Handle array types
                if (propertySchema && this.isArrayType(propertySchema)) {
                    acc[key] = this.parseArrayValue(val as string, propertySchema);
                    return acc;
                }

                // Handle single values
                acc[key] = this.parseSingleValue(val as string);
                return acc;
            }, {} as QueryParamObject);
        };

        return parseAndTransform(result);
    }

    /**
     * Transforms and validates query parameters according to the provided schema.
     * Returns the transformed value if valid, or throws a BadRequestException if invalid.
     *
     * @example
     * const schema = Type.Object({
     *   name: Type.String(),
     *   age: Type.Number()
     * });
     *
     * const pipe = new QueryParamValidationPipe(schema);
     *
     * // Valid input
     * pipe.transform({ name: 'John', age: '25' })
     * // Returns: { name: 'John', age: 25 }
     *
     * // Invalid input
     * pipe.transform({ name: 'John', age: 'not-a-number' })
     * // Throws: BadRequestException
     */
    transform(value: Record<string, string>) {
        if (!value || typeof value !== 'object') {
            return value;
        }

        const parsedValue = this.parseQueryParams(value);
        let response: ValidatorResponse;

        try {
            response = ajvSchemaValidator(this.schema, parsedValue);
        } catch (error) {
            this.logger.error(error.toString());
            throw new BadRequestException('Query parameter validation failed');
        }

        if (!response.isValid) {
            this.logger.error({
                ref: 'Query parameter validation failed',
                error: response.errors,
            });
            throw new BadRequestException('Query parameter validation failed', {
                cause: response.errors,
            });
        }

        this.logger.debug('Query parameters validated');
        return parsedValue;
    }
}
