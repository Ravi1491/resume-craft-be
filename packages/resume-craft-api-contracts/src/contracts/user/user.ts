import { type Static, Type } from '@sinclair/typebox';

export const UserSchema = Type.Object({
    userId: Type.String(),
    name: Type.String(),
    title: Type.Optional(Type.String()),
    department: Type.Optional(Type.String()),
    profileImageUrl: Type.Optional(Type.String()),
});

export const CreateUserSchema = Type.Object({
    userId: Type.String(),
    name: Type.String(),
    email: Type.String(),
    phone: Type.Optional(Type.String()),
    profileImageUrl: Type.Optional(Type.String()),
});

export type CreateUserType = Static<typeof CreateUserSchema>;
export type UserType = Static<typeof UserSchema>;
