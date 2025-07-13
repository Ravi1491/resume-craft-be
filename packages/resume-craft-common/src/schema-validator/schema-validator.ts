import { TypeCompiler } from '@sinclair/typebox/compiler';

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const validate = (schema: any, value: object) => {
    const compiledSchema = TypeCompiler.Compile(schema);

    const isValid = compiledSchema.Check(value);
    const errors = [...compiledSchema.Errors(value)];

    return {
        isValid,
        errors: errors.length > 0 ? JSON.stringify(errors) : '',
    };
};
