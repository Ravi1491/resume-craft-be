import { NextFunction, Request, Response } from 'express';

import { TrimMiddleware } from './trim.middleware';

describe('TrimMiddleware', () => {
    let middleware: TrimMiddleware;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        middleware = new TrimMiddleware();
        mockResponse = {};
        nextFunction = jest.fn();
    });

    it('should trim strings in request body', () => {
        mockRequest = {
            body: {
                name: '  John Doe  ',
                email: ' john@example.com ',
                nested: {
                    description: '  Some text  ',
                },
            },
        };

        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockRequest.body).toEqual({
            name: 'John Doe',
            email: 'john@example.com',
            nested: {
                description: 'Some text',
            },
        });
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should trim strings in arrays', () => {
        mockRequest = {
            body: {
                tags: ['  tag1  ', ' tag2', 'tag3  '],
                nested: {
                    items: [' item1 ', '  item2  '],
                },
            },
        };

        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockRequest.body).toEqual({
            tags: ['tag1', 'tag2', 'tag3'],
            nested: {
                items: ['item1', 'item2'],
            },
        });
    });

    it('should handle query parameters', () => {
        mockRequest = {
            query: {
                search: '  search term  ',
                filter: ' active ',
            },
        };

        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockRequest.query).toEqual({
            search: 'search term',
            filter: 'active',
        });
    });

    it('should handle route parameters', () => {
        mockRequest = {
            params: {
                id: '  123  ',
                slug: ' test-slug ',
            },
        };

        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockRequest.params).toEqual({
            id: '123',
            slug: 'test-slug',
        });
    });

    it('should preserve non-string values', () => {
        mockRequest = {
            body: {
                age: 25,
                active: true,
                score: null,
                undefined,
                nested: {
                    count: 0,
                    enabled: false,
                },
            },
        };

        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockRequest.body).toEqual({
            age: 25,
            active: true,
            score: null,
            undefined,
            nested: {
                count: 0,
                enabled: false,
            },
        });
    });

    it('should handle empty objects', () => {
        mockRequest = {
            body: {},
            query: {},
            params: {},
        };

        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockRequest.body).toEqual({});
        expect(mockRequest.query).toEqual({});
        expect(mockRequest.params).toEqual({});
    });

    it('should handle undefined request properties', () => {
        mockRequest = {};

        middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockRequest.body).toBeUndefined();
        expect(mockRequest.query).toBeUndefined();
        expect(mockRequest.params).toBeUndefined();
    });
});
