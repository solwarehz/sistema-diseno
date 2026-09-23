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

import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

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
  const filas = cuantas(alto, ALTO_CELDA_TABLERO);
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
export function useCapacidadTablero(caja: RefObject<HTMLElement | null>): CapacidadTablero {
  /* LA CAJA QUE SE LE PASA TIENE QUE SER `tbl-lleno`, no el carril: el carril es
     `height: 100%` y su alto puede depender del contenido, y entonces la cuenta
     se queda clavada en la primera fila. Lo dice el contrato de marcado. */
  const [cap, setCap] = useState<CapacidadTablero>(() => capacidadDeRejilla(0, 0));
  /* En servidor no hay layout que medir y `useLayoutEffect` avisa por consola;
     es el mismo reparo que lleva `PanelPrivilegios`. */
  const enEfecto = typeof window === 'undefined' ? useEffect : useLayoutEffect;
  enEfecto(() => {
    /* NO SE SALE SI LA CAJA AUN NO EXISTE. Esto hacía `if (!el) return` y, con
       las dependencias en `[caja]`, no volvía a intentarlo NUNCA: quien montara
       el carril de forma condicional se quedaba en 1×1 para siempre. Ahora se
       escucha igual y `medir` comprueba en cada llamada, así que en cuanto la
       caja aparece la primera medida entra sola. */
    const medir = () => {
      const el = caja.current;
      if (!el) return;
      /* SE MIDE LA CAJA DE CONTENIDO, Y DE UN ELEMENTO QUE NO DEPENDA DEL
         CONTENIDO. Esto media el carril con `getBoundingClientRect`, y el
         carril es `height: 100%`: si su padre no tiene alto definido, ese 100 %
         resuelve al alto del CONTENIDO — y entonces la cuenta entra en un punto
         fijo en el sitio equivocado. Capacidad de una fila → se pintan tres
         personas → el contenido sigue midiendo una fila → la capacidad sigue
         siendo una. Se vio en un teléfono: TRES tarjetas arriba, el resto del
         contenedor vacío y ocho puntos de página.
         `tbl-lleno` no puede caer en eso: lleva `overflow: hidden`, así que su
         tamaño nunca lo decide lo que hay dentro.
         Y se resta el relleno a mano porque `clientWidth` lo INCLUYE, y la
         rejilla vive dentro de él: con el relleno de 12 de la superficie tonal,
         medir de más es lo que cortaba la última fila. */
      const cs = getComputedStyle(el);
      const ancho = el.clientWidth
        - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
      const alto = el.clientHeight
        - parseFloat(cs.paddingTop || '0') - parseFloat(cs.paddingBottom || '0');
      /* La ventana va aparte de la caja: el `@media` de la hoja mide la
         ventana, y la rejilla vive en la caja. */
      const nueva = capacidadDeRejilla(ancho, alto, window.innerWidth);
      /* Se compara antes de asignar: un `ResizeObserver` dispara por cualquier
         fracción de píxel, y sin esto cada uno sería un render de la rejilla
         entera aunque la capacidad no haya cambiado. */
      setCap((vieja) => (vieja.columnas === nueva.columnas && vieja.filas === nueva.filas
        ? vieja : nueva));
    };
    medir();
    /* DOS FUENTES, Y NO SOBRA NINGUNA. El observador coge los cambios de la
       CAJA —una barra lateral que se pliega, un panel que se abre— sin que la
       ventana cambie. El evento de ventana coge el giro del teléfono y el
       redimensionado, y es el que sigue funcionando donde el observador no
       existe o no se dispara. Medir de más es barato: `medir` compara antes de
       asignar, así que una medida repetida no provoca ni un render. */
    window.addEventListener('resize', medir);
    /* Y la barra del navegador móvil aparece y desaparece sin emitir `resize`
       en algunos navegadores; `visualViewport` sí lo cuenta. Es el mismo motivo
       por el que la cadena de alto usa `dvh`. */
    window.visualViewport?.addEventListener('resize', medir);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    if (caja.current) ro?.observe(caja.current);
    return () => {
      window.removeEventListener('resize', medir);
      window.visualViewport?.removeEventListener('resize', medir);
      ro?.disconnect();
    };
  }, [caja]);
  return cap;
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
  const v = Math.max(0, Math.floor(n));
  /* Con prefijo el tope va DENTRO —«+99»— y sin el va detras —«99+»—: las dos
     formas dicen «mas de 99» y las dos caben en tres caracteres. Poner los dos
     signos daria «+99+», que no lo dice mejor y no cabe. */
  if (v > tope) return prefijo ? `${prefijo}${tope}` : `${tope}+`;
  return `${prefijo}${v}`;
}
