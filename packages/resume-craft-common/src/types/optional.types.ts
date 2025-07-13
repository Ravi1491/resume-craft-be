import { UUID } from 'bson';

export type MatchConditionType = Record<string, string | number | boolean | object | UUID | Array<object>>;
export type Condition = {
    equals?: {
        path: string;
        value: string | number | boolean | UUID;
    };

    in?: {
        path: string;
        value: Array<string | number | boolean | UUID>;
    };
    regex?: {
        path: string;
        query: string;
        value?: string;
    };
    text?: {
        query?: string;
        value?: string;
        path: string;
    };
    phrase?: {
        query: string | string[];
        path: string;
    };
    range?: {
        path: string;
        lt?: number;
        gt?: number;
        gte?: number;
        lte?: number;
    };
    term?: {
        query: string | string[];
        path: string;
        not?: boolean;
    };
    exists?: {
        path: string;
    };
    compound?: CompoundCondition;
};

export type CompoundCondition = {
    must?: Condition[];
    mustNot?: Condition[];
    should?: Condition[];
    not?: Condition[];
    filter?: Condition[];
    minimumShouldMatch?: number;
};

export type SortConditionType = Record<string, 1 | -1>;
export type FlatProjectCondition = Record<string, 1 | 0>;
export type ProjectConditionType = Record<string, 1 | 0 | FlatProjectCondition>;
export type SearchConditionType = {
    index?: string;
    text?: Condition;
    equals?: Condition;
    term?: Condition[];
    exists?: Condition[];
    in?: Condition;
    regex?: Condition;
    compound?: CompoundCondition;
    sort?: SortConditionType;
};
