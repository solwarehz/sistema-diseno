/**
 * CANDADO DEL CONTRATO DE COMPORTAMIENTO
 *
 *   node sistema/candado/verificar-contrato.mjs
 *
 * `comportamiento.md` es el documento al que se remite a todos los proyectos
 * para saber qué hace cada elemento. Hasta la v1.13.2 **prometía cinco cosas
 * que el código no hacía** —el tamaño de página recordado, las columnas
 * recordadas, la exportación a CSV y las dos de filas desplegables—, y nadie lo
 * detectó porque nada lo comprobaba.
 *
 * Lo encontró Control Administrativos V2.0, y su petición era la correcta: no
 * pedían que se implementaran hoy, pedían que **el contrato se verificara
 * contra el código antes de publicar, igual que se verifica el contraste**.
 *
 * QUÉ COMPRUEBA. Que toda regla marcada **Obligatorio** tenga al menos una
 * prueba que la respalde, localizada por su número: una prueba cuyo nombre
 * lleve `R<n>` o el número entre corchetes. Lo que no se pueda respaldar así se
 * marca **PENDIENTE**, y entonces el documento dice la verdad aunque la verdad
 * sea que falta.
 *
 * QUÉ NO COMPRUEBA, y conviene decirlo. Que la prueba pruebe lo que dice su
 * nombre. Ningún candado puede hacer eso; lo que sí impide es lo que pasó: una
 * regla obligatoria sin nada detrás. Un candado que se cree más listo de lo que
 * es hace más daño que uno que declara su alcance.
 *
 * Cálculo puro. No toca red. No escribe nada.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

const CONTRATO = join(RAIZ, 'sistema/componentes/comportamiento.md');
const PRUEBAS = join(RAIZ, 'componentes/pruebas');

if (!existsSync(CONTRATO)) {
  console.error('\n  No existe sistema/componentes/comportamiento.md\n');
  process.exit(1);
}

const md = readFileSync(CONTRATO, 'utf8');

/**
 * EL NÚMERO DE REGLA NO ES ÚNICO, y por eso hace falta decir DÓNDE buscarlo.
 *
 * La numeración reinicia en cada sección, así que «17» existe en la tabla de
 * datos y en el selector con búsqueda. Buscar `\bR17\b` en el montón de todas
 * las pruebas hacía que una regla nueva saliera respaldada por una prueba de
 * otro componente escrita meses antes: las cuatro reglas 17-20 del selector
 * habrían salido en verde con CERO pruebas nuevas, porque `MarcoApp.test.tsx`
 * y `TablaDatos.test.tsx` ya decían R17, R18, R19 y R20.
 *
 * Una sección puede declarar sus archivos de prueba con un comentario:
 *
 *     <!-- pruebas: RangoFecha.test.tsx, rango-fecha-anatomia.test.tsx -->
 *
 * Declarado, la búsqueda se limita a esos archivos y el respaldo pasa a ser
 * real. Sin declarar, se mantiene el comportamiento antiguo —y se cuenta,
 * porque una sección sin declarar es una sección cuyo respaldo no significa
 * nada todavía.
 */
const leer = (f) => readFileSync(join(PRUEBAS, f), 'utf8');
const ARCHIVOS = existsSync(PRUEBAS)
  ? readdirSync(PRUEBAS).filter((f) => /\.tsx?$/.test(f))
  : [];
const TODO = ARCHIVOS.map(leer).join('\n');

/** Solo las líneas que NOMBRAN una prueba. Buscar `[0]` en el archivo entero
 *  lo hacía casar con `filas[0]`, que aparece en veinte archivos: dos reglas
 *  obligatorias salían en verde respaldadas por un índice de array. */
