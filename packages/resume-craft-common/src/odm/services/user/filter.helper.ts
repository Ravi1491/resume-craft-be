import { UUID } from 'bson';
import { escapeRegExp } from 'lodash';
import { PipelineStage } from 'mongoose';

import { MatchConditionType, ProjectConditionType } from '../../../types';
import { decodeCursor } from '../../helpers';
import { UserFields } from '../../models';

export const getPaginationCondition = (condition: MatchConditionType, nextPageToken: string): MatchConditionType => {
    if (!nextPageToken) {
        return condition;
    }

    const { name, id } = decodeCursor(nextPageToken);
    return {
        ...condition,
        $or: [
            { [UserFields.Name]: { $gt: name } },
            {
                [UserFields.Name]: name,
                [UserFields.UserId]: { $gt: new UUID(id) },
            },
        ],
    };
};

export const getUserListSortingCondition = (): Record<string, 1 | -1> => {
    return {
        [UserFields.Name]: 1,
        [UserFields.UserId]: 1,
    };
};

export const getPipeline = (input: {
    condition: MatchConditionType;
    size: number;
    sortCondition: Record<string, 1 | -1>;
    q?: string;
    fieldsToInclude?: string[];
}) => {
    const { condition, size, sortCondition, q, fieldsToInclude } = input;
    const pipeline = [];
    pipeline.push({ $match: condition });

    if (q) {
        pipeline.push({
            $match: {
                $or: [{ name: q }, { name: { $regex: escapeRegExp(q), $options: 'i' } }],
            },
        });
    }

    pipeline.push(
        { $sort: sortCondition },
        { $limit: size },
        {
            $project: {
                _id: 0,
                ...getUserProjection(fieldsToInclude),
            },
        }
    );

    return pipeline;
};

export const getUserProjection = (fieldsToInclude: string[]): ProjectConditionType => ({
    ...fieldsToInclude.reduce(
        (acc: ProjectConditionType, field) => ({ ...acc, [field]: 1 }),
        {} as ProjectConditionType
    ),
});

export const getUserPaginationCondition = (
    condition: MatchConditionType,
    nextPageToken: string
): MatchConditionType => {
    if (!nextPageToken) {
        return { ...condition };
    }

    const { name, id } = decodeCursor(nextPageToken);

    return {
        ...condition,
        $or: [
            { [UserFields.Name]: { $gt: name } },
            {
                [UserFields.Name]: name,
                [UserFields.UserId]: { $gt: new UUID(id) },
            },
        ],
    };
};

export const getCreatedByUserPipeline = (localField: string, outputField: string = 'createdBy'): PipelineStage[] => {
    return [
        {
            $lookup: {
                from: 'users',
                localField,
                foreignField: UserFields.UserId,
                as: 'userLookup',
            },
        },
        {
            $addFields: {
                [outputField]: {
                    $cond: {
                        if: { $gt: [{ $size: '$userLookup' }, 0] },
                        then: {
                            userId: { $arrayElemAt: ['$userLookup.userId', 0] },
                            name: { $arrayElemAt: ['$userLookup.name', 0] },
                            title: { $arrayElemAt: ['$userLookup.title', 0] },
                            department: { $arrayElemAt: ['$userLookup.department', 0] },
                            profileImageUrl: {
                                $arrayElemAt: ['$userLookup.profileImageUrl', 0],
                            },
                        },
                        else: null,
                    },
                },
            },
        },
        { $unset: 'userLookup' },
    ];
};
