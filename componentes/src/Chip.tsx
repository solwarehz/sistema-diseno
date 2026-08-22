/**
 * CHIP DE ESTADO
 *
 * El filete de la izquierda es ESTRUCTURAL, no decorativo: el color solo no
 * distingue nada (SC 1.4.1). Por eso el chip siempre lleva texto, y por eso no
 * existe una variante «solo color».
 */

/**
 * Dos familias, y la diferencia importa. Los seis primeros SIGNIFICAN algo:
 * verde va bien, rojo va mal. Los cuatro de identidad no significan nada — son
 * los mismos del avatar y sirven para AGRUPAR (una sede, un turno, un
 * responsable), nunca para informar. Ver la regla 3 del contrato.
 */
export type TonoChip =
  | 'exito' | 'aviso' | 'error' | 'info' | 'pendiente' | 'inactivo'
  | 'identidad-1' | 'identidad-2' | 'identidad-3' | 'identidad-4';

const CLASE: Record<TonoChip, string> = {
  exito: 'chip-exito',
  aviso: 'chip-aviso',
  error: 'chip-error',
  info: 'chip-info',
  pendiente: 'chip-pend',
  inactivo: 'chip-inact',
  'identidad-1': 'chip-identidad-1',
  'identidad-2': 'chip-identidad-2',
  'identidad-3': 'chip-identidad-3',
  'identidad-4': 'chip-identidad-4',
};

export type ChipProps = {
  tono?: TonoChip;
  /** El texto es obligatorio. Un chip sin texto es color solo. */
  children: React.ReactNode;
  className?: string;
};

export function Chip({ tono = 'info', children, className = '' }: ChipProps) {
  return <span className={['chip', CLASE[tono], className].filter(Boolean).join(' ')}>{children}</span>;
}
