/**
 * BOTÓN
 *
 * Seis variantes, y la elección NO es estética: la hace la acción.
 * Ver `comportamiento.md` y la tabla «Qué botón para qué acción» del catálogo.
 *
 * Regla dura del sistema: UNA principal por pantalla. Si hay dos, ninguna lo es.
 */

import { forwardRef } from 'react';

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
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { variante = 'neutra', icono, soloIcono = false, mini = false, className = '', children, ...resto },
  ref
) {
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
  if (className) clases.push(className);

  return (
    <button type="button" ref={ref} className={clases.join(' ')} {...resto}>
      {icono && <span aria-hidden="true">{icono}</span>}
      {children}
    </button>
  );
});
