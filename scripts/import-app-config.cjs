#!/usr/bin/env node
/**
 * Genera config/app.config.json (server + defaults globales) a partir del params.js del proyecto legacy:
 * soap, genesisIp, tablas, catalogos SRI, mailTask, RIDE y plantilla de correo.
 * Uso:  node scripts/import-app-config.cjs [ruta/params.js] [--write]
 * Sin --write solo muestra el resultado (sin secretos). No pisa un app.config.json existente.
 * Lo que NO se importa y debe definirse a mano: defaults.whatsapp.baseUrl (el legacy la leia de WHATSAPP_BASE_URL del .env; se usa esa variable si existe).
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const write = args.includes('--write');
const src = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '../../genesis-facturon/src/libs/params.js'));
const out = path.resolve(process.env.APP_CONFIG_FILE || path.join(__dirname, '../config/app.config.json'));
const p = require(src);

const cfg = {
  server: {
    host: '127.0.0.1',
    port: 3090,
    tenantsDir: './config/tenants',
    logsDir: './logs',
    logLevel: 'info',
    logRetentionDays: 30,
    bodyLimit: '500mb',
    publicDir: './public',
    pdfDir: './tmp/pdf',
    pdfTtlMs: 30000,
    publicIpUrl: 'https://api.ipify.org',
  },
  defaults: {
    soap: p.soap,
    genesisIp: p.genesisIp,
    facturonURL: p.facturonURL,
    whatsapp: { baseUrl: process.env.WHATSAPP_BASE_URL || 'http://whatsapp.example.com:5822' },
    tables: p.tables,
    sri: p.sri,
    mailTask: p.mailTask,
    ride: { optionsRIDE: p.optionsRIDE, RIDE: p.RIDE, mailTemplate: p.mailTemplate },
  },
};

if (!write) {
  const safe = { ...cfg, defaults: { ...cfg.defaults, ride: { ...cfg.defaults.ride, mailTemplate: `(${cfg.defaults.ride.mailTemplate.length} caracteres)` } } };
  console.log(JSON.stringify(safe, null, 2));
  console.log(`\n(prueba) crearia ${out}; ejecute con --write`);
} else if (fs.existsSync(out)) {
  console.log(`= ya existe, se omite: ${out}`);
} else {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(cfg, null, 2) + '\n', { mode: 0o600 });
  console.log(`+ creado ${out} (permisos 600). Revise defaults.whatsapp.baseUrl.`);
}
