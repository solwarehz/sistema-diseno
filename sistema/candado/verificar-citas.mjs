/**
 * CANDADO DE LAS CITAS DEL CONTRATO.
 *
 *   node sistema/candado/verificar-citas.mjs
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ MIRA
 *
 * `comportamiento.md` es el contrato, y **viaja en el paquete**: el consumidor
 * lo lee para saber qué le entregan. Cuando cita una declaración de CSS —
 * `object-position: 50% 30%`— esa cita tiene que existir en la hoja que de
 * verdad se entrega. Si no, el contrato promete una cosa y el paquete hace
 * otra, y gana el paquete sin que nadie se entere.
 *
 * NACIÓ DE DOS CONTRADICCIONES VIVAS A LA VEZ, las dos encontradas el mismo día
 * por auditorías y ninguna por un candado:
 *
 *   · La regla 13 titulaba «`.avatar img` encuadra a `50% 30%`» cuando la hoja
 *     entregaba `50% 10%` — y el cuerpo de la propia regla decía 10 doce
 *     palabras más abajo. La v1.144.0 bajó el valor y no tocó el titular.
 *   · Una regla de `RangoFecha` afirmaba «declara su propio `line-height: 20px`:
 *     con sus 16 de relleno», y **ninguno de los dos números existe**: la hoja
 *     dice 18 de interlineado y 8 de relleno.
 *
 * `verificar-contrato` no podía verlo: comprueba que toda regla `Obligatorio`
 * TENGA prueba, no que lo que dice sea cierto. Y las pruebas de una regla se
 * escriben a propósito flojas en el valor —para poder afinarlo sin falsos
 * rojos—, que es justo lo que dejó pasar el 30 %.
 *
 * Se miran sólo las propiedades de la lista: son las que describen tamaño,
 * recorte y maquetación, donde una cifra equivocada cambia lo que el
 * consumidor construye. Una lista cerrada y no «toda cadena con dos puntos»
 * porque el contrato está lleno de prosa que se le parece.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const md = readFileSync(join(RAIZ, 'sistema/componentes/comportamiento.md'), 'utf8');
const css = readFileSync(join(RAIZ, 'sistema/componentes/componentes.css'), 'utf8');

const PROPIEDADES = [
  'object-position', 'object-fit', 'line-height', 'max-width', 'min-width',
  'aspect-ratio', 'grid-template-columns', 'grid-template-rows', 'overflow',
  'overflow-y', 'overflow-x', 'flex-wrap', 'height', 'min-height', 'gap',
  'border-radius', 'text-overflow', '-webkit-line-clamp', 'display', 'position',
  'align-content', 'margin-inline', 'font-size', 'font-weight', 'justify-content',
];

/* Citas que NO están en la hoja por un motivo escrito: un valor probado y
   rechazado, un defecto histórico que se cuenta, lo que hace el navegador por
   omisión. Vacía a propósito. */
const DEUDA = new Map([
  /* Es la cita de la retractación: el contrato repite el valor FALSO para
     contar que lo era. Sustituirlo por el bueno borraría la corrección y
     dejaría el texto diciendo una obviedad. Es la misma regla que este
     repositorio ya tiene escrita para los hexadecimales probados y rechazados:
     un valor citado como equivocado, con su medición al lado, no se sustituye
     por el correcto. */
  ['line-height: 20px', 'RangoFecha: valor que el contrato afirmó y la hoja nunca tuvo; se cita para retractarlo'],
]);

const norm = (t) => t.replace(/\s+/g, ' ').trim();
const cssN = norm(css);

const citas = [...md.matchAll(/`([a-z-]+)\s*:\s*([^`]+)`/g)]
  .map((m) => ({ prop: m[1], texto: norm(`${m[1]}: ${m[2]}`) }))
  .filter((c) => PROPIEDADES.includes(c.prop));

const rotas = [...new Map(
  citas.filter((c) => !cssN.includes(c.texto)).map((c) => [c.texto, c]),
).values()];

console.log(`\n  Candado de las citas del contrato — ${citas.length} declaraciones citadas.\n`);

const nuevas = rotas.filter((c) => !DEUDA.has(c.texto));
if (nuevas.length) {
  console.error(`  ${nuevas.length} cita(s) del contrato que la hoja NO entrega:\n`);
  for (const c of nuevas) console.error(`    «${c.texto}»`);
  console.error('\n  El contrato VIAJA en el paquete: el consumidor lo lee para');
  console.error('  saber qué le entregan. Una cita que la hoja no cumple promete');
  console.error('  una cosa y entrega otra, y gana la hoja sin que nadie se entere.');
  console.error('  Corrige la cita, o la hoja, o decláralo en DEUDA con su razón.\n');
  process.exit(1);
}

const podadas = [...DEUDA.keys()].filter((t) => !rotas.some((c) => c.texto === t));
if (podadas.length) {
  console.error(`  ${podadas.length} en la deuda que ya SÍ están en la hoja. Quita su línea.\n`);
  process.exit(1);
}

console.log('  Todo lo que el contrato cita, la hoja lo entrega.\n');
