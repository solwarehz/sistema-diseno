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
  /**
   * EL PANEL DE PERIODOS, que el catálogo publica desde siempre y el
   * componente no entregaba. Por omisión los cuatro del catálogo.
   *
   * Se puede sustituir —un colegio piensa en bimestres, no en trimestres
   * naturales— y se puede quitar con `atajos={[]}`. Lo que no se puede es
   * tenerlo a medias: o hay panel o no lo hay.
   */
  atajos?: AtajoRango[];
  /** Cuántos meses se ven a la vez. Dos por omisión, que es lo que el catálogo
   *  enseña y lo que hace falta para elegir un rango sin navegar a ciegas. */
  meses?: 1 | 2;
};

/** Un periodo del panel. `rango` recibe «hoy» para poder probarlo sin reloj. */
export type AtajoRango = {
  texto: string;
  rango: (hoy: Date) => { desde: Date; hasta: Date };
};

const finDeMes = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const inicioDeMes = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Los cuatro del catálogo, en su mismo orden. */
export const ATAJOS_POR_OMISION: AtajoRango[] = [
  { texto: 'Este mes', rango: (h) => ({ desde: inicioDeMes(h), hasta: finDeMes(h) }) },
  { texto: 'Mes pasado', rango: (h) => {
      const m = sumarMeses(inicioDeMes(h), -1);
      return { desde: inicioDeMes(m), hasta: finDeMes(m) };
    } },
  { texto: 'Últimos 2 meses', rango: (h) => ({
      desde: inicioDeMes(sumarMeses(inicioDeMes(h), -1)), hasta: finDeMes(h) }) },
  { texto: 'Este año', rango: (h) => ({
      desde: new Date(h.getFullYear(), 0, 1), hasta: new Date(h.getFullYear(), 11, 31) }) },
];

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
/**
 * R129 · SUMAR MESES SIN DESBORDAR. `new Date(a, m+n, 31)` con destino en un mes
 * de 30 desborda al siguiente: PageDown desde el 31 de enero aterrizaba el 3 de
 * marzo —febrero entero saltado— y PageUp desde el 31 de marzo no se movía. El
 * día se recorta al último del mes destino, que es lo que hace cualquier
 * calendario. Los cuatro atajos ya estaban a salvo porque parten de día 1.
 */
const sumarMeses = (d: Date, n: number) => {
  const a = d.getFullYear();
  const m = d.getMonth() + n;
  const ultimo = new Date(a, m + 1, 0).getDate();
  return new Date(a, m, Math.min(d.getDate(), ultimo));
};

/**
 * R130.2 · EL FORMATO QUE SE MUESTRA, que este componente no aplicaba.
 *
 * La tabla «Formato» del catalogo lo dice desde siempre: se MUESTRA 31/03/2026,
 * se GUARDA 2026-03-31. El disparador imprimia el valor tal cual y en pantalla
 * salia el ISO — el formato de guardar, ensenado a quien mira.
 *
 * Lo grave no es el despiste: es que este mismo archivo YA formateaba. El
 * resumen usaba `enPalabras` y el disparador no usaba nada. Una superficie del
 * mismo componente cumplia la regla y la otra no.
 *
 * Y se resuelve AQUI y no en cada producto. El contrato de la propiedad es ISO
 * —y esta bien que lo sea, porque es lo que se guarda—, asi que el formateo al
 * pintar le toca al componente. Si lo hace cada pantalla por su cuenta,
 * acabaran habiendo tantos formatos como pantallas, que es exactamente lo que
 * un sistema de diseno existe para evitar.
 */
