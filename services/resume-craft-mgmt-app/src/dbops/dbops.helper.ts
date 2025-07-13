import { UUID } from 'bson';
import { Db } from 'mongodb';

import { generateUUIDV4 } from '@resume/resume-craft-common';

export const MIGRATION_USER_BATCH_SIZE = 500;

export function chunkDocumentArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, i * size + size));
}

export function _generateUniqueIdentifierBson(uuid?: string): UUID {
    return uuid ? new UUID(uuid) : new UUID(generateUUIDV4());
}

export async function withDBManualTransaction<T>(client: any, operation: (session: any) => Promise<T>): Promise<T> {
    const session = await client.startSession();
    session.startTransaction();
    try {
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
}

export async function _insert(db: Db, collectionName: string, document: object, session: any): Promise<void> {
    await db.collection(collectionName).insertOne(document, { session });
}

export async function _insertMany(db: Db, collectionName: string, documents: object[], session?: any): Promise<void> {
    await db.collection(collectionName).insertMany(documents, { session });
}

export async function _dropCollections(db: Db, collections: string[]): Promise<void> {
    for (const collectionName of collections) {
        const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
        if (collectionExists) {
            await db.collection(collectionName).drop();
            console.warn(`Dropped collection: ${collectionName}`);
        } else {
            console.warn(`Collection not found: ${collectionName}`);
        }
    }
}

export function _setAuditAttributes(offset = 0) {
    const now = Date.now() + offset;
    return {
        createdAt: now,
        modifiedAt: now,
        createdBy: null,
        modifiedBy: null,
        deletedAt: null,
    };
}

export function buildMongoUri(): string {
    const { DB_HOST = '', DB_NAME = '' } = process.env;
    return `${DB_HOST}/${DB_NAME}`;
}
