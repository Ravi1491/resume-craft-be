import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type Primitive = string | number | boolean | null | undefined;
type ObjectType = { [key: string]: Primitive | Primitive[] | ObjectType | ObjectType[] };

@Injectable()
export class TrimMiddleware implements NestMiddleware {
    private isString(value: unknown): value is string {
        return typeof value === 'string';
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    private isArray(value: unknown): value is unknown[] {
        return Array.isArray(value);
    }

    private trimString(value: string): string {
        return value.trim();
    }

    private trimDeep<T>(data: T): T {
        if (this.isString(data)) {
            return this.trimString(data) as T;
        }

        if (this.isArray(data)) {
            return data.map((item) => this.trimDeep(item)) as T;
        }

        if (this.isObject(data)) {
            return Object.entries(data).reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: this.trimDeep(value),
                }),
                {}
            ) as T;
        }

        return data;
    }

    use(req: Request, _res: Response, next: NextFunction): void {
        if (req.body) {
            req.body = this.trimDeep(req.body);
        }

        if (req.query) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            req.query = this.trimDeep(req.query as Record<string, any>);
        }

        if (req.params) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            req.params = this.trimDeep(req.params as Record<string, any>);
        }

        next();
    }
}
