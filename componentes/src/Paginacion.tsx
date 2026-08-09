/**
 * PAGINACIÓN
 *
 * UN solo componente para todo el sistema. Hubo dos —una en la tabla y otra
 * suelta— y divergieron en cuanto se tocó una: la de la tabla se quedó sin la
 * variante móvil que la otra ya tenía. No se vuelve a hacer.
 *
 * Reglas: con una sola página NO se pinta —el rango lo pinta quien la use—, las
 * flechas llevan texto además del chevron, y el tamaño elegido se recuerda
 * fuera, en el perfil de la persona.
 */

import { Selector } from './Campo';

export type PaginacionProps = {
  pagina: number;
  totalPaginas: number;
  onPagina: (n: number) => void;
  /** Nombre de lo que se pagina. «Personal», «Matrículas». Va al aria-label. */
  de: string;
  /** Compacta: solo anterior/siguiente y la posición. Es la de móvil. */
  compacta?: boolean;
  porPagina?: number;
  tamanos?: number[];
  onPorPagina?: (n: number) => void;
};

/** Ventana de páginas alrededor de la actual, con elipsis. Nunca más de siete
 *  botones: a partir de ahí se leen como ruido y no como navegación. */
function ventana(pagina: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const cerca = [pagina - 1, pagina, pagina + 1].filter((n) => n > 1 && n < total);
  const salida: (number | '…')[] = [1];
  if (cerca[0] > 2) salida.push('…');
  salida.push(...cerca);
  if (cerca[cerca.length - 1] < total - 1) salida.push('…');
  salida.push(total);
  return salida;
}

export function Paginacion({
  pagina,
  totalPaginas,
  onPagina,
  de,
  compacta = false,
  porPagina,
  tamanos = [10, 25, 50],
  onPorPagina,
}: PaginacionProps) {
  // Con una sola página no hay nada que navegar.
  if (totalPaginas <= 1) return null;

  const anterior = Math.max(1, pagina - 1);
  const siguiente = Math.min(totalPaginas, pagina + 1);

  return (
    <nav className="pgn" aria-label={`Paginación de ${de}`}>
      <button
        type="button"
        className="pgn-btn pgn-flecha"
        disabled={pagina === 1}
        onClick={() => onPagina(anterior)}
      >
        {/* El texto acompaña al chevron: un chevron solo no dice a dónde va. */}
        Anterior
      </button>

      {compacta ? (
        <span className="pgn-pos">{pagina} de {totalPaginas}</span>
      ) : (
        ventana(pagina, totalPaginas).map((n, i) =>
          n === '…' ? (
            <span className="pgn-elip" key={`e${i}`} aria-hidden="true">…</span>
          ) : (
            <button
              type="button"
              key={n}
              className="pgn-btn"
              // La página en curso se anuncia como tal, no solo se pinta.
              aria-current={n === pagina ? 'page' : undefined}
              onClick={() => onPagina(n)}
            >
              {n}
            </button>
          )
        )
      )}

      <button
        type="button"
        className="pgn-btn pgn-flecha"
        disabled={pagina === totalPaginas}
        onClick={() => onPagina(siguiente)}
      >
        Siguiente
      </button>

      {/* Se IMPORTA Selector. Antes era un <select className="campo"> a mano
          dentro de un <label className="pgn-tam">, y `pgn-tam` NO EXISTÍA en
          ninguna hoja: reusaba la clase del campo pero no el componente, así
          que se quedaba sin la etiqueta vinculada por `htmlFor` y sin el
          contenedor. La disposición en línea la pone `.pgn .campo-grupo`. */}
      {onPorPagina && porPagina !== undefined && (
        <Selector
          etiqueta="Filas"
          value={porPagina}
          onChange={(e) => onPorPagina(Number(e.target.value))}
          opciones={tamanos.map((n) => ({ valor: String(n), texto: String(n) }))}
        />
      )}
    </nav>
  );
}
