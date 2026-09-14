/**
 * EL SANEADOR — el corazón del editor, y lo único que de verdad se garantiza.
 *
 * Se saca a su propio archivo por una razón que no es estética: **es una
 * función pura sobre texto**, así que se puede probar entera sin navegador, sin
 * `contenteditable` y sin selección. Todo lo que el editor promete se decide
 * aquí, y lo que queda arriba —barra, teclado, cursor— es superficie.
 *
 * LA INVARIANTE, que es todo el valor de la pieza:
 *
 *   Lo que sale de aquí SIEMPRE está dentro de `etiquetas` y `huecos`, venga de
 *   teclear, de pegar, de arrastrar o de deshacer.
 *
 * Y por qué importa, en las palabras de quien lo pidió: «un editor de navegador
 * emite el HTML que le da la gana; el destino —un PDF, una impresora, un correo,
 * una pantalla ajena— admite muchísimo menos. Lo que el editor ofrece de más se
 * guarda sin error y desaparece en el destino».
 *
 * CERO ATRIBUTOS, SIEMPRE. Ni `class`, ni `style`, ni `id`, ni `data-*`, ni
 * siquiera en las etiquetas permitidas. No es una restricción de un producto:
 * es lo que pasa siempre que el HTML se TRADUCE a otro formato en vez de
 * renderizarse. Un atributo no significa nada para quien dibuja un PDF, y
 * admitirlo solo sirve para que alguien lo escriba y no pase nada.
 *
 * LISTA BLANCA y no lista negra: una lista negra se queda vieja cada vez que
 * alguien inventa una etiqueta, y no se entera nadie hasta que sale mal.
 */

/** Las etiquetas que este editor sabe sanear y —cuando procede— ofrecer. */
export type EtiquetaEditor =
  | 'p' | 'br' | 'strong' | 'em' | 'u' | 's'
  | 'ul' | 'ol' | 'li' | 'hr'
  | 'h2' | 'h3' | 'h4' | 'blockquote';

/** Las que NO llevan cierre. Emitirlas con cierre produce marcado inválido. */
const VACIAS = new Set(['br', 'hr']);

/**
 * LO MISMO CON OTRO NOMBRE. Se traduce ANTES de mirar la lista blanca.
 *
 * Nace de un defecto medido por el equipo consumidor en un navegador de verdad,
 * y era el peor posible: **el botón «Negrita» no ponía negrita, y encima
 * culpaba a quien escribe**. `execCommand('bold')` emite `<b>`; la lista
 * blanca tiene `strong`; el saneador lo desenvolvía y el aviso decía «se quitó
 * el formato que no se admite (b)». El componente acusaba de meter un formato
 * prohibido a quien había pulsado **su propio botón**: el modo de fallo que
 * esta pieza existe para impedir, reproducido dentro de ella.
 *
 * SE NORMALIZA, NO SE AMPLÍA LA LISTA, y el argumento es de ellos: **la lista
 * blanca es el contrato**; `<b>` es un detalle de implementación de
 * `execCommand`, que además está obsoleto y puede cambiar de salida sin avisar.
 * Normalizando, el contrato queda inmune a lo que haga el navegador.
 *
 * Y sirve también para lo que se pega: un `<b>` de Word pasa a ser `<strong>`
 * en vez de perderse — siempre que `strong` esté permitido. Si no lo está, se
 * va igual, porque la lista sigue mandando.
 */
const IGUALES: Record<string, EtiquetaEditor> = {
  b: 'strong',
  i: 'em',
  strike: 's',
  del: 's',
  ins: 'u',
};

/**
 * Las que no pueden quedar sueltas: un `<li>` fuera de una lista no es nada.
 * Si su contenedor no está permitido, el hijo tampoco vale.
 */
const EXIGEN: Partial<Record<EtiquetaEditor, EtiquetaEditor[]>> = {
  li: ['ul', 'ol'],
};

