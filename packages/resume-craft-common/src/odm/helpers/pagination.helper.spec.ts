import { DEFAULT_PAGE_SIZE } from '../../constants';
import { encodeCursor } from './cursor.helper';
import { buildCursorToken, paginateWithCursor, getOptimizedSort, SortFieldConfig } from './pagination.helper';

jest.mock('./cursor.helper', () => ({
    encodeCursor: jest.fn(),
}));

describe('pagination.helper', () => {
    describe('buildCursorToken', () => {
        it('should return cursor from two fields', () => {
            const entity = { name: 'TestName', id: '12345' };
            (encodeCursor as jest.Mock).mockReturnValue('encoded-cursor');

            const result = buildCursorToken(entity, 'name', 'id');
            expect(result).toBe('encoded-cursor');
            expect(encodeCursor).toHaveBeenCalledWith('TestName', '12345');
        });

        it('should throw if the first field is undefined', () => {
            const entity = { id: '12345' } as any;
            expect(() => buildCursorToken(entity, 'name', 'id')).toThrowError('Missing value for cursor field: name');
        });

        it('should throw if the second field is null', () => {
            const entity = { name: 'TestName', id: null } as any;
            expect(() => buildCursorToken(entity, 'name', 'id')).toThrowError('Missing value for cursor field: id');
        });
    });

    describe('paginateWithCursor', () => {
        type TestEntity = { name: string; id: string };
        type TestPayload = { size?: string; nextPageToken?: string };

        const mockEncodeCursor = encodeCursor as jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return all items without nextPageToken if result is under pageSize', async () => {
            const entities = [
                { name: 'A', id: '1' },
                { name: 'B', id: '2' },
            ];

            const fetchFn = jest.fn().mockResolvedValue(entities);
            const result = await paginateWithCursor(fetchFn, { size: '2' }, ['name', 'id']);

            expect(result.items).toEqual(entities);
            expect(result.nextPageToken).toBeNull();
            expect(result.pageSize).toBe(2);
            expect(fetchFn).toHaveBeenCalledWith({ size: '2' }, 3); // 2 + 1
        });

        it('should pop last item and return nextPageToken when items exceed pageSize', async () => {
            const entities = [
                { name: 'A', id: '1' },
                { name: 'B', id: '2' },
                { name: 'C', id: '3' },
            ];

            const fetchFn = jest.fn().mockResolvedValue([...entities]);
            mockEncodeCursor.mockReturnValue('cursor-token');

            const result = await paginateWithCursor(fetchFn, { size: '2' }, ['name', 'id']);

            expect(result.items).toEqual([
                { name: 'A', id: '1' },
                { name: 'B', id: '2' },
            ]);
            expect(result.nextPageToken).toBe('cursor-token');
            expect(result.pageSize).toBe(2);
            expect(mockEncodeCursor).toHaveBeenCalledWith('B', '2');
        });

        it('should fallback to DEFAULT_PAGE_SIZE when size is undefined', async () => {
            const fetchFn = jest.fn().mockResolvedValue([]);
            const result = await paginateWithCursor(fetchFn, {}, ['name', 'id']);

            expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
            expect(fetchFn).toHaveBeenCalledWith({}, DEFAULT_PAGE_SIZE + 1);
        });
    });

    describe('Integration Tests', () => {
        describe('pagination with cursor field consistency', () => {
            it('should maintain consistent pagination across multiple pages', async () => {
                // Mock data that simulates custom field definitions sorted by fieldName, then by id
                const mockData = [
                    {
                        fieldName: 'Field A',
                        customFieldDefinitionId: '11111111-1111-1111-1111-111111111111',
                        createdAt: Date.now(),
                    },
                    {
                        fieldName: 'Field B',
                        customFieldDefinitionId: '22222222-2222-2222-2222-222222222222',
                        createdAt: Date.now(),
                    },
                    {
                        fieldName: 'Field C',
                        customFieldDefinitionId: '33333333-3333-3333-3333-333333333333',
                        createdAt: Date.now(),
                    },
                    {
                        fieldName: 'Field D',
                        customFieldDefinitionId: '44444444-4444-4444-4444-444444444444',
                        createdAt: Date.now(),
                    },
                    {
                        fieldName: 'Field E',
                        customFieldDefinitionId: '55555555-5555-5555-5555-555555555555',
                        createdAt: Date.now(),
                    },
                ];

                // Mock fetchFn that simulates database query with pagination
                const mockFetchFn = jest.fn().mockImplementation((payload: any, size: number) => {
                    // Simulate sorting by fieldName, then by customFieldDefinitionId
                    let filteredData = [...mockData];

                    // Apply pagination filter if nextPageToken exists
                    if (payload.nextPageToken) {
                        // Parse the encoded token (format: "encoded|{name}|{id}")
                        const parts = payload.nextPageToken.split('|');
                        const name = parts[1];
                        const id = parts[2];
                        filteredData = mockData.filter((item) => {
                            // Filter to only include items that come after the cursor
                            if (item.fieldName > name) {
                                return true;
                            }
                            if (item.fieldName === name) {
                                return item.customFieldDefinitionId > id;
                            }
                            return false;
                        });
                    }

                    return Promise.resolve(filteredData.slice(0, size));
                });

                (encodeCursor as jest.Mock).mockImplementation((name: string, id: string) => {
                    return `encoded|${name}|${id}`;
                });

                // Test first page
                const firstPageResult = await paginateWithCursor(mockFetchFn, { size: '2' }, [
                    'fieldName',
                    'customFieldDefinitionId',
                ]);

                expect(firstPageResult.items).toHaveLength(2);
                expect(firstPageResult.items[0].fieldName).toBe('Field A');
                expect(firstPageResult.items[1].fieldName).toBe('Field B');
                expect(firstPageResult.nextPageToken).toBe('encoded|Field B|22222222-2222-2222-2222-222222222222');
                expect(firstPageResult.pageSize).toBe(2);

                // Test second page using cursor from first page
                const secondPageResult = await paginateWithCursor(
                    mockFetchFn,
                    {
                        size: '2',
                        nextPageToken: firstPageResult.nextPageToken,
                    },
                    ['fieldName', 'customFieldDefinitionId']
                );

                expect(secondPageResult.items).toHaveLength(2);
                expect(secondPageResult.items[0].fieldName).toBe('Field C');
                expect(secondPageResult.items[1].fieldName).toBe('Field D');
                expect(secondPageResult.nextPageToken).toBe('encoded|Field D|44444444-4444-4444-4444-444444444444');

                // Test third page
                const thirdPageResult = await paginateWithCursor(
                    mockFetchFn,
                    {
                        size: '2',
                        nextPageToken: secondPageResult.nextPageToken,
                    },
                    ['fieldName', 'customFieldDefinitionId']
                );

                expect(thirdPageResult.items).toHaveLength(1); // Only Field E left
                expect(thirdPageResult.items[0].fieldName).toBe('Field E');
                expect(thirdPageResult.nextPageToken).toBeNull(); // No more pages

                // Verify no overlap between pages
                const allItems = [...firstPageResult.items, ...secondPageResult.items, ...thirdPageResult.items];
                const uniqueIds = new Set(allItems.map((item) => item.customFieldDefinitionId));
                expect(uniqueIds.size).toBe(allItems.length); // All items should be unique
            });

            it('should handle duplicate field names correctly using ID as tie-breaker', async () => {
                // Mock data with duplicate field names
                const mockDataWithDuplicates = [
                    {
                        fieldName: 'Duplicate Field',
                        customFieldDefinitionId: '11111111-1111-1111-1111-111111111111',
                    },
                    {
                        fieldName: 'Duplicate Field',
                        customFieldDefinitionId: '22222222-2222-2222-2222-222222222222',
                    },
                    {
                        fieldName: 'Duplicate Field',
                        customFieldDefinitionId: '33333333-3333-3333-3333-333333333333',
                    },
                    {
                        fieldName: 'Other Field',
                        customFieldDefinitionId: '44444444-4444-4444-4444-444444444444',
                    },
                ];

                const mockFetchFn = jest.fn().mockImplementation((payload: any, size: number) => {
                    let filteredData = [...mockDataWithDuplicates];

                    if (payload.nextPageToken) {
                        // Parse the encoded token (format: "encoded|{name}|{id}")
                        const parts = payload.nextPageToken.split('|');
                        const name = parts[1];
                        const id = parts[2];
                        filteredData = mockDataWithDuplicates.filter((item) => {
                            // Filter to only include items that come after the cursor
                            if (item.fieldName > name) {
                                return true;
                            }
                            if (item.fieldName === name) {
                                return item.customFieldDefinitionId > id;
                            }
                            return false;
                        });
                    }

                    return Promise.resolve(filteredData.slice(0, size));
                });

                (encodeCursor as jest.Mock).mockImplementation((name: string, id: string) => {
                    return `encoded|${name}|${id}`;
                });

                // Test pagination with size 2
                const firstPageResult = await paginateWithCursor(mockFetchFn, { size: '2' }, [
                    'fieldName',
                    'customFieldDefinitionId',
                ]);

                expect(firstPageResult.items).toHaveLength(2);
                expect(firstPageResult.items[0].fieldName).toBe('Duplicate Field');
                expect(firstPageResult.items[0].customFieldDefinitionId).toBe('11111111-1111-1111-1111-111111111111');
                expect(firstPageResult.items[1].fieldName).toBe('Duplicate Field');
                expect(firstPageResult.items[1].customFieldDefinitionId).toBe('22222222-2222-2222-2222-222222222222');

                // Second page should start with the third duplicate field
                const secondPageResult = await paginateWithCursor(
                    mockFetchFn,
                    {
                        size: '2',
                        nextPageToken: firstPageResult.nextPageToken,
                    },
                    ['fieldName', 'customFieldDefinitionId']
                );

                expect(secondPageResult.items).toHaveLength(2);
                expect(secondPageResult.items[0].fieldName).toBe('Duplicate Field');
                expect(secondPageResult.items[0].customFieldDefinitionId).toBe('33333333-3333-3333-3333-333333333333');
                expect(secondPageResult.items[1].fieldName).toBe('Other Field');
                expect(secondPageResult.items[1].customFieldDefinitionId).toBe('44444444-4444-4444-4444-444444444444');
            });
        });

        describe('cursor field validation', () => {
            it('should throw error when cursor fields are missing from entity', async () => {
                const mockDataWithMissingFields = [
                    {
                        fieldName: 'Complete Field',
                        customFieldDefinitionId: '11111111-1111-1111-1111-111111111111',
                    },
                    { fieldName: 'Missing ID Field' }, // Missing customFieldDefinitionId
                    {
                        fieldName: 'Third Field',
                        customFieldDefinitionId: '33333333-3333-3333-3333-333333333333',
                    },
                ];

                const mockFetchFn = jest.fn().mockResolvedValue(mockDataWithMissingFields);

                // This should throw when trying to build cursor from entity with missing field
                // We request size 2 but return 3 items, so pagination will try to build cursor from the 2nd item (which has missing field)
                await expect(
                    paginateWithCursor(mockFetchFn, { size: '2' }, ['fieldName', 'customFieldDefinitionId'])
                ).rejects.toThrow('Missing value for cursor field: customFieldDefinitionId');
            });

            it('should throw error when cursor fields are null', async () => {
                const mockDataWithNullFields = [
                    {
                        fieldName: 'Complete Field',
                        customFieldDefinitionId: '11111111-1111-1111-1111-111111111111',
                    },
                    {
                        fieldName: null,
                        customFieldDefinitionId: '22222222-2222-2222-2222-222222222222',
                    },
                    {
                        fieldName: 'Third Field',
                        customFieldDefinitionId: '33333333-3333-3333-3333-333333333333',
                    },
                ];

                const mockFetchFn = jest.fn().mockResolvedValue(mockDataWithNullFields);

                // We request size 2 but return 3 items, so pagination will try to build cursor from the 2nd item (which has null field)
                await expect(
                    paginateWithCursor(mockFetchFn, { size: '2' }, ['fieldName', 'customFieldDefinitionId'])
                ).rejects.toThrow('Missing value for cursor field: fieldName');
            });
        });

        describe('edge cases and error handling', () => {
            it('should handle empty results gracefully', async () => {
                const mockFetchFn = jest.fn().mockResolvedValue([]);

                const result = await paginateWithCursor(mockFetchFn, { size: '10' }, [
                    'fieldName',
                    'customFieldDefinitionId',
                ]);

                expect(result.items).toEqual([]);
                expect(result.nextPageToken).toBeNull();
                expect(result.pageSize).toBe(10);
                expect(mockFetchFn).toHaveBeenCalledWith({ size: '10' }, 11); // size + 1
            });

            it('should handle exactly one page of results', async () => {
                const mockData = [
                    {
                        fieldName: 'Field A',
                        customFieldDefinitionId: '11111111-1111-1111-1111-111111111111',
                    },
                    {
                        fieldName: 'Field B',
                        customFieldDefinitionId: '22222222-2222-2222-2222-222222222222',
                    },
                ];

                const mockFetchFn = jest.fn().mockResolvedValue(mockData);

                const result = await paginateWithCursor(
                    mockFetchFn,
                    { size: '3' }, // Requesting more than available
                    ['fieldName', 'customFieldDefinitionId']
                );

                expect(result.items).toHaveLength(2);
                expect(result.nextPageToken).toBeNull(); // No next page
                expect(result.pageSize).toBe(3);
            });

            it('should handle single item pagination', async () => {
                const mockData = [
                    {
                        fieldName: 'Single Field',
                        customFieldDefinitionId: '11111111-1111-1111-1111-111111111111',
                    },
                ];

                const mockFetchFn = jest.fn().mockResolvedValue(mockData);

                const result = await paginateWithCursor(mockFetchFn, { size: '1' }, [
                    'fieldName',
                    'customFieldDefinitionId',
                ]);

                expect(result.items).toHaveLength(1);
                expect(result.nextPageToken).toBeNull();
                expect(result.pageSize).toBe(1);
            });
        });
    });

    describe('getOptimizedSort', () => {
        const mockSortFieldMap: SortFieldConfig = {
            Name: 'name',
            createdAt: 'createdAt',
            modifiedAt: 'modifiedAt',
            IsEnable: 'isEnable',
            createdBy: 'createdBy.name',
            Status: 'status',
            Priority: 'priority',
        };

        describe('valid sort column mapping', () => {
            it('should return correct sort config for valid column with asc order', () => {
                const result = getOptimizedSort('Name', 'asc', mockSortFieldMap);

                expect(result).toEqual({
                    name: 1,
                    createdAt: -1, // secondary sort
                });
            });

            it('should return correct sort config for valid column with desc order', () => {
                const result = getOptimizedSort('Name', 'desc', mockSortFieldMap);

                expect(result).toEqual({
                    name: -1,
                    createdAt: -1, // secondary sort
                });
            });

            it('should return correct sort config for createdAt column', () => {
                const result = getOptimizedSort('createdAt', 'asc', mockSortFieldMap);

                expect(result).toEqual({
                    createdAt: 1, // no secondary sort since it's the default field
                });
            });

            it('should return correct sort config for modifiedAt column with desc order', () => {
                const result = getOptimizedSort('modifiedAt', 'desc', mockSortFieldMap);

                expect(result).toEqual({
                    modifiedAt: -1,
                    createdAt: -1, // secondary sort
                });
            });

            it('should return correct sort config for nested field mapping', () => {
                const result = getOptimizedSort('createdBy', 'asc', mockSortFieldMap);

                expect(result).toEqual({
                    'createdBy.name': 1,
                    createdAt: -1, // secondary sort
                });
            });
        });

        describe('invalid sort column handling', () => {
            it('should fallback to default sort field for invalid column', () => {
                const result = getOptimizedSort('invalidColumn', 'asc', mockSortFieldMap);

                expect(result).toEqual({
                    createdAt: 1, // default field with requested order
                });
            });

            it('should fallback to default sort field for null column', () => {
                const result = getOptimizedSort(null as any, 'desc', mockSortFieldMap);

                expect(result).toEqual({
                    createdAt: -1, // default field with requested order
                });
            });

            it('should fallback to default sort field for undefined column', () => {
                const result = getOptimizedSort(undefined as any, 'asc', mockSortFieldMap);

                expect(result).toEqual({
                    createdAt: 1, // default field with requested order
                });
            });

            it('should fallback to default sort field for empty string column', () => {
                const result = getOptimizedSort('', 'desc', mockSortFieldMap);

                expect(result).toEqual({
                    createdAt: -1, // default field with requested order
                });
            });
        });

        describe('sort order handling', () => {
            it('should use ascending order for "asc" value', () => {
                const result = getOptimizedSort('Name', 'asc', mockSortFieldMap);

                expect(result.name).toBe(1);
            });

            it('should use descending order for "desc" value', () => {
                const result = getOptimizedSort('Name', 'desc', mockSortFieldMap);

                expect(result.name).toBe(-1);
            });

            it('should use descending order for any non-"asc" value', () => {
                const result = getOptimizedSort('Name', 'invalid', mockSortFieldMap);

                expect(result.name).toBe(-1);
            });

            it('should use descending order for null sort order', () => {
                const result = getOptimizedSort('Name', null as any, mockSortFieldMap);

                expect(result.name).toBe(-1);
            });

            it('should use descending order for undefined sort order', () => {
                const result = getOptimizedSort('Name', undefined as any, mockSortFieldMap);

                expect(result.name).toBe(-1);
            });

            it('should use descending order for empty string sort order', () => {
                const result = getOptimizedSort('Name', '', mockSortFieldMap);

                expect(result.name).toBe(-1);
            });
        });

        describe('custom default sort field', () => {
            it('should use custom default sort field when provided', () => {
                const result = getOptimizedSort('invalidColumn', 'asc', mockSortFieldMap, 'modifiedAt');

                expect(result).toEqual({
                    modifiedAt: 1,
                });
            });

            it('should use custom default as secondary sort when sorting by different field', () => {
                const result = getOptimizedSort('Name', 'desc', mockSortFieldMap, 'modifiedAt');

                expect(result).toEqual({
                    name: -1,
                    modifiedAt: -1, // custom default as secondary sort
                });
            });

            it('should not add secondary sort when sorting by custom default field', () => {
                const result = getOptimizedSort('Status', 'asc', mockSortFieldMap, 'status');

                expect(result).toEqual({
                    status: 1, // no secondary sort since it's the custom default
                });
            });
        });

        describe('empty sort field map handling', () => {
            it('should fallback to default field with empty sort field map', () => {
                const result = getOptimizedSort('anyColumn', 'asc', {});

                expect(result).toEqual({
                    createdAt: 1,
                });
            });

            it('should handle null sort field map', () => {
                const result = getOptimizedSort('anyColumn', 'desc', null as any);

                expect(result).toEqual({
                    createdAt: -1,
                });
            });
        });

        describe('edge cases', () => {
            it('should handle case where sort column exists but maps to empty string', () => {
                const edgeCaseMap = { EmptyField: '' };
                const result = getOptimizedSort('EmptyField', 'asc', edgeCaseMap);

                expect(result).toEqual({
                    createdAt: 1, // fallback to default since mapped value is falsy
                });
            });

            it('should handle case where sort column maps to the same as default field', () => {
                const sameAsDefaultMap = { CreatedAt: 'createdAt' };
                const result = getOptimizedSort('CreatedAt', 'desc', sameAsDefaultMap);

                expect(result).toEqual({
                    createdAt: -1, // no secondary sort since it's the same as default
                });
            });

            it('should handle multiple sort fields mapping to different values', () => {
                const complexMap = {
                    'user.name': 'user.fullName',
                    'user.email': 'user.emailAddress',
                    'date.created': 'timestamps.created',
                    'date.modified': 'timestamps.modified',
                };

                const result = getOptimizedSort('user.name', 'asc', complexMap, 'timestamps.created');

                expect(result).toEqual({
                    'user.fullName': 1,
                    'timestamps.created': -1, // custom default as secondary sort
                });
            });
        });

        describe('real-world use cases', () => {
            it('should match content-type service sort field mapping', () => {
                const contentTypeSortFieldMap = {
                    Name: 'name',
                    createdAt: 'createdAt',
                    modifiedAt: 'modifiedAt',
                    IsEnable: 'isEnable',
                    createdBy: 'createdBy.name',
                };

                // Test sorting by name
                const nameSort = getOptimizedSort('Name', 'asc', contentTypeSortFieldMap, 'createdAt');
                expect(nameSort).toEqual({
                    name: 1,
                    createdAt: -1,
                });

                // Test sorting by enable status
                const enableSort = getOptimizedSort('IsEnable', 'desc', contentTypeSortFieldMap, 'createdAt');
                expect(enableSort).toEqual({
                    isEnable: -1,
                    createdAt: -1,
                });

                // Test invalid column
                const invalidSort = getOptimizedSort('invalidColumn', 'asc', contentTypeSortFieldMap, 'createdAt');
                expect(invalidSort).toEqual({
                    createdAt: 1,
                });
            });

            it('should match campaign service sort field mapping', () => {
                const campaignSortFieldMap = {
                    Name: 'name',
                    Status: 'status',
                    Priority: 'priority',
                    StartAt: 'startAt',
                    LiveAt: 'liveAt',
                    createdAt: 'createdAt',
                    modifiedAt: 'modifiedAt',
                    createdBy: 'createdBy.name',
                };

                // Test sorting by priority
                const prioritySort = getOptimizedSort('Priority', 'desc', campaignSortFieldMap, 'createdAt');
                expect(prioritySort).toEqual({
                    priority: -1,
                    createdAt: -1,
                });

                // Test sorting by start date
                const startAtSort = getOptimizedSort('StartAt', 'asc', campaignSortFieldMap, 'createdAt');
                expect(startAtSort).toEqual({
                    startAt: 1,
                    createdAt: -1,
                });
            });
        });
    });
});