const titulos = (texto) =>
  texto.split('\n').filter((l) => /\b(it|test|describe)\s*\(/.test(l)).join('\n');

const reglas = [];
let seccion = '(principio)';
let archivos = null;
for (const linea of md.split('\n')) {
  const h2 = linea.match(/^##\s+(.*)/);
  const hsub = linea.match(/^#{3,4}\s+(.*)/);
  // Una `##` abre ámbito nuevo. Las `###` y `####` HEREDAN: son subsecciones
  // del mismo componente, y perderlo ahí dejaba fuera justo las reglas que
  // motivaron este candado —el teclado del selector con búsqueda—.
  if (h2) { seccion = h2[1].trim(); archivos = null; continue; }
  if (hsub) { seccion = hsub[1].trim(); continue; }
  const d = linea.match(/^<!--\s*pruebas:\s*(.+?)\s*-->/);
  if (d) { archivos = d[1].split(',').map((x) => x.trim()).filter(Boolean); continue; }
  // El número puede llevar sufijo —`17bis`, `0b`—. Sin esto, trece filas
  // marcadas Obligatorio quedaban fuera de toda verificación.
  const m = linea.match(/^\|\s*\*\*(\d+[a-z]*)\*\*\s*\|\s*(.+?)\s*\|\s*$/);
  if (!m) continue;
  reglas.push({
    n: m[1],
    texto: m[2],
    seccion,
    archivos,
    obligatoria: m[2].includes('**Obligatorio.**'),
    pendiente: m[2].includes('**PENDIENTE'),
    delProyecto: /^Del proyecto/i.test(m[2]),
  });
}

/**
 * CÓMO SE ATA UNA REGLA A SU PRUEBA, y por qué son dos formas.
 *
 * El número de FILA reinicia en cada sección, así que por sí solo no identifica
 * nada: «17» existe en la tabla y en el selector. Hay dos maneras honestas de
 * nombrarla en una prueba:
 *
 *   · Por el REQUERIMIENTO que la regla cita —`(R101, v1.76.0)`—, que es como
 *     se ha escrito siempre en este repositorio: `it('R101 · …')`. Es único de
 *     verdad y no depende de dónde caiga la fila.
 *   · Por el número de fila entre corchetes —`it('[3] …')`—, para reglas que no
 *     nacen de un requerimiento.
 *
 * Buscar el número de fila a secas era el error: daba por respaldadas las cinco
 * reglas de «Estados de pantalla» con pruebas de `CargaId` y `TablaDatos` que
 * solo compartían el número.
 */
const requisitos = (texto) => [...texto.matchAll(/\(R(\d+[a-z]*)[,)]/g)].map((m) => m[1]);

const respaldada = (r) => {
  let texto = TODO;
  if (r.archivos) {
    const faltan = r.archivos.filter((f) => !ARCHIVOS.includes(f));
    if (faltan.length) return false;
    texto = r.archivos.map(leer).join('\n');
  }
  const t = titulos(texto);
  if (t.includes(`[${r.n}]`)) return true;
  // Por el requerimiento citado, que es único de verdad…
  if (requisitos(r.texto).some((q) => new RegExp(`\\bR${q}\\b`).test(t))) return true;
  // …o por el número de fila, que es la otra convención viva en el repositorio.
  // Sin `<!-- pruebas: -->` esta forma vale poco —el número reinicia en cada
  // sección— y por eso se cuenta y se dice cuántas secciones van sin declarar.
  return new RegExp(`\\bR${r.n}\\b`).test(t);
};

// Secciones sin declarar: su respaldo se busca en el MONTÓN de todas las
// pruebas, así que una coincidencia de número basta. Se cuentan y se dicen.
const sinDeclarar = [...new Set(reglas.filter((r) => !r.archivos).map((r) => r.seccion))];
const cubiertas = reglas.filter((r) => r.obligatoria && r.archivos).length;

const sinRespaldo = reglas.filter((r) => r.obligatoria && !respaldada(r));
const pendientes = reglas.filter((r) => r.pendiente);

console.log(`\n  Candado del contrato — MMI-DS v${VERSION}\n`);
console.log(`  Reglas:       ${reglas.length}`);
console.log(`  Obligatorias: ${reglas.filter((r) => r.obligatoria).length}`);
console.log(`  Pendientes:   ${pendientes.length} — declaradas, el componente no las hace`);
console.log(`  Del proyecto: ${reglas.filter((r) => r.delProyecto).length}`);
console.log(`  Sin respaldo: ${sinRespaldo.length}`);
console.log(`  Atadas a SU archivo de pruebas: ${cubiertas} de ${reglas.filter((r) => r.obligatoria).length} obligatorias`);
console.log(`  Secciones sin declarar: ${sinDeclarar.length} — su respaldo se busca en el`);
console.log('                          montón y una coincidencia de número basta\n');

if (pendientes.length) {
  console.log('  Declaradas PENDIENTE, que es decir la verdad:\n');
  for (const r of pendientes) {
    console.log(`    R${String(r.n).padEnd(3)} ${r.texto.replace(/\*\*/g, '').slice(0, 78)}`);
  }
  console.log('');
}

if (sinRespaldo.length) {
  console.error('  Reglas OBLIGATORIAS sin ninguna prueba que las respalde:\n');
  for (const r of sinRespaldo) {
    console.error(`    R${String(r.n).padEnd(3)} ${r.texto.replace(/\*\*/g, '').slice(0, 74)}`);
  }
  console.error('\n  Una regla obligatoria sin prueba es una promesa. El documento al que');
  console.error('  se remite a los proyectos no puede prometer lo que nadie comprueba.');
  console.error('\n  Dos salidas, y las dos son honestas:');
  console.error('    · escribe la prueba y nombra la regla en ella —«R8 · …»—;');
  console.error('    · o marca la regla como PENDIENTE, y entonces el documento');
  console.error('      dice la verdad aunque la verdad sea que falta.\n');
  process.exit(1);
}

console.log('  Toda regla obligatoria tiene prueba detrás.\n');
