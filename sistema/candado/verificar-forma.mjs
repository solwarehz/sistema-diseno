#!/usr/bin/env node
/**
 * CANDADO DE LA FORMA — que lo público no cambie de FORMA sin decirlo
 *
 *   node sistema/candado/verificar-forma.mjs
 *   node sistema/candado/verificar-forma.mjs --sellar   (acepta la forma nueva)
 *
 * POR QUÉ EXISTE. Lo dijo Control Administrativos, y con la frase exacta:
 *
 *   «Cambiar la forma de lo exportado rompe a quien lo desarma, y el
 *    verificar-entrega nuevo comprueba que todo SALGA, no que la FORMA se
 *    mantenga.»
 *
 * Tenían razón, y el caso era suyo. Hasta la v1.66.0 el candado de ESLint era
 * un solo bloque y su proyecto copiaba a mano los cuatro campos de
 * `candado[0]`. La v1.67.0 metió el analizador delante, y con eso
 * `candado[0].rules` pasó a ser `undefined`: **la actualización habría dejado
 * el candado sin ninguna regla activa, en verde, y nadie se habría enterado**
 * — ESLint no se queja de un bloque con `rules: undefined`, sencillamente no
 * comprueba nada.
 *
 * Lo vieron porque fueron a mirar la forma antes de confiar en ella, no porque
 * algo fallara. Esa es toda la diferencia entre este candado y no tenerlo.
 *
 * QUÉ MIRA. La forma de lo que un consumidor puede desarmar:
 *   · el array que exporta `candado.eslint.config.mjs` — cuántos bloques, cuál
 *     lleva las reglas, cómo se llama cada uno;
 *   · las claves de `exports` del `package.json`, que son las rutas de
 *     importación publicadas.
 *
 * QUÉ NO PUEDE VER, dicho para que nadie le pida más de lo que mide: no
 * adivina de cuántas maneras se puede desarmar un objeto. Si alguien depende
 * del ORDEN de las claves de un objeto, o del contenido de un array anidado,
 * eso no está aquí. Cubre lo que ya rompió una vez y lo que se le parece.
 *
 * CÓMO SE CAMBIA UNA FORMA A PROPÓSITO. Con `--sellar`, que reescribe el lock.
 * El cambio queda en el diff, que es donde se ve y se discute — y entonces
 * toca decidir si va en `rompe` del registro de cambios.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const LOCK = join(AQUI, 'forma-publica.lock.json');
const sellar = process.argv.includes('--sellar');

// ── La forma de hoy ─────────────────────────────────────────────────────────

const candado = (await import(join(AQUI, 'candado.eslint.config.mjs'))).default;
const paquete = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'));

// El bloque del ANALIZADOR es condicional a propósito —solo aparece si el
// consumidor tiene `typescript-eslint`— así que no puede contar como forma: si
// contara, el lock diría una cosa dentro del contenedor y otra fuera, y un
// candado que depende de dónde se ejecute no vale. Se separa y se comprueba
// aparte: cuando exista, detrás; nunca delante de las reglas.
const ANALIZADOR = 'mmi-ds/candado-ts';
const fijos = candado.filter((b) => b.name !== ANALIZADOR);
const analizador = candado.find((b) => b.name === ANALIZADOR) ?? null;

const forma = {
  candadoEslint: {
    bloques: fijos.length,
    // El detalle por bloque, que es justo lo que se desarma.
    detalle: fijos.map((b) => ({
      name: b.name ?? null,
      tieneReglas: Boolean(b.rules),
      reglas: b.rules ? Object.keys(b.rules).sort() : [],
      files: b.files ?? null,
    })),
    // Lo que rompió: el índice del bloque que lleva las reglas.
    indiceConReglas: candado.findIndex((b) => Boolean(b.rules)),
  },
  rutasPublicadas: Object.keys(paquete.exports ?? {}).sort(),
};

// ── Contra el contrato ──────────────────────────────────────────────────────

if (sellar || !existsSync(LOCK)) {
  writeFileSync(LOCK, `${JSON.stringify({ documento: 'MMI-DS', version: VERSION, forma }, null, 2)}\n`);
  console.log(`\n  Forma sellada en ${LOCK.replace(RAIZ, '.')} — revísala en el diff.\n`);
  process.exit(0);
}

const guardada = JSON.parse(readFileSync(LOCK, 'utf8')).forma;
const dif = [];
const comparar = (a, b, ruta) => {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) comparar(a[k], b[k], `${ruta}.${k}`);
    return;
  }
  dif.push(`${ruta}\n      antes: ${JSON.stringify(a)}\n      ahora: ${JSON.stringify(b)}`);
};
comparar(guardada, forma, 'forma');

console.log(`\n  Candado de la forma — MMI-DS v${VERSION}\n`);
console.log(`  Bloques del candado de ESLint:  ${forma.candadoEslint.bloques}`);
console.log(`  Las reglas viven en el bloque:  [${forma.candadoEslint.indiceConReglas}]`);
console.log(`  Rutas publicadas:               ${forma.rutasPublicadas.length}`);
const posAnalizador = analizador ? candado.indexOf(analizador) : -1;
console.log(`  Analizador de TypeScript:       ${
  analizador ? `presente, en el bloque [${posAnalizador}]` : 'no instalado aquí — no cuenta como forma'}\n`);

if (analizador && posAnalizador === 0) {
  console.error('  El analizador está DELANTE del bloque de reglas.\n');
  console.error('  Así fue como la v1.67.0 dejó candado[0].rules en undefined.\n');
  process.exit(1);
}

if (forma.candadoEslint.indiceConReglas !== 0) {
  console.error('  El bloque de reglas ya NO es candado[0].\n');
  console.error('  Eso apaga en silencio a cualquier proyecto que copie sus campos a mano,');
  console.error('  y en verde: ESLint no se queja de un bloque con rules: undefined.\n');
  process.exit(1);
}

if (dif.length) {
  console.error(`  ${dif.length} cambio(s) de FORMA en lo que se publica:\n`);
  for (const d of dif) console.error(`    ${d}`);
  console.error('\n  Que todo SALGA no basta: quien desarma lo publicado depende de su forma.');
  console.error('  Un consumidor que copiaba candado[0] se quedó sin reglas y en verde.');
  console.error('\n  Si el cambio es a propósito: `node sistema/candado/verificar-forma.mjs --sellar`,');
  console.error('  y decide si va en `rompe` del registro de cambios. Lo que no vale es');
  console.error('  cambiar la forma sin que nadie lo vea.\n');
  process.exit(1);
}

console.log('  La forma de lo publicado no ha cambiado.\n');
