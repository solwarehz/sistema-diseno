#!/usr/bin/env node
/**
 * CANDADO DE LA ALTURA — que una fila de controles sea UNA fila
 *
 *   node sistema/candado/verificar-altura.mjs
 *
 * POR QUÉ EXISTE. Lo reportó Control Administrativos V2.0 en el R136, medido en
 * su producto sobre la v1.117.0 instalada: una barra de filtros —una fecha, un
 * selector y el botón que dispara la consulta, en una fila— entregaba los
 * bordes superiores **escalonados**. Es de lo más común que monta nadie.
 *
 * Tienen razón en lo que dicen y en cómo lo dicen: *«con tres alturas
 * distintas, no hay alineación que salve la fila»*. Alinear por arriba solo
 * mueve el escalón abajo.
 *
 * LA CAUSA NO ERA UNA DIFERENCIA DE PÍXELES: ERA QUE `.campo` NO TENÍA ALTURA
 * PROPIA. `.btn` declaraba su interlineado —18px, que es además el tamaño del
 * icono de interfaz, y por eso un botón mide lo mismo lleve icono o no—, y
 * `.campo` **no declaraba ninguno**: su altura era la que heredase la hoja del
 * producto. El mismo componente medía 36,45 en el catálogo —interlínea 1,45,
 * medido en navegador y escrito en `FilaCarga` desde la v1.102.0— y otra cosa
 * en cada proyecto. El propio archivo lo avisaba: *«la cifra exacta depende de
 * la interlínea que herede el producto»*. Eso es lo que se acabó.
 *
 * Y el disparador del rango declaraba 20 **con el razonamiento escrito al
 * lado** —«con sus 16 de relleno son los 36 px de un campo, exactos»—, una
 * suma que se dejaba fuera el borde.
 *
 * QUÉ HACE, Y POR QUÉ MIDE FILAS Y NO UN NÚMERO. La primera versión de este
 * candado exigía **una sola altura para todo control**, y el arreglo que vino
 * con ella puso altura fija a todos. Dos auditorías lo pararon antes de
 * publicar: aplastaba las variantes que existen a propósito —el botón mini
 * pasaba de 28 a 36, la barra del editor crecía 8px por fila, los filtros
 * compactos de tabla de 28 a 36— y **recortaba el campo en error**, que lleva
 * borde de 2px. Una altura fija no arregla una altura mal calculada: la tapa.
 *
 * Un sistema no tiene UNA altura de control: tiene **filas**, y lo que importa
 * es que los que se ponen juntos midan lo mismo. Así que para cada fila
 * declarada se resuelve la cascada sobre la hoja QUE VIAJA y se comprueba que
 * **todos sus miembros midan igual** — interlineado + relleno + borde, que es
 * la altura que el navegador da a una caja `border-box` sin altura impuesta.
 *
 * La fila **en error** es una fila propia y no un adorno: el filete pasa de 1 a
 * 2px —señal no cromática, SC 1.4.1— y sin compensarlo un campo crece justo
 * cuando más se mira.
 *
 * QUÉ NO PODÍA VERLO, y por qué hacía falta uno más:
 *
 *   · El de la CASCADA comprueba reglas que faltan sobre un elemento. Aquí no
 *     faltaba ninguna regla: sobraban tres, cada una correcta por su cuenta.
 *   · El del EMPATE compara dos hojas buscando quién gana un desempate. Estas
 *     tres no empataban: `.btn` y `.campo` caen sobre elementos distintos.
 *   · El de la PROMESA resuelve las dos hojas sobre el MISMO marcado, así que
 *     las dos responden lo mismo para un campo y **las dos aciertan**.
 *
 * Ninguno hacía la pregunta que hace éste, que es una pregunta entre
 * COMPONENTES y no dentro de uno: **¿miden lo mismo los que se ponen en fila?**
 *
 * LÍMITES, declarados:
 *   · Se calcula, no se mide en un navegador: aquí no hay ninguno. Lo que el
 *     navegador añade por su cuenta —el reloj de `input[type=date]`— no se ve
 *     desde aquí; por eso ese caso se ataca donde nace, quitándole el relleno
 *     a `::-webkit-datetime-edit`, y no recortando la caja.
 *   · Se mide a **un ancho**, el de escritorio. La fila de móvil va en la deuda
 *     declarada de abajo, con sus números.
 *   · No mira `:hover` ni `:focus` — el resolutor los salta.
 *   · Las filas están escritas a mano. Un control nuevo que no se apunte no se
 *     comprueba; lo tapa a medias la prueba de `basicos.test.tsx`, que compara
 *     esta lista con lo que EMITEN los componentes.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';
import { parsear, resolver, elem } from './verificar-cascada.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const HOJA = join(RAIZ, 'sistema', 'componentes', 'componentes.css');
const ANCHO = 1280;

/* LAS FILAS. Cada una es un grupo de controles que se ponen juntos, con la
   cadena de ancestros que hace falta para resolver su cascada. */
