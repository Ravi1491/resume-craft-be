import { Body, Controller, Get, HttpStatus, Inject, Injectable, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ResumeCraftRequest, LoggerFactory, ApiDocumentationDecorator } from '@resume/resume-craft-common';

import {
    ApiStatus,
    CreateUserReqOpenApiSchema,
    CreateUserRequestType,
    CreateUserRespOpenApiSchema,
    ErrorResponseOpenApiSchema,
    GetUserProfileSuccessRespOpenApiSchema,
} from '@resume/resume-craft-api-contracts';
import { CreateUserService } from './services';

@Controller('users')
@Injectable({ scope: Scope.REQUEST })
export class UserController {
    private readonly logger = LoggerFactory.getLogger(UserController.name);

    constructor(
        @Inject(REQUEST) private readonly request: ResumeCraftRequest,
        private readonly createUserService: CreateUserService
    ) {
        this.logger.debug(`${UserController.name} Initialized`);
    }

    @ApiDocumentationDecorator({
        apiName: 'GetUserList',
        tags: ['Users'],
        errorResponseSchema: ErrorResponseOpenApiSchema,
        apiResponses: [
            {
                status: HttpStatus.OK,
                schema: GetUserProfileSuccessRespOpenApiSchema,
                description: 'Success response',
            },
        ],
    })
    @Get()
    async listOfUsers() {
        const { context } = this.request;
        console.log('context', context);
        // TODO: Implement user list functionality
        return {
            status: ApiStatus.SUCCESS,
            result: {
                users: [],
            },
            message: 'User list fetched successfully.',
        };
    }

    @ApiDocumentationDecorator({
        apiName: 'CreateUser',
        tags: ['Users'],
        errorResponseSchema: ErrorResponseOpenApiSchema,
        apiBodySchema: CreateUserReqOpenApiSchema,
        apiResponses: [
            {
                status: HttpStatus.OK,
                schema: CreateUserRespOpenApiSchema,
                description: 'Success response',
            },
        ],
    })
    @Post()
    async createUser(@Body() createUserRequest: CreateUserRequestType) {
        const { context } = this.request;
        const result = await this.createUserService.createUser(context, createUserRequest);
        return {
            status: ApiStatus.SUCCESS,
            result: result.result,
            message: 'User created successfully.',
        };
    }
}
