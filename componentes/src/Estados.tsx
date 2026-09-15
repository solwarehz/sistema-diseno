/**
 * ESTADOS DE PANTALLA, AVISO TEMPORAL Y BARRA DE PROGRESO
 *
 * Los tres comparten una idea: comunican algo que la persona no pidió, así que
 * el cuidado está en CUÁNDO hablan y en qué NO dicen.
 */

import { useContext, useEffect, useRef, useState } from 'react';
import { Boton } from './Boton';
import { EnZonaAvisos } from './ZonaAvisos';
import { Icono } from './Icono';

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
  | 'primera-vez' | 'error' | 'sin-permiso'
  /**
   * R81 · ACCESO SUSPENDIDO POR UNA CONDICIÓN DEL SERVICIO.
   *
   * No es `sin-permiso`, y la diferencia no es de matiz: cambia a quién se
   * manda a la persona. `sin-permiso` significa «tu cuenta no tiene este
   * privilegio» y su salida natural es hablar con quien administra la
   * aplicación. Aquí el privilegio existe y está **suspendido** por algo ajeno
   * a la aplicación —un contrato, un pago, una vigencia—, y el administrador
   * **no puede resolverlo**.
   *
   * Usar `sin-permiso` para esto manda a la gente a la puerta equivocada, y el
   * propio componente exige lo contrario: ningún estado es un callejón sin
   * salida, y si no hay acción posible la línea tiene que decir a quién acudir.
   * Con el tipo equivocado, esa línea dice a quién acudir MAL.
   *
   * Lo pidió Control Administrativos V2.0, que lo suplía tomando prestado
   * `sin-permiso`. El sistema no nombra a quién hay que acudir —eso es del
   * negocio de cada aplicación— pero sí obliga a decirlo.
   */
  | 'acceso-suspendido'
  | 'fallo-dibujado';

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
  /**
   * Milisegundos que **permanece**, sin contar la entrada ni la salida. El
   * error NO se va solo: duración 0.
   *
   * Sin valor, **sale de la hoja**: `--permanencia-aviso`. Así el día que un
   * producto quiera otro tiempo lo cambia en su CSS y vale para todos sus
   * avisos, en vez de pasar la misma prop en cada llamada.
   */
  duracion?: number;
};

/** Los 2s por omisión, en un solo sitio y con su porqué. */
const PERMANENCIA_POR_OMISION = 2000;

/**
 * LO QUE DURA UN AVISO SALE DE LA HOJA, y esto es la corrección de una promesa
 * muerta: `--permanencia-aviso` existía, el catálogo lo publicaba en su tabla
 * de tokens como «cuánto queda en pantalla un aviso temporal», y **no lo leía
 * nadie** — cero usos en toda la hoja—. El tiempo de verdad estaba escrito
 * aquí dentro, así que había dos fuentes y la documentada era la decorativa.
 *
 * Se lee al montar y no en el render: `getComputedStyle` necesita DOM, y este
 * componente se renderiza también en servidor.
 */
function permanenciaDeLaHoja(el: HTMLElement | null): number {
  if (!el || typeof getComputedStyle !== 'function') return PERMANENCIA_POR_OMISION;
  const crudo = getComputedStyle(el).getPropertyValue('--permanencia-aviso').trim();
  if (!crudo) return PERMANENCIA_POR_OMISION;
  const m = /^([\d.]+)(ms|s)$/.exec(crudo);
  if (!m) return PERMANENCIA_POR_OMISION;
  const n = Number(m[1]) * (m[2] === 's' ? 1000 : 1);
  return Number.isFinite(n) && n > 0 ? n : PERMANENCIA_POR_OMISION;
}

