#!/usr/bin/env node
/**
 * CANDADO DEL EMPATE — que el ORDEN no decida cosas distintas en cada hoja
 *
 *   node sistema/candado/verificar-empate.mjs
 *
 * POR QUÉ EXISTE. Lo encontró la comprobación de R86: al montar el mismo
 * marcado con las dos hojas y compararlo en un navegador, el filtro de columna
 * de la tabla salía a **12px y 26,73px de alto** con la hoja entregada y a
 * **13px y 36,18px** con la del catálogo. Ninguna regla faltaba y ninguna
 * sobraba: las mismas reglas, en distinto ORDEN.
 *
 *   .tb-f { font-size: 12px }      una clase → especificidad (0,1,0)
 *   .campo { font-size: 13px }     una clase → especificidad (0,1,0)
 *
 * Cuando dos reglas empatan en especificidad, gana **la última**. Y el
 * extractor agrupa por elemento —Campo de texto, Tabla de datos…—, así que al
 * reagrupar **invierte el orden relativo** de reglas que en el catálogo iban al
 * revés. El empate se resuelve distinto a cada lado y nadie se entera.
 *
 * QUÉ NO PODÍA VERLO, y por qué hacía falta uno más:
 *
 *   · El candado de la PROMESA compara elementos de una lista escrita a mano.
 *     El filtro con sus dos clases (`class="campo tb-f"`) no estaba en ella, y
 *     lo que no está en la lista no se compara.
 *   · El de la CASCADA resuelve la hoja que viaja contra sí misma: mira que lo
 *     emitido reciba lo que debe, no que las DOS hojas coincidan.
 *   · El del ELEMENTO compara qué etiqueta emite cada lado, no qué valor gana.
 *
 * QUÉ HACE. Para cada par de reglas que (a) empatan en especificidad, (b)
 * declaran la misma propiedad con distinto valor, y (c) pueden caer sobre el
 * MISMO elemento, comprueba que el ganador sea el mismo en las dos hojas.
 *
 * (c) es la parte que lo hace útil y no ruidoso. Sin ella salen 25.823 pares
 * —`.sr-solo` contra `.nav-grupo` y demás parejas que no coinciden jamás— y una
 * lista así no se lee: se ignora. Las combinaciones se leen del marcado REAL,
 * el del catálogo y el que emiten los componentes. Un empate entre dos clases
 * que nunca van juntas no le pasa a nadie.
 *
 * LÍMITES, declarados:
 *   · Solo mira selectores de una clase (`.campo`, `select.tb-f`), que son los
 *     que se COMBINAN en un elemento por composición. Un empate entre dos
 *     selectores de descendencia queda fuera.
 *   · Las combinaciones salen del marcado escrito. Una que el producto arme en
 *     una variable no se ve desde aquí — el mismo límite que el candado de las
 *     clases huérfanas, y por la misma razón.
 *   · No mira dentro de @media ni los estados (`:hover`, `:disabled`).
 *   · **Se salta las declaraciones que el troceador parte mal.** `parsear`
 *     corta por `;` sin mirar si está DENTRO de unas comillas, y los seis
 *     `background-image: url("data:image/svg+xml;utf8,…")` del sistema salen
 *     partidos en dos: un `background-image` truncado y una propiedad que se
 *     llama `utf8,<svg xmlns='http`. Aquí se descartan por nombre imposible,
 *     porque comparar un valor cortado no dice nada. **El defecto es del
 *     troceador y lo comparten los candados de la cascada y de la promesa**:
 *     ahí no da falso rojo —el corte es igual en las dos hojas— pero sí deja
 *     un punto ciego en el icono del select y el del calendario, que es
 *     justo donde ya hubo un defecto en la v1.28.0. Declarado y pendiente.
 *
 * Cálculo puro. No toca red. No escribe nada.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';
import { parsear, especificidad } from './verificar-cascada.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

const html = readFileSync(join(RAIZ, 'cascaron', 'index.html'), 'utf8');
const promesa = parsear(html.split('<style>')[1].split('</style>')[0]);
const entrega = parsear(readFileSync(join(RAIZ, 'sistema/componentes/componentes.css'), 'utf8'));

// ── Las combinaciones de clases que EXISTEN ─────────────────────────────────

const juntas = new Set();
const anotar = (lista) => {
  const c = lista.filter((x) => /^[a-z][a-z0-9-]*$/.test(x));
  for (let i = 0; i < c.length; i++) {
    for (let j = i + 1; j < c.length; j++) juntas.add([c[i], c[j]].sort().join('|'));
  }
};
for (const m of html.matchAll(/class="([^"]+)"/g)) anotar(m[1].split(/\s+/));
for (const m of html.matchAll(/class='([^']+)'/g)) anotar(m[1].split(/\s+/));

const dirComponentes = join(RAIZ, 'componentes', 'src');
if (existsSync(dirComponentes)) {
  for (const f of readdirSync(dirComponentes).filter((f) => /\.tsx$/.test(f))) {
    const src = readFileSync(join(dirComponentes, f), 'utf8');
    for (const m of src.matchAll(/className=\{?\[([^\]]*)\]/g)) {
      anotar([...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).flatMap((s) => s.split(/\s+/)));
    }
    for (const m of src.matchAll(/className="([^"]+)"/g)) anotar(m[1].split(/\s+/));
  }
}

// ── Índice de reglas de una sola clase ──────────────────────────────────────

const esSimple = (s) => /^[a-z]*\.[a-z][a-z0-9-]*$/.test(s.trim());
const claseDe = (s) => s.trim().replace(/^[a-z]*\./, '');
/** El tipo de elemento del selector, si lo lleva: `select.campo` → `select`. */
const tipoDe = (s) => (s.trim().match(/^([a-z]+)\./) || [, ''])[1];
/** Un nombre que CSS podría tener. Ver el límite del troceador, arriba. */
const esPropiedad = (p) => /^-{0,2}[a-z][a-z0-9_-]*$/.test(p);

