import { randomUUID } from 'crypto';

/**
 * Generates a UUID v4 string
 * @returns {string} A UUID v4 string
 */
export function generateUUIDV4(): string {
    return randomUUID();
}
