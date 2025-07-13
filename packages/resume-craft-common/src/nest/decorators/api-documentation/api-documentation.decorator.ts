import { applyDecorators, HttpStatus, SetMetadata } from '@nestjs/common';
import {
    ApiBody,
    ApiBodyOptions,
    ApiHeaderOptions,
    ApiHeaders,
    ApiParam,
    ApiParamOptions,
    ApiQuery,
    ApiQueryOptions,
    ApiResponse,
    ApiTags,
    DocumentBuilder,
} from '@nestjs/swagger';
import { TObject } from '@sinclair/typebox';

import { ApiMetadataKeys, REQUIRED_HEADERS_LIST } from '../../../constants';

/**
 * Generate flattened query param decorators from TypeBox schema
 */
function generateApiQueryFromTypeBox(schema: TObject): MethodDecorator[] {
    const properties = schema.properties || {};
    const requiredProps = schema.required || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.entries(properties).map(([key, value]: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const param: any = {
            name: key,
            required: requiredProps.includes(key),
            description: value.description ?? '',
        };

        if (value.type === 'array') {
            param.isArray = true;
            param.type = value.items?.type ?? 'string';
            if (value.items?.enum) param.enum = value.items.enum;
        } else {
            param.type = value.type ?? 'string';
            if (value.enum) param.enum = value.enum;
        }

        return ApiQuery(param);
    });
}

export type ApiDocumentationOptions = {
    apiName: string;
    isHeadersRequired?: boolean;
    description?: string;
    tags?: string[];
    apiBodySchema?: object;
    apiQuerySchema?: object;
    apiParamSchema?: object;
    apiRequestHeadersOptions?: ApiHeaderOptions[];
    errorResponseSchema: object;
    apiResponses: {
        status: HttpStatus;
        schema: object;
        description: string;
    }[];
};

export class SwaggerTagsStore {
    private static tags = new Map<string, string>();

    static addTag(tag: string, description?: string) {
        this.tags.set(tag, description || `API endpoints for ${tag.toLowerCase()} management`);
    }

    static getAllTags() {
        return Array.from(this.tags.entries())
            .sort(([a], [b]) => {
                if (a === 'Health Probe') return -1;
                if (b === 'Health Probe') return 1;
                return a.localeCompare(b);
            })
            .map(([name, description]) => ({
                name,
                description,
            }));
    }

    static clear() {
        this.tags.clear();
    }
}

export const ApiControllerTags = (tag: string, description?: string) => {
    SwaggerTagsStore.addTag(tag, description);
    return ApiTags(tag);
};

export const ApiDocumentationDecorator = (options: ApiDocumentationOptions) => {
    const {
        apiName,
        isHeadersRequired = true,
        description = '',
        tags = [],
        apiBodySchema = null,
        apiQuerySchema = null,
        apiParamSchema = null,
        apiRequestHeadersOptions = [],
        apiResponses,
        errorResponseSchema,
    } = options;

    const methodDecorators: MethodDecorator[] = [];
    const classDecorators: ClassDecorator[] = [];

    if (tags.length > 0) {
        tags.forEach((tag) => SwaggerTagsStore.addTag(tag));
        methodDecorators.push(ApiTags(...tags) as MethodDecorator);
    }

    classDecorators.push(SetMetadata(ApiMetadataKeys.API_NAME, apiName));
    if (description) {
        classDecorators.push(SetMetadata(ApiMetadataKeys.API_DESCRIPTION, description));
    }

    if (isHeadersRequired) {
        classDecorators.push(ApiHeaders([...REQUIRED_HEADERS_LIST, ...apiRequestHeadersOptions]));
    }

    if (apiBodySchema) {
        methodDecorators.push(ApiBody({ schema: apiBodySchema } as ApiBodyOptions));
    }

    // ✅ NEW: Flatten TypeBox query object
    if (apiQuerySchema) {
        const isTypeBoxObject =
            typeof apiQuerySchema === 'object' &&
            'properties' in apiQuerySchema &&
            typeof apiQuerySchema.properties === 'object';

        if (isTypeBoxObject) {
            const decorators = generateApiQueryFromTypeBox(apiQuerySchema as TObject);
            methodDecorators.push(...decorators);
        } else {
            methodDecorators.push(
                ApiQuery({
                    name: 'Query Params',
                    schema: apiQuerySchema,
                } as ApiQueryOptions)
            );
        }
    }

    if (apiParamSchema) {
        classDecorators.push(
            ApiParam({
                name: 'Path Params',
                schema: apiParamSchema,
            } as ApiParamOptions)
        );
    }

    apiResponses.forEach((apiResponse) => {
        classDecorators.push(ApiResponse(apiResponse));
    });

    classDecorators.push(
        ApiResponse({
            status: '4XX',
            schema: errorResponseSchema,
            description: 'Response if request is invalid or user is not authorized',
        }),
        ApiResponse({
            status: '5XX',
            schema: errorResponseSchema,
            description: 'Response if something goes wrong on the server side',
        })
    );

    return applyDecorators(...classDecorators, ...methodDecorators);
};

export const configureSwaggerWithTags = (builder: DocumentBuilder) => {
    const tags = SwaggerTagsStore.getAllTags();
    tags.forEach(({ name, description }) => {
        builder.addTag(name, `${description} all ${name.toLowerCase()} operations.`);
    });
    return builder;
};
