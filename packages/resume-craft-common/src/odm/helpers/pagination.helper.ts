import { DEFAULT_PAGE_SIZE } from '../../constants';
import { encodeCursor } from './cursor.helper';

export interface CursorPaginationPayload {
    size?: string;
    nextPageToken?: string;
}

/**
 * Executes cursor-based pagination on a given fetch function.
 *
 * @template TPayload - The shape of the payload passed to the fetch function.
 * @template TEntity - The type of the entity being paginated.
 *
 * @param fetchFn - The data retrieval function that accepts payload and size, and returns a list of entities.
 * @param payload - The query or context object used to fetch paginated results.
 * @param cursorFields - Two keys from the entity used to create the cursor (e.g., ['name', 'id']).
 *
 * @returns An object containing the paginated list of items, the `nextPageToken` if more data exists, and the resolved `pageSize`.
 */
export async function paginateWithCursor<TPayload extends CursorPaginationPayload, TEntity>(
    fetchFn: (payload: TPayload, size: number) => Promise<TEntity[]>,
    payload: TPayload,
    cursorFields: [keyof TEntity, keyof TEntity]
): Promise<{
    items: TEntity[];
    nextPageToken: string | null;
    pageSize: number;
}> {
    const size = typeof payload.size === 'string' ? Number(payload.size) : DEFAULT_PAGE_SIZE;
    const pageSize = size + 1;

    const entities = await fetchFn(payload, pageSize);

    let nextPageToken: string | null = null;
    if (entities.length === pageSize) {
        entities.pop();
        const lastItem = entities[entities.length - 1];
        nextPageToken = buildCursorToken(lastItem, cursorFields[0], cursorFields[1]);
    }

    return {
        items: entities,
        pageSize: size,
        nextPageToken,
    };
}

/**
 * Builds a cursor token by encoding two field values from the given entity.
 *
 * @template TEntity - The shape of the entity.
 *
 * @param entity - The entity from which to extract cursor values.
 * @param key1 - The first field to use in the cursor.
 * @param key2 - The second field to use in the cursor.
 *
 * @throws If either value is null or undefined.
 *
 * @returns A base64-encoded cursor string.
 */
export function buildCursorToken<TEntity>(entity: TEntity, key1: keyof TEntity, key2: keyof TEntity): string {
    const value1 = entity[key1];
    const value2 = entity[key2];

    if (value1 === undefined || value1 === null) {
        throw new Error(`Missing value for cursor field: ${String(key1)}`);
    }

    if (value2 === undefined || value2 === null) {
        throw new Error(`Missing value for cursor field: ${String(key2)}`);
    }

    return encodeCursor(String(value1), String(value2));
}

/**
 * Interface for sort field configuration
 */
export interface SortFieldConfig {
    [key: string]: string;
}

export function getOptimizedSort(
    sortColumn: string,
    sortOrder: string,
    sortFieldMap: SortFieldConfig,
    defaultSortField: string = 'createdAt'
): Record<string, 1 | -1> {
    const sortField =
        sortColumn && sortFieldMap && sortFieldMap[sortColumn] ? sortFieldMap[sortColumn] : defaultSortField;
    const sortConfig: Record<string, 1 | -1> = {
        [sortField]: sortOrder === 'asc' ? 1 : -1,
    };

    if (sortField !== defaultSortField) {
        sortConfig[defaultSortField] = -1;
    }

    return sortConfig;
}
