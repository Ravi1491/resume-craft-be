type Index = {
    name: string;
    definition: {
        mappings: {
            dynamic: boolean;
            fields: {
                [key: string]: { type: string };
            };
        };
    };
};

export type SearchIndex = {
    collectionName: string;
    indexes: Index[];
};
