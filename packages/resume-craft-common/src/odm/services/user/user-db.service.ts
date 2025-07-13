import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument, UserFields, UserFieldsQueryConditionType } from '../../models';
import { BaseDbService } from '../base-db.service';

@Injectable()
export class UserDbService extends BaseDbService<
    UserFields,
    User,
    UserFieldsQueryConditionType,
    UserFieldsQueryConditionType
> {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>
    ) {
        super(userModel);
    }
}
