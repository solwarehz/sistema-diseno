/**
 * ÁREA DE TEXTO — R44
 *
 * El campo de varias líneas: observaciones, motivo de una baja, descripción de
 * una incidencia. No es un `Campo` más alto; se comporta distinto en tres
 * cosas, y esas tres son la razón de que exista.
 *
 * SE COMPONE, no se reconstruye: el envoltorio —rótulo, ayuda, error y los
 * `aria-describedby` que los enlazan— es `Campo` con su ranura de contenido
 * propio. Aquí dentro solo vive lo que un `<textarea>` necesita y un `<input>`
 * no.
 *
 * LAS TRES DIFERENCIAS:
 *
 *   1 · CRECE CON LO ESCRITO. Un cuadro de cuatro líneas para un texto de doce
 *       obliga a redactar mirando por una rendija. Crece hasta un tope y a
 *       partir de ahí se desplaza — sin tope, el botón de guardar acaba fuera
 *       de la pantalla.
 *
 *       Se hace con CSS, no moviendo la altura desde JavaScript: la rejilla
 *       lleva una copia invisible del texto en `::after` y el cuadro ocupa la
 *       misma celda. Escribir la altura a mano exigiría el atributo `style`,
 *       que el candado prohíbe (§2.5.6), y con razón.
 *
 *   2 · EL LÍMITE ES BLANDO. `maxlength` corta al pegar, en silencio y sin
 *       deshacer: se pega un párrafo, entra media frase, y nadie se entera
 *       hasta que lo lee el destinatario. Aquí se deja pasar, se marca
 *       inválido y se dice cuánto sobra. Bloquear el envío es del producto,
 *       que es quien sabe si ese texto se puede guardar a medias.
 *
 *   3 · EL CONTADOR SE ANUNCIA SOLO CUANDO IMPORTA. En el
 *       `aria-describedby` está siempre —se lee al entrar al campo—, pero la
 *       región viva solo habla en el último tramo y al pasarse. Un contador
 *       que dicta un número por cada tecla no informa: tapa lo que se escribe.
 *
 * EL RECORTE AL SALIR es el mismo de `Campo` y por la misma razón: el
 * copy-paste con cola. Solo los extremos — los saltos de línea de dentro son
 * el texto, no basura.
 */

import { useState } from 'react';
import { Campo } from './Campo';

export type AreaTextoProps =
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows' | 'children'> & {
    /** Obligatoria y siempre visible: el placeholder es ejemplo de formato,
     *  nunca rótulo. La misma regla que `Campo`, por la misma razón. */
    etiqueta: string;
    ayuda?: React.ReactNode;
    error?: string;
    /** Oculta el rótulo a la vista, no al lector. No es quedarse sin él. */
    etiquetaOculta?: boolean;
    /** Altura MÍNIMA en líneas. Crece sola por encima. */
    filas?: number;
    /** Límite blando de caracteres. Enciende el contador. Ver arriba: no corta. */
    maximo?: number;
    /** Apagarlo deja el cuadro fijo en `filas`. Para una rejilla donde todos
     *  los campos tienen que medir lo mismo. */
    autoCrecer?: boolean;
  };

/** Cuando quedan estos o menos, el contador avisa y la región viva habla. */
const AVISO = 20;

export function AreaTexto({
  etiqueta,
  ayuda,
  error,
  etiquetaOculta = false,
  filas = 4,
  maximo,
  autoCrecer = true,
  className = '',
  value,
  defaultValue,
  onChange,
  onBlur,
  ...resto
}: AreaTextoProps) {
  // La copia que hace crecer la rejilla. Con `value` manda el producto; sin
  // él, este estado es lo único que sabe cuánto se ha escrito.
  const [escrito, setEscrito] = useState(String(defaultValue ?? ''));
  const texto = value !== undefined ? String(value) : escrito;

  const quedan = maximo === undefined ? null : maximo - [...texto].length;
  const pasado = quedan !== null && quedan < 0;
  const cerca = quedan !== null && quedan >= 0 && quedan <= AVISO;

  const contador = quedan === null ? null : (
    <span className={['ta-cuenta', pasado ? 'ta-cuenta-mal' : ''].filter(Boolean).join(' ')}>
      {pasado ? `${-quedan} de más` : `${quedan} restantes`}
    </span>
  );

  const pie = contador && (
    <span className="ta-pie">
      <span>{ayuda}</span>
      {contador}
    </span>
  );

  // El error del producto manda; el del límite aparece solo si no hay otro.
  const elError = error ?? (pasado
    ? `El texto se pasa por ${-quedan!} ${-quedan! === 1 ? 'carácter' : 'caracteres'}. Acórtalo antes de guardar.`
    : undefined);

  return (
    <Campo
      etiqueta={etiqueta}
      etiquetaOculta={etiquetaOculta}
      error={elError}
      ayuda={pie ?? ayuda}
    >
      {(props) => (
        <>
          {/* La rejilla y la copia invisible: ver la diferencia 1 de arriba.
              Sin `autoCrecer` no hay envoltorio que estorbe, solo el cuadro. */}
          <div
            className={autoCrecer ? 'ta-crece' : 'ta-fija'}
            data-replica={autoCrecer ? texto : undefined}
          >
            <textarea
              {...props}
              className={['campo', 'ta', elError ? 'campo-mal' : '', className].filter(Boolean).join(' ')}
              rows={filas}
              value={value}
              defaultValue={defaultValue}
              {...resto}
              onChange={(e) => {
                if (value === undefined) setEscrito(e.target.value);
                onChange?.(e);
              }}
              onBlur={(e) => {
                const caja = e.target;
                const limpio = caja.value.trim();
                if (limpio !== caja.value) {
                  caja.value = limpio;
                  if (value === undefined) setEscrito(limpio);
                  onChange?.(e as unknown as React.ChangeEvent<HTMLTextAreaElement>);
                }
                onBlur?.(e);
              }}
            />
          </div>
          {/* Solo habla en el último tramo. Ver la diferencia 3. */}
          <span className="sr-solo" role="status" aria-live="polite">
            {pasado ? `Te pasas por ${-quedan!}` : cerca ? `Quedan ${quedan}` : ''}
          </span>
        </>
      )}
    </Campo>
  );
}
