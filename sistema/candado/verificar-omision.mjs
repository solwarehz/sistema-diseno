#!/usr/bin/env node
/**
 * CANDADO DE LA OMISIÓN — el catálogo enseña lo que se ENTREGA
 *
 *   node sistema/candado/verificar-omision.mjs
 *
 * Lo pidió Control Administrativos V2.0 (R104), y lo pidió como regla general
 * después de perder una tarde con un caso concreto:
 *
 *   «Si una prop cambia lo que se VE y tiene un valor por omisión, el catálogo
 *    debería enseñar el valor por omisión. Hoy enseña solo la excepción.»
 *
 * QUÉ PASÓ. `conLupa` vale `false` por omisión desde R100, así que lo que
 * recibe un consumidor sin pedir nada es el selector SIN lupa. Pero las SEIS
 * demostraciones del catálogo llevaban `sel-con-lupa` y ninguna enseñaba el
 * estado por omisión. Compararon su pantalla contra el catálogo y concluyeron
 * que al componente le faltaba CSS —«no tiene la lupa»—. No era cierto: estaban
 * pintando las clases exactas contra la hoja exacta. **El catálogo no daba
 * forma de comprobarlo.**
 *
 * POR QUÉ NO LO CAZABA NINGUNO DE LOS OTROS, que es lo que justifica uno nuevo.
 * El de la promesa compara las propiedades de lo que SE PINTA; el del elemento,
 * las etiquetas de lo que se pinta; el del empate, el orden de reglas que
 * casan sobre lo que se pinta. Los tres miran lo pintado. Esto era una variante
 * que existe en el código y **no se pintaba en ninguna demo**: no hay nada que
 * comparar, y por eso los tres salían en verde con el defecto delante.
 *
 * QUÉ COMPRUEBA, y sale del marcado, no de una lista. Toda regla de la hoja que
 * exija DOS clases en el mismo elemento —`.sel-caja.sel-con-lupa`— declara un
 * MODIFICADOR sobre una BASE. Si el catálogo enseña esa base **siempre** con su
 * modificador y **nunca** sin él, el estado por omisión no se ve en ninguna
 * parte y nadie puede compararlo.
 *
 * QUÉ NO COMPRUEBA, y conviene decirlo: que el valor por omisión del componente
 * sea de verdad «sin el modificador». Eso vive en el TSX y aquí no se lee. Lo
 * que este candado garantiza es más modesto y aun así es lo que faltaba: que
 * **las dos caras de una variante se puedan mirar**.
 *
 * Cálculo puro. No toca red. No escribe nada.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

const css = readFileSync(join(RAIZ, 'sistema/componentes/componentes.css'), 'utf8');
const html = readFileSync(join(RAIZ, 'cascaron/index.html'), 'utf8');

/**
 * PARES QUE NO SE PUEDEN SEPARAR, con su razón.
 *
 * Son bases que de verdad no existen sin su modificador — no un descuido del
 * catálogo. Cada línea lleva por qué, y el candado **falla si sobra**: el día
 * que una de estas bases se enseñe sola, hay que quitar su línea. Una lista de
 * excepciones que nadie poda vuelve a ser el inventario a mano de siempre, que
 * es la trampa que este repositorio ya conoce.
 */
const INSEPARABLES = new Map([
  // (vacía hoy: las 80 reglas compuestas de la hoja pasan sin excepción)
]);

// ── Los pares BASE + MODIFICADOR que declara la hoja ────────────────────────
// `.a.b` en un selector es «esta regla solo aplica si el elemento lleva las
// dos». La primera es la base; la segunda, lo que se le añade.
const pares = new Set();
for (const m of css.matchAll(/\.([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)(?![a-z0-9-])/g)) {
  pares.add(`${m[1]} ${m[2]}`);
}

// ── Qué combinaciones de clases existen DE VERDAD en el catálogo ────────────
const combos = [...html.matchAll(/class="([^"]+)"/g)].map((m) => m[1].split(/\s+/));

const soloConModificador = [];
const sobran = [];

for (const par of pares) {
  const [base, mod] = par.split(' ');
  const conLasDos = combos.some((c) => c.includes(base) && c.includes(mod));
  const soloLaBase = combos.some((c) => c.includes(base) && !c.includes(mod));

  // Si la variante ni siquiera se pinta, no hay nada que comparar aquí: eso lo
  // vigila el candado de huérfanas por el otro lado.
  if (!conLasDos) continue;

  if (!soloLaBase && !INSEPARABLES.has(par)) soloConModificador.push(par);
  if (soloLaBase && INSEPARABLES.has(par)) sobran.push(par);
}

console.log(`\n  Candado de la omisión — MMI-DS v${VERSION}\n`);
console.log(`  Reglas que exigen dos clases:  ${pares.size}`);
console.log(`  Excepciones declaradas:        ${INSEPARABLES.size}`);

if (soloConModificador.length) {
  console.error(`\n  ${soloConModificador.length} base(s) que el catálogo SOLO enseña con su modificador:\n`);
  for (const par of soloConModificador) {
    const [base, mod] = par.split(' ');
    console.error(`    .${base}  nunca se ve sin  .${mod}`);
  }
  console.error('\n  El estado por omisión no se puede mirar en ninguna demostración, así');
  console.error('  que nadie puede comprobar si su pantalla coincide con lo entregado.');
  console.error('  Enseña las dos: la de por omisión primero, y la variante al lado con');
  console.error('  su caso escrito. Si esa base de verdad no existe sola, decláralo en');
  console.error('  INSEPARABLES con su razón.\n');
}

if (sobran.length) {
  console.error(`\n  ${sobran.length} excepción(es) que ya no hacen falta:\n`);
  for (const par of sobran) console.error(`    ${par} — el catálogo ya la enseña sola. Quita su línea.`);
  console.error('');
}

if (soloConModificador.length || sobran.length) process.exit(1);

console.log('\n  Toda variante se puede comparar contra su estado por omisión.\n');
