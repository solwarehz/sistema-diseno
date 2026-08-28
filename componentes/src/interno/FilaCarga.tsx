/**
 * FILA DE CARGA — R102 · el arranque y el final COMUNES de las tres cargas
 *
 * Lo pidió el responsable con estas palabras: «subir id, subir archivo, subir
 * imagen, todas inician y terminan de forma similar sin romper el flujo». Y el
 * defecto que arreglaba era medible, no de gusto:
 *
 *   · `CargaImagen` pintaba una caja de 96 px de alto entre campos de 36,45.
 *   · `CargaPdf` en formulario apilaba la lista ENCIMA del botón, así que la
 *     fila crecía hacia arriba cada vez que se añadía un archivo.
 *   · `CargaId` ponía dos miniaturas de 48 px de alto en una fila de 37.
 *
 * Las tres rompían la rejilla del formulario, cada una a su manera y con su
 * propio marcado. Ahora las tres emiten ESTA pieza, y por eso no pueden
 * divergir: no es que se parezcan, es que es la misma.
 *
 * LA REGLA, que es una sola y es una medida:
 *
 *   **La fila mide lo que mide un `.campo`.** Medido en el catálogo con el
 *   navegador: un `.campo` da 36,45 px —13 px de texto con 18,85 de interlínea
 *   REAL, más 8+8 de relleno y 1+1 de borde— y la fila se fija en 36. Nada de
 *   lo que entre puede pasar de ahí: ni la miniatura (22), ni el disparador
 *   (`btn-mini`, 27,6), ni el nombre del archivo, que se recorta.
 *   Lo que no cabe **se cuenta** («+2») en vez de saltar de línea, porque
 *   envolver es romper la estática otra vez, solo que hacia abajo.
 *
 *   La cifra exacta depende de la interlínea que herede el producto, así que
 *   lo que esta pieza garantiza no es un número: es que **la fila no crece**
 *   con lo que se cargue. Con uno, con cinco y con ninguno mide lo mismo.
 *
 * LO QUE NO SE RECORTA NUNCA es la extensión: cortar «boleta-…-2026.pdf» por
 * el final se lleva justo el dato que dice qué es el archivo.
 *
 * SE COMPONE, no se reconstruye: el disparador y el tachito son `Boton`; el
 * icono, `Icono`. Lo único propio es el andamiaje de la fila, que no existía.
 */

import { Boton } from '../Boton';
import { Icono } from '../Icono';

/** Cuántos adjuntos se pintan antes de pasar a contarlos. Tres caben a 390 px
 *  junto al disparador; el cuarto ya empuja. */
export const TOPE_VISIBLE = 3;

export type FilaCargaProps = {
  /** Siempre visible, como en cualquier campo: el rótulo no es el placeholder. */
  etiqueta: React.ReactNode;
  /** Para que el disparador pueda señalarla con `aria-describedby`. */
  idEtiqueta?: string;
  /** El botón que abre. Lo monta cada carga con su icono y su texto. */
  disparador: React.ReactNode;
  /** Los `<li>` ya montados — `AdjuntoImagen` o `AdjuntoArchivo`. */
  adjuntos?: React.ReactNode[];
  /**
   * Cuántos hay EN TOTAL. Se pasa aparte porque `adjuntos` puede venir ya
   * recortado por quien lo monta, y el contador tiene que decir la verdad.
   */
  total?: number;
  /** Qué se lee cuando no hay nada. Sin esto, la fila vacía no dice nada. */
  vacio?: React.ReactNode;
  /** A la derecha de lo cargado: «Ver los 5», «Cambiar»… */
  extra?: React.ReactNode;
  /** El panel que se despliega EN SU SITIO. Va debajo de la fila y empuja. */
  panel?: React.ReactNode;
  error?: string;
  idError?: string;
  /** Ayuda permanente: formatos, peso máximo, para qué se pide. */
  nota?: React.ReactNode;
  /** Para que el disparador pueda enlazarla con `aria-describedby`. */
  idNota?: string;
  /** El `input[type=file]` oculto y los diálogos. Fuera del flujo visible. */
  children?: React.ReactNode;
};

