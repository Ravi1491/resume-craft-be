import { PipeTransform, Injectable } from '@nestjs/common';

import { LoggerFactory } from '../../../logger';

/**
 * A pipe that transforms query parameters to handle arrays properly.
 * This pipe ensures that query parameters that should be arrays are properly
 * converted to arrays, even if they are passed as single values.
 *
 * Example:
 * - ?status=open&status=pending -> { status: ['open', 'pending'] }
 * - ?status=open -> { status: ['open'] }
 */
@Injectable()
export class ArrayQueryParamPipe implements PipeTransform {
    private readonly logger = LoggerFactory.getLogger(ArrayQueryParamPipe.name);
    private readonly arrayFields: string[];

    /**
     * Creates a new instance of ArrayQueryParamPipe.
     * @param arrayFields - An array of field names that should be treated as arrays
     */
    constructor(arrayFields: string[]) {
        this.arrayFields = arrayFields;
        this.logger.debug(`${ArrayQueryParamPipe.name} initialized with array fields: ${arrayFields.join(', ')}`);
    }

    /**
     * Transforms the query parameters to ensure array fields are properly handled.
     * @param value - The query parameters object
     * @returns The transformed query parameters
     */
    transform(value: Record<string, unknown>): Record<string, unknown> {
        if (!value || typeof value !== 'object') {
            return value;
        }

        const result = { ...value };

        // Process each array field using array iteration instead of a for loop
        this.arrayFields.forEach((field) => {
            if (field in result) {
                // If the field exists but is not an array, convert it to an array
                if (!Array.isArray(result[field])) {
                    result[field] = [result[field]];
                }
            }
        });

        this.logger.debug('Query parameters transformed');
        return result;
    }
}
