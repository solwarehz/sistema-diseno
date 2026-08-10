/**
 * ESTADOS DE PANTALLA, AVISO TEMPORAL Y BARRA DE PROGRESO
 *
 * Los tres comparten una idea: comunican algo que la persona no pidió, así que
 * el cuidado está en CUÁNDO hablan y en qué NO dicen.
 */

import { useContext, useEffect, useRef, useState } from 'react';
import { Boton } from './Boton';
import { EnZonaAvisos } from './ZonaAvisos';

/* ── Estados de pantalla ─────────────────────────────────────────────────── */

/**
 * Siete, y NO son intercambiables. Los tres pares que se confunden:
 *   · «sin resultados» ofrece quitar filtros · «primera vez» ofrece crear
 *   · «error» ofrece Reintentar · «fallo» ofrece Recargar, porque reintentar un
 *     dibujado que reventó vuelve a reventar
 *   · «nunca consultado» no es «vacío»: aún no se ha pedido nada
 */
export type TipoEstado =
  | 'cargando' | 'nunca-consultado' | 'sin-resultados'
  | 'primera-vez' | 'error' | 'sin-permiso' | 'fallo-dibujado';

export type EstadoPantallaProps = {
  tipo: TipoEstado;
  titulo: string;
  linea?: string;
  /** Qué hacer a continuación. Ningún estado es un callejón sin salida: si no
   *  hay acción posible, la línea tiene que decir a quién acudir. */
  accion?: { texto: string; onClick: () => void };
  /** Código de referencia, solo en fallo de dibujado. Sin registro detrás es
   *  decoración: si no se puede buscar, no se pone. */
  referencia?: string;
};

export function EstadoPantalla({ tipo, titulo, linea, accion, referencia }: EstadoPantallaProps) {
  // Cargando se anuncia como ocupado; el resto es una región de estado.
  const vivo = tipo === 'cargando' ? 'polite' : 'polite';
  return (
    <div className={`ep ep-${tipo}`} role="status" aria-live={vivo} aria-busy={tipo === 'cargando'}>
      {tipo === 'cargando' ? (
        // Esqueleto, no un giro: da idea de la forma de lo que viene.
        <>
          {[38, 64, 52, 70].map((w, i) => (
            <div className="esqueleto" key={i} style={{ width: `${w}%` }} />
          ))}
          <span className="sr-solo">Cargando</span>
        </>
      ) : (
        <>
          <p className="ep-titulo">{titulo}</p>
          {linea && <p className="ep-linea">{linea}</p>}
          {referencia && <p className="ep-linea">Referencia: {referencia}</p>}
          {accion && (
            <Boton mini variante="principal" onClick={accion.onClick}>
              {accion.texto}
            </Boton>
          )}
        </>
      )}
    </div>
  );
}

/* ── Aviso temporal ──────────────────────────────────────────────────────── */

export type TonoAviso = 'exito' | 'aviso' | 'error' | 'info';

export type AvisoProps = {
  tono: TonoAviso;
  texto: string;
  /** Acción de vuelta atrás. «Deshacer» es lo que sustituye a preguntar. */
  accion?: { texto: string; onClick: () => void };
  onCerrar: () => void;
  /** Milisegundos. El error NO se va solo: duración 0. */
  duracion?: number;
};

export function Aviso({ tono, texto, accion, onCerrar, duracion }: AvisoProps) {
  // El error no se va solo aunque le pasen duración: algo no se hizo, y que
  // desaparezca deja seguir adelante sobre un estado falso.
  const ms = tono === 'error' ? 0 : duracion ?? 5000;
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (!ms || pausado) return;
    const t = setTimeout(onCerrar, ms);
    return () => clearTimeout(t);
  }, [ms, pausado, onCerrar]);

  // Dentro de ZonaAvisos el rol lo pone la zona —dos regiones hermanas que
  // existen desde la carga— y repetirlo aquí anidaría regiones vivas.
  const enZona = useContext(EnZonaAvisos);

  return (
    <div
      className={`av av-${tono}`}
      // Error interrumpe; el resto espera turno. Y van en zonas hermanas, no
      // anidadas: un role=alert dentro de una región polite se comporta distinto
      // en cada lector.
      role={enZona ? undefined : tono === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <span className="av-txt">{texto}</span>
      {accion && (
        <Boton mini variante="terciaria" className="av-accion" onClick={accion.onClick}>
          {accion.texto}
        </Boton>
      )}
      <button type="button" className="av-x" aria-label="Cerrar aviso" onClick={onCerrar}>×</button>
    </div>
  );
}

/* ── Barra de progreso ───────────────────────────────────────────────────── */

export type ProgresoProps = {
  /** Qué está pasando. Obligatorio: una barra sin nombre no dice de qué avanza. */
  etiqueta: string;
  /** 0 a 100. Sin valor, indeterminada. */
  valor?: number;
  /** Texto bajo la barra: «120 de 340 filas». */
  detalle?: string;
};

export function Progreso({ etiqueta, valor, detalle }: ProgresoProps) {
  const indeterminada = valor === undefined;
  return (
    <div className="pr-caja">
      <div className="pr-cab">
        <span>{etiqueta}</span>
        {!indeterminada && <span className="mono">{Math.round(valor)} %</span>}
      </div>
      <div
        className="pr"
        role="progressbar"
        aria-label={etiqueta}
        // Sin valores cuando es indeterminada: decir 0 sería mentir.
        aria-valuenow={indeterminada ? undefined : Math.round(valor)}
        aria-valuemin={indeterminada ? undefined : 0}
        aria-valuemax={indeterminada ? undefined : 100}
      >
        <div
          className={indeterminada ? 'pr-indet' : 'pr-relleno'}
          style={indeterminada ? undefined : { width: `${Math.min(100, Math.max(0, valor))}%` }}
        />
      </div>
      {detalle && <p className="pr-pie">{detalle}</p>}
    </div>
  );
}
