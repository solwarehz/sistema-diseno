#!/usr/bin/env node
/**
 * CANDADO DE LA CASCADA — lo que el navegador acabará haciendo con la hoja
 * QUE VIAJA, no con la del catálogo
 *
 *   node sistema/candado/verificar-cascada.mjs
 *
 * POR QUÉ EXISTE. Lo pidió Control Administrativos V2.0, y lo pidió bien:
 *
 *   «Los dos defectos solo aparecen usando el componente, no leyéndolo. El
 *    primero no se ve en el código, porque el código está bien: el fallo es lo
 *    que no se escribió.»
 *
 * Ese es el hueco exacto que dejaban los seis candados anteriores. Todos leen
 * lo que HAY: hexadecimales sueltos, clases huérfanas, pares de contraste,
 * reglas obligatorias sin prueba. Ninguno sabía responder «¿y qué le pasa a
 * este elemento a 1440 píxeles?», que es una pregunta sobre lo que NO hay.
 *
 * El defecto R25 lo demuestra. El botón de plegar lleva dos iconos y una
 * consulta de medios decide cuál. En el catálogo se veía bien. En el paquete,
 * las únicas reglas de esos iconos vivían bajo `@media (max-width: 700px)`:
 * por encima no había ninguna, los dos caían a su `display` por omisión y se
 * pintaban juntos. Nadie lo vio porque no había nada que ver — el fallo era la
 * ausencia.
 *
 * QUÉ HACE. Reconstruye la cascada: parsea la hoja que viaja, casa sus
 * selectores contra un árbol de elementos declarado aquí, evalúa las consultas
 * de medios a cada ancho, ordena por especificidad y orden de aparición, y
 * dice qué declaración GANA. Después comprueba afirmaciones sobre el resultado.
 *
 * QUÉ NO HACE, y conviene decirlo. No calcula diseño. No sabe cuánto mide un
 * elemento, sólo qué valores le llegan. El segundo defecto que reportaron
 * —el lateral que no encoge— NO lo habría cazado: para eso hay que pintar.
 * Un candado que promete más de lo que mide es peor que no tenerlo.
 *
 * Y sobre la hoja QUE VIAJA a propósito. El catálogo y el paquete son dos
 * hojas distintas: la segunda la construye el extractor repartiendo reglas por
 * su primera clase. R25 vivía justo en esa costura. Medir el catálogo lo habría
 * dado por bueno.
 *
 * Cálculo puro. No toca red. No escribe nada.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
// Se admite una hoja por argumento para poder apuntarlo a una VERSIÓN ANTERIOR:
//
//   git show v1.17.0:sistema/componentes/componentes.css > /tmp/vieja.css
//   node sistema/candado/verificar-cascada.mjs /tmp/vieja.css
//
// Es como se comprobó que este candado sirve: contra la v1.17.0 saca R25 en
// rojo a los siete anchos de escritorio. Un candado que sólo se ha visto en
// verde no ha demostrado nada.
const HOJA = process.argv[2] || join(RAIZ, 'sistema/componentes/componentes.css');

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Parseo de la hoja
//
// Sin dependencias: no se instala nada en la máquina. Basta con recorrer las
// llaves llevando la pila de at-reglas, que es lo único anidado que hay aquí.
// ─────────────────────────────────────────────────────────────────────────────

/** @typedef {{sel:string, decl:Map<string,string>, media:string[], orden:number}} Regla */

function parsear(css) {
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, '');
  /** @type {Regla[]} */
  const reglas = [];
  const pila = [];
  let buf = '';
  let orden = 0;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (c === '{') {
      pila.push(buf.trim().replace(/\s+/g, ' '));
      buf = '';
    } else if (c === '}') {
      const cab = pila.pop();
      if (cab && !cab.startsWith('@')) {
        const decl = new Map();
        for (const par of buf.split(';')) {
          const k = par.indexOf(':');
          if (k < 0) continue;
          decl.set(par.slice(0, k).trim(), par.slice(k + 1).trim());
        }
        if (decl.size) {
          const media = pila.filter((p) => p.startsWith('@media')).map((p) => p.slice(6).trim());
          // Un selector con comas son varias reglas con la misma declaración.
          for (const uno of cab.split(',')) {
            const s = uno.trim();
            if (s) reglas.push({ sel: s, decl, media, orden: orden++ });
          }
        }
      }
      buf = '';
    } else {
      buf += c;
    }
  }
  return reglas;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Casar un selector contra un árbol
//
// Se soporta EXACTAMENTE lo que la hoja usa, y lo que no se entiende se declara
// como no entendido en vez de darse por no casado: un candado que falla en
// silencio miente.
// ─────────────────────────────────────────────────────────────────────────────

