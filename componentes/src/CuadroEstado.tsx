/**
 * CUADRO DE ESTADO
 *
 * Un cuadrado de una letra con tono, para mostrar una serie corta de estados
 * en poco ancho (R165). El tono acompaña; lo que informa es la LETRA, y la
 * letra sola no basta en un teléfono: se usa siempre con una leyenda visible
 * en la misma pantalla (regla del contrato).
 *
 * `ninguno` («sin estado») se distingue por la FORMA —borde punteado, sin
 * relleno—, no por el tono (SC 1.4.1).
 */

export type TonoCuadro = 'exito' | 'aviso' | 'error' | 'info' | 'inactivo' | 'ninguno';

const CLASE: Record<TonoCuadro, string> = {
  exito: 'cuadro-exito',
  aviso: 'cuadro-aviso',
  error: 'cuadro-error',
  info: 'cuadro-info',
  inactivo: 'cuadro-inactivo',
  ninguno: 'cuadro-ninguno',
};

export type CuadroEstadoProps = {
  /** Un solo carácter. Es lo que informa; el tono lo acompaña (SC 1.4.1). */
  letra: string;
  tono: TonoCuadro;
  /** Nombre accesible completo, p. ej. «Presente, lunes 26». */
  titulo: string;
  className?: string;
};

export function CuadroEstado({ letra, tono, titulo, className = '' }: CuadroEstadoProps) {
  // Se cuentan caracteres, no unidades UTF-16: un emoji es uno.
  if (process.env.NODE_ENV !== 'production' && Array.from(letra).length !== 1) {
    console.warn(
      'CuadroEstado: `letra` debe ser exactamente un carácter y llegó «' + letra + '». ' +
      'Un cuadrado de 28 px no admite más; el significado completo va en `titulo` y en la leyenda.'
    );
  }
  return (
    <span
      className={['cuadro', CLASE[tono], className].filter(Boolean).join(' ')}
      role="img"
      aria-label={titulo}
    >
      {letra}
    </span>
  );
}
