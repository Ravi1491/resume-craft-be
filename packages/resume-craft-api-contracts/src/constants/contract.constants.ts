export enum ApiStatus {
    ERROR = 'error',
    SUCCESS = 'success',
}

export const API_STATUS = {
    ERROR: 'error',
    SUCCESS: 'success',
};

export const USER_CURRENT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

export enum ErrorCode {
    PARTIAL_CHANGE = 'PARTIAL_CHANGE',
    INVALID_INPUT = 'INVALID_INPUT',
}

export const ERROR_CODE: Record<ErrorCode, string> = {
    PARTIAL_CHANGE: 'PARTIAL_CHANGE',
    INVALID_INPUT: 'INVALID_INPUT',
};

export enum ApiName {
    GET_USER_PROFILE = 'GetUserProfile',
}
