/**
 * MENSAJE EN FLUJO — R83
 *
 * Un mensaje con intención que vive DENTRO de la página, no flotando encima.
 * Se queda donde se pone: bajo un formulario, sobre una tabla, al pie de un
 * paso. No se cierra ni se desvanece.
 *
 * ── QUÉ LO DIFERENCIA DE LOS OTROS DOS ──────────────────────────────────────
 *
 *   `Aviso`   flota, tiene tono y SE VA solo. Es para lo que acaba de pasar.
 *   `Nota`    está en flujo y se queda, pero es NEUTRA: explica, no señala.
 *   `Mensaje` está en flujo, se queda, y TIENE tono. Es el hueco que faltaba.
 *
 * Existía el CSS de los cuatro tonos y no existía la pieza, así que cada
 * pantalla que no conociera el apaño ajeno volvía a dibujar su caja a mano.
 * Control Administrativos V2.0 lo midió: **seis mensajes en tres pantallas**.
 * No era una incomodidad teórica.
 *
 * ── EL GLIFO NO ES ADORNO ───────────────────────────────────────────────────
 *
 * El tono se decía solo con color, y eso incumple SC 1.4.1: quien no distingue
 * el rojo del ámbar no sabe si lo que lee es un fallo o una advertencia. El
 * glifo es la señal **no cromática**.
 *
 * Va oculto al lector de pantalla, como todo icono del sistema — quien nombra
 * es el texto—. Para quien usa lector, el canal equivalente es el `role`.
 *
 * ── STATUS O ALERT ──────────────────────────────────────────────────────────
 *
 * `status` espera turno; `alert` interrumpe lo que se esté leyendo. Por omisión
 * el error interrumpe y el resto espera, que es lo que casi siempre se quiere.
 * Se puede forzar con `urgencia` porque hay casos legítimos en los dos
 * sentidos: un error ya leído que solo se repite no debe volver a interrumpir,
 * y un aviso de que la sesión caduca en un minuto sí.
 */

import { Icono, type NombreIcono } from './Icono';

export type IntencionMensaje = 'exito' | 'aviso' | 'error' | 'info';

/** El glifo de cada intención. Los cuatro ya existían salvo `informacion`. */
const GLIFO: Record<IntencionMensaje, NombreIcono> = {
  exito: 'visto',
  aviso: 'alerta',
  // El aspa. Es el mismo trazo que el de cerrar, y no es un descuido: lo que
  // significa aquí lo dice el texto, y el icono va oculto al lector. Dibujar
  // un aspa distinta para el error daría dos iconos para la misma forma.
  error: 'cerrar',
  info: 'informacion',
};

export type MensajeProps = {
  intencion: IntencionMensaje;
  children: React.ReactNode;
  /** Primera frase en negrita. Lo que se lee cuando no se lee el resto. */
  titulo?: string;
  /** `status` espera turno · `alert` interrumpe. Por omisión, error interrumpe. */
  urgencia?: 'status' | 'alert';
  className?: string;
};

export function Mensaje({
  intencion, children, titulo, urgencia, className = '',
}: MensajeProps) {
  const rol = urgencia ?? (intencion === 'error' ? 'alert' : 'status');
  return (
    <div
      className={['msj', `msj-${intencion}`, className].filter(Boolean).join(' ')}
      role={rol}
    >
      <span className="msj-ico">
        <Icono nombre={GLIFO[intencion]} tam="control" />
      </span>
      <span className="msj-txt">
        {titulo && <strong>{titulo}</strong>}
        {titulo && ' '}
        {children}
      </span>
    </div>
  );
}
