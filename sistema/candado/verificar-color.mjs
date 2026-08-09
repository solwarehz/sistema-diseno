/**
 * CANDADO DE COLOR — ningún hexadecimal fuera de la fuente
 *
 *   node sistema/candado/verificar-color.mjs
 *
 * El candado de contraste comprueba que los PARES DE TOKENS cumplen WCAG. No
 * puede ver otra cosa: si alguien escribe `background: #3B82F6` en una hoja de
 * estilos, ese color no es un token, no está en ningún par, y el verificador
 * de contraste sale en verde mientras la pantalla incumple.
 *
 * Esa es exactamente la distancia entre «el contrato cumple» y «la página
 * cumple» (§5.2.2). Este archivo la cierra.
 *
 * Comprueba cuatro cosas:
 *
 *   1 · Todo valor de `semanticos` y de `marca` existe en alguna familia.
 *   2 · En `tokens.css` los hexadecimales solo aparecen DECLARANDO variables.
 *       Una regla normal que escriba un hexadecimal es un fallo.
 *   3 · En el catálogo, el CSS solo lleva hexadecimales dentro del bloque de
 *       tokens. El resto tiene que ir por `var(--token)`.
 *   4 · Ningún atributo `style=` del marcado lleva un hexadecimal.
 *
 * Lo que NO cuenta como infracción, y por qué:
 *   · el texto visible de la página de Color, que muestra el valor a propósito;
 *   · los atributos `data-*`, que son ese mismo dato para el botón de copiar;
 *   · la prosa del registro de cambios y de las correcciones, donde citar un
 *     valor antiguo es justamente lo que se está explicando.
 *
 * Cálculo puro. No toca red. No escribe nada.
 */

import { readFileSync, existsSync } from 'node:fs';
import * as fsSync from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { primitivas, categoricas, autorizados, restringidos, semanticos, marca, VERSION } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

// ── Lista blanca: todo color que el sistema reconoce ───────────────────────

// DEFINIDOS son los que el sistema sabe nombrar. AUTORIZADOS son los que
// además pueden usarse. La diferencia son los cinco de `marca`: se nombran
// —si no, nadie puede vigilarlos— pero no se pintan fuera de su sitio.
const DEFINIDOS = new Map(); // hex en mayúsculas → nombre del escalón
for (const [nombre, hex] of [...autorizados, ...restringidos]) {
  const k = hex.toUpperCase();
  if (!DEFINIDOS.has(k)) DEFINIDOS.set(k, nombre);
}

const AUTORIZADOS = new Set(autorizados.map(([, h]) => h.toUpperCase()));

// Un valor restringido solo puede aparecer declarando SU PROPIA variable. Son
// dos, y las dos legítimas: el escalón `--marca_rojo`, que existe para poder
// PINTAR la muestra del color prohibido en el catálogo, y el token semántico
// `--marca-rojo`, que es lo que consume la landing.
//
// En cualquier otro sitio —una regla, un componente, un `style=`— es un color
// de marca metido en la interfaz, que es justo lo que §2.3 prohíbe.
const declaraSuVariable = (linea, hex) => {
  const familia = (DEFINIDOS.get(hex.toUpperCase()) ?? '').split('_')[0];
  return new RegExp(`--${familia}[_-][A-Za-z0-9_-]*\\s*:`).test(linea);
};

const fallos = [];
const apunta = (archivo, linea, texto, motivo) =>
  fallos.push({ archivo, linea, texto: texto.trim().slice(0, 92), motivo });

// ── 1 · Los tokens salen de una familia ────────────────────────────────────
//
// Redundante con el resolutor de `fuente.mjs`, que ya no admite literales. Se
// comprueba igual porque un candado que confía en otro candado deja de avisar
// el día que aflojan el primero.

let tokensRevisados = 0;
for (const [conjunto, tabla] of [['semanticos', semanticos], ['marca', marca]]) {
  for (const [nombre, t] of Object.entries(tabla)) {
    for (const modo of ['claro', 'oscuro']) {
      tokensRevisados++;
      if (!DEFINIDOS.has(t[modo].toUpperCase())) {
        apunta(
          'sistema/tokens/fuente.mjs', 0,
          `${conjunto} › ${nombre}.${modo} = ${t[modo]}`,
          'el valor no pertenece a ninguna familia'
        );
      }
    }
  }
}

// ── 2 y 3 · Hexadecimales en hojas de estilo ───────────────────────────────
//
// Un hexadecimal en CSS solo se admite declarando una variable: `--x: #ABC`.
// En cualquier otra posición —`background: #ABC`, `border: 1px solid #ABC`—
// es un color que se saltó el sistema.

const DECLARA_VARIABLE = /^\s*--[A-Za-z0-9_-]+\s*:/;

