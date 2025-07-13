import { Static, TSchema, Type } from '@sinclair/typebox';
import { ErrorObject } from 'ajv';

export enum DescriptionType {
    Summary = 'summary', // Short descriptions like titles
    Detailed = 'detailed', // Full descriptions like ticket details
    Comment = 'comment', // User comments/replies
    Note = 'note', // Internal notes
    Label = 'label', // Very short descriptions like labels
}

export const DescriptionLimits: Record<DescriptionType, { min: number; max: number }> = {
    [DescriptionType.Summary]: { min: 2, max: 255 },
    [DescriptionType.Detailed]: { min: 2, max: 3000 },
    [DescriptionType.Comment]: { min: 2, max: 1000 },
    [DescriptionType.Note]: { min: 2, max: 500 },
    [DescriptionType.Label]: { min: 2, max: 50 },
} as const;

/**
 * Common validation utilities for API contracts
 * @module CommonValidations
 *
 * @see {@link https://github.com/sinclairzx81/typebox|TypeBox} - Type Builder
 * @see {@link https://ajv.js.org/json-schema.html|Ajv Schema Validation}
 * @see {@link https://json-schema.org/understanding-json-schema/|JSON Schema}
 *
 * @example Basic Usage
 * ```typescript
 * import { CommonValidations } from './common-validations';
 *
 * const schema = Type.Object({
 *   id: CommonValidations.uuid(),
 *   email: CommonValidations.email(),
 *   phone: CommonValidations.phone()
 * });
 * ```
 */
