/**
 * TARJETA Y TARJETA DE PERSONA
 *
 * La de persona lleva filete de color a la izquierda, y ese filete es
 * ESTRUCTURAL: acompaña siempre a un chip con texto. El estado nunca se dice
 * solo con el filete (SC 1.4.1).
 *
 * R56 · LA PULSABLE ES UN <button>, Y LA HOJA NO LO SABÍA.
 *
 * Durante 48 versiones el catálogo pintó la pulsable como `<a href="#">` y
 * este componente la emitió como `<button>`. Con un ancla da igual que `.tn`
 * no traiga `font: inherit`; con un botón no: el navegador impone su fuente
 * (~13,3px Arial), centra el texto y añade relleno propio. Así que la tarjeta
 * pulsable se veía bien en el catálogo y mal en cada producto.
 *
 * No lo cazó el candado de la promesa porque ese resuelve la cascada sobre EL
 * MISMO marcado, y aquí lo que difería era el elemento, no el CSS. El arreglo
 * vive en la hoja —`.tn` con `font: inherit`, `text-align: left`, `padding: 0`
 * y `margin: 0`—, y el catálogo pasa a enseñar el `<button>` que se entrega.
 */

import { Avatar } from './Avatar';
import { Chip, type TonoChip } from './Chip';

export type TarjetaProps = {
  titulo?: string;
  /** R57 · URL de la imagen de cabecera. Va ARRIBA, antes del título, con la
   *  proporción 16:9 que fija el sistema — la misma del formato
   *  `medio-tarjeta` de `CargaImagen`, así que lo recortado allí entra aquí
   *  sin reencuadrar. */
  medio?: string;
  /** R57 · Texto alternativo del medio. Vacío por omisión y a propósito: en
   *  una tarjeta la imagen ilustra lo que el título ya nombra, y con `alt` el
   *  lector lo diría dos veces. Se rellena solo cuando la imagen aporta algo
   *  que el texto no dice. */
  medioAlt?: string;
  /** R57 · Reserva el hueco del medio aunque no haya imagen. Por omisión se
   *  reserva cuando llega `medio`. En un catálogo se pasa SIEMPRE: sin esto,
   *  las tarjetas sin foto salen más bajas y la cuadrícula queda dentada. */
  conMedio?: boolean;
  /** R57 · Qué se lee en el hueco cuando no hay imagen. */
  medioVacio?: string;
  /** Acciones del pie. Van a la derecha, en orden de importancia inversa. */
  pie?: React.ReactNode;
  /** Si toda la tarjeta es pulsable, se envuelve en un <button>. Una tarjeta
   *  con onClick en un <div> no se alcanza con teclado. */
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Tarjeta({
  titulo, medio, medioAlt = '', conMedio, medioVacio = 'Sin imagen',
  pie, onClick, children, className = '',
}: TarjetaProps) {
  // El hueco se reserva si lo piden, y si no, cuando hay imagen que poner.
  const llevaMedio = conMedio ?? medio !== undefined;
  const contenido = (
    <>
      {llevaMedio && (
        <div className="tn-medio">
          {medio
            ? <img src={medio} alt={medioAlt} />
            : <span className="tn-medio-vacio">{medioVacio}</span>}
        </div>
      )}
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