export type ResultadoSaneo = {
  /** El HTML limpio. Cumple la invariante. */
  html: string;
  /** Nombres de hueco que venían y no estaban permitidos. Se quitaron. */
  huecosFuera: string[];
  /** Etiquetas que venían y se retiraron. Para poder DECIRLO. */
  etiquetasFuera: string[];
};

/**
 * LA EXPRESIÓN DE LOS HUECOS, tal cual la usa quien lo pidió, para que las dos
 * puntas coincidan carácter a carácter:
 *
 *   · se admite espacio dentro — `{{ trabajador }}` es el mismo hueco
 *   · el nombre empieza por letra y sigue con letras, dígitos o `_`
 *   · distingue mayúsculas: `{{Trabajador}}` NO es `{{trabajador}}`
 */
export const HUECO = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * LOS CUATRO QUE ESCAPA EL NAVEGADOR AL SERIALIZAR UN NODO DE TEXTO, y son
 * cuatro y no tres.
 *
 * **El espacio duro faltaba, y costó el componente entero.** `innerHTML`
 * devuelve `&nbsp;` donde hay un U+00A0, y aquí salía el carácter crudo: dos
 * cadenas distintas para el mismo contenido. El navegador mete un espacio duro
 * **cada vez que se teclea un espacio al final de un texto**, así que desde la
 * primera palabra la comparación «¿cambió el saneo algo?» decía que sí
 * siempre, el editor reescribía `innerHTML` en CADA TECLA y **el cursor volvía
 * al principio**: no se podía escribir de corrido.
 *
 * Lo reportó el responsable el 2026-09-14, con la v1.111.0 ya publicada.
 * Ninguna prueba lo vio porque todas escribían HTML a mano, y a mano nadie
 * escribe un espacio duro — lo pone el navegador.
 *
 * La lista es la de la norma de serialización de HTML para nodos de texto:
 * `&`, `<`, `>` y U+00A0. No hay un quinto.
 */
const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '\u00a0': '&nbsp;',
};
/* SE EXPORTA aunque sea interno: `EditorTexto` escribia a mano el MISMO mapa
   para el pegado de texto plano, y dos verdades sobre el mismo conjunto de
   caracteres divergen — es lo que ya le paso a `usarDesplegable`. */
export const escapar = (t: string) => t.replace(/[&<> ]/g, (c) => ESCAPES[c]);

/**
 * Deja en el texto solo los huecos permitidos. **Hasta el punto fijo**, y ese
 * bucle no es prudencia: es un defecto medido.
 *
 * `String.replace` recorre el original en UNA sola pasada, así que borrar un
 * hueco desconocido puede FABRICAR uno nuevo juntando las llaves que quedan a
 * los lados:
 *
 *     {{ {{documento}}sede}}   →   {{ sede}}   →   {{sede}}
 *      └─ no casa      └─ se borra   └─ ahora SÍ casa
 *
 * El primer saneo dejaba un hueco que el segundo normalizaba, así que el
 * documento guardado CAMBIABA SOLO entre una sesión y la siguiente. Lo encontró
 * una auditoría el 2026-09-13 contra la regla que decía que esto era idempotente.
 *
 * El tope existe por si algún día se encuentra un caso que oscile en vez de
 * converger: mejor parar y entregar algo estable que quedarse dando vueltas.
 */
function saldoHuecos(
  texto: string,
  huecos: Set<string>,
  fuera: { huecos: Set<string> },
): string {
  let previo = texto;
  /* EL TOPE SALE DEL CONTENIDO, no es un 8 a ojo. Cada vuelta que cambia algo
     borra al menos un hueco, y borrar un hueco se lleva cuatro llaves, asi que
     el numero de llaves ESTRICTAMENTE BAJA: con una vuelta por cada cuatro
     llaves, converger esta garantizado. Un tope fijo entregaba algo inestable
     —sin avisar— en cuanto alguien anidaba mas capas que el tope. */
  const tope = Math.max(2, Math.ceil((texto.match(/[{}]/g)?.length ?? 0) / 4) + 1);
  for (let vuelta = 0; vuelta < tope; vuelta += 1) {
    const salida = previo.replace(HUECO, (_todo, nombre: string) => {
      if (huecos.has(nombre)) return `{{${nombre}}}`;   // se normaliza el espacio
      fuera.huecos.add(nombre);
      return '';
    });
    if (salida === previo) return salida;
    previo = salida;
  }
  return previo;
}

