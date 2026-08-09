/**
 * CAMPO DE TEXTO Y SELECTOR
 *
 * Dos reglas del sistema que aquí son estructura, no consejo:
 *
 *   · LA ETIQUETA SIEMPRE VISIBLE. El placeholder es ejemplo de formato, nunca
 *     etiqueta: desaparece al escribir y con él la pregunta. Por eso `etiqueta`
 *     es obligatoria y `placeholder` opcional.
 *   · El error va JUNTO al campo y vinculado con `aria-describedby`. Un resumen
 *     arriba sin vínculo obliga a buscar cuál falló.
 */

import { useId } from 'react';

type Comun = {
  /** Obligatoria. Ver arriba: no se puede sustituir por el placeholder. */
  etiqueta: string;
  /** Ayuda permanente bajo el campo. */
  ayuda?: string;
  /** Mensaje de error. Marca el campo como inválido y lo vincula. */
  error?: string;
  /**
   * Oculta la etiqueta A LA VISTA, no al lector. Para cuando el sitio ya la
   * dice: el filtro que vive bajo la cabecera «Cargo» no necesita repetir
   * «Cargo» debajo.
   *
   * Sigue siendo obligatoria, y por eso esto NO es una puerta trasera para
   * quedarse sin etiqueta: es la diferencia entre no mostrarla y no tenerla.
   */
  etiquetaOculta?: boolean;
};

export type CampoProps = Comun & React.InputHTMLAttributes<HTMLInputElement> & {
  /**
   * Contenido propio EN LUGAR del `<input>` que trae dentro.
   *
   * El campo resuelve el 90 % de los casos con su control; el 10 % restante
   * —un control compuesto, dos que comparten rótulo, un dato que no es texto—
   * obligaba a elegir entre reconstruir el envoltorio o deformar el dato para
   * que cupiera. Las dos salidas eran malas y separaban el rótulo, la ayuda y
   * el error del sistema justo en ese sitio.
   *
   * Lo que recibe: el `id` que hay que poner en el control para que el rótulo
   * lo señale, y los `aria-describedby` de la ayuda y el error ya calculados.
   * Poniéndolos, el envoltorio sigue siendo el mismo para el lector de
   * pantalla. Lo pidió Control Administrativos V2.0.
   */
  children?: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => React.ReactNode;
};

export function Campo({ etiqueta, ayuda, error, etiquetaOculta = false, className = '', children, ...resto }: CampoProps) {
  const id = useId();
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descrito = [idError, idAyuda].filter(Boolean).join(' ') || undefined;

  return (
    <div className="campo-grupo">
      <label
        className={['campo-etiqueta', etiquetaOculta ? 'sr-solo' : ''].filter(Boolean).join(' ')}
        htmlFor={id}
      >
        {etiqueta}
      </label>
      {children ? (
        children({ id, 'aria-describedby': descrito, 'aria-invalid': error ? true : undefined })
      ) : (
        <input
          id={id}
          className={['campo', error ? 'campo-mal' : '', className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={descrito}
          {...resto}
        />
      )}
      {/* El error va PRIMERO en el orden de lectura: es lo que hay que resolver. */}
      {error && <span id={idError} className="campo-error">{error}</span>}
      {ayuda && <span id={idAyuda} className="campo-ayuda">{ayuda}</span>}
    </div>
  );
}

export type SelectorProps = Comun & React.SelectHTMLAttributes<HTMLSelectElement> & {
  opciones: { valor: string; texto: string }[];
  /** Texto de la opción vacía. Si no se pasa, no hay opción vacía y el selector
   *  arranca con la primera ya elegida —que es una elección que nadie hizo—. */
  vacio?: string;
};

export function Selector({ etiqueta, ayuda, error, opciones, vacio, etiquetaOculta = false, className = '', ...resto }: SelectorProps) {
  const id = useId();
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descrito = [idError, idAyuda].filter(Boolean).join(' ') || undefined;

  return (
    <div className="campo-grupo">
      <label
        className={['campo-etiqueta', etiquetaOculta ? 'sr-solo' : ''].filter(Boolean).join(' ')}
        htmlFor={id}
      >
        {etiqueta}
      </label>
      <select
        id={id}
        className={['campo', error ? 'campo-mal' : '', className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={descrito}
        {...resto}
      >
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
      {error && <span id={idError} className="campo-error">{error}</span>}
      {ayuda && <span id={idAyuda} className="campo-ayuda">{ayuda}</span>}
    </div>
  );
}
