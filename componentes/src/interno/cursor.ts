/**
 * EL CURSOR SOBREVIVE A UNA REESCRITURA DE LA CAJA.
 *
 * Reasignar `innerHTML` destruye todos los nodos y con ellos la selección: el
 * cursor vuelve al principio. En un `contenteditable` controlado eso no es un
 * detalle, es **no poder escribir**.
 *
 * Pasó, y en producción. La v1.111.0 salió con el saneador serializando el
 * espacio duro como carácter crudo mientras `innerHTML` lo devuelve como
 * `&nbsp;`: dos cadenas distintas para el mismo contenido, así que la pregunta
 * «¿cambió el saneo algo?» decía que sí en **cada tecla**, la caja se
 * reescribía entera y el cursor saltaba al principio. Lo reportó el responsable
 * el 2026-09-14.
 *
 * Aquel defecto está arreglado en su origen —`escapar` ya escapa los cuatro
 * caracteres de la norma—, y esto es la otra mitad: **que el cursor no dependa
 * de que dos serializadores coincidan byte a byte**. Si mañana aparece una
 * quinta diferencia, se perderá una posición de cursor por un instante en vez
 * de dejar el componente inservible.
 *
 * Se cuenta en **caracteres de texto** desde el principio de la caja, no en
 * nodos: la reescritura cambia el árbol —eso es lo que la hace reescritura—
 * pero conserva el texto, que es lo que quien escribe está mirando.
 *
 * INTERNO. No se exporta en el paquete.
 */

/**
 * Cuántos caracteres de texto hay antes del cursor, contando desde el principio
 * de `raiz`. Devuelve `null` si no hay cursor o si está fuera de la caja.
 */
export function dondeEstaElCursor(raiz: HTMLElement): number | null {
  const sel = raiz.ownerDocument.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const rango = sel.getRangeAt(0);
  if (!raiz.contains(rango.endContainer)) return null;
  const hastaAqui = rango.cloneRange();
  hastaAqui.selectNodeContents(raiz);
  hastaAqui.setEnd(rango.endContainer, rango.endOffset);
  return hastaAqui.toString().length;
}

/**
 * Deja el cursor en esa posición, contada igual. Si el texto encogió —porque el
 * saneo retiró algo— se queda en el final, que es lo menos sorprendente.
 */
export function ponerElCursor(raiz: HTMLElement, donde: number): void {
  const doc = raiz.ownerDocument;
  const sel = doc.getSelection();
  if (!sel) return;
  const rango = doc.createRange();
  const paseo = doc.createTreeWalker(raiz, 4 /* NodeFilter.SHOW_TEXT */);
  let visto = 0;
  for (let nodo = paseo.nextNode() as Text | null; nodo; nodo = paseo.nextNode() as Text | null) {
    /**
     * `>` Y NO `>=`, y la diferencia es Intro.
     *
     * Cuando la posición cae **exactamente en la frontera** entre dos nodos de
     * texto, contarla con `>=` la resuelve hacia ATRÁS: el cursor acaba al
     * final del nodo anterior en vez de al principio del siguiente. Con eso,
     * pulsar Intro y escribir metía la letra **en la línea de arriba** y la
     * nueva se quedaba vacía — que es el flujo por omisión de Chrome, porque
     * su Intro deja un `<div><br></div>` que el saneador desenvuelve, y ese
     * desenvolver es una reescritura.
     *
     * Con `>`, una posición en la frontera se la queda el nodo siguiente. Y si
     * no hay ninguno —Intro al final del documento, donde lo único que sigue
     * es un `<br>`— el bucle se agota y cae al final del contenido, que es
     * justo la línea nueva.
     *
     * Lo cazó una auditoría el 2026-09-14, sobre este mismo archivo recién
     * escrito para arreglar otra cosa.
     */
    if (visto + nodo.data.length > donde) {
      rango.setStart(nodo, donde - visto);
      rango.collapse(true);
      sel.removeAllRanges();
      sel.addRange(rango);
      return;
    }
    visto += nodo.data.length;
  }
  // Se acabó el texto antes de llegar: al final de lo que haya.
  rango.selectNodeContents(raiz);
  rango.collapse(false);
  sel.removeAllRanges();
  sel.addRange(rango);
}

/**
 * Reescribe la caja **conservando el cursor**, y solo si hace falta.
 *
 * Devuelve `true` si reescribió. El cursor se restaura únicamente cuando la
 * caja ya tenía el foco: ponerle una selección a un elemento que nadie está
 * mirando le robaría el foco a donde de verdad está.
 */
export function reescribirConservandoElCursor(raiz: HTMLElement, html: string): boolean {
  if (raiz.innerHTML === html) return false;
  const teniaElFoco = raiz.ownerDocument.activeElement === raiz;
  const donde = teniaElFoco ? dondeEstaElCursor(raiz) : null;
  raiz.innerHTML = html;
  if (donde !== null) ponerElCursor(raiz, donde);
  return true;
}
