import { join } from 'node:path';
import { loadAppJson } from '../config/app-json.js';
import { TenantSettings } from './tenant-settings.service.js';
import type { Tenant } from './tenant.types.js';

const json = loadAppJson(join(process.cwd(), 'config/app.config.example.json'));
const settings = new TenantSettings(json);
const t = (o: Partial<Tenant>) => ({ slug: 'x', ...o }) as Tenant;

describe('TenantSettings (defaults globales + JSON de la empresa)', () => {
  it('sin sobrescrituras hereda los defaults', () => {
    const s = settings.for(t({}));
    expect(s.soap).toBe(json.defaults.soap);
    expect(s.tables).toEqual(json.defaults.tables);
    expect(s.whatsappBaseUrl).toBe(json.defaults.whatsapp.baseUrl);
    expect(s.mailTemplate).toBe(json.defaults.ride.mailTemplate);
  });

  it('lo propio de la empresa gana y no contamina a otra', () => {
    const a = t({
      soap: 'https://a.example.com/ws?wsdl',
      genesisIp: 'http://a.example.com:2001/',
      facturonURL: 'https://a.example.com',
      whatsapp: { baseUrl: 'http://wa-a.example.com' },
      mailTask: {
        status: true,
        frequency: '*/5 * * * *',
        lastComprobantesDays: 1,
        top: 2,
      },
    });
    const sa = settings.for(a);
    expect(sa.soap).toBe('https://a.example.com/ws?wsdl');
    expect(sa.genesisIp).toBe('http://a.example.com:2001/');
    expect(sa.facturonURL).toBe('https://a.example.com');
    expect(sa.whatsappBaseUrl).toBe('http://wa-a.example.com');
    expect(sa.mailTask.top).toBe(2);
    const sb = settings.for(t({}));
    expect(sb.soap).toBe(json.defaults.soap);
    expect(sb.mailTask).toEqual(json.defaults.mailTask);
  });
});
