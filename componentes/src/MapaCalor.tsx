/**
 * MAPA DE CALOR (R169)
 *
 * Una cuadrícula filas × columnas donde la intensidad de un solo tono dice
 * cuánto, y el número dice cuánto exactamente: el color acompaña, no sostiene
 * (SC 1.4.1). Es una TABLA, con cabeceras de fila y de columna, para que un
 * lector de pantalla recorra «Hombre, 30-39, 96, 5 trab.».
 *
 * La intensidad va en CINCO PASOS discretos y no en una mezcla continua: cada
 * par fondo-texto es un par de tokens y `verificar-contraste` lo mide en los
 * dos modos. Una mezcla continua produciría colores que ningún candado mide.
 */
import { useId, type ReactNode } from 'react';

export type CeldaMapaCalor = { valor: number; n: number };

export type MapaCalorProps = {
  titulo: string;
  descripcion?: ReactNode;
  /** Total del mapa, ya escrito: «327 min». */
  total?: string;
  filas: string[];
  columnas: string[];
  /** celdas[fila][columna]. */
  celdas: CeldaMapaCalor[][];
  formato?: (valor: number) => string;
  /** n ≤ este valor = «Pocos datos». 2 por omisión. */
  pocosDatosHasta?: number;
};

export const PASOS_MAPA = 5;

/** Paso 1..5 de un valor: `ceil(5·v/max)`. Con `max` ≤ 0 no hay escala y es 1. */
export function pasoMapa(valor: number, max: number): number {
  if (!(max > 0) || !Number.isFinite(valor)) return 1;
  return Math.max(1, Math.min(PASOS_MAPA, Math.ceil((PASOS_MAPA * valor) / max)));
}

/**
 * El paso de cada celda; 0 para las de `n = 0`, que nunca reciben color. El
 * máximo se toma SOLO sobre las celdas con `n > 0`: un valor suelto en una
 * celda sin trabajadores no debe aclarar todas las demás.
 */
export function pasosDelMapa(celdas: CeldaMapaCalor[][]): number[][] {
  let max = 0;
  for (const fila of celdas) for (const c of fila) if (c.n > 0 && c.valor > max) max = c.valor;
  return celdas.map((fila) => fila.map((c) => (c.n > 0 ? pasoMapa(c.valor, max) : 0)));
}

export function MapaCalor({
  titulo, descripcion, total, filas, columnas, celdas, formato, pocosDatosHasta = 2,
}: MapaCalorProps) {
  const idTitulo = useId();
  const pasos = pasosDelMapa(celdas);
  const escribir = (v: number) => (formato ? formato(v) : String(v));
  return (
    <article className="mapa">
      <header>
        <h3 className="mapa-titulo" id={idTitulo}>{titulo}</h3>
        {descripcion && <p className="mapa-desc">{descripcion}</p>}
        {total && <p className="mapa-desc mapa-total">Total <strong>{total}</strong></p>}
      </header>
      {/* Desplaza ESTE contenedor y no la página; con teclado se llega a él. */}
      <div className="mapa-vista" role="region" tabIndex={0} aria-labelledby={idTitulo}>
        <table className="mapa-tabla">
          <thead>
            <tr>
              <td />
              {columnas.map((c) => <th scope="col" key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, a) => (
              <tr key={f}>
                <th scope="row">{f}</th>
                {columnas.map((c, b) => {
                  const celda = celdas[a]?.[b] ?? { valor: 0, n: 0 };
                  const paso = pasos[a]?.[b] ?? 0;
                  if (celda.n <= 0) {
                    return (
                      <td key={c}>
                        <div className="mapa-celda mapa-vacia">
                          <span className="mapa-valor">—</span>
                          <span className="mapa-n">0 trab.</span>
                        </div>
                      </td>
                    );
                  }
                  const pocos = celda.n <= pocosDatosHasta;
                  return (
                    <td key={c}>
                      <div className={`mapa-celda mapa-p${paso}${pocos ? ' mapa-pocos' : ''}`}>
                        <span className="mapa-valor">{escribir(celda.valor)}</span>
                        <span className="mapa-n">{celda.n} trab.</span>
                        {pocos && (
                          <span className="sr-solo">
                            Pocos datos: {celda.n} {celda.n === 1 ? 'trabajador' : 'trabajadores'}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Solo para la vista: los números ya dicen todo lo que dice la escala. */}
      <div className="mapa-escala" aria-hidden="true">
        <span>Menos</span>
        <span className="mapa-pasos">
          {[1, 2, 3, 4, 5].map((p) => <i className={`mapa-paso mapa-p${p}`} key={p} />)}
        </span>
        <span>Más</span>
      </div>
    </article>
  );
}
