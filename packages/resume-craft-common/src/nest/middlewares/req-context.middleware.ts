import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

import { ApiOperation, HEADER_VALUES, HEADERS, SERVER_TIMING_KEYS } from '../../constants';
import { RequestContext, ParsedQs, ResumeCraftRequest, ResumeCraftResponse } from '../../types';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    setReqContext(req: ResumeCraftRequest, res: ResumeCraftResponse): RequestContext {
        return {
            userId: req.headers[HEADERS.USER_ID] as string,
            host: req.headers[HEADERS.HOST] as string,
            feHost: req.headers[HEADERS.FE_HOST] as string,
            url: req.url,
            reqHeaders: req.headers,
            params: req.params || {},
            queryParam: (req.query as ParsedQs) || {},
            correlationId: req.headers[HEADERS.CORRELATION_ID] as string,
            operation: req.method.toLowerCase() === 'get' ? ApiOperation.READ : ApiOperation.WRITE,
            serverTiming: {
                startTime: res.startTime,
                endTime: res.endTime,
                setMetric: res.setMetric,
            },
        };
    }

    async use(req: ResumeCraftRequest, res: ResumeCraftResponse, next: NextFunction) {
        res?.startTime?.(SERVER_TIMING_KEYS.REQ_CONTEXT_BUILD.name, SERVER_TIMING_KEYS.REQ_CONTEXT_BUILD.description);
        const nextWrapper = (...args) => {
            res?.endTime?.(SERVER_TIMING_KEYS.REQ_CONTEXT_BUILD.name);
            next(...args);
        };

        res.set(HEADERS.ACA_ORIGIN, req.headers.origin);
        res.set(HEADERS.ACA_CREDENTIALS, 'true');
        res.set(HEADERS.X_XSS_PROTECTION, HEADER_VALUES[HEADERS.X_XSS_PROTECTION]);
        res.set(HEADERS.X_FRAME_OPTIONS, HEADER_VALUES[HEADERS.X_FRAME_OPTIONS]);
        res.set(HEADERS.STRICT_TRANSPORT_SECURITY, HEADER_VALUES[HEADERS.STRICT_TRANSPORT_SECURITY]);
        res.set(HEADERS.REFERRER_POLICY, HEADER_VALUES[HEADERS.REFERRER_POLICY]);
        res.set(HEADERS.CACHE_CONTROL, HEADER_VALUES[HEADERS.CACHE_CONTROL]);
        res.set(HEADERS.X_CONTENT_TYPE_OPTIONS, HEADER_VALUES[HEADERS.X_CONTENT_TYPE_OPTIONS]);

        req.context = this.setReqContext(req, res);
        nextWrapper();
    }
}
