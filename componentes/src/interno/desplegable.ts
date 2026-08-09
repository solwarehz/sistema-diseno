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

export function usarDesplegable() {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);

  const cerrar = () => setAbierto(false);

  // Se registra mientras está abierto, y se da de baja al cerrarse o al
  // desmontarse. Sin la baja, un componente muerto seguiría en el conjunto.
  useEffect(() => {
    if (!abierto) return;
    abiertos.add(cerrar);
    return () => { abiertos.delete(cerrar); };
  }, [abierto]);

  /** Abre este y cierra los demás. Es lo que hay que llamar desde el botón. */
  const alternar = () => {
    setAbierto((v) => {
      if (v) return false;
      // Se cierran los otros ANTES de abrir este: al revés, el propio recién
      // registrado se cerraría a sí mismo.
      for (const cerrarOtro of abiertos) cerrarOtro();
      return true;
    });
  };

  const cerrarYDevolverFoco = () => {
    setAbierto(false);
    // El foco VUELVE al disparador. Cerrar y dejarlo en el limbo obliga a
    // tabular desde el principio de la página para volver a donde estabas.
    disparador.current?.focus();
  };

  useEffect(() => {
    if (!abierto) return;
    // Las dos, no una: sin Escape el desplegable atrapa a quien va con teclado,
    // y sin el clic fuera se queda abierto sobre el contenido.
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrarYDevolverFoco();
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return { abierto, setAbierto, alternar, caja, disparador, cerrarYDevolverFoco };
}
