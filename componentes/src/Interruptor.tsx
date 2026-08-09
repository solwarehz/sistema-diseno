/**
 * INTERRUPTOR Y SELECCIÓN MÚLTIPLE
 *
 * El interruptor SURTE EFECTO AL INSTANTE. Si hace falta pulsar «Guardar»
 * después, no es un interruptor: es una casilla dentro de un formulario. Por
 * eso `onCambio` no es opcional.
 *
 * El nombre accesible va con `aria-labelledby`. Envolver en <label> NO nombra a
 * un <button>: HTML-AAM lo calcula desde aria-labelledby, aria-label, su
 * subárbol o title, y <label> no entra en esa lista. Los ocho interruptores del
 * catálogo se anunciaban como «interruptor, activado» sin decir qué controlan.
 */

import { useId } from 'react';

export type InterruptorProps = {
  etiqueta: string;
  ayuda?: string;
  activo: boolean;
  /** Obligatorio: un interruptor que no hace nada al instante no es esto. */
  onCambio: (activo: boolean) => void;
  deshabilitado?: boolean;
};

export function Interruptor({ etiqueta, ayuda, activo, onCambio, deshabilitado = false }: InterruptorProps) {
  const id = useId();
  return (
    <label className={`sw-fila${deshabilitado ? ' sw-desh' : ''}`}>
      <button
        type="button"
        role="switch"
        className="sw"
        aria-checked={activo}
        aria-labelledby={`${id}-et`}
        // aria-disabled y no `disabled`: deshabilitado nativo sale del orden de
        // tabulación y su estado se vuelve indescubrible con teclado.
        aria-disabled={deshabilitado || undefined}
        onClick={() => !deshabilitado && onCambio(!activo)}
      >
        <span className="sw-bolita" />
      </button>
      <span className="sw-txt">
        <span className="sw-et" id={`${id}-et`}>{etiqueta}</span>
        {ayuda && <span className="sw-ayuda">{ayuda}</span>}
      </span>
    </label>
  );
}

export type Opcion = { valor: string; texto: string; ayuda?: string };

export type SeleccionMultipleProps = {
  /** El nombre del grupo. Va al fieldset: sin él, las casillas son sueltas. */
  titulo: string;
  opciones: Opcion[];
  valores: string[];
  onCambio: (valores: string[]) => void;
  /** `unica` usa botones de opción: una sola respuesta y no se puede desmarcar. */
  modo?: 'varias' | 'unica';
};

export function SeleccionMultiple({
  titulo,
  opciones,
  valores,
  onCambio,
  modo = 'varias',
}: SeleccionMultipleProps) {
  const id = useId();
  const alternar = (v: string) =>
    modo === 'unica'
      ? onCambio([v])
      : onCambio(valores.includes(v) ? valores.filter((x) => x !== v) : [...valores, v]);

  return (
    // fieldset y legend, no un div con texto: es lo que agrupa las casillas
    // para quien navega por formulario.
    <fieldset className="ms">
      <legend className="ms-titulo">{titulo}</legend>
      {opciones.map((o) => {
        const idOp = `${id}-${o.valor}`;
        return (
          <label className="ms-op" key={o.valor} htmlFor={idOp}>
            <input
              id={idOp}
              type={modo === 'unica' ? 'radio' : 'checkbox'}
              name={modo === 'unica' ? id : undefined}
              checked={valores.includes(o.valor)}
              onChange={() => alternar(o.valor)}
              aria-describedby={o.ayuda ? `${idOp}-ayuda` : undefined}
            />
            <span className="ms-txt">
              <span>{o.texto}</span>
              {o.ayuda && <span className="ms-ayuda" id={`${idOp}-ayuda`}>{o.ayuda}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
