/**
 * BOTÓN
 *
 * Seis variantes, y la elección NO es estética: la hace la acción.
 * Ver `comportamiento.md` y la tabla «Qué botón para qué acción» del catálogo.
 *
 * Regla dura del sistema: UNA principal por pantalla. Si hay dos, ninguna lo es.
 */

import { forwardRef, useState, useRef, useEffect } from 'react';

export type VarianteBoton =
  /** La acción de la pantalla. Una sola. Guardar, Matricular, Registrar. */
  | 'principal'
  /** Acompaña a la principal. Filtros, Columnas, Exportar. */
  | 'secundaria'
  /** Neutra: no compite. Cancelar, Volver. */
  | 'neutra'
  /** Sin superficie. Acciones de fila y de barra. */
  | 'terciaria'
  /** Irreversible. Eliminar, Anular. Nunca para «Cancelar». */
  | 'destructiva';

const CLASE: Record<VarianteBoton, string> = {
  principal: 'btn-1',
  secundaria: 'btn-2',
  neutra: 'btn-neutro',
  terciaria: 'btn-terc',
  destructiva: 'btn-destr',
};

export type BotonProps = {
  variante?: VarianteBoton;
  /** Icono a la izquierda. Va oculto al lector: quien nombra es el botón. */
  icono?: React.ReactNode;
  /** Solo icono. Entonces `aria-label` es OBLIGATORIO y se comprueba en
   *  desarrollo: un botón sin nombre no se puede usar con lector de pantalla. */
  soloIcono?: boolean;
  mini?: boolean;
  /**
   * Fuerza el estado ocupado. **Casi nunca hace falta:** si `onClick` devuelve
   * una promesa, el botón se ocupa y se libera solo. Esto es para cuando el
   * estado vive fuera —por ejemplo, en un formulario que envía otro—.
   */
  ocupado?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { variante = 'neutra', icono, soloIcono = false, mini = false, ocupado = false, className = '', children, onClick, ...resto },
  ref
) {
  // ───────────────────────────────────────────────────────────────────────────
  // DOBLE ENVÍO: se impide AQUÍ, no en cada proyecto.
  //
  // Una propiedad `ocupado` que el proyecto tiene que acordarse de poner no
  // garantiza nada: el día que se olvida, se pulsa dos veces y se graba dos
  // veces. Y no se olvida por descuido —se pulsa dos veces porque el servidor
  // tarda y la persona insiste—.
  //
  // Así que el botón lo resuelve solo, con dos capas:
  //
  //   1 · Si `onClick` devuelve una promesa, el botón se ocupa mientras viaja
  //       y se libera al terminar, RESUELVA O FALLE. Sin liberar en el fallo,
  //       un error de red dejaría el botón muerto para siempre.
  //   2 · Mientras está ocupado, los clics se descartan ANTES de llegar al
  //       manejador. Es el cinturón por si el estado va con retraso: entre
  //       pulsar y repintar caben dos clics de alguien impaciente.
  //
  // No cubre lo que no puede: si la acción no devuelve promesa —un `fetch` sin
  // `return`— la capa 1 no se entera. Por eso existe también `ocupado`.
  // ───────────────────────────────────────────────────────────────────────────
  const [enVuelo, setEnVuelo] = useState(false);
  const vivo = useRef(true);
  useEffect(() => () => { vivo.current = false; }, []);

  const trabajando = ocupado || enVuelo;

  const alPulsar = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (trabajando) { e.preventDefault(); return; }
    const r = onClick?.(e) as unknown;
    if (r && typeof (r as Promise<unknown>).finally === 'function') {
      setEnVuelo(true);
      // `finally` y no `then`: si la petición falla, el botón tiene que volver.
      void (r as Promise<unknown>).finally(() => { if (vivo.current) setEnVuelo(false); });
    }
  };
  // process.env y no import.meta.env: import.meta.env es de Vite y ata el
  // componente a un empaquetador concreto. Un componente del sistema no puede
  // exigir que quien lo consuma use Vite.
  if (process.env.NODE_ENV !== 'production' && soloIcono && !resto['aria-label']) {
    // Se avisa en desarrollo en vez de fallar: romper el build de un consumidor
    // por una etiqueta es desproporcionado, callarlo es peor.
    console.warn('Boton: `soloIcono` exige `aria-label`. Sin él no tiene nombre accesible.');
  }

  const clases = ['btn', CLASE[variante]];
  if (mini) clases.push('btn-mini');
  if (icono) clases.push('btn-ic');
  if (soloIcono) clases.push('btn-solo-ic');
  if (trabajando) clases.push('btn-ocupado');
  if (className) clases.push(className);

  return (
    <button
      type="button"
      ref={ref}
      className={clases.join(' ')}
      {...resto}
      // Estas TRES van despues del reparto a proposito: si fueran antes, un
      // `disabled={false}` del proyecto pisaria el bloqueo y el doble envio
      // volveria. La garantia no puede depender de lo que pase quien llama.
      //
      // `disabled` y no solo una clase: un boton que parece apagado pero
      // responde al Enter no previene nada. Y `aria-busy` para que el lector
      // diga que esta ocupado en vez de callar.
      disabled={trabajando || resto.disabled}
      aria-busy={trabajando || undefined}
      onClick={alPulsar}
    >
      {trabajando
        ? <span className="btn-giro" aria-hidden="true" />
        : icono && <span aria-hidden="true">{icono}</span>}
      {children}
      {/* El texto NO cambia a «Enviando…»: cambiarlo mueve el ancho del botón y
          la fila entera baila. El giro y `aria-busy` ya lo dicen. */}
      {trabajando && <span className="sr-solo">, enviando</span>}
    </button>
  );
});
