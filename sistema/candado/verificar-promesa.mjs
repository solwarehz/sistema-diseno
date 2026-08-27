#!/usr/bin/env node
/**
 * CANDADO DE LA PROMESA — que lo entregado se vea IGUAL que lo enseñado
 *
 *   node sistema/candado/verificar-promesa.mjs
 *
 * POR QUÉ EXISTE. Lo pidió el responsable con estas palabras:
 *
 *   «pero en el sistema, no veo el boton csv como lo veo en el cascaron,
 *    asegurate que la entrega sea igual que la promesa, no lo dejes a
 *    criterio.»
 *
 * «No lo dejes a criterio» es la parte que manda. Había ya una herramienta de
 * auditoría que cruzaba promesa y entrega, pero comparaba **qué clases** pinta
 * cada lado — y el defecto del botón de CSV no era una clase que faltara: era
 * una DECLARACIÓN que no llegaba. Una lista de clases iguales puede acompañar
 * a dos botones que se ven distinto.
 *
 * QUÉ HACE. Resuelve la cascada DOS VECES sobre el mismo marcado —una con la
 * hoja del catálogo, que es la promesa, y otra con `componentes.css`, que es
 * lo que viaja— y compara valor a valor. Cualquier propiedad que gane un valor
 * distinto en cada hoja es un elemento que en el producto no se ve como en el
 * catálogo, y falla.
 *
 * No lleva lista de propiedades «importantes»: compara la UNIÓN de todo lo que
 * cualquiera de las dos hojas declare para ese elemento. Elegir qué mirar
 * habría sido, otra vez, dejarlo a criterio.
 *
 * QUÉ NO PUEDE VER, dicho para que nadie le pida más de lo que mide:
 *
 *   · Lo que NINGUNA de las dos hojas declara y hereda de la página que monta
 *     el componente. Ahí las dos coinciden —en no decir nada— y no hay
 *     diferencia que encontrar. Ese fue justamente el defecto del `line-height`
 *     del botón, y lo vigila `ALTURA-PROPIA` en el candado de la cascada.
 *   · El diseño. Sabe qué valores llegan, no cuánto acaba midiendo la caja.
 *
 * Cálculo puro. No toca red. No escribe nada.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';
import { parsear, resolver, elem, casa } from './verificar-cascada.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

/**
 * LAS CADENAS SE ESCRIBEN CON EL MARCADO REAL DEL COMPONENTE, sin el mobiliario
 * del catálogo. Es lo que hace válida la comparación: si se colara una clase de
 * la página —`.muestra-fila`, `.bloque`—, casarían reglas que nadie prometió
 * entregar y saldrían diferencias falsas.
 *
 * Cada entrada es la cadena de antepasados hasta el elemento medido.
 */
