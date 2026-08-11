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
  ['Zona de soltar PDF', [elem('div', ['cpdf']), elem('div', ['cpdf-zona'])]],
  ['Fila de archivo PDF', [
    elem('div', ['cpdf']), elem('div', ['cpdf-panel']), elem('ul', ['cpdf-lista']),
    elem('li', ['cpdf-puesto']),
  ]],
  ['Avatar', [elem('span', ['avatar', 'avatar-l'])]],
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

console.log(`\n  Candado de la promesa — MMI-DS v${VERSION}\n`);
console.log(`  Promesa (catálogo):  ${promesa.length} reglas`);
console.log(`  Entrega (viaja):     ${entrega.length} reglas`);
console.log(`  Casos:               ${CASOS.length} · anchos ${ANCHOS.join(', ')}\n`);

let fallos = 0;
for (const [nombre, cadena] of CASOS) {
  const diffs = [];
  const props = propiedadesEnJuego([promesa, entrega], cadena);
  for (const ancho of ANCHOS) {
    for (const prop of props) {
      const a = resolver(promesa, cadena, prop, ancho);
      const b = resolver(entrega, cadena, prop, ancho);
      const va = a ? a.valor : '(sin regla)';
      const vb = b ? b.valor : '(sin regla)';
      if (va === vb) continue;
      diffs.push(`  ${String(ancho).padStart(4)}px  ${prop}: catálogo «${va}» · entrega «${vb}»`
        + (a ? `\n           lo pone ${a.sel}${a.media.length ? ' @media ' + a.media.join(' and ') : ''}` : ''));
    }
  }
  if (diffs.length) {
    fallos += diffs.length;
    console.error(`  ✗ ${nombre}  (${props.length} propiedades en juego)`);
    for (const d of diffs) console.error(d);
    console.error('');
  } else {
    console.log(`  ✓ ${nombre.padEnd(24)} ${props.length} propiedades, idénticas`);
  }
}

if (fallos) {
  console.error(`\n  ${fallos} diferencia(s) entre lo que el catálogo ENSEÑA y lo que el`);
  console.error('  paquete ENTREGA. Un producto que instale el sistema NO verá lo que');
  console.error('  se le prometió. Casi siempre es una regla que el extractor no se');
  console.error('  lleva porque su primera clase no está en ELEMENTOS.\n');
  process.exit(1);
}
console.log('\n  La entrega se ve igual que la promesa, en todos los casos medidos.\n');
