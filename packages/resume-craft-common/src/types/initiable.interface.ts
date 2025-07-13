export interface Initiable {
    initialize(): Promise<this>;
    isInitialized: boolean;
}

export interface Configurable<ConfigType> {
    configure(config: ConfigType): Promise<this>;
}
