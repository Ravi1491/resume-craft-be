import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import responseTime from 'server-timing';

import { configureSwaggerWithTags } from '@resume/resume-craft-common';
import { AppModule } from './app.module';
import { API_BASE_PATH, PORT } from './constants/app.constant';

export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.setGlobalPrefix(API_BASE_PATH, {
        exclude: ['/', '/health', '/startUpProbe', '/livenessProbe', '/readinessProbe'],
    });

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    app.enableShutdownHooks();
    app.use(responseTime());

    // Generate Swagger documentation only in non-production environments unless explicitly enabled via ENABLE_SWAGGER=true
    const enableSwagger = process.env.NODE_ENV !== 'prod';
    console.log('NODE_ENV', process.env.NODE_ENV, enableSwagger);

    if (enableSwagger) {
        const apiDocUri = `${API_BASE_PATH}/docs/api`;
        const swaggerSetupOptions: SwaggerCustomOptions = {
            jsonDocumentUrl: `${apiDocUri}/json`,
            yamlDocumentUrl: `${apiDocUri}/yaml`,
        };

        const swaggerDocument = SwaggerModule.createDocument(
            app,
            configureSwaggerWithTags(
                new DocumentBuilder()
                    .setTitle('Resume Craft Mgmt Documentation')
                    .setDescription(
                        'This REST API provides a comprehensive set of endpoints for managing resume craft operations'
                    )
                    .setVersion('1.0')
            ).build(),
            {}
        );
        SwaggerModule.setup(apiDocUri, app, swaggerDocument, swaggerSetupOptions);
    }

    await app.listen(PORT);
    console.log(`App started successfully at port: ${PORT}`);
}
bootstrap();