const FILAS = [
  ['Fila normal', 36, [
    ['Botón',                 'Boton',            [elem('button', ['btn', 'btn-1'])]],
    ['Campo de texto',        'Campo',            [elem('input',  ['campo'])]],
    ['Selector',              'Selector',         [elem('select', ['campo'])]],
    ['Campo de fecha',        'Campo type=date',  [elem('input',  ['campo'], { type: 'date' })]],
    ['Campo de contraseña',   'CampoContrasena',  [elem('input',  ['campo', 'cp-in'], { type: 'password' })]],
    ['Selector con búsqueda', 'SelectorBusqueda', [elem('input',  ['campo', 'sel-in'])]],
    ['Disparador de rango',   'RangoFecha',       [elem('button', ['campo', 'fc-campo'])]],
  ]],
  /* EN ERROR es una fila propia: el filete de 2px es la señal no cromática del
     sistema y sin compensarla el campo crece justo cuando más se mira. */
  ['Fila en error', 36, [
    ['Campo en error',      'Campo',            [elem('input',  ['campo', 'campo-mal'])]],
    ['Selector en error',   'Selector',         [elem('select', ['campo', 'campo-mal'])]],
    ['Búsqueda en error',   'SelectorBusqueda', [elem('input',  ['campo', 'sel-in', 'campo-mal'])]],
    ['Rango en error',      'RangoFecha',       [elem('button', ['campo', 'fc-campo', 'cg-mal'])]],
  ]],
  /* LA COMPACTA existe a propósito —barras densas de tabla y de filtros— y el
     primer arreglo la aplastaba. Antes tampoco cuadraba: 28 contra 29,5. */
  ['Fila compacta', 28, [
    ['Botón mini',          'Boton',            [elem('button', ['btn', 'btn-1', 'btn-mini'])]],
    ['Filtro de columna',   'TablaDatos',       [elem('div', ['tb-mini']), elem('input', ['campo'])]],
    ['Buscador de tabla',   'TablaDatos',       [elem('div', ['tb-buscar']), elem('input', ['campo', 'sel-in'])]],
    ['Filtro de la barra',  'MarcoApp',         [elem('div', ['top-filtros']), elem('input', ['campo'])]],
  ]],
];

/* De VARIAS líneas: no entra en ninguna fila, y se comprueba lo contrario —
   que nadie le haya puesto una altura fija, que le recortaría el texto. */
const MULTILINEA = [
  ['Área de texto', 'AreaTexto', [elem('textarea', ['campo', 'ta'])]],
];

/* ── DEUDA DECLARADA ────────────────────────────────────────────────────────
   Filas que HOY no cuadran, medidas y escritas con su daño real. Se declaran
   en vez de disimularlas, y el candado falla también si una se arregla y nadie
   poda su línea: una lista de excepciones que nadie poda vuelve a ser el
   inventario a mano de siempre. */
const DEUDA = new Map([
  ['fila-movil',
    'En móvil y en el panel de filtros el campo sube a 16px de cuerpo —está ahí para que '
    + 'iOS no haga zoom al enfocar— y con su interlineado de 1,5 mide 42px, mientras el botón '
    + 'de al lado sigue en 36. Una barra de filtros en el teléfono sale escalonada 6px. '
    + 'No lo arregla esta versión porque las dos salidas son decisiones de diseño que nadie ha '
    + 'tomado: subir también el botón (cambia el cuerpo de su rótulo) o bajar el campo (devuelve '
    + 'el zoom de iOS). Medido: fg-panel 42 · m-cuerpo 42 · m-filtros-movil 40,5 · botón 36.'],
  ['controles-sin-interlineado',
    'Segmentado (button.sg-op) y Paginación (button.pgn-btn) no declaran interlineado, así que '
    + 'su altura no se puede calcular desde la hoja y no entran en ninguna fila. Segmentado '
    + 'declara min-height 44 y Paginación height 28, los dos a mano. Si alguien los pone en una '
    + 'barra de filtros —y Segmentado es un control de barra de filtros— nada comprueba que '
    + 'casen con sus vecinos.'],
]);