/**
 * Sanea un árbol ya parseado. Recibe el nodo raíz y devuelve HTML.
 *
 * Se recorre el DOM y no se hace con expresiones sobre el texto, y esa
 * diferencia es la que decide si esto sirve: un troceador por texto se engaña
 * con `<p title="<strong>">`, con comentarios condicionales de Word y con
 * cualquier `<` dentro de un atributo. El navegador ya sabe parsear HTML; lo
 * que no sabe es qué hay que tirar.
 */
function sanearNodo(
  nodo: Node,
  permitidas: Set<string>,
  huecos: Set<string>,
  fuera: { huecos: Set<string>; etiquetas: Set<string> },
  dentroDe: string[],
): string {
  // Texto: se escapa y se le quitan los huecos que no estén permitidos.
  if (nodo.nodeType === 3) {
    return escapar(saldoHuecos(nodo.textContent ?? '', huecos, fuera));
  }
  // Comentarios —los de Word vienen a pares— y todo lo que no sea elemento.
  if (nodo.nodeType !== 1) return '';

  const el = nodo as Element;
  const crudo = el.tagName.toLowerCase();
  // Se traduce ANTES de mirar la lista: la lista es el contrato, y `<b>` es lo
  // que el navegador emite para decir «negrita».
  const tag = IGUALES[crudo] ?? crudo;
  const hijos = [...el.childNodes]
    .map((h) => sanearNodo(h, permitidas, huecos, fuera, permitidas.has(tag) ? [...dentroDe, tag] : dentroDe))
    .join('');

  if (!permitidas.has(tag)) {
    // NO SE TIRA EL CONTENIDO, solo la etiqueta. Quien pega desde Word trae
    // cada párrafo envuelto en tres `<span>`: tirar el contenido con ellos
    // dejaría el documento vacío, que es peor que perder el formato.
    if (crudo !== 'script' && crudo !== 'style') fuera.etiquetas.add(crudo);
    return crudo === 'script' || crudo === 'style' ? '' : hijos;
  }

  const exige = EXIGEN[tag as EtiquetaEditor];
  if (exige && !exige.some((p) => dentroDe.includes(p))) {
    fuera.etiquetas.add(tag);
    return hijos;
  }

  if (VACIAS.has(tag)) return `<${tag}>`;
  // Los contenedores que se quedan vacíos no aportan nada y el destino los
  // traduce a un hueco en blanco.
  // `\s` incluye el espacio duro, y un `<strong>&nbsp;</strong>` es contenido:
  // tirarlo contradice la regla de que la etiqueta se va y el contenido se
  // queda. Se mira si hay ALGO, no si hay algo que no sea espacio.
  if (hijos === '' && tag !== 'p') return '';
  return `<${tag}>${hijos}</${tag}>`;
}

/**
 * Sanea un fragmento de HTML contra las listas dadas.
 *
 * `parse` se inyecta para no atar esto al navegador: el editor le pasa el
 * `DOMParser`, y una prueba puede pasarle lo que quiera. Sin eso, esta función
 * —que es la que hay que probar a conciencia— solo se podría probar montando
 * un navegador entero.
 */
