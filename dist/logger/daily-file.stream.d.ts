export declare class DailyFileStream {
    private readonly dir;
    private readonly prefix;
    private readonly retentionDays;
    private stream?;
    private currentDate;
    constructor(dir: string, prefix: string, retentionDays: number);
    static today(): string;
    static fileFor(dir: string, prefix: string, date: string): string;
    write(chunk: string): void;
    end(): void;
    private rotate;
    private purgeOld;
}
