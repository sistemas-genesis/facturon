import { UploaderService } from './uploader.service.js';

const defaultTables = {
  file: 'archivo_txt',
  cabecera: 'in_cabecera_xml_temp',
  movimiento: 'in_movimiento_xml_temp',
};
// misma mezcla que TenantSettings: lo de la empresa o el default global
const settings = {
  for: (t: { tables?: typeof defaultTables }) => ({
    tables: t.tables ?? defaultTables,
  }),
} as never;
const svc = new UploaderService(settings, {} as never, {} as never, {} as never);
const tables = svc.tables({} as never);

describe('UploaderService', () => {
  it('clavesDeArchivo: solo facturas (01) con autorizacion de 37 o 49 caracteres', () => {
    const f1 = '0110202401149082672200120010010000001231234567818';
    const nc = '0110202404149082672200120010010000001231234567818';
    const aut = '1234567890123456789012345678901234567';
    const out = svc.clavesDeArchivo(
      `a\t${f1}\t${aut}\r\nb\t${nc}\t${aut}\nc\t${f1}\tcorta\n`,
    );
    expect(out).toEqual([{ clave_acceso: f1, autorizacion: aut }]);
  });

  it('las tablas temporales salen de la empresa y, si no las define, del default global', () => {
    expect(svc.tables({} as never).cabecera).toBe('in_cabecera_xml_temp');
    const propias = {
      file: 'f_x',
      cabecera: 'c_x',
      movimiento: 'm_x',
    };
    expect(svc.tables({ tables: propias } as never)).toEqual(propias);
    expect(() =>
      svc.tables({ tables: { ...propias, file: 'x; DROP TABLE y' } } as never),
    ).toThrow();
  });

  it('descripcion con comillas no rompe el SQL (compra individual)', () => {
    const r = {
      factura: {
        infoTributaria: [
          {
            razonSocial: ["O'BRIEN SA"],
            dirMatriz: ['Av. Ñandú'],
            ruc: ['1'],
            estab: ['001'],
            ptoEmi: ['001'],
            secuencial: ['1'],
            claveAcceso: ['K'],
          },
        ],
        infoFactura: [{ fechaEmision: ['01/10/2024'] }],
        detalles: [
          {
            detalle: [
              {
                codigoPrincipal: ['P'],
                descripcion: ["Caja 'x'"],
                cantidad: ['1'],
                precioUnitario: ['2'],
                descuento: ['0'],
                precioTotalSinImpuesto: ['2'],
                impuestos: [
                  {
                    impuesto: [
                      { valor: ['0.30'], descuentoAdicional: ['1.5'] },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const sql = svc.sqlCompraIndividual(r, '9', 'CLAVE', tables);
    expect(sql).toContain("'O''BRIEN SA'");
    expect(sql).toContain("'Av. Nandu'");
    expect(sql).toContain("'Caja x'");
    expect(sql).toContain(', 1.5);'); // descuento_adicional sumado como numero
    expect(sql.indexOf('in_cabecera_xml_temp')).toBeLessThan(
      sql.indexOf('in_movimiento_xml_temp'),
    );
  });
});
