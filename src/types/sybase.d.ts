declare module 'sybase' {
  type Callback<T = void> = (err: Error | null, data?: T) => void;
  export default class Sybase {
    constructor(
      host: string,
      port: number,
      dbName: string,
      username: string,
      password: string,
      logTiming?: boolean,
      javaJarPath?: string,
    );
    connect(cb: Callback): void;
    query(sql: string, cb: Callback<Record<string, unknown>[]>): void;
    disconnect(): void;
  }
}
