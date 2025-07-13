import { type TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

export const validate = (schema: TSchema, value: object) => {
    const C = TypeCompiler.Compile(schema);

    const isValid = C.Check(value);
    const all = [...C.Errors(value)];

    return {
        isValid,
        errors: all.length > 0 ? JSON.stringify(all) : '',
    };
};
