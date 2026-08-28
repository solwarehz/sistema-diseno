#!/usr/bin/env node
/**
 * CANDADO DEL ELEMENTO — lo que el catálogo ENSEÑA y lo que el componente EMITE
 *
 *   node sistema/candado/verificar-elemento.mjs
 *
 * POR QUÉ EXISTE. El candado de la promesa compara las dos hojas resolviendo la
 * cascada **sobre el mismo marcado**, y por eso no puede ver esta familia de
 * defecto: cuando lo que difiere es el ELEMENTO, le das el mismo marcado a las
 * dos hojas y las dos responden lo mismo. Verde, y la pantalla mal.
 *
 * Dos veces en la misma semana, y las dos con el mismo origen —la hoja se
 * escribió mirando el catálogo—:
 *
 *   · R56 · el catálogo pintaba la tarjeta pulsable como `<a href="#">` y el
 *     componente la emitía como `<button>`. Un ancla hereda tipografía; un
 *     botón no. Como `.tn` era el único control de la hoja sin `font: inherit`,
 *     en cada producto salía con la fuente del navegador, centrada y con
 *     relleno propio. Cuarenta y ocho versiones así.
 *
 *   · R58 · la hoja estilizaba `.tn-cab h4`, el catálogo usaba `<h4>` y el
 *     componente emitía `<h3>`. El título de la tarjeta salía SIN ESTILO en
 *     cada producto y bien en el catálogo.
 *
 * QUÉ COMPRUEBA. Una sola cosa, y a fondo: EL ELEMENTO POR CLASE. Para cada
 * clase del sistema, los elementos que la llevan en el TSX y los que la llevan
 * en el catálogo tienen que coincidir en algo. Es un cruce de conjuntos y no
 * una igualdad, porque un componente emite legítimamente elementos distintos
 * según sus props: `Tarjeta` es `<button>` con `onClick` y `<article>` sin él.
 *
 * QUÉ NO COMPRUEBA, Y POR QUÉ. El NIVEL DE ENCABEZADO se intentó y se retiró.
 * Para saber qué encabezado pertenece a qué caja hace falta entender el anidado,
 * y la aproximación por cercanía —mirar lo que viene detrás de abrir la caja—
 * se colaba en el elemento siguiente: daba rojo en `.pant-fila` diciendo que el
 * componente emite `h1` donde el catálogo enseña `h2`, cuando la hoja tiene
 * `.pant-cab h1 { font-size: 28px }` y el componente estaba bien. Un candado que
 * grita en falso se desactiva a la semana, así que esto se queda fuera y se
 * dice. R58 —el defecto de encabezado que motivó mirar aquí— está cubierto por
 * otra vía: la hoja dejó de elegir el nivel y estiliza h2, h3 y h4 igual.
 *
 * EL LÍMITE DEL CRUCE, medido. Al ser cruce y no igualdad, una clase que HOY
 * llevan dos elementos legítimos tapa la divergencia de un tercero. Se comprobó:
 * volviendo a poner el `<a>` de R56 en UNA de las dos tarjetas pulsables del
 * catálogo, el candado sigue verde, porque la otra sigue siendo `<button>` y el
 * cruce sobrevive. Poniendo `<a>` en TODAS —el estado histórico real, cuando el
 * catálogo no enseñaba ningún botón— salta en rojo y lo nombra.
 *
 * O sea: caza el defecto cuando el catálogo entero se equivoca, que es como se
 * dieron los dos casos reales, y no cuando se equivoca UN ejemplar de varios. La
 * alternativa —exigir igualdad de conjuntos— daría rojo cada vez que un
 * componente emite dos elementos según sus props, que es legítimo y frecuente.
 * Se prefiere el falso negativo raro al falso positivo constante: un candado que
 * grita en falso se desactiva a la semana.
 *
 * Lectura de texto. No monta nada ni toca red.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const DIR_TSX = join(RAIZ, 'componentes', 'src');
const CATALOGO = join(RAIZ, 'cascaron', 'index.html');

/* ── Lo que el catálogo enseña ────────────────────────────────────────────── */

