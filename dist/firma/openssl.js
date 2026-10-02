import { spawn } from 'child_process';
export class OpenSslError extends Error {
    stderr;
    constructor(message, stderr) {
        super(message);
        this.stderr = stderr;
    }
}
export function openssl(args, opts = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn('openssl', args, {
            env: { ...process.env, ...opts.env },
        });
        let out = '';
        let err = '';
        child.stdout.on('data', (d) => (out += d));
        child.stderr.on('data', (d) => (err += d));
        child.on('error', (e) => reject(new OpenSslError(`No se pudo ejecutar openssl: ${e.message}`, '')));
        child.on('close', (code) => code === 0
            ? resolve(out)
            : reject(new OpenSslError(`openssl termino con codigo ${code}`, err)));
        child.stdin.on('error', () => undefined);
        child.stdin.end(opts.stdin);
    });
}
export async function certFromP12(p12, password) {
    const base = [
        'pkcs12',
        '-clcerts',
        '-nokeys',
        '-passin',
        'env:FACTURON_P12_PASS',
    ];
    const env = { FACTURON_P12_PASS: password };
    try {
        return await openssl(base, { stdin: p12, env });
    }
    catch (e) {
        if (e instanceof OpenSslError && /unsupported|legacy/i.test(e.stderr))
            return openssl([...base, '-legacy'], { stdin: p12, env });
        throw e;
    }
}
export function parseOpensslDate(line, key) {
    const m = new RegExp(`${key}=\\s*(\\w{3})\\s+(\\d{1,2})\\s+[\\d:]+\\s+(\\d{4})`).exec(line);
    if (!m)
        throw new Error(`Fecha ilegible en la salida de openssl (${key})`);
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const month = months.indexOf(m[1]) + 1;
    if (month === 0)
        throw new Error(`Mes desconocido: ${m[1]}`);
    return `${m[3]}-${String(month).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}
//# sourceMappingURL=openssl.js.map