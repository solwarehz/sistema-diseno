/**
 * CUÁNTAS PERSONAS CABEN EN UNA PÁGINA DE TABLERO.
 *
 * Existe por lo mismo que `--sombra-relieve` es un token: si cada producto
 * calcula su capacidad, la misma pantalla acaba con tres respuestas distintas.
 * El sistema conoce el suelo de la celda y el hueco de la rejilla —los declara
 * él— así que es quien puede contestar.
 *
 * Lo pidió así el equipo que adoptó el tablero, y tenían razón en el principio:
 * **la pieza, no el valor**. Un `useEffect` midiendo cajas dentro de una
 * pantalla es código del producto decidiendo maquetación.
 */

import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type RefObject,
} from 'react';

/** El suelo de la celda, y es el mismo que declara `.tn-densa` en la hoja. */
export const ANCHO_CELDA_TABLERO = 84;
/**
 * El alto de una celda entera, y cabe **lo que la celda puede producir**.
 *
 * `48` de foto + `10` de separación + **una** línea de nombre + **dos** de
 * apellido + una de hora, a 13,75 cada una (11 px × 1,25) = **113**, redondeado
 * a 114. Es el mismo número que `.tn-densa-llena` usa de suelo de fila: si uno
 * cambia, cambian los dos, y hay una prueba que lo comprueba.
 *
 * Estuvo en **100** —lo que mide la celda con todo a una línea— y eso era
 * mentir: con un apellido de dos líneas el contenido pide 113, la fila se
 * quedaba en 100 y los hijos de flex se encogían. Medido en navegador:
 * `.tbl-ape` pintado a 13,02 px donde pide 27,5 — **una línea entera
 * desaparecida**, y `scrollHeight` no lo denuncia.
 *
 * Una celda que puede crecer un 27 % rompe la cuenta que este archivo publica.
 */
export const ALTO_CELDA_TABLERO = 114;
/** El hueco de `.tn-densa`. La hoja lo sube a 12 desde 768 px. */
export const HUECO_TABLERO = 8;
export const HUECO_TABLERO_ANCHO = 12;

/**
 * Lo que la burbuja sobresale por encima de la foto, y que hay que reservar en
 * la primera fila o **se recorta**.
 *
 * La burbuja se apoya en el borde del disco a 45° y se empuja hacia fuera, así
 * que su borde superior queda por encima de la caja de la foto: `7,03 − 0,75·D`
 * con el disco de 48. Con el mayor que el propio sistema produce —`+99`, 22 px,
 * porque `cuentaBurbuja` topa en tres caracteres— son **9,47 px**.
 *
 * Se descubrió midiendo: en una fila de 124,54 px la celda centra su contenido
 * de 113 y deja 5,77 de holgura arriba, así que se recortaban **3,70 px** de la
 * burbuja de la primera fila — y el carril no se puede desplazar hasta ella
 * porque su `scrollHeight` es igual a su `clientHeight`. La auditoría midió
 * 3,71. Es la misma cuenta.
 *
 * Se reserva **10** y no 9,47 porque un píxel de margen cuesta nada y evita
 * discutir con el redondeo del navegador.
 */
export const RESERVA_BURBUJA = 10;

export type CapacidadTablero = {
  /** Columnas que caben. Nunca menos de 1. */
  columnas: number;
  /** Filas que caben. Nunca menos de 1. */
  filas: number;
  /** Personas por página: filas × columnas. */
  porPagina: number;
};

/**
 * Cuántas celdas caben en una caja de `ancho` × `alto` píxeles.
 *
 * Devuelve **al menos 1×1**: una caja diminuta no puede dar cero páginas, y un
 * cero aquí haría dividir por cero a quien trocee la lista. Con una caja sin
 * medir todavía —ancho o alto en 0— también devuelve 1×1, que es lo que deja
 * pintar algo en el primer cuadro en vez de una pantalla vacía.
 */
