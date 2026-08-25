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
import { Icono } from './Icono';

export type InterruptorProps = {
  /**
   * R65 · Admite marcado, no solo texto. Era `string` y no se podía destacar
   * nada dentro: ni el nombre del privilegio, ni un dato del que depende.
   *
   * El nombre accesible **no se resiente**: sale de `aria-labelledby` apuntando
   * a este nodo, y el nombre accesible de un elemento se calcula de su subárbol
   * completo, así que un `<strong>` dentro se lee igual. Lo que NO cabe aquí es
   * un control —un enlace o un botón dentro de la etiqueta de un interruptor no
   * se puede alcanzar, porque el `<label>` se lleva el clic—.
   */
  etiqueta: React.ReactNode;
  ayuda?: React.ReactNode;
  activo: boolean;
  /** Obligatorio: un interruptor que no hace nada al instante no es esto. */
  onCambio: (activo: boolean) => void;
  deshabilitado?: boolean;
  /**
   * R66 · CERRADO POR REGLA — el motivo, y el motivo ES el estado.
   *
   * No es `deshabilitado`, y confundirlos tiene consecuencia. Deshabilitado se
   * lee como «ahora no, vuelve luego»: gris, apagado, temporal. Eso invita a
   * buscar la forma de encenderlo. Aquí el mensaje es el contrario — **no se va
   * a poder mientras la regla siga**—, y el caso que lo motiva es de seguridad:
   * quien reparte privilegios no puede conceder los que él mismo no tiene.
   *
   * Y no vale ocultarlo. Si el privilegio no aparece, quien reparte no entiende
   * por qué su lista no coincide con la de al lado.
   *
   * El interruptor **desaparece**: un control que no puede cambiar nunca no es
   * un interruptor. En su hueco va un candado, del mismo tamaño para que la
   * columna no baile. Se pasa el motivo, no un booleano, porque un candado sin
   * explicación se lee como un fallo del sistema.
   *
   * Manda sobre `deshabilitado`: lo permanente gana a lo temporal.
   */
  cerrado?: string;
};

export function Interruptor({
  etiqueta, ayuda, activo, onCambio, deshabilitado = false, cerrado,
}: InterruptorProps) {
  const id = useId();

  if (cerrado) {
    return (
      // No es <label>: no hay control que etiquetar. Y no lleva role ni
      // aria-disabled porque no es un control desactivado — es una fila de
      // texto que dice qué hay y por qué está cerrado. El lector lee el
      // rótulo y el motivo, que es toda la información que existe.
      <div className="sw-fila sw-cerrado">
        <span className="sw-candado">
          <Icono nombre="candado" tam="control" />
        </span>
        <span className="sw-txt">
          <span className="sw-et">{etiqueta}</span>
          <span className="sw-motivo">{cerrado}</span>
        </span>
      </div>
    );
  }

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

export type Opcion = {
  valor: string;
  texto: string;
  ayuda?: string;
  /**
   * R101 · La opción se ve, pero no se puede cambiar.
   *
   * Para lo que el grupo **necesita** y no es negociable — la columna que
   * identifica cada fila de una tabla, por ejemplo. Va con `ayuda`: una casilla
   * que no responde y no dice por qué se lee como una avería.
   *
   * Quien la use **no debe fiarse solo de esto**: `disabled` se quita desde el
   * inspector. La regla se aplica también donde se recibe el cambio. Lo uno
   * evita el gesto inútil; lo otro protege el dato.
   */
  deshabilitada?: boolean;
};

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
  const alternar = (v: string) => {
    if (opciones.find((o) => o.valor === v)?.deshabilitada) return;
    return modo === 'unica'
      ? onCambio([v])
      : onCambio(valores.includes(v) ? valores.filter((x) => x !== v) : [...valores, v]);
  };

  return (
    // fieldset y legend, no un div con texto: es lo que agrupa las casillas
    // para quien navega por formulario.
    <fieldset className="ms-grupo">
      <legend className="ms-leyenda">{titulo}</legend>
      {opciones.map((o) => {
        const idOp = `${id}-${o.valor}`;
        return (
          <label className={`ms-op${o.deshabilitada ? ' ms-op-fija' : ''}`} key={o.valor} htmlFor={idOp}>
            <input
              id={idOp}
              type={modo === 'unica' ? 'radio' : 'checkbox'}
              name={modo === 'unica' ? id : undefined}
              checked={valores.includes(o.valor)}
              disabled={o.deshabilitada}
              onChange={() => alternar(o.valor)}
              aria-describedby={o.ayuda ? `${idOp}-ayuda` : undefined}
            />
            <span >
              <span>{o.texto}</span>
              {o.ayuda && <span className="ms-ayuda" id={`${idOp}-ayuda`}>{o.ayuda}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
