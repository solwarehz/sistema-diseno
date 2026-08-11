#!/usr/bin/env node
/**
 * AUDITORÍA · el responsive es comportamiento del componente
 *
 *   node auditorias/herramientas/responsive-vs-entrega.mjs
 *
 * La promesa responsive vive en las @media de la hoja QUE VIAJA: a cada
 * ancho, ciertas clases cambian de forma. Si una regla de @media apunta a
 * clases que ningún TSX emite, ese comportamiento está prometido y sin
 * entregar — el componente se ve igual en el teléfono que en el escritorio,
 * y nadie lo nota hasta que un producto lo monta.
 *
 * El candado de la cascada ya vigila esto PARA MARCOAPP a once anchos; esta
 * herramienta hace el barrido para todos los componentes. Mismo límite
 * declarado que sus hermanas: las clases en plantilla se ven por el literal
 * del prefijo, y las armadas en variable fuera de className se cubren
 * tomando TODOS los literales del TSX (lado conservador).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOJA = readFileSync(join(RAIZ, 'sistema', 'componentes', 'componentes.css'), 'utf8');
const SRC = join(RAIZ, 'componentes', 'src');

// ── Lado entrega: todo literal de los TSX (conservador: solo da falsos
// «entregado», nunca falsos «sin entregar» por plantilla) ──────────────────
const emitidas = new Set();
for (const f of readdirSync(SRC).filter((x) => x.endsWith('.tsx') || x.endsWith('.ts'))) {
  const tsx = readFileSync(join(SRC, f), 'utf8');
  for (const m of tsx.matchAll(/['"`]([a-z][a-z0-9 _-]*)['"`]/g))
    for (const c of m[1].split(/\s+/)) if (/^[a-z][a-z0-9-]*$/.test(c)) emitidas.add(c);
}
// Estados que pone el runtime del propio componente o el consumidor
// documentado: no son promesa incumplida.
for (const c of ['abierto', 'abierta', 'colapsado', 'activo', 'marcado']) emitidas.add(c);

// ── Lado promesa: las clases dentro de cada @media de la hoja ───────────────
const medias = [...HOJA.matchAll(/@media[^{]+\{/g)];
let i = 0;
const hallazgos = new Map(); // consulta → Set(clases sin emisor)
for (const m of medias) {
  const desde = m.index + m[0].length;
  let prof = 1, j = desde;
  while (j < HOJA.length && prof > 0) {
    if (HOJA[j] === '{') prof++;
    else if (HOJA[j] === '}') prof--;
    j++;
  }
  const cuerpo = HOJA.slice(desde, j - 1);
  const consulta = m[0].replace('{', '').trim();
  // Solo los SELECTORES: las clases citadas en un valor o comentario no son
  // promesa. Selector = lo que precede a una llave de apertura.
  for (const sel of cuerpo.matchAll(/([^{}]+)\{/g)) {
    for (const cl of sel[1].matchAll(/\.([a-z][a-z0-9_-]*)/g)) {
      if (!emitidas.has(cl[1])) {
        if (!hallazgos.has(consulta)) hallazgos.set(consulta, new Set());
        hallazgos.get(consulta).add(cl[1]);
      }
    }
  }
  i++;
}

console.log(`\n  ${medias.length} bloques @media en la hoja que viaja.\n`);
let total = 0;
for (const [consulta, clases] of hallazgos) {
  console.log(`  ${consulta}`);
  for (const c of [...clases].sort()) { console.log(`      .${c} — regla responsive sin emisor en React`); total++; }
}
console.log(total === 0
  ? '  ✓ Toda regla responsive de la hoja apunta a clases que el React emite.\n'
  : `\n  ${total} clase(s) con comportamiento responsive prometido y sin emisor. Se juzgan a mano.\n`);
