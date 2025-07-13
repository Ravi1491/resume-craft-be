import { BSON } from 'bson';
import {
    CallbackWithoutResultAndOptionalError,
    Document,
    MongooseDocumentMiddleware,
    MongooseQueryMiddleware,
    PipelineStage,
    Schema,
    SchemaType,
} from 'mongoose';

import { LoggerFactory } from '../../logger';

const deletedAtField = 'deletedAt';

const documentMethods: MongooseDocumentMiddleware[] = [
    'validate',
    'save',
    'updateOne',
    'deleteOne',
    'deleteOne',
    'updateOne',
    'validate',
];

const queryMethods: MongooseQueryMiddleware[] = [
    'countDocuments',
    'deleteMany',
    'estimatedDocumentCount',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndReplace',
    'findOneAndUpdate',
    'replaceOne',
    'updateMany',
];

const _registerDocumentHooks = (schema: Schema, method: MongooseDocumentMiddleware) => {
    const logger = LoggerFactory.getLogger('ODM _registerDocumentHooks');

    // eslint-disable-next-line func-names
    schema.pre(method, function (this: Document, next: CallbackWithoutResultAndOptionalError) {
        try {
            logger.debug(`Going to validate Document hook for ${method}`);
            next();
        } catch (error) {
            logger.error({
                method,
                error,
            });
            next(error as Error);
        }
    });
};

export const _registerQueryHooks = (schema: Schema, method: MongooseQueryMiddleware) => {
    const logger = LoggerFactory.getLogger('ODM _registerQueryHooks');

    logger.debug(`Going to register pre hook for ${method}`);
    // eslint-disable-next-line func-names
    schema.pre(method, function (next: CallbackWithoutResultAndOptionalError) {
        try {
            this.where(deletedAtField).equals(null);
            logger.debug({ 'Executing query': this.getQuery() });
            next();
        } catch (error) {
            logger.error({
                method,
                error,
            });
            next(error as Error);
        }
    });
};

export const _registerAggregateHooks = (schema: Schema) => {
    // eslint-disable-next-line func-names
    schema.pre('aggregate', function () {
        const pipeline = this.pipeline();

        let hasMatchStage = false;

        pipeline.forEach((stage) => {
            const matchStage = stage as PipelineStage.Match;
            if (matchStage.$match) {
                hasMatchStage = true;
                if (!matchStage.$match[deletedAtField]) {
                    matchStage.$match[deletedAtField] = null;
                }
            }
        });

        if (!hasMatchStage) {
            const matchStage: PipelineStage.Match = {
                $match: {
                    [deletedAtField]: null,
                },
            };
            this.pipeline().unshift(matchStage);
        }
    });
};

export const _registerInsertManyHooks = (schema: Schema) => {
    const method = 'insertMany';
    // eslint-disable-next-line func-names
    schema.pre(method, function (this: Document, next: CallbackWithoutResultAndOptionalError, docs: Document[]) {
        const logger = LoggerFactory.getLogger('ODM _registerInsertManyHooks');

        try {
            next();
        } catch (error) {
            logger.error({
                method,
                error,
            });
            next(error as Error);
        }
    });
};

const selectExcludedFields = {
    [deletedAtField]: true,
    _id: true,
};

const BSONCtors = {
    UUID: BSON.UUID,
    ObjectId: BSON.ObjectId,
};

const handleFieldTransformation = (field: SchemaType, fieldName: string, schema: Schema) => {
    if (selectExcludedFields[fieldName]) {
        schema.path(fieldName).select(false);
    }

    const InstanceConstructor = BSONCtors[field.instance];
    if (!InstanceConstructor) {
        return;
    }

    field.get((v: typeof InstanceConstructor) => (v ? v.toString() : v));
    field.set((v: string) => (v ? new InstanceConstructor(v) : v));
    field.transform((v: typeof InstanceConstructor) => (v ? v.toString() : v));
};

export const _addFieldTransformations = (schema: Schema) => {
    schema.set('toJSON', {
        getters: true,
        transform: (doc, ret) => {
            // eslint-disable-next-line no-param-reassign
            delete ret._id;
            // eslint-disable-next-line no-param-reassign
            delete ret.id;
            return ret;
        },
    });
    schema.set('toObject', { getters: true });

    Object.keys(schema.paths).forEach((fieldName) => {
        const field = schema.paths[fieldName];
        handleFieldTransformation(field, fieldName, schema);
    });
};

export const registerHooks = (schema: Schema) => {
    queryMethods.forEach((method: MongooseQueryMiddleware) => _registerQueryHooks(schema, method));
    documentMethods.forEach((method: MongooseDocumentMiddleware) => _registerDocumentHooks(schema, method));
    _registerAggregateHooks(schema);
    _registerInsertManyHooks(schema);
    _addFieldTransformations(schema);
};