export function capacidadDeRejilla(
  ancho: number, alto: number, anchoVentana: number = ancho,
): CapacidadTablero {
  /* EL UMBRAL DEL HUECO MIDE LA VENTANA, NO LA CAJA, porque eso es lo que mide
     el `@media (min-width: 768px)` de la hoja. Esto decía `ancho >= 768` —la
     caja— y con una ventana ancha y una caja estrecha la hoja usaba `gap: 12` y
     la cuenta `8`: la cuenta se pasaba de UNA COLUMNA y, con `overflow: hidden`,
     esa columna se recortaba en silencio. Una auditoría lo barrió: 112 anchos de
     caja afectados, y entre ellos el 753 que el propio registro cita como
     medido. El tercer parámetro es opcional y por omisión vale el ancho de la
     caja, para quien llame a la cuenta sin ventana —una prueba, el servidor—. */
  const hueco = anchoVentana >= 768 ? HUECO_TABLERO_ANCHO : HUECO_TABLERO;
  /* `n·celda + (n−1)·hueco ≤ disponible` despejado. El `+ hueco` del numerador
     es el hueco que la última celda NO gasta. */
  const cuantas = (disponible: number, celda: number) => {
    /* `Math.max(1, NaN)` es NaN, no 1: la garantía de «nunca menos de 1» se
       rompía con una medida que no fuera un número, y `enPaginas` acababa
       devolviendo UNA PÁGINA VACÍA con la lista entera desaparecida y sin
       error. Lo encontró una auditoría barriendo el caso. */
    const n = Math.floor((disponible + hueco) / (celda + hueco));
    return Number.isFinite(n) ? Math.max(1, n) : 1;
  };
  const columnas = cuantas(ancho, ANCHO_CELDA_TABLERO);
  /* EL ALTO DISPONIBLE DESCUENTA LA RESERVA DE LA BURBUJA, porque la rejilla la
     reserva con su relleno superior. Si la cuenta no la descontara, las dos se
     separarían y volvería el recorte: la cuenta creería que cabe una fila más
     de la que la rejilla puede pintar. */
  const filas = cuantas(Math.max(0, alto - RESERVA_BURBUJA), ALTO_CELDA_TABLERO);
  return { columnas, filas, porPagina: columnas * filas };
}

/**
 * Trocea una lista en páginas de `porPagina`.
 *
 * Va aquí y no en cada pantalla porque el troceo y la capacidad son la misma
 * decisión: quien calcula cuántas caben es quien tiene que partir la lista, o
 * las dos cuentas se separan y un día dejan de coincidir.
 */
export function enPaginas<T>(lista: readonly T[], porPagina: number): T[][] {
  /* `NaN < 1` es FALSE, así que un NaN se colaba hasta el bucle, `i += NaN` lo
     cortaba al primer paso y la lista entera desaparecía sin decir nada. Se
     comprueba que es un número antes de comparar. */
  if (!Number.isFinite(porPagina) || porPagina < 1) return [[...lista]];
  const paginas: T[][] = [];
  for (let i = 0; i < lista.length; i += porPagina) paginas.push(lista.slice(i, i + porPagina));
  /* Una lista vacía es UNA página vacía y no cero: el carril necesita una
     parada que enseñar, y su cuenta no puede decir «0 de 0». Y eso vale también
     por el camino de arriba: antes, con lista vacía y capacidad imposible,
     devolvía CERO páginas y se contradecía con este mismo comentario. */
  return paginas.length ? paginas : [[]];
}

/**
 * La capacidad de la caja que se le pase, midiéndola y volviendo a medirla
 * cuando cambie de tamaño.
 *
 * **Esto es la otra mitad de la pieza.** Publicar sólo la cuenta dejaba a cada
 * producto escribiendo su propio `ResizeObserver`, que es exactamente el
 * `useEffect` que el equipo retiró de su pantalla por considerarlo —con razón—
 * código del producto decidiendo maquetación.
 *
 * Arranca en **1×1** y no en cero: el primer render ocurre antes de medir, y
 * con cero no hay nada que pintar ni con qué dividir. Una celda es lo mínimo
 * honesto mientras se mide.
 */
export type CapacidadConRef = CapacidadTablero & {
  /**
   * Cuélguelo del nodo que hay que medir: `<div className="… tbl-lleno" ref={ref}>`.
   *
   * **Es el camino bueno**, y lo es por un motivo concreto: React lo llama en
   * el momento en que el nodo entra y sale del árbol, así que no hay ningún
   * instante en el que «la caja todavía no está». Con un `RefObject` sí lo hay,
   * y ahí nació el R162.
   */
  ref: (nodo: HTMLElement | null) => void;
};

