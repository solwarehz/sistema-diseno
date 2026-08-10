#!/usr/bin/env node
/**
 * AUDITOR DEL CASCARÓN
 *
 *   node sistema/candado/auditar-cascaron.mjs
 *
 * Comprueba que el catálogo use SOLO lo que el sistema define. Un sistema de
 * diseño cuyo propio catálogo se salta las reglas no es un sistema: es una
 * colección de sugerencias.
 *
 * Revisa cinco cosas sobre `cascaron/index.html`:
 *   1 · Color        todo color viene de un token
 *   2 · Tipografía   solo los pasos de la escala y los cuatro pesos
 *   3 · Espaciado    múltiplos de 4
 *   4 · Radio        solo los radios definidos
 *   5 · Familia      solo IBM Plex Sans y Mono
 *
 * Sale con código 1 si hay hallazgos. Lo que el sistema aún no define se
 * reporta aparte como PENDIENTE, y no bloquea.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { semanticos, marca } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(AQUI, '..', '..', 'cascaron', 'index.html'), 'utf8');
const css = html.split('<style>')[1].split('</style>')[0];

// ── Lo que el sistema define ────────────────────────────────────────────────

const TOKENS = new Set([...Object.keys(semanticos), ...Object.keys(marca)]);

// §3.4 escala del sistema y §3.3 escala de landing
const ESCALA = new Set([56, 34, 28, 24, 20, 19, 16, 15, 13, 12]);
// §3.2 — cuatro pesos y ninguno más
const PESOS = new Set([400, 500, 600, 700]);
// Radios definidos en el preset: tarjeta 6px, chip 3px. 50% para círculos.
// 999px es la PASTILLA: no es una esquina redondeada sino una forma —el
// interruptor y las etiquetas con forma de cápsula—. Se admite como valor del
// sistema, no como número suelto.
const RADIOS = new Set([3, 6, 999]);

// Bloques donde SÍ se permiten literales: son las definiciones, no el consumo.
const ES_DEFINICION = (sel) => /^:root|\[data-tema/.test(sel.trim());

// ── Troceado ────────────────────────────────────────────────────────────────

const bloques = css.split('}').map((b) => {
  const [sel, decl] = [b.split('{')[0] || '', b.split('{')[1] || ''];
  return { sel: sel.trim().replace(/\s+/g, ' '), decl };
});

const sinURI = (d) => d.replace(/url\("data:[^"]*"\)/g, 'URI');
const corto = (s) => (s.length > 46 ? s.slice(0, 43) + '…' : s);

const hallazgos = { color: [], tipo: [], espacio: [], radio: [], familia: [], movimiento: [] };
const pendientes = new Map();

const anota = (lista, sel, msg) => lista.push(`${corto(sel).padEnd(46)} ${msg}`);
const pendiente = (que, donde) => {
  if (!pendientes.has(que)) pendientes.set(que, new Set());
  pendientes.get(que).add(donde);
};

for (const { sel, decl } of bloques) {
  if (!sel || sel.startsWith('/*') || sel.startsWith('@')) continue;
  const d = sinURI(decl);

  // 1 · Color ───────────────────────────────────────────────────────────────
  if (!ES_DEFINICION(sel)) {
    for (const m of d.match(/#[0-9a-fA-F]{3,8}\b/g) || []) anota(hallazgos.color, sel, `hex crudo ${m}`);
    for (const m of d.match(/\brgba?\([^)]*\)/g) || []) {
      // Dos huecos reconocidos del sistema. Se reportan como pendientes, no
      // como incumplimientos: no se puede exigir un token que no existe.
      if (/box-shadow[^;]*rgba/.test(d)) pendiente('Elevación — el sistema no define sombras', sel);
      else if (/rgba\(255,\s*255,\s*255/.test(m) && /\.lat|\.nav-|\.pt-|marco/.test(sel))
        pendiente('Capas sobre el marco — separador, texto atenuado y punto tenue', sel);
      else anota(hallazgos.color, sel, `rgba() ${m.slice(0, 22)}`);
    }
    for (const m of d.match(/\bvar\(--([a-z0-9-]+)\)/g) || []) {
      const t = m.slice(6, -1);
      // sombra/canto son la elevación; dur/curva/permanencia, el movimiento
      // (R27). No son tokens de color pero sí del sistema, con su definición
      // en el mismo :root que las sombras.
      if (!TOKENS.has(t) && !/^(sombra|canto|dur|curva|permanencia)(-|$)/.test(t)) anota(hallazgos.color, sel, `token inexistente --${t}`);
    }
  }

  // 2 · Tipografía ──────────────────────────────────────────────────────────
  for (const m of [...d.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)]) {
    const n = parseFloat(m[1]);
    if (!ESCALA.has(n)) {
      if (n < 12) pendiente('Escala por debajo de 12px (etiquetas de catálogo)', sel);
      else anota(hallazgos.tipo, sel, `tamaño ${n}px fuera de la escala`);
    }
  }
  for (const m of [...d.matchAll(/font-weight\s*:\s*(\d+)/g)]) {
    const n = parseInt(m[1], 10);
    if (!PESOS.has(n)) anota(hallazgos.tipo, sel, `peso ${n} prohibido (§3.2)`);
  }

  // 3 · Espaciado ───────────────────────────────────────────────────────────
  for (const h of [...d.matchAll(/(padding|margin|gap)(-[a-z]+)?\s*:\s*([^;]+)/g)]) {
    for (const v of h[3].match(/\d+(?:\.\d+)?px/g) || []) {
      const n = parseFloat(v);
      if (n !== 0 && n % 4 !== 0) anota(hallazgos.espacio, sel, `${h[1]}${h[2] || ''}: ${n}px`);
    }
  }

  // 4 · Radio ───────────────────────────────────────────────────────────────
  for (const h of [...d.matchAll(/border-radius\s*:\s*([^;]+)/g)]) {
    if (/%/.test(h[1])) continue; // círculos
    for (const v of h[1].match(/\d+(?:\.\d+)?px/g) || []) {
      const n = parseFloat(v);
      if (n !== 0 && !RADIOS.has(n)) {
        if (n === 4) pendiente('Radio de 4px (control): el sistema define 3 y 6', sel);
        else anota(hallazgos.radio, sel, `radio ${n}px no definido`);
      }
    }
  }

  // 5 · Familia ─────────────────────────────────────────────────────────────
  for (const h of [...d.matchAll(/font-family\s*:\s*([^;]+)/g)]) {
    if (!/IBM Plex (Sans|Mono)|inherit/.test(h[1])) anota(hallazgos.familia, sel, `familia ${h[1].trim().slice(0, 30)}`);
  }

  // 6 · Movimiento ──────────────────────────────────────────────────────────
  // R27: el tiempo también es del sistema. Toda duración de transition y
  // animation pasa por var(--dur-*); un literal suelto es la misma deriva que
  // un hex a mano. `0s` se admite: no es tiempo, es el truco de la visibilidad
  // diferida (`transition: visibility 0s var(--dur-media)`).
  if (!ES_DEFINICION(sel)) {
    for (const h of [...d.matchAll(/(transition|animation)(-[a-z-]+)?\s*:\s*([^;]+)/g)]) {
      for (const v of h[3].match(/(?<![\w.-])\d*\.?\d+m?s\b/g) || []) {
        if (parseFloat(v) === 0) continue;
        anota(hallazgos.movimiento, sel, `${h[1]}${h[2] || ''}: ${v} sin token de duración`);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Y LOS ATRIBUTOS `style=` DEL MARCADO.
//
// Hasta aquí el auditor solo leía la hoja de estilos, y eso dejaba un agujero
// del tamaño de lo que se escribe en línea. Se midió: **once espaciados fuera
// de la rejilla de 4 y cinco pesos prohibidos** llevaban meses ahí, en
// atributos `style=`, mientras el auditor decía cero.
//
// Es el mismo fallo que ya cerró el candado de color, que también empezó
// mirando solo la hoja. Un auditor que revisa una parte y reporta cero da
// MENOS confianza que ninguno, porque el cero se cree.
//
// Los pesos prohibidos del muestrario tipográfico se exceptúan a mano: esa
// página existe para ENSEÑAR cuáles no se usan, y sin ellos no puede.
// ─────────────────────────────────────────────────────────────────────────────

const marcado = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
const MUESTRARIO_PESOS = /class="peso-/;

for (const m of marcado.matchAll(/(<[^>]*?)style="([^"]*)"/g)) {
  const decl = m[2];
  const contexto = m[1];
  const donde = `style= (${decl.slice(0, 34)}…)`;

  for (const h of [...decl.matchAll(/(padding|margin|gap)(-[a-z]+)?\s*:\s*([^;]+)/g)]) {
    for (const v of h[3].match(/\d+(?:\.\d+)?px/g) || []) {
      const n = parseFloat(v);
      if (n !== 0 && n % 4 !== 0) anota(hallazgos.espacio, donde, `${h[1]}${h[2] || ''}: ${n}px`);
    }
  }

  for (const h of [...decl.matchAll(/font-weight\s*:\s*(\d+)/g)]) {
    if (PESOS.has(Number(h[1]))) continue;
    // El muestrario de pesos ENSEÑA los prohibidos. Sin ellos no se ve por qué
    // no se usan.
    if (MUESTRARIO_PESOS.test(contexto)) continue;
    anota(hallazgos.tipo, donde, `peso ${h[1]} fuera de los cuatro`);
  }

  for (const h of [...decl.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)]) {
    if (!ESCALA.has(Number(h[1]))) anota(hallazgos.tipo, donde, `tamaño ${h[1]}px fuera de la escala`);
  }

  for (const v of decl.match(/#[0-9a-fA-F]{3,8}\b/g) || []) {
    anota(hallazgos.color, donde, `${v} en un atributo style`);
  }
}

// ── Reporte ─────────────────────────────────────────────────────────────────

const TITULOS = {
  color: 'COLOR — todo color viene de un token',
  tipo: 'TIPOGRAFÍA — pasos de la escala y cuatro pesos',
  espacio: 'ESPACIADO — múltiplos de 4',
  radio: 'RADIO — solo los definidos',
  familia: 'FAMILIA — solo IBM Plex',
  movimiento: 'MOVIMIENTO — toda duración viene de un token',
};

console.log(`\n  Auditoría del cascarón — ${(html.length / 1024).toFixed(0)} KB, ${bloques.length} reglas\n`);

let total = 0;
for (const k of Object.keys(hallazgos)) {
  const l = hallazgos[k];
  total += l.length;
  console.log(`  ${l.length === 0 ? '✓' : '✗'} ${TITULOS[k].padEnd(48)} ${l.length}`);
  l.slice(0, 8).forEach((x) => console.log(`      ${x}`));
  if (l.length > 8) console.log(`      … y ${l.length - 8} más`);
}

if (pendientes.size) {
  console.log('\n  PENDIENTE de definir en el sistema — no bloquea:\n');
  for (const [que, donde] of pendientes) {
    console.log(`    · ${que}`);
    console.log(`      usado en ${donde.size} regla(s)`);
  }
}

console.log(`\n  Hallazgos que bloquean: ${total}\n`);
if (total) process.exit(1);
