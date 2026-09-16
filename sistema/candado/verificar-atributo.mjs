#!/usr/bin/env node
/**
 * CANDADO DEL ATRIBUTO — el atributo que el componente emite SIEMPRE y el
 * catálogo no pinta.
 *
 *   node sistema/candado/verificar-atributo.mjs
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE
 *
 * El catálogo es la PROMESA y los componentes son la ENTREGA, y llevan
 * divergiendo desde el principio. Cada divergencia se ha encontrado A MANO,
 * cuando alguien fue a mirar: el `title` que el componente ponía y el catálogo
 * no pintaba, la ✕ que era un carácter en un lado y un SVG en el otro, los
 * bloques del horario sin `title` y fuera de su contenedor. Siete en una sola
 * sesión, y las siete las encontró una persona leyendo, no un candado.
 *
 * Hay 35 componentes publicados y 6 con prueba que los compare. Los dieciocho
 * pasos miran el ELEMENTO, la CLASE, la CASCADA, el ORDEN y la FORMA — ninguno
 * mira los ATRIBUTOS del marcado. Este los mira.
 *
 * Y la ausencia de un atributo no es cosmética: `<button>` sin `type` dentro de
 * un formulario es `type="submit"` y envía el formulario al pulsarlo; un `<th>`
 * sin `scope` deja de anunciar su columna; un icono decorativo sin
 * `aria-hidden` se lee en voz alta. Son defectos que no se ven en pantalla, que
 * es exactamente la clase de defecto que sobrevive años.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ NO LO VE NINGUNO DE LOS OTROS
 *
 * · El de la PROMESA resuelve la cascada sobre el MISMO marcado: le das a las
 *   dos hojas el mismo `<th>` y las dos responden lo mismo. El atributo que
 *   falta no está en ninguna de las dos hojas, está en el marcado.
 * · El del ELEMENTO compara la ETIQUETA por clase, no sus atributos. Y además
 *   SALTA toda clase que el guión del catálogo nombre —133 de 300 el día en que
 *   se escribió esto—, porque no puede leer marcado armado por concatenación.
 *   Siete de las once divergencias que este candado encuentra hoy están en ese
 *   montón de 133: `pgn-flecha`, `pgn-btn`, `tb-th`, `tb-th-indice`, `ep`,
 *   `fc-resumen` y `fc-cal`. Ninguna de las siete la puede ver.
 * · El de la PROMESA MUERTA pregunta si alguien EMITE una clase. Aquí la clase
 *   se emite en los dos sitios; lo que falta es lo que la acompaña.
 * · El de la OMISIÓN mira qué enseña el catálogo por defecto, en clases.
 * · El de los ICONOS compara dibujos; el del EMPATE, orden de reglas; el de la
 *   FORMA, el empaquetado de lo exportado.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ COMPRUEBA, EXACTAMENTE
 *
 * Para cada clase CSS que un componente emite, se deduce del JSX qué atributos
 * lleva SIEMPRE esa clase —mismo nombre y mismo valor en todos los elementos
 * del sistema que la llevan— y se comprueba que el marcado estático del
 * catálogo los pinta también.
 *
 * No se renderiza React: un candado es un script de node suelto. La fuente del
 * lado componente es el JSX leído estáticamente, con un escáner que cuenta
 * llaves y comillas —no una expresión regular—, porque `onClick={() => a > b}`
 * lleva un `>` dentro de la etiqueta y cualquier regexp se lo come.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAS CINCO REGLAS DE PRECISIÓN, cada una con su medición
 *
 * Un candado que grita en falso se desactiva a la semana, y este nació con 26
 * avisos de los que 15 eran ruido. Las cinco reglas que lo bajaron a 11
 * verificados a mano, y lo que cuesta cada una:
 *
 * 1 · SOLO VALORES LITERALES. `scope="col"` cuenta; `aria-sort={activa ? …}` no.
 *     Un valor que se calcula no se puede comparar con el catálogo leyendo
 *     texto, y además suele ser estado, no estructura. Coste: `aria-sort`,
 *     `aria-current` y compañía quedan fuera.
 *
 * 2 · EL SPREAD CONTAMINA LA CLASE ENTERA. Si algún elemento que lleva la clase
 *     tiene `{...resto}`, la clase se descarta: quien use el componente puede
 *     pisar cualquier atributo, así que no hay invariante que defender.
 *
 * 3 · NADA QUE SEA INSTANCIA. Fuera `id`, `href`, `src`, `name`, `placeholder`,
 *     `data-*` y toda la familia de atributos que atan un control a OTRO o
 *     cuentan su estado: `aria-controls`, `aria-labelledby`, `aria-expanded`,
 *     `aria-haspopup`, `aria-current`, `aria-selected`. Medido: sin esta regla,
 *     `.top-btn` salía en rojo porque `PanelBarra` emite `aria-haspopup="dialog"`
 *     y el catálogo pinta seis `<button class="top-btn">` que NO son paneles
 *     —el conmutador de tema, entre otros—. La clase es compartida y el
 *     atributo es de uno solo de sus usos: falso positivo de libro.
 *
 * 4 · EL CONTENIDO SE COMPRUEBA POR PRESENCIA, NO POR VALOR. `title`, `alt` y
 *     `aria-label` llevan texto, y el catálogo enseña ejemplos distintos a
 *     propósito. Medido: comparando el valor, `.us-tema` salía en rojo porque
 *     el componente dice `aria-label="Modo de color"` y el catálogo enseña
 *     «Densidad de las tablas» y «Vista del catálogo», que es lo que debe
 *     hacer un catálogo. Lo que sí se exige es que el atributo ESTÉ — que es el
 *     defecto del `title` que abre esta cabecera.
 *
 * 5 · TODO O NADA. Solo se avisa cuando el catálogo NO lo pinta en NINGUNA de
 *     sus ocurrencias. Es el mismo criterio que el cruce de `verificar-elemento`
 *     y por la misma razón: una clase la usan varios controles distintos, y que
 *     UNO de ellos no lleve el atributo suele ser legítimo. Medido: suprime 10
 *     avisos, entre ellos `.badge` (2 de 6 sin `aria-hidden`) y `.migas`
 *     (2 de 72). El coste está declarado abajo y es un falso NEGATIVO, que es
 *     el que se prefiere.
 *
 * Con las cinco: 11 avisos, los 11 verificados a mano contra el componente y
 * contra el catálogo, 0 falsos positivos. Están abajo, en DEUDA.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LÍMITES DECLARADOS — lo que este candado NO puede ver
 *
 * · SOLO EL MARCADO ESTÁTICO del catálogo. Se retiran los `<template>` —la
 *   página «La entrega real» guarda ahí marcado de componente y contarlo tapa
 *   divergencias, igual que en `verificar-elemento`—, los `<script>` y los
 *   comentarios HTML. Lo que el guión pinta al cargar —la rejilla del
 *   calendario, la lista del selector con búsqueda, el marco de teléfono— se
 *   arma por concatenación y no se puede leer como marcado.
 *
 *   PERO la clase NO se descarta por eso. Es la diferencia con
 *   `verificar-elemento`, que sí la descarta, y es de donde sale la mitad de lo
 *   que este encuentra: que el guión pinte OTRAS `.pgn-flecha` no hace menos
 *   real la `<span class="pgn-btn pgn-flecha">` escrita a mano que el navegador
 *   muestra. Se compara lo que hay escrito; lo que el guión añada, ni se ve ni
 *   se juzga.
 *
 * · SOLO CLASES QUE EMITE UN COMPONENTE. El mobiliario del catálogo
 *   —`.tabla-simple`, `.bloque`, `.seccion-*`, `.cat-*`— no es marcado de
 *   componente y no se compara. Los `<th>` sin clase de las tablas de
 *   documentación tampoco: no hay clase por la que atarlos.
 *
 * · SOLO CLASES QUE EL COMPONENTE EMITE SIN CONDICIÓN. Los modificadores que
 *   nacen de un ternario —`n === pagina ? 'activa' : ''`— sí se leen para
 *   deducir invariantes, porque el elemento existe, pero no se REPORTAN por su
 *   nombre. Medido: sin esto salía `.activa [type="button"]`, que es el mismo
 *   defecto de `.pgn-btn` contado dos veces y con un nombre genérico que otros
 *   seis componentes usan para otra cosa.
 *
 * · NO MIRA ATRIBUTOS DE MÁS. Que el catálogo pinte algo que el componente no
 *   emite no se avisa: eso es un ejemplo del catálogo, no una promesa rota.
 *
 * · NO ENTIENDE EL ANIDADO. No sabe si el `<th>` del catálogo está en la misma
 *   tabla que el del componente. Ata por clase y nada más.
 *
 * · UNA DEUDA PAGADA A MEDIAS PARECE PAGADA. Consecuencia directa de la regla 5
 *   y medida al probarlo: poniendo `scope="col"` en los DOS `.tb-th-indice` del
 *   catálogo, `.tb-th` pasa a tener 6 de 8 sin `scope` —una ausencia parcial— y
 *   el candado lo cuenta como deuda saldada y pide podar las dos líneas. Es lo
 *   correcto para él: a partir de ahí ya no puede afirmar nada sobre esa clase.
 *   Quien pague la deuda tiene que pagarla ENTERA, y el contador de «ausencias
 *   parciales» del informe está ahí para que se note cuando no se hizo.
 *
 * Lectura de texto. No monta nada, no toca red, no escribe nada.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const DIR_TSX = join(RAIZ, 'componentes', 'src');
const CATALOGO = join(RAIZ, 'cascaron', 'index.html');
const VERSION = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).version;

/* ── Qué es un atributo y qué no ──────────────────────────────────────────── */

