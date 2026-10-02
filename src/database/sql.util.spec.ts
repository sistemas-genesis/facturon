import { sqlIdent, sqlInt, sqlNum, sqlStr } from './sql.util.js';

describe('sql.util', () => {
  it('sqlStr duplica comillas y quita caracteres de control', () => {
    expect(sqlStr("O'BRIEN")).toBe("'O''BRIEN'");
    expect(sqlStr("'; DROP TABLE x;--")).toBe("'''; DROP TABLE x;--'");
    expect(sqlStr('a\u0000b')).toBe("'ab'");
    expect(sqlStr(undefined)).toBe("''");
  });
  it('sqlInt solo acepta enteros', () => {
    expect(sqlInt('123')).toBe('123');
    expect(() => sqlInt('1 OR 1=1')).toThrow();
    expect(() => sqlInt('')).toThrow();
    expect(() => sqlInt('-1')).toThrow();
  });
  it('sqlNum devuelve un numero o 0', () => {
    expect(sqlNum('12.50')).toBe('12.5');
    expect(sqlNum('1; DROP')).toBe('0');
    expect(sqlNum(undefined)).toBe('0');
  });
  it('sqlIdent valida nombres de tabla de la config', () => {
    expect(sqlIdent('in_cabecera_xml_temp')).toBe('in_cabecera_xml_temp');
    expect(() => sqlIdent('t; DROP')).toThrow();
  });
});
