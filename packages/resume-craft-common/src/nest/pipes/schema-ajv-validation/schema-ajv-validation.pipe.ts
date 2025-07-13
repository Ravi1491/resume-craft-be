import { BadRequestException, PipeTransform } from '@nestjs/common';

import { LoggerFactory } from '../../../logger';
import { ajvSchemaValidator } from '../../../schema-validator';

type ValidatorResponse = {
    isValid: boolean;
    errors?: {
        field: string;
        message: string;
    }[];
};

export class SchemaAjvValidationPipe implements PipeTransform {
    private readonly logger = LoggerFactory.getLogger(SchemaAjvValidationPipe.name);

    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    constructor(private readonly schema: any) {
        this.logger.debug(`${SchemaAjvValidationPipe.name} Initialized`);
    }

    transform(value: object) {
        let response: ValidatorResponse;

        try {
            response = ajvSchemaValidator(this.schema, value);
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
