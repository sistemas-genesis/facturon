#!/usr/bin/env node
/**
 * Importa params.databases[] del proyecto legacy a config/tenants/<slug>.json (un archivo por empresa).
 * Uso:  node scripts/import-params.cjs [ruta/params.js] [--write]
 * Sin --write solo muestra que crearia (modo prueba). No modifica el params.js original.
 * Los JSON generados contienen credenciales: estan en .gitignore, permisos 600.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const write = args.includes('--write');
const src = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '../../genesis-facturon/src/libs/params.js'));
const outDir = path.resolve(process.env.TENANTS_DIR || path.join(__dirname, '../config/tenants'));

// el params.js legacy empieza con BOM: require lo tolera, pero lo leemos explicito por si acaso
const params = require(src);
const used = new Set();
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');

const result = [];
for (const d of params.databases || []) {
  let slug = slugify(d.db);
  if (used.has(slug)) slug = slugify(`${d.db}-${d.ruc}`);
  used.add(slug);

  const tenant = {
    slug,
    enabled: true,
    ruc: d.ruc,
    nombreComercial: d.nombreComercial,
    db: { host: d.host, port: Number(d.port), db: d.db, user: d.user, pass: d.pass },
    estacion: d.estacion || '',
    punto: d.punto || '',
    mail: d.mail,
    mailsDefault: d.mailsDefault,
    leyenda_catastro: d.leyenda_catastro,
    subsidio: d.subsidio,
    logo: { path: d.img, width: d.imgWidth, height: d.imgHeight },
    // RIDE, optionsRIDE y mailTemplate son globales: viven en config/app.config.json (scripts/import-app-config.cjs).
    whatsapp: d.phoneNumerId ? { phoneNumberId: d.phoneNumerId } : undefined,
  };
  Object.keys(tenant).forEach((k) => tenant[k] === undefined && delete tenant[k]);
  result.push(tenant);
}

if (write) fs.mkdirSync(outDir, { recursive: true });
for (const t of result) {
  const file = path.join(outDir, `${t.slug}.json`);
  if (write) {
    if (fs.existsSync(file)) { console.log(`= ya existe, se omite: ${file}`); continue; }
    fs.writeFileSync(file, JSON.stringify(t, null, 2), { mode: 0o600 });
    console.log(`+ creado ${file}`);
  } else {
    console.log(`(prueba) crearia ${file}  [ruc ${t.ruc}, bd ${t.db.db}@${t.db.host}:${t.db.port}]`);
  }
}
console.log(`${result.length} empresa(s) ${write ? 'procesadas' : 'detectadas; ejecute con --write para crear los archivos'}`);
