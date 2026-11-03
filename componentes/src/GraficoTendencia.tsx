/**
 * GRÁFICO DE TENDENCIA (R169)
 *
 * Un panel con el título, el valor grande del punto 0 y una línea de puntos
 * sobre un eje de «semanas atrás». SVG propio, sin librería. La app entrega los
 * puntos YA calculados y la función que escribe un número (`formato`); la pieza
 * solo los reparte en el espacio: posición de cada punto, tope y marcas del eje.
 *
 * Tres cosas que no se negocian:
 *  - El punto 0 va pegado al eje vertical (a ≤ 16 px) y el último es el más
 *    alejado: el orden del arreglo ES el orden de «semanas atrás».
 *  - El SVG es decoración (`aria-hidden`): la alternativa accesible es el
 *    contenedor enfocable con su texto, el `aria-live` y la tabla desplegable.
 *    La ventana y la tabla escriben el rango y el valor con la MISMA función
 *    (`textosPunto`), para que no puedan divergir.
 *  - El trazo se anima UNA sola vez, al abrir. Redibujar por el ancho o por
 *    nuevos `puntos` no lo repite.
 *
 * El ancho se mide en JavaScript sobre el propio contenedor (no hay
 * `@container` en el sistema); en una pantalla de dos columnas el panel mide la
 * mitad de la ventana y la ventana no dice nada de él.
 */
import {
  useEffect, useId, useLayoutEffect, useRef, useState,
  type KeyboardEvent, type PointerEvent, type ReactNode,
} from 'react';

export type PuntoTendencia = {
  /** Número que se dibuja. El índice 0 del arreglo es el periodo consultado. */
  valor: number;
  /** Rango de fechas, ya escrito: «19 oct – 25 oct». Sale en la ventana y en la tabla. */
  detalle: string;
};

export type GraficoTendenciaProps = {
  titulo: string;
  /** Siete en el tablero. El primero es el periodo actual y va pegado al eje. */
  puntos: PuntoTendencia[];
  /** Cómo se escribe un número en el eje, sobre los puntos y en la ventana: min o h:mm. */
  formato: (valor: number) => string;
  /** «min» o «hrs»: va junto al valor grande. */
  unidad: string;
  /** Unidad base del eje vertical: 1 por omisión; 60 con minutos escritos como h:mm, para que las marcas caigan en horas enteras. */
  base?: number;
  /** Chips que arma la app («▲ +72 min frente a la semana previa»). */
  comparaciones?: ReactNode;
  /** Línea punteada opcional. El valor y la etiqueta los calcula la app. */
  referencia?: { valor: number; etiqueta: string };
  /** Rótulo de la última columna de la tabla («Minutos», «Horas»). */
  columnaValor: string;
};

/** Desde este ancho de la PIEZA (no de la ventana) los puntos 1 a 6 llevan su valor encima. */
export const ANCHO_VALORES = 520;
/** Lo más que puede separarse el punto 0 del eje vertical. */
export const SEPARACION_EJE = 16;
const ANCHO_MINIMO = 280;
const MARCAS = 4;

const redondear = (n: number) => Math.round(n * 100) / 100;

// ── Geometría: funciones puras ───────────────────────────────────────────────

export type EscalaEje = { tope: number; paso: number; marcas: number[] };

/**
 * El tope del eje vertical, redondeado HACIA ARRIBA a un número «bonito», y las
 * cinco marcas (cero y cuatro más) equidistantes. Con `base` 60 las marcas caen
 * en horas enteras cuando los valores son minutos escritos como h:mm.
 *
 * Se deja un 12 % de aire sobre el máximo para que el punto más alto y su valor
 * no se peguen al borde. Un máximo 0, negativo o no numérico da el tope mínimo
 * (4 bases): el eje nunca es vacío ni se divide entre cero.
 */
