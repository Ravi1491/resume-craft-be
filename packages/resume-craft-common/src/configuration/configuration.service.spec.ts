import { Test, TestingModule } from '@nestjs/testing';

import { ConfigurationService } from './configuration.service';
import { TestConfig } from './test.config';

describe('ConfigurationService', () => {
    let module: TestingModule;
    let service: ConfigurationService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: ConfigurationService,
                    useValue: new ConfigurationService(TestConfig),
                },
            ],
        }).compile();
        service = module.get<ConfigurationService>(ConfigurationService);
    });

    afterEach(async () => {
        await module?.close();
    });

    it('should return config', () => {
        expect(service.getConfig()).toStrictEqual(TestConfig);
    });
});
