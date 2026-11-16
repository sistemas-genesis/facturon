import { BadRequestException } from '@nestjs/common';
export function sqlStr(value) {
    const clean = String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    return `'${clean.replace(/'/g, "''")}'`;
}
export function sqlInt(value, name = 'id') {
    const s = String(value ?? '');
    if (!/^\d{1,18}$/.test(s))
        throw new BadRequestException(`${name} debe ser numerico`);
    return s;
}
export function sqlNum(value) {
    const n = Number(String(value ?? '').trim());
    return Number.isFinite(n) ? String(n) : '0';
}
export function sqlIdent(value) {
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(value))
        throw new Error(`Identificador SQL invalido en la configuracion: ${value}`);
    return value;
}
//# sourceMappingURL=sql.util.js.map