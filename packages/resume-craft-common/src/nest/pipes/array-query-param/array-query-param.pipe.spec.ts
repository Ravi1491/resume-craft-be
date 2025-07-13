import { ArrayQueryParamPipe } from './array-query-param.pipe';

describe('ArrayQueryParamPipe', () => {
    let pipe: ArrayQueryParamPipe;

    describe('with single array field', () => {
        beforeEach(() => {
            pipe = new ArrayQueryParamPipe(['status']);
        });

        it('should be defined', () => {
            expect(pipe).toBeDefined();
        });

        it('should transform a single value to an array', () => {
            const query = { status: 'open' };
            const result = pipe.transform(query);

            expect(result).toEqual({ status: ['open'] });
        });

        it('should keep existing arrays as is', () => {
            const query = { status: ['open', 'pending'] };
            const result = pipe.transform(query);

            expect(result).toEqual({ status: ['open', 'pending'] });
        });

        it('should not modify non-array fields', () => {
            const query = { status: 'open', page: 1, limit: 10 };
            const result = pipe.transform(query);

            expect(result).toEqual({ status: ['open'], page: 1, limit: 10 });
        });

        it('should handle null values', () => {
            const query = { status: null };
            const result = pipe.transform(query);

            expect(result).toEqual({ status: [null] });
        });

        it('should handle undefined values', () => {
            const query = { status: undefined };
            const result = pipe.transform(query);

            expect(result).toEqual({ status: [undefined] });
        });

        it('should not modify fields that are not present', () => {
            const query = { page: 1 };
            const result = pipe.transform(query);

            expect(result).toEqual({ page: 1 });
        });
    });

    describe('with multiple array fields', () => {
        beforeEach(() => {
            pipe = new ArrayQueryParamPipe(['status', 'tags', 'categories']);
        });

        it('should transform multiple fields to arrays', () => {
            const query = {
                status: 'open',
                tags: 'important',
                categories: 'work',
            };
            const result = pipe.transform(query);

            expect(result).toEqual({
                status: ['open'],
                tags: ['important'],
                categories: ['work'],
            });
        });

        it('should handle a mix of single values and arrays', () => {
            const query = {
                status: 'open',
                tags: ['important', 'urgent'],
                categories: 'work',
            };
            const result = pipe.transform(query);

            expect(result).toEqual({
                status: ['open'],
                tags: ['important', 'urgent'],
                categories: ['work'],
            });
        });

        it('should handle when only some fields are present', () => {
            const query = {
                status: 'open',
                page: 1,
            };
            const result = pipe.transform(query);

            expect(result).toEqual({
                status: ['open'],
                page: 1,
            });
        });
    });

    describe('edge cases', () => {
        beforeEach(() => {
            pipe = new ArrayQueryParamPipe(['status']);
        });

        it('should handle empty objects', () => {
            const query = {};
            const result = pipe.transform(query);

            expect(result).toEqual({});
        });

        it('should return the value as is if it is not an object', () => {
            const nonObjectValue = 'not-an-object' as any;
            const result = pipe.transform(nonObjectValue);

            expect(result).toBe(nonObjectValue);
        });

        it('should handle null input', () => {
            const result = pipe.transform(null as any);

            expect(result).toBeNull();
        });

        it('should handle undefined input', () => {
            const result = pipe.transform(undefined as any);

            expect(result).toBeUndefined();
        });

        it('should handle numeric values', () => {
            const query = { status: 123 };
            const result = pipe.transform(query);

            expect(result).toEqual({ status: [123] });
        });

        it('should handle boolean values', () => {
            const query = { status: true };
            const result = pipe.transform(query);

            expect(result).toEqual({ status: [true] });
        });
    });
});
