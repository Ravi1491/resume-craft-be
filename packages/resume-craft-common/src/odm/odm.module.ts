import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import { ConfigurationModule } from '../configuration';
import { User, UserSchema } from './models';
import { DbService, MongooseConfigService, UserDbService } from './services';

mongoose.set('debug', process.env.NODE_ENV !== 'prod');

@Global()
@Module({
    imports: [
        ConfigModule,
        ConfigurationModule,
        MongooseModule.forRootAsync({
            imports: [ConfigurationModule],
            useClass: MongooseConfigService,
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    providers: [DbService, UserDbService],
    exports: [DbService, MongooseModule, UserDbService],
})
export class ODMModule {}