const val = (reglas, cadena, prop) => {
  const d = resolver(reglas, cadena, prop, ANCHO);
  return d ? String(d.valor).trim() : null;
};

/* Las variables se resuelven contra la propia hoja: `height: var(--alto-control)`
   tiene que poder compararse con un número, o el candado daría por «sin altura»
   justo al control que la declara bien. */
const VARS = new Map(
  [...readFileSync(HOJA, 'utf8').matchAll(/(--[a-z0-9-]+):\s*([^;}]+)/gi)]
    .map(([, k, val]) => [k, val.trim()]),
);

/** `8px 16px` → 8 arriba y 8 abajo. Solo longitudes en px; lo demás, null. */
const px = (v) => {
  if (v === null) return null;
  let t = v.trim();
  const uso = /^var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)$/i.exec(t);
  if (uso) t = VARS.get(uso[1]) ?? t;
  const m = /^(-?[\d.]+)px$/.exec(String(t).trim());
  return m ? Number(m[1]) : null;
};

/** El relleno vertical, mirando el atajo y las dos propiedades sueltas. */
function rellenoVertical(reglas, el) {
  const partes = (val(reglas, el, 'padding') ?? '').split(/\s+/).filter(Boolean);
  let arriba = partes.length ? px(partes[0]) : null;
  let abajo = partes.length >= 3 ? px(partes[2]) : arriba;
  const pb = px(val(reglas, el, 'padding-block'));
  if (pb !== null) { arriba = pb; abajo = pb; }
  const pt = px(val(reglas, el, 'padding-top'));
  const pbot = px(val(reglas, el, 'padding-bottom'));
  if (pt !== null) arriba = pt;
  if (pbot !== null) abajo = pbot;
  return arriba === null || abajo === null ? null : arriba + abajo;
}

/** El borde vertical. `1px solid transparent` cuenta: transparente ocupa. */
function bordeVertical(reglas, el) {
  const atajo = val(reglas, el, 'border');
  let ancho = atajo ? px((atajo.split(/\s+/)[0] ?? '')) : null;
  const bw = px(val(reglas, el, 'border-width'));
  if (bw !== null) ancho = bw;
  if (ancho === null) return null;
  return ancho * 2;
}

/** El interlineado en px. Sin unidad —`1.5`— se multiplica por el cuerpo. */
function interlineado(reglas, el) {
  const lh = val(reglas, el, 'line-height');
  const cuerpo = px(val(reglas, el, 'font-size'));
  if (lh === null) return { px: null, crudo: '(hereda)' };
  const enPx = px(lh);
  if (enPx !== null) return { px: enPx, crudo: lh };
  const factor = Number(lh);
  if (!Number.isNaN(factor) && cuerpo !== null) return { px: factor * cuerpo, crudo: lh };
  return { px: null, crudo: lh };
}

const reglas = parsear(readFileSync(HOJA, 'utf8'));

/* El valor de referencia de la fila normal sale de la hoja, no de un número
   escrito aquí: si alguien cambia `--alto-control`, esto mide contra el valor
   nuevo y no contra el que tenía en la cabeza quien lo escribió. */
const DECL = /--alto-control:\s*([\d.]+)px/.exec(readFileSync(HOJA, 'utf8'));
if (!DECL) {
  console.error('\n  La hoja no declara `--alto-control`.\n');
  console.error('  La altura de la fila normal se declara en UN sitio. Sin esa variable');
  console.error('  cada control vuelve a heredar la suya y la fila se escalona: el R136.\n');
  process.exit(1);
}
const ALTO = Number(DECL[1]);

/** La altura que da el navegador a una caja `border-box` sin altura impuesta. */
function medir(cadena) {
  const li = interlineado(reglas, cadena);
  const relleno = rellenoVertical(reglas, cadena);
  const borde = bordeVertical(reglas, cadena);
  const fija = px(val(reglas, cadena, 'height'));
  const minima = px(val(reglas, cadena, 'min-height'));
  const natural = li.px === null || relleno === null || borde === null
    ? null : li.px + relleno + borde;
  return { li, relleno, borde, natural, fija, minima };
}