/** Props de React que NUNCA salen como atributo, o que salen condicionadas al
 *  valor y por tanto no son invariantes de la clase. `disabled` sí se pinta,
 *  pero solo cuando es verdadero: `disabled={pagina === 1}`. */
const NO_ES_ATRIBUTO = new Set([
  'key', 'ref', 'children', 'dangerouslySetInnerHTML', 'suppressHydrationWarning',
  'className', 'defaultValue', 'defaultChecked',
  // Booleanos: el navegador los pinta o no según el valor.
  'value', 'checked', 'disabled', 'selected', 'readOnly', 'required',
  'multiple', 'autoFocus', 'open', 'hidden', 'draggable',
]);

/** Las props que CAMBIAN DE NOMBRE al pintarse. Sin esto, `htmlFor="x"` se
 *  buscaría en el catálogo como `htmlfor` y no aparecería jamás. */
const RENOMBRA = {
  htmlFor: 'for', tabIndex: 'tabindex', rowSpan: 'rowspan', colSpan: 'colspan',
  readOnly: 'readonly', autoComplete: 'autocomplete', maxLength: 'maxlength',
  minLength: 'minlength', crossOrigin: 'crossorigin', spellCheck: 'spellcheck',
  srcSet: 'srcset', noValidate: 'novalidate', acceptCharset: 'accept-charset',
  dateTime: 'datetime', contentEditable: 'contenteditable', inputMode: 'inputmode',
  autoCapitalize: 'autocapitalize', formAction: 'formaction', useMap: 'usemap',
};

