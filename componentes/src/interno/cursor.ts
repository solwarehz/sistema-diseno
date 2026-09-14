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
 * DÓNDE ESTÁ EL CURSOR. Un número **no basta**, y hacen falta dos cosas.
 *
 * Una posición contada en caracteres es **ambigua en toda frontera**: en
 * `<p>uno</p><p>dos</p>`, el 3 es a la vez «al final de uno» y «al principio de
 * dos», y las dos resoluciones son correctas la mitad de las veces. Se probaron
 * las dos y las dos rompen algo:
 *
 *   · resolver hacia atrás mete la letra **en la línea de arriba** después de
 *     un Intro, y deja la nueva vacía;
 *   · resolver hacia delante saca la letra **fuera del párrafo** cuando se
 *     escribe al final del documento.
 *
 * Las dos versiones se publicaron —el primer defecto lo reportó el responsable,
 * el segundo lo cazó una auditoría el 2026-09-14— y las dos son el mismo error
 * de fondo: **no se puede resolver la ambigüedad con el dato que la produce.**
 *
 * Así que se guarda también **de qué lado estaba**. `pegadoAlSiguiente` es
 * cierto cuando el cursor está al principio de su contenedor —que es donde lo
 * deja Intro, en la línea nueva— y falso cuando está dentro o al final de un
 * texto, que es donde lo deja escribir.
 */
export type PosicionDelCursor = { donde: number; pegadoAlSiguiente: boolean };

/** Devuelve `null` si no hay cursor o si está fuera de la caja. */
export function dondeEstaElCursor(raiz: HTMLElement): PosicionDelCursor | null {
  const sel = raiz.ownerDocument.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const rango = sel.getRangeAt(0);
  if (!raiz.contains(rango.endContainer)) return null;
  const hastaAqui = rango.cloneRange();
  hastaAqui.selectNodeContents(raiz);
  hastaAqui.setEnd(rango.endContainer, rango.endOffset);
  return {
    donde: hastaAqui.toString().length,
    /* Al principio de un nodo de texto, o dentro de un ELEMENTO —que es como
       queda tras un Intro, dentro del bloque nuevo y todavía sin texto—, el
       cursor pertenece a lo que viene DESPUÉS. */
    pegadoAlSiguiente: rango.endContainer.nodeType !== 3 || rango.endOffset === 0,
  };
}

/**
 * Deja el cursor en esa posición. Si el texto encogió —porque el saneo retiró
 * algo— se queda al final del último texto, **dentro** de su bloque, y no
 * colgando de la raíz.
 */
export function ponerElCursor(raiz: HTMLElement, pos: PosicionDelCursor): void {
  const doc = raiz.ownerDocument;
  const sel = doc.getSelection();
  if (!sel) return;
  const donde = Math.max(0, pos.donde);
  const rango = doc.createRange();
  const poner = () => { rango.collapse(true); sel.removeAllRanges(); sel.addRange(rango); };
  const paseo = doc.createTreeWalker(raiz, 4 /* NodeFilter.SHOW_TEXT */);
  let visto = 0;
  let ultimo: Text | null = null;
  for (let nodo = paseo.nextNode() as Text | null; nodo; nodo = paseo.nextNode() as Text | null) {
    const fin = visto + nodo.data.length;
    if (fin > donde) {                      // dentro de este nodo: sin ambigüedad
      rango.setStart(nodo, donde - visto);
      poner();
      return;
    }
    if (fin === donde && !pos.pegadoAlSiguiente) {   // en la frontera, y del lado de atrás
      rango.setStart(nodo, nodo.data.length);
      poner();
      return;
    }
    visto = fin;
    ultimo = nodo;
  }
  /* No hay más texto. Si el cursor pertenecía a lo que viene después —Intro al
     final, donde lo único que sigue es un `<br>`— va al final del contenido,
     que es la línea nueva. Si no, al final del último texto: así una letra
     escrita al final de un párrafo se queda DENTRO del párrafo. */
  if (!pos.pegadoAlSiguiente && ultimo) {
    rango.setStart(ultimo, ultimo.data.length);
    poner();
    return;
  }
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
  const pos = teniaElFoco ? dondeEstaElCursor(raiz) : null;
  raiz.innerHTML = html;
  if (pos !== null) ponerElCursor(raiz, pos);
  return true;
}