const enCorto = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

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
  atajos = ATAJOS_POR_OMISION,
  meses = 2,
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
  /** El mes de la IZQUIERDA. Se separa de `foco` porque con dos meses a la
   *  vista el día enfocado puede estar en cualquiera de los dos, y la ventana
   *  solo se mueve cuando el foco se sale de ella. */
  const [mesBase, setMesBase] = useState<Date>(() =>
    inicioDeMes(desdeProp ? deIso(desdeProp) : hoy));
  /** R120 · el día sobrevolado, para pintar el rango que SALDRÍA. Es lo que la
   *  hoja llama `.fc-previo` y ningún producto podía activar. */
  const [sobre, setSobre] = useState<Date | null>(null);
  const rejilla = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const debeEnfocar = useRef(false);

  // El foco se mueve DESPUÉS de pintar, o se enfocaría un nodo que aún no
  // existe cuando el mes cambia.
  useEffect(() => {
    if (!abierto || !debeEnfocar.current) return;
    const nodo = rejilla.current?.querySelector<HTMLElement>('[tabindex="0"]');
    // Si el día enfocado todavía no está pintado, NO se consume la bandera: se
    // vuelve a intentar en el siguiente dibujado. Con dos meses a la vista esto
    // deja de ser teórico — saltar un año mueve la ventana, y esa mudanza es un
    // dibujado más. Consumiendo la bandera antes de encontrar el nodo, el foco
    // se perdía justo en los saltos largos.
    if (!nodo) return;
    debeEnfocar.current = false;
    nodo.focus();
  });

  function abrir(cual: 'desde' | 'hasta') {
    // NO se borra nada al abrir. El del catálogo hacía `ini = null; fin = null`
    // aquí, así que un simple Shift+Tab de vuelta destruía la selección sin
    // avisar. Abrir es abrir.
    setModo(cual);
    const d = cual === 'hasta' && hasta ? deIso(hasta) : desde ? deIso(desde) : hoy;
    setFoco(d);
    // La ventana se coloca al abrir, no de rebote por el efecto: así el primer
    // dibujado ya trae el mes correcto y no hay salto visible.
    setMesBase(inicioDeMes(d));
    setAbierto(true);
    debeEnfocar.current = true;
  }

  function cerrar(devolverFoco = true) {
    setAbierto(false);
    // R129 · se suelta el día sobrevolado. Solo se limpiaba con `mouseleave`,
    // así que cerrar con Escape o elegir con teclado dejaba medio mes pintado
    // como «dentro del rango» sin nadie encima.
    setSobre(null);
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

  /** Las seis semanas de UN mes, con hueco donde no hay día. El catálogo pinta
   *  huecos (`.fc-vacio`) y no días del mes vecino: con dos meses a la vista,
   *  el mismo día saldría dos veces y no se sabría cuál vale. */
  const semanasDe = useMemo(() => (mes: Date) => {
    const primero = inicioDeMes(mes);
    const hueco = (primero.getDay() - primerDia + 7) % 7;
    const ultimo = finDeMes(mes).getDate();
    const celdas: (Date | null)[] = [
      ...Array.from({ length: hueco }, () => null),
      ...Array.from({ length: ultimo }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
    ];
    while (celdas.length % 7) celdas.push(null);
    return Array.from({ length: celdas.length / 7 }, (_, w) => celdas.slice(w * 7, w * 7 + 7));
  }, [primerDia]);

  const visibles = useMemo(
    () => Array.from({ length: meses }, (_, i) => sumarMeses(mesBase, i)),
    [mesBase, meses],
  );

  // La ventana se mueve solo cuando el foco se sale de ella.
  useEffect(() => {
    const f = new Date(foco.getFullYear(), foco.getMonth(), 1).getTime();
    const dentro = visibles.some((m) => inicioDeMes(m).getTime() === f);
    if (!dentro) setMesBase(inicioDeMes(foco));
  }, [foco, visibles]);

  const dDesde = desde ? deIso(desde) : null;
  const dHasta = hasta ? deIso(hasta) : null;

  /** R120 · con «desde» puesto y eligiendo «hasta», el rango que saldría si se
   *  pulsara donde está el ratón. Sin esto no se ve qué se está a punto de
   *  elegir hasta después de elegirlo. */
  const previo = modo === 'hasta' && dDesde && !dHasta && sobre && sobre > dDesde ? sobre : null;
  const finEfectivo = dHasta ?? previo;

  const dentroDelRango = (d: Date) =>
    !!(dDesde && finEfectivo && d > dDesde && d < finEfectivo);
  // Ini y fin por separado: cada extremo redondea SU lado (.fc-ini / .fc-fin).
  // Fundidos en una sola clase, el rango pierde dónde empieza y dónde acaba.
  const esIni = (d: Date) => !!(dDesde && mismoDia(d, dDesde));
  const esFin = (d: Date) => !!(finEfectivo && mismoDia(d, finEfectivo));

  const tituloMes = (m: Date) => `${MESES[m.getMonth()]} de ${m.getFullYear()}`;
  const cabecera =
    visibles.length === 1
      ? tituloMes(visibles[0])
      : visibles[0].getFullYear() === visibles[visibles.length - 1].getFullYear()
        ? `${MESES[visibles[0].getMonth()]} – ${tituloMes(visibles[visibles.length - 1])}`
        : `${tituloMes(visibles[0])} – ${tituloMes(visibles[visibles.length - 1])}`;

  function aplicarAtajo(a: AtajoRango) {
    const r = a.rango(hoy);
    const d = r.desde;
    const h = r.hasta;
    setDesde(iso(d));
    setHasta(iso(h));
    onCambio?.({ desde: iso(d), hasta: iso(h) });
    setMesBase(inicioDeMes(meses === 1 ? h : sumarMeses(h, -1)));
    setFoco(d);
    cerrar();
  }

  /** El resumen que la hoja publica y nadie podía activar. Dice lo elegido en
   *  palabras: la línea de dos fechas ISO no se lee de un vistazo. */
  /* Las condiciones salen FUERA del array de clases. Dentro, el extractor lee
     `'desde'` y `'hasta'` de la comparación como si fueran nombres de clase, y
     las reporta como clases que nadie define. */
  const activoDesde = abierto && modo === 'desde';
  const activoHasta = abierto && modo === 'hasta';

  /**
   * R130.3 · SIN RANGO, EL RESUMEN CALLA — pero no desaparece.
   *
   * Decia «Sin rango elegido.» y era una tercera frase para lo mismo: los dos
   * disparadores ya dicen «Elegir fecha». Lo reporto Control Administrativos.
   *
   * De las dos salidas que proponian —una propiedad para apagarlo, o no pintar
   * nada— no se toma ninguna de las dos tal cual, y el motivo importa:
   *
   *  · Una propiedad no vale porque esta linea ES el anuncio al lector cuando
   *    se elige (regla 6). Apagarla seria dejar el componente sin decir lo que
   *    acaba de pasar, y eso no puede quedar a criterio de cada pantalla.
   *  · Y NO PINTAR NADA romperia el anuncio de la PRIMERA eleccion: una region
   *    viva creada en el momento no la anuncian la mayoria de lectores. Es la
   *    regla 0 de «Aviso temporal», que este sistema ya aprendio.
   *
   * Asi que el elemento se queda SIEMPRE en el arbol y lo que se vacia es su
   * texto. La region viva existe desde la carga, no se ve nada cuando no hay
   * nada, y `.fc-resumen:empty` le quita el margen para que no deje hueco.
   */
  const resumen = !desde
    ? ''
    : !hasta
      ? `Desde el ${enPalabras(deIso(desde))}. Falta la fecha final.`
      : `Del ${enPalabras(deIso(desde))} al ${enPalabras(deIso(hasta))}.`;

  return (
    <div className="fc-zona">
      {/* Los dos disparadores NO son <Campo>, y es a proposito. Campo renderiza
          un <input>, y un input no abre un dialogo: esto tiene que SER un
          boton -aria-haspopup, aria-expanded, teclado de boton- y PARECER un
          campo. Se toma la superficie de .campo, que es estilo, no componente.
          Es la unica excepcion a la regla 1 de la politica, y esta aqui escrita
          para que se discuta si alguien la ve, no para que pase inadvertida. */}
      <div className="fc-campos" role="group" aria-label={titulo}>
        {/* R130.1 · LA ETIQUETA VA FUERA DEL RECUADRO, como en todos los demas
            campos del sistema. Estaba DENTRO, y era la unica que lo estaba:
            `Campo` compone `.campo-grupo` > `.campo-etiqueta` + `.campo`, con
            el rotulo encima de la caja. Puestos en la misma fila, el rotulo de
            uno salia arriba y el del otro dentro, y las cajas ni siquiera
            median lo mismo. Lo reporto Control Administrativos.
            La hoja YA lo preveia: `.fc-campos .cg{ width:172px }` viajaba en el
            paquete desde siempre y NINGUN producto podia activarla, porque el
            componente no emitia ningun `.cg` ahi dentro. Una promesa muerta que
            el candado no vio por ser un descendiente y no dos clases juntas.
            El rotulo se ata al boton con `aria-labelledby` —un `<label>` no
            nombra a un boton—, y el nombre accesible sigue siendo «Desde
            01/09/2026», que es lo que se leia antes. */}
        <div className="cg">
          <span className="cg-et" id={`${id}-e-desde`}>Desde</span>
          <button
            type="button"
            ref={modo === 'desde' ? disparador : undefined}
            className={['campo', 'fc-campo', activoDesde ? 'fc-activo' : '']
              .filter(Boolean).join(' ')}
            aria-haspopup="dialog"
            aria-expanded={abierto && modo === 'desde'}
            aria-labelledby={`${id}-e-desde ${id}-v-desde`}
            onClick={() => abrir('desde')}
          >
            <span id={`${id}-v-desde`}>{desde ? enCorto(deIso(desde)) : 'Elegir fecha'}</span>
          </button>
        </div>
        {/* El guion entre los dos campos. La hoja lo entrega desde siempre y
            ningún producto lo emitía: los dos campos salían pegados, sin nada
            que dijera que son los dos extremos de una misma cosa. */}
        <span className="fc-guion" aria-hidden="true">
          <svg className="ic" viewBox="0 0 24 24" width="14" height="14" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
               strokeLinejoin="round" focusable="false">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
        <div className="cg">
          <span className="cg-et" id={`${id}-e-hasta`}>Hasta</span>
          <button
            type="button"
            ref={modo === 'hasta' ? disparador : undefined}
            className={['campo', 'fc-campo', activoHasta ? 'fc-activo' : '']
              .filter(Boolean).join(' ')}
            aria-haspopup="dialog"
            aria-expanded={abierto && modo === 'hasta'}
            aria-labelledby={`${id}-e-hasta ${id}-v-hasta`}
            onClick={() => abrir('hasta')}
          >
            <span id={`${id}-v-hasta`}>{hasta ? enCorto(deIso(hasta)) : 'Elegir fecha'}</span>
          </button>
        </div>
      </div>

      {abierto && (
        <div className="fc-cal" role="dialog" aria-modal="false" aria-label={`Elegir fecha ${modo}`}>
          <div className="fc-cal-cab">
            <Boton mini variante="terciaria"
              aria-label="Mes anterior"
              onClick={() => { setSobre(null); setMesBase((m) => sumarMeses(m, -1)); setFoco((f) => sumarMeses(f, -1)); debeEnfocar.current = true; }}>‹</Boton>
            {/* El cambio de mes se anuncia: sin esto, con lector de pantalla la
                rejilla cambia entera en silencio. */}
            <span className="fc-meses" id={`${id}-mes`} aria-live="polite">{cabecera}</span>
            <Boton mini variante="terciaria"
              aria-label="Mes siguiente"
              onClick={() => { setSobre(null); setMesBase((m) => sumarMeses(m, 1)); setFoco((f) => sumarMeses(f, 1)); debeEnfocar.current = true; }}>›</Boton>
          </div>

          {/* `.fc-cal-marco` reparte el cuerpo y el panel de periodos en dos
              columnas. La hoja lo entrega desde siempre; sin él, el panel caía
              debajo y el calendario perdía su forma. */}
          <div className="fc-cal-marco">
            <div
              className="fc-cal-cuerpo"
              ref={rejilla}
              onKeyDown={teclas}
              onMouseLeave={() => setSobre(null)}
            >
              {visibles.map((mes) => (
                <div key={`${mes.getFullYear()}-${mes.getMonth()}`}>
                  <div className="fc-mes-tit">{tituloMes(mes)}</div>
                  <div className="fc-dias" role="grid" aria-label={tituloMes(mes)}>
                    <div role="row" className="fc-sem">
                      {Array.from({ length: 7 }, (_, i) => {
                        const dow = (primerDia + i) % 7;
                        return (
                          <span role="columnheader" key={dow} aria-label={DIAS_LARGOS[dow]}>
                            {DIAS_CORTOS[dow]}
                          </span>
                        );
                      })}
                    </div>
                    {semanasDe(mes).map((semana, w) => (
                      <div role="row" key={w}>
                        {semana.map((d, i) => {
                          if (!d) {
                            return (
                              <span role="gridcell" key={`v${w}-${i}`}>
                                <span className="fc-d fc-vacio" />
                              </span>
                            );
                          }
                          const enFoco = mismoDia(d, foco);
                          const ini = esIni(d);
                          const fin = esFin(d);
                          const extremo = ini || fin;
                          const dentro = dentroDelRango(d);
                          const esPrevio = !!(previo && mismoDia(d, previo));
                          return (
                            <span role="gridcell" key={iso(d)} aria-selected={extremo || dentro}>
                              <button
                                type="button"
                                // Roving tabindex: UNO solo es alcanzable con Tab. Antes
                                // eran ~60 paradas seguidas.
                                tabIndex={enFoco ? 0 : -1}
                                className={[
                                  'fc-d',
                                  ini ? 'fc-ini' : '',
                                  fin ? 'fc-fin' : '',
                                  esPrevio ? 'fc-previo' : '',
                                  dentro ? 'fc-dentro' : '',
                                ].filter(Boolean).join(' ')}
                                // «hoy» es aria-current="date". Los extremos son
                                // aria-selected. El del catálogo los confundía.
                                aria-current={mismoDia(d, hoy) ? 'date' : undefined}
                                // El interior del rango se decía SOLO con color, que es
                                // SC 1.4.1. Ahora va en el nombre accesible.
                                aria-label={`${enPalabras(d)}${dentro ? ', dentro del rango' : ''}${extremo ? ', extremo del rango' : ''}`}
                                onMouseEnter={() => setSobre(d)}
                                onFocus={() => setSobre(d)}
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
                </div>
              ))}
            </div>

            {atajos.length > 0 && (
              <div className="fc-atajos">
                <span className="fc-atajos-tit" id={`${id}-per`}>Periodos</span>
                {atajos.map((a) => (
                  <button
                    type="button"
                    key={a.texto}
                    className="fc-atajo"
                    onClick={() => aplicarAtajo(a)}
                  >
                    {a.texto}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="fc-cal-pie">
            <Boton mini variante="destructiva"
              onClick={() => { setDesde(null); setHasta(null); onCambio?.({ desde: null, hasta: null }); setModo('desde'); }}>
              Limpiar
            </Boton>
          </div>
        </div>
      )}

      {/* Lo elegido, en palabras. Dos fechas ISO no se leen de un vistazo, y
          esta línea es además la que anuncia el cambio al lector. */}
      <p className="fc-resumen" role="status">{resumen}</p>
    </div>
  );
}
