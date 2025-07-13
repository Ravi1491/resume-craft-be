import { Prop } from '@nestjs/mongoose';
import { Schema as MSchema } from 'mongoose';

export enum UserRefFields {
    UserId = 'userId',
    ProfileImageUrl = 'profileImageUrl',
    Name = 'name',
}

export class UserRef {
    @Prop({ required: true, default: null, type: MSchema.Types.String })
    userId: string;

    @Prop({ required: true, default: null, type: MSchema.Types.String })
    name: string;

    @Prop({ required: false, default: null, type: MSchema.Types.String })
    title?: string;

    @Prop({ required: false, default: null, type: MSchema.Types.String })
    department?: string;

    @Prop({ required: false, default: null, type: MSchema.Types.String })
    profileImageUrl?: string;
}

export type UserRefFieldsType = `${UserRefFields}`;