/** Regla 3 · lo que es de la INSTANCIA y no de la clase. Ver la cabecera: sin
 *  esta línea, `.top-btn` salía en rojo por un `aria-haspopup` que solo lleva
 *  uno de los seis botones que comparten la clase. */
const DE_LA_INSTANCIA = new RegExp(
  '^(id|href|src|srcset|name|placeholder|style|width|height|form|formaction'
  + '|target|download|usemap|coords|shape|action|method|enctype|accept|list'
  + '|min|max|step|pattern|size|rows|cols|start|colspan|rowspan|data-'
  + '|aria-(controls|labelledby|describedby|details|errormessage|expanded'
  + '|haspopup|current|selected|owns|activedescendant|busy|pressed|checked'
  + '|disabled|valuenow|valuemin|valuemax|valuetext|posinset|setsize|level))',
);

/** Regla 4 · atributos que llevan TEXTO. Se exige que estén, no que digan lo
 *  mismo: el catálogo enseña ejemplos distintos a propósito. */
const SOLO_PRESENCIA = new Set([
  'title', 'alt', 'aria-label', 'aria-roledescription', 'aria-keyshortcuts',
  'aria-placeholder', 'lang', 'datetime', 'abbr', 'content',
]);

/* ── Lo que el componente emite ───────────────────────────────────────────── */