/**
 * La capacidad de la caja que se mida, midiéndola y volviendo a medirla cuando
 * cambie de tamaño.
 *
 * **Dos formas de decirle qué caja**, y la primera es la buena:
 *
 * ```tsx
 * const { porPagina, ref } = useCapacidadTablero();
 * <div className="sup tbl-lleno" ref={ref}>…
 * ```
 *
 * ```tsx
 * const caja = useRef<HTMLDivElement>(null);       // sigue funcionando
 * const { porPagina } = useCapacidadTablero(caja);
 * ```
 *
 * **Por qué hay dos.** La segunda es la que se publicó primero, y traía un
 * defecto que el equipo que la usa reprodujo en producción (R162): si el nodo
 * se monta **después** —una pantalla que enseña un spinner mientras carga—, en
 * el momento del efecto `caja.current` es `null`, así que no se suscribía
 * nadie; y como un `RefObject` es estable, el efecto **no volvía a correr
 * jamás**. La capacidad se quedaba en 1×1 **toda la sesión**.
 *
 * Y su observación más afilada: **el defecto se cura con el gesto de ir a
 * mirarlo**. Los oyentes de ventana sí quedaban puestos, así que en escritorio
 * bastaba mover el borde una vez —o abrir las herramientas— para que saltara al
 * valor bueno. En un teléfono no se redimensiona nunca. Por eso pasó una
 * verificación en escritorio.
 *
 * La forma con `RefObject` **ya no tiene ese agujero** —se reconcilia después de
 * cada render, así que se engancha en cuanto el nodo aparece— pero avisa por
 * consola en desarrollo, porque el camino con `ref` de retrollamada no necesita
 * ese rodeo.
 *
 * **Y no se engancha UNA vez, se reconcilia SIEMPRE.** El primer intento de
 * arreglar esto se enganchaba una vez y se daba por hecho, y una auditoría lo
 * tumbó por tres sitios distintos: en `StrictMode` React vuelve a correr el
 * efecto pero **no vuelve a llamar la retrollamada del `ref`**, así que anular
 * el nodo en la limpieza dejaba sordo justo al camino recomendado; si la caja se
 * desmontaba y volvía —cambio de pestaña, recarga de datos— se seguía midiendo
 * el nodo viejo, ya desprendido, que mide cero; y al pasar `medir` a leer el
 * nodo propio se perdió el rescate por `resize` que la v1.147.0 sí tenía. Los
 * tres son el mismo error de fondo: **tratar el enganche como un suceso y no
 * como un estado que hay que mantener.**
 */
