import { Injectable } from '@nestjs/common';

import { ErrorCode, ResumeCraftException } from '../exceptions';
import { LoggerFactory } from '../logger';
import { UserDbService, UserFields } from '../odm';
import { REQUEST_CONTEXT_DATA_TYPES, RequestContext } from '../types';

@Injectable()
export class DataFromContext {
    private readonly logger = LoggerFactory.getLogger('EnrichContext');

    constructor(private readonly userDbService: UserDbService) {
        this.logger.debug(`${DataFromContext.name}: initialize`);
    }

    protected async _enrichWithUserData(context: RequestContext) {
        const { userId } = context;
        context.user = await this.userDbService.findOne(context, {
            includedAttributes: [UserFields.UserId, UserFields.Name],
            condition: {
                userId,
            },
        });
        return context;
    }

    async get(context: RequestContext, data: { type: string }): Promise<RequestContext> {
        try {
            const { type } = data;
            const { user } = context;
            const enrichmentFunctions = {
                [REQUEST_CONTEXT_DATA_TYPES.USER]: async () => {
                    if (!user || Object.keys(user).length === 0) {
                        // eslint-disable-next-line no-param-reassign
                        context = await this._enrichWithUserData(context);
                    }
                },
            };

            if (enrichmentFunctions[type]) {
                await enrichmentFunctions[type]();
            }

            return context;
        } catch (error) {
            throw new ResumeCraftException(ErrorCode.UNEXPECTED_ERROR, {
                cause: error,
                details: {
                    data,
                },
            });
        }
    }
}
