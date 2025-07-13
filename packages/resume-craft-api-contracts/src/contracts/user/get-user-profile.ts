import { GenericApiResponseType, getGenericApiResponseTypeSchema } from '../response';
import { UserSchema, UserType } from './user';

export type GetUserProfileResponseType = GenericApiResponseType<UserType>;
export const GetUserProfileRespSchema = getGenericApiResponseTypeSchema(UserSchema);
export const GetUserProfileSuccessRespOpenApiSchema = JSON.parse(JSON.stringify(GetUserProfileRespSchema));
