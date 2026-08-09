/**
 * TARJETA Y TARJETA DE PERSONA
 *
 * La de persona lleva filete de color a la izquierda, y ese filete es
 * ESTRUCTURAL: acompaña siempre a un chip con texto. El estado nunca se dice
 * solo con el filete (SC 1.4.1).
 */

import { Avatar } from './Avatar';
import { Chip, type TonoChip } from './Chip';

export type TarjetaProps = {
  titulo?: string;
  /** Acciones del pie. Van a la derecha, en orden de importancia inversa. */
  pie?: React.ReactNode;
  /** Si toda la tarjeta es pulsable, se envuelve en un <button>. Una tarjeta
   *  con onClick en un <div> no se alcanza con teclado. */
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Tarjeta({ titulo, pie, onClick, children, className = '' }: TarjetaProps) {
  const contenido = (
    <>
      {titulo && <div className="tn-cab"><h3 >{titulo}</h3></div>}
      <div className="tn-cuerpo">{children}</div>
      {pie && <div className="tn-pie">{pie}</div>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={['tn', 'tn-pulsable', className].filter(Boolean).join(' ')} onClick={onClick}>
        {contenido}
      </button>
    );
  }
  return <article className={['tn', className].filter(Boolean).join(' ')}>{contenido}</article>;
}

export type TarjetaPersonaProps = {
  /** Identificador estable: de aquí sale el color del avatar. */
  id: string;
  /** «QUISPE MAMANI, Rosa» */
  nombre: string;
  cargo?: string;
  foto?: string;
  /** El estado, siempre con texto. El tono pinta el filete y el chip. */
  estado?: { tono: TonoChip; texto: string };
  /** Dato de la derecha: la hora de marca, el saldo. */
  dato?: string;
  inactiva?: boolean;
};

export function TarjetaPersona({
  id, nombre, cargo, foto, estado, dato, inactiva = false,
}: TarjetaPersonaProps) {
  const clases = ['tp'];
  if (estado) clases.push(`tp-${estado.tono}`);
  if (inactiva) clases.push('tp-inact');
  return (
    <article className={clases.join(' ')}>
      <Avatar id={id} nombre={nombre} foto={foto} tamano="l" />
      <div className="tp-txt">
        <h4 className="tp-nom">{nombre}</h4>
        {cargo && <p className="tp-cargo">{cargo}</p>}
        <div className="tp-pie">
          {/* El chip con TEXTO acompaña siempre al filete: el color solo no
              distingue nada. */}
          {estado && <Chip tono={estado.tono}>{estado.texto}</Chip>}
          {dato && <span className="tp-hora mono">{dato}</span>}
        </div>
      </div>
    </article>
  );
}
