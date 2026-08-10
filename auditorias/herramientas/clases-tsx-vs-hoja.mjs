#!/usr/bin/env node
/**
 * AUDITORÍA · clases usadas en los TSX vs clases declaradas en la hoja que viaja
 *
 *   node auditorias/herramientas/clases-tsx-vs-hoja.mjs
 *
 * Cubre el punto ciego documentado del candado de huérfanas de extraer.mjs:
 * ese candado ve `className="x"` pero NO las clases dentro de un array
 * (`className={['fc-dia', ...].join(' ')}`). Aquí se recorre el contenido
 * COMPLETO de cada className={...} con contador de llaves y se extraen todos
 * los literales de cadena que parezcan clase.
 *
 * Dos cruces:
 *   1 · emitida y sin regla  → el elemento sale SIN ESTILO donde se importe (falla)
 *   2 · declarada y jamás emitida por ningún TSX → posible divergencia
 *       catálogo↔React (informativo: hay clases legítimas solo-de-marcado-copiado)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOJA = readFileSync(join(RAIZ, 'sistema', 'componentes', 'componentes.css'), 'utf8');
const SRC = join(RAIZ, 'componentes', 'src');

const declaradas = new Set();
for (const m of HOJA.matchAll(/\.([a-z][a-z0-9_-]*)/gi)) declaradas.add(m[1]);

// extrae el contenido de className={...} respetando llaves anidadas (${...})
function zonasClassName(tsx) {
  const zonas = [];
  const re = /className=/g;
  let m;
  while ((m = re.exec(tsx))) {
    const i = m.index + m[0].length;
    if (tsx[i] === '"') {
      const fin = tsx.indexOf('"', i + 1);
      zonas.push(tsx.slice(i + 1, fin));
    } else if (tsx[i] === '{') {
      let nivel = 1, j = i + 1;
      while (j < tsx.length && nivel > 0) {
        if (tsx[j] === '{') nivel++;
        else if (tsx[j] === '}') nivel--;
        j++;
      }
      zonas.push(tsx.slice(i + 1, j - 1));
    }
  }
  return zonas;
}

const usadasGlobal = new Set();
const fallos = [];
for (const f of readdirSync(SRC).filter((x) => x.endsWith('.tsx'))) {
  const tsx = readFileSync(join(SRC, f), 'utf8');
  for (const zona of zonasClassName(tsx)) {
    const candidatas = new Set();
    if (!/["'`]/.test(zona)) {
      // className={variable} — no hay literal que auditar
      continue;
    }
    for (const lit of zona.matchAll(/["'`]([^"'`]*)["'`]/g)) {
      for (const cruda of lit[1].split(/\s+/)) {
        // plantilla `sel-op-${i}` → se audita solo si no queda cortada
        const c = cruda.includes('${') ? '' : cruda;
        if (/^[a-z][a-z0-9-]*$/.test(c)) candidatas.add(c);
      }
    }
    for (const c of candidatas) {
      usadasGlobal.add(c);
      if (!declaradas.has(c)) fallos.push([f, c]);
    }
  }
}

console.log('  CRUCE 1 · emitida sin regla (FALLA)\n');
if (fallos.length) {
  for (const [f, c] of fallos) console.log(`    ${f.padEnd(22)} .${c}`);
} else {
  console.log('    ✓ toda clase emitida tiene regla en la hoja');
}

console.log('\n  CRUCE 2 · declarada en la hoja y jamás emitida por un TSX (informativo)\n');
const nuncaEmitidas = [...declaradas].filter((c) => !usadasGlobal.has(c)).sort();
// los prefijos dinámicos (btn-, chip-, etc.) generan variantes por plantilla:
// se listan igual y se revisan a mano — mejor ruido declarado que silencio.
console.log('    ' + (nuncaEmitidas.join('\n    ') || '(ninguna)'));

console.log(`\n  ${fallos.length} fallo(s) · ${nuncaEmitidas.length} declaradas sin emisor detectado`);
process.exit(fallos.length ? 1 : 0);
