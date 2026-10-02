import type { Tenant } from '../tenants/tenant.types.js';
export type Row = Record<string, any>;
export interface DbConnection {
    query<T = Row>(sql: string): Promise<T[]>;
    close(): void;
}
export declare abstract class DbDriver {
    abstract connect(db: Tenant['db']): Promise<DbConnection>;
}
export declare class SybaseDriver extends DbDriver {
    connect(db: Tenant['db']): Promise<DbConnection>;
}
export declare class SybaseService {
    private readonly driver;
    constructor(driver: DbDriver);
    withConnection<T>(tenant: Pick<Tenant, 'db'>, fn: (conn: DbConnection) => Promise<T>): Promise<T>;
    query<T = Row>(tenant: Pick<Tenant, 'db'>, sql: string): Promise<T[]>;
}
