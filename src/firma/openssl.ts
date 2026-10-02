import { spawn } from 'child_process';

export class OpenSslError extends Error {
  constructor(
    message: string,
    readonly stderr: string,
  ) {
    super(message);
  }
}

/**
 * Ejecuta `openssl <args>` sin shell (los argumentos nunca se interpretan). La entrada va por stdin
 * y las contrasenas por variables de entorno (-passin env:NOMBRE), asi no aparecen en la lista de procesos.
 */
export function openssl(
  args: string[],
  opts: { stdin?: Buffer | string; env?: Record<string, string> } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('openssl', args, {
      env: { ...process.env, ...opts.env },
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) =>
      reject(new OpenSslError(`No se pudo ejecutar openssl: ${e.message}`, '')),
    );
    child.on('close', (code) =>
      code === 0
        ? resolve(out)
        : reject(new OpenSslError(`openssl termino con codigo ${code}`, err)),
    );
    child.stdin.on('error', () => undefined);
    child.stdin.end(opts.stdin);
  });
}

/** Certificado (PEM) contenido en un .p12/.pfx. Lanza OpenSslError con 'invalid password' si la clave es incorrecta. */
export async function certFromP12(
  p12: Buffer,
  password: string,
): Promise<string> {
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
  } catch (e) {
    // OpenSSL 3 rechaza p12 antiguos (RC2/3DES) sin el proveedor legacy
    if (e instanceof OpenSslError && /unsupported|legacy/i.test(e.stderr))
      return openssl([...base, '-legacy'], { stdin: p12, env });
    throw e;
  }
}

/** notBefore/notAfter ("notAfter=Jan  5 12:00:00 2026 GMT") -> 'YYYY-MM-DD'. */
export function parseOpensslDate(
  line: string,
  key: 'notAfter' | 'notBefore',
): string {
  const m = new RegExp(
    `${key}=\\s*(\\w{3})\\s+(\\d{1,2})\\s+[\\d:]+\\s+(\\d{4})`,
  ).exec(line);
  if (!m) throw new Error(`Fecha ilegible en la salida de openssl (${key})`);
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
  if (month === 0) throw new Error(`Mes desconocido: ${m[1]}`);
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}
