import { parseOpensslDate } from './openssl.js';

describe('parseOpensslDate', () => {
  it('maneja el dia con un digito (doble espacio) y ambos formatos', () => {
    expect(
      parseOpensslDate('notAfter=Jan  5 12:00:00 2026 GMT', 'notAfter'),
    ).toBe('2026-01-05');
    expect(
      parseOpensslDate('notBefore=Dec 25 08:30:00 2024 GMT\n', 'notBefore'),
    ).toBe('2024-12-25');
  });
  it('falla con salida ilegible', () => {
    expect(() => parseOpensslDate('basura', 'notAfter')).toThrow();
  });
});
