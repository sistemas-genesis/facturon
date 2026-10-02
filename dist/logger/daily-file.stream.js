import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, } from 'fs';
import { join } from 'path';
export class DailyFileStream {
    dir;
    prefix;
    retentionDays;
    stream;
    currentDate = '';
    constructor(dir, prefix, retentionDays) {
        this.dir = dir;
        this.prefix = prefix;
        this.retentionDays = retentionDays;
        mkdirSync(dir, { recursive: true });
    }
    static today() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }
    static fileFor(dir, prefix, date) {
        return join(dir, `${prefix}-${date}.log`);
    }
    write(chunk) {
        const date = DailyFileStream.today();
        if (date !== this.currentDate || !this.stream)
            this.rotate(date);
        this.stream.write(chunk);
    }
    end() {
        this.stream?.end();
        this.stream = undefined;
    }
    rotate(date) {
        this.stream?.end();
        if (!existsSync(this.dir))
            mkdirSync(this.dir, { recursive: true });
        this.stream = createWriteStream(DailyFileStream.fileFor(this.dir, this.prefix, date), { flags: 'a' });
        this.stream.on('error', (err) => console.error(`[logger] error escribiendo ${this.dir}:`, err.message));
        this.currentDate = date;
        this.purgeOld();
    }
    purgeOld() {
        const limit = Date.now() - this.retentionDays * 86_400_000;
        try {
            for (const f of readdirSync(this.dir)) {
                if (!f.startsWith(`${this.prefix}-`) || !f.endsWith('.log'))
                    continue;
                const full = join(this.dir, f);
                if (statSync(full).mtimeMs < limit)
                    unlinkSync(full);
            }
        }
        catch {
        }
    }
}
//# sourceMappingURL=daily-file.stream.js.map