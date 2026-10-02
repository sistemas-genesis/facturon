export declare class OpenSslError extends Error {
    readonly stderr: string;
    constructor(message: string, stderr: string);
}
export declare function openssl(args: string[], opts?: {
    stdin?: Buffer | string;
    env?: Record<string, string>;
}): Promise<string>;
export declare function certFromP12(p12: Buffer, password: string): Promise<string>;
export declare function parseOpensslDate(line: string, key: 'notAfter' | 'notBefore'): string;
