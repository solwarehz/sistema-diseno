#!/usr/bin/env node
/**
 * AUDITORÍA · promesa vs entrega — la enfermedad R34, generalizada
 *
 *   node auditorias/herramientas/promesa-vs-entrega.mjs
 *
 * El catálogo es la promesa y el componente es la entrega (R34). Esta
 * herramienta compara, POR ELEMENTO, las clases que el catálogo PINTA —en su
 * marcado estático y en las cadenas de su JS, porque la tabla se construye
 * por script— contra las clases que el componente React emite. Lo que el
 * catálogo pinta y el React no emite es promesa sin entregar, o mobiliario
 * legítimo del catálogo: la herramienta lista, el auditor juzga.
 *
 * Límite declarado: las clases armadas en variable fuera de className (pasa
 * en Migas) no se ven del lado React y pueden salir como falso «sin
 * entregar». Se marca cada familia para revisión a mano, no como veredicto.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = readFileSync(join(RAIZ, 'cascaron', 'index.html'), 'utf8');
const SRC = join(RAIZ, 'componentes', 'src');

// El catálogo entero SIN su hoja de estilos: una clase que solo vive en el
// CSS no es promesa pintada. Marcado + scripts sí lo son.
const sinCss = html.replace(/<style[\s\S]*?<\/style>/g, '');

// Elemento → prefijos, como en extraer.mjs. Elementos con React de verdad.
const ELEMENTOS = [
  ['Boton',            ['btn']],
  ['Enlace',           ['enl', 'enlace']],
  ['Campo',            ['campo', 'cg', 'msj']],
  ['SelectorBusqueda', ['sel']],
  ['Interruptor',      ['sw', 'ms']],
  ['RangoFecha',       ['fc']],
  ['Horario',          ['hor']],
  ['Chip',             ['chip']],
  ['Avatar',           ['avatar']],
  ['TarjetaPersona',   ['tp']],
  ['Tarjeta',          ['tn']],
  ['TablaDatos',       ['tb']],
  ['Paginacion',       ['pgn', 'pg-pos']],
  ['Progreso/Estados', ['pr', 'ep', 'esqueleto', 'av']],
  ['Confirmacion',     ['cf']],
  ['Dialogo',          ['dialogo']],
  ['Migas',            ['migas']],
  ['CabeceraPantalla', ['pant']],
  ['PanelBarra',       ['pb']],
  ['MarcoApp/Menu',    ['lat', 'nav', 'top', 'us', 'velo', 'badge']],
];

// Andamiaje ya decidido como solo-catálogo: no es promesa de componente.
const esAndamio = (c) =>
  /(^|-)demo(-|$)/.test(c) || /(^|-)rejilla(-\d+)?$/.test(c)
  || ['anatomia', 'tabla-manual', 'tabla-escala', 'tabla-escala-caja', 'top-cascaron', 'cat-cuerpo', 'pagina'].includes(c);

const caza = (c, p) => c === p || c.startsWith(p + '-');

// ── Lado promesa: toda clase pintada en el catálogo ─────────────────────────
// class="..." estático + cadenas del JS ('tb-x', "tb-x", `tb-x`, y las
// concatenaciones 'tb-' + tono no se resuelven: se toma el literal entero).
const pintadas = new Set();
for (const m of sinCss.matchAll(/class="([^"]+)"/g))
  for (const c of m[1].split(/\s+/)) pintadas.add(c);
for (const m of sinCss.matchAll(/['"`]([a-z][a-z0-9 _-]*)['"`]/g))
  for (const c of m[1].split(/\s+/)) if (/^[a-z][a-z0-9-]*$/.test(c)) pintadas.add(c);

// ── Lado entrega: clases que los TSX emiten ─────────────────────────────────
const emitidas = new Set();
for (const f of readdirSync(SRC).filter((x) => x.endsWith('.tsx'))) {
  const tsx = readFileSync(join(SRC, f), 'utf8');
  // TODOS los literales del TSX, no solo className: cubre las clases armadas
  // en variable (Migas) a costa de tragar algo de ruido — aquí buscamos
  // ausencias, y para una ausencia el ruido de más solo da falsos "entregado",
  // que es el lado conservador.
  for (const m of tsx.matchAll(/['"`]([a-z][a-z0-9 _-]*)['"`]/g))
    for (const c of m[1].split(/\s+/)) if (/^[a-z][a-z0-9-]*$/.test(c)) emitidas.add(c);
  for (const m of tsx.matchAll(/className=["{]([^"}]*)/g))
    for (const c of (m[1].match(/[a-z][a-z0-9-]*/g) || [])) emitidas.add(c);
}

// ── El diff por elemento ────────────────────────────────────────────────────
let total = 0;
for (const [nombre, prefijos] of ELEMENTOS) {
  const promesa = [...pintadas].filter((c) => prefijos.some((p) => caza(c, p)) && !esAndamio(c));
  const sinEntrega = promesa.filter((c) => !emitidas.has(c)).sort();
  if (sinEntrega.length) {
    console.log(`\n  ${nombre}`);
    for (const c of sinEntrega) { console.log(`      .${c}`); total++; }
  }
}
console.log(`\n  ${total} clase(s) que el catálogo pinta y ningún TSX emite. La lista es`);
console.log('  materia prima: cada una se juzga a mano — promesa sin entregar,');
console.log('  mobiliario del catálogo, o hueco ya declarado en el contrato.\n');
