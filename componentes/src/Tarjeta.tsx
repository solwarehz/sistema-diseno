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
import { Boton } from './Boton';
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
  /** R59 · Control que va SOBRE la imagen —cambiar la foto, y poco más—. Se
   *  pinta por encima de la zona pulsable de `TarjetaAccion`: es la única
   *  acción de la tarjeta que no es LA acción de la tarjeta. */
  medioAccion?: React.ReactNode;
  /** R58 · Nivel del encabezado. Lo elige quien conoce la jerarquía de su
   *  página, no el sistema: una tarjeta bajo un `<h1>` quiere `h2`, y dentro
   *  de una sección con `<h2>` quiere `h3`. La hoja estiliza los tres igual. */
  nivelTitulo?: 2 | 3 | 4;
  /** Acciones del pie. Van a la derecha, en orden de importancia inversa. */
  pie?: React.ReactNode;
  /** Si toda la tarjeta es pulsable, se envuelve en un <button>. Una tarjeta
   *  con onClick en un <div> no se alcanza con teclado. */
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Tarjeta({
  titulo, medio, medioAlt = '', conMedio, medioVacio = 'Sin imagen', medioAccion,
  nivelTitulo = 3, pie, onClick, children, className = '',
}: TarjetaProps) {
  // El hueco se reserva si lo piden, y si no, cuando hay imagen que poner.
  const llevaMedio = conMedio ?? medio !== undefined;
  // R58 · El nivel lo pone el producto. La hoja estiliza h2, h3 y h4 igual, así
  // que elegir bien la jerarquía no cuesta un estilo distinto.
  const H = `h${nivelTitulo}` as 'h2' | 'h3' | 'h4';
  const contenido = (
    <>
      {llevaMedio && (
        <div className="tn-medio">
          {medio
            ? <img src={medio} alt={medioAlt} />
            : <span className="tn-medio-vacio">{medioVacio}</span>}
          {medioAccion}
        </div>
      )}
      {titulo && <div className="tn-cab"><H>{titulo}</H></div>}
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

/**
 * TARJETA DE ACCIÓN — R59
 *
 * Foto arriba, título, texto y un botón. Y una sola acción: pulsar la imagen,
 * el título, el texto o el botón lleva AL MISMO SITIO.
 *
 * POR QUÉ NO SON TRES BOTONES. Se pidió que los tres hicieran lo mismo, y la
 * forma directa —tres `<button>` con el mismo `onClick`— es la mala: son tres
 * paradas de tabulador y tres anuncios para una sola acción. Con teclado hay
 * que pasar por las tres para salir de la tarjeta, y un lector de pantalla la
 * lee tres veces seguidas diciendo lo mismo. En una cuadrícula de veinte
 * tarjetas son sesenta paradas para veinte destinos.
 *
 * Así que hay UN control real —el título— y su zona pulsable se estira sobre
 * toda la tarjeta con `::after`. Una parada, un anuncio, y se puede pulsar
 * donde sea. El botón del pie es la SEÑAL de que la tarjeta lleva a algún
 * sitio, no un control aparte: va `aria-hidden` y fuera del tabulador, y el
 * clic lo recoge la zona que tiene debajo.
 *
 * EDITABLE. Por omisión NO se puede editar: el producto la manda así y solo se
 * mira. Cuando sí, aparece un control sobre la imagen —la única acción de la
 * tarjeta que no es LA acción de la tarjeta—, y por eso va por encima de la
 * zona pulsable. Bloquear la edición NO apaga la navegación: se sigue entrando
 * igual, que es lo que se pidió.
 */
export type TarjetaAccionProps = {
  titulo: string;
  /** R58 · La jerarquía de la página la conoce el producto, no el sistema. */
  nivelTitulo?: 2 | 3 | 4;
  texto?: string;
  foto?: string;
  /** Vacío por omisión: el título ya nombra la tarjeta y el lector lo diría
   *  dos veces. Se rellena si la imagen dice algo que el texto no dice. */
  fotoAlt?: string;
  /** LA acción. La hacen la imagen, el título, el texto y el botón. */
  onAccion: () => void;
  textoBoton?: string;
  /** Por omisión no se puede editar. El producto la manda editable cuando toca. */
  editable?: boolean;
  /** Qué hacer al pedir cambiar la foto. Sin esto no sale el control aunque
   *  `editable` sea cierto: un botón que no hace nada es peor que no tenerlo. */
  onEditarFoto?: () => void;
  textoEditarFoto?: string;
  className?: string;
};

export function TarjetaAccion({
  titulo, nivelTitulo = 3, texto, foto, fotoAlt = '', onAccion,
  textoBoton = 'Ver', editable = false, onEditarFoto,
  textoEditarFoto = 'Cambiar imagen', className = '',
}: TarjetaAccionProps) {
  const H = `h${nivelTitulo}` as 'h2' | 'h3' | 'h4';
  const puedeEditar = editable && !!onEditarFoto;
  return (
    <Tarjeta
      className={['tna', 'tn-pulsable', className].filter(Boolean).join(' ')}
      medio={foto}
      medioAlt={fotoAlt}
      conMedio
      medioAccion={puedeEditar ? (
        <Boton mini variante="neutra" className="tna-editar" onClick={onEditarFoto}>
          {textoEditarFoto}
        </Boton>
      ) : undefined}
      pie={
        /* La señal de la acción, no un control: si fuera un <button> de verdad
           serían dos paradas de tabulador para una sola acción. */
        <span className="btn btn-1" aria-hidden="true">{textoBoton}</span>
      }
    >
      <H>
        <button type="button" className="tna-disparo" onClick={onAccion}>{titulo}</button>
      </H>
      {texto && <p className="tna-txt">{texto}</p>}
    </Tarjeta>
  );
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
