/**
 * CANDADO 13 · EL MISMO ICONO EN EL CATÁLOGO Y EN EL PRODUCTO — R112
 *
 * El sistema dibuja cada icono DOS VECES, en dos archivos distintos:
 *
 *   sistema/iconos/iconos.mjs   `TRAZOS`        cadenas, lo usa el catálogo
 *   componentes/src/Icono.tsx   `TRAZOS_REACT`  JSX, lo usan los productos
 *
 * Son dos porque el catálogo genera HTML con plantillas y el componente emite
 * React: no hay una forma de escribirlo una sola vez sin meter un paso de
 * compilación que este repositorio no tiene. Lo que sí había que tener es algo
 * que compruebe que dicen LO MISMO, y hasta hoy no existía.
 *
 * POR QUÉ NACE AHORA, y no es una idea bonita. R112 metió siete iconos de
 * redes sociales, y meterlos significa teclear el mismo camino SVG en dos
 * sitios. Antes de tocar nada se compararon los 45 que había: coincidían los
 * 45, trazo por trazo. O sea que el sistema llevaba 111 versiones dependiendo
 * de que nadie se equivocara al copiar, y acertando. Eso no es una garantía,
 * es una racha.
 *
 * QUÉ NO PODÍA VERLO. Ninguno de los doce. `verificar-promesa` compara
 * PROPIEDADES CSS resueltas sobre el mismo marcado, y un icono distinto tiene
 * las mismas propiedades. `verificar-elemento` compara ETIQUETAS, y `svg`
 * contra `svg` es igual. Es exactamente el defecto de R111 —nueve iconos
 * publicados vacíos— visto desde el otro lado: allí el contenido del `<svg>`
 * estaba mal en el catálogo, aquí podría estar mal en cualquiera de los dos.
 *
 * QUÉ COMPRUEBA
 *   1 · Los dos mapas tienen exactamente los mismos nombres.
 *   2 · Cada icono tiene el mismo trazo en los dos, normalizando lo único que
 *       legítimamente difiere: los espacios y el `/>` de JSX.
 *   3 · Ningún trazo está vacío. Un icono sin camino sale como un hueco y no
 *       da error — que es justo lo que pasó en R111.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const fuenteCatalogo = readFileSync(join(RAIZ, 'sistema', 'iconos', 'iconos.mjs'), 'utf8');
const fuenteReact = readFileSync(join(RAIZ, 'componentes', 'src', 'Icono.tsx'), 'utf8');

/** Solo el bloque de TRAZOS: fuera del mapa hay más comillas que confunden. */
function bloque(texto, desde, hasta) {
  const i = texto.indexOf(desde);
  if (i < 0) throw new Error(`no encuentro «${desde}»`);
  const j = texto.indexOf(hasta, i);
  return texto.slice(i, j < 0 ? texto.length : j);
}

const delCatalogo = {};
for (const m of bloque(fuenteCatalogo, 'export const TRAZOS = {', '\n};')
  .matchAll(/^ {2}([a-zA-Z][a-zA-Z0-9]*): '(.*)',$/gm)) delCatalogo[m[1]] = m[2];

const delProducto = {};
for (const m of bloque(fuenteReact, 'const TRAZOS_REACT = {', '\n} as const;')
  .matchAll(/^ {2}([a-zA-Z][a-zA-Z0-9]*): <>(.*)<\/>,$/gm)) delProducto[m[1]] = m[2];


/**
 * LA GUARDA, y nació de un fallo del propio candado. La primera versión leía los
 * nombres con `[a-zA-Z]+` y se saltaba `descargar2` —un dígito— EN LOS DOS
 * mapas. Como se lo saltaba en los dos, no reportaba diferencia: decía verde
 * habiendo mirado 52 de 53.
 *
 * Un candado que se salta lo que no sabe leer es peor que no tenerlo, porque
 * además tranquiliza. Así que se cuenta por separado todo lo que TIENE PINTA de
 * entrada, y si no cuadra con lo que se pudo leer, falla y dice cuál.
 */
function pinta(texto, desde, hasta) {
  return [...bloque(texto, desde, hasta).matchAll(/^ {2}([a-zA-Z][a-zA-Z0-9]*)\s*:/gm)].map((m) => m[1]);
}

const pintaCat = pinta(fuenteCatalogo, 'export const TRAZOS = {', '\n};');
const pintaProd = pinta(fuenteReact, 'const TRAZOS_REACT = {', '\n} as const;');

/**
 * Se quitan los espacios y se iguala `/>` con `/>`. NO se normaliza nada más
 * —ni números, ni orden— a propósito: si dos caminos difieren en una coma, son
 * dos dibujos distintos y el candado tiene que decirlo.
 */
const igualar = (d) => d.replace(/\s+/g, '').replace(/\/>/g, '/>');

const fallos = [];

const nombresCat = Object.keys(delCatalogo);
const nombresProd = Object.keys(delProducto);

for (const n of nombresCat) {
  if (!nombresProd.includes(n)) {
    fallos.push(`«${n}» está en el catálogo y NO en Icono.tsx: el producto no puede dibujarlo`);
  }
}
for (const n of nombresProd) {
  if (!nombresCat.includes(n)) {
    fallos.push(`«${n}» está en Icono.tsx y NO en el catálogo: se entrega algo que nadie enseña`);
  }
}

for (const n of nombresCat) {
  if (!delProducto[n]) continue;
  const a = igualar(delCatalogo[n]);
  const b = igualar(delProducto[n]);
  if (a !== b) {
    fallos.push(
      `«${n}» se dibuja DISTINTO en cada sitio:\n`
      + `        catálogo: ${a}\n`
      + `        producto: ${b}`,
    );
  }
}

for (const [n, d] of [...Object.entries(delCatalogo), ...Object.entries(delProducto)]) {
  if (!igualar(d)) fallos.push(`«${n}» no tiene trazo: saldría un hueco, y sin dar error`);
}

if (nombresCat.length === 0 || nombresProd.length === 0) {
  fallos.push('uno de los dos mapas salió vacío: el candado no está leyendo lo que cree');
}

for (const [donde, leidos, todos] of [
  ['el catálogo', nombresCat, pintaCat],
  ['el producto', nombresProd, pintaProd],
]) {
  const saltados = todos.filter((n) => !leidos.includes(n));
  if (saltados.length) {
    fallos.push(
      `en ${donde} hay ${saltados.length} entrada(s) que este candado NO SABE LEER `
      + `y estaba saltándose en silencio: ${saltados.join(', ')}`,
    );
  }
}

console.log('\n  Iconos · el catálogo y el producto dibujan lo mismo\n');
console.log(`    ${nombresCat.length} en el catálogo · ${nombresProd.length} en el producto`);

if (fallos.length) {
  console.error(`\n  ${fallos.length} problema(s):\n`);
  fallos.forEach((f) => console.error(`    ${f}`));
  console.error('\n  Un icono que difiere no rompe nada y no da error: sale otro dibujo,');
  console.error('  o ninguno. Se escribe DOS veces porque el catálogo genera HTML y el');
  console.error('  componente emite React; que digan lo mismo lo garantiza esto.\n');
  process.exit(1);
}

console.log('    ✓ mismos nombres, mismo trazo, ninguno vacío\n');
