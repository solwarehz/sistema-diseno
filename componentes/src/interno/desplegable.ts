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

export function usarDesplegable() {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);

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

  return { abierto, setAbierto, caja, disparador, cerrarYDevolverFoco };
}
