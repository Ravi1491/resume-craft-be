import { Connection } from 'mongoose';

export interface IDBService {
    getDBConnection(): Connection;
    isDBAvailable(): boolean;
    disconnect(): Promise<void>;
}
