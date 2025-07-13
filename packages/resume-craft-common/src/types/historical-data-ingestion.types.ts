import { type Static, Type } from '@sinclair/typebox';

export enum ENTITIES_VALUES {
    WORKSPACE = 'workspace.workspace.*',
}

const ingestHistoricalDataRequestDetails = Type.Object({
    accountId: Type.String(),
    entity: Type.Enum(ENTITIES_VALUES),
    targetTopic: Type.String(),
    email: Type.String(),
    includeAllEntityData: Type.Boolean(),
});

const ingestHistoricalDataRequest = Type.Object({
    category: Type.Literal('ingest_historical_data'),
    details: ingestHistoricalDataRequestDetails,
});

export type IngestHistoricalDataRequestType = Static<typeof ingestHistoricalDataRequest>;
export type IngestHistoricalDataRequestDetailsType = Static<typeof ingestHistoricalDataRequestDetails>;