export function sanear(
  html: string,
  opciones: {
    etiquetas: readonly EtiquetaEditor[];
    huecos: readonly string[];
    parse: (html: string) => Element;
  },
): ResultadoSaneo {
  const permitidas = new Set<string>(opciones.etiquetas);
  const huecos = new Set(opciones.huecos);
  const fuera = { huecos: new Set<string>(), etiquetas: new Set<string>() };
  /**
   * SE SANEA HASTA EL PUNTO FIJO, Y A NIVEL DE DOCUMENTO. Sin esto la
   * invariante se violaba de verdad, y en silencio.
   *
   * Cada nodo de texto se sanea por separado, así que un hueco PARTIDO por una
   * etiqueta que se desenvuelve **nunca se ve como hueco** — y al desenvolver,
   * los dos trozos se juntan y aparece en la salida:
   *
   *     <p>Hola {{doc<b>umento</b>}} adiós</p>   con `b` fuera de la lista
   *     → <p>Hola {{documento}} adiós</p>        ← un hueco DESCONOCIDO, entero
   *
   * Y `huecosFuera` salía vacío, así que ni siquiera se podía decir. Lo midió
   * una auditoría el 2026-09-13, con la pieza ya escrita y sus 43 pruebas en
   * verde: es el único camino por el que la garantía se rompía.
   *
   * Converge por el mismo argumento que arriba: cada vuelta que cambia algo
   * retira contenido, así que la entrada de la siguiente es estrictamente más
   * corta. El tope sale de la longitud, no de un número a ojo.
   */
  let salida = html;
  const tope = Math.max(2, Math.ceil(html.length / 8) + 2);
  for (let vuelta = 0; vuelta < tope; vuelta += 1) {
    const raiz = opciones.parse(salida);
    const paso = [...raiz.childNodes]
      .map((n) => sanearNodo(n, permitidas, huecos, fuera, []))
      .join('');
    if (paso === salida) break;
    salida = paso;
  }
  return {
    html: salida,
    huecosFuera: [...fuera.huecos],
    etiquetasFuera: [...fuera.etiquetas].sort(),
  };
}

/** Los huecos que un HTML ya saneado contiene, en orden de aparición. */
export const huecosDe = (html: string) =>
  [...html.matchAll(HUECO)].map((m) => m[1]);

/**
 * LA FICHA ES INDIVISIBLE, y esta es la decisión, sacada aparte para poder
 * probarla.
 *
 * Un `{{trabajador}}` es **una cosa, no trece caracteres**. Si se puede partir
 * por la mitad, el guardado falla y quien escribe no entiende por qué: en la
 * pantalla ve una ficha con el nombre puesto. Lo pidió así el equipo, y la
 * primera versión de este componente lo **afirmó en tres sitios sin construir
 * nada** — un Retroceso al lado dejaba `{{sede}` y el hueco se convertía en
 * texto suelto. Lo cazó una auditoría el 2026-09-13.
 *
 * Se separa de la manipulación del DOM por el mismo motivo que el saneador:
 * jsdom no simula la selección dentro de un `contenteditable`, así que la
 * decisión —QUÉ hay que borrar— se prueba entera aquí, y arriba solo queda
 * aplicarla.
 *
 * Devuelve el tramo COMPLETO que hay que borrar, o `null` si el cursor no toca
 * ningún hueco y el borrado es el normal.
 *
 * @param texto  el contenido del nodo de texto donde está el cursor
 * @param donde  la posición del cursor dentro de ese texto
 * @param hacia  'atras' para Retroceso, 'delante' para Suprimir
 */
export function tramoDeHueco(
  texto: string,
  donde: number,
  hacia: 'atras' | 'delante',
): { inicio: number; fin: number } | null {
  for (const m of texto.matchAll(HUECO)) {
    const inicio = m.index!;
    const fin = inicio + m[0].length;
    // DENTRO del hueco, en cualquier dirección: se va entero. El cursor no
    // debería poder estar aquí, y si llega —pegando, o con el ratón— lo que no
    // puede pasar es que el borrado lo parta.
    if (donde > inicio && donde < fin) return { inicio, fin };
    // Justo detrás, con Retroceso: se va entero, nunca `{{trabajado}}`.
    if (hacia === 'atras' && donde === fin) return { inicio, fin };
    // Justo delante, con Suprimir: lo mismo por el otro lado.
    if (hacia === 'delante' && donde === inicio) return { inicio, fin };
  }
  return null;
}
