/**
 * RANGO DE FECHAS
 *
 * Rehecho en React porque el del catálogo acumulaba cuatro de los seis críticos
 * de la auditoría de patrones accesibles:
 *
 *   · no implementaba NI UNA tecla del patrón `date picker dialog` de la APG
 *   · los ~60 días eran 60 paradas de tabulación seguidas, sin roving tabindex
 *   · volver al campo «Desde» BORRABA el rango en silencio
 *   · `aria-current="date"` marcaba los extremos, cuando significa «hoy»
 *
 * El teclado no es un extra de este componente: es la mitad de su trabajo.
 *
 * Los estilos vienen de `componentes.css`. Aquí van marcado y comportamiento.
 */

import { useEffect, useMemo, useRef, useState, useId } from 'react';
import { Boton } from './Boton';

export type RangoFechaProps = {
  /** Etiqueta del conjunto. Obligatoria: dos campos sin nombre común no se
   *  entienden al navegar por formulario. */
  titulo: string;
  desde?: string | null;
  hasta?: string | null;
  onCambio?: (r: { desde: string | null; hasta: string | null }) => void;
  /** Primer día de la semana. En Perú, lunes. */
  primerDia?: 0 | 1;
  /** Hoy, inyectable para poder probarlo sin depender del reloj. */
  hoy?: Date;
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_CORTOS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deIso = (s: string) => {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
};
const mismoDia = (a: Date, b: Date) => iso(a) === iso(b);
const sumarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sumarMeses = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());

