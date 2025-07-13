import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { CreateUserService } from './services';
import { ODMModule } from '@resume/resume-craft-common';

@Module({
    imports: [ODMModule],
    controllers: [UserController],
    providers: [CreateUserService],
})
export class UserModule {}
