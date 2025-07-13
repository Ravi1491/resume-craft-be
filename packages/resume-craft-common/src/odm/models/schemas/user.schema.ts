import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema } from 'mongoose';

import { registerHooks } from '../hooks';

export enum UserFields {
    UserId = 'userId',
    Name = 'name',
    Email = 'email',
    Phone = 'phone',
    ProfileImageUrl = 'profileImageUrl',
    CreatedAt = 'createdAt',
    CreatedBy = 'createdBy',
    ModifiedAt = 'modifiedAt',
    ModifiedBy = 'modifiedBy',
    DeletedAt = 'deletedAt',
}

@Schema()
export class User {
    @Prop({ required: true, type: MSchema.Types.UUID })
    userId: string;

    @Prop({ required: true, type: MSchema.Types.String })
    name: string;

    @Prop({ required: true, type: MSchema.Types.String })
    email: string;

    @Prop({ required: false, default: null, type: MSchema.Types.String })
    phone?: string;

    @Prop({ required: false, default: null, type: MSchema.Types.String })
    profileImageUrl?: string;

    @Prop({ required: true, default: Date.now, type: MSchema.Types.Number })
    createdAt?: number;

    @Prop({ required: false, default: null, type: MSchema.Types.Number })
    modifiedAt?: number;

    @Prop({ required: false, default: null, type: MSchema.Types.UUID })
    createdBy?: string;

    @Prop({ required: false, default: null, type: MSchema.Types.UUID })
    modifiedBy?: string;

    @Prop({ required: false, default: null, type: MSchema.Types.Number })
    deletedAt?: number;
}

export type UserFieldsType = `${UserFields}`;
export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

registerHooks(UserSchema);

export type UserFieldsQueryConditionType = {
    [UserFields.UserId]: string;
};

export type ListUserQueryConditionType = {
    size: number;
    nextPageToken: string;
    q?: string;
};
