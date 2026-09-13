/**
 * EL PIE DE UN CAMPO QUE CUENTA: el contador, su anuncio y el error del tope.
 *
 * Estaba escrito **dos veces** —en `AreaTexto` y copiado en `EditorTexto`— y
 * ya había divergido en dos puntos cuando lo cazó una auditoría el 2026-09-13:
 *
 *   · `EditorTexto` pintaba `.ta-pie` con `ayuda` y sin `maximo`, así que salía
 *     un contenedor `space-between` con un solo hijo, que `AreaTexto` no pone.
 *   · Y no copió **el anuncio al lector**: pasado el tope, la región viva de
 *     `AreaTexto` dice «Te pasas por N» y la del editor medía `""`. Quien usa
 *     lector no se enteraba de que el documento no se puede guardar.
 *
 * Es el punto 1 de `POLITICA-DE-CREACION.md`: se usan los componentes ya
 * creados. Dos copias de un comportamiento divergen — y éstas ya lo habían
 * hecho antes de publicarse.
 *
 * INTERNO. No se exporta en el paquete: es la costura de dos componentes.
 */

/** A partir de cuántos restantes se empieza a avisar al lector. */
const AVISO = 20;

export function usarContador(
  texto: string,
  maximo: number | undefined,
  ayuda: React.ReactNode,
  errorDelProducto: string | undefined,
) {
  const quedan = maximo === undefined ? null : maximo - [...texto].length;
  const pasado = quedan !== null && quedan < 0;
  const cerca = quedan !== null && quedan >= 0 && quedan <= AVISO;

  const contador = quedan === null ? null : (
    <span className={['ta-cuenta', pasado ? 'ta-cuenta-mal' : ''].filter(Boolean).join(' ')}>
      {pasado ? `${-quedan} de más` : `${quedan} restantes`}
    </span>
  );

  /* El pie SOLO si hay contador: con `ayuda` a secas sobra el envoltorio de
     dos columnas, y la ayuda va donde va siempre. */
  const pie = contador && (
    <span className="ta-pie">
      <span>{ayuda}</span>
      {contador}
    </span>
  );

  /** El error del producto manda; el del tope aparece solo si no hay otro. */
  const error = errorDelProducto ?? (pasado
    ? `El texto se pasa por ${-quedan!} ${-quedan! === 1 ? 'carácter' : 'caracteres'}. Acórtalo antes de guardar.`
    : undefined);

  /** Solo habla en el último tramo: antes sería ruido en cada letra. */
  const anuncio = pasado ? `Te pasas por ${-quedan!}` : cerca ? `Quedan ${quedan}` : '';

  return { pie, error, anuncio, pasado, quedan };
}