export function escalaEje(maximo: number, base = 1): EscalaEje {
  const b = base > 0 && Number.isFinite(base) ? base : 1;
  const m = Number.isFinite(maximo) && maximo > 0 ? maximo : 0;
  const crudo = ((m / b) * 1.12) / MARCAS;
  let unidades = 1;
  if (crudo > 1) {
    const potencia = Math.pow(10, Math.floor(Math.log10(crudo)));
    const factor = [1, 2, 5, 10].find((k) => k * potencia >= crudo) ?? 10;
    unidades = factor * potencia;
  }
  const paso = unidades * b;
  const marcas = Array.from({ length: MARCAS + 1 }, (_, k) => k * paso);
  return { tope: paso * MARCAS, paso, marcas };
}

export type PuntoGeo = {
  x: number;
  y: number;
  /** El valor tal cual llegó (puede ser negativo o no finito: el texto lo escribe `formato`). */
  valor: number;
  /** Falso con un valor no finito: no se dibuja ni se conecta; `y` cae en la base para no inventar un dato. */
  visible: boolean;
};

export type GeometriaGrafico = {
  /** Ancho de dibujo, nunca menor de 280. */
  ancho: number;
  alto: number;
  /** Margen izquierdo: ahí vive el eje vertical y sus rótulos. */
  izq: number;
  der: number;
  arriba: number;
  /** y de la línea base (el cero). */
  yBase: number;
  /** ≥ 520: caben los valores sobre los puntos. */
  ancha: boolean;
  escala: EscalaEje;
  marcas: { valor: number; y: number }[];
  /** Separación horizontal entre dos puntos seguidos. */
  paso: number;
  puntos: PuntoGeo[];
  /** y de la referencia, si hay. */
  yReferencia: number | null;
};

/**
 * Dónde cae cada cosa para un ancho dado. El punto 0 queda a `SEPARACION_EJE`
 * del eje vertical y los demás se reparten hacia la derecha hasta el margen. El
 * alto es de 250 en estrecho y de 300 en ancho (móvil primero: lo estrecho es
 * la base).
 */
export function geometriaGrafico(opts: {
  ancho: number;
  valores: number[];
  base?: number;
  referencia?: number;
}): GeometriaGrafico {
  const W = Math.max(ANCHO_MINIMO, Number.isFinite(opts.ancho) ? opts.ancho : 0);
  const ancha = W >= ANCHO_VALORES;
  const alto = ancha ? 300 : 250;
  const izq = ancha ? 56 : 44;
  const der = ancha ? 30 : 18;
  const arriba = 38;
  const abajo = ancha ? 64 : 54;
  const yBase = alto - abajo;
  const finitos = opts.valores.filter((v) => Number.isFinite(v));
  const candidatos = opts.referencia !== undefined && Number.isFinite(opts.referencia)
    ? [...finitos, opts.referencia]
    : finitos;
  const escala = escalaEje(Math.max(0, ...candidatos), opts.base);
  // Se DIBUJA acotado a 0: un negativo no cae bajo la línea base. El texto conserva el número.
  const Y = (v: number) => redondear(arriba + (yBase - arriba) * (1 - Math.max(0, v) / escala.tope));
  const n = opts.valores.length;
  const paso = n > 1 ? (W - izq - der - SEPARACION_EJE) / (n - 1) : 0;
  return {
    ancho: W, alto, izq, der, arriba, yBase, ancha, escala, paso: redondear(paso),
    marcas: escala.marcas.map((valor) => ({ valor, y: Y(valor) })),
    puntos: opts.valores.map((valor, i) => {
      const visible = Number.isFinite(valor);
      return { x: redondear(izq + SEPARACION_EJE + i * paso), y: visible ? Y(valor) : yBase, valor, visible };
    }),
    yReferencia: opts.referencia !== undefined && Number.isFinite(opts.referencia) ? Y(opts.referencia) : null,
  };
}

/**
 * Los tramos de puntos visibles seguidos. Un valor no finito corta el trazo: la
 * línea no cruza un hueco como si hubiera dato.
 */
export function tramosVisibles(puntos: PuntoGeo[]): PuntoGeo[][] {
  const tramos: PuntoGeo[][] = [];
  let actual: PuntoGeo[] = [];
  for (const p of puntos) {
    if (p.visible) actual.push(p);
    else if (actual.length) { tramos.push(actual); actual = []; }
  }
  if (actual.length) tramos.push(actual);
  return tramos;
}