/** Fuera comentarios. Los componentes NOMBRAN atributos en prosa para contar
 *  por qué los ponen o por qué no; contarlo no puede ser emitirlo. El `//` solo
 *  se corta cuando no viene de un `:` —si no, `https://` parte la línea—. */
const sinComentarios = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1');

/**
 * Las etiquetas de apertura del JSX, con la zona de atributos entera.
 *
 * Escáner y no expresión regular: `onKeyDown={(e) => e.key > 'a'}` mete un `>`
 * dentro de la etiqueta, y `title={`a "b"`}` mete comillas. Se cuentan llaves y
 * se respetan las tres clases de comilla; el `>` que cierra es el primero que
 * cae a profundidad cero y fuera de comillas.
 */
function etiquetasJsx(src) {
  const salida = [];
  const re = /<([A-Za-z][A-Za-z0-9.]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let nivel = 0;
    let comilla = null;
    while (i < src.length) {
      const c = src[i];
      if (comilla) {
        if (c === '\\') i++;
        else if (c === comilla) comilla = null;
      } else if (c === '"' || c === "'" || c === '`') comilla = c;
      else if (c === '{') nivel++;
      else if (c === '}') nivel--;
      else if (c === '>' && nivel === 0) break;
      i++;
    }
    salida.push({ etiqueta: m[1], zona: src.slice(m.index + m[0].length, i) });
    re.lastIndex = i;
  }
  return salida;
}

/** Parte la zona de atributos en `{nombre, tipo, valor}` y avisa del spread. */
function atributosDe(zona) {
  const lista = [];
  let spread = false;
  let i = 0;
  while (i < zona.length) {
    if (/\s/.test(zona[i])) { i++; continue; }
    if (zona[i] === '{') {                       // spread, o comentario JSX
      let nivel = 1;
      let j = i + 1;
      while (j < zona.length && nivel > 0) {
        if (zona[j] === '{') nivel++;
        else if (zona[j] === '}') nivel--;
        j++;
      }
      if (/^\s*\.\.\./.test(zona.slice(i + 1, j - 1))) spread = true;
      i = j;
      continue;
    }
    const nm = /^[A-Za-z_][A-Za-z0-9_:.-]*/.exec(zona.slice(i));
    if (!nm) { i++; continue; }
    const nombre = nm[0];
    i += nombre.length;
    while (i < zona.length && /\s/.test(zona[i])) i++;
    if (zona[i] !== '=') { lista.push({ nombre, tipo: 'vacio' }); continue; }
    i++;
    while (i < zona.length && /\s/.test(zona[i])) i++;
    const q = zona[i];
    if (q === '"' || q === "'") {
      const fin = zona.indexOf(q, i + 1);
      if (fin === -1) break;
      lista.push({ nombre, tipo: 'literal', valor: zona.slice(i + 1, fin) });
      i = fin + 1;
    } else if (q === '{') {
      let nivel = 1;
      let j = i + 1;
      while (j < zona.length && nivel > 0) {
        if (zona[j] === '{') nivel++;
        else if (zona[j] === '}') nivel--;
        j++;
      }
      lista.push({ nombre, tipo: 'expr', valor: zona.slice(i + 1, j - 1) });
      i = j;
    } else i++;
  }
  return { lista, spread };
}

