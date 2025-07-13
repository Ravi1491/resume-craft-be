import { Document, Query } from 'mongoose';

import { DEFAULT_PAGE_SIZE } from '../../constants';
import { QueryParams } from '../../types';
import { buildQuery } from './query-builder.helper';

describe('buildQuery', () => {
    let queryMock: Query<unknown, Document>;

    beforeEach(() => {
        queryMock = {
            select: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
        } as unknown as Query<unknown, Document>;
    });

    it('should build a query with provided queryParams when includeAllAttributes is false', () => {
        const queryParams = {
            includeAllAttributes: false,
            includedAttributes: ['field1', 'field2'],
            excludedAttributes: ['field3'],
            sortBy: [{ field: 'field1', order: 'asc' }],
            resultsPerPage: 10,
            pageNumber: 1,
            offset: { field: 'field1', value: 5, operator: 'gt' },
        };

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>);

        expect(builtQuery.select).toHaveBeenCalledWith({
            field1: 1,
            field2: 1,
            field3: -1,
        });
        expect(builtQuery.sort).toHaveBeenCalledWith([['field1', 'asc']]);
        expect(builtQuery.where).toHaveBeenCalledWith('field1');
        expect(builtQuery.skip).not.toHaveBeenCalled();
        expect(builtQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should build a query with provided queryParams when includeAllAttributes is true', () => {
        const queryParams = {
            includeAllAttributes: true,
            sortBy: [{ field: 'field1', order: 'asc' }],
            resultsPerPage: 10,
            pageNumber: 1,
            offset: { field: 'field1', value: 5, operator: 'gt' },
        };

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>);

        expect(builtQuery.select).not.toHaveBeenCalled();
        expect(builtQuery.sort).toHaveBeenCalledWith([['field1', 'asc']]);
        expect(builtQuery.where).toHaveBeenCalledWith('field1');
        expect(builtQuery.skip).not.toHaveBeenCalled();
        expect(builtQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should build a query with provided queryParams when offset is not defined', () => {
        const queryParams = {
            includeAllAttributes: false,
            includedAttributes: ['field1', 'field2'],
            excludedAttributes: ['field3'],
            sortBy: [{ field: 'field1', order: 'asc' }],
            resultsPerPage: 10,
            pageNumber: 1,
        };

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>);

        expect(builtQuery.select).toHaveBeenCalledWith({
            field1: 1,
            field2: 1,
            field3: -1,
        });
        expect(builtQuery.sort).toHaveBeenCalledWith([['field1', 'asc']]);
        expect(builtQuery.where).not.toHaveBeenCalled();
        expect(builtQuery.skip).toHaveBeenCalledWith(10);
        expect(builtQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should build a query with provided queryParams when resultsPerPage is not defined', () => {
        const queryParams = {
            includeAllAttributes: false,
            includedAttributes: ['field1', 'field2'],
            excludedAttributes: ['field3'],
            sortBy: [{ field: 'field1', order: 'asc' }],
            pageNumber: 1,
            offset: { field: 'field1', value: 5, operator: 'gt' },
        };

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>);

        expect(builtQuery.select).toHaveBeenCalledWith({
            field1: 1,
            field2: 1,
            field3: -1,
        });
        expect(builtQuery.sort).toHaveBeenCalledWith([['field1', 'asc']]);
        expect(builtQuery.where).toHaveBeenCalledWith('field1');
        expect(builtQuery.skip).not.toHaveBeenCalled();
        expect(builtQuery.limit).toHaveBeenCalledWith(DEFAULT_PAGE_SIZE);
    });

    it('should build a query with provided queryParams when pageNumber is 0', () => {
        const queryParams = {
            includeAllAttributes: false,
            includedAttributes: ['field1', 'field2'],
            excludedAttributes: ['field3'],
            sortBy: [{ field: 'field1', order: 'asc' }],
            resultsPerPage: 10,
            pageNumber: 0,
            offset: { field: 'field1', value: 5, operator: 'gt' },
        };

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>);

        expect(builtQuery.select).toHaveBeenCalledWith({
            field1: 1,
            field2: 1,
            field3: -1,
        });
        expect(builtQuery.sort).toHaveBeenCalledWith([['field1', 'asc']]);
        expect(builtQuery.where).toHaveBeenCalledWith('field1');
        expect(builtQuery.skip).not.toHaveBeenCalled();
        expect(builtQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should build a query with provided queryParams when sortBy is not defined', () => {
        const queryParams = {
            includeAllAttributes: false,
            includedAttributes: ['field1', 'field2'],
            excludedAttributes: ['field3'],
            resultsPerPage: 10,
            pageNumber: 1,
            offset: { field: 'field1', value: 5, operator: 'gt' },
        };

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>);

        expect(builtQuery.select).toHaveBeenCalledWith({
            field1: 1,
            field2: 1,
            field3: -1,
        });
        expect(builtQuery.sort).not.toHaveBeenCalled();
        expect(builtQuery.where).toHaveBeenCalledWith('field1');
        expect(builtQuery.skip).not.toHaveBeenCalled();
        expect(builtQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should build a query with provided queryParams when offset is defined without pageNumber', () => {
        const queryParams = {
            includeAllAttributes: false,
            includedAttributes: ['field1', 'field2'],
            excludedAttributes: ['field3'],
            sortBy: [{ field: 'field1', order: 'asc' }],
            resultsPerPage: 10,
            offset: { field: 'field1', value: 5, operator: 'gt' },
        };

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>);

        expect(builtQuery.select).toHaveBeenCalledWith({
            field1: 1,
            field2: 1,
            field3: -1,
        });
        expect(builtQuery.sort).toHaveBeenCalledWith([['field1', 'asc']]);
        expect(builtQuery.where).toHaveBeenCalledWith('field1');
        expect(builtQuery.skip).not.toHaveBeenCalled();
        expect(builtQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should build a query with provided queryParams when offset is defined without pageNumber and resultsPerPage', () => {
        const queryParams = {
            includeAllAttributes: false,
            includedAttributes: ['field1', 'field2'],
            excludedAttributes: ['field3'],
            sortBy: [{ field: 'field1', order: 'asc' }],
            offset: { field: 'field1', value: 5, operator: 'gt' },
        };

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>);

        expect(builtQuery.select).toHaveBeenCalledWith({
            field1: 1,
            field2: 1,
            field3: -1,
        });
        expect(builtQuery.sort).toHaveBeenCalledWith([['field1', 'asc']]);
        expect(builtQuery.where).toHaveBeenCalledWith('field1');
        expect(builtQuery.skip).not.toHaveBeenCalled();
        expect(builtQuery.limit).toHaveBeenCalledWith(40);
    });

    it('should build the query correctly when populate params is provided', () => {
        const queryParams = {
            includeAllAttributes: false,
            includedAttributes: ['field1', 'field2'],
            excludedAttributes: ['field3'],
            sortBy: [{ field: 'field1', order: 'asc' }],
            offset: { field: 'field1', value: 5, operator: 'gt' },
        };

        const populateParams = [
            {
                path: 'WorkspaceTemplate',
                model: 'WorkspaceTemplate',
                select: `Id`,
            },
        ];

        const builtQuery = buildQuery(queryMock as any, queryParams as QueryParams<any, any>, populateParams);

        expect(builtQuery.populate).toHaveBeenCalledWith([
            {
                model: 'WorkspaceTemplate',
                path: 'WorkspaceTemplate',
                select: 'Id',
            },
        ]);
        expect(builtQuery.lean).toHaveBeenCalled();
    });
});
