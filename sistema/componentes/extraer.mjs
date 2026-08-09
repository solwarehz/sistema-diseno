#!/usr/bin/env node
/**
 * EXTRACTOR DE ESTILOS DE COMPONENTE
 *
 *   node sistema/componentes/extraer.mjs
 *
 * Escribe `sistema/componentes/componentes.css`: los estilos de los elementos
 * del sistema, listos para importar.
 *
 * POR QUÉ EXISTE. El área de sistemas reportó que replicar la tabla les costaba
 * mucho, y tenían razón: los estilos vivían SOLO dentro del catálogo —una página
 * de demostración de 881 KB— y la entrega no llevaba ni una regla. Cada proyecto
 * los reconstruía mirando.
 *
 * Y el coste no era lo peor. Un elemento reconstruido a ojo pierde justo lo que
 * no se ve: el anillo de foco, el filete que acompaña al color, la altura de
 * fila que es blanco táctil. **Un sistema cuyos elementos se rehacen mirando no
 * garantiza nada.**
 *
 * CÓMO EVITA DIVERGIR. No copia ni reescribe: EXTRAE del catálogo ya generado.
 * La hoja entregada y la que se ve en pantalla son literalmente las mismas
 * reglas, así que no pueden separarse. Si el catálogo cambia, la entrega cambia.
 *
 * QUÉ NO ES. No son componentes de React. Escribir React que no se puede
 * compilar en esta máquina sería entregar código nunca ejecutado, que es lo que
 * este sistema prohíbe. Esto elimina la reconstrucción del ESTILO; el
 * comportamiento sigue siendo del proyecto hasta que haya dónde compilarlo.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

// ── Qué sale y qué se queda ─────────────────────────────────────────────────
// Lista BLANCA a propósito: lo que no esté clasificado no viaja. Al revés
// —lista negra— cualquier clase nueva del catálogo acabaría en la entrega sin
// que nadie lo decidiera.

const ELEMENTOS = [
  { n: 'Botón',                 p: ['btn'] },
  { n: 'Enlace',                p: ['enl', 'enlace'] },
  { n: 'Campo de texto',        p: ['campo', 'cg', 'msj'] },
  { n: 'Selector',              p: ['sel'] },
  { n: 'Interruptor',           p: ['sw'] },
  { n: 'Selección múltiple',    p: ['ms'] },
  { n: 'Fecha y rango',         p: ['fc'] },
  { n: 'Horario',               p: ['hor'] },
  { n: 'Chip de estado',        p: ['chip'] },
  { n: 'Avatar',                p: ['avatar'] },
  { n: 'Tarjeta de persona',    p: ['tp'] },
  { n: 'Tarjeta',               p: ['tn'] },
  { n: 'Tabla de datos',        p: ['tb'] },
  { n: 'Tabla simple',          p: ['tabla'] },
  { n: 'Paginación',            p: ['pgn', 'pg-pos'] },
  { n: 'Barra de progreso',     p: ['pr'] },
  { n: 'Aviso temporal',        p: ['av'] },
  { n: 'Confirmación en línea', p: ['cf'] },
  { n: 'Estados de pantalla',   p: ['ep', 'esqueleto'] },
  { n: 'Marco de aplicación',   p: ['lat', 'nav', 'top', 'us', 'app', 'm', 'fg', 'velo', 'badge'] },
];

// Clases que son SOLO del catálogo. Se listan una a una para poder distinguir
// «no clasificado todavía» de «decidido que no sale». Un elemento nuevo que
// caiga aquí por descuido se quedaría fuera de la entrega sin que se note, y
// por eso el extractor grita cuando aparece un prefijo que no está en ninguna
// de las dos listas.
const SOLO_CATALOGO = new Set([
  'w', 'pag', 'cat', 'caso', 'bloque', 'sub', 'mal', 'tira', 'cam', 'migas',
  'atajo', 'cod', 'anatomia', 'anat', 'muestra', 'foco', 'op', 's', 'dialogos',
  'aviso', 'ic', 'ico', 'sin', 'filas', 'grupo', 'leyenda', 'pt', 'num',
  'motivo', 'conmutador', 'esc', 'esp', 'rejilla', 'rej', 'campos', 'estado',
  'estados', 'est', 'pendiente', 'tipo', 'iconos', 'dlg', 'man', 'mono', 'peso',
  'marca', 'ancho', 'cab', 'mf', 'activo', 'lienzo', 'copiar', 'seccion', 'demo',
  'pg-demo', 'pg-variantes', 'pg-var', 'envoltorio', 'movil', 'codigo', 'atajos',
  'manual', 'escala', 'maqueta', 'apagado', 'deuda', 'pesos', 'anchos', 'casos',
  'fila', 'mensajes', 'bien', 'emoji',
]);

// ── Troceado del CSS respetando las @media ──────────────────────────────────

/** Parte el CSS en bloques de primer nivel, contando llaves. Un `split('}')`
 *  parte las @media por la mitad y produce reglas inválidas. */
