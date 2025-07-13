import { NotFoundException } from '@nestjs/common';
import {
    ClientSession,
    Document,
    HydratedDocument,
    InsertManyOptions,
    Model,
    MongooseUpdateQueryOptions,
    Query,
    QueryOptions,
} from 'mongoose';

import { BULK_WRITE_DEFAULT_BATCH_SIZE } from '../../constants';
import { ErrorCode, ResumeCraftException } from '../../exceptions';
import { LoggerFactory } from '../../logger';
import { PopulateParam, QueryParams, RequestContext } from '../../types';
import { buildQuery } from '../helpers';

type TenantIdentifier = {
    userId: string;
};

export enum DbOperationMethod {
    CREATE = 'create',
    CREATE_MANY = 'createMany',
    UPDATE_ONE = 'updateOne',
    UPDATE_MANY = 'updateMany',
    DELETE_ONE = 'deleteOne',
    DELETE_MANY = 'deleteMany',
    REMOVE_ONE = 'removeOne',
    REMOVE_MANY = 'removeMany',
    FIND_ONE = 'findOne',
    FIND_MANY = 'findMany',
    COUNT = 'count',
    EXISTS = 'exists',
    BULK_UPDATE = 'bulkUpdate',
}

export interface SessionQueryOptions extends QueryOptions {
    session?: ClientSession;
}

interface SessionInsertManyOptions extends InsertManyOptions {
    session?: ClientSession;
}

export abstract class BaseDbService<
    FieldsType,
    DocumentType,
    SingleDocFetchConditionType extends TenantIdentifier,
    MultiDocFetchConditionType extends TenantIdentifier,
    HDocumentType extends Document = HydratedDocument<DocumentType>,