/**
 * Las clases de un `className`, separadas en INCONDICIONALES y todas.
 *
 * Las dos hacen falta y hacen cosas distintas:
 *
 * · TODAS se usan para deducir el invariante. Si una clase viaja en un ternario,
 *   el elemento existe igual y sus atributos tienen que entrar en la
 *   intersección — si no, se daría por invariante un atributo que el componente
 *   a veces no pone, y eso es un falso positivo sin remedio.
 * · INCONDICIONALES se usan para REPORTAR. Un modificador que nace de un
 *   ternario es un nombre genérico —`activa`, `abierta`— que media docena de
 *   componentes usan para cosas distintas, y avisar por su nombre es contar dos
 *   veces el defecto de la clase base.
 *
 * Una literal se da por condicional si en su tramo —cortado por las comas de
 * primer nivel del array o de la llamada— aparece antes un `?`, un `&&` o un
 * `||`. Es una aproximación que peca por exceso, y peca del lado bueno: de más
 * clases condicionales salen menos invariantes, no más.
 */
function clasesDe(attr) {
  if (!attr) return { todas: [], firmes: [] };
  const limpia = (t) => t.split(/\s+/).filter((c) => c && /^[a-z][a-z0-9-]*$/.test(c));
  if (attr.tipo === 'literal') {
    const cs = limpia(attr.valor);
    return { todas: cs, firmes: cs };
  }
  if (attr.tipo !== 'expr') return { todas: [], firmes: [] };

  const expr = attr.valor;
  const tramos = [];
  let nivel = 0;
  let comilla = null;
  let ini = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (comilla) {
      if (c === '\\') i++;
      else if (c === comilla) comilla = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { comilla = c; continue; }
    if ('([{'.includes(c)) nivel++;
    else if (')]}'.includes(c)) nivel--;
    else if (c === ',' && nivel <= 1) { tramos.push(expr.slice(ini, i)); ini = i + 1; }
  }
  tramos.push(expr.slice(ini));

  const todas = [];
  const firmes = [];
  for (const tramo of tramos) {
    for (const m of tramo.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
      // Una plantilla con interpolación —`avatar-${tamano}`— deja un trozo a
      // medias: se parte por el hueco y el trozo pegado a él se cae solo, por
      // no pasar el filtro de nombre de clase.
      const texto = m[1] === '`' ? m[2].replace(/\$\{[^}]*\}/g, ' ') : m[2];
      const cs = limpia(texto);
      todas.push(...cs);
      if (!/\?|&&|\|\|/.test(tramo.slice(0, m.index))) firmes.push(...cs);
    }
  }
  return { todas, firmes };
}

const fuentesTsx = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? fuentesTsx(join(dir, e.name))
      : /\.tsx$/.test(e.name) ? [join(dir, e.name)] : []);

/** clase → { mapas, spread, de, etiquetas, firme } */
const emitido = new Map();
let elementosLeidos = 0;

