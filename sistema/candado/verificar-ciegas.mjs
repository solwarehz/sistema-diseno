/**
 * CANDADO DE LAS CLASES CIEGAS.
 *
 *   node sistema/candado/verificar-ciegas.mjs
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ MIRA, Y POR QUÉ ESTE CANDADO EXISTE
 *
 * Una clase que **viaja en el paquete** y que el catálogo pinta **sólo desde el
 * guion** `<script data-vivo>`. Para cuatro candados, esa clase no existe:
 *
 *   · `verificar-empate`, `verificar-omision` y `verificar-elemento` CORTAN el
 *     documento en `<script data-vivo>`: lo que monte ese guion les es invisible.
 *   · `verificar-promesa` compara las dos hojas sobre una lista `CASOS` escrita
 *     A MANO: una pieza que no se añada ahí no se compara nunca.
 *
 * Resultado: la clase sale en la hoja de todos los productos y **ningún candado
 * ha comprobado jamás que el paquete la entregue igual que el catálogo**.
 *
 * ESTO HA PASADO TRES VECES:
 *   · v1.133.0 — el carril entero, los tonos de burbuja y dos de superficie.
 *     Se arregló en la v1.134.0 añadiendo marcado estático y 22 casos.
 *   · v1.136.0 — `tbl-marco` y `tbl-crece`. Arreglado en la v1.137.0.
 *   · v1.139.0 — `tbl-lleno`, `tn-densa-llena` y `car-pagina`.
 *
 * Las tres veces lo encontró una auditoría con todos los candados en verde, y
 * las tres se arregló A MANO. Un defecto que vuelve tres veces no es un
 * descuido: es un candado que falta. Éste.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(RAIZ, 'sistema', 'componentes', 'componentes.css'), 'utf8');
const html = readFileSync(join(RAIZ, 'cascaron', 'index.html'), 'utf8');
const vivo = readFileSync(join(RAIZ, 'sistema', 'cascaron', 'vivo.tsx'), 'utf8');

/* Clases que SÍ están en el marcado estático: lo único que los cuatro candados
   pueden leer. Se corta por el guion, igual que cortan ellos. */
const estatico = html.split('<script data-vivo>')[0];
const enEstatico = new Set();
for (const m of estatico.matchAll(/class="([^"]+)"/g)) {
  for (const c of m[1].split(/\s+/)) if (c) enEstatico.add(c);
}

/* Clases que el guion pinta. Se leen los `className` literales y los de
   plantilla; los trozos interpolados —`sup-${tono}`— no se pueden resolver
   aquí y se descartan, que es lo prudente: mejor no acusar que acusar mal. */
const delGuion = new Set();
for (const m of vivo.matchAll(/className=(?:"([^"]+)"|\{`([^`]*)`\})/g)) {
  const crudo = (m[1] ?? m[2] ?? '').replace(/\$\{[^}]*\}/g, ' ');
  /* Un nombre que acaba en «-» es el resto de un trozo interpolado —`sup-${t}`
     con el `${t}` quitado—: no es una clase, es media. Se descarta. */
  for (const c of crudo.split(/\s+/)) if (/^[a-z][a-z0-9-]*[a-z0-9]$/.test(c)) delGuion.add(c);
}

/** ¿La clase tiene alguna regla propia en la hoja QUE VIAJA? */
const viaja = (c) => new RegExp(`\\.${c}(?![a-z0-9-])`).test(css);

/* Deuda declarada: clases que el guion pinta, que viajan, y que NO tienen
   marcado estático por un motivo escrito. Vacía a propósito. */
const DEUDA = new Map();

const ciegas = [...delGuion].filter((c) => viaja(c) && !enEstatico.has(c)).sort();

console.log(`\n  Candado de las clases ciegas — ${delGuion.size} clases pinta el guion, `
  + `${enEstatico.size} hay en marcado estático.\n`);

const nuevas = ciegas.filter((c) => !DEUDA.has(c));
if (nuevas.length) {
  console.error(`  ${nuevas.length} clase(s) que VIAJAN y que ningún candado compara:\n`);
  for (const c of nuevas) console.error(`    .${c}`);
  console.error('\n  Las pinta el guion del catálogo y sólo el guion. Los candados');
  console.error('  del empate, la omisión y el elemento cortan el documento ahí, y');
  console.error('  el de la promesa lee una lista escrita a mano: para los cuatro,');
  console.error('  esa clase no existe. Sale en la hoja de todos los productos sin');
  console.error('  que nadie haya comprobado que se entrega igual que se enseña.\n');
  console.error('  Añade marcado ESTÁTICO al catálogo —una demo que no dependa del');
  console.error('  guion— y su caso en `verificar-promesa`. O decláralo en DEUDA');
  console.error('  con su motivo.\n');
  process.exit(1);
}

const podadas = [...DEUDA.keys()].filter((c) => !ciegas.includes(c));
if (podadas.length) {
  console.error(`  ${podadas.length} en la deuda que ya NO están ciegas. Quita su línea.\n`);
  process.exit(1);
}

console.log('  Todo lo que viaja y pinta el guion tiene también marcado estático.\n');
