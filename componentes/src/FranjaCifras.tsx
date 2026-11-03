/**
 * FRANJA DE CIFRAS Y CIFRA CON DIFERENCIA (R169)
 *
 * Cifras sueltas separadas por una línea fina, sin tarjetas: una fila de
 * «Tardanzas 612 min ▲ +72 min» que se lee de un vistazo. La app entrega los
 * números YA CALCULADOS; la pieza solo los dibuja.
 *
 * La diferencia llega hecha (`cantidad`, `direccion`, `sentido`): la pieza no
 * resta, no compara ni formatea. Lo que sí decide es cómo se ve y cómo se lee:
 * flecha, signo, tono y nombre accesible. El color NO va solo (SC 1.4.1): la
 * flecha y la palabra «empeoró» / «mejoró» dicen lo mismo en escala de grises.
 */
import { Children, isValidElement, type ReactNode } from 'react';

export type DiferenciaCifra = {
  /** La magnitud, sin signo ni flecha: «72 min», «3 trab.», «0:45». */
  cantidad: string;
  /** La app ya comparó actual y anterior. */
  direccion: 'sube' | 'baja' | 'igual';
  /** Cómo se lee subir: 'subir-es-peor' (todas las del tablero) o 'subir-es-mejor'. */
  sentido: 'subir-es-peor' | 'subir-es-mejor';
};

export type CifraConDiferenciaProps = {
  titulo: string;
  /** Ya formateado: «612», «37:50». */
  valor: string;
  unidad?: string;
  diferencia?: DiferenciaCifra;
  /** Línea de apoyo bajo la diferencia. Opcional; el tablero aprobado no la usa. */
  detalle?: ReactNode;
};

export type FranjaCifrasProps = {
  /** `CifraConDiferencia`, una por cifra. Cada una se envuelve en su `li`. */
  children: ReactNode;
  /** Nombre accesible de la lista, p. ej. «Resumen de la semana». */
  etiqueta?: string;
  className?: string;
};

/** El signo menos de verdad (U+2212), que no se parte ni se confunde con un guion. */
const MENOS = '−';

type Tono = 'peor' | 'mejor' | 'igual';

function leer(d: DiferenciaCifra): { tono: Tono; visible: string; nombre: string } {
  if (d.direccion === 'igual') {
    return { tono: 'igual', visible: '= igual que antes', nombre: 'sin cambio' };
  }
  const sube = d.direccion === 'sube';
  const signo = sube ? '+' : MENOS;
  // Subir es peor o mejor según el sentido; bajar es lo contrario.
  const mejora = sube === (d.sentido === 'subir-es-mejor');
  return {
    tono: mejora ? 'mejor' : 'peor',
    visible: `${sube ? '▲' : '▼'} ${signo}${d.cantidad}`,
    nombre: `${mejora ? 'mejoró' : 'empeoró'}: ${signo}${d.cantidad}`,
  };
}

export function CifraConDiferencia({ titulo, valor, unidad, diferencia, detalle }: CifraConDiferenciaProps) {
  const dif = diferencia ? leer(diferencia) : null;
  return (
    <div className="cifra">
      <span className="cifra-titulo">{titulo}</span>
      <span className="cifra-valor">
        {valor}
        {/* El espacio separa valor y unidad para el lector («612 min», no «612min»);
            en un contenedor flex no se pinta. */}
        {unidad && <>{' '}<span className="cifra-unidad">{unidad}</span></>}
      </span>
      {dif && (
        <span className={`cifra-dif cifra-dif-${dif.tono}`}>
          {/* Lo que se ve lleva flecha y signo; lo que se oye es el nombre. Sin
              esto el lector diría «triángulo negro apuntando arriba, más…». */}
          <span aria-hidden="true">{dif.visible}</span>
          <span className="sr-solo">{dif.nombre}</span>
        </span>
      )}
      {detalle && <span className="cifra-detalle">{detalle}</span>}
    </div>
  );
}

export function FranjaCifras({ children, etiqueta, className = '' }: FranjaCifrasProps) {
  // Children.toArray descarta null, undefined y booleanos: no hay `li` vacíos.
  const cifras = Children.toArray(children).filter(
    (c) => isValidElement(c) || typeof c === 'string' || typeof c === 'number',
  );
  return (
    <ul className={['franja', className].filter(Boolean).join(' ')} aria-label={etiqueta}>
      {cifras.map((c, i) => (
        <li className="franja-item" key={isValidElement(c) && c.key != null ? c.key : i}>{c}</li>
      ))}
    </ul>
  );
}