// Un comentario que cita un valor está EXPLICANDO, no pintando: media docena
// de reglas del sistema documentan por qué se rechazó un tono, y esos textos
// tienen que poder decir cuál era. Se vacían antes de analizar —conservando
// los saltos de línea, para no descuadrar los números que se reportan—.
const sinComentarios = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (c) => '\n'.repeat((c.match(/\n/g) ?? []).length));

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES DE COLOR
//
// Este candado solo miraba hexadecimales, y era un agujero del tamaño de la
// puerta: `background: rgb(59,130,246)` se le escapaba entero. El de lint las
// prohíbe, pero solo lee JS y TS —no toca una hoja de estilos—, así que en CSS
// no las vigilaba nadie.
//
// Se cierra al mismo tiempo que se relajan, que es cuando toca: el usuario
// autorizó `rgba()` PARA SOMBRAS. Una sombra no es color de superficie, no
// lleva texto encima y ningún criterio de WCAG la mide; prohibirla obligaba a
// que el propio sistema incumpliera su regla —lo hacía, con
// `rgba(0,0,0,.16)`—.
//
// Fuera de una sombra siguen prohibidas, y ahora de verdad.
// ─────────────────────────────────────────────────────────────────────────────

const FUNCION_COLOR = /\b(rgba?|hsla?|color-mix|oklch|lab)\s*\(([^)]*)\)/g;
// Sin \b delante: `--sombra` empieza por guion, que no es caracter de
// palabra, y el limite no casaba nunca. La declaracion de las sombras se
// denunciaba a si misma.
const ES_SOMBRA = /(box-shadow|text-shadow|drop-shadow|--sombra-[a-z-]+)\s*:/;

const aHex = (canales) => {
  const n = canales.split(/[,\s/]+/).filter(Boolean).map(Number);
  if (n.length < 3 || n.slice(0, 3).some((x) => !Number.isFinite(x))) return null;
  return '#' + n.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();
};

const revisarFunciones = (linea, archivo, nLinea) => {
  FUNCION_COLOR.lastIndex = 0;
  for (const m of linea.matchAll(FUNCION_COLOR)) {
    if (ES_SOMBRA.test(linea)) {
      // Permitida, pero el color de la sombra tampoco se inventa.
      const hex = aHex(m[2]);
      if (hex && !DEFINIDOS.has(hex)) {
        apunta(archivo, nLinea, linea, `${m[0]} en una sombra, pero ${hex} no pertenece a ninguna familia`);
      }
      continue;
    }
    apunta(archivo, nLinea, linea,
      `${m[1]}() fuera de una sombra; el candado de contraste no puede verificar lo que no pasa por el token`);
  }
};

const revisarCss = (cssCrudo, archivo, desplazamiento = 0) => {
  const css = sinComentarios(cssCrudo);
  css.split('\n').forEach((linea, i) => {
    revisarFunciones(linea, archivo, desplazamiento + i + 1);
    if (!HEX.test(linea)) { HEX.lastIndex = 0; return; }
    HEX.lastIndex = 0;
    if (DECLARA_VARIABLE.test(linea)) {
      // Declara variable: se admite, pero el valor tiene que estar definido.
      for (const h of linea.match(HEX) ?? []) {
        if (!DEFINIDOS.has(h.toUpperCase())) {
          apunta(archivo, desplazamiento + i + 1, linea, `${h} no pertenece a ninguna familia`);
        } else if (!AUTORIZADOS.has(h.toUpperCase()) && !declaraSuVariable(linea, h)) {
          apunta(archivo, desplazamiento + i + 1, linea,
            `${h} es ${DEFINIDOS.get(h.toUpperCase())}: conocido, no autorizado fuera de --marca-*`);
        }
      }
      return;
    }
    apunta(archivo, desplazamiento + i + 1, linea, 'hexadecimal en una regla; usa var(--token)');
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// QUÉ SE RECORRE
//
// Hasta ahora eran tres rutas escritas a mano, y por eso no veía
// `cascaron/prueba-componentes.html` —175 hexadecimales— ni vería el próximo
// archivo que alguien añada. Un candado con la lista de sitios escrita a mano
// solo protege los sitios que ya existían el día que se escribió.
//
// Ahora se recorre el repositorio entero y se examina TODO .css y TODO .html.
// Lo que se salta es explícito y corto:
//
//   · `node_modules`, `.git` y las carpetas de salida — no son nuestros.
//   · los `.md` — son prosa. Media docena de documentos explican POR QUÉ se
//     rechazó un tono, y esos textos tienen que poder decir cuál era. Se
//     censan al final para que no queden invisibles, pero no bloquean.
//   · las bancadas de prueba de los propios candados, declaradas abajo: su
//     trabajo es contener color prohibido para demostrar que el candado falla.
//     Sin esta exención, probar un candado lo rompería.
// ─────────────────────────────────────────────────────────────────────────────

const SALTAR_CARPETA = new Set(['node_modules', '.git', 'dist', 'build', 'cobertura']);

const BANCADAS = new Set([
  'pruebas/infracciones.tsx',               // las 10 infracciones que el lint debe bloquear
  'sistema/candado/probar-candado.mjs',     // 62 casos, con los valores prohibidos dentro
  'sistema/candado/verificar-color.mjs',    // este archivo: los ejemplos de su propia doc
  'sistema/candado/candado.eslint.config.mjs',
]);

const listar = (dir) => {
  const { readdirSync } = fsSync;
  const salida = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SALTAR_CARPETA.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) salida.push(...listar(p));
    else salida.push(p);
  }
  return salida;
};

const todos = listar(RAIZ).map((p) => [p, relative(RAIZ, p)]);
const censoProsa = [];

// ── Toda hoja de estilos del repositorio ───────────────────────────────────

let cssRevisados = 0;
for (const [abs, rel] of todos) {
  if (!rel.endsWith('.css') || BANCADAS.has(rel)) continue;
  cssRevisados++;
  revisarCss(readFileSync(abs, 'utf8'), rel);
}

// ── Todo documento HTML del repositorio ────────────────────────────────────

let htmlRevisados = 0;
for (const [abs, rel] of todos) {
  if (!rel.endsWith('.html') || BANCADAS.has(rel)) continue;
  htmlRevisados++;
  const html = readFileSync(abs, 'utf8');

  // el CSS incrustado, con el mismo criterio que un archivo .css
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const antes = html.slice(0, m.index).split('\n').length;
    revisarCss(m[1], `${rel} <style>`, antes - 1);
  }

  const sinEstilos = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, (s) => '\n'.repeat(s.split('\n').length - 1));

  // atributos style= del marcado
  for (const m of sinEstilos.matchAll(/style="([^"]*)"/g)) {
    const hs = m[1].match(HEX);
    if (!hs) continue;
    apunta(rel, sinEstilos.slice(0, m.index).split('\n').length, `style="${m[1]}"`,
      `${hs.join(' ')} en un atributo style; usa una clase`);
  }

  // atributos de color de SVG
  for (const m of sinEstilos.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8})"/g)) {
    apunta(rel, sinEstilos.slice(0, m.index).split('\n').length, m[0],
      `${m[1]} en un atributo SVG; usa currentColor o var(--token)`);
  }
}

