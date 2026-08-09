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
  /** La acción principal, a la derecha del título. **Una sola**: si hay dos,
   *  ninguna es la principal. Con `Boton`. */
  accion?: React.ReactNode;
};

export function CabeceraPantalla({ titulo, migas, onIrMiga, descripcion, accion }: CabeceraPantallaProps) {
  return (
    <header className="pant-cab">
      {migas && migas.length > 0 && <Migas ruta={migas} onIr={onIrMiga} />}

      <div className="pant-fila">
        <h1>{titulo}</h1>
        {accion && <div className="pant-accion">{accion}</div>}
      </div>

      {/* La descripción va DEBAJO del título y de la acción, no entre los dos:
          en medio separa la acción de aquello sobre lo que actúa. */}
      {descripcion && <p className="pant-desc">{descripcion}</p>}
    </header>
  );
}
