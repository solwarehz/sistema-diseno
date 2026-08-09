/**
 * CHIP DE ESTADO
 *
 * El filete de la izquierda es ESTRUCTURAL, no decorativo: el color solo no
 * distingue nada (SC 1.4.1). Por eso el chip siempre lleva texto, y por eso no
 * existe una variante «solo color».
 */

export type TonoChip = 'exito' | 'aviso' | 'error' | 'info' | 'pendiente' | 'inactivo';

const CLASE: Record<TonoChip, string> = {
  exito: 'chip-exito',
  aviso: 'chip-aviso',
  error: 'chip-error',
  info: 'chip-info',
  pendiente: 'chip-pend',
  inactivo: 'chip-inact',
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