/** Texto largo para el lector: «lunes 3 de marzo de 2026». */
const enPalabras = (d: Date) =>
  `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;

export function RangoFecha({
  titulo,
  desde: desdeProp = null,
  hasta: hastaProp = null,
  onCambio,
  primerDia = 1,
  hoy = new Date(),
}: RangoFechaProps) {
  const id = useId();
  const [desde, setDesde] = useState<string | null>(desdeProp);
  const [hasta, setHasta] = useState<string | null>(hastaProp);
  const [abierto, setAbierto] = useState(false);
  /** Qué extremo se está eligiendo. */
  const [modo, setModo] = useState<'desde' | 'hasta'>('desde');
  /** El día que tiene el foco dentro de la rejilla. Es lo que mueve el teclado
   *  y lo único con tabindex=0: eso es el roving tabindex. */
  const [foco, setFoco] = useState<Date>(() => (desdeProp ? deIso(desdeProp) : hoy));
  const rejilla = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const debeEnfocar = useRef(false);

  // El foco se mueve DESPUÉS de pintar, o se enfocaría un nodo que aún no
  // existe cuando el mes cambia.
  useEffect(() => {
    if (!abierto || !debeEnfocar.current) return;
    debeEnfocar.current = false;
    rejilla.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  });

  function abrir(cual: 'desde' | 'hasta') {
    // NO se borra nada al abrir. El del catálogo hacía `ini = null; fin = null`
    // aquí, así que un simple Shift+Tab de vuelta destruía la selección sin
    // avisar. Abrir es abrir.
    setModo(cual);
    setFoco(cual === 'hasta' && hasta ? deIso(hasta) : desde ? deIso(desde) : hoy);
    setAbierto(true);
    debeEnfocar.current = true;
  }

  function cerrar(devolverFoco = true) {
    setAbierto(false);
    // El foco vuelve al campo que abrió, siempre. En el del catálogo hacía
    // `blur()` y el foco caía a <body>.
    if (devolverFoco) disparador.current?.focus();
  }

  function elegir(d: Date) {
    const s = iso(d);
    if (modo === 'desde') {
      const nuevoHasta = hasta && deIso(hasta) < d ? null : hasta;
      setDesde(s);
      setHasta(nuevoHasta);
      onCambio?.({ desde: s, hasta: nuevoHasta });
      // Encadena al segundo extremo sin cerrar: es lo que se espera al elegir
      // un rango, y evita reabrir.
      setModo('hasta');
    } else {
      // Elegir un «hasta» anterior al «desde» reinicia el rango en vez de
      // producir un rango invertido, que no significa nada.
      if (desde && d < deIso(desde)) {
        setDesde(s);
        setHasta(null);
        onCambio?.({ desde: s, hasta: null });
        setModo('hasta');
        return;
      }
      setHasta(s);
      onCambio?.({ desde, hasta: s });
      cerrar();
    }
  }

  function teclas(e: React.KeyboardEvent) {
    const salto: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    if (e.key in salto) {
      e.preventDefault();
      setFoco((f) => sumarDias(f, salto[e.key]));
      debeEnfocar.current = true;
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      // Principio y fin de la SEMANA, que es lo que dice el patrón.
      setFoco((f) => {
        const dow = (f.getDay() - primerDia + 7) % 7;
        return sumarDias(f, e.key === 'Home' ? -dow : 6 - dow);
      });
      debeEnfocar.current = true;
      return;
    }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      // Con Shift, un año. Sin Shift, un mes.
      const n = e.key === 'PageUp' ? -1 : 1;
      setFoco((f) => sumarMeses(f, e.shiftKey ? n * 12 : n));
      debeEnfocar.current = true;
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cerrar();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      elegir(foco);
    }
  }

  const semanas = useMemo(() => {
    const primero = new Date(foco.getFullYear(), foco.getMonth(), 1);
    const hueco = (primero.getDay() - primerDia + 7) % 7;
    const inicio = sumarDias(primero, -hueco);
    return Array.from({ length: 6 }, (_, s) =>
      Array.from({ length: 7 }, (_, d) => sumarDias(inicio, s * 7 + d))
    );
  }, [foco, primerDia]);

  const dDesde = desde ? deIso(desde) : null;
  const dHasta = hasta ? deIso(hasta) : null;
  const dentroDelRango = (d: Date) => !!(dDesde && dHasta && d > dDesde && d < dHasta);
  const esExtremo = (d: Date) => !!((dDesde && mismoDia(d, dDesde)) || (dHasta && mismoDia(d, dHasta)));

  const cabecera = `${MESES[foco.getMonth()]} de ${foco.getFullYear()}`;

  return (
    <div className="fc">
      {/* Los dos disparadores NO son <Campo>, y es a proposito. Campo renderiza
          un <input>, y un input no abre un dialogo: esto tiene que SER un
          boton -aria-haspopup, aria-expanded, teclado de boton- y PARECER un
          campo. Se toma la superficie de .campo, que es estilo, no componente.
          Es la unica excepcion a la regla 1 de la politica, y esta aqui escrita
          para que se discuta si alguien la ve, no para que pase inadvertida. */}
      <div className="fc-campos" role="group" aria-label={titulo}>
        <button
          type="button"
          ref={modo === 'desde' ? disparador : undefined}
          className="campo fc-campo"
          aria-haspopup="dialog"
          aria-expanded={abierto && modo === 'desde'}
          onClick={() => abrir('desde')}
        >
          <span className="fc-campo-et">Desde</span>
          <span className="fc-campo-val">{desde ?? 'Elegir fecha'}</span>
        </button>
        <button
          type="button"
          ref={modo === 'hasta' ? disparador : undefined}
          className="campo fc-campo"
          aria-haspopup="dialog"
          aria-expanded={abierto && modo === 'hasta'}
          onClick={() => abrir('hasta')}
        >
          <span className="fc-campo-et">Hasta</span>
          <span className="fc-campo-val">{hasta ?? 'Elegir fecha'}</span>
        </button>
      </div>

      {abierto && (
        <div className="fc-cal" role="dialog" aria-modal="false" aria-label={`Elegir fecha ${modo}`}>
          <div className="fc-cal-cab">
            <Boton mini variante="terciaria"
              aria-label="Mes anterior"
              onClick={() => { setFoco((f) => sumarMeses(f, -1)); debeEnfocar.current = true; }}>‹</Boton>
            {/* El cambio de mes se anuncia: sin esto, con lector de pantalla la
                rejilla cambia entera en silencio. */}
            <span className="fc-titulo" id={`${id}-mes`} aria-live="polite">{cabecera}</span>
            <Boton mini variante="terciaria"
              aria-label="Mes siguiente"
              onClick={() => { setFoco((f) => sumarMeses(f, 1)); debeEnfocar.current = true; }}>›</Boton>
          </div>

          <div
            className="fc-dias"
            role="grid"
            aria-labelledby={`${id}-mes`}
            ref={rejilla}
            onKeyDown={teclas}
          >
            <div role="row" className="fc-cabeceras">
              {Array.from({ length: 7 }, (_, i) => {
                const dow = (primerDia + i) % 7;
                return (
                  <span role="columnheader" key={dow} className="fc-dow" aria-label={DIAS_LARGOS[dow]}>
                    {DIAS_CORTOS[dow]}
                  </span>
                );
              })}
            </div>
            {semanas.map((semana, s) => (
              <div role="row" key={s}>
                {semana.map((d) => {
                  const otroMes = d.getMonth() !== foco.getMonth();
                  const enFoco = mismoDia(d, foco);
                  const extremo = esExtremo(d);
                  const dentro = dentroDelRango(d);
                  return (
                    <span role="gridcell" key={iso(d)} aria-selected={extremo || dentro}>
                      <button
                        type="button"
                        // Roving tabindex: UNO solo es alcanzable con Tab. Antes
                        // eran ~60 paradas seguidas.
                        tabIndex={enFoco ? 0 : -1}
                        className={[
                          'fc-dia',
                          otroMes ? 'fc-otro-mes' : '',
                          extremo ? 'fc-extremo' : '',
                          dentro ? 'fc-dentro' : '',
                        ].filter(Boolean).join(' ')}
                        // «hoy» es aria-current="date". Los extremos son
                        // aria-selected. El del catálogo los confundía.
                        aria-current={mismoDia(d, hoy) ? 'date' : undefined}
                        // El interior del rango se decía SOLO con color, que es
                        // SC 1.4.1. Ahora va en el nombre accesible.
                        aria-label={`${enPalabras(d)}${dentro ? ', dentro del rango' : ''}${extremo ? ', extremo del rango' : ''}`}
                        onClick={() => elegir(d)}
                      >
                        {d.getDate()}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="fc-pie">
            <Boton mini variante="destructiva"
              onClick={() => { setDesde(null); setHasta(null); onCambio?.({ desde: null, hasta: null }); setModo('desde'); }}>
              Limpiar
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
