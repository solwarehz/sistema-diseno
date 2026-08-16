/**
 * SEGMENTADO — dos o tres opciones excluyentes, en una sola línea
 *
 * R69 · Lo pidió Control Administrativos V2.0 y lo argumentó bien:
 *
 *   «Un dato sensible no se ve o no se ve. Tiene un punto medio, y es el que
 *    hace útil el sistema. Hoy usamos el interruptor, que solo tiene dos
 *    posiciones y nos obliga a mentir.»
 *
 * El caso: un cargo puede ver el documento COMPLETO (71602303), PARCIAL
 * (*****303) u OCULTO. Tres dígitos identifican a una persona en una lista y no
 * permiten reconstruir un documento. La regla que gobierna la pantalla entera
 * cabe en una frase suya: **cada dato sensible tiene una versión reducida que
 * sirve para trabajar, pero no para suplantar.**
 *
 * POR QUÉ NO ES `SeleccionMultiple` CON `modo="unica"`. Esa ya existe y también
 * es excluyente, pero es una **lista apilada**: una fila por opción, pensada
 * para leerse de arriba abajo una vez. Aquí el mismo control se repite en cinco
 * a diez filas de una tabla. Apilado son treinta filas para configurar cinco
 * campos, y a 390 px eso deja de ser una pantalla y pasa a ser un rollo. La
 * diferencia no es de estilo: es que una ocupa alto por opción y la otra ocupa
 * ancho, y a diez repeticiones eso decide si la pantalla existe.
 *
 * POR QUÉ EL EJEMPLO VA EN CADA OPCIÓN Y NO SOLO EN LA ELEGIDA. «Parcial» no
 * dice nada por sí solo. Si el ejemplo apareciera únicamente bajo la opción
 * activa, para saber qué concede «parcial» habría que **concederlo primero** —
 * cambiar un privilegio real de un cargo real para aprender qué significa—. El
 * ejemplo es la definición, y una definición se lee antes de elegir, no después.
 *
 * DOS O TRES, Y NO SIEMPRE LAS MISMAS. No todos los campos admiten los tres
 * niveles, y esto no es un hueco del componente: la dirección no tiene punto
 * medio —media dirección ya dice el barrio— y el documento no puede ocultarse
 * del todo, porque sin él dos personas con el mismo apellido son
 * indistinguibles. Un nivel que no aplica **no se pasa**. Un nivel que aplica
 * pero no se puede conceder se pasa `cerrado` (ver abajo), que es otra cosa.
 */

import { useId } from 'react';
import { Icono } from './Icono';

export type OpcionSegmento = {
  valor: string;
  /** Lo que se lee: «Completo», «Parcial», «Oculto». */
  texto: string;
  /**
   * Qué concede, con un ejemplo real: `*****303`, `34 años`, `SUÁREZ M.`
   *
   * Se pinta en monoespaciada porque casi siempre es un dato enmascarado y en
   * proporcional los asteriscos no se cuentan de un vistazo.
   */
  ejemplo?: React.ReactNode;
  /**
   * R66 · CERRADO POR REGLA, aquí por nivel y no por control entero.
   *
   * El caso que lo pide es el suyo, y es de seguridad: **quien reparte
   * privilegios no puede conceder uno que lo iguale a él mismo**. Eso no cierra
   * el campo, cierra un nivel — un jefe de sede que ve el documento en parcial
   * puede conceder parcial y oculto, y no completo—.
   *
   * El nivel **no desaparece**: si desapareciera, quien reparte no entendería
   * por qué su lista no coincide con la de al lado, y lo leería como una carga
   * a medias. Y **no se pinta apagado**: apagado se lee «ahora no, vuelve
   * luego», e invita a buscar la forma de encenderlo. Se pinta cerrado, con el
   * motivo, que es la mitad del estado.
   *
   * Deja de ser un control: no es un botón de opción desactivado, es texto que
   * dice qué hay y por qué no se puede. Un control que no puede cambiar nunca
   * no es un control.
   */
  cerrado?: string;
};

