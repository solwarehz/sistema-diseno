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
  /**
   * Acción principal del pie. Sin ella, el pie solo lleva «Cerrar».
   *
   * `deshabilitada` la deja **a la vista y apagada**, que no es lo mismo que
   * no pasarla: un botón que aparece y desaparece según lo que haya dentro
   * mueve el pie bajo el ratón y obliga a adivinar qué falta. Apagado se ve
   * que existe y que todavía no se puede.
   */
  accion?: {
    texto: string;
    onClick: () => void | Promise<unknown>;
    destructiva?: boolean;
    deshabilitada?: boolean;
    /**
     * R118 · EL GERUNDIO MIENTRAS TRABAJA — «Grabando…».
     *
     * `Boton` lo resolvió hace versiones y este diálogo no lo dejaba pasar:
     * `onClick` llegaba solo, así que el doble envío SÍ estaba protegido —el
     * botón espera la promesa— pero el botón **enmudecía**: se apagaba sin
     * decir por qué. Lo reportó Control Administrativos, cuya regla de producto
     * no admite excepciones: toda acción contra el servidor dice gerundio,
     * queda deshabilitada y no se dispara dos veces.
     *
     * No se inventa nada aquí: se expone lo que `Boton` ya hace, incluido que
     * reserva el ancho del texto más largo para que el botón no baile.
     */
    textoOcupado?: React.ReactNode;
    /**
     * Fuerza el estado ocupado. **Casi nunca hace falta**, y esta por la misma
     * razon que esta en `Boton`: la proteccion automatica del doble envio se
     * apoya en que `onClick` DEVUELVA la promesa. Si la accion hace el `fetch`
     * sin `return` —que el tipo `() => void | Promise<unknown>` permite y nada
     * avisa—, no hay gerundio, ni bloqueo, ni proteccion: tres clics llaman
     * tres veces. Medido el 2026-09-11.
     *
     * Lo primero es devolver la promesa. Cuando el estado vive fuera y no se
     * puede, esta es la salida, y hasta la v1.107.0 el dialogo no la dejaba
     * pasar aunque `Boton` la tuviera.
     */
    ocupado?: boolean;
  };
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
  const estabaAbierto = useRef(false);

  /**
   * DEVOLVER EL FOCO SIN ROBARLO. Tres intentos hicieron falta y los tres
   * fallos están medidos (2026-09-11), así que quedan escritos:
   *
   *  1 · En `cerrar()`: no cubría el cierre PROGRAMÁTICO —el proyecto pone
   *      `abierto={false}` cuando la acción sale bien, que es lo que el
   *      contrato le obliga a hacer—, y el foco se quedaba en el `<h2>` de un
   *      diálogo ya cerrado. Además enfocaba con el diálogo todavía abierto, y
   *      `showModal()` hace inerte todo lo de fuera.
   *  2 · Solo en el efecto: cubría los cuatro caminos, pero se perdía si el
   *      proyecto DESMONTA el diálogo al cerrar —`{abierto && <Dialogo …/>}`,
   *      que es habitual—, porque el efecto ya no llega a correr. Y ROBABA el
   *      foco en el camino programático, que es justo donde el proyecto suele
   *      colocarlo él (la fila recién creada).
   *  3 · Esto: en el efecto Y en la limpieza, y **solo si nadie se lo ha
   *      llevado**. Si el foco sigue dentro del diálogo o se cayó a `<body>`,
   *      está perdido y se devuelve. Si está en otro sitio, lo puso alguien a
   *      propósito y no se toca.
   */
  const devolverFoco = () => {
    const act = document.activeElement;
    const perdido = !act || act === document.body || !!dlg.current?.contains(act);
    if (perdido) origen.current?.focus();
  };

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;

    if (abierto && !el.open) {
      estabaAbierto.current = true;
      // `showModal` y no `show`: solo el primero hace inerte el resto de la
      // página. Con `show`, el foco se pasea por detrás del diálogo.
      el.showModal();
      // El foco entra en el TÍTULO y no en el primer control: así lo primero
      // que se oye es qué es esto, y no «campo de texto» sin contexto.
      primero.current?.focus();
    } else if (!abierto && el.open) {
      el.close();
      // LA DEVOLUCION DEL FOCO VIVE AQUI desde la v1.107.0, y antes vivia en
      // `cerrar()`. Dos motivos, los dos medidos el 2026-09-11:
      //
      //  1 · `cerrar()` solo corre por los caminos que pasan por el pie o por
      //      Escape. El CUARTO camino —el proyecto pone `abierto={false}`
      //      cuando la accion termina bien, que es lo que la regla 7 le obliga
      //      a hacer y el cierre mas frecuente en produccion— no pasaba por
      //      ahi, y el foco se quedaba en el `<h2>` de un dialogo ya cerrado.
      //  2 · `cerrar()` enfocaba el origen con el dialogo TODAVIA abierto, y
      //      `showModal()` hace inerte todo lo de fuera. En jsdom eso no
      //      existe y la prueba salia verde; en un navegador de verdad el
      //      foco a un elemento inerte puede ignorarse. Aqui el dialogo ya
      //      esta cerrado, asi que no hay nada inerte.
      estabaAbierto.current = false;
      devolverFoco();
    }
  }, [abierto]);

  // Y si el proyecto desmonta el diálogo al cerrarlo, el efecto de arriba no
  // llega a correr. `origen` vive FUERA del diálogo, así que sigue vivo aquí.
  //
  // EL RODEO DEL MODO ESTRICTO, que no es opcional. React en modo estricto
  // —activado por omisión en Vite, CRA y Next— monta, LIMPIA y vuelve a
  // montar. La primera versión de esto devolvía el foco en esa limpieza falsa:
  // el título acababa de recibirlo, estaba dentro del diálogo, así que contaba
  // como «perdido» y se lo llevaba al origen — y el efecto recreado ya veía
  // `el.open === true`, no entraba en ninguna rama y no lo devolvía. Resultado:
  // el diálogo abierto y el foco FUERA, que es justo lo que la regla 3 prohíbe.
  //
  // Se aplaza la devolución un turno y se cancela si el componente vuelve a
  // montarse. Es el mismo rodeo que `Boton` tiene documentado para `vivo`, y
  // por el mismo motivo: en modo estricto una limpieza no significa adiós.
  const desmontado = useRef(false);
  useEffect(() => {
    desmontado.current = false;
    return () => {
      desmontado.current = true;
      if (!estabaAbierto.current) return;
      queueMicrotask(() => { if (desmontado.current) devolverFoco(); });
    };
  }, []);

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
    // Solo avisa. El foco lo devuelve el efecto de arriba, que es el unico
    // sitio por el que pasan LOS CUATRO caminos de cierre.
    onCerrar();
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
      {/* El clic se detiene aquí. OJO, y se midió el 2026-09-11: esto NO es lo
          único que impide que pulsar dentro cuente como pulsar el fondo — la
          guarda `e.target === dlg.current` de arriba ya lo impide ella sola.
          Son dos mecanismos redundantes y cada uno basta; quitar cualquiera de
          los dos deja la prueba en verde. Se conserva porque también corta el
          clic antes de cualquier manejador que el proyecto ponga por encima del
          diálogo, que la guarda no cubre. */}
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
              // AQUI HUBO UNA `key` QUE REMONTABA EL BOTON AL CERRAR, y se
              // retiro antes de publicar. Lo que perseguia era real: el estado
              // «en vuelo» vive dentro de `Boton` y el dialogo no desmonta a
              // sus hijos al cerrar, asi que una promesa que no se resuelve
              // NUNCA —un `fetch` abortado— dejaba el boton ocupado tambien al
              // reabrir. Pero el remedio era peor: con el boton remontado
              // limpio, abrir-Guardar-Cancelar-abrir-Guardar disparaba la
              // accion DOS VECES con la primera todavia en vuelo. Medido el
              // 2026-09-11. Un boton bloqueado se recupera recargando; una
              // segunda escritura en el servidor, no.
              //
              // Conservar el estado es ademas lo correcto: la accion SIGUE
              // viajando, y en cuanto su promesa se resuelve o falla el boton
              // se libera solo, con el dialogo abierto o cerrado.
              variante={accion.destructiva ? 'destructiva' : 'principal'}
              disabled={accion.deshabilitada}
              textoOcupado={accion.textoOcupado}
              ocupado={accion.ocupado}
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