for (const archivo of fuentesTsx(DIR_TSX)) {
  const src = sinComentarios(readFileSync(archivo, 'utf8'));
  const componente = archivo.split('/').pop().replace('.tsx', '');

  for (const { etiqueta, zona } of etiquetasJsx(src)) {
    // Solo elementos del DOM. `<Boton className="tna-editar" mini>` no pinta
    // `mini` como atributo: es una prop que el componente traduce a clase.
    if (!/^[a-z]/.test(etiqueta)) continue;

    const { lista, spread } = atributosDe(zona);
    const { todas, firmes } = clasesDe(lista.find((a) => a.nombre === 'className'));
    if (!todas.length) continue;
    elementosLeidos++;

    const mapa = new Map();
    for (const a of lista) {
      if (a.tipo !== 'literal') continue;                 // regla 1
      if (NO_ES_ATRIBUTO.has(a.nombre)) continue;
      const nombre = (RENOMBRA[a.nombre] ?? a.nombre).toLowerCase();
      if (DE_LA_INSTANCIA.test(nombre)) continue;         // regla 3
      // Una prop en camelCase que no está en la tabla de renombres no se sabe
      // cómo se pinta: se deja fuera antes que inventarse el nombre.
      if (!RENOMBRA[a.nombre] && /[A-Z]/.test(a.nombre)) continue;
      mapa.set(nombre, a.valor);
    }

    const firme = new Set(firmes);
    for (const c of todas) {
      if (!emitido.has(c)) {
        emitido.set(c, { mapas: [], spread: false, de: new Set(), etiquetas: new Set(), firme: false });
      }
      const e = emitido.get(c);
      e.mapas.push(mapa);
      e.spread = e.spread || spread;                      // regla 2
      e.de.add(componente);
      e.etiquetas.add(etiqueta);
      e.firme = e.firme || firme.has(c);
    }
  }
}

/** clase → Map(atributo → valor) que TODOS sus elementos comparten. */
const invariantes = new Map();
let porSpread = 0;
let porCondicional = 0;

for (const [clase, e] of emitido) {
  if (e.spread) { porSpread++; continue; }
  if (!e.firme) { porCondicional++; continue; }
  const inv = new Map();
  for (const [k, v] of e.mapas[0]) {
    if (e.mapas.every((m) => m.get(k) === v)) inv.set(k, v);
  }
  if (inv.size) {
    invariantes.set(clase, {
      inv, de: [...e.de].sort(), etiquetas: [...e.etiquetas].sort(), veces: e.mapas.length,
    });
  }
}

/* ── Lo que el catálogo pinta ─────────────────────────────────────────────── */

/* Se retira lo que no es marcado mostrado:
   · `<template>` — la página «La entrega real» guarda ahí el marcado que EMITEN
     los componentes. Contarlo hace desaparecer divergencias reales, que es la
     misma trampa que documenta `verificar-elemento`.
   · `<script>` — el marcado que arma el guión se concatena, y leerlo como texto
     da atributos partidos por la mitad.
   · comentarios HTML — marcado apagado a propósito. */
const html = readFileSync(CATALOGO, 'utf8')
  .replace(/<template[^>]*>[\s\S]*?<\/template>/g, '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '');

/** Escáner con conciencia de comillas: un `aria-label="a > b"` corta cualquier
 *  `[^>]*` a mitad de etiqueta y deja atributos fuera. */
function etiquetasHtml(texto) {
  const salida = [];
  const re = /<([a-z][a-z0-9]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(texto))) {
    let i = m.index + m[0].length;
    let comilla = null;
    while (i < texto.length) {
      const c = texto[i];
      if (comilla) { if (c === comilla) comilla = null; }
      else if (c === '"' || c === "'") comilla = c;
      else if (c === '>') break;
      i++;
    }
    salida.push({ etiqueta: m[1], zona: texto.slice(m.index + m[0].length, i), fin: i });
    re.lastIndex = i;
  }
  return salida;
}

/** clase → [{ etiqueta, attrs, crudo }] */
const enCatalogo = new Map();
let etiquetasCatalogo = 0;

