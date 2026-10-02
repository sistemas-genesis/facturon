import { Injectable } from '@nestjs/common';
import Sybase from 'sybase';
import type { Tenant } from '../tenants/tenant.types.js';

export type Row = Record<string, any>;

/** Una conexion abierta a la BD de una empresa. */
export interface DbConnection {
  query<T = Row>(sql: string): Promise<T[]>;
  close(): void;
}

/** Abstraccion del driver: permite sustituirlo en pruebas sin tocar los servicios. */
export abstract class DbDriver {
  abstract connect(db: Tenant['db']): Promise<DbConnection>;
}

/** Driver real: node-sybase (puente Java/jConnect, requiere JRE en el servidor). */
@Injectable()
export class SybaseDriver extends DbDriver {
  connect(db: Tenant['db']): Promise<DbConnection> {
    const conn = new Sybase(db.host, db.port, db.db, db.user, db.pass);
    return new Promise((resolve, reject) => {
      conn.connect((err) => {
        if (err) return reject(err);
        resolve({
          query: <T = Row>(sql: string) =>
            new Promise<T[]>((res, rej) =>
              conn.query(sql, (e, data) =>
                e ? rej(e) : res((data ?? []) as T[]),
              ),
            ),
          close: () => {
            try {
              conn.disconnect();
            } catch {
              /* ya cerrada */
            }
          },
        });
      });
    });
  }
}

/** Acceso a la BD Sybase de la empresa indicada (abre y cierra la conexion por operacion, como el legacy). */
@Injectable()
export class SybaseService {
  constructor(private readonly driver: DbDriver) {}

  /** Ejecuta varias consultas sobre una misma conexion y siempre la cierra. */
  async withConnection<T>(
    tenant: Pick<Tenant, 'db'>,
    fn: (conn: DbConnection) => Promise<T>,
  ): Promise<T> {
    const conn = await this.driver.connect(tenant.db);
    try {
      return await fn(conn);
    } finally {
      conn.close();
    }
  }

  query<T = Row>(tenant: Pick<Tenant, 'db'>, sql: string): Promise<T[]> {
    return this.withConnection(tenant, (c) => c.query<T>(sql));
  }
}
