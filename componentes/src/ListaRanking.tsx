/**
 * LISTA DE RANKING (R169)
 *
 * Una lista corta de personas ordenada por una medida: posición, avatar,
 * nombre, una línea gris, el valor escrito y una barra proporcional al primero.
 * La app entrega las filas YA ORDENADAS y con el texto del valor escrito; la
 * pieza solo las dibuja. No ordena, no recorta a cinco (la spec dice «hasta
 * cinco» como lo que usa el tablero, no como tope) y no suma.
 *
 * El nombre envuelve: en un apellido compuesto de 60 caracteres, cortar el
 * texto con puntos suspensivos escondería a la persona. Y el `title` no basta
 * en un teléfono.
 */
import { useId } from 'react';
import { Avatar } from './Avatar';

export type FilaRanking = {
  id: string;
  /** Apellidos y nombres. Puede ser largo y envuelve. */
  nombre: string;
  /** Solo para la proporción de la barra. El primero es el 100 %. */
  valor: number;
  /** Lo que se lee: «74 min», «2 días». */
  texto: string;
  /** Foto o, sin ella, iniciales (lo decide `Avatar`). */
  foto?: string;
  /** Una línea gris bajo el nombre (la unidad organizativa). */
  detalle?: string;
};

export type ListaRankingProps = {
  titulo: string;
  filas: FilaRanking[];
  /** Texto cuando no hay filas: «Nadie tiene faltas en esta unidad esta semana». */
  textoVacio: string;
};

/**
 * Largo de la barra, de 0 a 100: `valor / primero`. Exacto, sin cuantizar (el
 * mockup saltaba de 5 en 5 por no poder escribir un ancho; aquí el ancho es un
 * atributo SVG y no hay razón para perder precisión). Redondeado a dos
 * decimales para que el marcado no cargue 82,43243243243244. Con `primero` ≤ 0
 * no hay con qué comparar y no hay barra.
 */
export function porcentajeBarra(valor: number, primero: number): number {
  if (!(primero > 0) || !(valor > 0)) return 0;
  return Math.min(100, Math.round((valor / primero) * 10000) / 100);
}

export function ListaRanking({ titulo, filas, textoVacio }: ListaRankingProps) {
  const idTitulo = useId();
  const primero = filas[0]?.valor ?? 0;
  return (
    <section className="ranking" aria-labelledby={idTitulo}>
      <h3 className="ranking-titulo" id={idTitulo}>{titulo}</h3>
      {filas.length === 0 ? (
        <p className="ranking-vacio">{textoVacio}</p>
      ) : (
        <ol className="ranking-lista" role="list">
          {filas.map((f, i) => {
            const pct = porcentajeBarra(f.valor, primero);
            return (
              <li className="ranking-fila" key={f.id}>
                <span className="ranking-pos">{i + 1}</span>
                {/* El nombre ya está al lado: el avatar no se lee dos veces. */}
                <span className="ranking-avatar" aria-hidden="true">
                  <Avatar id={f.id} nombre={f.nombre} foto={f.foto} tamano="m" />
                </span>
                <div className="ranking-quien">
                  <div className="ranking-nombre">{f.nombre}</div>
                  {f.detalle && <div className="ranking-detalle">{f.detalle}</div>}
                  {/* Atributos SVG y no `style`: el candado no admite el atributo
                      en línea y un ancho exacto no cabe en una clase. */}
                  <svg className="ranking-barra" aria-hidden="true" focusable="false">
                    {pct > 0 && <rect className="ranking-barra-relleno" width={`${pct}%`} height="100%" rx="3" />}
                  </svg>
                </div>
                <span className="ranking-valor">{f.texto}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