> {
    protected _logger = LoggerFactory.getLogger(`BaseDbService:${this.constructor.name}`);
    protected _model: Model<HDocumentType>;

    protected constructor(model: Model<HDocumentType>) {
        this._model = model;
    }

    async create(
        context: RequestContext,
        documentData: DocumentType,
        options?: QueryOptions & { session?: ClientSession }
    ): Promise<DocumentType> {
        try {
            return (
                await this._model.create([documentData], options?.session ? { session: options.session } : {})
            )[0] as DocumentType;
        } catch (error) {
            this._logger.error({
                [`Error while inserting document in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async createMany(
        context: RequestContext,
        documentData: DocumentType[],
        options?: SessionInsertManyOptions
    ): Promise<DocumentType[]> {
        try {
            return (await this._model.insertMany(
                documentData,
                options?.session ? { session: options.session } : {}
            )) as DocumentType[];
        } catch (error) {
            this._logger.error({
                [`Error while inserting documents in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async updateOne(
        context: RequestContext,
        condition: SingleDocFetchConditionType,
        updatedData: Partial<DocumentType>,
        options?: SessionQueryOptions
    ): Promise<DocumentType> {
        try {
            const { userId } = context;
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.UPDATE_ONE);
            const existingDocument = (await this._model
                .findOneAndUpdate(
                    finalCondition,
                    {
                        $set: {
                            ...updatedData,
                            modifiedAt: Date.now(),
                            modifiedBy: userId,
                        },
                    },
                    {
                        upsert: false,
                        new: true,
                        select: '-__v -_id',
                        ...(options || {}),
                    }
                )
                .exec()) as DocumentType;

            if (!existingDocument) {
                throw new ResumeCraftException(ErrorCode.DATABASE_ERROR, {
                    details: {
                        model: this._model.name,
                        condition,
                    },
                });
            }

            return existingDocument;
        } catch (error) {
            this._logger.error({
                [`Error while updating document(s) in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async updateMany(
        context: RequestContext,
        condition: MultiDocFetchConditionType,
        updatedData: Partial<DocumentType>,
        options?: MongooseUpdateQueryOptions<DocumentType> & {
            session?: ClientSession;
        }
    ) {
        try {
            const { userId } = context;
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.UPDATE_MANY);
            const updatedStats = await this._model
                .updateMany(
                    finalCondition,
                    {
                        $set: {
                            ...updatedData,
                            modifiedAt: Date.now(),
                            modifiedBy: userId,
                        },
                    },
                    options || {}
                )
                .exec();
            return updatedStats;
        } catch (error) {
            this._logger.error({
                [`Error while updating document(s) in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async deleteOne(context: RequestContext, condition: SingleDocFetchConditionType, options?: SessionQueryOptions) {
        try {
            const { userId } = context;
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.DELETE_ONE);
            const existingDocument = await this._model
                .findOneAndUpdate(
                    finalCondition,
                    {
                        $set: {
                            modifiedAt: Date.now(),
                            modifiedBy: userId,
                            deletedAt: Date.now(),
                        },
                    },
                    { select: '-__v', ...(options || {}) }
                )
                .exec();

            if (!existingDocument) {
                throw new NotFoundException(`Document does not exist.`);
            }
            return existingDocument;
        } catch (error) {
            this._logger.error({
                [`Error while deleting (soft) document(s) in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async deleteMany(
        context: RequestContext,
        condition: MultiDocFetchConditionType,
        options?: { session?: ClientSession }
    ) {
        try {
            const { userId } = context;
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.DELETE_MANY);
            await this._model
                .updateMany(
                    finalCondition,
                    {
                        $set: {
                            modifiedBy: userId,
                            modifiedAt: Date.now(),
                            deletedAt: Date.now(),
                        },
                    },
                    options || {}
                )
                .exec();
        } catch (error) {
            this._logger.error({
                [`Error while deleting (soft) document(s) in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async removeOne(
        context: RequestContext,
        condition: SingleDocFetchConditionType,
        options?: { session?: ClientSession }
    ) {
        try {
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.REMOVE_ONE);
            await this._model.deleteOne(finalCondition, options || {}).exec();
        } catch (error) {
            this._logger.error({
                [`Error while removing document in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async removeMany(
        context: RequestContext,
        condition: MultiDocFetchConditionType,
        options?: { session?: ClientSession }
    ) {
        try {
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.REMOVE_MANY);
            await this._model.deleteMany(finalCondition, options || {}).exec();
        } catch (error) {
            this._logger.error({
                [`Error while removing documents in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async findOne(
        context: RequestContext,
        queryParams: QueryParams<FieldsType, SingleDocFetchConditionType>,
        populateParams?: PopulateParam[],
        options?: SessionQueryOptions
    ): Promise<DocumentType> {
        try {
            const finalQueryParams = this._transformQueryParams(context, queryParams, DbOperationMethod.FIND_ONE);
            const { condition } = finalQueryParams;
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.FIND_ONE);

            let query = this._model.findOne({ ...finalCondition });
            if (options?.session) {
                query = query.session(options.session);
            }
            query = buildQuery<FieldsType, HDocumentType, typeof query>(query, finalQueryParams, populateParams);
            const finalQuery = this._transformQuery<HDocumentType, typeof query>(
                context,
                query,
                DbOperationMethod.FIND_ONE
            );
            return (await finalQuery.exec())?.toJSON() as DocumentType;
        } catch (error) {
            this._logger.error({
                [`Error while fetching document from ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async findMany(
        context: RequestContext,
        queryParams: QueryParams<FieldsType, MultiDocFetchConditionType>,
        populateParams?: PopulateParam[],
        options?: SessionQueryOptions
    ): Promise<DocumentType[]> {
        try {
            const finalQueryParams = this._transformQueryParams(context, queryParams, DbOperationMethod.FIND_MANY);
            const { condition } = finalQueryParams;
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.FIND_MANY);

            let query = this._model.find({ ...finalCondition });
            if (options?.session) {
                query = query.session(options.session);
            }
            query = buildQuery<FieldsType, HDocumentType, typeof query>(query, finalQueryParams, populateParams);
            const finalQuery = this._transformQuery<HDocumentType, typeof query>(
                context,
                query,
                DbOperationMethod.FIND_MANY
            );

            return (await finalQuery.exec()) as DocumentType[];
        } catch (error) {
            this._logger.error({
                [`Error while fetching documents from ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async count(
        context: RequestContext,
        condition: SingleDocFetchConditionType | MultiDocFetchConditionType,
        options?: { session?: ClientSession }
    ): Promise<number> {
        try {
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.COUNT);
            const query = this._model.countDocuments({
                ...finalCondition,
            });
            if (options?.session) {
                query.session(options.session);
            }
            return await query.exec();
        } catch (error) {
            this._logger.error({
                [`Error while counting documents from ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    async exists(
        context: RequestContext,
        condition: SingleDocFetchConditionType | MultiDocFetchConditionType,
        options?: { session?: ClientSession }
    ): Promise<boolean> {
        return (await this.count(context, condition, options || {})) > 0;
    }

    async validateValues(
        context: RequestContext,
        condition: SingleDocFetchConditionType,
        values: Partial<DocumentType>,
        options?: SessionQueryOptions
    ): Promise<boolean> {
        const includedAttributes = Object.keys(values) as FieldsType[];
        const existingDocument = await this.findOne(
            context,
            {
                condition,
                includedAttributes,
            },
            undefined,
            options || {}
        );

        if (!existingDocument) {
            return null;
        }
        const jsonDoc = JSON.parse(JSON.stringify(existingDocument)) as DocumentType;
        return includedAttributes.every((key) => jsonDoc[key as string] === values[key as string]);
    }

    async bulkUpdate(
        context: RequestContext,
        condition: MultiDocFetchConditionType,
        updatedData: Partial<DocumentType>,
        options?: {
            batchSize?: number;
            parallel?: boolean;
            session?: ClientSession;
        }
    ) {
        try {
            const { batchSize = BULK_WRITE_DEFAULT_BATCH_SIZE, parallel = false, session } = options || {};
            const finalCondition = this._transformWhereCondition(context, condition, DbOperationMethod.FIND_MANY);
            const {
                successCount,
                errorCount,
                batchSize: processedBatchSize,
                failedBatches,
            } = await this._processBulkUpdate(finalCondition, updatedData, batchSize, parallel, session);

            return {
                successCount,
                errorCount,
                batchSize: processedBatchSize,
                failedBatches,
            };
        } catch (error) {
            this._logger.error({
                [`Error while updating document(s) in ${this._model.name}`]: error,
            });
            throw ResumeCraftException.fromError(error, ErrorCode.DATABASE_ERROR);
        }
    }

    protected async _processBulkUpdate(
        finalCondition: SingleDocFetchConditionType | MultiDocFetchConditionType,
        dataToUpdate: Partial<DocumentType>,
        batchSize: number,
        parallel: boolean,
        session?: ClientSession
    ) {
        const bulkOperationReqDetails = {
            operations: [],
            batchNumber: 1,
            parallel,
            successCount: 0,
            errorCount: 0,
            failedBatches: [],
        };

        let query = this._model.find(finalCondition).select('_id').batchSize(batchSize);
        if (session) {
            query = query.session(session);
        }

        const cursor = query.cursor();
        let docs = await cursor.next();
        while (docs !== null) {
            bulkOperationReqDetails.operations.push({
                updateOne: {
                    filter: { _id: docs._id },
                    update: { $set: dataToUpdate },
                },
            });

            if (bulkOperationReqDetails.operations.length === batchSize) {
                const successCount = await this._performBulkWrite(
                    bulkOperationReqDetails.operations,
                    parallel,
                    bulkOperationReqDetails,
                    session
                );
                bulkOperationReqDetails.successCount += successCount;
                bulkOperationReqDetails.batchNumber += 1;
                bulkOperationReqDetails.operations = [];
            }

            docs = await cursor.next();
        }

        if (bulkOperationReqDetails.operations.length > 0) {
            const successCount = await this._performBulkWrite(
                bulkOperationReqDetails.operations,
                parallel,
                bulkOperationReqDetails,
                session
            );
            bulkOperationReqDetails.successCount += successCount;
        }

        return {
            successCount: bulkOperationReqDetails.successCount,
            errorCount: bulkOperationReqDetails.errorCount,
            failedBatches: bulkOperationReqDetails.failedBatches,
            batchSize,
        };
    }

    protected async _performBulkWrite(operations, parallel: boolean, bulkOperationReqDetails, session?: ClientSession) {
        try {
            if (parallel) {
                this._model.bulkWrite(operations, session ? { session } : {});
            } else {
                await this._model.bulkWrite(operations, session ? { session } : {});
            }
            return operations.length;
        } catch (error) {
            // eslint-disable-next-line no-param-reassign
            bulkOperationReqDetails.errorCount += operations.length;
            bulkOperationReqDetails.failedBatches.push(bulkOperationReqDetails.batchNumber);
            this._logger.error({
                [`Error while bulkUpdate in ${this._model.name}`]: error,
            });
            return 0;
        }
    }

    protected _transformQuery<DocType extends Document, QueryType extends Query<unknown, DocType>>(
        context: RequestContext,
        query: QueryType,
        dbOperationMethod: DbOperationMethod
    ) {
        return query;
    }

    protected _transformQueryParams(
        context: RequestContext,
        queryParams: QueryParams<FieldsType, SingleDocFetchConditionType | MultiDocFetchConditionType>,
        dbOperationMethod: DbOperationMethod
    ) {
        return queryParams;
    }

    protected _transformWhereCondition(
        context: RequestContext,
        condition: SingleDocFetchConditionType | MultiDocFetchConditionType,
        dbOperationMethod: DbOperationMethod
    ) {
        Object.keys(condition).forEach((key) => {
            // Skip MongoDB operators that expect arrays (like $or, $and, $nor, etc.)
            if (key.startsWith('$')) {
                return;
            }

            if (condition[key] && condition[key].constructor.name === 'Array') {
                if (condition[key].length === 1) {
                    const [value] = condition[key];
                    // eslint-disable-next-line no-param-reassign
                    condition[key] = value;
                } else {
                    // eslint-disable-next-line no-param-reassign
                    condition[key] = { $in: condition[key] };
                }
            }
        });

        return condition;
    }

    protected _buildSingleDocConditionFromDoc(context: RequestContext, doc: DocumentType): SingleDocFetchConditionType {
        return null as unknown as SingleDocFetchConditionType;
    }
}