function bloques(css) {
  const salida = [];
  let i = 0;
  while (i < css.length) {
    const abre = css.indexOf('{', i);
    if (abre < 0) break;
    let prof = 1;
    let j = abre + 1;
    while (j < css.length && prof > 0) {
      if (css[j] === '{') prof++;
      else if (css[j] === '}') prof--;
      j++;
    }
    // Los comentarios se quitan DEL SELECTOR, no del bloque. Antes se descartaba
    // toda regla precedida de un comentario porque su selector «empezaba por
    // /*», y en un archivo tan comentado como este eso tiraba reglas en
    // silencio: la base de .btn y la cebra de la tabla se perdieron así, y solo
    // se vieron al montar la hoja sola y mirarla.
    const bruto = css.slice(i, abre);
    salida.push({
      sel: bruto.replace(/\/\*[\s\S]*?\*\//g, '').trim(),
      comentario: (bruto.match(/\/\*[\s\S]*?\*\//g) || []).join('\n'),
      cuerpo: css.slice(abre + 1, j - 1),
      entero: bruto.replace(/\/\*[\s\S]*?\*\//g, '').trim() + css.slice(abre, j),
    });
    i = j;
  }
  return salida;
}

/** La PRIMERA clase del selector, entera. Comparar solo el tramo de letras
 *  mezclaba `.pgn-btn` —que es el componente— con `.pg-demo`, que es la
 *  demostración del catálogo: los dos empiezan por «pg». */
const claseDe = (sel) => {
  const m = sel.match(/\.([a-z][a-z0-9-]*)/);
  return m ? m[1] : null;
};

/** Coincide la clase entera o un descendiente suyo: `tb` caza `.tb` y `.tb-sub`
 *  pero NO `.tbotro`. */
const cazaPatron = (clase, patron) => clase === patron || clase.startsWith(patron + '-');

/** ¿Este selector pertenece al elemento? Basta con que UNA de sus partes lo sea:
 *  `.tabla-simple, .tb-sub { … }` es de los dos, y sale en los dos. */
const esDe = (sel, patrones) =>
  sel.split(',').some((parte) => {
    const c = claseDe(parte);
    return c && patrones.some((p) => cazaPatron(c, p));
  });

// ── Extracción ──────────────────────────────────────────────────────────────

const html = readFileSync(join(RAIZ, 'cascaron', 'index.html'), 'utf8');
const css = html.split('<style>')[1].split('</style>')[0];
const todos = bloques(css);

const porElemento = new Map(ELEMENTOS.map((e) => [e.n, []]));
const sinClasificar = new Map();
let dentroDeMedia = 0;

for (const b of todos) {
  if (b.sel.startsWith('@media')) {
    // Se conserva la envoltura: una regla de @media sin su @media no vale nada.
    for (const e of ELEMENTOS) {
      const dentro = bloques(b.cuerpo).filter((r) => r.sel && esDe(r.sel, e.p));
      if (dentro.length) {
        porElemento.get(e.n).push(`${b.sel} {\n${dentro.map((r) => '  ' + r.entero).join('\n')}\n}`);
        dentroDeMedia += dentro.length;
      }
    }
    continue;
  }
  if (!b.sel || b.sel.startsWith('@') || b.sel.startsWith(':root') || b.sel.startsWith('[data-tema')) continue;

  let colocado = false;
  for (const e of ELEMENTOS) {
    if (esDe(b.sel, e.p)) {
      porElemento.get(e.n).push(b.entero);
      colocado = true;
    }
  }
  if (!colocado) {
    const c = claseDe(b.sel);
    const conocida = c && [...SOLO_CATALOGO].some((p) => cazaPatron(c, p));
    if (c && !conocida) sinClasificar.set(c, (sinClasificar.get(c) || 0) + 1);
  }
}

// ── Escritura ───────────────────────────────────────────────────────────────

const secciones = ELEMENTOS.filter((e) => porElemento.get(e.n).length).map((e) => {
  const reglas = porElemento.get(e.n);
  return `/* ───────────────────────────────────────────────────────────────────────────
   ${e.n.toUpperCase()} — ${reglas.length} reglas · clases .${e.p.join('-*, .')}-*
   ─────────────────────────────────────────────────────────────────────────── */

${reglas.join('\n')}
`;
});

const salida = `/* ───────────────────────────────────────────────────────────────────────────
   ESTILOS DE COMPONENTE — Colegio Albert Einstein · MMI-DS v${VERSION}

   ARCHIVO GENERADO. No editar a mano.
   Se EXTRAE del catálogo con \`node sistema/componentes/extraer.mjs\`, así que
   estas reglas son literalmente las mismas que se ven en pantalla. No pueden
   divergir del catálogo porque no son una copia: son las mismas.

   USO
     import 'sistema-diseno-ae/componentes.css';   // después de tokens.css

   Depende de las variables de \`tokens.css\`: impórtalo DESPUÉS o no habrá
   ningún color definido.

   QUÉ TE DA Y QUÉ NO
     Sí  · el estilo exacto: anillo de foco, filetes, alturas de fila, estados
   VERIFICADO. 21 ejemplares reales del catálogo se montaron con SOLO estas dos
   hojas y se compararon propiedad a propiedad contra el catálogo: 20 idénticos.
   El que difiere es .hor-b, que hereda su tamaño de .hor: fuera de la tabla del
   horario sale a 15px en vez de 13. No es una regla que falte, es una
   DEPENDENCIA DE CONTEXTO, y por eso el contrato de marcado importa tanto como
   la hoja.

     No  · el comportamiento. Ordenar, filtrar, plegar y el teclado siguen
           siendo del proyecto. El marcado que espera cada elemento está en
           \`componentes.md\`, junto a esta hoja.
   ─────────────────────────────────────────────────────────────────────────── */

${secciones.join('\n')}`;

mkdirSync(AQUI, { recursive: true });
writeFileSync(join(AQUI, 'componentes.css'), salida);

// ── Reporte ─────────────────────────────────────────────────────────────────

const totalReglas = ELEMENTOS.reduce((n, e) => n + porElemento.get(e.n).length, 0);
console.log(`\n  componentes.css  ${(salida.length / 1024).toFixed(0)} KB · ${totalReglas} reglas de ${todos.length}\n`);
for (const e of ELEMENTOS) {
  const n = porElemento.get(e.n).length;
  console.log(`    ${n ? '✓' : '·'} ${e.n.padEnd(24)} ${String(n).padStart(3)} reglas`);
}
if (dentroDeMedia) console.log(`\n    ${dentroDeMedia} reglas dentro de @media, con su envoltura`);

if (sinClasificar.size) {
  console.log('\n  Prefijos sin clasificar — ni de elemento ni declarados del catálogo:\n');
  [...sinClasificar.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([p, n]) => console.log(`    .${p.padEnd(14)} ${String(n).padStart(3)} reglas`));
  console.log('\n  Decide para cada uno: o es de un elemento y entra en ELEMENTOS,');
  console.log('  o es del catálogo y entra en SOLO_CATALOGO. Callarlos hace que');
  console.log('  un elemento nuevo se quede fuera de la entrega sin que se note.\n');
}
console.log('');

export { ELEMENTOS };