export const CommonValidations = {
    /**
     * Validates UUID format
     * @example
     * // Basic UUID validation
     * const idField = CommonValidations.uuid()
     *
     * // UUID with custom messages
     * const userId = CommonValidations.uuid({
     *   errorMessages: {
     *     type: 'User ID must be text',
     *     format: 'Please provide a valid user ID'
     *   }
     * })
     */
    uuid: (options?: { required?: boolean; errorMessages?: { type?: string; format?: string } }) =>
        Type.String({
            format: 'uuid',
            errorMessage: {
                type: options?.errorMessages?.type || 'Please enter a valid ID',
                format: options?.errorMessages?.format || 'Must be a valid UUID',
            },
        }),

    /**
     * Validates that two fields have different values
     * @example
     * // Example 1: Basic different values validation
     * const schema = Type.Object({
     *   field1: Type.String(),
     *   field2: Type.String()
     * }, {
     *   allOf: [
     *     CommonValidations.differentValues('field1', 'field2', {
     *       errorMessage: 'Field1 and Field2 must have different values'
     *     })
     *   ]
     * })
     *
     * // Example 2: With custom error message
     * const schema = Type.Object({
     *   startDate: Type.String(),
     *   endDate: Type.String()
     * }, {
     *   allOf: [
     *     CommonValidations.differentValues('startDate', 'endDate', {
     *       errorMessage: 'Start date and end date cannot be the same'
     *     })
     *   ]
     * })
     */
    differentValues: (
        field1: string,
        field2: string,
        options?: {
            errorMessage?: string;
        }
    ) => ({
        if: {
            type: 'object',
            properties: {
                [field1]: { type: 'string' },
                [field2]: { type: 'string' },
            },
            required: [field1, field2],
        },
        then: {
            not: {
                properties: {
                    [field1]: { const: { $data: `1/${field2}` } },
                },
            },
        },
        errorMessage: options?.errorMessage || `${field1} and ${field2} must have different values`,
    }),

    /**
     * Validates email format
     * @example
     * // Basic email validation
     * const emailField = CommonValidations.email()
     *
     * // Email with custom error messages
     * const userEmail = CommonValidations.email({
     *   errorMessages: {
     *     type: 'Email must be text',
     *     format: 'Please enter a valid email address'
     *   }
     * })
     */
    email: (options?: { required?: boolean; errorMessages?: { type?: string; format?: string } }) =>
        Type.String({
            format: 'email',
            errorMessage: {
                type: options?.errorMessages?.type || 'Please enter an email address',
                format: options?.errorMessages?.format || 'Must be a valid email address',
            },
        }),

    /**
     * Validates phone number format
     * @example
     * // Basic phone validation
     * const phoneField = CommonValidations.phone()
     *
     * // Phone with custom messages
     * const contactPhone = CommonValidations.phone({
     *   errorMessages: {
     *     type: 'Phone must be text',
     *     pattern: 'Please enter a valid phone number (e.g., 123-456-7890)'
     *   }
     * })
     */
    phone: (options?: { required?: boolean; errorMessages?: { type?: string; pattern?: string } }) =>
        Type.String({
            pattern: '^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$',
            errorMessage: {
                type: options?.errorMessages?.type || 'Please enter a phone number',
                pattern: options?.errorMessages?.pattern || 'Must be a valid phone number',
            },
        }),

    /**
     * Validates name with configurable length and allowed characters
     * @example
     * // Basic name validation (2-50 chars)
     * const nameField = CommonValidations.name()
     *
     * // Custom length and messages
     * const userName = CommonValidations.name({
     *   min: 3,
     *   max: 100,
     *   errorMessages: {
     *     pattern: 'Name can only contain letters, numbers',
     *     minLength: 'Name is too short',
     *     maxLength: 'Name is too long'
     *   }
     * })
     */
    name: (options?: {
        min?: number;
        max?: number;
        errorMessages?: {
            type?: string;
            pattern?: string;
            minLength?: string;
            maxLength?: string;
        };
    }) =>
        Type.String({
            type: 'string',
            pattern: options?.errorMessages?.pattern ? '^[a-zA-Z0-9-_ ]+$' : undefined,
            minLength: options?.min || 2,
            maxLength: options?.max || 50,
            errorMessage: {
                type: options?.errorMessages?.type || 'Please enter a name',
                minLength: options?.errorMessages?.minLength || `Name must be at least ${options?.min || 2} characters`,
                maxLength: options?.errorMessages?.maxLength || `Name cannot exceed ${options?.max || 50} characters`,
                ...(options?.errorMessages?.pattern && {
                    pattern: options.errorMessages.pattern,
                }),
            },
        }),

    /**
     * Validates array of UUIDs with min/max items
     * @example
     * // Basic UUID array
     * const idList = CommonValidations.uuidArray()
     *
     * // UUID array with limits and custom messages
     * const selectedUsers = CommonValidations.uuidArray({
     *   minItems: 1,s
     *   maxItems: 5,
     *   errorMessages: {
     *     minItems: 'Please select at least one user',
     *     maxItems: 'You can only select up to 5 users',
     *     items: 'Invalid user ID selected'
     *   }
     * })
     */
    uuidArray: (options?: {
        minItems?: number;
        maxItems?: number;
        errorMessages?: {
            type?: string;
            items?: string;
            minItems?: string;
            maxItems?: string;
        };
    }) =>
        Type.Array(
            Type.String({
                format: 'uuid',
                errorMessage: {
                    type: 'Please enter a valid ID',
                    format: options?.errorMessages?.items || 'Please enter a valid ID in UUID format',
                },
            }),
            {
                minItems: options?.minItems,
                maxItems: options?.maxItems,
                errorMessage: {
                    type: options?.errorMessages?.type || 'Please provide a list of IDs',
                    minItems: options?.errorMessages?.minItems || `Must select at least ${options?.minItems} items`,
                    maxItems: options?.errorMessages?.maxItems || `Cannot select more than ${options?.maxItems} items`,
                },
            }
        ),

    /**
     * Validates array of objects with custom schema
     * @example
     * // Example 1: Order items validation
     * const orderItemSchema = Type.Object({
     *   productId: CommonValidations.uuid(),
     *   quantity: Type.Number({ minimum: 1 }),
     *   price: Type.Number({ minimum: 0 })
     * })
     * const orderItems = CommonValidations.objectArray(orderItemSchema, {
     *   minItems: 1,
     *   maxItems: 10,
     *   errorMessages: {
     *     minItems: 'Order must contain at least one item',
     *     maxItems: 'Order cannot exceed 10 items'
     *   },
     *   message: 'Total order value cannot exceed 1000'
     * })
     */
    objectArray: <T extends TSchema>(
        schema: T,
        options?: {
            minItems?: number;
            maxItems?: number;
            errorMessages?: {
                type?: string;
                items?: string;
                minItems?: string;
                maxItems?: string;
            };
            validate?: (items: Array<Static<T>>) => boolean;
            message?: string;
        }
    ) => {
        try {
            const arraySchema = Type.Array(schema, {
                minItems: options?.minItems,
                maxItems: options?.maxItems,
                errorMessage: {
                    type: options?.errorMessages?.type || 'Must be an array',
                    minItems: options?.errorMessages?.minItems || `Must have at least ${options?.minItems} items`,
                    maxItems: options?.errorMessages?.maxItems || `Cannot exceed ${options?.maxItems} items`,
                },
            });

            if (options?.validate) {
                return Type.Transform(arraySchema)
                    .Decode((value) => {
                        if (Array.isArray(value) && options.validate) {
                            const isValid = options.validate(value);
                            if (!isValid) {
                                throw new Error(options.message || 'Validation failed');
                            }
                        }
                        return value;
                    })
                    .Encode((value) => value);
            }

            return arraySchema;
        } catch (error) {
            console.error('[objectArray] Schema creation error:', error);
            throw error;
        }
    },

    /**
     * Creates conditional required validation based on field existence or value
     * @example
     * // Example 1: Required when field exists
     * const schema = Type.Object({
     *   workspaceId: Type.Optional(Type.String()),
     *   matchType: Type.Optional(Type.String())
     * }, {
     *   allOf: [
     *     CommonValidations.conditionalRequired(
     *       'matchType',
     *       { workspaceId: { exists: true } },
     *       'Match type is required when workspace ID is provided'
     *     )
     *   ]
     * })
     *
     * // Example 2: Required when field has specific value
     * const schema = Type.Object({
     *   policyType: Type.String(),
     *   serviceLevelTargets: Type.Optional(Type.Array(Type.Object({})))
     * }, {
     *   allOf: [
     *     CommonValidations.conditionalRequired(
     *       'serviceLevelTargets',
     *       { policyType: { const: 'sla' } },
     *       'Service level targets are required for SLA policies'
     *     )
     *   ]
     * })
     */
    conditionalRequired: (
        field: string,
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        conditions: Record<string, { const?: any; exists?: boolean; enum?: (string | number)[] }>,
        errorMessage?: string
    ) => ({
        if: {
            properties: Object.fromEntries(
                Object.entries(conditions).map(([key, value]) => [key, value.exists ? { type: 'string' } : value])
            ),
            required: Object.keys(conditions),
        },
        then: {
            required: [field],
        },
        errorMessage: {
            required: {
                [field]: errorMessage || `${field} is required when specified conditions are met`,
            },
        },
    }),

    /**
     * Validates enum values
     * @example
     * // Example 1: Simple ticket priority enum
     * enum TicketPriority {
     *   LOW = 'LOW',
     *   MEDIUM = 'MEDIUM',
     *   HIGH = 'HIGH'
     * }
     * const priorityField = CommonValidations.enumValue(TicketPriority, {
     *   errorMessages: {
     *     type: `Priority must be one of: ${Object.values(TicketPriority).join(', ')}`,
     *     enum: `Invalid priority level. Allowed values are: ${Object.values(TicketPriority).join(', ')}`
     *   }
     * })
     *
     * // Example 2: Enum with default value
     * enum Status {
     *   ACTIVE = 'ACTIVE',
     *   INACTIVE = 'INACTIVE'
     * }
     * const statusField = CommonValidations.enumValue(Status, {
     *   errorMessages: {
     *     type: `Status must be one of: ${Object.values(Status).join(', ')}`,
     *     enum: `Invalid status. Allowed values are: ${Object.values(Status).join(', ')}`
     *   },
     *   default: Status.ACTIVE
     * })
     */
    enumValue: <T extends { [key: string]: string }>(
        enumObj: T,
        options?: {
            errorMessages?: { type?: string; enum?: string };
            default?: T[keyof T];
        }
    ) => {
        const enumValues = Object.values(enumObj);
        const schema = Type.String({
            enum: enumValues,
            errorMessage: {
                type: `Must be one of: ${enumValues.join(', ')}`,
                enum: options?.errorMessages?.enum || `Must be one of: ${enumValues.join(', ')}`,
            },
        });

        return options?.default !== undefined ? Type.Optional(schema) : schema;
    },

    /**
     * Validates array of enum values
     * @example
     * const priorityField = CommonValidations.enumArray(TicketPriority, {
     *   errorMessages: {
     *     type: `Priority must be one of: ${Object.values(TicketPriority).join(', ')}`,
     *     enum: `Invalid priority level. Allowed values are: ${Object.values(TicketPriority).join(', ')}`
     *   }
     * })
     *
     * // Example 2: Enum with default value
     * const statusField = CommonValidations.enumArray(Status, {
     *   minItems: 1,
     *   maxItems: 5,
     *   errorMessages: {
     *     type: `Status must be one of: ${Object.values(Status).join(', ')}`,
     *     enum: `Invalid status. Allowed values are: ${Object.values(Status).join(', ')}`
     *   },
     *   default: Status.ACTIVE
     * })
     *
     */
    enumArray: <T extends { [key: string]: string }>(
        enumObj: T,
        options?: {
            minItems?: number;
            maxItems?: number;
            errorMessages?: { type?: string; enum?: string };
            default?: T[keyof T];
        }
    ) => {
        const enumValues = Object.values(enumObj);
        const schema = Type.Array(
            Type.String({
                enum: enumValues,
                errorMessage: {
                    type: `Must be one of: ${enumValues.join(', ')}`,
                    enum: options?.errorMessages?.enum || `Must be one of: ${enumValues.join(', ')}`,
                },
            }),
            {
                minItems: options?.minItems,
                maxItems: options?.maxItems,
            }
        );

        return options?.default !== undefined ? Type.Optional(schema) : schema;
    },

    /**
     * Validates date ranges
     * @example
     * const dateRange = CommonValidations.dateRange({
     *   minDate: '2023-01-01',
     *   maxDate: '2023-12-31',
     *   errorMessages: {
     *     minimum: 'Date cannot be before 2023',
     *     maximum: 'Date cannot be after 2023'
     *   }
     * })
     */
    dateRange: (options?: {
        minDate?: string;
        maxDate?: string;
        errorMessages?: {
            type?: string;
            format?: string;
            minimum?: string;
            maximum?: string;
        };
        default?: string;
    }) =>
        Type.String({
            pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
            minLength: 10,
            maxLength: 10,
            errorMessage: {
                type: options?.errorMessages?.type || 'Must be a date',
                pattern: options?.errorMessages?.format || 'Date must be in YYYY-MM-DD format',
                minLength: 'Invalid date format',
                maxLength: 'Invalid date format',
            },
            default: options?.default,
        }),

    /**
     * Validates time ranges
     * @example
     * const timeRange = CommonValidations.timeRange({
     *   minTime: '09:00:00',
     *   maxTime: '17:00:00',
     *   errorMessages: {
     *     minimum: 'Time cannot be before 09:00',
     *     maximum: 'Time cannot be after 17:00'
     *   }
     * })
     */

    timeRange: (options?: {
        minTime?: string;
        maxTime?: string;
        errorMessages?: {
            type?: string;
            format?: string;
            minimum?: string;
            maximum?: string;
        };
    }) =>
        Type.String({
            pattern: '^([01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?$',
            formatMinimum: options?.minTime,
            formatMaximum: options?.maxTime,
            errorMessage: {
                type: options?.errorMessages?.type || 'Must be a time',
                pattern: options?.errorMessages?.format || 'Invalid time format (expected HH:mm or HH:mm:ss)',
                formatMinimum: options?.errorMessages?.minimum || 'Time is too early',
                formatMaximum: options?.errorMessages?.maximum || 'Time is too late',
            },
        }),

    /**
     * Validates description text with flexible length requirements
     * @example
     * // Example 1: Short description (e.g., ticket summary)
     * const summaryField = CommonValidations.description({
     *   type: DescriptionType.Summary,
     *   errorMessages: {
     *     minLength: 'Summary is too brief, please provide more details',
     *     maxLength: 'Summary is too long, please be more concise'
     *   }
     * })
     *
     * // Example 2: Detailed description (e.g., ticket details)
     * const detailsField = CommonValidations.description({
     *   type: DescriptionType.Detailed,
     *   allowHtml: true,
     *   errorMessages: {
     *     minLength: 'Please provide more detailed description',
     *     maxLength: 'Description is too long, consider adding attachments'
     *   }
     * })
     */
    description: (options?: {
        type?: DescriptionType;
        minLength?: number;
        maxLength?: number;
        allowHtml?: boolean;
        skipMaxLength?: boolean;
        errorMessages?: {
            type?: string;
            minLength?: string;
            maxLength?: string;
            pattern?: string;
        };
    }) => {
        const type = options?.type || DescriptionType.Detailed;
        const minLength = options?.minLength || DescriptionLimits[type].min;
        const maxLength = options?.skipMaxLength ? undefined : options?.maxLength || DescriptionLimits[type].max;
        const baseSchema = {
            minLength,
            ...(maxLength !== undefined && { maxLength }),
            pattern: options?.allowHtml ? undefined : '^[\\w\\s.,!?()"-]+$',
            errorMessage: {
                type: options?.errorMessages?.type || 'Description must be text',
                minLength: options?.errorMessages?.minLength || `Description must be at least ${minLength} characters`,
                ...(maxLength !== undefined && {
                    maxLength: options?.errorMessages?.maxLength || `Description cannot exceed ${maxLength} characters`,
                }),
                pattern: options?.errorMessages?.pattern || 'Description contains invalid characters',
            },
        };

        return Type.String(options?.allowHtml ? baseSchema : { ...baseSchema, pattern: undefined });
    },

    /**
     * Validates MIME type format
     * @example
     * // Basic MIME type validation
     * const mimeTypeField = CommonValidations.mimeType()
     *
     * // MIME type with custom messages
     * const fileMimeType = CommonValidations.mimeType({
     *   errorMessages: {
     *     type: 'MIME type must be text',
     *     pattern: 'Please enter a valid MIME type (e.g., image/jpeg, application/pdf)'
     *   }
     * })
     */
    mimeType: (options?: {
        required?: boolean;
        errorMessages?: {
            type?: string;
            pattern?: string;
            minLength?: string;
            maxLength?: string;
        };
    }) =>
        Type.String({
            pattern: "^[a-z0-9!#$%&'*+-.^_`|~]+/[a-z0-9!#$%&'*+-.^_`|~]+$",
            minLength: 2,
            maxLength: 127,
            errorMessage: {
                type: options?.errorMessages?.type || 'MIME type should not be empty.',
                pattern:
                    options?.errorMessages?.pattern ||
                    'Please enter a valid MIME type (e.g., image/jpeg, application/pdf)',
                minLength: options?.errorMessages?.minLength || 'MIME type must be at least 2 characters',
                maxLength: options?.errorMessages?.maxLength || 'MIME type cannot exceed 127 characters',
            },
        }),

    /**
     * Creates dependency chain validation for fields
     * @example
     * const schema = Type.Object({
     *   level1: Type.String(),
     *   level2: Type.String(),
     * }, {
     *   allOf: CommonValidations.dependencyChain([{
     *     field: 'level2',
     *     dependsOn: { level1: ['A', 'B'] },
     *     errorMessage: 'Level 2 requires Level 1 to be A or B'
     *   }])
     * })
     */
    dependencyChain: (
        dependencies: Array<{
            field: string;
            dependsOn: Record<string, string[] | '*'>;
            errorMessage?: string;
        }>
    ) => ({
        allOf: dependencies.map(({ field, dependsOn, errorMessage }) => ({
            if: {
                type: 'object',
                properties: Object.fromEntries(
                    Object.entries(dependsOn).map(([key, value]) => [
                        key,
                        value === '*' ? { type: 'string' } : { enum: value },
                    ])
                ),
                required: Object.keys(dependsOn),
            },
            then: {
                required: [field],
            },
            errorMessage: {
                required: {
                    [field]: errorMessage || `${field} is required based on dependencies`,
                },
            },
        })),
    }),

    /**
     * Validates version numbers and prevents conflicts
     * @example
     * const schema = CommonValidations.version({
     *   format: 'semver',
     *   errorMessages: {
     *     format: 'Invalid version format (use x.y.z)'
     *   }
     * })
     */
    version: (options?: { format?: 'semver' | 'integer'; errorMessages?: { type?: string; format?: string } }) =>
        Type.String({
            pattern: options?.format === 'semver' ? '^\\d+\\.\\d+\\.\\d+$' : '^\\d+$',
            errorMessage: {
                type: options?.errorMessages?.type || 'Version must be text',
                pattern: options?.errorMessages?.format || 'Invalid version format',
            },
        }),

    /**
     * Validates complex patterns with custom formats
     * @example
     * const ticketId = CommonValidations.pattern({
     *   pattern: '^TICKET-\\d{4}-\\w{2}$',
     *   example: 'TICKET-0001-AB',
     *   errorMessages: {
     *     pattern: 'Invalid ticket ID format'
     *   }
     * })
     */
    pattern: (options: { pattern: string; example: string; errorMessages?: { type?: string; pattern?: string } }) =>
        Type.String({
            pattern: options.pattern,
            errorMessage: {
                type: options?.errorMessages?.type || 'Must be text',
                pattern: options?.errorMessages?.pattern || `Invalid format (example: ${options.example})`,
            },
        }),

    /**
     * Validates arrays for unique values
     * @example
     * const tags = CommonValidations.uniqueArray({
     *   itemSchema: Type.String(),
     *   errorMessages: {
     *     unique: 'Duplicate tags are not allowed'
     *   }
     * })
     */
    uniqueArray: <T extends TSchema>(options: {
        itemSchema: T;
        minItems?: number;
        maxItems?: number;
        errorMessages?: {
            type?: string;
            items?: string;
            unique?: string;
            minItems?: string;
            maxItems?: string;
        };
    }) =>
        Type.Array(options.itemSchema, {
            uniqueItems: true,
            minItems: options.minItems,
            maxItems: options.maxItems,
            errorMessage: {
                uniqueItems: options.errorMessages?.unique || 'Duplicate values are not allowed',
                minItems: options.errorMessages?.minItems || `Must have at least ${options.minItems} items`,
                maxItems: options.errorMessages?.maxItems || `Cannot exceed ${options.maxItems} items`,
                type: options.errorMessages?.type || 'Must be an array',
            },
        }),

    /**
     * Validates search query strings with configurable options
     * @example
     * // Basic search validation
     * const searchField = CommonValidations.search()
     *
     * // Search with custom options
     * const advancedSearch = CommonValidations.search({
     *   minLength: 2,
     *   maxLength: 100,
     *   allowSpecialChars: true,
     *   errorMessages: {
     *     minLength: 'Search term must be at least 2 characters',
     *     maxLength: 'Search term cannot exceed 100 characters',
     *     pattern: 'Search contains invalid characters'
     *   }
     * })
     */
    search: (options?: {
        minLength?: number;
        maxLength?: number;
        allowSpecialChars?: boolean;
        errorMessages?: {
            type?: string;
            minLength?: string;
            maxLength?: string;
            pattern?: string;
        };
    }) =>
        Type.String({
            minLength: options?.minLength || 1,
            maxLength: options?.maxLength || 255,
            pattern: options?.allowSpecialChars ? undefined : '^[a-zA-Z0-9_\\s,!?*\\-]+$',
            errorMessage: {
                type: options?.errorMessages?.type || 'Please enter a search term',
                minLength:
                    options?.errorMessages?.minLength ||
                    `Search query must be at least ${options?.minLength || 1} characters`,
                maxLength:
                    options?.errorMessages?.maxLength ||
                    `Search query cannot exceed ${options?.maxLength || 255} characters`,
                pattern: options?.errorMessages?.pattern || 'Search query contains invalid characters',
            },
        }),

    /**
     * Makes a field optional but validates it when present
     * @example
     * // Optional email that must be valid if provided
     * const optionalEmail = CommonValidations.optional(
     *   CommonValidations.email()
     * )
     */
    optional: <T extends TSchema>(schema: T) => Type.Optional(schema),

    /**
     * Validates time duration format strings (e.g., '1h', '30m', '2h 30m', '1d')
     * @example
     * // Basic time format validation
     * const timeField = CommonValidations.durationFormat()
     *
     * // With custom error message
     * const estimateField = CommonValidations.durationFormat({
     *   errorMessages: {
     *     pattern: 'Please use valid duration format (e.g., 1h 30m, 2d, 45m)'
     *   }
     *   default: '2m'
     * })
     */
    durationFormat: (options?: {
        errorMessages?: {
            type?: string;
            pattern?: string;
        };
        default?: string;
    }) =>
        Type.String({
            pattern: '^(?!.*([wWdDhHmM]).*\\1)\\d+[wWdDhHmM](\\s*\\d+[wWdDhHmM])*$',
            errorMessage: {
                pattern:
                    options?.errorMessages?.pattern ||
                    'Please enter a valid duration (e.g., 1w 2d, 5h 30m). Use w (weeks), d (days), h (hours), m (minutes)',
            },
            default: options?.default || '2h',
        }),

    /**
     * Validates query parameter filters
     * @example
     * // Basic filter validation
     * const filterField = CommonValidations.queryFilter()
     *
     * // Custom filter validation
     * const advancedFilter = CommonValidations.queryFilter({
     *   allowedFields: ['status', 'priority', 'assignee'],
     *   allowedOperators: ['eq', 'gt', 'lt', 'in'],
     *   maxFilters: 5,
     *   errorMessages: {
     *     invalidField: 'Invalid filter field',
     *     invalidOperator: 'Invalid filter operator',
     *     invalidValue: 'Invalid filter value',
     *     maxFilters: 'Too many filters applied'
     *   }
     * })
     *
     * // Usage in query schema
     * const querySchema = Type.Object({
     *   filter: CommonValidations.queryFilter({
     *     allowedFields: ['status', 'createdAt'],
     *     allowedOperators: ['eq', 'gt', 'lt']
     *   })
     * })
     */
    queryFilter: (options?: {
        allowedFields?: string[];
        allowedOperators?: string[];
        maxFilters?: number;
        errorMessages?: {
            type?: string;
            invalidField?: string;
            invalidOperator?: string;
            invalidValue?: string;
            maxFilters?: string;
        };
    }) => {
        const defaultOperators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'like', 'between'];
        const operators = options?.allowedOperators || defaultOperators;

        return Type.Array(
            Type.Object({
                field: options?.allowedFields
                    ? Type.String({
                          enum: options.allowedFields,
                          errorMessage: {
                              enum:
                                  options?.errorMessages?.invalidField ||
                                  `Field must be one of: ${options.allowedFields.join(', ')}`,
                          },
                      })
                    : Type.String({
                          errorMessage: {
                              type: 'Filter field must be a string',
                          },
                      }),
                operator: Type.String({
                    enum: operators,
                    errorMessage: {
                        enum:
                            options?.errorMessages?.invalidOperator ||
                            `Operator must be one of: ${operators.join(', ')}`,
                    },
                }),
                value: Type.Union([
                    Type.String(),
                    Type.Number(),
                    Type.Boolean(),
                    Type.Array(Type.Union([Type.String(), Type.Number()])),
                    Type.Null(),
                ]),
            }),
            {
                maxItems: options?.maxFilters || 10,
                errorMessage: {
                    type: options?.errorMessages?.type || 'Filters must be an array',
                    maxItems:
                        options?.errorMessages?.maxFilters || `Cannot exceed ${options?.maxFilters || 10} filters`,
                },
            }
        );
    },

    /**
     * Validates custom field definitions
     * @example
     * const customFieldSchema = CommonValidations.customField({
     *   maxFields: 50,
     *   allowedTypes: ['text', 'number', 'select', 'date']
     * })
     */
    customField: (options?: {
        maxFields?: number;
        allowedTypes?: string[];
        errorMessages?: { type?: string; field?: string };
    }) => {
        const fieldTypes = options?.allowedTypes || ['text', 'number', 'select', 'multiselect', 'date', 'checkbox'];
        return Type.Array(
            Type.Object({
                name: Type.String({ minLength: 1, maxLength: 50 }),
                type: Type.String({ enum: fieldTypes }),
                required: Type.Optional(Type.Boolean()),
                options: Type.Optional(Type.Array(Type.String())),
                defaultValue: Type.Optional(
                    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Array(Type.String())])
                ),
            }),
            {
                maxItems: options?.maxFields || 50,
                errorMessage: {
                    maxItems: `Cannot exceed ${options?.maxFields || 50} custom fields`,
                },
            }
        );
    },

    /**
     * Validates array of strings with configurable length constraints
     * @example
     * // Basic string array validation
     * const tagsField = CommonValidations.stringArray()
     *
     * // String array with custom limits and messages
     * const keywords = CommonValidations.stringArray({
     *   minItems: 1,
     *   maxItems: 10,
     *   errorMessages: {
     *     type: 'Keywords must be an array of strings',
     *     items: 'Each keyword must be a string',
     *     minItems: 'Please provide at least one keyword',
     *     maxItems: 'Cannot have more than 10 keywords'
     *   }
     * })
     */
    stringArray: (options?: {
        minItems?: number;
        maxItems?: number;
        notAllowSpecialChars?: boolean;
        errorMessages?: {
            type?: string;
            items?: string;
            minItems?: string;
            maxItems?: string;
        };
    }) =>
        Type.Array(
            Type.String({
                isNotEmpty: true,
                pattern: options.notAllowSpecialChars ? undefined : '^[a-zA-Z0-9\\s_-]+$',
                errorMessage: {
                    type: options?.errorMessages?.type || 'Must be an array of strings',
                    isNotEmpty: options?.errorMessages?.items || 'Array items cannot be empty strings',
                    pattern:
                        options?.errorMessages?.items || 'Array items cannot contain special characters or be empty',
                },
            }),
            {
                minItems: options?.minItems,
                maxItems: options?.maxItems,
                errorMessage: {
                    type: options?.errorMessages?.type || 'Must be an array of strings',
                    minItems: options?.errorMessages?.minItems || `Must have at least ${options?.minItems} items`,
                    maxItems: options?.errorMessages?.maxItems || `Cannot exceed ${options?.maxItems} items`,
                },
            }
        ),

    /**
     * Validates URL format
     * @example
     * // Basic URL validation
     * const websiteField = CommonValidations.url()
     *
     * // URL with custom error messages
     * const linkField = CommonValidations.url({
     *   errorMessages: {
     *     type: 'Link must be a string',
     *     format: 'Please enter a valid website URL'
     *   }
     * })
     */
    url: (options?: {
        errorMessages?: {
            type?: string;
            format?: string;
        };
    }) =>
        Type.String({
            format: 'uri',
            errorMessage: {
                type: options?.errorMessages?.type || 'URL must be a string',
                format: options?.errorMessages?.format || 'Please enter a valid URL',
            },
        }),

    /**
     * Validates date format and optional range
     * @example
     * const dateField = CommonValidations.date({
     *   min: '2023-01-01',
     *   max: '2023-12-31'
     * })
     */
    date: (options?: {
        min?: string;
        max?: string;
        errorMessages?: {
            type?: string;
            format?: string;
            minimum?: string;
            maximum?: string;
        };
    }) =>
        Type.String({
            format: 'date',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            errorMessage: {
                type: options?.errorMessages?.type || 'Must be a string',
                format: options?.errorMessages?.format || 'Must be a valid date (YYYY-MM-DD)',
                pattern: options?.errorMessages?.format || 'Must be in YYYY-MM-DD format',
            },
        }),

    /**
     * Validates hex color format (e.g., #RRGGBB)
     * @example
     * // Basic hex color validation
     * const colorField = CommonValidations.hexColor()
     *
     * // Hex color with custom messages
     * const brandColor = CommonValidations.hexColor({
     *   errorMessages: {
     *     type: 'Color must be text',
     *     pattern: 'Must be a valid hex color code (e.g., #FF5733)'
     *   }
     * })
     */
    hexColor: (options?: { required?: boolean; errorMessages?: { type?: string; pattern?: string } }) =>
        Type.String({
            pattern: '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$',
            errorMessage: {
                type: options?.errorMessages?.type || 'Must be a string',
                pattern:
                    options?.errorMessages?.pattern ||
                    'Must be a valid hex color code (format: #RGB, #RRGGBB, or #RRGGBBAA)',
            },
        }),

    /**
     * Validates emoji characters
     * @example
     * // Basic emoji validation
     * const emojiField = CommonValidations.emoji()
     *
     * // Emoji with custom messages
     * const reactionEmoji = CommonValidations.emoji({
     *   errorMessages: {
     *     type: 'Reaction must be an emoji',
     *     pattern: 'Please provide a valid emoji'
     *   }
     * })
     */
    emoji: (options?: { errorMessages?: { type?: string; pattern?: string } }) =>
        Type.String({
            pattern:
                '^(?:\\p{Emoji}(?:\\p{Emoji_Modifier}|\\u200D\\p{Emoji}|\\uFE0F|[\\u{E0020}-\\u{E007F}])*|\\p{Regional_Indicator}\\p{Regional_Indicator})$',
            errorMessage: {
                type: options?.errorMessages?.type || 'Must be an emoji',
                pattern: options?.errorMessages?.pattern || 'Please provide a single valid emoji',
            },
        }),

    /**
     * Validates ownership filter format
     * @example
     * // Basic ownership validation
     * const ownershipField = CommonValidations.ownership()
     *
     * // Ownership with custom messages
     * const filterOwnership = CommonValidations.ownership({
     *   errorMessages: {
     *     type: 'Ownership must be a string',
     *     pattern: 'Invalid ownership format. Must be exactly one of: assigned:me, created:me, or created:<uuid>'
     *   }
     * })
     */
    ownership: (options?: { errorMessages?: { type?: string; pattern?: string } }) => {
        const ownershipTypes = ['assigned:me', 'created:me'];
        const pattern = `^(${ownershipTypes.join('|')}|created:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$`;

        return Type.String({
            pattern,
            errorMessage: {
                type: options?.errorMessages?.type || 'Ownership must be a string',
                pattern:
                    options?.errorMessages?.pattern ||
                    'Invalid ownership format. Must be exactly one of: assigned:me, created:me, or created:<uuid>',
            },
        });
    },

    /**
     * Validates Unix timestamp in string format (10-13 digits)
     * Supports both seconds (10 digits) and milliseconds (13 digits) timestamps
     *
     * @example
     * // Basic Unix timestamp validation (seconds)
     * const timestampField = CommonValidations.unixTimestamp()
     * // Valid values: "1678901234" (10 digits)
     *
     * // Unix timestamp in milliseconds
     * const millisTimestamp = CommonValidations.unixTimestamp()
     * // Valid values: "1678901234567" (13 digits)
     *
     * // With custom error messages
     * const startTime = CommonValidations.unixTimestamp({
     *   errorMessages: {
     *     type: 'Start time must be a valid timestamp',
     *     pattern: 'Please provide a valid Unix timestamp (10 digits for seconds or 13 digits for milliseconds)',
     *     minimum: 'Start time must be greater than 0'
     *   }
     * })
     *
     * // Invalid values:
     * // "0"              - Must be greater than 0
     * // "123456789"      - Too short (must be 10-13 digits)
     * // "12345678901234" - Too long (must be 10-13 digits)
     * // "123.456"        - Decimals not allowed
     * // "-1234567890"    - Negative not allowed
     * // "0123456789"     - Leading zeros not allowed
     */
    unixTimestamp: (options?: {
        errorMessages?: {
            type?: string;
            pattern?: string;
            minimum?: string;
        };
        min?: number;
    }) =>
        Type.String({
            pattern: '^[1-9]\\d{9,12}$',
            errorMessage: {
                type: options?.errorMessages?.type || 'Must be a valid timestamp',
                pattern:
                    options?.errorMessages?.pattern ||
                    'Must be a valid Unix timestamp (10 digits for seconds or 13 digits for milliseconds)',
                minimum: options?.errorMessages?.minimum || 'Timestamp must be greater than 0',
            },
        }),

    fieldDefinitionValidation: <T extends { [key: string]: string }>(options: {
        fieldTypeEnum: T;
        errorMessages?: {
            invalidFieldType?: string;
            invalidSelectedValue?: string;
        };
    }) => {
        return Type.Object(
            {
                customFieldDefinitionId: CommonValidations.uuid(),
                fieldType: CommonValidations.enumValue(options.fieldTypeEnum, {
                    errorMessages: {
                        type: options.errorMessages?.invalidFieldType || 'Field type must be a valid enum value',
                        enum: `Invalid field type. Must be one of: ${Object.values(options.fieldTypeEnum).join(', ')}`,
                    },
                }),
                selectedValue: Type.Optional(Type.Unknown()),
            },
            {
                allOf: [
                    // Conditional validation for label and dropdown fields
                    {
                        if: {
                            properties: {
                                fieldType: { enum: ['label'] },
                            },
                            required: ['fieldType'],
                        },
                        then: {
                            properties: {
                                selectedValue: Type.Array(Type.String(), {
                                    errorMessage: {
                                        type: 'Selected value for label fields must be an array of strings',
                                    },
                                }),
                            },
                            errorMessage: {
                                properties: {
                                    selectedValue: 'Selected value for label fields must be an array of strings',
                                },
                            },
                        },
                    },
                    {
                        if: {
                            properties: {
                                fieldType: { enum: ['dropdown'] },
                            },
                            required: ['fieldType'],
                        },
                        then: {
                            properties: {
                                selectedValue: Type.Array(Type.String(), {
                                    errorMessage: {
                                        type: 'Selected value for dropdown fields must be an array of strings',
                                    },
                                }),
                            },
                            errorMessage: {
                                properties: {
                                    selectedValue: 'Selected value for dropdown fields must be an array of strings',
                                },
                            },
                        },
                    },
                    // Conditional validation for text, textarea
                    {
                        if: {
                            properties: {
                                fieldType: { enum: ['text'] },
                            },
                            required: ['fieldType'],
                        },
                        then: {
                            properties: {
                                selectedValue: Type.String({
                                    errorMessage: {
                                        type: 'Selected value for text fields must be a string',
                                    },
                                }),
                            },
                            errorMessage: {
                                properties: {
                                    selectedValue: 'Selected value for text fields must be a string',
                                },
                            },
                        },
                    },
                    {
                        if: {
                            properties: {
                                fieldType: { enum: ['textarea'] },
                            },
                            required: ['fieldType'],
                        },
                        then: {
                            properties: {
                                selectedValue: Type.String({
                                    errorMessage: {
                                        type: 'Selected value for textarea fields must be a string',
                                    },
                                }),
                            },
                            errorMessage: {
                                properties: {
                                    selectedValue: 'Selected value for textarea fields must be a string',
                                },
                            },
                        },
                    },
                    // Conditional validation for date fields
                    {
                        if: {
                            properties: {
                                fieldType: { enum: ['date'] },
                            },
                            required: ['fieldType'],
                        },
                        then: {
                            properties: {
                                selectedValue: Type.Number({
                                    errorMessage: {
                                        type: 'Selected value for date fields must be a number',
                                    },
                                }),
                            },
                            errorMessage: {
                                properties: {
                                    selectedValue: 'Selected value for date fields must be a number',
                                },
                            },
                        },
                    },
                    // Conditional validation for number fields
                    {
                        if: {
                            properties: {
                                fieldType: { enum: ['number'] },
                            },
                            required: ['fieldType'],
                        },
                        then: {
                            properties: {
                                selectedValue: Type.Number({
                                    errorMessage: {
                                        type: 'Selected value for number fields must be a number',
                                    },
                                }),
                            },
                            errorMessage: {
                                properties: {
                                    selectedValue: 'Selected value for number fields must be a number',
                                },
                            },
                        },
                    },
                    // Conditional validation for files and people fields
                    {
                        if: {
                            properties: {
                                fieldType: { enum: ['files'] },
                            },
                            required: ['fieldType'],
                        },
                        then: {
                            properties: {
                                selectedValue: Type.Array(
                                    Type.String({
                                        format: 'uuid',
                                        errorMessage: {
                                            format: 'Selected value for files fields must be an array of UUIDs',
                                            type: 'Selected value for files fields must be an array of UUIDs',
                                        },
                                    }),
                                    {
                                        errorMessage: {
                                            type: 'Selected value for files fields must be an array of UUIDs',
                                        },
                                    }
                                ),
                            },
                            errorMessage: {
                                properties: {
                                    selectedValue: 'Selected value for files fields must be an array of UUIDs',
                                },
                            },
                        },
                    },
                    {
                        if: {
                            properties: {
                                fieldType: { enum: ['people'] },
                            },
                            required: ['fieldType'],
                        },
                        then: {
                            properties: {
                                selectedValue: Type.Array(
                                    Type.String({
                                        format: 'uuid',
                                        errorMessage: {
                                            format: 'Selected value for people fields must be an array of UUIDs',
                                            type: 'Selected value for people fields must be an array of UUIDs',
                                        },
                                    }),
                                    {
                                        errorMessage: {
                                            type: 'Selected value for people fields must be an array of UUIDs',
                                        },
                                    }
                                ),
                            },
                            errorMessage: {
                                properties: {
                                    selectedValue: 'Selected value for people fields must be an array of UUIDs',
                                },
                            },
                        },
                    },
                ],
            }
        );
    },
};

