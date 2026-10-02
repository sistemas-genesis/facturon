import { TenantRegistry } from './tenant-registry.service.js';
import type { Tenant } from './tenant.types.js';

const t = (slug: string, o: Partial<Tenant>): Tenant =>
  ({
    slug,
    enabled: true,
    ruc: '1790000000001',
    nombreComercial: slug,
    estacion: '',
    punto: '',
    db: { host: 'h', port: 1, db: slug, user: 'u', pass: 'p' },
    ...o,
  }) as Tenant;

function registry(list: Tenant[]) {
  const r = new TenantRegistry({ tenantsDir: '/x' } as never, {} as never);
  (r as any).tenants = new Map(list.map((x) => [x.slug, x]));
  return r;
}

describe('TenantRegistry.selectByRuc (utilities.getDatabaseInfoByRuc)', () => {
  it('prefiere la empresa que coincide en establecimiento y punto; vacio es comodin', () => {
    const r = registry([
      t('sucursal2', { estacion: '002', punto: '001' }),
      t('general', {}),
    ]);
    expect(r.selectByRuc('1790000000001', '002', '001')?.slug).toBe(
      'sucursal2',
    );
    expect(r.selectByRuc('1790000000001', '001', '001')?.slug).toBe('general');
  });
  it('sin coincidencia exacta usa la ultima con ese RUC; ignora deshabilitadas y RUC ajenos', () => {
    const r = registry([
      t('a', { estacion: '002' }),
      t('b', { estacion: '003' }),
      t('off', { enabled: false, estacion: '' }),
    ]);
    expect(r.selectByRuc('1790000000001', '009', '001')?.slug).toBe('b');
    expect(r.selectByRuc('1111111111111')).toBeUndefined();
  });
  it('distinctDatabases no repite host+bd', () => {
    const same = { host: 'h', port: 1, db: 'bd', user: 'u', pass: 'p' };
    const r = registry([
      t('x', { db: same }),
      t('y', { db: same, ruc: '1790000000002' }),
    ]);
    expect(r.distinctDatabases().map((d) => d.slug)).toEqual(['x']);
  });
});
