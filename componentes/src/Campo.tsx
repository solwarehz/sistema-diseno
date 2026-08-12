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
import { Icono } from './Icono';

type Comun = {
  /** Obligatoria. Ver arriba: no se puede sustituir por el placeholder. */
  etiqueta: string;
  /**
   * Ayuda permanente bajo el campo.
   *
   * Admite nodos, no solo texto, porque `AreaTexto` cuelga ahí su contador de
   * caracteres: así el contador entra en el `aria-describedby` que este
   * envoltorio ya calcula, en vez de quedarse fuera y no anunciarse.
   */
  ayuda?: React.ReactNode;
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

// `Omit<…, 'children'>`: los atributos de input traen SU children (ReactNode)
// y la intersección volvía inutilizable el render-prop — nadie lo había
// consumido hasta CampoContrasena y el tipo llevaba el defecto dormido.
export type CampoProps = Comun & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> & {
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
          // El trim AL SALIR es del componente: mientras se teclea no se toca
          // nada (la persona ve lo que escribe), y al abandonar el campo el
          // espacio accidental —el copy-paste con cola— se recorta y se emite
          // por onChange para que el estado del producto se entere. Solo los
          // extremos: los espacios internos son contenido. Y a un password,
          // JAMÁS: ahí el espacio puede ser deliberado.
          onBlur={(e) => {
            const caja = e.target;
            if (caja.type !== 'password') {
              const limpio = caja.value.trim();
              if (limpio !== caja.value) {
                caja.value = limpio;
                resto.onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>);
              }
            }
            resto.onBlur?.(e);
          }}
        />
      )}
      {/* El error va PRIMERO en el orden de lectura: es lo que hay que resolver. */}
      {error && (
        /* R53 · el error lleva SU ICONO, como en el catalogo: un renglon rojo
           suelto se confunde con una ayuda, y el color no basta (SC 1.4.1). */
        <span id={idError} className="campo-error"><Icono nombre="alerta" />{error}</span>
      )}
      {ayuda && <span id={idAyuda} className="campo-ayuda">{ayuda}</span>}
    </div>
  );
}

export type SelectorProps = Comun & React.SelectHTMLAttributes<HTMLSelectElement> & {
  opciones: { valor: string; texto: string }[];
  /** Texto de la opción vacía. Si no se pasa, no hay opción vacía y el selector
   *  arranca con la primera ya elegida —que es una elección que nadie hizo—. */
  vacio?: string;
  /**
   * R54 · SOLO LECTURA: se ve, se lee, se enfoca… y no se cambia.
   *
   * Lo pidió el responsable para el selector de documento **mientras se
   * consulta a la API**: cambiar el tipo a mitad de la consulta tira el
   * resultado que se estaba esperando.
   *
   * **No es `disabled`, y la diferencia importa.** Deshabilitado dice «esto no
   * es para ti», se sale del recorrido del tabulador y **el navegador no lo
   * envía con el formulario** — justo el dato que aquí hay que conservar. Solo
   * lectura dice «esto es un dato, ahora no se toca»: sigue enfocable, sigue
   * leyéndose y sigue viajando.
   *
   * **HTML no tiene `readonly` para `<select>`** —solo para `input` y
   * `textarea`—, así que aquí se construye: `aria-readonly` para que el lector
   * lo anuncie, y el bloqueo real de lo que abre o cambia la lista. Decirlo
   * importa: no es un atributo que el navegador respete solo.
   */
  soloLectura?: boolean;
};

export function Selector({ etiqueta, ayuda, error, opciones, vacio, etiquetaOculta = false, soloLectura = false, className = '', ...resto }: SelectorProps) {
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
        /* R54 · lo que hace de `readonly` en un elemento que no lo tiene. Los
           manejadores van DESPUÉS del spread a propósito: si fueran antes, un
           `onChange` del producto los pisaría y el selector volvería a cambiar
           en mitad de la consulta. */
        aria-readonly={soloLectura || undefined}
        data-solo-lectura={soloLectura || undefined}
        /* Sin esto la lista se abre igual y se elige con el ratón. */
        onMouseDown={soloLectura ? (e) => e.preventDefault() : resto.onMouseDown}
        /* Con teclado un `<select>` cambia con flechas, letras y espacio. Se
           dejan pasar Tab y Escape: salir nunca se bloquea. */
        onKeyDown={soloLectura
          ? (e) => { if (e.key !== 'Tab' && e.key !== 'Escape') e.preventDefault(); }
          : resto.onKeyDown}
        onChange={soloLectura ? undefined : resto.onChange}
      >
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
      {error && (
        /* R53 · el error lleva SU ICONO, como en el catalogo: un renglon rojo
           suelto se confunde con una ayuda, y el color no basta (SC 1.4.1). */
        <span id={idError} className="campo-error"><Icono nombre="alerta" />{error}</span>
      )}
      {ayuda && <span id={idAyuda} className="campo-ayuda">{ayuda}</span>}
    </div>
  );
}
