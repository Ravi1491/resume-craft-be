import { generateUUIDV4 } from './uuid.helper';

describe('UUID Helper', () => {
    describe('generateUUIDV4', () => {
        it('should generate a valid UUID v4 string', () => {
            const uuid = generateUUIDV4();

            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            // where x is any hexadecimal digit and y is one of 8, 9, A, or B
            const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(uuid).toMatch(uuidV4Regex);
        });

        it('should generate unique UUIDs', () => {
            const uuid1 = generateUUIDV4();
            const uuid2 = generateUUIDV4();

            expect(uuid1).not.toEqual(uuid2);
        });

        it('should return a string of length 36', () => {
            const uuid = generateUUIDV4();

            expect(uuid).toHaveLength(36);
        });
    });
});