// ── Censo de la prosa — no bloquea, pero deja de ser invisible ─────────────

for (const [abs, rel] of todos) {
  if (!/\.(md|mjs|js|ts|tsx|json|sh)$/.test(rel) || BANCADAS.has(rel)) continue;
  if (rel.startsWith('componentes/src/')) continue; // se revisan aparte, y sí bloquean
  const hs = readFileSync(abs, 'utf8').match(HEX) ?? [];
  const fuera = [...new Set(hs.map((h) => h.toUpperCase()))].filter((h) => !DEFINIDOS.has(h));
  if (fuera.length) censoProsa.push([rel, fuera]);
}

// ── 5 · Los componentes de React ───────────────────────────────────────────

let componentesRevisados = 0;
const src = join(RAIZ, 'componentes/src');
if (existsSync(src)) {
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync(src).filter((f) => /\.tsx?$/.test(f))) {
    componentesRevisados++;
    const ruta = join(src, f);
    readFileSync(ruta, 'utf8').split('\n').forEach((linea, i) => {
      if (/^\s*(\*|\/\/|\/\*)/.test(linea)) return;
      for (const h of linea.match(HEX) ?? []) {
        apunta(relative(RAIZ, ruta), i + 1, linea, `${h} en un componente; usa una clase del sistema`);
      }
    });
  }
}

// ── Informe ────────────────────────────────────────────────────────────────

console.log(`\n  Candado de color — MMI-DS v${VERSION}\n`);
console.log(`  Familias:     ${Object.keys(primitivas).length} rampas · ${Object.keys(categoricas).length} categóricas`);
console.log(`  Autorizados:  ${autorizados.length} escalones — pueden vivir en el sistema`);
console.log(`  Restringidos: ${restringidos.length} de marca — se nombran para poder vigilarlos, no para usarlos`);
console.log(`  Tokens:       ${tokensRevisados} valores comprobados contra las familias`);
console.log(`  Recorrido:    ${cssRevisados} hojas de estilo · ${htmlRevisados} documentos HTML · ${componentesRevisados} componentes`);
console.log(`                de ${todos.length} archivos del repositorio`);
console.log(`  Fallos:       ${fallos.length}\n`);

if (censoProsa.length) {
  console.log('  Citados en prosa o comentarios — explican, no pintan:\n');
  for (const [rel, fuera] of censoProsa) {
    console.log(`    ${rel.padEnd(48)} ${fuera.slice(0, 4).join(' ')}${fuera.length > 4 ? ` +${fuera.length - 4}` : ''}`);
  }
  console.log('');
}

if (fallos.length) {
  console.error('  Hay color fuera del sistema:\n');
  for (const f of fallos) {
    console.error(`    ${f.archivo}${f.linea ? ':' + f.linea : ''}`);
    console.error(`      ${f.texto}`);
    console.error(`      → ${f.motivo}\n`);
  }
  console.error('  Todo color se nombra familia_paso. Para pintar, o un token');
  console.error('  semántico —`var(--accion)`— o la clase del escalón');
  console.error('  —`.color-azul_600`—. Si el tono no existe, se añade a una');
  console.error('  familia; así tiene nombre, sitio y vecinos.\n');
  process.exit(1);
}

console.log('  Ningún color se salta el sistema.\n');
