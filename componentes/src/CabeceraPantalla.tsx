/**
 * CABECERA DE PANTALLA
 *
 * Migas, título, acción y descripción. El mismo bloque con el que abren las 39
 * páginas del catálogo, y que hasta hoy **no viajaba**: cada proyecto lo montaba
 * a mano y cada pantalla salía un poco distinta —una con línea, otra sin; una a
 * 16px, otra a 24—.
 *
 * La deriva de esto no se ve pantalla a pantalla. Solo se ve al ponerlas
 * juntas, que es justo cuando ya cuesta arreglarla. Lo reportó Control
 * Administrativos V2.0 con once pantallas montadas.
 *
 * EMITE EL `<h1>`, y ese es el argumento que decide. El título de pantalla es
 * el encabezado de nivel uno del documento y **debe haber uno solo por
 * página**. Un componente lo garantiza; una nota en un comentario pidiendo que
 * no se usen dos a la vez es disciplina, no mecanismo — y la disciplina se
 * rompe el día que entra alguien nuevo.
 *
 * Por eso el título es texto y no `children`: si aceptara marcado libre, un
 * proyecto podría meter otro encabezado dentro y volveríamos al principio.
 */

import { Migas, type Miga } from './Migas';

export type CabeceraPantallaProps = {
  /** El `<h1>` de la pantalla. Texto, no marcado: ver arriba. */
  titulo: string;
  /** Dónde estás. Si se pasa, se pinta encima del título. */
  migas?: Miga[];
  onIrMiga?: (href: string) => void;
  /** Qué es esta pantalla, si no es obvio por el título. */
  descripcion?: string;
  /**
   * La acción **principal**, a la derecha del título. Con `Boton`.
   *
   * R114 · Hasta la v1.93.0 esto decía «**Una sola**: si hay dos, ninguna es la
   * principal», y estaba mal escrito. La regla del sistema es «una sola
   * PRINCIPAL por pantalla; el resto son secundarias o neutras» —está en la
   * página de Acciones—, y este contrato la había estrechado hasta convertirla
   * en «una sola acción». Lo trajo Control Administrativos con el caso de
   * Trabajadores: «Agregar» principal y «Carga masiva» secundaria, y un hueco
   * para la segunda que buscaron y no existía.
   *
   * La regla de una sola principal **no cambia**: sigue habiendo una.
   */
  accion?: React.ReactNode;
  /**
   * R114 · La acción secundaria, **a la izquierda de la principal**.
   *
   * Va a la izquierda y no a la derecha porque la principal es la que queda
   * pegada al borde y al pulgar: lo que más se usa, más a mano. Y porque así el
   * orden de tabulación llega a la secundaria antes que a la principal, que es
   * el orden en el que se leen.
   *
   * En estrecho las dos ocupan la mitad del ancho cada una. **No se pinta un
   * hueco si no se pasa**: sin secundaria, la principal se comporta exactamente
   * como antes.
   */
  accionSecundaria?: React.ReactNode;
};

export function CabeceraPantalla({
  titulo, migas, onIrMiga, descripcion, accion, accionSecundaria,
}: CabeceraPantallaProps) {
  return (
    <header className="pant-cab">
      {migas && migas.length > 0 && <Migas ruta={migas} onIr={onIrMiga} />}

      <div className="pant-fila">
        <h1>{titulo}</h1>
        {/* R114 · Un solo contenedor para las dos. Dos `.pant-accion` separados
            los habrían dejado a merced del `justify-content: space-between` de
            la fila, o sea con el título en medio. */}
        {(accion || accionSecundaria) && (
          <div className="pant-accion">
            {accionSecundaria}
            {accion}
          </div>
        )}
      </div>

      {/* La descripción va DEBAJO del título y de la acción, no entre los dos:
          en medio separa la acción de aquello sobre lo que actúa. */}
      {descripcion && <p className="pant-desc">{descripcion}</p>}
    </header>
  );
}