export function useCapacidadTablero(
  caja?: RefObject<HTMLElement | null>,
): CapacidadConRef {
  const [cap, setCap] = useState<CapacidadTablero>(() => capacidadDeRejilla(0, 0));
  /* El nodo vivo. Se guarda en un ref y no en estado: cambiarlo no tiene que
     provocar un render, solo volver a medir. */
  const nodo = useRef<HTMLElement | null>(null);
  const ro = useRef<ResizeObserver | null>(null);
  /* LO QUE EL OBSERVADOR ESTA MIRANDO AHORA MISMO, que no es lo mismo que el
     nodo: entre los dos vive todo el defecto. Tenerlo aparte es lo que permite
     preguntar «¿esta enganchado?» en vez de suponerlo. */
  const observado = useRef<HTMLElement | null>(null);
  /* El `RefObject` que nos hayan pasado, en un espejo, para que `medir` y
     `sincronizar` no dependan de el y puedan ser estables. */
  const externa = useRef(caja);
  externa.current = caja;
  const avisado = useRef(false);

  const medir = useCallback(() => {
    /* EL RESCATE POR VENTANA, QUE NO SE PUEDE PERDER. Si nadie llamo todavia a
       la retrollamada, se mira el `RefObject` que nos dieron: es lo que hacia
       que en escritorio el defecto se curase al mover el borde, y quitarlo fue
       una regresion contra la v1.147.0 que cazo la auditoria. */
    const el = nodo.current ?? externa.current?.current ?? null;
    if (!el) return;
    /* SE MIDE LA CAJA DE CONTENIDO, Y DE UN ELEMENTO QUE NO DEPENDA DEL
       CONTENIDO. `tbl-lleno` lleva `overflow: hidden`, así que su tamaño nunca
       lo decide lo que hay dentro — ni siquiera un spinner. Y se resta el
       relleno a mano porque `clientWidth` lo INCLUYE y la rejilla vive dentro
       de él. */
    const cs = getComputedStyle(el);
    const ancho = el.clientWidth
      - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
    const alto = el.clientHeight
      - parseFloat(cs.paddingTop || '0') - parseFloat(cs.paddingBottom || '0');
    /* EL SUELO DE UNA FILA INCLUYE LA RESERVA DE LA BURBUJA. El umbral estuvo
       en `ALTO_CELDA_TABLERO` a secas —114— y eso deja un hueco de 10 px en el
       que el aviso calla y la fila NO cabe: la rejilla reserva sus 10 px por
       arriba, asi que pide 124. Medido en el propio catalogo: caja de 121, fila
       de 124, 3 px fuera, y el carril desplazandose en vertical —que es lo que
       el sistema promete que no pasa— con el aviso en silencio. Un umbral que
       ignora la reserva que la propia cuenta descuenta es un aviso que miente
       justo en el margen donde hace falta. */
    if (alto > 0 && alto < ALTO_CELDA_TABLERO + RESERVA_BURBUJA
        && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(
        `useCapacidadTablero: la caja mide ${Math.round(alto)}px de alto y una fila `
        + `necesita ${ALTO_CELDA_TABLERO + RESERVA_BURBUJA} `
        + `(${ALTO_CELDA_TABLERO} de celda mas ${RESERVA_BURBUJA} que reserva la burbuja). `
        + 'Casi seguro la cadena de alto esta rota: '
        + '`tbl-lleno` necesita que ALGUN antepasado tenga alto definido —`MarcoApp '
        + 'altoCompleto` lo da—. Sin eso la caja mide su propio contenido y el tablero '
        + 'se queda en una fila.',
      );
    }
    const nueva = capacidadDeRejilla(ancho, alto, window.innerWidth);
    setCap((vieja) => (vieja.columnas === nueva.columnas && vieja.filas === nueva.filas
      ? vieja : nueva));
  }, []);

  /**
   * Pone el observador donde tiene que estar. **Es idempotente**: si ya está
   * donde toca, no hace nada y no fuerza maquetado — por eso se puede llamar
   * después de cada render sin coste.
   */
  const sincronizar = useCallback(() => {
    const el = nodo.current ?? externa.current?.current ?? null;
    if (observado.current === el) return;
    if (observado.current) ro.current?.unobserve(observado.current);
    observado.current = el;
    if (!el) return;
    if (typeof ResizeObserver !== 'undefined') {
      ro.current = ro.current ?? new ResizeObserver(medir);
      ro.current.observe(el);
    } else if (process.env.NODE_ENV !== 'production' && !avisado.current) {
      avisado.current = true;
      // eslint-disable-next-line no-console
      console.warn(
        'useCapacidadTablero: aqui no hay `ResizeObserver`, asi que la capacidad '
        + 'solo se recalculara cuando cambie la VENTANA. Si la caja cambia de '
        + 'tamano sin que la ventana cambie, el tablero se quedara con la cuenta '
        + 'vieja.',
      );
    }
    medir();
  }, [medir]);

  /** La retrollamada que se cuelga del nodo. React la llama con el nodo en la mano. */
  const enganchar = useCallback((el: HTMLElement | null) => {
    nodo.current = el;
    sincronizar();
  }, [sincronizar]);

  const enEfecto = typeof window === 'undefined' ? useEffect : useLayoutEffect;

  /* UNO · LOS OYENTES DE VENTANA, que viven mientras viva el gancho.
     El observador coge los cambios de la CAJA sin que la ventana cambie; el
     evento de ventana coge el giro del telefono y sigue funcionando donde el
     observador no existe. Van en su propio efecto porque su vida es la del
     gancho, no la de cada render. */
  enEfecto(() => {
    window.addEventListener('resize', medir);
    window.visualViewport?.addEventListener('resize', medir);
    return () => {
      window.removeEventListener('resize', medir);
      window.visualViewport?.removeEventListener('resize', medir);
      /* Se suelta el observador, pero NO se olvida el nodo: en `StrictMode`
         React corre limpieza y efecto otra vez SIN volver a llamar la
         retrollamada del `ref`, asi que olvidar el nodo aqui dejaba sordo al
         camino recomendado. Se olvida lo que se puede recuperar —a quien se
         estaba observando— y el efecto de abajo lo vuelve a enganchar. */
      ro.current?.disconnect();
      observado.current = null;
    };
  }, [medir]);

  /* DOS · LA RECONCILIACION, DESPUES DE CADA RENDER Y SIN LISTA DE
     DEPENDENCIAS. No es descuido: es la unica forma de que el enganche sea un
     ESTADO que se mantiene y no un suceso que ocurrio una vez. Cubre los tres
     casos que tumbaron al intento anterior —`StrictMode`, la caja que se
     desmonta y vuelve, y la caja que aparece tarde— con una sola idea, y sin
     vigilar el documento entero con un `MutationObserver`, que era caro y
     ademas solo servia una vez.
     El coste es una comparacion de referencias por render: `sincronizar` sale
     por la primera linea cuando no hay nada que cambiar. */
  enEfecto(() => {
    const habiaNodo = observado.current !== null;
    sincronizar();
    if (process.env.NODE_ENV !== 'production'
        && externa.current && !nodo.current && observado.current && !habiaNodo
        && !avisado.current) {
      avisado.current = true;
      // eslint-disable-next-line no-console
      console.warn(
        'useCapacidadTablero: la caja aparecio DESPUES del montaje y se ha '
        + 'enganchado ahora. Funciona, pero el camino sin rodeos es el `ref` que '
        + 'devuelve el gancho: `const { porPagina, ref } = useCapacidadTablero()` '
        + 'y `<div className="… tbl-lleno" ref={ref}>`, que React llama con el '
        + 'nodo en la mano y no necesita que nadie lo vaya a buscar.',
      );
    }
  });

  /* El objeto se memoriza: devolver uno nuevo en cada render hace correr los
     efectos del consumidor que dependan de la capacidad, y con un `setState`
     dentro de uno de esos efectos es un bucle. Lo cazo la auditoria. */
  return useMemo(() => ({ ...cap, ref: enganchar }), [cap, enganchar]);
}

