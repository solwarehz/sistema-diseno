/**
 * LA ÚNICA MATEMÁTICA DE COLOR QUE NO VIENE DE WCAG, PROBADA.
 *
 * `sistema/tokens/distancia.mjs` nació con el R143 y con una frase falsa en su
 * cabecera: decía que los datos de prueba de Sharma, Wu & Dalal (2005) estaban
 * en `probar-candado.mjs`. **No estaban en ninguna parte.** Ese archivo prueba
 * los ocho patrones de ESLint y nada más. Lo cazó una auditoría adversaria el
 * 2026-09-16, y tenía toda la razón: es exactamente lo que CLAUDE.md §9 declara
 * fatal — una afirmación sin herramienta detrás.
 *
 * Esto es el arreglo. La tabla de abajo es la publicada con la fórmula, y está
 * elegida por lo que castiga: CIEDE2000 no es una resta, es una resta con
 * cuatro correcciones y **una rotación** que solo actúa alrededor del azul, y
 * casi todos los casos difíciles del mundo real caen donde la implementación
 * ingenua se equivoca. Los pares 1-14 son justo esos: el tono cruzando 0°/360°,
 * el par azul donde el término `Rt` decide, y la simetría —que una
 * implementación ingenua **rompe**, porque la media de dos tonos a los dos
 * lados de 0° sale del lado contrario—.
 *
 * Si alguno de estos hubiera salido en rojo, la salida no era ajustar la
 * fórmula hasta que cuadrara: era quitar el par y decirlo. No hizo falta.
 */
import { describe, it, expect } from 'vitest';
import { de2000Lab, de2000, lab, JND } from '../../sistema/tokens/distancia.mjs';

type Lab = [number, number, number];
type Caso = [Lab, Lab, number];

/**
 * Datos de prueba de CIEDE2000 — Sharma, Wu & Dalal (2005), «The CIEDE2000
 * Color-Difference Formula: Implementation Notes, Supplementary Test Data and
 * Mathematical Observations», Color Research & Application 30(1), 21-30.
 *
 * Tolerancia 1e-4, que es la precisión con la que la publicación los da.
 */
const SHARMA: Caso[] = [
  [[50.0000,   2.6772, -79.7751], [50.0000,  0.0000, -82.7485],  2.0425],
  [[50.0000,   3.1571, -77.2803], [50.0000,  0.0000, -82.7485],  2.8615],
  [[50.0000,   2.8361, -74.0200], [50.0000,  0.0000, -82.7485],  3.4412],
  [[50.0000,  -1.3802, -84.2814], [50.0000,  0.0000, -82.7485],  1.0000],
  [[50.0000,  -1.1848, -84.8006], [50.0000,  0.0000, -82.7485],  1.0000],
  [[50.0000,  -0.9009, -85.5211], [50.0000,  0.0000, -82.7485],  1.0000],
  [[50.0000,   0.0000,   0.0000], [50.0000, -1.0000,   2.0000],  2.3669],
  [[50.0000,  -1.0000,   2.0000], [50.0000,  0.0000,   0.0000],  2.3669],
  [[50.0000,   2.4900,  -0.0010], [50.0000, -2.4900,   0.0009],  7.1792],
  [[50.0000,   2.4900,  -0.0010], [50.0000, -2.4900,   0.0010],  7.1792],
  [[50.0000,   2.4900,  -0.0010], [50.0000, -2.4900,   0.0011],  7.2195],
  [[50.0000,   2.4900,  -0.0010], [50.0000, -2.4900,   0.0012],  7.2195],
  [[50.0000,  -0.0010,   2.4900], [50.0000,  0.0009,  -2.4900],  4.8045],
  [[50.0000,   2.5000,   0.0000], [50.0000,  0.0000,  -2.5000],  4.3065],
  [[50.0000,   2.5000,   0.0000], [73.0000, 25.0000, -18.0000], 27.1492],
  [[50.0000,   2.5000,   0.0000], [61.0000, -5.0000,  29.0000], 22.8977],
  [[50.0000,   2.5000,   0.0000], [56.0000,-27.0000,  -3.0000], 31.9030],
  [[50.0000,   2.5000,   0.0000], [58.0000, 24.0000,  15.0000], 19.4535],
  [[50.0000,   2.5000,   0.0000], [50.0000,  3.1736,   0.5854],  1.0000],
  [[50.0000,   2.5000,   0.0000], [50.0000,  3.2972,   0.0000],  1.0000],
  [[50.0000,   2.5000,   0.0000], [50.0000,  1.8634,   0.5757],  1.0000],
  [[50.0000,   2.5000,   0.0000], [50.0000,  3.2592,   0.3350],  1.0000],
  [[60.2574, -34.0099,  36.2677], [60.4626,-34.1751,  39.4387],  1.2644],
  [[63.0109, -31.0961,  -5.8663], [62.8187,-29.7946,  -4.0864],  1.2630],
  [[61.2901,   3.7196,  -5.3901], [61.4292,  2.2480,  -4.9620],  1.8731],
  [[35.0831, -44.1164,   3.7933], [35.0232,-40.0716,   1.5901],  1.8645],
  [[22.7233,  20.0904, -46.6940], [23.0331, 14.9730, -42.5619],  2.0373],
  [[36.4612,  47.8580,  18.3852], [36.2715, 50.5065,  21.2231],  1.4146],
  [[90.8027,  -2.0831,   1.4410], [91.1528, -1.6435,   0.0447],  1.4441],
  [[90.9257,  -0.5406,  -0.9208], [88.6381, -0.8985,  -0.7239],  1.5381],
  [[ 6.7747,  -0.2908,  -2.4247], [ 5.8714, -0.0985,  -2.2286],  0.6377],
  [[ 2.0776,   0.0795,  -1.1350], [ 0.9033, -0.0636,  -0.5514],  0.9082],
];

