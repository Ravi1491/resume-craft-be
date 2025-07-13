import { Static, Type } from '@sinclair/typebox';

export const CursorSchema = Type.Object({
    name: Type.String(),
    id: Type.String(),
});
export type CursorDataType = Static<typeof CursorSchema>;