const indexar = (reglas) => {
  const m = new Map();
  reglas.forEach((r, i) => {
    if (r.media?.length) return;
    if (/:(hover|focus|active|disabled|checked|not|where|is|nth)/.test(r.sel)) return;
    for (const parte of r.sel.split(',').map((x) => x.trim())) {
      if (!esSimple(parte)) continue;
      for (const [prop] of r.decl) {
        if (!esPropiedad(prop)) continue;
        const k = `${parte}|${prop}`;
        // La PRIMERA declaración fija la posición desde la que se compara: si
        // una hoja repite la propiedad, la última gana igual en las dos.
        if (!m.has(k)) m.set(k, { orden: i, esp: especificidad(parte), valor: r.decl.get(prop) });
      }
    }
  });
  return m;
};

const P = indexar(promesa);
const E = indexar(entrega);

// ── Comparación ─────────────────────────────────────────────────────────────

const porPropiedad = new Map();
for (const k of P.keys()) {
  if (!E.has(k)) continue;
  const [sel, prop] = k.split('|');
  if (!porPropiedad.has(prop)) porPropiedad.set(prop, []);
  porPropiedad.get(prop).push(sel);
}

const fallos = [];
let comparados = 0;
for (const [prop, sels] of porPropiedad) {
  for (let i = 0; i < sels.length; i++) {
    for (let j = i + 1; j < sels.length; j++) {
      const a = sels[i];
      const b = sels[j];
      if (!juntas.has([claseDe(a), claseDe(b)].sort().join('|'))) continue;
      // Dos tipos distintos no son nunca el mismo elemento: un `input.fc-campo`
      // y un `select.campo` comparten la clase `campo` en el marcado, pero
      // jamás caen a la vez sobre una etiqueta.
      const ta = tipoDe(a);
      const tb = tipoDe(b);
      if (ta && tb && ta !== tb) continue;
      const pa = P.get(`${a}|${prop}`);
      const pb = P.get(`${b}|${prop}`);
      if (pa.esp !== pb.esp) continue;          // no hay empate: decide la especificidad
      if (pa.valor === pb.valor) continue;      // mismo valor: da igual quién gane
      comparados++;
      const ea = E.get(`${a}|${prop}`);
      const eb = E.get(`${b}|${prop}`);
      const ganaPromesa = pa.orden > pb.orden ? a : b;
      const ganaEntrega = ea.orden > eb.orden ? a : b;
      if (ganaPromesa === ganaEntrega) continue;
      fallos.push({
        prop, a, b,
        promesa: `${ganaPromesa} → ${(ganaPromesa === a ? pa : pb).valor}`,
        entrega: `${ganaEntrega} → ${(ganaEntrega === a ? ea : eb).valor}`,
      });
    }
  }
}

console.log(`\n  Candado del empate — MMI-DS v${VERSION}\n`);
console.log(`  Promesa (catálogo):  ${promesa.length} reglas`);
console.log(`  Entrega (viaja):     ${entrega.length} reglas`);
console.log(`  Clases que conviven: ${juntas.size} combinaciones, leídas del marcado real`);
console.log(`  Empates reales:      ${comparados} — misma especificidad, valores distintos, mismo elemento\n`);

if (fallos.length) {
  console.error(`  ${fallos.length} empate(s) que se resuelven AL REVÉS en cada hoja:\n`);
  for (const f of fallos) {
    console.error(`    ${f.a}  vs  ${f.b}   ·   ${f.prop}`);
    console.error(`      catálogo: ${f.promesa}`);
    console.error(`      entrega:  ${f.entrega}`);
  }
  console.error('\n  Las mismas reglas, en distinto orden. En el producto se ve un valor');
  console.error('  y en el catálogo otro, y ninguna regla falta ni sobra.');
  console.error('\n  El arreglo NO es darle más especificidad a la que pierde: eso');
  console.error('  congela en la hoja un valor que el catálogo quizá no muestre nunca.');
  console.error('  Mira primero cuál gana en el catálogo. Si la que pierde no se ve');
  console.error('  ahí, es una declaración MUERTA: bórrala, y el empate desaparece.\n');
  process.exit(1);
}

console.log('  Ningún empate cambia de ganador. El orden no decide cosas distintas.\n');
