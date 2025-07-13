import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { ODMModule } from '../odm';
import { PROBE_OPTION_TOKEN } from './probe.constants';
import { ProbesController } from './probes.controller';
import { ProbesService } from './probes.service';
import { ProbesOptions } from './probes.types';

@Module({})
export class ProbesModule {
    static register(options: ProbesOptions): DynamicModule {
        const imports = [TerminusModule, ODMModule];

        return {
            module: ProbesModule,
            imports,
            controllers: [ProbesController],
            providers: [
                {
                    provide: PROBE_OPTION_TOKEN,
                    useValue: options,
                },
                ProbesService,
            ],
            exports: [ProbesService],
        };
    }
}
