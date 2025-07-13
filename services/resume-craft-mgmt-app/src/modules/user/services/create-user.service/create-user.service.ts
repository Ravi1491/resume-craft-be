import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';

import { CreateUserRequestType, CreateUserResponseType } from '@resume/resume-craft-api-contracts';
import {
    DbService,
    ErrorCode,
    generateUUIDV4,
    LoggerFactory,
    RequestContext,
    ResumeCraftException,
    UserDbService,
} from '@resume/resume-craft-common';

@Injectable()
export class CreateUserService {
    private readonly logger = LoggerFactory.getLogger(CreateUserService.name);

    constructor(
        private readonly userDbService: UserDbService,
        private readonly dbService: DbService
    ) {
        this.logger.debug(`${CreateUserService.name} Initialized`);
    }

    async createUser(
        context: RequestContext,
        createRequest: CreateUserRequestType
    ): Promise<Pick<CreateUserResponseType, 'result'>> {
        try {
            return await this.dbService.withManualTransaction(async (session: ClientSession) => {
                const userData = await this._buildUserData(context, createRequest);
                const user = await this.userDbService.create(context, userData, session);

                return {
                    result: {
                        userId: user.userId,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        profileImageUrl: user.profileImageUrl,
                    },
                };
            });
        } catch (error) {
            this.logger.error({
                ref: `Error: while creating the user ${error.message}`,
                createRequest,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.UNEXPECTED_ERROR);
        }
    }

    private async _buildUserData(context: RequestContext, createRequest: CreateUserRequestType) {
        return {
            userId: generateUUIDV4(),
            name: createRequest.name,
            email: createRequest.email,
            phone: createRequest.phone,
            profileImageUrl: createRequest.profileImageUrl,
        };
    }
}