export function FilaCarga({
  etiqueta,
  idEtiqueta,
  disparador,
  adjuntos,
  total,
  vacio,
  extra,
  panel,
  error,
  idError,
  nota,
  idNota,
  children,
}: FilaCargaProps) {
  const lista = adjuntos ?? [];
  const cuantos = total ?? lista.length;
  const visibles = lista.slice(0, TOPE_VISIBLE);
  const ocultos = cuantos - visibles.length;

  return (
    <div className="cx">
      {/* LA FILA, Y EL RÓTULO VA DENTRO. Lo pidió el responsable con estas
          palabras —«Foto del trabajador · Cambiar foto · Foto del trabajador,
          todo en una sola línea»—: qué se pide, cómo se hace y qué hay ya, en
          un solo renglón de 36 px.

          Es la excepción declarada a la regla del formulario —la etiqueta va
          ENCIMA del campo—, y se sostiene porque aquí el rótulo no encabeza
          una caja de escribir: encabeza un mando. Es el mismo trato que ya
          reciben el filtro de la barra (`.top-filtros`) y el tamaño de página
          de la paginación (`.pgn`), que también son rótulo + control en línea. */}
      <div className="cx-fila">
        <span className="cx-et" id={idEtiqueta}>{etiqueta}</span>
        {disparador}
        {visibles.length > 0 && (
          <ul className="cx-adjuntos">
            {visibles}
            {/* Contar el sobrante en vez de envolverlo. El número dice que hay
                más; una tira que se sale por el borde no dice nada. */}
            {ocultos > 0 && <li className="cx-mas">+{ocultos}</li>}
          </ul>
        )}
        {/* `!panel` es un candado, no una comodidad. Una carga puede vaciar la
            fila mientras despliega su panel —para no listar dos veces lo
            mismo— y encender sin querer este mensaje: quedaría diciendo «ningún
            archivo» justo encima de un panel que enseña el archivo. Le pasó a
            `CargaPdf` y no vuelve a pasar aquí. */}
        {cuantos === 0 && vacio && !panel && <span className="cx-vacio">{vacio}</span>}
        {extra}
      </div>

      {/* El panel se despliega AQUÍ y empuja hacia abajo lo que venga después.
          No flota, no tapa el formulario. Al cerrar, todo vuelve a su sitio. */}
      {panel}

      {/* El error va antes que la nota: es lo que hay que resolver. */}
      {error && (
        <span className="cx-error" id={idError} role="alert">
          <Icono nombre="alerta" />
          {error}
        </span>
      )}
      {nota && <span className="cx-nota" id={idNota}>{nota}</span>}

      {children}
    </div>
  );
}

/** El tachito. Es `Boton`, no un botón nuevo: teclado, foco y altura ya
 *  resueltos, y el nombre del archivo va en el rótulo accesible porque cinco
 *  «Quitar» seguidos no le dicen nada a un lector de pantalla. */
function Quitar({ que, onQuitar }: { que: string; onQuitar: () => void }) {
  return (
    <Boton mini soloIcono variante="terciaria" aria-label={`Quitar ${que}`} onClick={onQuitar}>
      <Icono nombre="papelera" />
    </Boton>
  );
}

export type AdjuntoImagenProps = {
  url: string;
  /** Qué se ve. Va al `alt` cuando la miniatura no es pulsable. */
  alt: string;
  /**
   * Forma de la miniatura. Ninguna cambia el ALTO —22 px las tres—, porque lo
   * que no puede pasar es que la fila ocupe dos renglones:
   *
   *   cuadrada  lo normal.
   *   redonda   la foto de una persona, que en el resto del sistema se ve en
   *             círculo (`Avatar`). Aquí también, para que sea la misma
   *             persona con la misma pinta en la ficha, en la tabla y aquí.
   *   id        conserva la proporción ID-1 del carné: 35×22.
   */
  forma?: 'cuadrada' | 'redonda' | 'id';
  /** Si se puede abrir en grande. Entonces la miniatura ES un botón. */
  onVer?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onQuitar?: () => void;
};

/** Una imagen dentro de la fila: la miniatura y nada más. La miniatura no
 *  sirve para reconocer la imagen —a 22 px no se lee—, sirve para saber que
 *  hay algo puesto y cuál de los dos es. Reconocerla es lo que hace el visor. */
export function AdjuntoImagen({ url, alt, forma = 'cuadrada', onVer, onQuitar }: AdjuntoImagenProps) {
  // La clase se arma FUERA del className: una condición ahí dentro se la toma
  // por clase el candado de huérfanas, y con razón.
  const MODIFICADOR = { cuadrada: '', redonda: ' cx-mini-redonda', id: ' cx-mini-id' };
  const clasesMini = `cx-mini${MODIFICADOR[forma]}`;
  return (
    <li className="cx-adj cx-adj-img">
      {onVer ? (
        // Es un BOTÓN, no una imagen con onClick: se alcanza con el tabulador
        // y se abre con Enter como cualquier otro mando.
        <button type="button" className="cx-ver" aria-label={`Ver ${alt} en grande`} onClick={onVer}>
          <img className={clasesMini} src={url} alt="" />
        </button>
      ) : (
        <img className={clasesMini} src={url} alt={alt} />
      )}
      {onQuitar && <Quitar que={alt} onQuitar={onQuitar} />}
    </li>
  );
}

export type AdjuntoArchivoProps = {
  nombre: string;
  /** Ya formateado. La fila no sabe de bytes. */
  peso?: string;
  onQuitar?: () => void;
  /** Lo que cada carga quiera añadir — un `Chip` con el ahorro, por ejemplo. */
  children?: React.ReactNode;
};

/** Un archivo dentro de la fila: su icono, su nombre y su peso. */
export function AdjuntoArchivo({ nombre, peso, onQuitar, children }: AdjuntoArchivoProps) {
  // El corte es por el ÚLTIMO punto, y solo si no es el primer carácter:
  // `.gitignore` no tiene extensión, tiene nombre.
  const punto = nombre.lastIndexOf('.');
  const base = punto > 0 ? nombre.slice(0, punto) : nombre;
  const extension = punto > 0 ? nombre.slice(punto) : '';

  return (
    <li className="cx-adj">
      <Icono nombre="documento" />
      <span className="cx-arch">
        <span className="cx-nombre">{base}</span>
        {/* La extensión, entera y siempre. Ver la cabecera. */}
        {extension && <span className="cx-ext">{extension}</span>}
      </span>
      {peso && <span className="cx-peso">{peso}</span>}
      {children}
      {onQuitar && <Quitar que={nombre} onQuitar={onQuitar} />}
    </li>
  );
}
