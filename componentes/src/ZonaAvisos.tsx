/**
 * ZONA DE AVISOS — R29 (Control Administrativos, 2026-08-10)
 *
 * Dónde viven los avisos temporales. El `Aviso` estaba publicado; su zona no,
 * y cada producto la reescribía perdiendo justo lo que no es de estilo:
 *
 *   · La región viva existe DESDE LA CARGA, aunque esté vacía. Una región
 *     creada en el momento del fallo no la anuncian la mayoría de lectores
 *     de pantalla: anuncian cambios DENTRO de regiones que ya conocían.
 *   · Son DOS regiones hermanas, no una: `role="alert"` para el error, que
 *     interrumpe, y `role="status"` para el resto, que espera turno. Un
 *     alert dentro de una región polite se comporta distinto en cada lector
 *     — la advertencia lleva escrita en `Aviso` desde su creación, y esta
 *     zona es su consecuencia.
 *
 * Los `Aviso` de dentro NO repiten rol: la zona se lo quita por contexto y
 * el anuncio lo hace la región. Un `Aviso` suelto, fuera de la zona,
 * conserva el suyo y sigue funcionando como siempre.
 *
 * El anclaje (arriba a la derecha, columna, y a todo el ancho en pantalla
 * estrecha) viene de `componentes.css`, clases `.av-zona` y `.av-grupo`.
 * Cuántos avisos caben a la vez es del producto; el cascarón muestra el
 * criterio de referencia: tres, y el cuarto expulsa al más antiguo que no
 * sea un error.
 */

import { createContext, isValidElement, Children } from 'react';

/** Verdadero dentro de la zona: el Aviso lo lee para no repetir el rol. */
export const EnZonaAvisos = createContext(false);

export type ZonaAvisosProps = {
  /** Los `Aviso` visibles. La zona los reparte: `tono="error"` a la región
   *  que interrumpe, el resto a la que espera turno. */
  children?: React.ReactNode;
};

export function ZonaAvisos({ children }: ZonaAvisosProps) {
  const todos = Children.toArray(children);
  const esError = (h: unknown) =>
    isValidElement(h) && (h.props as { tono?: string }).tono === 'error';
  const errores = todos.filter(esError);
  const resto = todos.filter((h) => !esError(h));

  return (
    <div className="av-zona">
      <EnZonaAvisos.Provider value={true}>
        {/* Los errores arriba: persisten y piden acción; los demás caducan. */}
        <div className="av-grupo" role="alert">{errores}</div>
        <div className="av-grupo" role="status">{resto}</div>
      </EnZonaAvisos.Provider>
    </div>
  );
}