const html = readFileSync(CATALOGO, 'utf8');

/**
 * EL LÍMITE, DECLARADO. Parte del catálogo se pinta con JavaScript en tiempo de
 * ejecución —las celdas del calendario, la lista del marco de teléfono—, y ahí
 * la etiqueta y la clase se arman por concatenación. Leyendo el texto no se
 * puede saber con qué elemento sale.
 *
 * Se comprobó lo que pasa si se ignora: `.fc-d` daba rojo diciendo que el
 * catálogo enseña `<span>` y el componente emite `<button>`, cuando el catálogo
 * emite `<button>` también — lo que se veía era el `<span class="fc-d fc-vacio">`
 * del hueco. Un candado con falsos positivos se desactiva a la semana, así que
 * las clases que el JS del catálogo toca quedan FUERA y se dicen en el informe.
 */
const guionCatalogo = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]).join('\n');
const laPintaElGuion = (clase) =>
  new RegExp('["\'`][^"\'`]*\\b' + clase.replace(/[-]/g, '\\-') + '\\b').test(guionCatalogo);

/** clase → conjunto de etiquetas que la llevan en el catálogo. */
const etiquetasCatalogo = new Map();
/** clase → conjunto de niveles de encabezado que contiene directamente. */
const encabezadosCatalogo = new Map();

for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)\bclass="([^"]+)"([^>]*)>/g)) {
  const etiqueta = m[1];
  for (const c of m[3].split(/\s+/).filter(Boolean)) {
    if (!etiquetasCatalogo.has(c)) etiquetasCatalogo.set(c, new Set());
    etiquetasCatalogo.get(c).add(etiqueta);
  }
  // El encabezado que viene inmediatamente después de abrir, sin otro
  // elemento con clase en medio: es «el título de esta caja».
  const resto = html.slice(m.index + m[0].length, m.index + m[0].length + 400);
  const enc = resto.match(/^\s*<(h[1-6])\b/);
  if (enc) {
    for (const c of m[3].split(/\s+/).filter(Boolean)) {
      if (!encabezadosCatalogo.has(c)) encabezadosCatalogo.set(c, new Set());
      encabezadosCatalogo.get(c).add(enc[1]);
    }
  }
}

/* ── Lo que el componente emite ───────────────────────────────────────────── */

/** Las zonas `className=…`, contando llaves. Mismo criterio que `extraer.mjs`:
 *  una clase dentro de un array o de un ternario también cuenta. */
function zonasClassName(fuente) {
  const zonas = [];
  const re = /className=/g;
  let m;
  while ((m = re.exec(fuente))) {
    const i = m.index + m[0].length;
    if (fuente[i] === '"') {
      zonas.push({ inicio: m.index, texto: fuente.slice(i + 1, fuente.indexOf('"', i + 1)), esCadena: true });
    } else if (fuente[i] === '{') {
      let nivel = 1, j = i + 1;
      while (j < fuente.length && nivel > 0) {
        if (fuente[j] === '{') nivel++;
        else if (fuente[j] === '}') nivel--;
        j++;
      }
      zonas.push({ inicio: m.index, texto: fuente.slice(i + 1, j - 1), esCadena: false });
    }
  }
  return zonas;
}

/** La etiqueta que ABRE el elemento dueño de este `className`: se busca hacia
 *  atrás el `<` más cercano que abra una etiqueta. */
function etiquetaDe(fuente, posicion) {
  const antes = fuente.slice(0, posicion);
  const m = [...antes.matchAll(/<([A-Za-z][A-Za-z0-9.]*)\b/g)].pop();
  return m ? m[1] : null;
}

