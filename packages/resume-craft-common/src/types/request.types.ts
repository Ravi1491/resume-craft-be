import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';

import type { User } from '../odm';
import { ServerTimingService } from './response.types';

export interface ParsedQs {
    [key: string]: string | string[] | ParsedQs | ParsedQs[] | undefined;
}

export enum REQUEST_CONTEXT_DATA_TYPES {
    USER = 'user',
}

export type RequestContext = {
    hrtime?: [number, number];
    url?: string;
    reqHeaders?: IncomingHttpHeaders;
    params?: Record<string, string>;
    queryParam?: ParsedQs;
    userId?: string;
    userRole?: string;
    host?: string;
    feHost?: string;
    apiName?: string;
    user?: User;
    operation?: 'read' | 'write';
    correlationId?: string;
    remoteCacheVersion?: string;
    isReqCachingEnabled?: boolean;
    serverTiming?: ServerTimingService;
};

export type ResumeCraftRequest = Request & {
    context: RequestContext;
};
