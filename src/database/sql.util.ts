import { BadRequestException } from '@nestjs/common';

/**
 * El driver de Sybase (node-sybase) no admite parametros: todo valor que llegue del exterior
 * debe pasar por estas funciones antes de concatenarse en el SQL.
 */

/** Literal de texto: 'valor' con las comillas internas duplicadas. Sin NUL ni caracteres de control. */
export function sqlStr(value: unknown): string {
  // eslint-disable-next-line no-control-regex
  const clean = String(value ?? '').replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
    '',
  );
  return `'${clean.replace(/'/g, "''")}'`;
}

/** Entero positivo (ids, sesion). Un valor no numerico es un 400, nunca llega al SQL. */
export function sqlInt(value: unknown, name = 'id'): string {
  const s = String(value ?? '');
  if (!/^\d{1,18}$/.test(s))
    throw new BadRequestException(`${name} debe ser numerico`);
  return s;
}

/** Numero decimal tomado de un XML (precios, cantidades). NaN/inyeccion => 0. */
export function sqlNum(value: unknown): string {
  const n = Number(String(value ?? '').trim());
  return Number.isFinite(n) ? String(n) : '0';
}

/** Identificador de tabla/columna que viene de la config (nunca del request). */
export function sqlIdent(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(value))
    throw new Error(`Identificador SQL invalido en la configuracion: ${value}`);
  return value;
}
