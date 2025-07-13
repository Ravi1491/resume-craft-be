import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { ConfigurationModule } from '@resume/resume-craft-common';

import { buildMongoUri } from './dbops.helper';

@Module({
    imports: [ConfigurationModule],
})
class MigrationContextModule {}

export async function DbOpsBootstrapConfiguration(): Promise<void> {
    const app = await NestFactory.createApplicationContext(MigrationContextModule, {
        logger: false,
    });

    try {
        process.env.MONGODB_URI = buildMongoUri();

        console.info('MongoDB URI successfully set in environment variables.');
    } catch (error) {
        console.error({
            ref: `Error during bootstrap configuration: ${error.message}`,
            error,
        });
        process.exit(1);
    } finally {
        await app.close();
    }
}
