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
import { fileURLToPath, pathToFileURL } from 'node:url';
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

/** Parte por las comas DE PRIMER NIVEL: las de dentro de `(…)` no separan. */
function separarComas(texto) {
  const fuera = [];
  let nivel = 0;
  let actual = '';
  for (const c of texto) {
    if (c === '(') nivel++;
    else if (c === ')') nivel--;
    if (c === ',' && nivel === 0) { fuera.push(actual); actual = ''; continue; }
    actual += c;
  }
  fuera.push(actual);
  return fuera;
}

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
          // Un selector con comas son varias reglas con la misma declaración —
          // pero SOLO las comas de primer nivel. Partiendo a lo bruto,
          // `.cat-cuerpo :where(a, button, input)` se convertía en una regla
          // llamada « button» que casaba con TODOS los botones del sistema, y
          // el candado de la promesa sacaba una diferencia inventada.
          for (const uno of separarComas(cab)) {
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
  // Los ESPACIOS DE DENTRO DE UN PARÉNTESIS no separan compuestos.
  // `.cat-cuerpo :where(a, button, input)` son DOS partes, no seis, y
  // partiéndolo a lo bruto salía casando con cualquier botón del mundo — el
  // candado de la promesa lo delató sacando una diferencia que no existía.
  // Se enmascara el contenido de los paréntesis, se parte, y se devuelve.
  const guardados = [];
  const enmascarado = sel.trim().replace(/\(([^()]*)\)/g, (_, dentro) => {
    guardados.push(dentro);
    return `( ${guardados.length - 1} )`;
  });
  const partes = enmascarado.split(/\s*(>)\s*|\s+/).filter(Boolean)
    .map((p) => p.replace(/\( (\d+) \)/g, (_, k) => `(${guardados[Number(k)]})`));
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
  /**
   * R107 · EL MEDIO IMPRESO NO ES UNA PANTALLA ESTRECHA. Sin esta línea,
   * `@media print` no contenía ningún `(max|min)-width`, el bucle de abajo no
   * encontraba nada que comprobar y la función devolvía `true`: los tres
   * candados de cascada estaban midiendo `.cpe-impresa` **en pantalla con sus
   * valores de impresión**, un estado que no existe en ningún medio.
   *
   * No daba rojo porque el error era simétrico —las dos hojas llevan el mismo
   * bloque—, y ese es justo el tipo de verde que este repositorio no admite:
   * todo lo que los candados afirmaban sobre esa clase en pantalla era falso, y
   * una futura regla de impresión presente en una sola hoja habría alterado en
   * silencio las mediciones DE PANTALLA de las demás clases.
   *
   * Lo encontró una auditoría, no un fallo: el sistema estrenó su primera hoja
   * de impresión en la v1.87.0 y nadie había mirado si los candados sabían
   * leerla. Aquí se mide la pantalla; lo impreso queda declarado como lo que
   * NINGÚN candado comprueba todavía.
   */
  if (/\bprint\b/.test(cond)) return false;
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
    id: 'SIN-ANFITRION',
    que: 'lo que lleva un icono dentro fija su propia caja, no la hereda del producto',
    /**
     * LA FAMILIA DE DEFECTO QUE YA HA MORDIDO DOS VECES, y las dos las
     * encontró el responsable montando el paquete en su producto, no aquí:
     *
     *   v1.40.1  `.btn` no declaraba `line-height` → el renglón lo ponía la
     *            página, y donde era más corto que el icono, los botones CON
     *            icono salían más altos que los demás.
     *   v1.41.0  `.btn` no declaraba `display` → la alineación vivía en
     *            `.btn-ic`, que es OPCIONAL; sin ella el botón caía al display
     *            que le pusiera la página, el icono y el texto se apilaban y
     *            medía 55px contra 37px.
     *
     * LOS OTROS CANDADOS NO PUEDEN VERLO, y conviene entender por qué antes de
     * pedirles nada: el de la promesa compara las dos hojas, y aquí LAS DOS
     * CALLAN — coinciden en no decir nada. La diferencia no está entre catálogo
     * y entrega, está entre el catálogo y CUALQUIER OTRA PÁGINA.
     *
     * QUÉ SE EXIGE Y DE DÓNDE SALE LA LISTA. Un elemento que pone un icono al
     * lado de texto tiene que decir cómo los coloca, o lo dirá quien lo monte.
     * La lista NO está escrita a mano: se deduce de la propia hoja —toda clase
     * dentro de la cual la hoja estiliza un `.ic` es, por definición, una que
     * lleva icono dentro— más `.btn`, que los lleva sin necesitar regla propia
     * para ellos.
     */
    revisar(reglas) {
      const OBLIGADAS = ['display', 'align-items'];
      const conIcono = new Set(['btn']);
      for (const r of reglas) {
        // `.x .ic`, `.x > .ic`: la hoja estiliza un icono DENTRO de `.x`.
        const m = /\.([a-zA-Z0-9_-]+)\s*>?\s+\.ic\b/.exec(r.sel);
        if (m) conIcono.add(m[1]);
      }
      // `place-items` FIJA `align-items`: exigir el nombre largo habria sacado
      // en rojo media hoja por escribirlo en su forma corta, que es correcta.
      // Un candado que obliga a escribir peor no esta protegiendo nada.
      const EQUIVALE = { 'align-items': ['place-items', 'place-content'] };
      const fallos = [];
      for (const clase of [...conIcono].sort()) {
        for (const prop of OBLIGADAS) {
          const nombres = [prop, ...(EQUIVALE[prop] || [])];
          if (nombres.some((p) => resolver(reglas, [elem('span', [clase])], p, 1280))) continue;
          fallos.push(`  .${clase} lleva icono dentro y no declara ${prop}:`
            + ' lo decidira la pagina que lo monte.');
        }
      }
      return fallos;
    },
  },
  {
    id: 'ALTURA-PROPIA',
    que: 'el botón fija su propio line-height y no lo hereda del producto',
    /**
     * EL DEFECTO QUE ESTE CANDADO EXISTE PARA IMPEDIR, y que llevaba
     * publicado: `.btn` no declaraba `line-height`, así que su altura la
     * decidía LA PÁGINA QUE LO MONTABA.
     *
     * En el catálogo se hereda 1,45 —un renglón de 18,8px, más alto que el
     * icono de 18— y todos los botones median igual. En un producto que no
     * fija nada, el renglón de `normal` cae a ~16,9px, el icono sigue midiendo
     * 18, y ESTIRA solo a los botones que lo llevan: el de CSV salía más alto
     * que Filtros y Columnas. Lo vio el responsable en la entrega, no aquí.
     *
     * POR QUÉ NO LO VIO NINGÚN OTRO CANDADO. El cruce que compara catálogo y
     * hoja los mide A LOS DOS DENTRO DEL CATÁLOGO, y una propiedad que se
     * HEREDA DEL ANFITRIÓN vale lo mismo en los dos lados: no hay diferencia
     * que encontrar. El fallo solo aparece montando la hoja en otra página, y
     * eso ningún candado lo hacía.
     *
     * Se comprueba lo que arregla el problema de raíz: que el valor esté
     * declarado —para que el anfitrión no mande— y que no sea menor que el
     * icono de texto, que es lo que estiraba.
     */
    revisar(reglas) {
      const ICONO_TEXTO = 18;
      const fallos = [];
      const decl = resolver(reglas, [elem('button', ['btn'])], 'line-height', 1280);
      if (!decl) {
        fallos.push('  .btn no declara line-height: su altura la decide la página que lo monte,');
        fallos.push('  y con un icono dentro sale más alto que un botón sin icono.');
        return fallos;
      }
      const px = /^(\d+(?:\.\d+)?)px$/.exec(decl.valor);
      if (!px) {
        fallos.push(`  .btn declara line-height:${decl.valor} — hace falta un valor EN PIXELES:`);
        fallos.push('  un número suelto se recalcula con el tamaño de letra de cada variante.');
      } else if (Number(px[1]) < ICONO_TEXTO) {
        fallos.push(`  .btn declara line-height:${decl.valor}, por debajo del icono de texto (${ICONO_TEXTO}px):`);
        fallos.push('  el icono estira el botón y deja más altos los que lo llevan.');
      }
      return fallos;
    },
  },
  {
    id: 'ANCHO-LIBRE',
    que: 'una tabla puede DECLARAR que no lleva ancho minimo, y se le respeta',
    /**
     * P3 de R85, y existe por lo que dijeron al pedirlo:
     *
     *   «Nuestro apaño de hoy funciona y no nos gusta: usamos .tabla-simple
     *    suelta, fuera de .tb-envoltura, porque así no arrastra el min-width.
     *    Depende de un detalle interno de vuestra cascada. El día que cambiéis
     *    ese selector, se nos rompe y no nos vamos a enterar.»
     *
     * Tienen razon, y la respuesta no es «pues no lo cambiamos»: es que deje de
     * ser un descubrimiento. `tabla-libre` lo dice, y esto lo comprueba a los
     * once anchos resolviendo la cascada de verdad — asi el dia que alguien
     * mueva, reordene o reescriba ese selector, el candado sale en rojo AQUI y
     * no en su producto.
     *
     * Se comprueban las DOS caras, y la segunda importa igual: si el suelo por
     * omision desapareciera sin querer, `tabla-libre` seguiria «funcionando» y
     * nadie se enteraria de que se perdio el suelo de las tablas de datos.
     */
    revisar(reglas) {
      const fallos = [];
      const envuelta = (extra = []) => [
        elem('div', ['bloque']),
        elem('div', ['tb-envoltura']),
        elem('table', ['tabla-simple', ...extra]),
      ];
      for (const w of ANCHOS) {
        const libre = resolver(reglas, envuelta(['tabla-libre']), 'min-width', w);
        if (!libre || parseFloat(libre.valor) !== 0) {
          fallos.push(`  a ${String(w).padStart(4)}px .tabla-libre recibe min-width: ${libre ? libre.valor : 'NINGUNA REGLA'} (se esperaba 0)`);
        }
        const suelo = resolver(reglas, envuelta(), 'min-width', w);
        if (!suelo || parseFloat(suelo.valor) !== 520) {
          fallos.push(`  a ${String(w).padStart(4)}px la tabla SIN declarar pierde el suelo: ${suelo ? suelo.valor : 'NINGUNA REGLA'} (se esperaba 520px)`);
        }
      }
      return fallos;
    },
  },
  {
    id: 'UN-DATO-UNA-LINEA',
    que: 'la celda de datos no parte el texto, y el que es prosa sigue partiendo',
    /**
     * R86, y nace medido. Lo reporto Control Administrativos V2.0: en sus
     * tablas un nombre como «SIFUENTES DE PINEDA, Julia Trinidad» salia en tres
     * lineas y la fila crecia. Comprobado aqui en el navegador ANTES de tocar
     * nada, con la hoja que viaja: tres filas de la misma tabla median 54,7 ·
     * 34,0 · 72,3 px con 34 declarados, y 36,7 con 28 en compacta.
     *
     * El argumento que lo cierra es suyo: `.tb-envoltura` YA desplaza en
     * horizontal desde R49, asi que partir no gana espacio — solo rompe la
     * altura que el propio componente fija. Medido tambien: el ejemplo en
     * compacta daba scrollWidth 419 sobre clientWidth 419, o sea que el
     * desbordamiento se absorbia hacia abajo y ni siquiera se desplazaba.
     *
     * Se comprueban las CUATRO caras, y las de prosa importan igual que las de
     * dato: un nowrap que se filtre al estado vacio o al panel de detalle
     * convierte una frase en una linea kilometrica y obliga a desplazar una
     * tabla que no tiene ni una fila que mirar. Las cuatro dependen de que
     * `.tb-detalle > td` y `.tb-sub td` GANEN a `.tb td` al resolver —tienen su
     * misma especificidad y se deciden por orden—, que es justo la clase de
     * detalle que se rompe al reordenar la hoja sin enterarse.
     */
    revisar(reglas) {
      const fallos = [];
      const tabla = [elem('div', ['tb-bloque']), elem('div', ['tb-envoltura']), elem('table', ['tb'])];
      const detalle = [...tabla, elem('tbody'), elem('tr', ['tb-detalle'])];
      const CASOS = [
        ['la celda de datos', [...tabla, elem('tbody'), elem('tr'), elem('td')], 'nowrap'],
        ['la celda numerica', [...tabla, elem('tbody'), elem('tr'), elem('td', ['tb-num'])], 'nowrap'],
        ['el estado vacio', [...tabla, elem('tbody'), elem('tr'), elem('td', ['tb-vacio'])], 'normal'],
        ['el panel de detalle', [...detalle, elem('td')], 'normal'],
        ['la celda de la sub-tabla', [...detalle, elem('td'), elem('div', ['tb-desliza']),
          elem('div', ['tb-desliza-in']), elem('table', ['tb-sub']), elem('tbody'), elem('tr'),
          elem('td')], 'nowrap'],
      ];
      for (const w of ANCHOS) {
        for (const [nombre, cadena, esperado] of CASOS) {
          const r = resolver(reglas, cadena, 'white-space', w);
          const valor = r ? r.valor.trim() : 'NINGUNA REGLA';
          if (valor !== esperado) {
            fallos.push(`  a ${String(w).padStart(4)}px ${nombre} recibe white-space: ${valor} (se esperaba ${esperado})`);
          }
        }
      }
      return fallos;
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

// El motor se exporta para que OTRO candado pueda resolver la cascada sin
// copiarlo. verificar-promesa.mjs compara DOS hojas con este mismo
// resolvedor: si tuviera el suyo, las dos podrian discrepar y nadie lo veria.
export { parsear, resolver, elem, casa, especificidad, mediaCasa };

// El informe solo corre si se invoca el archivo directamente.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
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

}