for (const { etiqueta, zona, fin } of etiquetasHtml(html)) {
  const attrs = new Map();
  for (const a of zona.matchAll(/([a-zA-Z_][a-zA-Z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs.set(a[1].toLowerCase(), a[2] ?? a[3]);
  }
  for (const a of zona.matchAll(/(?:^|\s)([a-zA-Z_][a-zA-Z0-9_:.-]*)(?=\s|$)/g)) {
    if (!attrs.has(a[1].toLowerCase())) attrs.set(a[1].toLowerCase(), '');
  }
  const clases = attrs.get('class');
  if (!clases) continue;
  etiquetasCatalogo++;
  const crudo = html.slice(fin - zona.length - etiqueta.length - 1, fin + 1).replace(/\s+/g, ' ');
  for (const c of clases.split(/\s+/).filter(Boolean)) {
    if (!enCatalogo.has(c)) enCatalogo.set(c, []);
    enCatalogo.get(c).push({ etiqueta, attrs, crudo });
  }
}

/* ── DEUDA DECLARADA ──────────────────────────────────────────────────────── */

/**
 * Las once divergencias que este candado encontró el día que se escribió. Cada
 * una está verificada A MANO: se leyó el JSX del componente y se listaron todas
 * las ocurrencias de la clase en el catálogo. Ninguna es un falso positivo.
 *
 * Se declaran en vez de arreglarse a la carrera porque arreglarlas es tocar el
 * generador del cascarón y los componentes, y cada arreglo necesita su prueba.
 * Están aquí para que el candado proteja YA de las divergencias NUEVAS —que es
 * el 90 % de su valor— sin fingir que estas no existen.
 *
 * La clave es `clase[atributo]`. Arreglar una es QUITAR SU LÍNEA; si se arregla
 * y no se poda, el candado FALLA igual: una lista de excepciones que nadie poda
 * vuelve a ser el inventario a mano de siempre.
 */
const DEUDA = new Map([
  /* VACÍA, y esa es la noticia. Nació con once —las once que este candado
     encontró el día que se escribió, verificadas a mano una a una— y se pagaron
     las once en el mismo commit: la paginación pasó de `<span>` a `<button
     type="button">`, las cabeceras de tabla recuperaron su `scope`, el chevron
     del selector se ocultó al lector, los atajos del rango dejaron de ser
     `submit`, los estados de pantalla se anuncian, y el calendario recuperó las
     cuatro decisiones que el componente declara y el catálogo no repetía.

     Cuando aparezca una divergencia que no se pueda cerrar el mismo día, se
     apunta aquí con su daño real —no con un «pendiente»— y el candado la deja
     pasar. Si se arregla y nadie poda su línea, TAMBIÉN falla: una lista de
     excepciones que nadie poda vuelve a ser el inventario a mano de siempre. */
]);

/* ── El cruce ─────────────────────────────────────────────────────────────── */

const fallos = [];
let comparadas = 0;
let sinPagina = 0;
let atributosMirados = 0;
let parciales = 0;

for (const [clase, { inv, de, etiquetas }] of invariantes) {
  const ocurrencias = enCatalogo.get(clase);
  // Una clase que el catálogo no pinta no es asunto de este candado: de que
  // cada componente tenga página responde `verificar-entrega`.
  if (!ocurrencias) { sinPagina++; continue; }
  comparadas++;

  for (const [attr, valor] of inv) {
    atributosMirados++;
    const malas = SOLO_PRESENCIA.has(attr)          // regla 4
      ? ocurrencias.filter((o) => !o.attrs.has(attr))
      : ocurrencias.filter((o) => o.attrs.get(attr) !== valor);
    if (!malas.length) continue;
    // Regla 5 · todo o nada. Si el catálogo lo pinta en alguna, la clase la
    // comparten controles distintos y la ausencia suele ser legítima.
    if (malas.length < ocurrencias.length) { parciales++; continue; }
    fallos.push({
      clase, attr, valor, de, etiquetas,
      cuantas: malas.length, total: ocurrencias.length,
      muestra: malas.slice(0, 2).map((o) => o.crudo.slice(0, 118)),
      presencia: SOLO_PRESENCIA.has(attr),
    });
  }
}

/* ── Informe ──────────────────────────────────────────────────────────────── */

const clave = (f) => `${f.clase}[${f.attr}]`;

console.log(`\n  Candado del atributo — MMI-DS v${VERSION}\n`);
console.log('  Promesa:  cascaron/index.html          (marcado ESTÁTICO, sin <template> ni <script>)');
console.log('  Entrega:  componentes/src/**/*.tsx     (JSX leído, no renderizado)\n');
console.log(`  Elementos con clase en los componentes:  ${elementosLeidos}`);
console.log(`  Elementos con clase en el catálogo:      ${etiquetasCatalogo}`);
console.log(`  Clases que emite algún componente:       ${emitido.size}`);
console.log(`    · descartadas por spread:              ${porSpread}  — {...resto} puede pisar cualquier atributo`);
console.log(`    · solo condicionales, no se reportan:  ${porCondicional}`);
console.log(`    · con atributo invariante:             ${invariantes.size}`);
console.log(`  Clases comparadas contra el catálogo:    ${comparadas}   (${sinPagina} sin página, omitidas)`);
console.log(`  Atributos invariantes mirados:           ${atributosMirados}`);
console.log(`  Ausencias PARCIALES, no se avisan:       ${parciales}  — regla 5, «todo o nada»\n`);

const nuevas = fallos.filter((f) => !DEUDA.has(clave(f)));
const declaradas = fallos.filter((f) => DEUDA.has(clave(f)));
const saldadas = [...DEUDA.keys()].filter((k) => !fallos.some((f) => clave(f) === k));

console.log(`  Deuda declarada: ${DEUDA.size}\n`);

if (declaradas.length) {
  console.log(`  ${declaradas.length} divergencia(s) DECLARADAS, pendientes de arreglo:\n`);
  for (const f of declaradas.sort((a, b) => clave(a).localeCompare(clave(b)))) {
    console.log(`    .${f.clase}  [${f.attr}${f.presencia ? '' : `="${f.valor}"`}]`
      + `   ${f.cuantas}/${f.total} en el catálogo   (${f.de.join(', ')} · <${f.etiquetas.join('/')}>)`);
    console.log(`      ${DEUDA.get(clave(f))}\n`);
  }
}

if (saldadas.length) {
  console.error(`  ${saldadas.length} entrada(s) de deuda que ya NO divergen:\n`);
  for (const k of saldadas) console.error(`    .${k}`);
  console.error('\n  Se arregló y la línea sigue en la lista. Quítala de DEUDA: una lista de');
  console.error('  excepciones que nadie poda vuelve a ser el inventario a mano de siempre.\n');
  process.exit(1);
}

if (nuevas.length) {
  console.error(`  ${nuevas.length} atributo(s) que el componente emite SIEMPRE y el catálogo NUNCA pinta:\n`);
  for (const f of nuevas.sort((a, b) => clave(a).localeCompare(clave(b)))) {
    console.error(`    .${f.clase}   (${f.de.join(', ')} · <${f.etiquetas.join('/')}>)`);
    console.error(`      el componente emite: ${f.attr}${f.presencia ? ' (se exige que ESTÉ, no su texto)' : `="${f.valor}"`}`);
    console.error(`      el catálogo, en ${f.cuantas} de ${f.total} ocurrencia(s): no lo pinta`);
    for (const s of f.muestra) console.error(`        ${s}`);
    console.error('');
  }
  console.error('  Ninguno de los otros candados puede ver esto: el de la promesa resuelve');
  console.error('  la cascada sobre el MISMO marcado, y el del elemento compara la etiqueta.');
  console.error('  Aquí lo que falta está EN el marcado, y no se ve en pantalla — que es la');
  console.error('  clase de defecto que sobrevive años.\n');
  console.error('  Dos salidas honestas: que el catálogo pinte el atributo —es lo que casi');
  console.error('  siempre falta—, o que el componente deje de emitirlo si ya no hace falta.\n');
  process.exit(1);
}

console.log('  Ningún atributo invariante NUEVO sin pintar: lo que el componente emite');
console.log('  siempre, el catálogo lo enseña, salvo la deuda declarada de arriba.\n');