/** El punto más cercano a una x (en el espacio del dibujo). Siempre dentro de 0..n-1. */
export function puntoMasCercano(x: number, geo: GeometriaGrafico): number {
  const n = geo.puntos.length;
  if (n === 0 || geo.paso <= 0) return 0;
  return Math.max(0, Math.min(n - 1, Math.round((x - geo.puntos[0].x) / geo.paso)));
}

// ── Texto de un punto: UNA función para la ventana y la tabla ────────────────

export type TextosPunto = {
  /** «Esta semana», «Hace 1 semana», «Hace 3 semanas». */
  semana: string;
  /** El rango tal cual lo escribió la app. */
  rango: string;
  /** El número escrito, sin unidad: lo que lleva la tabla bajo su columna. */
  valor: string;
  /** El número con su unidad: lo que lleva la ventana. */
  valorUnidad: string;
  /** Frente a esta semana; vacío para el punto 0. */
  diferencia: string;
  /** La frase que anuncia el `aria-live`. */
  anuncio: string;
};

export function nombreSemana(i: number): string {
  if (i === 0) return 'Esta semana';
  return `Hace ${i} ${i === 1 ? 'semana' : 'semanas'}`;
}

const MENOS = '−'; // el signo menos de verdad, no el guion

export function textosPunto(
  i: number,
  puntos: PuntoTendencia[],
  formato: (valor: number) => string,
  unidad: string,
): TextosPunto {
  const p = puntos[i];
  const semana = nombreSemana(i);
  const valor = formato(p.valor);
  const valorUnidad = `${valor} ${unidad}`;
  let diferencia = '';
  // Sin número en alguno de los dos no hay diferencia que decir: no se inventa.
  if (i > 0 && Number.isFinite(p.valor) && Number.isFinite(puntos[0].valor)) {
    const d = p.valor - puntos[0].valor;
    diferencia = d === 0
      ? 'igual que esta semana'
      : `${d > 0 ? '+' : MENOS}${formato(Math.abs(d))} frente a esta semana`;
  }
  return { semana, rango: p.detalle, valor, valorUnidad, diferencia, anuncio: `${semana}, ${p.detalle}: ${valorUnidad}` };
}

// ── El componente ────────────────────────────────────────────────────────────

const ANCHO_VENTANA = 220;
/** Un poco más que el trazo de la hoja (`--dur-trazo`, 1000 ms): respaldo si `animationend` no llega. */
const RESPALDO_TRAZO_MS = 1200;

