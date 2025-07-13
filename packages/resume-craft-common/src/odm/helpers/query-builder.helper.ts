import { Document, Query } from 'mongoose';

import { DEFAULT_PAGE_SIZE } from '../../constants';
import { PopulateParam, QueryParamsWithoutCondition } from '../../types';

export function buildQuery<FieldType, DocType extends Document, QueryType extends Query<unknown, DocType>>(
    query: QueryType,
    queryParams: QueryParamsWithoutCondition<FieldType>,
    populateParams?: PopulateParam[]
) {
    const {
        includeAllAttributes,
        includedAttributes,
        excludedAttributes,
        sortBy,
        resultsPerPage = DEFAULT_PAGE_SIZE,
        pageNumber = 0,
        offset,
    } = queryParams;

    const selectedFieldsMap = new Map();
    if (!includeAllAttributes) {
        if (includedAttributes?.length) {
            includedAttributes.forEach((attr) => selectedFieldsMap.set(attr, 1));
        }

        if (excludedAttributes?.length) {
            excludedAttributes.forEach((attr) => selectedFieldsMap.set(attr, -1));
        }

        query = query.select(Object.fromEntries(selectedFieldsMap.entries())) as QueryType;
    }

    if (populateParams?.length) {
        query.populate(populateParams).lean();
    }

    const sortCriteria = new Map();
    if (sortBy?.length) {
        sortBy.forEach(({ field, order }) => {
            sortCriteria.set(field, order);
        });

        query = query.sort([...sortCriteria]);
    }

    if (offset && offset.field && offset.value && offset.operator) {
        query = query.where(offset.field as string);
        query = query[offset.operator](offset.value as number);
    } else if (pageNumber) {
        query = query.skip(pageNumber * resultsPerPage);
    }

    if (resultsPerPage) {
        query = query.limit(resultsPerPage);
    }

    return query;
}
