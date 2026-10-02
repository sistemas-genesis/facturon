import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getMailFromXml,
  getValorFromXml,
  parseXml,
  tipoFromXml,
} from './sri-xml.js';

const load = (n: string) =>
  parseXml(readFileSync(join(process.cwd(), 'test/fixtures', n), 'utf8'));

describe('sri-xml', () => {
  it.each([
    ['factura.xml', 'factura', '115.00'],
    ['retencion.xml', 'retencion', '1.75'],
    ['retencion2.xml', 'retencion2', '1.75'],
    ['credito.xml', 'credito', '10.00'],
    ['debito.xml', 'debito', '10.00'],
    ['remision.xml', 'remision', ''],
    ['liquidacion.xml', 'liquidacion', '115.00'],
  ])('%s -> tipo %s, valor %s', async (file, tipo, valor) => {
    const xml = await load(file);
    expect(tipoFromXml(xml)).toBe(tipo);
    expect(getValorFromXml(xml)).toBe(valor);
  });

  it('getMailFromXml lee el campo adicional Email', async () => {
    const xml = await load('factura.xml');
    expect(getMailFromXml(xml.factura)).toBe('cliente@example.com');
    expect(getMailFromXml({})).toBe(false);
  });

  it('raiz desconocida => tipo vacio', () => {
    expect(tipoFromXml({ otra: {} })).toBe('');
  });
});