export function GraficoTendencia({
  titulo, puntos, formato, unidad, base = 1, comparaciones, referencia, columnaValor,
}: GraficoTendenciaProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const idTitulo = `${id}t`;
  const idDegradado = `${id}a`;
  const vista = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState<number | null>(null);
  const [activo, setActivo] = useState(-1);
  // Cada acción de teclado cambia este número: la región `aria-live` repinta su
  // texto en un nodo nuevo y el lector lo vuelve a decir aunque el punto sea el mismo.
  const [anuncios, setAnuncios] = useState(0);
  // Animación del trazo: la clase se suelta cuando la animación TERMINA, no por
  // un cambio de ancho ni de datos (soltarla a media la cortaría).
  const [animado, setAnimado] = useState(false);

  // El ancho SE MIDE aquí, sobre el propio contenedor. `ResizeObserver` falta en
  // algunos entornos (y en jsdom): sin él queda la medida de montaje.
  useLayoutEffect(() => {
    const el = vista.current;
    if (!el) return undefined;
    const medir = () => { if (el.clientWidth > 0) setMedida(el.clientWidth); };
    medir();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hay = puntos.length > 0;
  // ANIMACIÓN ÚNICA. La clase está desde el primer dibujo CON puntos y se suelta
  // al terminar el trazo (`animationend`). Si ese aviso no llega —animación
  // apagada por la hoja, pestaña oculta— un temporizador la suelta pasado el
  // tiempo del trazo. Una vez soltada no vuelve: ni al redibujar ni al cambiar
  // `puntos`. Un montaje nuevo es una apertura nueva y vuelve a animar.
  useEffect(() => {
    if (!hay || animado) return undefined;
    const t = setTimeout(() => setAnimado(true), RESPALDO_TRAZO_MS);
    return () => clearTimeout(t);
  }, [hay, animado]);
  const animar = hay && !animado;

  const geo = geometriaGrafico({
    ancho: medida ?? 0, valores: puntos.map((p) => p.valor), base, referencia: referencia?.valor,
  });
  const vivo = hay && activo >= 0 && activo < puntos.length ? activo : -1;
  const texto = (i: number) => textosPunto(i, puntos, formato, unidad);

  const alElegirX = (e: PointerEvent<HTMLDivElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    // Con un contenedor de menos de 280 px el dibujo (de 280) se encoge por CSS:
    // la posición del puntero se lleva a las coordenadas del dibujo.
    const escala = caja.width > 0 ? geo.ancho / caja.width : 1;
    setActivo(puntoMasCercano((e.clientX - caja.left) * escala, geo));
  };
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const ultimo = puntos.length - 1;
    if (ultimo < 0) return;
    let destino: number;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': destino = vivo < 0 ? 0 : Math.min(ultimo, vivo + 1); break;
      case 'ArrowLeft': case 'ArrowDown': destino = vivo < 0 ? 0 : Math.max(0, vivo - 1); break;
      case 'Home': destino = 0; break;
      case 'End': destino = ultimo; break;
      case 'Escape':
        if (vivo < 0) return;
        e.preventDefault();
        setActivo(-1);
        setAnuncios((n) => n + 1);
        return;
      default: return;
    }
    e.preventDefault();
    setActivo(destino);
    setAnuncios((n) => n + 1);
  };

  const actual = hay ? texto(0) : null;
  const nombreVista = hay
    ? `${titulo} por semana. Esta semana ${actual!.valorUnidad}${referencia ? `; ${referencia.etiqueta}` : ''}. `
      + 'Flechas para recorrer las semanas.'
    : titulo;

  const tramos = tramosVisibles(geo.puntos);
  const trazoDe = (t: PuntoGeo[]) => `M${t.map((p) => `${p.x},${p.y}`).join(' L')}`;
  const trazo = tramos.map(trazoDe).join(' ');
  const area = tramos
    .filter((t) => t.length > 1)
    .map((t) => `${trazoDe(t)} L${t[t.length - 1].x},${geo.yBase} L${t[0].x},${geo.yBase} Z`)
    .join(' ');

  return (
    <section className="graf" aria-labelledby={idTitulo}>
      <div className="graf-cab">
        <div>
          <h2 className="graf-titulo" id={idTitulo}>{titulo}</h2>
          {actual && (
            <div className="graf-num">
              <span>{actual.valor}</span>{' '}<small>{unidad}</small>
            </div>
          )}
        </div>
        {comparaciones && <div className="graf-chips">{comparaciones}</div>}
      </div>

      <div
        ref={vista}
        className="graf-vista"
        tabIndex={0}
        role="group"
        aria-label={nombreVista}
        onKeyDown={alTeclear}
        onPointerMove={(e) => { if (hay) alElegirX(e); }}
        onPointerDown={(e) => { if (hay) alElegirX(e); }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse' && document.activeElement !== e.currentTarget) setActivo(-1);
        }}
        onBlur={() => setActivo(-1)}
      >
        {hay && (
          <svg
            className="graf-svg"
            width={geo.ancho}
            height={geo.alto}
            viewBox={`0 0 ${geo.ancho} ${geo.alto}`}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
                <stop className="graf-stop" offset="0" stopOpacity=".38" />
                <stop className="graf-stop" offset="1" stopOpacity="0" />
              </linearGradient>
            </defs>

            {geo.marcas.map((m, k) => (
              <g key={m.valor}>
                <line className={k === 0 ? 'graf-base' : 'graf-rej'} x1={geo.izq} x2={geo.ancho - geo.der} y1={m.y} y2={m.y} />
                <text className="graf-eje" x={geo.izq - 8} y={m.y + 4} textAnchor="end">{formato(m.valor)}</text>
              </g>
            ))}

            {area && <path className="graf-area" d={area} fill={`url(#${idDegradado})`} />}

            {referencia && geo.yReferencia !== null && (
              <g>
                <line className="graf-ref" x1={geo.izq} x2={geo.ancho - geo.der} y1={geo.yReferencia} y2={geo.yReferencia} />
                <text className="graf-ref-t" x={geo.ancho - geo.der} y={geo.yReferencia - 8} textAnchor="end">{referencia.etiqueta}</text>
              </g>
            )}

            {trazo && (
              <path
                className={`graf-lin${animar ? ' graf-anima' : ''}`}
                d={trazo}
                pathLength={1}
                onAnimationEnd={() => setAnimado(true)}
              />
            )}

            {geo.puntos.map((p, i) => (!p.visible ? null : i === 0 ? (
              <g key={i}>
                <circle className="graf-halo" cx={p.x} cy={p.y} r="14" />
                <circle className="graf-p0" cx={p.x} cy={p.y} r="7" />
              </g>
            ) : (
              <g key={i}>
                <circle className="graf-p" cx={p.x} cy={p.y} r="4.5" />
                {geo.ancha && (
                  <text className="graf-val" x={p.x} y={p.y - 12} textAnchor="middle">{formato(p.valor)}</text>
                )}
              </g>
            )))}

            {geo.puntos.map((p, i) => (
              <text key={i} className={i === 0 ? 'graf-num0' : 'graf-numero'} x={p.x} y={geo.yBase + 24} textAnchor="middle">{i}</text>
            ))}
            <text className="graf-sub" x={geo.puntos[0].x} y={geo.yBase + 42} textAnchor="middle">actual</text>

            {vivo >= 0 && (() => {
              const p = geo.puntos[vivo];
              const t = texto(vivo);
              const lineas = t.diferencia ? 4 : 3;
              const alto = 16 + lineas * 18;
              const x = Math.max(4, Math.min(geo.ancho - ANCHO_VENTANA - 4, p.x - ANCHO_VENTANA / 2));
              const y = Math.max(4, p.y - alto - 16);
              return (
                <g>
                  <line className="graf-guia" x1={p.x} x2={p.x} y1={geo.arriba} y2={geo.yBase} />
                  {p.visible && <circle className="graf-anillo" cx={p.x} cy={p.y} r="9" />}
                  <g className="graf-vent">
                    <rect className="graf-vent-fondo" x={x} y={y} width={ANCHO_VENTANA} height={alto} rx="8" />
                    <text className="graf-vent-b" x={x + 10} y={y + 20}>{t.semana}</text>
                    <text className="graf-vent-t" x={x + 10} y={y + 38}>{t.rango}</text>
                    <text className="graf-vent-b" x={x + 10} y={y + 56}>{t.valorUnidad}</text>
                    {t.diferencia && (
                      <text className="graf-vent-t" x={x + 10} y={y + 74}>{t.diferencia}</text>
                    )}
                  </g>
                </g>
              );
            })()}
          </svg>
        )}
      </div>

      {/* Lo que anuncia el lector al recorrer los puntos. Fuera del SVG, que es decoración. */}
      <div className="sr-solo" aria-live="polite" aria-atomic="true">
        <span key={anuncios}>{vivo >= 0 ? texto(vivo).anuncio : ''}</span>
      </div>

      {hay && (
        <details className="graf-det">
          <summary>Ver las cifras de cada semana</summary>
          <table className="graf-tabla">
            <caption className="sr-solo">{titulo}: cifras de cada semana</caption>
            <thead>
              <tr>
                <th scope="col">Semana atrás</th>
                <th scope="col">Periodo</th>
                <th scope="col">{columnaValor}</th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((_, i) => {
                const t = texto(i);
                return (
                  <tr key={i}>
                    <th scope="row">{i === 0 ? '0 (actual)' : i}</th>
                    <td>{t.rango}</td>
                    <td>{t.valor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}
