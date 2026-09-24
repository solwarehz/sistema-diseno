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

/* UNA PRUEBA APAGADA NO RESPALDA NADA, y este candado no podia verlo.
 *
 * Se demostro: `describe(` → `describe.skip(` sobre las dos suites de la regla
 * 23 —el defecto que esta version llama el mas caro— dejaba CATORCE pruebas
 * fuera, y tanto este candado como la bateria salian en verde. El patron casa
 * `describe` y `.skip` no lo rompe, y los titulos de dentro siguen llevando el
 * numero de la regla, asi que la regla seguia «respaldada».
 *
 * Y `.only` es peor: deja fuera TODAS las demas del archivo sin tocar ninguna
 * linea que se note al leer el diff. Lo cazo una auditoria adversaria. */
const APAGADAS = /\b(it|test|describe)\s*\.\s*(skip|only|todo|fails)\s*\(/;
const apagadas = [];
for (const ruta of ARCHIVOS) {
  leer(ruta).split('\n').forEach((l, i) => {
    if (APAGADAS.test(l)) apagadas.push(`${ruta.split('/').pop()}:${i + 1}  ${l.trim().slice(0, 72)}`);
  });
}
if (apagadas.length) {
  console.error(`\n  ${apagadas.length} prueba(s) APAGADA(S) en el contrato:\n`);
  for (const a of apagadas) console.error(`    ${a}`);
  console.error('\n  Una prueba con `.skip`/`.only` no respalda su regla, y este candado'
    + '\n  la contaba igual: los titulos siguen ahi con su numero. Quitalo, o'
    + '\n  quita la regla — lo que no vale es una regla obligatoria respaldada'
    + '\n  por una prueba que no se ejecuta.\n');
  process.exit(1);
}

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

/* Las que se sostienen SOLO por el comodín del número de fila. Se declara la
   lista para que una nueva falle y para que arreglar una obligue a podarla. */
const COMODIN = [];
const DEUDA_COMODIN = [
  /* ── CON PRUEBA DE VERDAD, solo que atada por el numero y no por la fila ──
     Estas once SI tienen su prueba en el archivo de su seccion —`it('R1 · «Filtros»
     despliega una fila DENTRO del thead…')` respalda de verdad a la fila 1 de
     «Filtros»—. Lo que falta no es la prueba: es la etiqueta `[N]`, que es la
     unica forma inequivoca. Se van pasando a `[N]` segun se toquen. */
  'Filtros · 1', 'Filtros · 2', 'Filtros · 3', 'Filtros · 4', 'Filtros · 5',
  'Paginación · 7', 'Paginación · 9',
  'Orden · 11', 'Orden · 12', 'Orden · 13',
  'Filas desplegables · 28',

  /* ── SIN PRUEBA, y se dice ────────────────────────────────────────────────
     Estas dos no tienen ninguna. Casaban con las de «Filtros» por el numero y
     nada mas; cuando esta lista nacio, el 2026-09-24, eran cinco y se
     escribieron tres —[1] el foco, [3] la atenuacion, [4] el marco
     alcanzable—, y las tres encontraron defectos reales el mismo dia. Quedan
     dos porque su cumplimiento esta REPARTIDO por todo el sistema y no hay un
     sitio donde mirarlo; eso no es excusa, es el motivo por el que siguen
     aqui y no en verde. */
  'Reglas transversales · 2',  // nada se distingue solo por color (SC 1.4.1)
  'Reglas transversales · 5',  // tema, densidad y formato horario se recuerdan
];

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
  /* …o por el número de fila a secas. ESTA VIA NO IDENTIFICA NADA Y SE
     DECLARA COMO DEUDA. La cabecera de aquí arriba dice que «buscar el número
     de fila a secas era el error» y que se arregló; se arregló en la vía `[N]`
     y se dejó viva en ésta. Lo encontró una auditoría el 2026-09-24: la regla
     transversal 7, recién escrita y sobre el encabezado del CATÁLOGO, salió
     respaldada por `it('R7 · con una sola página NO se pinta la paginación…')`
     de `TablaDatos.test.tsx`. Cero relación, y verde delante de una regla
     obligatoria sin ninguna prueba.

     Quitarla no es la salida: se probó y tumba 17 reglas que SÍ tienen su
     prueba —`it('R1 · …')` en `TablaDatos.test.tsx` respalda de verdad a la
     fila 1 de «Filtros»—, y romper lo que funciona para tapar lo que no es
     cambiar un defecto por otro. Lo que sí se puede es dejar de fingir que es
     un respaldo sólido: las que se apoyan SOLO en esto se cuentan, se nombran
     y se comparan con una lista declarada. Si entra una nueva, el candado
     falla; si se arregla una y no se poda la lista, también — porque una
     lista de excepciones que nadie poda vuelve a ser el inventario a mano de
     siempre. */
  if (new RegExp(`\\bR${r.n}\\b`).test(t)) { COMODIN.push(`${r.seccion} · ${r.n}`); return true; }
  return false;
};

