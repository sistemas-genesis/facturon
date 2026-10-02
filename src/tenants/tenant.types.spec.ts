import { readFileSync } from 'node:fs';
import { tenantSchema } from './tenant.types.js';

const sample = () =>
  JSON.parse(
    readFileSync(
      new URL('../../config/tenants/example.json.sample', import.meta.url),
      'utf8',
    ),
  );

describe('tenantSchema', () => {
  it('acepta el ejemplo completo de config/tenants/example.json.sample', () => {
    const res = tenantSchema.safeParse(sample());
    expect(res.success).toBe(true);
  });

  it('acepta el ejemplo minimo', () => {
    const res = tenantSchema.safeParse({
      slug: 'mi-empresa',
      ruc: '1790000000001',
      nombreComercial: 'MI EMPRESA S.A.',
      db: {
        host: 'localhost',
        port: 4011,
        db: 'mi_bd',
        user: 'dba',
        pass: 'x',
      },
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.enabled).toBe(true);
      expect(res.data.estacion).toBe('');
    }
  });

  it('el JSON de la empresa ya no admite apiKey (no hay autenticacion por empresa)', () => {
    expect(
      tenantSchema.safeParse({ ...sample(), apiKey: 'x'.repeat(20) }).success,
    ).toBe(false);
  });

  it('rechaza campos desconocidos y slugs peligrosos', () => {
    expect(
      tenantSchema.safeParse({ ...sample(), nombreComerical: 'x' }).success,
    ).toBe(false);
    expect(
      tenantSchema.safeParse({ ...sample(), slug: '../etc' }).success,
    ).toBe(false);
  });
});
