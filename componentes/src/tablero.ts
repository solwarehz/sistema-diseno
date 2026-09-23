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
 * El alto de una celda entera, medido: foto de 48 px, sus 10 de separación y
 * las tres líneas de texto a 11 px con interlineado 1,25 — 48 + 10 + 41 ≈ 99.
 * Se redondea a 100, que es el mismo número que `.tn-densa-llena` usa de suelo
 * de fila. Si uno cambia, cambian los dos.
 */
export const ALTO_CELDA_TABLERO = 100;
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
export function capacidadDeRejilla(ancho: number, alto: number): CapacidadTablero {
  const hueco = ancho >= 768 ? HUECO_TABLERO_ANCHO : HUECO_TABLERO;
  /* `n·celda + (n−1)·hueco ≤ disponible` despejado. El `+ hueco` del numerador
     es el hueco que la última celda NO gasta. */
  const cuantas = (disponible: number, celda: number) =>
    Math.max(1, Math.floor((disponible + hueco) / (celda + hueco)));
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
  if (porPagina < 1) return lista.length ? [[...lista]] : [];
  const paginas: T[][] = [];
  for (let i = 0; i < lista.length; i += porPagina) paginas.push(lista.slice(i, i + porPagina));
  /* Una lista vacía es UNA página vacía y no cero: el carril necesita una
     parada que enseñar, y su cuenta de paradas no puede decir «0 de 0». */
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
  const [cap, setCap] = useState<CapacidadTablero>(() => capacidadDeRejilla(0, 0));
  /* En servidor no hay layout que medir y `useLayoutEffect` avisa por consola;
     es el mismo reparo que lleva `PanelPrivilegios`. */
  const enEfecto = typeof window === 'undefined' ? useEffect : useLayoutEffect;
  enEfecto(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      const nueva = capacidadDeRejilla(r.width, r.height);
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
    ro?.observe(el);
    return () => {
      window.removeEventListener('resize', medir);
      window.visualViewport?.removeEventListener('resize', medir);
      ro?.disconnect();
    };
  }, [caja]);
  return cap;
}
