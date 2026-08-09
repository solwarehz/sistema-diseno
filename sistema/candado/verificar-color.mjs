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

const revisarCss = (cssCrudo, archivo, desplazamiento = 0) => {
  const css = sinComentarios(cssCrudo);
  css.split('\n').forEach((linea, i) => {
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

const tokensCss = join(RAIZ, 'sistema/tokens/tokens.css');
if (existsSync(tokensCss)) {
  revisarCss(readFileSync(tokensCss, 'utf8'), 'sistema/tokens/tokens.css');
}

const componentesCss = join(RAIZ, 'sistema/componentes/componentes.css');
if (existsSync(componentesCss)) {
  revisarCss(readFileSync(componentesCss, 'utf8'), 'sistema/componentes/componentes.css');
}

// ── 4 · El marcado del catálogo ────────────────────────────────────────────

const catalogo = join(RAIZ, 'cascaron/index.html');
if (existsSync(catalogo)) {
  const html = readFileSync(catalogo, 'utf8');

  // 4a · el CSS incrustado, con el mismo criterio que un archivo .css
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const antes = html.slice(0, m.index).split('\n').length;
    revisarCss(m[1], 'cascaron/index.html <style>', antes - 1);
  }

  // 4b · atributos style= del marcado
  const sinEstilos = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, (s) => '\n'.repeat(s.split('\n').length - 1));
  for (const m of sinEstilos.matchAll(/style="([^"]*)"/g)) {
    const hs = m[1].match(HEX);
    if (!hs) continue;
    const linea = sinEstilos.slice(0, m.index).split('\n').length;
    apunta('cascaron/index.html', linea, `style="${m[1]}"`,
      `${hs.join(' ')} en un atributo style; usa una clase`);
  }

  // 4c · atributos de color de SVG
  for (const m of sinEstilos.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8})"/g)) {
    const linea = sinEstilos.slice(0, m.index).split('\n').length;
    apunta('cascaron/index.html', linea, m[0],
      `${m[1]} en un atributo SVG; usa currentColor o var(--token)`);
  }
}

// ── 5 · Los componentes de React ───────────────────────────────────────────

const src = join(RAIZ, 'componentes/src');
if (existsSync(src)) {
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync(src).filter((f) => /\.tsx?$/.test(f))) {
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
console.log(`  Fallos:       ${fallos.length}\n`);

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