/**
 * El texto de una burbuja, **acortado para que quepa**.
 *
 * La burbuja crece con su contenido, y eso tiene un límite: con `+120` medía
 * 32,4 px sobre un avatar de 48 —el 67 %— y se comía la cara que viene a
 * anotar. Tres caracteres es lo que cabe sin tapar la foto.
 *
 * Va en el sistema y no en cada pantalla por lo de siempre: si cada producto
 * elige su tope, el mismo tablero muestra `99+` en una pantalla y `120` en la
 * de al lado.
 *
 * **No recorta el dato, lo resume**: el valor exacto va en el texto accesible
 * de la celda, que el contrato ya exige.
 *
 *     cuentaBurbuja(7)          → '7'
 *     cuentaBurbuja(91)         → '91'
 *     cuentaBurbuja(120)        → '99+'
 *     cuentaBurbuja(7,  '+')    → '+7'
 *     cuentaBurbuja(120, '+')   → '+99'
 */
export function cuentaBurbuja(n: number, prefijo: '' | '+' = '', tope = 99): string {
  if (!Number.isFinite(n)) return '';
  /* EL TOPE TAMBIEN SE SANEA, y no es paranoia: es un parametro PUBLICO. Una
     auditoria lo barrio y encontro que sin esto la promesa de «tres caracteres»
     se rompe en cuanto alguien pasa un tope suyo — `cuentaBurbuja(5, '', 2.5)`
     daba «2.5+», y con un tope no finito el corte se desactivaba entero y un
     millon salia con sus siete cifras. Se acota a DOS CIFRAS en los dos casos,
     y esa segunda parte la caza la propia prueba: se puso 999 pensando que sin
     prefijo cabia mas, y «999+» son CUATRO caracteres — el signo del corte
     tambien ocupa. Con «+99» y con «99+» son tres. */
  const techo = Number.isFinite(tope)
    ? Math.min(99, Math.max(1, Math.floor(tope)))
    : 99;
  const v = Math.max(0, Math.floor(n));
  /* Con prefijo el tope va DENTRO —«+99»— y sin el va detras —«99+»—: las dos
     formas dicen «mas de 99» y las dos caben en tres caracteres. Poner los dos
     signos daria «+99+», que no lo dice mejor y no cabe. */
  if (v > techo) return prefijo ? `${prefijo}${techo}` : `${techo}+`;
  return `${prefijo}${v}`;
}
