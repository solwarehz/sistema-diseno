/**
 * DIÁLOGO MODAL
 *
 * §7 del manual del repositorio dice que el sistema acepta primitiva accesible
 * para **exactamente tres casos: diálogo, menú y selector con búsqueda**. Los
 * otros dos existían y este no, así que el sistema pedía algo que no daba.
 *
 * CUÁNDO NO USARLO, que importa más que cómo usarlo. Para confirmar una acción
 * está `Confirmacion`, que es una banda en línea y no tapa. El sistema prefiere
 * lo que no interrumpe: un diálogo detiene la tarea entera, y eso solo se
 * justifica cuando lo que hay dentro ES la tarea —un formulario que no cabe en
 * la fila, elegir entre opciones que hay que ver juntas—.
 *
 * Se apoya en `<dialog>` del navegador, que resuelve por sí solo tres cosas que
 * a mano salen mal casi siempre:
 *
 *   · el foco no se escapa detrás —`showModal()` hace inerte el resto—
 *   · Escape cierra, sin escribir un manejador
 *   · queda en la capa superior, por encima de cualquier `z-index`
 *
 * Lo que sí hay que poner a mano, y está puesto:
 *
 *   · el foco ENTRA en el diálogo, no se queda fuera
 *   · el foco VUELVE al elemento que lo abrió al cerrar, pase lo que pase
 *   · pulsar el fondo cierra —opcional, y desactivable cuando hay datos sin
 *     guardar: cerrar sin querer y perder lo escrito es peor que un clic de más
 */

import { useEffect, useId, useRef } from 'react';
import { Boton } from './Boton';

export type DialogoProps = {
  abierto: boolean;
  /** Qué es esto, en una frase. Es el nombre accesible del diálogo. */
  titulo: string;
  onCerrar: () => void;
  /**
   * El elemento que lo abrió. El foco vuelve aquí al cerrar.
   *
   * Es obligatorio por la misma razón que en `Confirmacion`: sin él, cerrar
   * deja el foco en `<body>` y quien navega con teclado tiene que tabular
   * desde el principio de la página para volver a donde estaba.
   */
  origen: React.RefObject<HTMLElement>;
  /** Acción principal del pie. Sin ella, el pie solo lleva «Cerrar». */
  accion?: { texto: string; onClick: () => void | Promise<unknown>; destructiva?: boolean };
  /** Texto del botón que cierra. «Cancelar» cuando hay acción; si no, «Cerrar». */
  textoCerrar?: string;
  /**
   * Pulsar el fondo cierra. **Desactívalo cuando haya datos sin guardar:**
   * perder lo escrito por un clic fuera es peor que un clic de más.
   */
  cerrarAlPulsarFuera?: boolean;
  children: React.ReactNode;
};

export function Dialogo({
  abierto,
  titulo,
  onCerrar,
  origen,
  accion,
  textoCerrar,
  cerrarAlPulsarFuera = true,
  children,
}: DialogoProps) {
  const id = useId();
  const dlg = useRef<HTMLDialogElement>(null);
  const primero = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;

    if (abierto && !el.open) {
      // `showModal` y no `show`: solo el primero hace inerte el resto de la
      // página. Con `show`, el foco se pasea por detrás del diálogo.
      el.showModal();
      // El foco entra en el TÍTULO y no en el primer control: así lo primero
      // que se oye es qué es esto, y no «campo de texto» sin contexto.
      primero.current?.focus();
    } else if (!abierto && el.open) {
      el.close();
    }
  }, [abierto]);

  // Escape lo cierra el navegador solo, pero avisando por `cancel`: sin esto
  // el diálogo se cerraría y el proyecto seguiría creyéndolo abierto.
  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    const alCancelar = (e: Event) => { e.preventDefault(); cerrar(); };
    el.addEventListener('cancel', alCancelar);
    return () => el.removeEventListener('cancel', alCancelar);
  });

  function cerrar() {
    onCerrar();
    // La devolución del foco va aquí y no en un efecto de desmontaje: en el
    // desmontaje el elemento de origen puede haberse ido ya.
    origen.current?.focus();
  }

  return (
    <dialog
      ref={dlg}
      className="dialogo"
      aria-labelledby={`${id}-tit`}
      onClick={
        cerrarAlPulsarFuera
          ? (e) => { if (e.target === dlg.current) cerrar(); }
          : undefined
      }
    >
      {/* El clic se detiene aquí: sin esto, pulsar DENTRO del diálogo también
          contaría como pulsar el fondo, porque el evento sube. */}
      <div className="dialogo-caja" onClick={(e) => e.stopPropagation()}>
        <div className="dialogo-cab">
          {/* `tabIndex={-1}` para poder enfocarlo sin meterlo en el recorrido
              del tabulador: se enfoca al abrir, no al tabular. */}
          <h2 className="dialogo-tit" id={`${id}-tit`} ref={primero} tabIndex={-1}>
            {titulo}
          </h2>
        </div>

        <div className="dialogo-cuerpo">{children}</div>

        {/* CANCELAR A LA IZQUIERDA Y LA ACCIÓN A LA DERECHA. No es estética: es
            el orden que el catálogo documenta y el que la gente ya tiene
            aprendido. Invertirlo hace que se pulse el que no era. */}
        <div className="dialogo-pie">
          <Boton variante="neutra" onClick={cerrar}>
            {textoCerrar ?? (accion ? 'Cancelar' : 'Cerrar')}
          </Boton>
          {accion && (
            <Boton
              variante={accion.destructiva ? 'destructiva' : 'principal'}
              onClick={accion.onClick}
            >
              {accion.texto}
            </Boton>
          )}
        </div>
      </div>
    </dialog>
  );
}