const CASOS = [
  // El que lo destapó: el botón de CSV de la barra de la tabla.
  ['Botón CSV de la tabla', [
    elem('div', ['tb-barra']), elem('div', ['tb-barra-der']),
    elem('button', ['btn', 'btn-2', 'btn-ic']),
  ]],
  ['Su icono', [
    elem('div', ['tb-barra']), elem('div', ['tb-barra-der']),
    elem('button', ['btn', 'btn-2', 'btn-ic']), elem('svg', ['ic']),
  ]],
  ['Botón de filtros', [
    elem('div', ['tb-barra']), elem('div', ['tb-barra-der']),
    elem('button', ['btn', 'btn-neutro', 'btn-ic'], { 'aria-expanded': 'false' }),
  ]],
  ['Botón principal', [elem('button', ['btn', 'btn-1'])]],
  ['Botón mini con icono', [elem('button', ['btn', 'btn-neutro', 'btn-mini', 'btn-ic'])]],
  ['Botón de solo icono', [elem('button', ['btn', 'btn-terc', 'btn-mini', 'btn-solo-ic'])]],
  ['Campo de texto', [elem('div', ['campo-grupo']), elem('input', ['campo'])]],
  ['Campo con error', [elem('div', ['campo-grupo']), elem('input', ['campo', 'campo-mal'])]],
  ['Área de texto', [elem('div', ['ta-crece']), elem('textarea', ['campo', 'ta'])]],
  ['Chip de éxito', [elem('span', ['chip', 'chip-exito'])]],
  ['Celda de la tabla', [elem('table', ['tb']), elem('tbody'), elem('tr'), elem('td', ['tb-indice', 'mono'])]],
  ['Cabecera de la tabla', [elem('table', ['tb']), elem('thead'), elem('tr'), elem('th', ['tb-th'])]],
  ['Paginación', [elem('div', ['pgn']), elem('button', ['pgn-btn'])]],
  // R102 · la fila común de las tres cargas. Va nombrada además del barrido
  // porque es la superficie de esta versión: si un día se cae del marcado, el
  // barrido dejaría de mirarla en silencio y aquí se vería el hueco.
  ['Fila de carga', [elem('div', ['cx']), elem('div', ['cx-fila'])]],
  ['Adjunto de archivo en la fila', [
    elem('div', ['cx']), elem('div', ['cx-fila']),
    elem('ul', ['cx-adjuntos']), elem('li', ['cx-adj']),
  ]],
  ['Miniatura de la fila', [
    elem('div', ['cx']), elem('div', ['cx-fila']),
    elem('ul', ['cx-adjuntos']), elem('li', ['cx-adj', 'cx-adj-img']),
    elem('img', ['cx-mini']),
  ]],
  ['Miniatura del documento de identidad', [
    elem('div', ['cx']), elem('div', ['cx-fila']),
    elem('ul', ['cx-adjuntos']), elem('li', ['cx-adj', 'cx-adj-img']),
    elem('button', ['cx-ver']), elem('img', ['cx-mini', 'cx-mini-id']),
  ]],
  ['Zona de soltar PDF', [elem('div', ['cpdf']), elem('div', ['cpdf-zona'])]],
  ['Fila de archivo PDF', [
    elem('div', ['cpdf']), elem('div', ['cpdf-panel']), elem('ul', ['cpdf-lista']),
    elem('li', ['cpdf-puesto']),
  ]],
  ['Avatar', [elem('span', ['avatar', 'avatar-l'])]],

  // R90 · EL HORARIO NO ESTABA EN ESTA LISTA. Salió al preguntar si la entrega
  // se veía igual que la promesa después de R88 y R89: el candado decía que sí
  // —y era verdad, se comprobó a mano con el motor del navegador: 19 elementos,
  // 12.654 propiedades, cero diferencias— pero NO MIRABA EL HORARIO. Verde por
  // no mirar es exactamente el defecto que este candado existe para no tener.
  // Es el mismo hueco que dejó pasar R87: lo que no está en la lista no se
  // compara, y una lista escrita a mano se queda corta en cuanto nace un
  // elemento. Se cubre entero, incluido el marcado que R89 estrenó.
  ['Envoltura del horario', [elem('div', ['hor-env'])]],
  ['Celda del horario', [elem('table', ['hor']), elem('tbody'), elem('tr'), elem('td', ['hor-c'])]],
  ['Celda vacía del horario', [elem('table', ['hor']), elem('tbody'), elem('tr'), elem('td', ['hor-c', 'hor-vacia'])]],
  ['Eje de horas', [elem('table', ['hor']), elem('tbody'), elem('tr'), elem('th', ['hor-eje', 'hor-eje-v'])]],
  ['Bloque del horario', [
    elem('table', ['hor']), elem('tbody'), elem('tr'), elem('td', ['hor-c']),
    elem('div', ['hor-pila']), elem('span', ['hor-b', 'hor-neutro']),
  ]],
  // R88 · el tono que agrupa, con su filete de 6px.
  ['Bloque de identidad', [
    elem('table', ['hor']), elem('tbody'), elem('tr'), elem('td', ['hor-c']),
    elem('div', ['hor-pila']), elem('span', ['hor-b', 'hor-identidad-1', 'hor-fr-5']),
  ]],
  // R89 · la pila y el hueco, que son la fracción.
  ['Pila de la celda', [
    elem('table', ['hor']), elem('tbody'), elem('tr'), elem('td', ['hor-c']), elem('div', ['hor-pila']),
  ]],
  ['Hueco de la fracción', [
    elem('table', ['hor']), elem('tbody'), elem('tr'), elem('td', ['hor-c']),
    elem('div', ['hor-pila']), elem('i', ['hor-hueco', 'hor-fr-3']),
  ]],
  ['Chip de identidad', [elem('span', ['chip', 'chip-identidad-1'])]],
  ['Punto de leyenda', [elem('span', ['chip', 'chip-punto', 'chip-identidad-1'])]],
  ['Aviso', [elem('div', ['av-zona']), elem('div', ['av', 'av-exito'])]],
  ['Diálogo', [elem('dialog', ['dialogo'])]],

  /**
   * EL MARCO, que no tenía NI UN CASO aquí — 184 reglas de las 707 que viajan
   * (`extraer.mjs` las cuenta), la pieza más grande del sistema, sin vigilar.
   * Se ve al mirar la lista de arriba: botones, campos, tabla, avisos… y ni
   * una `.lat`.
   *
   * Entraron cuando el responsable reportó el carril de 900px. Ese defecto era
   * de comportamiento y estos casos no lo habrían cazado —aquí se compara CSS—,
   * pero al ir a buscarlo apareció esto, que es peor: la parte del sistema que
   * más se reconstruye era la única sin candado de promesa.
   */
  ['Lateral desplegada', [elem('div', ['app', 'app-cascaron']), elem('aside', ['lat'])]],
  ['Lateral plegada (el carril)', [elem('div', ['app', 'app-cascaron']), elem('aside', ['lat', 'colapsado'])]],
  ['Opción del menú', [
    elem('div', ['app', 'app-cascaron']), elem('aside', ['lat']),
    elem('nav', ['lat-nav']), elem('a', ['nav-item']),
  ]],
  ['Opción activa', [
    elem('div', ['app', 'app-cascaron']), elem('aside', ['lat']),
    elem('nav', ['lat-nav']), elem('a', ['nav-item', 'activo']),
  ]],
  ['Hijo del menú', [
    elem('div', ['app', 'app-cascaron']), elem('aside', ['lat']), elem('nav', ['lat-nav']),
    elem('div', ['nav-grupo', 'abierto']), elem('div', ['nav-hijos']),
    elem('div', ['nav-hijos-in']), elem('a', ['nav-hijo']),
  ]],
  // El panel que se abre al lado del carril: existe SOLO bajo `.colapsado`, y
  // es lo que se ve a 900px. Si su posición o su capa no viajaran, el producto
  // lo tendría debajo del contenido y nadie lo vería.
  ['Panel flotante del grupo plegado', [
    elem('div', ['app', 'app-cascaron']), elem('aside', ['lat', 'colapsado']),
    elem('nav', ['lat-nav']), elem('div', ['nav-grupo', 'abierto']), elem('div', ['nav-hijos']),
  ]],
  ['Título del panel flotante', [
    elem('div', ['app', 'app-cascaron']), elem('aside', ['lat', 'colapsado']),
    elem('nav', ['lat-nav']), elem('div', ['nav-grupo', 'abierto']),
    elem('div', ['nav-hijos']), elem('div', ['nav-hijos-in']), elem('span', ['nav-flot-tit']),
  ]],
  ['Botón de plegar', [elem('div', ['top']), elem('button', ['top-plegar'])]],
  // R25 vivió aquí: los dos iconos pintados a la vez porque sus reglas base no
  // viajaban y solo llegaba la consulta de móvil.
  ['Icono de escritorio del botón de plegar', [
    elem('div', ['top']), elem('button', ['top-plegar']), elem('span', ['ic-escritorio']),
  ]],
  ['Icono de móvil del botón de plegar', [
    elem('div', ['top']), elem('button', ['top-plegar']), elem('span', ['ic-movil']),
  ]],
  ['Velo del cajón', [elem('div', ['app', 'app-cascaron']), elem('div', ['velo'])]],
];