export const convertToMinutes = (value: number, unit: string): number => {
    switch (unit) {
        case 'hours':
            return value * 60;
        case 'days':
            return value * 24 * 60;
        default:
            return value;
    }
};

/**
 * Formats AJV validation errors into a more user-friendly structure
 *
 * @example
 * // Example 1: Basic validation errors
 * const errors = [{
 *   keyword: 'required',
 *   schemaPath: '#/required',
 *   params: { missingProperty: 'email' },
 *   message: 'must have required property email'
 * }];
 * const formatted = formatAjvErrors(errors);
 * // Result: [{
 *   field: 'email',
 *   message: "The field 'email' is required"
 * }]
 *
 * @example
 * // Example 2: Nested object validation
 * const errors = [{
 *   keyword: 'format',
 *   instancePath: '/user/email',
 *   schemaPath: '#/properties/user/properties/email/format',
 *   params: { format: 'email' },
 *   message: 'must match format "email"'
 * }];
 * const formatted = formatAjvErrors(errors);
 * // Result: [{
 *   field: 'user.email',
 *   message: 'Please enter a valid email address',
 *   path: ['user', 'email']
 * }]
 *
 * @example
 * // Example 3: Array validation
 * const errors = [{
 *   keyword: 'type',
 *   instancePath: '/items/0/quantity',
 *   schemaPath: '#/properties/items/items/properties/quantity/type',
 *   params: { type: 'number' },
 *   message: 'must be number'
 * }];
 * const formatted = formatAjvErrors(errors);
 * // Result: [{
 *   field: 'items[0].quantity',
 *   message: 'items[0].quantity must be a number',
 *   path: ['items', '0', 'quantity']
 * }]
 *
 * @example
 * // Example 4: Enum validation
 * const errors = [{
 *   keyword: 'enum',
 *   instancePath: '/status',
 *   schemaPath: '#/properties/status/enum',
 *   params: { allowedValues: ['active, inactive'] },
 *   message: 'must be equal to one of the allowed values'
 * }];
 * const formatted = formatAjvErrors(errors);
 * // Result: [{
 *   field: 'status',
 *   message: 'Must be one of: active, inactive',
 *   path: ['status']
 * }]
 */