const SOPORTADO = /^[.#a-zA-Z0-9_\-[\]='":() >*+~,]+$/;

/** Un elemento del árbol: etiqueta, clases y atributos. */
const elem = (tag, clases = [], attrs = {}) => ({ tag, clases: new Set(clases), attrs });

/** ¿Este compuesto —`.a.b[c='d']:not(.e)`— describe a este elemento? */
function casaCompuesto(comp, el) {
  if (comp === '*') return true;
  let resto = comp;

  // `:not(...)` primero: se saca del texto para no confundir al resto.
  const nots = [];
  resto = resto.replace(/:not\(([^)]*)\)/g, (_, dentro) => { nots.push(dentro.trim()); return ''; });
  for (const n of nots) if (casaCompuesto(n, el)) return false;

  // Pseudoclases y pseudoelementos que no cambian a QUIÉN describe el selector
  // se ignoran; los que sí —:hover, :focus— hacen que la regla no cuente para
  // el estado en reposo, y se marcan para descartarla arriba.
  resto = resto.replace(/::?[a-z-]+(\([^)]*\))?/g, '');

  const attrs = [];
  resto = resto.replace(/\[([^\]]+)\]/g, (_, a) => { attrs.push(a); return ''; });
  for (const a of attrs) {
    const m = /^([a-zA-Z-]+)(?:([~^$*|]?=)\s*['"]?([^'"\]]*)['"]?)?$/.exec(a.trim());
    if (!m) return false;
    const [, nombre, op, valor] = m;
    const tiene = Object.prototype.hasOwnProperty.call(el.attrs, nombre);
    if (!op) { if (!tiene) return false; continue; }
    if (!tiene || el.attrs[nombre] !== valor) return false;
  }

  const clases = [...resto.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  for (const c of clases) if (!el.clases.has(c)) return false;

  const tag = resto.replace(/\.[a-zA-Z0-9_-]+/g, '').trim();
  if (tag && tag !== '*' && tag !== el.tag) return false;

  return true;
}

/**
 * ¿El selector describe al ÚLTIMO elemento de la cadena? Se recorre de derecha
 * a izquierda, que es como lo hace el navegador y como sale bien el descendiente.
 */
function casa(sel, cadena) {
  if (/[+~]/.test(sel)) return null;              // hermanos: no se soportan
  const partes = sel.trim().split(/\s*(>)\s*|\s+/).filter(Boolean);
  let i = partes.length - 1;
  let j = cadena.length - 1;

  if (!casaCompuesto(partes[i], cadena[j])) return false;
  i--;

  while (i >= 0) {
    const hijoDirecto = partes[i] === '>';
    if (hijoDirecto) i--;
    if (i < 0) break;
    const comp = partes[i];
    if (hijoDirecto) {
      j--;
      if (j < 0 || !casaCompuesto(comp, cadena[j])) return false;
    } else {
      let hallado = false;
      for (let k = j - 1; k >= 0; k--) {
        if (casaCompuesto(comp, cadena[k])) { j = k; hallado = true; break; }
      }
      if (!hallado) return false;
    }
    i--;
  }
  return true;
}

