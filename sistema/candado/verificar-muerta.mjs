/**
 * CANDADO DE LA DECLARACIÓN MUERTA POR ORDEN.
 *
 *   node sistema/candado/verificar-muerta.mjs
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ MIRA, Y POR QUÉ NINGÚN OTRO LO MIRABA
 *
 * Una declaración dentro de un `@media` que una regla POSTERIOR del mismo
 * archivo, con el MISMO selector y la MISMA especificidad, sobrescribe siempre.
 * No es una regla que falte ni una que sobre: es una que está escrita, que se
 * lee como intención, y que no se aplica jamás.
 *
 * Nació de R158.1. La hoja llevaba:
 *
 *     @media (max-width: 640px) { .top { flex-wrap: wrap; height: auto; } }
 *     …
 *     .top { … height: 64px; }
 *
 * El `height: auto` no se aplicaba NUNCA —empata en especificidad y la base va
 * después—, así que la barra envolvía y seguía midiendo 64 px: la segunda fila
 * quedaba catorce píxeles FUERA de la barra. Medido en el producto a 333 px.
 *
 * Y lo peor no es el defecto: es que la declaración muerta lo TAPABA. Quien
 * leyera la hoja concluiría que la barra crece, porque eso es lo que dice.
 *
 * NINGUNO DE LOS DIECIOCHO PODÍA VERLO:
 *   · `verificar-empate` compara las DOS hojas entre sí, no una consigo misma.
 *   · `verificar-cascada` resuelve la hoja a once anchos, pero mira lo que
 *     FALTA —el defecto R25 vivía en la ausencia de una regla—, no lo que
 *     sobra.
 *   · `verificar-promesa` compara catálogo contra paquete; aquí las dos hojas
 *     tienen la misma declaración muerta, así que coinciden y salen en verde.
 *
 * Se mira sólo el mismo selector exacto, porque ahí el empate es seguro. Dos
 * selectores distintos que empatan es otra pregunta, y la responde el candado
 * del empate.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOJA = join(RAIZ, 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

/* Deuda declarada: declaraciones muertas que se conocen y no se han podado, con
   su motivo. Vacía a propósito — si alguna aparece y es intencionada, se
   escribe aquí con el porqué. */
const DEUDA = new Map();

/** Corta el CSS en reglas con su selector, su bloque y si va dentro de @media. */
const reglas = [];
let i = 0;
let media = null;
let profundidad = 0;
while (i < css.length) {
  if (css.startsWith('/*', i)) { i = css.indexOf('*/', i) + 2; continue; }
  const abre = css.indexOf('{', i);
  if (abre === -1) break;
  const cabeza = css.slice(i, abre).trim();
  if (cabeza.startsWith('@media')) {
    media = cabeza;
    profundidad += 1;
    i = abre + 1;
    continue;
  }
  if (cabeza.startsWith('@')) {           // keyframes y demás: se saltan enteros
    let n = 1; let j = abre + 1;
    while (j < css.length && n > 0) { if (css[j] === '{') n++; if (css[j] === '}') n--; j++; }
    i = j;
    continue;
  }
  const cierra = css.indexOf('}', abre);
  if (cierra === -1) break;
  if (cabeza) reglas.push({ sel: cabeza, cuerpo: css.slice(abre + 1, cierra), media, orden: reglas.length });
  i = cierra + 1;
  // ¿se cerró también el @media?
  const resto = css.slice(i);
  const sig = resto.search(/\S/);
  if (profundidad > 0 && sig !== -1 && resto[sig] === '}') { media = null; profundidad -= 1; i += sig + 1; }
}

const props = (cuerpo) => [...cuerpo.matchAll(/(?:^|;)\s*([a-z-]+)\s*:/g)].map((m) => m[1]);

const muertas = [];
for (const r of reglas.filter((x) => x.media)) {
  const despues = reglas.filter((x) => !x.media && x.sel === r.sel && x.orden > r.orden);
  if (!despues.length) continue;
  const tapadas = props(r.cuerpo).filter((p) => despues.some((d) => props(d.cuerpo).includes(p)));
  for (const p of tapadas) muertas.push({ sel: r.sel, prop: p, media: r.media });
}

console.log(`\n  Candado de la declaración muerta — ${reglas.length} reglas leídas.\n`);

const nuevas = muertas.filter((m) => !DEUDA.has(`${m.sel}|${m.prop}`));
if (nuevas.length) {
  console.error(`  ${nuevas.length} declaración(es) que NO se aplican nunca:\n`);
  for (const m of nuevas) {
    console.error(`    ${m.media}`);
    console.error(`      ${m.sel} { ${m.prop}: … }  ← una regla base POSTERIOR con el mismo`);
    console.error(`      selector la sobrescribe siempre.\n`);
  }
  console.error('  No es una regla que falte: es una que está escrita, que se lee');
  console.error('  como intención, y que no se aplica jamás. Quien lea la hoja');
  console.error('  concluirá algo que no pasa. O se poda, o la base se mueve.\n');
  process.exit(1);
}

const podadas = [...DEUDA.keys()].filter((k) => !muertas.some((m) => `${m.sel}|${m.prop}` === k));
if (podadas.length) {
  console.error(`  ${podadas.length} en la deuda que YA no están muertas. Quita su línea.\n`);
  process.exit(1);
}

console.log('  Ninguna declaración dentro de un @media la mata una regla posterior.\n');
