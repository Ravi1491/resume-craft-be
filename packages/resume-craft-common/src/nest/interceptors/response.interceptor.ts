import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiMetadataKeys } from '../../constants';

export interface Response<T> {
    status: string;
    result: T;
    message: string;
    responseTimeStamp: number;
    delay: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
    constructor(private readonly reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        const httpContext = context.switchToHttp();
        const req = httpContext.getRequest();

        const apiName = this.reflector.get<string>(ApiMetadataKeys.API_NAME, context.getHandler());
        if (req.context) {
            req.context[ApiMetadataKeys.API_NAME] = apiName || '';
        }

        return next.handle().pipe(
            map((res: { status: string; message: string; result: T }) => ({
                apiName,
                status: res.status,
                message: res.message || '',
                result: res.result,
                responseTimeStamp: Date.now(),
                delay: 0,
            }))
        );
    }
}
