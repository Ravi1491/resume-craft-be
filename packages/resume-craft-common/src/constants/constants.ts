import { ApiHeaderOptions } from '@nestjs/swagger';
import { Static, Type } from '@sinclair/typebox';

const _env = process.env.ENV || 'dev';
export const env = _env.toLowerCase();
export const ENV = _env.toUpperCase();
export const Env = _env.charAt(0).toUpperCase() + _env.slice(1);

const _userEnv = process.env.USER_ENV || 'dev';
export const userEnv = _userEnv.toLowerCase();

export const HEADERS = {
    USER_ID: 'x-smtip-uid',
    CORRELATION_ID: 'x-smtip-cid',
    HOST: 'x-smtip-host',
    SB_ID: 'x-smtip-sbid',
    FE_HOST: 'x-smtip-f-host',
    APP: 'x-smtip-app',
    ACA_ORIGIN: 'Access-Control-Allow-Origin',
    ACA_CREDENTIALS: 'Access-Control-Allow-Credentials',
    ORIGIN: 'origin',
    REFERER: 'referer',
    CONTENT_TYPE: 'Content-Type',
    CONTENT_DISPOSITION: 'Content-Disposition',
    ACE_HEADERS: 'Access-Control-Expose-Headers',
    X_XSS_PROTECTION: 'x-xss-protection',
    X_FRAME_OPTIONS: 'x-frame-options',
    STRICT_TRANSPORT_SECURITY: 'strict-transport-security',
    REFERRER_POLICY: 'Referrer-Policy',
    CACHE_CONTROL: 'Cache-Control',
    X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
    AUTHORIZATION: 'authorization',
};

export const HEADER_VALUES = {
    [HEADERS.X_XSS_PROTECTION]: '1; mode=block',
    [HEADERS.X_FRAME_OPTIONS]: 'SAMEORIGIN',
    [HEADERS.STRICT_TRANSPORT_SECURITY]: 'max-age=31536000; includeSubdomain',
    [HEADERS.REFERRER_POLICY]: 'origin-when-cross-origin',
    [HEADERS.CACHE_CONTROL]: 'no-store',
    [HEADERS.X_CONTENT_TYPE_OPTIONS]: 'nosniff',
};

export const DAYS_VALUES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const BULK_WRITE_DEFAULT_BATCH_SIZE = 10;
export enum EnvType {
    DEV = 'dev',
    TEST = 'test',
    PROD = 'prod',
    QA = 'qa',
    UAT = 'uat',
    PERF = 'perf',
}
const NodeEnvType = Type.Enum(EnvType);
export type NODE_ENV_TYPE = Static<typeof NodeEnvType>;

export enum ApiOperation {
    READ = 'read',
    WRITE = 'write',
}

export const REQUIRED_HEADERS_LIST: ApiHeaderOptions[] = [
    {
        name: HEADERS.USER_ID,
        required: true,
        description: 'User ID (UUID)',
        schema: {
            type: 'string',
            example: 'f3ecf829-34e8-4d97-b782-5d63c15929a9',
        },
    },
];

export const USER_STATUS = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
};

export const REQUEST_CONTEXT_KEYS = {
    USER_ID: 'userId',
    CORRELATION_ID: 'correlationId',
    REQ_HEADERS: 'reqHeaders',
};

export const SERVER_TIMING_KEYS = {
    REQ_CONTEXT_BUILD: {
        name: 'ReqValidationAndContextBuild',
        description: 'Req Validation & Ctx Build',
    },
    REQ_VALIDATION_AND_PREP: {
        name: 'ReqValidationAndPrep',
        description: 'Req Validation & Prep',
    },
    RESPONSE_PREP: {
        name: 'ResponsePrep',
        description: 'Response Preparation',
    },
    AUTH_GUARD_CHECK: {
        name: 'AuthGuardCheck',
        description: 'Auth Guard Check',
    },
    DB: {
        name: 'db',
        description: 'Database Query',
    },
};

export enum ApiStatus {
    SUCCESS = 'success',
    ERROR = 'error',
}

export enum ApiMetadataKeys {
    API_NAME = 'apiName',
    API_DESCRIPTION = 'apiDescription',
}

export enum DBOperation {
    DELETE = 'd',
    UPDATE = 'u',
    CREATE = 'c',
    READ = 'r',
}
export const VALIDATION_FAIL_ERROR_MESSAGE = 'Validation failed';
export const DEFAULT_PAGE_SIZE = 40;
export const DEFAULT_GROUP_PAGE_SIZE = 10;
export const DEFAULT_AGENT_SORT_ORDER = 'desc';
export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
}