export const formatAjvErrors = (errors: ErrorObject[] | null | undefined) => {
    if (!errors) return [];

    const errorMap = new Map<
        string,
        {
            field: string;
            message: string;
            priority: number;
            path?: string[];
        }
    >();

    const _formatArrayPath = (path?: string): string => {
        if (!path) return '';
        const parts = path.substring(1).split('/').filter(Boolean);
        return parts.reduce((result, part, index) => {
            if (/^\d+$/.test(part)) {
                return `${result}[${part}]`;
            }
            return result + (index === 0 ? part : `.${part}`);
        }, '');
    };

    const _getFieldFromPath = (path?: string): string => {
        if (!path) return '';
        if (path.includes('/') && /\d+/.test(path)) {
            return _formatArrayPath(path);
        }
        return path.substring(1).replace(/\//g, '.');
    };

    const _getFormatErrorMessage = (error: ErrorObject): string => {
        const format = error.params?.format;
        switch (format) {
            case 'email':
                return 'Please enter a valid email address';
            case 'date-time':
                return 'Please enter a valid date and time';
            case 'uuid':
                return 'Invalid ID format';
            default:
                return error.message || 'Invalid format';
        }
    };

    const _getTypeErrorMessage = (error: ErrorObject): string => {
        const expectedType = error.params?.type;
        const field = _getFieldFromPath(error.instancePath);

        if (error.parentSchema?.enum) {
            return `${field} must be one of: ${error.parentSchema.enum.join(', ')}`;
        }

        if (error.parentSchema?.errorMessage?.type) {
            return error.parentSchema.errorMessage.type;
        }

        return `${field} must be a ${expectedType}`;
    };

    const _getEnumErrorMessage = (error: ErrorObject): string => {
        const allowedValues = error.params?.allowedValues;
        return allowedValues ? `Must be one of: ${allowedValues.join(', ')}` : 'Invalid value selected';
    };

    errors.forEach((error) => {
        if (error.keyword === 'errorMessage' && error.params?.errors) {
            const nestedError = error.params.errors[0];
            if (nestedError.keyword === 'additionalProperties') {
                const field = nestedError.params?.additionalProperty || '';
                errorMap.set(field, {
                    field,
                    message:
                        nestedError.parentSchema.errorMessage.additionalProperties ||
                        `The property '${field}' is not allowed`,
                    priority: 2,
                });
                return;
            }
        }

        let field = '';
        let message: string;
        let priority = 1;
        let path: string[] | undefined;

        if (error.instancePath) {
            path = error.instancePath.split('/').filter(Boolean);
            field = path.join('.');
        }

        switch (error.keyword) {
            case 'required':
                field = error.params?.missingProperty || '';
                message = error.params?.errors?.[0]?.message || `The field '${field}' is required`;
                break;

            case 'format':
                field = _getFieldFromPath(error.instancePath);
                message = _getFormatErrorMessage(error);
                priority = 3;
                break;

            case 'type':
                field = _getFieldFromPath(error.instancePath);
                message = _getTypeErrorMessage(error);
                priority = 2;
                break;

            case 'enum':
                field = _getFieldFromPath(error.instancePath);
                message = _getEnumErrorMessage(error);
                priority = 2;
                break;

            case 'pattern':
                field = _getFieldFromPath(error.instancePath);
                message = error.parentSchema?.errorMessage?.pattern || 'Invalid format';
                priority = 2;
                break;

            case 'additionalProperties':
                field = error.params?.additionalProperty || '';
                message = `The property '${field}' is not allowed`;
                priority = 2;
                break;

            default:
                field = _getFieldFromPath(error.instancePath);
                message = error.message || 'Validation error';
                break;
        }

        const existing = errorMap.get(field);
        if (!existing || existing.priority < priority) {
            errorMap.set(field, { field, message, priority, path });
        }
    });

    return Array.from(errorMap.values())
        .filter((error) => {
            // Remove generic 'must match "then" schema' errors if a more specific child error exists
            if (
                error.message === 'must match "then" schema' &&
                error.field // e.g., listOfFieldDefinition[0]
            ) {
                // If any other error exists for a child of this field, filter this one out
                return !Array.from(errorMap.values()).some(
                    (e) =>
                        e !== error && // Don't compare with self
                        (e.field.startsWith(`${error.field}.`) || // direct child
                            (e.path &&
                                error.path &&
                                e.path.length > error.path.length &&
                                e.path.slice(0, error.path.length).join('.') === error.path.join('.')))
                );
            }
            return true;
        })
        .filter((error) => error.field || error.priority > 1)
        .sort((a, b) => b.priority - a.priority)
        .map(({ field, message, path }) => ({
            field,
            message,
            ...(path && { path }),
        }));
};
