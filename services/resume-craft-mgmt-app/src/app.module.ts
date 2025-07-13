import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { RequestContextMiddleware, ODMModule } from '@resume/resume-craft-common';

import { UserModule } from './modules';

@Module({
    imports: [TerminusModule, ODMModule, UserModule],
})
export class AppModule implements NestModule, OnModuleInit {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestContextMiddleware).forRoutes('*');
    }

    onModuleInit() {
        console.log('onModuleInit: MgmtApp');
    }

    async beforeApplicationShutdown(signal?: string) {
        console.log(`Received ${signal} signal. Gracefully shutting down the server.`);

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const connectionsCount: number = await new Promise((resolve, reject) => {
                this.httpAdapterHost.httpAdapter.getHttpServer().getConnections((err: Error | null, count: number) => {
                    if (err) {
                        console.error(`Error getting the server connections: ${JSON.stringify(err)}`);
                        return reject(err);
                    }
                    return resolve(count);
                });
            });

            console.log(`There are ${connectionsCount} open connections`);
            if (connectionsCount === 0) {
                break;
            }

            console.log(`Waiting 5 seconds more to close them.`);
            await new Promise((resolve) => {
                setTimeout(resolve, 5000);
            });
        }
    }
}