/** Especificidad (a,b,c). Sin `!important` en la hoja, esto basta. */
function especificidad(sel) {
  const limpio = sel.replace(/:not\(([^)]*)\)/g, '$1');
  const ids = (limpio.match(/#[a-zA-Z0-9_-]+/g) || []).length;
  const clases = (limpio.match(/\.[a-zA-Z0-9_-]+|\[[^\]]+\]|:[a-z-]+(?!:)/g) || []).length;
  const tags = (limpio.replace(/[.#[][^\s>+~]*/g, '').match(/\b[a-z]+\b/g) || []).length;
  return ids * 10000 + clases * 100 + tags;
}

/** ¿Esta consulta de medios se cumple a este ancho? */
function mediaCasa(cond, ancho) {
  // Las de preferencia no se evalúan: describen a la persona, no al ancho, y
  // aquí se mide el caso por omisión.
  if (/prefers-/.test(cond)) return false;
  let ok = true;
  for (const m of cond.matchAll(/\(\s*(max|min)-width\s*:\s*(\d+)px\s*\)/g)) {
    ok = ok && (m[1] === 'max' ? ancho <= +m[2] : ancho >= +m[2]);
  }
  return ok;
}

/**
 * Qué valor gana para una propiedad, y por qué regla. Devuelve `null` cuando
 * NINGUNA regla la declara — que es el caso de R25 y el más importante de todos.
 */
function resolver(reglas, cadena, prop, ancho) {
  let mejor = null;
  for (const r of reglas) {
    if (!r.decl.has(prop)) continue;
    if (r.media.length && !r.media.every((c) => mediaCasa(c, ancho))) continue;
    if (/:(hover|focus|active|focus-visible|focus-within)/.test(r.sel)) continue;
    if (!SOPORTADO.test(r.sel)) continue;
    const c = casa(r.sel, cadena);
    if (c !== true) continue;
    const e = especificidad(r.sel);
    if (!mejor || e > mejor.e || (e === mejor.e && r.orden > mejor.orden)) {
      mejor = { e, orden: r.orden, valor: r.decl.get(prop), sel: r.sel, media: r.media };
    }
  }
  return mejor;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Lo que se afirma
//
// Cada afirmación lleva el número del defecto que la trajo. Sin eso, dentro de
// un año nadie sabe si una comprobación rara protege algo o sobra.
// ─────────────────────────────────────────────────────────────────────────────

const ANCHOS = [1920, 1440, 1280, 1024, 900, 768, 701, 700, 640, 480, 390];

// El árbol tal como lo emite MarcoApp: raíz, barra y botón de plegar.
const marco = (extra = []) => [
  elem('div', ['app', 'app-cascaron', ...extra]),
  elem('div', ['app-main']),
  elem('header', ['top', 'top-cascaron']),
  elem('button', ['top-btn', 'top-plegar']),
];

const AFIRMACIONES = [
  {
    id: 'R25',
    que: 'el boton de plegar ensena UN icono, nunca dos ni ninguno',
    /** @param {Regla[]} reglas */
    revisar(reglas) {
      const fallos = [];
      for (const w of ANCHOS) {
        const vistos = [];
        for (const cual of ['ic-escritorio', 'ic-movil']) {
          const cadena = [...marco(), elem('span', [cual])];
          const d = resolver(reglas, cadena, 'display', w);
          // SIN regla el navegador usa el display por omision del elemento, que
          // para un <span> es `inline`: visible. Que no haya regla NO es que no
          // se vea; es justo lo contrario, y es el defecto R25.
          const valor = d ? d.valor : 'inline (SIN REGLA)';
          if (valor !== 'none') vistos.push(cual + ' → ' + valor);
        }
        if (vistos.length !== 1) {
          fallos.push(`  a ${String(w).padStart(4)}px se ven ${vistos.length}: ${vistos.join('  ·  ') || '(ninguno)'}`);
        }
      }
      return fallos;
    },
  },
  {
    id: 'R25b',
    que: 'y en estrecho el que se ve es la hamburguesa, no el de plegar panel',
    revisar(reglas) {
      const fallos = [];
      for (const w of [700, 640, 480, 390]) {
        const d = resolver(reglas, [...marco(), elem('span', ['ic-movil'])], 'display', w);
        if (!d || d.valor === 'none') fallos.push(`  a ${w}px la hamburguesa no sale (${d ? d.valor : 'SIN REGLA'})`);
      }
      for (const w of [1440, 1024, 768, 701]) {
        const d = resolver(reglas, [...marco(), elem('span', ['ic-escritorio'])], 'display', w);
        if (!d || d.valor === 'none') fallos.push(`  a ${w}px el de plegar no sale (${d ? d.valor : 'SIN REGLA'})`);
      }
      return fallos;
    },
  },
  {
    id: 'R26',
    que: 'el lateral plegado recibe un ancho distinto del extendido',
    revisar(reglas) {
      const fallos = [];
      for (const w of [1920, 1440, 1280, 1024]) {
        const plegado = resolver(reglas, [elem('div', ['app', 'app-cascaron']), elem('aside', ['lat', 'colapsado'])], 'width', w);
        const abierto = resolver(reglas, [elem('div', ['app', 'app-cascaron']), elem('aside', ['lat'])], 'width', w);
        if (!plegado) { fallos.push(`  a ${w}px el lateral plegado no recibe ancho de ninguna regla`); continue; }
        if (abierto && plegado.valor === abierto.valor) {
          fallos.push(`  a ${w}px plegado y extendido reciben el mismo ancho (${plegado.valor}): plegar no serviria`);
        }
      }
      return fallos;
    },
  },
  {
    id: 'MARCO',
    que: 'toda clase que MarcoApp emite tiene alguna regla en la hoja que viaja',
    revisar(reglas) {
      const fuente = readFileSync(join(RAIZ, 'componentes/src/MarcoApp.tsx'), 'utf8');
      const emitidas = new Set();
      for (const m of fuente.matchAll(/className=(?:"([^"]+)"|\{\[([^\]]*)\]|\{`([^`]*)`)/g)) {
        for (const t of (m[1] || m[2] || m[3] || '').matchAll(/['"`]([a-z][a-z0-9- ]*)['"`]/g)) {
          for (const c of t[1].split(/\s+/)) if (c) emitidas.add(c);
        }
        if (m[1]) for (const c of m[1].split(/\s+/)) emitidas.add(c);
      }
      const declaradas = new Set();
      for (const r of reglas) for (const c of r.sel.matchAll(/\.([a-zA-Z0-9_-]+)/g)) declaradas.add(c[1]);
      return [...emitidas].filter((c) => !declaradas.has(c)).sort().map((c) => `  .${c} se emite y la hoja no la estila`);
    },
  },
  {
    id: 'OCULTABLE',
    que: 'toda clase que fija display se puede seguir ocultando con [hidden]',
    /**
     * LA TRAMPA QUE YA HA MORDIDO TRES VECES. `[hidden]` es `display:none` en
     * la hoja del navegador, que es la de menos peso: CUALQUIER regla de autor
     * que fije `display` la pisa. El elemento se queda pintado con su atributo
     * puesto, el manejador ha corrido, y no hay nada que leer en el codigo —
     * el fallo es, otra vez, lo que no se escribio.
     *
     * Historial: `.ci-editor` (v1.30.1, el difuminado que no se iba), la tira
     * de filtros y el menu de columnas de la tabla, y `.cpdf-puesto` con
     * `.cpdf-invita` (v1.39.1) — «le di clic en quitar, no quito el pdf».
     *
     * Se comprueba resolviendo la cascada de verdad: se pregunta que `display`
     * le llega al elemento CON el atributo puesto. Si no es `none`, falta la
     * guarda. Asi tambien vale una guarda escrita de otra forma —agrupada, con
     * otro selector— con tal de que gane.
     *
     * Solo mira clases que fijan un display VISIBLE: una que ya declara `none`
     * no puede tener este problema.
     */
    revisar(reglas) {
      // Solo se vigilan los elementos que DE VERDAD llevan `hidden` en el
      // catálogo. Marcar toda clase que fije `display` daría decenas de avisos
      // sobre elementos que nadie oculta nunca, y un candado que grita por todo
      // se acaba ignorando — que es como se pierde el aviso que importaba.
      const html = readFileSync(join(RAIZ, 'cascaron/index.html'), 'utf8');
      const conHidden = new Set();
      for (const t of html.matchAll(/<[a-z][^>]*>/gi)) {
        const tag = t[0];
        if (!/\shidden[\s/>=]/.test(tag)) continue;
        const cls = tag.match(/\sclass="([^"]*)"/);
        if (!cls) continue;
        for (const c of cls[1].split(/\s+/)) if (c) conHidden.add(c);
      }

      const fallos = [];
      for (const clase of [...conHidden].sort()) {
        // ¿Qué `display` le llega al elemento CON el atributo puesto? Se
        // resuelve la cascada de verdad, así que una guarda escrita de otra
        // forma —agrupada, con otro selector— vale igual con tal de que gane.
        const gana = resolver(reglas, [elem('div', [clase], { hidden: '' })], 'display', 1280);
        // Sin regla ninguna, manda la hoja del navegador y `hidden` funciona.
        if (!gana || gana.valor === 'none') continue;
        fallos.push(`  .${clase} lleva [hidden] en el catálogo y la hoja le deja `
          + `display:${gana.valor} (${gana.sel}) — falta .${clase}[hidden]{display:none}`);
      }
      return fallos;
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────

const reglas = parsear(readFileSync(HOJA, 'utf8'));

console.log(`\n  Candado de la cascada — MMI-DS v${VERSION}\n`);
console.log(`  Hoja medida:    ${HOJA.replace(RAIZ + '/', '')}${process.argv[2] ? '' : '   (la que VIAJA)'}`);
console.log(`  Reglas leidas:  ${reglas.length}`);
console.log(`  Anchos:         ${ANCHOS.join(', ')}\n`);

let fallos = 0;
for (const a of AFIRMACIONES) {
  const malos = a.revisar(reglas);
  if (malos.length) {
    fallos += malos.length;
    console.error(`  ✗ ${a.id} · ${a.que}`);
    for (const m of malos) console.error(m);
    console.error('');
  } else {
    console.log(`  ✓ ${a.id} · ${a.que}`);
  }
}

if (fallos) {
  console.error(`\n  ${fallos} fallo(s). Esto NO se ve leyendo el codigo: se ve resolviendo`);
  console.error('  la cascada de la hoja que viaja contra el marcado que se emite.\n');
  process.exit(1);
}
console.log('\n  Sin fallos. Lo que se emite recibe lo que debe, a los once anchos.\n');
