/**
 * DISTANCIA PERCEPTUAL ENTRE DOS COLORES — CIEDE2000.
 *
 * La razon de contraste de WCAG responde a UNA pregunta: «¿se lee este texto
 * sobre este fondo?». No responde a la otra que el sistema necesita:
 * «¿se distinguen estos dos rellenos ENTRE SI?».
 *
 * No son la misma pregunta y confundirlas costo el R143. El catalogo ya decia
 * que el relleno de un chip da entre 1,00 y 1,19:1 contra su superficie —y eso
 * es CORRECTO, por eso existe el filete—. Pero con esa misma vara, dos chips de
 * luminancia identica y tono distinto tambien dan 1,00:1, y la vara no sabe
 * decir si uno es gris y el otro magenta.
 *
 * CIEDE2000 si: mide en un espacio donde una unidad es aproximadamente lo mismo
 * en cualquier parte, y su umbral de percepcion —el JND, «just noticeable
 * difference»— esta reconocido en 2,3. Por debajo de eso, dos colores puestos
 * uno al lado del otro no se distinguen.
 *
 * Es la unica matematica de color del repositorio que NO viene de WCAG, y esta
 * aqui y no dentro de un candado porque la usan dos: el candado que vigila y el
 * catalogo que publica la medida.
 *
 * Referencia: CIE 142-2001 / Sharma, Wu & Dalal (2005), «The CIEDE2000
 * Color-Difference Formula: Implementation Notes, Supplementary Test Data and
 * Mathematical Observations», Color Research & Application 30(1), 21-30.
 *
 * LOS DATOS DE PRUEBA DE ESA PUBLICACION ESTAN EN
 * `componentes/pruebas/distancia.test.ts`, y se comprueban a 1e-4. Esta linea
 * decia `probar-candado.mjs` y era FALSA: ese archivo prueba los ocho patrones
 * de ESLint y nada mas, asi que la unica matematica de color del repositorio
 * que no viene de WCAG no tenia ni una prueba mientras su cabecera afirmaba que
 * si. Lo cazo una auditoria adversaria el 2026-09-16. Es exactamente lo que
 * CLAUDE.md §9 llama fatal, cometido aqui mismo.
 */

const canales = (hex) => {
  const h = hex.trim().replace('#', '');
  const largo = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(largo.slice(i, i + 2), 16));
};

/** sRGB a lineal — la misma curva que usa la luminancia de WCAG. */
const lineal = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/**
 * sRGB a CIE L*a*b*, con blanco de referencia D65.
 *
 * EL BLANCO SALE DE LA PROPIA MATRIZ, sumando sus filas, y no de las constantes
 * publicadas de D65. No es purismo: con las constantes —0,9504559 y 1,0890578—
 * el blanco puro daba L*=100,000004 y un croma de 0,014 en vez de cero, porque
 * la matriz sRGB redondeada no suma exactamente ese blanco. Es despreciable
 * para una distancia, y aun asi esta mal: el blanco es el punto que define la
 * escala, y una escala cuyo origen no cae en cero se defiende sola en cada
 * discusion futura. Lo delato la prueba del anclaje.
 */
const M = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.072175],
  [0.0193339, 0.119192, 0.9503041],
];
const BLANCO = M.map((fila) => fila[0] + fila[1] + fila[2]);

export function lab(hex) {
  const [r, g, b] = canales(hex).map(lineal);
  const X = (M[0][0] * r + M[0][1] * g + M[0][2] * b) / BLANCO[0];
  const Y = (M[1][0] * r + M[1][1] * g + M[1][2] * b) / BLANCO[1];
  const Z = (M[2][0] * r + M[2][1] * g + M[2][2] * b) / BLANCO[2];
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const grados = (rad) => ((rad * 180) / Math.PI + 360) % 360;

/** Diferencia de color CIEDE2000 entre dos hexadecimales. 0 = identicos. */
export function de2000(hexA, hexB) {
  return de2000Lab(lab(hexA), lab(hexB));
}

/**
 * Lo mismo, pero sobre L*a*b* directamente.
 *
 * Existe separado PARA PODER PROBARLO. Los datos de prueba publicados de
 * CIEDE2000 son pares de L*a*b*, no hexadecimales — y con razon: la formula es
 * de color, no de sRGB. Mezclar las dos cosas en una sola funcion era dejar la
 * unica matematica de color del repositorio sin forma de comprobarse contra
 * nada de fuera.
 */
export function de2000Lab([L1, a1, b1], [L2, a2, b2]) {

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cmedia = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cmedia ** 7 / (Cmedia ** 7 + 25 ** 7)));
  const A1 = (1 + G) * a1;
  const A2 = (1 + G) * a2;

  const Cp1 = Math.hypot(A1, b1);
  const Cp2 = Math.hypot(A2, b2);
  const h1 = Cp1 === 0 ? 0 : grados(Math.atan2(b1, A1));
  const h2 = Cp2 === 0 ? 0 : grados(Math.atan2(b2, A2));

  const dL = L2 - L1;
  const dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) {
    dh = h2 - h1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh * Math.PI) / 360);

  const Lb = (L1 + L2) / 2;
  const Cb = (Cp1 + Cp2) / 2;
  let hb;
  if (Cp1 * Cp2 === 0) hb = h1 + h2;
  else {
    hb = (h1 + h2) / 2;
    if (Math.abs(h1 - h2) > 180) hb += h1 + h2 < 360 ? 180 : -180;
  }

  const rad = (d) => (d * Math.PI) / 180;
  const T =
    1 -
    0.17 * Math.cos(rad(hb - 30)) +
    0.24 * Math.cos(rad(2 * hb)) +
    0.32 * Math.cos(rad(3 * hb + 6)) -
    0.2 * Math.cos(rad(4 * hb - 63));

  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cb;
  const Sh = 1 + 0.015 * Cb * T;
  const Rt =
    -2 *
    Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)) *
    Math.sin(rad(60 * Math.exp(-(((hb - 275) / 25) ** 2))));

  return Math.sqrt(
    (dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh)
  );
}

/**
 * EL SUELO. 2,3 es el JND: por debajo, dos colores no se distinguen.
 *
 * No es un numero elegido por nosotros ni ajustado a lo que teniamos: es el
 * umbral publicado, y el sistema estaba en 0,0 cuando se midio por primera vez.
 */
export const JND = 2.3;
