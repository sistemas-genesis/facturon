import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  WriteStream,
} from 'fs';
import { join } from 'path';

/**
 * Stream de archivo con rotacion diaria: <dir>/<prefix>-YYYY-MM-DD.log
 * Compatible con pino (solo necesita write()). Borra archivos mas viejos que retentionDays.
 */
export class DailyFileStream {
  private stream?: WriteStream;
  private currentDate = '';

  constructor(
    private readonly dir: string,
    private readonly prefix: string,
    private readonly retentionDays: number,
  ) {
    mkdirSync(dir, { recursive: true });
  }

  static today(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  static fileFor(dir: string, prefix: string, date: string): string {
    return join(dir, `${prefix}-${date}.log`);
  }

  write(chunk: string): void {
    const date = DailyFileStream.today();
    if (date !== this.currentDate || !this.stream) this.rotate(date);
    this.stream!.write(chunk);
  }

  end(): void {
    this.stream?.end();
    this.stream = undefined;
  }

  private rotate(date: string): void {
    this.stream?.end();
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
    this.stream = createWriteStream(
      DailyFileStream.fileFor(this.dir, this.prefix, date),
      { flags: 'a' },
    );
    this.stream.on('error', (err) =>
      console.error(`[logger] error escribiendo ${this.dir}:`, err.message),
    );
    this.currentDate = date;
    this.purgeOld();
  }

  private purgeOld(): void {
    const limit = Date.now() - this.retentionDays * 86_400_000;
    try {
      for (const f of readdirSync(this.dir)) {
        if (!f.startsWith(`${this.prefix}-`) || !f.endsWith('.log')) continue;
        const full = join(this.dir, f);
        if (statSync(full).mtimeMs < limit) unlinkSync(full);
      }
    } catch {
      /* la limpieza nunca debe tumbar el logger */
    }
  }
}