export function Aviso({ tono, texto, accion, onCerrar, duracion }: AvisoProps) {
  const caja = useRef<HTMLDivElement>(null);
  const [deLaHoja, setDeLaHoja] = useState(PERMANENCIA_POR_OMISION);
  useEffect(() => {
    // Sin cambio, sin re-render: React descarta el `setState` que devuelve lo
    // mismo, y con eso desaparece el aviso de `act(...)` que ensuciaba la
    // salida de dos archivos de prueba.
    const v = permanenciaDeLaHoja(caja.current);
    setDeLaHoja((p) => (p === v ? p : v));
  }, []);

  // El error no se va solo aunque le pasen duración: algo no se hizo, y que
  // desaparezca deja seguir adelante sobre un estado falso.
  const ms = tono === 'error' ? 0 : duracion ?? deLaHoja;
  const [pausado, setPausado] = useState(false);

  /**
   * Y SE VA DESVANECIÉNDOSE, no de golpe.
   *
   * Entraba animado y **salía de un fotograma a otro**: se llamaba a `onCerrar`
   * y el producto lo desmontaba. Un elemento que aparece con cuidado y
   * desaparece de golpe se lee como un fallo de pintado, que es exactamente el
   * motivo por el que se animó la entrada.
   *
   * La salida es **la entrada al revés**, sin clase nueva: se quita `.av-dentro`
   * y la transición que ya declara `.av` hace el resto. Una clase nueva habría
   * sido otra promesa que el componente tendría que acordarse de emitir.
   *
   * El desmontaje espera a que la transición acabe —`transitionend` de la
   * opacidad— con un plazo de respaldo por si no llega a correr: si el elemento
   * está oculto, si el navegador no dispara el evento o si alguien anula la
   * transición, el aviso se cierra igual. Con movimiento reducido las
   * duraciones caen a 0,01ms y esto se vuelve instantáneo solo.
   */
  const [saliendo, setSaliendo] = useState(false);
  const yaCerro = useRef(false);
  /* El efecto de salida vive entre renders, y `onCerrar` puede cambiar por el
     camino: sin esto se llamaba al de cuando empezó a salir. */
  const cerrarAhora = useRef(onCerrar);
  cerrarAhora.current = onCerrar;
  const salir = () => setSaliendo(true);

  useEffect(() => {
    if (!saliendo) return;
    const el = caja.current;
    const cerrar = () => {
      if (yaCerro.current) return;
      yaCerro.current = true;
      cerrarAhora.current();
    };
    const fin = (e: TransitionEvent) => {
      /* DEL AVISO, no de un hijo. `transitionend` burbujea, así que la
         transición de un botón que el producto meta dentro —su «Deshacer» es
         un nodo suyo— cerraba el aviso antes de tiempo. Con la hoja que viaja
         hoy no pasa, porque ningún hijo transiciona la opacidad; pasaría con
         cualquier hoja propia que lo hiciera. */
      if (e.target !== el || e.propertyName !== 'opacity') return;
      cerrar();
    };
    el?.addEventListener('transitionend', fin);
    /* RESPALDO. Si la transición no llega a correr —el elemento oculto, el
       producto con `transition: none`, o un entorno de prueba que no despacha
       el evento— el aviso se cierra igual. Es un tope, no el camino normal. */
    const respaldo = setTimeout(cerrar, 400);
    return () => { el?.removeEventListener('transitionend', fin); clearTimeout(respaldo); };
  }, [saliendo]);

  useEffect(() => {
    if (!ms || pausado || saliendo) return;
    const t = setTimeout(salir, ms);
    return () => clearTimeout(t);
  }, [ms, pausado, saliendo]);

  // Dentro de ZonaAvisos el rol lo pone la zona —dos regiones hermanas que
  // existen desde la carga— y repetirlo aquí anidaría regiones vivas.
  const enZona = useContext(EnZonaAvisos);

  /**
   * R50 · EL AVISO NACÍA INVISIBLE, Y NADIE LO VEÍA NUNCA.
   *
   * `.av` arranca con `opacity: 0` y `translateY(-16px)` para poder entrar
   * deslizando, y `.av-dentro` es lo que lo trae a la vista. El componente
   * **no la añadía nunca**: en el catálogo se veía porque allí la pone el guion
   * de la página, y en cada producto el aviso se montaba, ocupaba su sitio,
   * anunciaba al lector de pantalla… y no se veía. Ni uno.
   *
   * Lo reportó Control Administrativos V2.0, que lleva supliéndolo con una
   * pieza propia que recorre el DOM añadiendo la clase desde fuera. Con esto,
   * ese apaño sobra — y no chocan: React manda en `className`, así que añadir
   * una clase que ya está no hace nada.
   *
   * Va en un fotograma aparte a propósito. Poner la clase en el mismo en que
   * se inserta el elemento no anima: el navegador no llega a ver el estado
   * inicial y salta al final. Con movimiento reducido no importa, porque las
   * duraciones caen a 0,01ms y aparece de golpe igual.
   */
  const [dentro, setDentro] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDentro(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={caja}
      className={['av', `av-${tono}`, dentro && !saliendo ? 'av-dentro' : ''].filter(Boolean).join(' ')}
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
        /* Y AL PULSARLA, EL AVISO SE VA. «Deshacer» deshace lo que este aviso
           anuncia, así que dejarlo en pantalla es dejar escrito algo que ya no
           es verdad. El catálogo lo cerraba desde el principio y la entrega no:
           el mismo botón hacía dos cosas distintas según dónde se mirara. */
        <Boton mini variante="terciaria" className="av-accion"
          onClick={() => { accion.onClick(); salir(); }}>
          {accion.texto}
        </Boton>
      )}
      {/* Cerrar a mano también se desvanece: si no, el mismo aviso se iría de
          dos formas distintas según quién lo cerrara. */}
      {/* EL ICONO DEL SISTEMA, no el carácter `×`. La hoja lleva
          `.av-x .ic{ width:16px; height:16px }` desde siempre y **ningún
          producto podía activarla**: este era el único emisor de `.av-x` y
          pintaba un carácter. El catálogo sí dibujaba el icono, así que la ✕
          se veía de una forma en la demostración y de otra en la entrega. */}
      <button type="button" className="av-x" aria-label="Cerrar aviso" onClick={salir}>
        <Icono nombre="cerrar" tam="control" />
      </button>
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