const literalesDe = (zona) => (zona.esCadena
  ? [zona.texto]
  : [...zona.texto.matchAll(/["'`]([^"'`]*)["'`]/g)].map((l) => l[1]));

const archivos = readdirSync(DIR_TSX).filter((f) => /\.tsx$/.test(f));
const fuentes = new Map(archivos.map((f) => [f.replace('.tsx', ''), readFileSync(join(DIR_TSX, f), 'utf8')]));

/** Las etiquetas HTML con que un COMPONENTE de React puede salir: las de los
 *  elementos que devuelve. Sin esto, `<Boton className="tna-editar">` daría un
 *  rojo falso — la etiqueta ahí es `Boton`, y el catálogo pinta un `<button>`. */
const cacheRaiz = new Map();
function raicesDe(nombre, visitados = new Set()) {
  if (cacheRaiz.has(nombre)) return cacheRaiz.get(nombre);
  if (visitados.has(nombre) || !fuentes.has(nombre)) return new Set();
  visitados.add(nombre);
  const salida = new Set();
  for (const m of fuentes.get(nombre).matchAll(/return\s*\(?\s*<([A-Za-z][A-Za-z0-9.]*)/g)) {
    const t = m[1];
    if (/^[a-z]/.test(t)) salida.add(t);
    else for (const r of raicesDe(t, visitados)) salida.add(r);
  }
  cacheRaiz.set(nombre, salida);
  return salida;
}

/** clase → { etiquetas, encabezados, dinamico } según el TSX. */
const emitido = new Map();
const sinResolver = [];

for (const [nombre, fuente] of fuentes) {
  for (const zona of zonasClassName(fuente)) {
    const bruta = etiquetaDe(fuente, zona.inicio);
    if (!bruta) continue;
    let etiquetas;
    if (/^[a-z]/.test(bruta)) {
      etiquetas = new Set([bruta]);
    } else {
      etiquetas = raicesDe(bruta);
      if (!etiquetas.size) { sinResolver.push(`${nombre}: <${bruta}>`); continue; }
    }
    // Los encabezados que este archivo puede emitir. Un encabezado por
    // variable —`const H = 'h' + nivel`— es DELIBERADAMENTE «cualquiera»: el
    // producto elige el nivel y la hoja estiliza los tres, que es la
    // corrección de R58.
    const dinamico = /`h\$\{/.test(fuente) || /as 'h2' \| 'h3' \| 'h4'/.test(fuente);
    const nivelesFijos = new Set([...fuente.matchAll(/<(h[1-6])[\s>]/g)].map((m) => m[1]));

    for (const lit of literalesDe(zona)) {
      for (const c of lit.split(/\s+/)) {
        if (c.includes('${') || !/^[a-z][a-z0-9-]*$/.test(c)) continue;
        if (!emitido.has(c)) emitido.set(c, { etiquetas: new Set(), niveles: new Set(), dinamico: false, de: nombre });
        const e = emitido.get(c);
        for (const t of etiquetas) e.etiquetas.add(t);
        for (const n of nivelesFijos) e.niveles.add(n);
        e.dinamico = e.dinamico || dinamico;
      }
    }
  }
}

/* ── Deuda declarada ──────────────────────────────────────────────────────── */

/**
 * Las divergencias que este candado encontró EL DÍA QUE SE ESCRIBIÓ, verificadas
 * a mano una por una. Se declaran en vez de arreglarse a la carrera: son cambios
 * de marcado en cuatro componentes y cada uno necesita su prueba.
 *
 * Están aquí para que el candado proteja YA de las divergencias NUEVAS —que es
 * el 90 % de su valor— sin fingir que estas no existen. Cada línea dice el daño
 * real, no solo el síntoma. Quitar una entrada es el trabajo; no quitarla y
 * callarla, no es opción.
 */
const DEUDA = new Map([
  ['ep-titulo', 'SEMÁNTICO. El catálogo lo pinta <h4> y el componente <p>. Se ve igual —la hoja estiliza la clase, no la etiqueta— pero quien navega por encabezados con lector pierde el título del estado vacío.'],
  ['ms-ayuda', 'VISUAL. El catálogo lo pinta <p> y el componente <span>. Un span es en línea: la ayuda se pega al texto de la opción en vez de caer debajo, y el margen inferior de 12px no se aplica. Ojo al arreglarlo: <p> dentro de <label> no es válido, así que lo que cambia es el CATÁLOGO y la hoja gana display:block.'],
  ['fc-campo', 'El catálogo enseña un <input> y el componente emite un <button>. El componente tiene razón —un campo que abre un calendario es un botón, no un campo de escritura— así que lo que está mal es lo que se enseña.'],
  ['cg-in', 'El catálogo lo pinta sobre <input> y el componente sobre <span>. Consecuencia: las reglas :disabled de .cg-in NO pueden casar nunca en el producto.'],
]);

/* ── El cruce ─────────────────────────────────────────────────────────────── */

const fallos = [];
let comparadas = 0;
let sinPagina = 0;
let porGuion = 0;

for (const [clase, e] of emitido) {
  const enCatalogo = etiquetasCatalogo.get(clase);
  // Una clase que el catálogo no pinta no es asunto de este candado: de eso ya
  // responde `verificar-entrega`, que exige página para cada componente.
  if (!enCatalogo) { sinPagina++; continue; }
  if (laPintaElGuion(clase)) { porGuion++; continue; }
  comparadas++;

  const cruce = [...e.etiquetas].some((t) => enCatalogo.has(t));
  if (!cruce) {
    fallos.push({
      clase,
      de: e.de,
      tipo: 'elemento',
      emite: [...e.etiquetas].sort(),
      ensena: [...enCatalogo].sort(),
    });
  }

}

/* ── Informe ──────────────────────────────────────────────────────────────── */

console.log('\n  Candado del elemento — lo que se enseña y lo que se emite\n');
console.log(`  Clases comparadas:   ${comparadas}`);
console.log(`  Sin página, omitidas: ${sinPagina}`);
console.log(`  Las pinta el guión:   ${porGuion}  — no comparables leyendo texto`);
if (sinResolver.length) {
  console.log(`  Sin resolver:        ${sinResolver.length} (${[...new Set(sinResolver)].slice(0, 3).join(', ')})`);
}

const nuevas = fallos.filter((f) => !DEUDA.has(f.clase));
const declaradas = fallos.filter((f) => DEUDA.has(f.clase));
// Una entrada de deuda que ya no salta es deuda pagada: hay que quitarla de la
// lista, o la lista se convierte en el inventario a mano de siempre.
const saldadas = [...DEUDA.keys()].filter((c) => !fallos.some((f) => f.clase === c));

if (declaradas.length) {
  console.log(`\n  ${declaradas.length} divergencia(s) DECLARADAS, pendientes de arreglo:\n`);
  for (const f of declaradas) {
    console.log(`    .${f.clase}  (${f.de})   enseña ${f.ensena.join('/')} · emite ${f.emite.join('/')}`);
    console.log(`      ${DEUDA.get(f.clase)}\n`);
  }
}

if (saldadas.length) {
  console.error(`\n  ${saldadas.length} entrada(s) de deuda que ya NO divergen:\n`);
  for (const c of saldadas) console.error(`    .${c}`);
  console.error('\n  Se arregló y no se quitó de la lista. Quítala: una lista de');
  console.error('  excepciones que nadie poda vuelve a ser el inventario a mano.\n');
  process.exit(1);
}

if (nuevas.length) {
  console.error(`\n  ${nuevas.length} divergencia(s) NUEVAS entre el catálogo y el componente:\n`);
  for (const f of nuevas) {
    console.error(`    .${f.clase}  (${f.de})`);
    console.error(`      el catálogo enseña:  ${f.ensena.join(', ')}`);
    console.error(`      el componente emite: ${f.emite.join(', ')}\n`);
  }
  console.error('  El candado de la promesa NO puede ver esto: compara la cascada');
  console.error('  sobre el MISMO marcado, y aquí lo que difiere es el marcado.');
  console.error('  Se ve bien en el catálogo y mal en cada producto.\n');
  process.exit(1);
}

console.log('\n  Ninguna divergencia nueva: lo que el catálogo enseña es lo que');
console.log('  el componente emite, salvo la deuda declarada de arriba.\n');