export type SegmentadoProps = {
  /** El nombre del dato: «Documento», «Fecha de nacimiento». Va al `legend`. */
  etiqueta: React.ReactNode;
  /**
   * A qué pertenece esto, solo para el lector de pantalla: «Trabajadores».
   *
   * En pantalla el grupo ya lo dice el encabezado de la sección; repetirlo en
   * cada fila sería ruido. Con lector de pantalla ese encabezado puede quedar
   * lejos, y «Documento, completo» sin más no dice de qué cargo ni de qué
   * grupo. Se antepone al rótulo dentro del `legend`, oculto a la vista.
   */
  contexto?: string;
  /** Dos o tres. Más de tres no cabe a 390 px y deja de ser un segmentado. */
  opciones: OpcionSegmento[];
  valor: string;
  onCambio: (valor: string) => void;
  /** Temporal: «ahora no». Para lo permanente está `cerrado`. */
  deshabilitado?: boolean;
  /** R66 · El control entero cerrado por regla, con su motivo. */
  cerrado?: string;
};

export function Segmentado({
  etiqueta, contexto, opciones, valor, onCambio, deshabilitado = false, cerrado,
}: SegmentadoProps) {
  const id = useId();

  // Control entero cerrado. Mismo trato que el Interruptor en R66 y por el
  // mismo motivo: no hay control que etiquetar, así que no hay `fieldset` ni
  // `legend` — es una fila de texto con el rótulo y el porqué.
  if (cerrado) {
    return (
      <div className="sg sg-cerrado">
        <span className="sg-et">
          {contexto && <span className="sr-solo">{contexto} · </span>}
          {etiqueta}
        </span>
        <span className="sg-barra-cerrada">
          <span className="sg-candado">
            <Icono nombre="candado" tam="control" />
          </span>
          <span className="sg-motivo">{cerrado}</span>
        </span>
      </div>
    );
  }

  return (
    // `fieldset` + `legend` y botones de opción nativos: es lo que da las
    // flechas del teclado y el foco itinerante sin escribirlos. Un grupo de
    // `aria-pressed` a mano obliga a tabular opción por opción, que a diez
    // filas son treinta tabulaciones para llegar al final.
    <fieldset className={`sg${deshabilitado ? ' sg-desh' : ''}`}>
      <legend className="sg-et">
        {contexto && <span className="sr-solo">{contexto} · </span>}
        {etiqueta}
      </legend>
      <div className="sg-barra">
        {opciones.map((o) => {
          const idOp = `${id}-${o.valor}`;

          if (o.cerrado) {
            return (
              <span className="sg-op sg-op-cerrada" key={o.valor}>
                <span className="sg-candado">
                  <Icono nombre="candado" tam="control" />
                </span>
                <span className="sg-txt">{o.texto}</span>
                <span className="sg-motivo">{o.cerrado}</span>
              </span>
            );
          }

          return (
            <label className="sg-op" key={o.valor} htmlFor={idOp}>
              <input
                id={idOp}
                className="sg-in"
                type="radio"
                name={id}
                value={o.valor}
                checked={valor === o.valor}
                // El nombre sale del rótulo SOLO, y el ejemplo va de
                // descripción. Sin esto el ejemplo cae dentro del nombre —el
                // `<label>` envuelve a los dos— y el lector anuncia «Completo
                // 71602303» y acto seguido «71602303» otra vez.
                aria-labelledby={`${idOp}-txt`}
                aria-describedby={o.ejemplo ? `${idOp}-ej` : undefined}
                // aria-disabled y no `disabled`: el nativo saca el control del
                // orden de tabulación y su estado se vuelve indescubrible con
                // teclado. Mismo criterio que el Interruptor.
                aria-disabled={deshabilitado || undefined}
                onChange={() => !deshabilitado && onCambio(o.valor)}
              />
              <span className="sg-txt" id={`${idOp}-txt`}>{o.texto}</span>
              {o.ejemplo && (
                <span className="sg-ej mono" id={`${idOp}-ej`}>{o.ejemplo}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