// Secciones sin declarar: su respaldo se busca en el MONTÓN de todas las
// pruebas, así que una coincidencia de número basta. Se cuentan y se dicen.
/* ── UN NUMERO AMBIGUO NO RESPALDA NADA ───────────────────────────────────────
 *
 * Este sistema acuno numeros que no eran suyos siete veces, y la ultima —R129,
 * el 2026-09-13— no solo confundio a las personas: ENGANO A ESTE CANDADO. Tres
 * reglas nuevas citaban `(R129, …)` y quedaron por respaldadas casando con las
 * pruebas del R129 VIEJO, de otra version y otro componente. Verde en falso
 * delante de tres reglas sin nada detras.
 *
 * La condicion exacta del dano es esta: una regla que SOLO se sostiene por el
 * numero citado, cuando ese numero significa dos cosas en este documento. No
 * basta con que un numero aparezca en dos versiones —R41 y R102 son un mismo
 * requerimiento entregado en dos tandas, y eso es normal—: lo que no vale es
 * apoyarse en el numero para decir que algo esta probado cuando el numero no
 * identifica una sola cosa.
 *
 * La salida es la de siempre y no cuesta nada: atarla por numero de fila,
 * `it('[3] …')`, que es inequivoco.
 * ──────────────────────────────────────────────────────────────────────────── */
const versionesPorNumero = new Map();
for (const m of md.matchAll(/\(R(\d+)[^)]*?,\s*v(\d+\.\d+\.\d+)\)/g)) {
  if (!versionesPorNumero.has(m[1])) versionesPorNumero.set(m[1], new Set());
  versionesPorNumero.get(m[1]).add(m[2]);
}
const ambiguo = (n) => (versionesPorNumero.get(n)?.size ?? 0) > 1;

/** ¿Se sostiene SOLO por el numero citado, y no por su fila? */
const soloPorNumero = (r) => {
  let texto = TODO;
  if (r.archivos) {
    if (r.archivos.some((f) => !ARCHIVOS.includes(f))) return false;
    texto = r.archivos.map(leer).join('\n');
  }
  const t = titulos(texto);
  if (t.includes(`[${r.n}]`)) return false;                 // atada por fila
  if (new RegExp(`\\bR${r.n}\\b`).test(t)) return false;    // por numero de fila
  return requisitos(r.texto).some((q) => ambiguo(q) && new RegExp(`\\bR${q}\\b`).test(t));
};
const ambiguas = reglas.filter((r) => r.obligatoria && soloPorNumero(r));
if (ambiguas.length) {
  console.error('\n  Reglas respaldadas por un numero que significa DOS cosas:\n');
  for (const r of ambiguas) {
    const q = requisitos(r.texto).find(ambiguo);
    console.error(`    ${r.seccion} · fila ${r.n} cita R${q}, que en este documento es ${[...versionesPorNumero.get(q)].sort().join(' y ')}`);
  }
  console.error('\n  El respaldo casa con la prueba del OTRO. Atala por su fila —`it(\'[3] …\')`—,');
  console.error('  que es inequivoco, o cita el registro: «R129 del equipo».\n');
  process.exit(1);
}

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


/* ── LA DEUDA DEL COMODIN ─────────────────────────────────────────────────── */
const comodinHoy = [...new Set(COMODIN)].sort();
const declarada = [...new Set(DEUDA_COMODIN)].sort();
const nuevas = comodinHoy.filter((c) => !declarada.includes(c));
const arregladas = declarada.filter((c) => !comodinHoy.includes(c));
if (nuevas.length || arregladas.length) {
  console.error('\n  El respaldo por NUMERO DE FILA A SECAS no identifica nada.\n');
  if (nuevas.length) {
    console.error('  Estas reglas se sostienen solo por eso, y no estaban declaradas:\n');
    for (const c of nuevas) console.error(`    ${c}`);
    console.error('\n  Atala por su fila —`it(\'[N] …\')`— o cita su requerimiento.');
    console.error('  Si de verdad no se puede, declarala en DEUDA_COMODIN con su motivo.');
  }
  if (arregladas.length) {
    console.error('\n  Y estas ya NO lo necesitan: quitalas de DEUDA_COMODIN.\n');
    for (const c of arregladas) console.error(`    ${c}`);
    console.error('\n  Una lista de excepciones que nadie poda vuelve a ser el');
    console.error('  inventario a mano de siempre.');
  }
  console.error('');
  process.exit(1);
}
console.log(`  Respaldadas solo por el numero de fila: ${comodinHoy.length} — declaradas.`);

console.log('  Toda regla obligatoria tiene prueba detrás.\n');
