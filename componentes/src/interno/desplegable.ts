/**
 * COMPORTAMIENTO DE UN DESPLEGABLE ANCLADO
 *
 * Abrir, cerrar al pulsar fuera, cerrar con Escape y **devolver el foco al
 * disparador**. Lo comparten el menú de usuario y los paneles de la barra, y
 * estaba escrito dos veces.
 *
 * Se saca aquí por la misma regla que el resto del sistema: dos copias de un
 * comportamiento divergen. La paginación ya lo demostró.
 *
 * INTERNO. No se exporta en el paquete: es la costura de dos componentes, no
 * una pieza que un proyecto deba usar. Si un proyecto necesita un desplegable,
 * lo pide y se le da un componente, no un gancho.
 */

import { useEffect, useRef, useState } from 'react';

/**
 * SOLO UNO ABIERTO A LA VEZ.
 *
 * Cada desplegable montado deja aquí su forma de cerrarse, y al abrir uno se
 * cierran los demás. Sin esto, abrir el menú de usuario y luego el de
 * notificaciones deja **los dos** encima del contenido, tapándose: se vio en
 * el cascarón con los tres de la barra.
 *
 * Y no era un fallo del catálogo. `MenuUsuario` y `PanelBarra` comparten este
 * gancho y ninguno sabía del otro, así que **cualquier proyecto que los ponga
 * juntos en la barra tenía lo mismo**. Por eso se arregla aquí y no allí.
 *
 * Un conjunto a nivel de módulo y no un contexto de React: dos desplegables
 * pueden vivir en árboles distintos —uno en la barra, otro en un diálogo— y
 * seguir siendo dos ventanas sobre la misma pantalla.
 */
const abiertos = new Set<() => void>();

/**
 * `alCerrar` — lo que el consumidor tenga que soltar al cerrarse, venga el
 * cierre de donde venga: de su propio Escape, de un clic fuera, o de que otro
 * desplegable se abriera. `RangoFecha` suelta ahi el dia sobrevolado, y sin
 * esto se quedaba medio mes pintado como «dentro del rango» sin nadie encima.
 */
export function usarDesplegable({ alCerrar }: { alCerrar?: () => void } = {}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);

  /* `alCerrar` se lee de un ref para que las escuchas no tengan que volver a
     registrarse cada vez que el consumidor le pase una funcion nueva. */
  const soltar = useRef(alCerrar);
  soltar.current = alCerrar;

  const cerrar = () => { setAbierto(false); soltar.current?.(); };

  // Se registra mientras está abierto, y se da de baja al cerrarse o al
  // desmontarse. Sin la baja, un componente muerto seguiría en el conjunto.
  useEffect(() => {
    if (!abierto) return;
    abiertos.add(cerrar);
    return () => { abiertos.delete(cerrar); };
  }, [abierto]);

  /** Abre este y cierra los demás. No alterna: es lo que llama `alternar`. */
  const abrir = () => {
    // Se cierran los otros ANTES de abrir este: al revés, el propio recién
    // registrado se cerraría a sí mismo.
    for (const cerrarOtro of abiertos) cerrarOtro();
    setAbierto(true);
  };

  /** Abre si está cerrado y cierra si está abierto. Es lo del botón. */
  const alternar = () => {
    if (abierto) { cerrar(); return; }
    abrir();
  };

  const cerrarYDevolverFoco = () => {
    cerrar();
    // El foco VUELVE al disparador. Cerrar y dejarlo en el limbo obliga a
    // tabular desde el principio de la página para volver a donde estabas.
    disparador.current?.focus();
  };

  /**
   * Y al cerrar POR UN CLIC FUERA no se devuelve: se lo quitaria al sitio donde
   * la persona acaba de pulsar. Salvo que ese sitio no sea enfocable y el foco
   * haya caido a `<body>`, que es el limbo del que hablaba el comentario de
   * arriba. Es la misma guarda que `Dialogo` tiene escrita desde la v1.107.0.
   */
  const cerrarPorClicFuera = () => {
    cerrar();
    const act = document.activeElement;
    if (!act || act === document.body || caja.current?.contains(act)) {
      disparador.current?.focus();
    }
  };

  useEffect(() => {
    if (!abierto) return;
    // Las dos, no una: sin Escape el desplegable atrapa a quien va con teclado,
    // y sin el clic fuera se queda abierto sobre el contenido.
    /* `pointerdown` y no `mousedown`: cubre tambien dedo y lapiz, y llega ANTES
       de que el navegador decida a quien dar el foco, asi que el cierre y el
       foco no se pelean. Con `click` se pelean. */
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) cerrarPorClicFuera();
    };
    /**
     * ESCAPE: SE IMPIDE EL DEFECTO, NO SE PARA LA PROPAGACION. La diferencia
     * costo un defecto real el 2026-09-13, en burbuja y en captura:
     *
     *  · `preventDefault()` SI. Dentro de un `Dialogo`, el `<dialog>` del
     *    navegador cierra con Escape por su cuenta; sin esto, una sola Escape
     *    cerraria la capa de dentro Y el dialogo entero. La de mas adentro
     *    primero, que es lo que cualquiera espera.
     *  · `stopPropagation()` NO, y menos en captura. Se probo asi en una
     *    version sin publicar y le ROBABA el Escape a las demas escuchas de
     *    `document` —el menu de usuario, los paneles de la barra, el selector
     *    con busqueda—: se cerraba la capa que la persona NO estaba usando y
     *    la que si seguia abierta. Cada desplegable cierra el suyo; nadie
     *    decide por los demas.
     */
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      cerrarYDevolverFoco();
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return { abierto, setAbierto, abrir, alternar, caja, disparador, cerrarYDevolverFoco, cerrarPorClicFuera };
}