/** Los anchos donde se compara. Una regla puede viajar y su @media no. */
const ANCHOS = [1440, 1024, 900, 700, 390];

// ─────────────────────────────────────────────────────────────────────────────
// LOS CASOS QUE NADIE ELIGE
//
// La lista de arriba la escribió alguien, y por eso el marco —la pieza más
// grande— pasó dos versiones sin un solo caso. Una lista a mano vigila lo que
// alguien se acordó de mirar, que es justo lo contrario de una garantía.
//
// Lo pidió el responsable con estas palabras: «que la promesa esté garantizada
// en cada componente». Así que los casos dejan de escribirse: se **recorre el
// marcado del catálogo** y se compara CADA elemento que pinta, con su cadena de
// antepasados real.
//
// La lista a mano se queda, y no sobra: el catálogo enseña un estado por
// elemento, y hay estados que su marcado no tiene abierto en ese momento —la
// lateral plegada y su panel flotante, el velo—. Esos hay que fijarlos.
// ─────────────────────────────────────────────────────────────────────────────

/** Etiquetas sin cierre. Sin esto la pila se desequilibra y las cadenas mienten. */
const VACIAS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
  // Del SVG, que va inline en el catálogo y también se cierra solo.
  'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'stop',
]);

/** Qué atributos miran los selectores. Solo esos se recogen del marcado. */
function atributosVigilados(hojas) {
  const nombres = new Set();
  for (const reglas of hojas) {
    for (const r of reglas) {
      for (const m of r.sel.matchAll(/\[([a-zA-Z-]+)/g)) nombres.add(m[1]);
    }
  }
  return nombres;
}

/**
 * Recorre el marcado y devuelve la cadena de antepasados de CADA elemento.
 *
 * No es un analizador de HTML completo y no pretende serlo: el catálogo lo
 * genera este repositorio, así que el marcado es el que escribimos. Lo que sí
 * hace falta es no equivocarse con la pila —de ahí las etiquetas vacías y el
 * cierre implícito— porque una cadena mal formada compara un elemento que no
 * existe y saca diferencias que nadie puede arreglar.
 */
function recorrerMarcado(html, attrsVigilados) {
  const cuerpo = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const pila = [];
  const cadenas = new Map(); // firma -> cadena
  const ETIQUETA = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

  for (const m of cuerpo.matchAll(ETIQUETA)) {
    const [, cierre, tagCrudo, crudo, solo] = m;
    const tag = tagCrudo.toLowerCase();

    if (cierre) {
      // Cierre: se desapila hasta el mismo nombre. Si no está, se ignora — es
      // marcado roto, y romperse aquí sería peor que seguir.
      const i = pila.map((e) => e.tag).lastIndexOf(tag);
      if (i >= 0) pila.length = i;
      continue;
    }

    const clases = (crudo.match(/\sclass=["']([^"']*)["']/) || [, ''])[1]
      .split(/\s+/).filter(Boolean);
    const attrs = {};
    for (const a of crudo.matchAll(/\s([a-zA-Z-]+)(?:=["']([^"']*)["'])?/g)) {
      if (attrsVigilados.has(a[1])) attrs[a[1]] = a[2] ?? '';
    }

    const el = elem(tag, clases, attrs);
    const cadena = [...pila.map((e) => e.el), el];
    const firma = cadena
      .map((e) => e.tag + [...e.clases].sort().map((c) => '.' + c).join('')
        + Object.entries(e.attrs).map(([k, v]) => `[${k}="${v}"]`).join(''))
      .join(' ');
    if (!cadenas.has(firma)) cadenas.set(firma, cadena);

    if (!solo && !VACIAS.has(tag)) pila.push({ tag, el });
  }
  return cadenas;
}

/**
 * Toda propiedad que cualquiera de las dos hojas declare para este elemento.
 * No hay lista blanca: elegir qué mirar sería dejarlo a criterio.
 */
function propiedadesEnJuego(hojas, cadena) {
  const props = new Set();
  for (const reglas of hojas) {
    for (const r of reglas) {
      if (/:(hover|focus|active|focus-visible|focus-within)/.test(r.sel)) continue;
      if (casa(r.sel, cadena) !== true) continue;
      for (const p of r.decl.keys()) props.add(p);
    }
  }
  return [...props].sort();
}

// ─────────────────────────────────────────────────────────────────────────────

const html = readFileSync(join(RAIZ, 'cascaron', 'index.html'), 'utf8');
const estilos = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
if (!estilos.trim()) {
  console.error('\n  No se encontró la hoja del catálogo dentro de cascaron/index.html.\n');
  process.exit(1);
}

const promesa = parsear(estilos);
// LAS DOS HOJAS, en el orden en que el paquete manda importarlas. El catálogo
// lleva los tokens dentro de su `<style>`; la entrega los reparte en
// `tokens.css`. Comparar solo contra `componentes.css` daría por «no entregado»
// todo el panel de color, que sí viaja — solo que en el otro archivo.
const entrega = parsear(
  readFileSync(join(RAIZ, 'sistema/tokens/tokens.css'), 'utf8')
  + '\n'
  + readFileSync(join(RAIZ, 'sistema/componentes/componentes.css'), 'utf8'),
);

/**
 * QUÉ ES «DEL SISTEMA» Y QUÉ ES MOBILIARIO DEL CATÁLOGO.
 *
 * El catálogo es una página, y una página tiene cromo propio —su índice, sus
 * fichas de muestra, sus tablas de documentación— que **no viaja ni debe
 * viajar**. Compararlo daría miles de diferencias que nadie puede arreglar,
 * porque no son un incumplimiento: son la página.
 *
 * La frontera no se elige a ojo: es **la clase declarada en la hoja que viaja**.
 * Si `componentes.css` declara la clase, ese elemento es del sistema y la
 * entrega tiene que verse igual. Si no la declara ninguna de sus clases, es
 * mobiliario — y se **cuenta y se dice** cuántos se saltaron, para que nadie lea
 * el verde como si cubriera la página entera.
 */
const CLASES_QUE_VIAJAN = new Set();
for (const r of entrega) {
  for (const m of r.sel.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) CLASES_QUE_VIAJAN.add(m[1]);
}

const attrs = atributosVigilados([promesa, entrega]);
const delMarcado = recorrerMarcado(html, attrs);

/** Un elemento es del sistema si NINGUNA de sus clases es sólo del catálogo. */
const esDelSistema = (el) => [...el.clases].every((c) => CLASES_QUE_VIAJAN.has(c));

const automaticos = [];
let mobiliario = 0;
for (const [, cadena] of delMarcado) {
  const hoja = cadena[cadena.length - 1];
  // Con alguna clase que viaja —si no, es una caja de la página— y con NINGUNA
  // que no viaje: `.top.top-cascaron` es la barra DEL CATÁLOGO, y el producto
  // emite `.top` a secas. Compararla diría que la entrega incumple algo que
  // nadie le prometió.
  if (!esDelSistema(hoja) || ![...hoja.clases].some((c) => CLASES_QUE_VIAJAN.has(c))) {
    mobiliario++;
    continue;
  }
  // Los antepasados que son mobiliario se retiran de la cadena por lo mismo:
  // una regla como `.pagina .btn` decora la página, y el producto no tiene
  // `.pagina`. Se retiran ellos, no sus descendientes.
  const cadenaLimpia = cadena.filter(esDelSistema);
  const firma = cadenaLimpia
    .map((e) => e.tag + [...e.clases].sort().map((c) => '.' + c).join('')
      + Object.entries(e.attrs).map(([k, v]) => `[${k}="${v}"]`).join(''))
    .join(' ');
  automaticos.push([firma, cadenaLimpia]);
}
// Retirar antepasados junta cadenas que antes eran distintas.
const unicos = new Map(automaticos);

const TODOS = [
  ...CASOS.map(([n, c]) => [n, c, true]),
  ...[...unicos].map(([n, c]) => [n, c, false]),
];

console.log(`\n  Candado de la promesa — MMI-DS v${VERSION}\n`);
console.log(`  Promesa (catálogo):  ${promesa.length} reglas`);
console.log(`  Entrega (viaja):     ${entrega.length} reglas`);
console.log(`  Del marcado:         ${unicos.size} elementos del sistema`
  + ` · ${mobiliario} de mobiliario del catálogo, no comparados`);
console.log(`  Fijados a mano:      ${CASOS.length} (estados que el marcado no tiene abiertos)`);
console.log(`  Anchos:              ${ANCHOS.join(', ')}\n`);

let fallos = 0;
let comparados = 0;
let propsTotales = 0;
const rotos = new Map(); // firma corta -> diferencias, para no repetir el mismo aviso

for (const [nombre, cadena, aMano] of TODOS) {
  // Las reglas que casan se calculan UNA VEZ por elemento. Antes se volvían a
  // casar por cada propiedad y por cada ancho: con los casos a mano daba igual,
  // con el marcado entero no terminaría nunca.
  const casanP = promesa.filter((r) => casa(r.sel, cadena) === true);
  const casanE = entrega.filter((r) => casa(r.sel, cadena) === true);
  const props = propiedadesEnJuego([casanP, casanE], cadena);
  comparados++;
  propsTotales += props.length;

  const diffs = [];
  for (const ancho of ANCHOS) {
    for (const prop of props) {
      const a = resolver(casanP, cadena, prop, ancho);
      const b = resolver(casanE, cadena, prop, ancho);
      const va = a ? a.valor : '(sin regla)';
      const vb = b ? b.valor : '(sin regla)';
      if (va === vb) continue;
      diffs.push(`  ${String(ancho).padStart(4)}px  ${prop}: catálogo «${va}» · entrega «${vb}»`
        + (a ? `\n           lo pone ${a.sel}${a.media.length ? ' @media ' + a.media.join(' and ') : ''}` : ''));
    }
  }
  if (diffs.length) {
    fallos += diffs.length;
    rotos.set(nombre, diffs);
  } else if (aMano) {
    console.log(`  ✓ ${nombre.padEnd(24)} ${props.length} propiedades, idénticas`);
  }
}

if (!fallos) {
  console.log(`\n  ${comparados} elementos comparados · ${propsTotales} propiedades resueltas`
    + ` en ${ANCHOS.length} anchos.`);
}

for (const [nombre, diffs] of rotos) {
  console.error(`  ✗ ${nombre}`);
  for (const d of diffs) console.error(d);
  console.error('');
}

if (fallos) {
  console.error(`\n  ${fallos} diferencia(s) entre lo que el catálogo ENSEÑA y lo que el`);
  console.error('  paquete ENTREGA. Un producto que instale el sistema NO verá lo que');
  console.error('  se le prometió. Casi siempre es una regla que el extractor no se');
  console.error('  lleva porque su primera clase no está en ELEMENTOS.\n');
  process.exit(1);
}
console.log('\n  La entrega se ve igual que la promesa, en todo lo que el catálogo pinta.\n');
