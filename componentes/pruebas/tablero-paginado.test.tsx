/**
 * R159 · PRIMERO SE LLENA EL AREA, Y DESPUES SE DESLIZA.
 *
 * Lo cortó el responsable mirando el tablero en una tablet: «si se ocupa todo
 * el espacio y no queda más, recién se hace scroll horizontal». Un tablero que
 * deja media pantalla en blanco y aun así obliga a deslizar convierte la
 * paginación por gesto en desbordamiento con otro nombre — que es justo la
 * distinción que el R157 dejó escrita.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  capacidadDeRejilla, enPaginas,
  ANCHO_CELDA_TABLERO, ALTO_CELDA_TABLERO, HUECO_TABLERO, HUECO_TABLERO_ANCHO,
} from '../src/tablero';

const css = readFileSync(
  join(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'), 'utf8');
const regla = (sel: string) => {
  const i = css.indexOf(`\n${sel}{`);
  return i === -1 ? '' : css.slice(i, css.indexOf('}', i));
};

describe('R159 · la capacidad la calcula el sistema', () => {
  it('[11] la cuenta cabe de verdad en la caja que se midió', () => {
    /* La comprobación que importa: lo que dice que cabe, cabe. Se verifica
       rehaciendo la aritmética de la rejilla en cada caso. */
    for (const [w, h] of [[293, 477], [541, 131], [753, 391], [1133, 591], [360, 640]]) {
      const { columnas, filas } = capacidadDeRejilla(w, h);
      const hueco = w >= 768 ? HUECO_TABLERO_ANCHO : HUECO_TABLERO;
      const ocupaAncho = columnas * ANCHO_CELDA_TABLERO + (columnas - 1) * hueco;
      const ocupaAlto = filas * ALTO_CELDA_TABLERO + (filas - 1) * hueco;
      expect(ocupaAncho, `${columnas} columnas NO caben en ${w}px`).toBeLessThanOrEqual(w);
      expect(ocupaAlto, `${filas} filas NO caben en ${h}px`).toBeLessThanOrEqual(h);
    }
  });

  it('[11] y no deja sitio de sobra: una más ya NO cabría', () => {
    /* Lo contrario del anterior, y es la mitad que hace falta: una cuenta
       prudente que devolviera siempre 1 pasaría la prueba de arriba y dejaría
       la pantalla medio vacía, que es el defecto que se vino a arreglar. */
    for (const [w, h] of [[293, 477], [753, 391], [1133, 591]]) {
      const { columnas, filas } = capacidadDeRejilla(w, h);
      const hueco = w >= 768 ? HUECO_TABLERO_ANCHO : HUECO_TABLERO;
      expect((columnas + 1) * ANCHO_CELDA_TABLERO + columnas * hueco,
        `cabría otra columna en ${w}px y se está desperdiciando`).toBeGreaterThan(w);
      expect((filas + 1) * ALTO_CELDA_TABLERO + filas * hueco,
        `cabría otra fila en ${h}px y se está desperdiciando`).toBeGreaterThan(h);
    }
  });

  it('[11] una caja sin medir todavía da 1×1, nunca 0', () => {
    /* Un cero aquí hace dividir por cero a quien trocee la lista, y deja la
       primera pintada en blanco. Una celda es lo mínimo honesto mientras se
       mide. */
    for (const [w, h] of [[0, 0], [10, 10], [-5, 40]]) {
      const c = capacidadDeRejilla(w, h);
      expect(c.columnas).toBeGreaterThanOrEqual(1);
      expect(c.filas).toBeGreaterThanOrEqual(1);
      expect(c.porPagina).toBeGreaterThanOrEqual(1);
    }
  });

  it('[11] el hueco de la cuenta es el MISMO que el de la hoja', () => {
    /* Si la hoja sube el hueco a 12 y la cuenta sigue en 8, la última columna
       de cada página se sale. Los dos números salen del mismo sitio o un día
       dejan de coincidir. Sin RegExp construida: se compara el texto. */
    expect(regla('.tn-densa'), 'el hueco estrecho de la hoja no es el de la cuenta')
      .toContain(`gap: ${HUECO_TABLERO}px`);
    const ancho = css.slice(css.indexOf('@media (min-width: 768px)'));
    expect(ancho.slice(0, 400), 'el hueco ancho de la hoja no es el de la cuenta')
      .toContain(`gap: ${HUECO_TABLERO_ANCHO}px`);
  });

  it('[11] y los suelos de celda de la hoja son los de la cuenta', () => {
    expect(regla('.tn-densa-llena'), 'la hoja y la cuenta no miden el mismo ALTO de celda')
      .toContain(`minmax(${ALTO_CELDA_TABLERO}px`);
    expect(regla('.tn-densa'), 'la hoja y la cuenta no miden el mismo ANCHO de celda')
      .toContain(`minmax(${ANCHO_CELDA_TABLERO}px`);
  });
});

describe('R159 · el troceo en páginas', () => {
  it('[11] reparte sin perder ni repetir a nadie', () => {
    const gente = Array.from({ length: 23 }, (_, i) => i);
    const pags = enPaginas(gente, 5);
    expect(pags.map((p) => p.length)).toEqual([5, 5, 5, 5, 3]);
    expect(pags.flat(), 'alguien se perdió o salió dos veces').toEqual(gente);
  });

  it('[11] una lista vacía es UNA página vacía, no cero', () => {
    /* El carril necesita una parada que enseñar, y su cuenta no puede decir
       «0 de 0». */
    expect(enPaginas([], 5)).toEqual([[]]);
  });

  it('[11] con capacidad imposible no se pierde a nadie', () => {
    /* Antes que dejar fuera a una persona, se devuelve todo en una página:
       una rejilla apretada se ve; una persona que no aparece, no. */
    expect(enPaginas([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
  });
});

describe('R159 · lo que la hoja tiene que garantizar', () => {
  it('[11] el cuerpo del tablero NO se desplaza en vertical', () => {
    /* Es la petición literal: «elimina el scroll vertical para en-vivo». Y no
       es capricho: el gesto vertical y el horizontal competirían en la misma
       superficie, y en un teléfono se intenta pasar de página y la rejilla
       baja. Lo que no cabe va a la siguiente pantalla, no más abajo. */
    const r = regla('.tbl-lleno');
    expect(r, 'no existe el cuerpo que llena').not.toBe('');
    expect(r, 'el cuerpo se desplaza en vertical: el gesto compite con el del carril')
      .toMatch(/overflow:\s*hidden/);
    expect(r, 'sin `min-height: 0` el cuerpo no baja y empuja el pie fuera')
      .toMatch(/min-height:\s*0/);
  });

  it('[11] la rejilla reparte FILAS, no solo columnas', () => {
    /* Sin esto las celdas se apilan arriba y queda media pantalla en blanco
       con el carril pidiendo que deslices. */
    const r = regla('.tn-densa-llena');
    expect(r, 'la rejilla no reparte filas: no llena el alto')
      .toMatch(/grid-template-rows:\s*repeat\(auto-fill/);
    expect(r, 'las filas no se estiran hasta llenar').toMatch(/1fr\)/);
    expect(r, 'la rejilla no toma el alto de su página').toMatch(/height:\s*100%/);
  });

  it('[11] y cada parada del carril ocupa el alto completo', () => {
    expect(regla('.car-pagina'), 'las paradas no llenan el alto').toMatch(/height:\s*100%/);
    expect(regla('.car-pagina > *'), 'la página de dentro no llena el alto')
      .toMatch(/height:\s*100%/);
  });
});
