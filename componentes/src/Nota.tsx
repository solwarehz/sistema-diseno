/**
 * NOTA PERMANENTE
 *
 * Texto que EXPLICA y se queda: cómo se calcula un dato, una aclaración bajo un
 * formulario, una advertencia legal que siempre está.
 *
 * No es un `Aviso`, y la diferencia importa. El aviso aparece y desaparece, y
 * su color enseña a la gente que algo requiere atención. Usarlo para algo
 * permanente tiene dos costes: grita más de lo que debe, y **si el ámbar
 * siempre está, deja de significar «mira esto»**. El razonamiento es de Control
 * Administrativos V2.0 y es correcto.
 *
 * Por eso va en superficie neutra, sin tono de estado y sin comportamiento
 * temporal: no se cierra, no se desvanece, no interrumpe al lector de pantalla.
 */

export type NotaProps = {
  children: React.ReactNode;
  /** Título corto, si la nota es larga. */
  titulo?: string;
  className?: string;
};

export function Nota({ children, titulo, className = '' }: NotaProps) {
  return (
    // `role` NO: una nota permanente no es una región viva. Anunciarla como tal
    // la haría interrumpir cada vez que la pantalla se repinta.
    <div className={['msj', 'msj-nota', className].filter(Boolean).join(' ')}>
      {titulo && <strong>{titulo}</strong>}
      {titulo && ' '}
      {children}
    </div>
  );
}
