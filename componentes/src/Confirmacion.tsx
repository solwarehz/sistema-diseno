/**
 * CONFIRMACIÓN EN LÍNEA
 *
 * El sistema rechaza el diálogo modal a propósito: en un teléfono rompe el
 * botón «atrás» y atrapa el foco. La banda EMPUJA el contenido, no lo tapa.
 *
 * La decisión estaba bien y la implementación del catálogo incumplía tres de
 * sus propias cinco reglas:
 *
 *   · el foco NUNCA volvía al origen —ni al cancelar, ni con Escape, ni al
 *     confirmar—, porque el repintado destruía el nodo guardado y acababa en
 *     <body>
 *   · la región viva se registraba DESPUÉS de escribir el contenido, así que
 *     no disparaba anuncio
 *   · `role="region"` sin nombre accesible
 *
 * Aquí el foco se devuelve siempre, y se prueba.
 */

import { useEffect, useRef, useId } from 'react';
import { Boton } from './Boton';

export type ConfirmacionProps = {
  abierta: boolean;
  /** Qué se va a hacer, en una frase. «Eliminar a Rosa Quispe». */
  titulo: string;
  /** La consecuencia, si no es obvia. */
  detalle?: string;
  /** Texto del botón que ejecuta. Nombra la ACCIÓN, nunca «Aceptar»: quien lee
   *  solo el botón tiene que saber qué va a pasar. */
  accion: string;
  /** El elemento que abrió la banda. El foco vuelve aquí al cerrar, pase lo que
   *  pase. Es obligatorio: sin él, cerrar deja el foco en el limbo. */
  origen: React.RefObject<HTMLElement>;
  onConfirmar: () => void;
  onCancelar: () => void;
  /** Solo para lo irreversible. Lo reversible se hace y se ofrece «Deshacer». */
  destructiva?: boolean;
  /**
   * Dónde arranca el foco al abrirse. **Por omisión, «cancelar».**
   *
   * No es una preferencia: es una salvaguarda. Con el foco en la acción, un
   * Enter por costumbre —la tecla que acababa de pulsarse para llegar aquí—
   * ejecuta lo irreversible, y nadie lo nota hasta que alguien borra algo.
   * Arrancando en cancelar, llegar a la acción exige ir a propósito.
   *
   * Lo reportó Control Administrativos V2.0: su versión ya lo hacía así y
   * adoptar la nuestra les habría quitado la protección. Tenían razón, y por
   * eso el valor por omisión cambia para TODOS los proyectos en vez de quedar
   * en una opción que hay que acordarse de poner.
   */
  focoInicial?: 'accion' | 'cancelar';
};

export function Confirmacion({
  abierta,
  titulo,
  detalle,
  accion,
  origen,
  onConfirmar,
  onCancelar,
  destructiva = true,
  focoInicial = 'cancelar',
}: ConfirmacionProps) {
  const id = useId();
  const banda = useRef<HTMLDivElement>(null);
  const botonAccion = useRef<HTMLButtonElement>(null);
  const botonCancelar = useRef<HTMLButtonElement>(null);

  // El foco entra en la banda al aparecer. Regla 2 del documento.
  // Y entra en la opción SEGURA salvo que se pida lo contrario.
  useEffect(() => {
    if (!abierta) return;
    const destino = focoInicial === 'accion' ? botonAccion : botonCancelar;
    destino.current?.focus();
  }, [abierta, focoInicial]);

  /** Cerrar SIEMPRE devuelve el foco. Es la regla que el catálogo incumplía en
   *  sus tres salidas. */
  const cerrar = (fn: () => void) => {
    fn();
    // Al siguiente cuadro: si se enfoca antes de que el consumidor desmonte la
    // banda, el navegador puede devolver el foco a <body> al quitarla.
    queueMicrotask(() => origen.current?.focus());
  };

  if (!abierta) return null;

  return (
    <div
      ref={banda}
      className={`cf-banda${destructiva ? ' cf-destructiva' : ''}`}
      // Los atributos van en el MARCADO, no se añaden después de escribir el
      // contenido: una región viva registrada tras la mutación no anuncia nada.
      role="region"
      aria-live="assertive"
      aria-labelledby={`${id}-tit`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cerrar(onCancelar);
        }
      }}
    >
      <div className="cf-banda-in">
        <div className="cf-txt">
          <strong id={`${id}-tit`} className="cf-nom">{titulo}</strong>
          {detalle && <span className="cf-meta">{detalle}</span>}
        </div>
        <div className="cf-acciones">
          <Boton
            ref={botonAccion}
            mini
            variante={destructiva ? 'destructiva' : 'principal'}
            onClick={() => cerrar(onConfirmar)}
          >
            {accion}
          </Boton>
          <Boton ref={botonCancelar} mini variante="neutra" onClick={() => cerrar(onCancelar)}>
            Cancelar
          </Boton>
        </div>
      </div>
    </div>
  );
}
