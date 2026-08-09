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

// Cada regla es una fila de tabla que empieza por su número: `| **8** | …`
const reglas = [...md.matchAll(/^\|\s*\*\*(\d+)\*\*\s*\|\s*(.+?)\s*\|\s*$/gm)].map((m) => ({
  n: Number(m[1]),
  texto: m[2],
  obligatoria: m[2].includes('**Obligatorio.**'),
  pendiente: m[2].includes('**PENDIENTE'),
  delProyecto: /^Del proyecto/i.test(m[2]),
}));

// Todo el texto de las pruebas, junto. Se busca la referencia al número de
// regla en el nombre del `it`, que es donde se escribe.
const textoPruebas = existsSync(PRUEBAS)
  ? readdirSync(PRUEBAS)
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => readFileSync(join(PRUEBAS, f), 'utf8'))
      .join('\n')
  : '';

const respaldada = (n) =>
  new RegExp(`\\bR${n}\\b`).test(textoPruebas) || new RegExp(`\\[${n}\\]`).test(textoPruebas);

const sinRespaldo = reglas.filter((r) => r.obligatoria && !respaldada(r.n));
const pendientes = reglas.filter((r) => r.pendiente);

console.log(`\n  Candado del contrato — MMI-DS v${VERSION}\n`);
console.log(`  Reglas:       ${reglas.length}`);
console.log(`  Obligatorias: ${reglas.filter((r) => r.obligatoria).length}`);
console.log(`  Pendientes:   ${pendientes.length} — declaradas, el componente no las hace`);
console.log(`  Del proyecto: ${reglas.filter((r) => r.delProyecto).length}`);
console.log(`  Sin respaldo: ${sinRespaldo.length}\n`);

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