describe('CIEDE2000 — la fórmula, contra los datos publicados', () => {
  it.each(SHARMA)('%j / %j → %f', (a, b, esperado) => {
    expect(de2000Lab(a, b)).toBeCloseTo(esperado, 4);
  });

  it('es SIMÉTRICA — que es donde la implementación ingenua se rompe', () => {
    /* La media de dos tonos a los dos lados de 0° sale del lado contrario si no
       se corrige, y entonces de2000(a,b) ≠ de2000(b,a). Los pares 9-13 de
       arriba están ahí por eso; esto lo comprueba sobre los treinta y dos. */
    for (const [a, b] of SHARMA) {
      expect(de2000Lab(b, a)).toBeCloseTo(de2000Lab(a, b), 10);
    }
  });

  it('un color consigo mismo da CERO, y no un residuo', () => {
    for (const [a] of SHARMA) expect(de2000Lab(a, a)).toBe(0);
    for (const h of ['#0E6F63', '#FFFFFF', '#000000', '#F0EFEE']) {
      expect(de2000(h, h)).toBe(0);
    }
  });
});

describe('La conversión a L*a*b*, en los anclajes que no dependen de nadie', () => {
  it('el blanco de referencia es L*=100 y cromas cero', () => {
    const [L, a, b] = lab('#FFFFFF');
    expect(L).toBeCloseTo(100, 6);
    expect(a).toBeCloseTo(0, 6);
    expect(b).toBeCloseTo(0, 6);
  });

  it('el negro es el origen', () => {
    expect(lab('#000000').map((x: number) => Math.round(x * 1e6) / 1e6)).toEqual([0, 0, 0]);
  });

  it('blanco contra negro da 100, que es el techo de la escala', () => {
    expect(de2000('#FFFFFF', '#000000')).toBeCloseTo(100, 4);
  });

  it('acepta la forma corta de tres dígitos', () => {
    expect(de2000('#FFF', '#FFFFFF')).toBe(0);
  });
});

describe('El suelo que el sistema usa', () => {
  it('JND es 2,3 — y esta prueba existe para que cambiarlo sea deliberado', () => {
    expect(JND).toBe(2.3);
  });

  it('el par más cercano del chip queda POR ENCIMA del suelo, con su margen', () => {
    /* `chip-pend` y `chip-inact`: los dos grises, y los dos vecinos en
       significado. Es el peor par del componente y el que fija cuánto margen
       hay de verdad. Si alguien toca un gris, esto lo dice antes que nadie. */
    const d = de2000('#F0EFEE', '#E0DFDE');
    expect(d).toBeGreaterThan(JND);
    expect(d).toBeCloseTo(3.47, 2);
  });

  it('y los cuatro de identidad se separan de sobra entre sí', () => {
    const ident = ['#0E6F63', '#6A3FA0', '#9B3B6E', '#4A5568'];
    for (let i = 0; i < ident.length; i++) {
      for (let j = i + 1; j < ident.length; j++) {
        expect(de2000(ident[i], ident[j]), `${ident[i]} / ${ident[j]}`).toBeGreaterThan(10);
      }
    }
  });
});