console.log(`\n  Candado de la altura — MMI-DS v${VERSION}\n`);
console.log(`  Hoja medida:      ${HOJA.replace(RAIZ + '/', '')}   (la que VIAJA)`);
console.log(`  --alto-control:   ${ALTO}px`);
console.log(`  Filas:            ${FILAS.length} · ${FILAS.reduce((n, f) => n + f[2].length, 0)} controles`);
console.log(`  Deuda declarada:  ${DEUDA.size}\n`);

const fallos = [];

for (const [fila, esperado, miembros] of FILAS) {
  const ancho = Math.max(...miembros.map((m) => m[0].length));
  console.log(`  ${fila} — ${esperado}px`);
  for (const [nombre, componente, cadena] of miembros) {
    const m = medir(cadena);
    console.log(`    ${nombre.padEnd(ancho)}  ${String(m.li.crudo).padStart(9)}`
      + ` + ${String(m.relleno ?? '?').padStart(2)} + ${String(m.borde ?? '?').padStart(1)}`
      + `  =  ${String(m.natural ?? '?').padStart(5)}`
      + (m.fija !== null ? `   height ${m.fija}` : '')
      + (m.minima !== null ? `   min ${m.minima}` : ''));

    if (m.natural === null) {
      fallos.push(`${fila} · ${nombre} (${componente}): no se puede calcular su altura `
        + `—interlineado ${m.li.crudo}, relleno ${m.relleno}, borde ${m.borde}—. `
        + `Un control cuya altura no se puede calcular es un control cuya altura nadie decidió: `
        + `la hereda de la hoja del producto, y entonces mide una cosa distinta en cada uno.`);
      continue;
    }
    if (m.natural !== esperado) {
      fallos.push(`${fila} · ${nombre} (${componente}) mide ${m.natural}px y la fila son ${esperado}px. `
        + `Sale de interlineado ${m.li.crudo} + relleno ${m.relleno} + borde ${m.borde}. `
        + `Puesto al lado de los otros de su fila, los bordes se escalonan.`);
    }
    /* Una altura IMPUESTA por debajo de la natural recorta el texto, y es la
       trampa en la que cayó el primer arreglo de esta misma versión. */
    if (m.fija !== null && m.fija < m.natural) {
      fallos.push(`${fila} · ${nombre} (${componente}) lleva height ${m.fija}px con una altura `
        + `natural de ${m.natural}px: RECORTA ${m.natural - m.fija}px de texto. `
        + `Una altura fija no arregla una altura mal calculada, la tapa.`);
    }
    if (m.minima !== null && m.minima > m.natural) {
      fallos.push(`${fila} · ${nombre} (${componente}) lleva min-height ${m.minima}px sobre una `
        + `altura natural de ${m.natural}px: lo estira y anula su relleno propio.`);
    }
  }
  console.log('');
}

for (const [nombre, componente, cadena] of MULTILINEA) {
  const m = medir(cadena);
  console.log(`  De varias líneas`);
  console.log(`    ${nombre}  ${m.li.crudo} + ${m.relleno} + ${m.borde}  =  ${m.natural}`
    + (m.fija !== null ? `   height ${m.fija}` : '   sin altura fija'));
  if (m.fija !== null && m.fija !== 'auto') {
    fallos.push(`${nombre} (${componente}) lleva height ${m.fija}. Es de VARIAS líneas: `
      + `una altura fija le recorta el texto. Lo suyo es min-height.`);
  }
  if (m.minima !== null && m.minima > ALTO) {
    fallos.push(`${nombre} (${componente}) lleva min-height ${m.minima}px, por encima de los `
      + `${ALTO}px de la fila normal: vacío se ve más alto que un campo, y no hay motivo.`);
  }
}

if (DEUDA.size) {
  console.log(`\n  Deuda declarada, medida y pendiente:\n`);
  for (const [clave, porque] of DEUDA) console.log(`    · ${clave}\n      ${porque}\n`);
}

if (fallos.length) {
  console.error(`\n  ${fallos.length} problema(s):\n`);
  for (const f of fallos) console.error(`    · ${f}`);
  console.error('\n  Una fila de controles es UNA fila. Si miden distinto no hay alineación');
  console.error('  que la salve: alinear por arriba mueve el escalón abajo y al revés.\n');
  process.exit(1);
}

console.log(`  Las ${FILAS.length} filas cuadran. Una barra de filtros sale a ras.\n`);
