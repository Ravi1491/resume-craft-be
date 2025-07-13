import { BadRequestException, PipeTransform } from '@nestjs/common';

import { LoggerFactory } from '../../../logger';
import { validate } from '../../../schema-validator';

type ValidatorResponse = {
    isValid: boolean;
    errors?: string;
};

export class SchemaValidationPipe implements PipeTransform {
    private readonly logger = LoggerFactory.getLogger(SchemaValidationPipe.name);

    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    constructor(private readonly schema: any) {
        this.logger.debug(`${SchemaValidationPipe.name} Initialized`);
    }

    transform(value: object) {
        let response: ValidatorResponse;

        try {
            response = validate(this.schema, value);
        } catch (error) {
            this.logger.error(error.toString());
            throw new BadRequestException('Validation failed');
        }

        if (!response.isValid) {
            this.logger.error({
                ref: 'Request schema validation failed',
                error: response.errors,
            });
            throw new BadRequestException('Validation failed', { cause: response.errors });
        }
        this.logger.debug('validated');
        return value;
    }
}
