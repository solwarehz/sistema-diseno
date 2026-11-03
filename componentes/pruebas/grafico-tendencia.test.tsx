/**
 * GRÁFICO DE TENDENCIA (SPEC 07, R169)
 *
 * Las reglas son las de la sección «Gráfico de tendencia» de `comportamiento.md`;
 * cada título lleva el número de la suya. jsdom no tiene maquetación: el ancho
 * de la pieza se SIMULA (`clientWidth` y un `ResizeObserver` de mentira cuyo
 * aviso se dispara a mano). Lo que depende de un navegador de verdad —medir a
 * 360 y 390, el `prefers-reduced-motion` real— no se prueba aquí.
 */
import { render, screen, within, fireEvent, createEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  GraficoTendencia, escalaEje, geometriaGrafico, puntoMasCercano, textosPunto, nombreSemana,
  type GraficoTendenciaProps, type PuntoTendencia,
} from '../src/GraficoTendencia';
import * as raiz from '../src/index';

const HOJA = readFileSync(
  resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'),
  'utf8',
);
/** Solo las reglas del gráfico: el extractor las agrupa bajo su cabecera y la siguiente es la de otro elemento. */
const INICIO = HOJA.indexOf('GRÁFICO DE TENDENCIA');
const HOJA_GRAF = HOJA.slice(INICIO, HOJA.indexOf('/* ──', INICIO + 200));

// ── El ancho de la pieza, simulado ───────────────────────────────────────────
let anchoSim = 360;
let avisos: Array<() => void> = [];
class ObservadorFalso {
  constructor(cb: () => void) { avisos.push(cb); }
  observe() {}
  unobserve() {}
  disconnect() {}
}
const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

beforeEach(() => {
  anchoSim = 360;
  avisos = [];
  vi.stubGlobal('ResizeObserver', ObservadorFalso);
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() { return (this as HTMLElement).classList.contains('graf-vista') ? anchoSim : 0; },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
  else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
});
const cambiarAncho = (w: number) => { anchoSim = w; act(() => avisos.forEach((f) => f())); };

// ── Datos del catálogo ───────────────────────────────────────────────────────
const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const RANGOS = ['26 oct – 1 nov', '19 oct – 25 oct', '12 oct – 18 oct', '5 oct – 11 oct', '28 sep – 4 oct', '21 sep – 27 sep', '14 sep – 20 sep'];
const TARDANZA = [612, 540, 585, 498, 660, 702, 631];
const FALTA = [2300, 2470, 1980, 2760, 3100, 2640, 2900];
const pts = (v: number[]): PuntoTendencia[] => v.map((valor, i) => ({ valor, detalle: RANGOS[i] }));

function props(extra: Partial<GraficoTendenciaProps> = {}): GraficoTendenciaProps {
  return {
    titulo: 'Tardanzas', puntos: pts(TARDANZA), formato: String, unidad: 'min',
    columnaValor: 'Minutos',
    referencia: { valor: 585, etiqueta: 'Promedio: 585' },
    comparaciones: <span className="chip chip-aviso">▲ +72 min vs. semana previa</span>,
    ...extra,
  };
}
const pintar = (extra: Partial<GraficoTendenciaProps> = {}) => render(<GraficoTendencia {...props(extra)} />);
const vistaDe = (c: HTMLElement) => c.querySelector('.graf-vista') as HTMLElement;
const textosSvg = (c: HTMLElement, sel: string) => [...c.querySelectorAll(`svg ${sel}`)].map((n) => n.textContent);

/** pointermove con clientX: jsdom no trae PointerEvent y se perdería el campo. */
function mover(el: HTMLElement, clientX: number, tipo: 'pointerMove' | 'pointerDown' = 'pointerMove') {
  const ev = createEvent[tipo](el);
  Object.defineProperty(ev, 'clientX', { value: clientX });
  fireEvent(el, ev);
}
/** Las líneas de la ventana, en orden: semana, rango, valor con unidad y, si hay, la diferencia. */
const lineaVentana = (c: HTMLElement, k: number): string | null =>
  c.querySelectorAll('.graf-vent text')[k]?.textContent ?? null;
const xDe = (w: number, i: number) => geometriaGrafico({ ancho: w, valores: TARDANZA, referencia: 585 }).puntos[i].x;

// ═════════════════════════════════════════════════════════════════════════════
describe('GraficoTendencia · la estructura (R169)', () => {
  it('[1] (R169) es una sección con título `h2` que la nombra y el valor grande del punto 0 con su unidad', () => {
    const { container } = pintar();
    const sec = container.querySelector('section.graf')!;
    const h = within(sec as HTMLElement).getByRole('heading', { name: 'Tardanzas' });
    expect(h.tagName).toBe('H2');
    expect(sec.getAttribute('aria-labelledby')).toBe(h.id);
    const num = container.querySelector('.graf-num')!;
    expect(num.querySelector('span')!.textContent).toBe('612');
    expect(num.querySelector('small')!.textContent).toBe('min');
  });

  it('[1] (R169) el valor grande usa `formato` (h:mm) y no el número crudo', () => {
    const { container } = pintar({ titulo: 'Faltas', puntos: pts(FALTA), formato: hm, unidad: 'hrs', base: 60 });
    expect(container.querySelector('.graf-num span')!.textContent).toBe('38:20');
  });

  it('[1] (R169) `comparaciones` es un hueco: sale tal cual, y sin él no queda un contenedor vacío', () => {
    const { container, rerender } = pintar();
    expect(container.querySelector('.graf-chips .chip')!.textContent).toContain('+72 min');
    rerender(<GraficoTendencia {...props({ comparaciones: undefined })} />);
    expect(container.querySelector('.graf-chips')).toBeNull();
  });
});

describe('GraficoTendencia · la geometría (R169)', () => {
  const ANCHOS = [280, 360, 390, 519, 520, 768, 1200];

  it('[2] (R169) dibuja un punto por valor: siete valores, siete puntos', () => {
    for (const w of ANCHOS) {
      const g = geometriaGrafico({ ancho: w, valores: TARDANZA });
      expect(g.puntos).toHaveLength(7);
      expect(g.puntos.map((p) => p.valor)).toEqual(TARDANZA);
    }
    const { container } = pintar();
    expect(container.querySelectorAll('svg circle.graf-p0, svg circle.graf-p')).toHaveLength(7);
  });

  it('[2] (R169) el punto 0 queda a no más de 16 px del eje vertical y el 6 es el más alejado, en todo ancho', () => {
    for (const w of ANCHOS) {
      const g = geometriaGrafico({ ancho: w, valores: TARDANZA });
      const d0 = g.puntos[0].x - g.izq;
      expect(d0).toBeGreaterThan(0);
      expect(d0).toBeLessThanOrEqual(16);
      for (let i = 1; i < 7; i++) expect(g.puntos[i].x).toBeGreaterThan(g.puntos[i - 1].x);
      expect(g.puntos[6].x).toBeLessThanOrEqual(g.ancho - g.der);
    }
  });

  it('[2] (R169) el valor más alto queda más arriba; el cero, sobre la línea base', () => {
    const g = geometriaGrafico({ ancho: 360, valores: [0, 100, 50] });
    expect(g.puntos[0].y).toBe(g.yBase);
    expect(g.puntos[1].y).toBeLessThan(g.puntos[2].y);
    expect(g.puntos[2].y).toBeLessThan(g.puntos[0].y);
    expect(g.puntos[1].y).toBeGreaterThanOrEqual(g.arriba);
  });

  it('[2] (R169) un ancho menor de 280 se trata como 280, y un solo punto no divide entre cero', () => {
    expect(geometriaGrafico({ ancho: 100, valores: TARDANZA }).ancho).toBe(280);
    const uno = geometriaGrafico({ ancho: 360, valores: [5] });
    expect(Number.isFinite(uno.puntos[0].x)).toBe(true);
    expect(uno.puntos).toHaveLength(1);
  });

  it('[3] (R169) el tope se redondea HACIA ARRIBA a un número «bonito» y nunca queda por debajo del máximo', () => {
    expect(escalaEje(702, 1).tope).toBe(800);
    expect(escalaEje(100, 1).tope).toBe(200);
    for (let m = 1; m <= 5000; m += 37) {
      for (const base of [1, 60]) expect(escalaEje(m, base).tope).toBeGreaterThanOrEqual(m);
    }
  });

  it('[3] (R169) el eje tiene el cero y cuatro marcas equidistantes hasta el tope', () => {
    const e = escalaEje(702, 1);
    expect(e.marcas).toEqual([0, 200, 400, 600, 800]);
    expect(e.marcas[4]).toBe(e.tope);
  });

  it('[3] (R169) con `base` 60 todas las marcas caen en horas enteras (minutos escritos como h:mm)', () => {
    for (const max of [30, 600, 2300, 3100, 9000]) {
      for (const m of escalaEje(max, 60).marcas) expect(m % 60).toBe(0);
    }
    expect(escalaEje(3100, 60).marcas.map(hm)).toEqual(['0:00', '20:00', '40:00', '60:00', '80:00']);
  });

  it('[3] (R169) un máximo 0, negativo o no numérico da un eje utilizable', () => {
    for (const m of [0, -5, NaN, Infinity]) {
      const e = escalaEje(m, 1);
      expect(e.tope).toBe(4);
      expect(e.marcas).toEqual([0, 1, 2, 3, 4]);
    }
    expect(escalaEje(10, 0).tope).toBeGreaterThan(0);
  });

  it('[3] (R169) la referencia más alta que los puntos también cabe en el eje', () => {
    const g = geometriaGrafico({ ancho: 360, valores: [10, 20], referencia: 900 });
    expect(g.escala.tope).toBeGreaterThanOrEqual(900);
    expect(g.yReferencia).toBeGreaterThanOrEqual(g.arriba);
  });

  it('[3] (R169) los rótulos del eje se escriben con `formato`, con la cuadrícula y la base más fuerte', () => {
    const { container } = pintar({ titulo: 'Faltas', puntos: pts(FALTA), formato: hm, unidad: 'hrs', base: 60 });
    expect(textosSvg(container, '.graf-eje')).toEqual(['0:00', '20:00', '40:00', '60:00', '80:00']);
    expect(container.querySelectorAll('svg line.graf-rej')).toHaveLength(4);
    expect(container.querySelectorAll('svg line.graf-base')).toHaveLength(1);
  });
});

describe('GraficoTendencia · el dibujo (R169)', () => {
  it('[4] (R169) hay línea y área bajo la línea con degradado, cuyo color sale de una clase y no de `style`', () => {
    const { container } = pintar();
    expect(container.querySelector('svg path.graf-lin')).not.toBeNull();
    const area = container.querySelector('svg path.graf-area')!;
    const id = /url\(#(.+)\)/.exec(area.getAttribute('fill') ?? '')![1];
    const grad = container.querySelector(`svg linearGradient[id="${id}"]`)!;
    expect(grad.querySelectorAll('stop.graf-stop')).toHaveLength(2);
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('[4] (R169) el punto 0 lleva halo y NO repite su valor: ese valor ya está en grande', () => {
    for (const w of [360, 700]) {
      anchoSim = w;
      const { container, unmount } = pintar();
      expect(container.querySelector('svg circle.graf-halo')).not.toBeNull();
      const todos = [...container.querySelectorAll('svg text')].map((t) => t.textContent);
      expect(todos).not.toContain('612');
      unmount();
    }
  });

  it('[4] (R169) bajo cada punto va su número de semana y «actual» bajo el 0; no hay fechas bajo el eje', () => {
    const { container } = pintar();
    const nums = [...container.querySelectorAll('svg text.graf-num0, svg text.graf-numero')].map((t) => t.textContent);
    expect(nums).toEqual(['0', '1', '2', '3', '4', '5', '6']);
    expect(textosSvg(container, '.graf-sub')).toEqual(['actual']);
    const svg = container.querySelector('svg')!.textContent!;
    expect(svg).not.toMatch(/oct|sep|nov/);
  });

  it('[5] (R169) con `referencia` hay línea punteada y su etiqueta a la derecha', () => {
    const { container } = pintar();
    expect(container.querySelectorAll('svg line.graf-ref')).toHaveLength(1);
    const t = container.querySelector('svg text.graf-ref-t')!;
    expect(t.textContent).toBe('Promedio: 585');
    expect(t.getAttribute('text-anchor')).toBe('end');
  });

  it('[5] (R169) sin `referencia` no sale ni la línea ni la etiqueta', () => {
    const { container } = pintar({ referencia: undefined });
    expect(container.querySelector('svg .graf-ref')).toBeNull();
    expect(container.querySelector('svg .graf-ref-t')).toBeNull();
    expect(container.querySelector('.graf-vista')!.getAttribute('aria-label')).not.toMatch(/Promedio/);
  });
});

describe('GraficoTendencia · el ancho de la pieza (R169)', () => {
  it('[6] (R169) con la pieza de menos de 520 px ningún punto muestra su valor encima', () => {
    for (const w of [280, 360, 390, 519]) {
      anchoSim = w;
      const { container, unmount } = pintar();
      expect(container.querySelectorAll('svg text.graf-val')).toHaveLength(0);
      unmount();
    }
  });

  it('[6] (R169) con 520 px o más los puntos 1 a 6 muestran su valor y el 0 no', () => {
    for (const w of [520, 700, 1200]) {
      anchoSim = w;
      const { container, unmount } = pintar();
      expect(textosSvg(container, '.graf-val')).toEqual(TARDANZA.slice(1).map(String));
      unmount();
    }
  });

  it('[6] (R169) los valores sobre los puntos se escriben con `formato`', () => {
    anchoSim = 700;
    const { container } = pintar({ puntos: pts(FALTA), formato: hm, base: 60, unidad: 'hrs' });
    expect(textosSvg(container, '.graf-val')).toEqual(FALTA.slice(1).map(hm));
  });

  it('[6] (R169) se redibuja al cambiar el ancho, en los dos sentidos, sin recargar', () => {
    const { container } = pintar();
    const svg = () => container.querySelector('svg')!;
    expect(svg().getAttribute('width')).toBe('360');
    expect(svg().getAttribute('height')).toBe('250');
    expect(container.querySelectorAll('svg text.graf-val')).toHaveLength(0);
    cambiarAncho(600);
    expect(svg().getAttribute('width')).toBe('600');
    expect(svg().getAttribute('height')).toBe('300');
    expect(container.querySelectorAll('svg text.graf-val')).toHaveLength(6);
    cambiarAncho(400);
    expect(svg().getAttribute('width')).toBe('400');
    expect(container.querySelectorAll('svg text.graf-val')).toHaveLength(0);
  });

  it('[6] (R169) el ancho se mide sobre el propio contenedor y no sobre la ventana', () => {
    // La ventana (jsdom) mide 1024; la pieza, 300: manda la pieza.
    anchoSim = 300;
    const { container } = pintar();
    expect(window.innerWidth).toBeGreaterThanOrEqual(520);
    expect(container.querySelectorAll('svg text.graf-val')).toHaveLength(0);
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('300');
  });

  it('[6] (R169) sin `ResizeObserver` se dibuja igual con la medida de montaje', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { container } = pintar();
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('360');
  });
});

describe('GraficoTendencia · la ventana (R169)', () => {
  it('[7] (R169) sin cursor ni foco no hay ventana, guía ni punto resaltado', () => {
    const { container } = pintar();
    expect(container.querySelector('.graf-vent')).toBeNull();
    expect(container.querySelector('.graf-guia')).toBeNull();
    expect(container.querySelector('.graf-anillo')).toBeNull();
  });

  it('[7] (R169) con el cursor sobre un punto aparecen la guía vertical, el punto resaltado y la ventana', () => {
    const { container } = pintar();
    mover(vistaDe(container), xDe(360, 3) + 2);
    expect(container.querySelector('line.graf-guia')).not.toBeNull();
    expect(container.querySelector('circle.graf-anillo')!.getAttribute('cx')).toBe(String(xDe(360, 3)));
    expect(lineaVentana(container, 0)).toBe('Hace 3 semanas');
    expect(lineaVentana(container, 1)).toBe(RANGOS[3]);
    expect(lineaVentana(container, 2)).toBe('498 min');
  });

  it('[7] (R169) tocar (pointerdown) también la abre', () => {
    const { container } = pintar();
    mover(vistaDe(container), xDe(360, 5), 'pointerDown');
    expect(lineaVentana(container, 0)).toBe('Hace 5 semanas');
  });

  it('[7] (R169) la ventana dice «Esta semana» / «Hace 1 semana» / «Hace N semanas»', () => {
    expect([0, 1, 2, 6].map(nombreSemana)).toEqual(['Esta semana', 'Hace 1 semana', 'Hace 2 semanas', 'Hace 6 semanas']);
  });

  it('[7] (R169) la ventana compara con esta semana, con signo menos de verdad; el punto 0 no se compara consigo', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    mover(v, xDe(360, 1));
    expect(lineaVentana(container, 3)).toBe('−72 frente a esta semana');
    mover(v, xDe(360, 2));
    expect(lineaVentana(container, 3)).toBe('−27 frente a esta semana');
    mover(v, xDe(360, 5));
    expect(lineaVentana(container, 3)).toBe('+90 frente a esta semana');
    mover(v, xDe(360, 0));
    expect(lineaVentana(container, 0)).toBe('Esta semana');
    expect(lineaVentana(container, 3)).toBeNull();
  });

  it('[7] (R169) un valor igual al actual dice «igual que esta semana»', () => {
    const { container } = pintar({ puntos: pts([10, 10, 20]) });
    mover(vistaDe(container), geometriaGrafico({ ancho: 360, valores: [10, 10, 20] }).puntos[1].x);
    expect(lineaVentana(container, 3)).toBe('igual que esta semana');
  });

  it('[7] (R169) la ventana no se sale del dibujo ni en el primero ni en el último punto', () => {
    const { container } = pintar();
    for (const i of [0, 6]) {
      mover(vistaDe(container), xDe(360, i));
      const r = container.querySelector('rect.graf-vent-fondo')!;
      const x = Number(r.getAttribute('x'));
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + Number(r.getAttribute('width'))).toBeLessThanOrEqual(360);
      expect(Number(r.getAttribute('y'))).toBeGreaterThanOrEqual(0);
    }
  });

  it('[7] (R169) el cursor lejos de los extremos elige el punto más cercano, dentro de 0..6', () => {
    const g = geometriaGrafico({ ancho: 360, valores: TARDANZA });
    expect(puntoMasCercano(-500, g)).toBe(0);
    expect(puntoMasCercano(5000, g)).toBe(6);
    expect(puntoMasCercano(g.puntos[4].x + g.paso * 0.4, g)).toBe(4);
    expect(puntoMasCercano(g.puntos[4].x + g.paso * 0.6, g)).toBe(5);
  });

  it('[7] (R169) al salir el cursor la ventana se cierra, y al perder el foco también', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    mover(v, xDe(360, 2));
    expect(container.querySelector('.graf-vent')).not.toBeNull();
    // React deriva `pointerleave` de `pointerout`; jsdom no trae PointerEvent y se perdería el tipo.
    const salida = createEvent.pointerOut(v);
    Object.defineProperty(salida, 'pointerType', { value: 'mouse' });
    fireEvent(v, salida);
    expect(container.querySelector('.graf-vent')).toBeNull();
    mover(v, xDe(360, 2));
    fireEvent.blur(v);
    expect(container.querySelector('.graf-vent')).toBeNull();
  });
});

describe('GraficoTendencia · ventana con toque y contenedor estrecho (R169)', () => {
  it('[7] (R169) con el DEDO la ventana no se cierra al salir el puntero: `pointerleave` de tipo touch no la cierra', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    mover(v, xDe(360, 2), 'pointerDown');
    expect(container.querySelector('.graf-vent')).not.toBeNull();
    const salida = createEvent.pointerOut(v);
    Object.defineProperty(salida, 'pointerType', { value: 'touch' });
    fireEvent(v, salida);
    expect(container.querySelector('.graf-vent')).not.toBeNull();
  });

  it('[7] (R169) con un contenedor de menos de 280 px el dibujo se escala y el cursor sigue eligiendo el punto bajo él', () => {
    anchoSim = 140; // el dibujo mide 280 y el CSS lo encoge a 140: la mitad
    const { container } = pintar();
    const v = vistaDe(container);
    v.getBoundingClientRect = () => ({ left: 10, top: 0, width: 140, height: 125, right: 150, bottom: 125, x: 10, y: 0, toJSON() {} }) as DOMRect;
    const g = geometriaGrafico({ ancho: 140, valores: TARDANZA });
    expect(g.ancho).toBe(280);
    for (const i of [0, 3, 6]) {
      mover(v, 10 + g.puntos[i].x / 2);
      expect(lineaVentana(container, 0)).toBe(nombreSemana(i));
    }
  });

  it('[13] (R169) la hoja deja el desplazamiento vertical al navegador y toma el horizontal para el cursor (`touch-action: pan-y`)', () => {
    expect(HOJA_GRAF).toMatch(/\.graf-svg\s*\{[^}]*touch-action:\s*pan-y/);
  });
});

describe('GraficoTendencia · el teclado (R169)', () => {
  const tecla = (el: HTMLElement, key: string) => fireEvent.keyDown(el, { key });
  const semana = (c: HTMLElement) => lineaVentana(c, 0);

  it('[8] (R169) el contenedor entra en el orden de tabulación y toma el foco', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    expect(v.getAttribute('tabindex')).toBe('0');
    v.focus();
    expect(document.activeElement).toBe(v);
  });

  it('[8] (R169) las flechas recorren los puntos desde el 0 y se detienen en los extremos', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    tecla(v, 'ArrowRight');
    expect(semana(container)).toBe('Esta semana');
    tecla(v, 'ArrowRight');
    expect(semana(container)).toBe('Hace 1 semana');
    tecla(v, 'ArrowRight'); tecla(v, 'ArrowRight');
    expect(semana(container)).toBe('Hace 3 semanas');
    tecla(v, 'ArrowLeft');
    expect(semana(container)).toBe('Hace 2 semanas');
    for (let k = 0; k < 10; k++) tecla(v, 'ArrowRight');
    expect(semana(container)).toBe('Hace 6 semanas');
    for (let k = 0; k < 10; k++) tecla(v, 'ArrowLeft');
    expect(semana(container)).toBe('Esta semana');
  });

  it('[8] (R169) Inicio y Fin saltan a los extremos', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    tecla(v, 'End');
    expect(semana(container)).toBe('Hace 6 semanas');
    tecla(v, 'Home');
    expect(semana(container)).toBe('Esta semana');
  });

  it('[8] (R169) Escape cierra la ventana y deja pasar la tecla si no había nada que cerrar', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    tecla(v, 'End');
    expect(semana(container)).not.toBeNull();
    expect(fireEvent.keyDown(v, { key: 'Escape' })).toBe(false); // se atendió: preventDefault
    expect(semana(container)).toBeNull();
    expect(fireEvent.keyDown(v, { key: 'Escape' })).toBe(true); // nada abierto: no se traga la tecla
  });

  it('[8] (R169) las flechas atendidas no desplazan la página; otras teclas no se tragan', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    expect(fireEvent.keyDown(v, { key: 'ArrowRight' })).toBe(false);
    expect(fireEvent.keyDown(v, { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(v, { key: 'a' })).toBe(true);
  });

  it('[8] (R169) el foco es visible: la hoja da un anillo propio al contenedor y al resumen de la tabla', () => {
    expect(HOJA_GRAF).toMatch(/\.graf-vista:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--grafico-foco\)/);
    expect(HOJA_GRAF).toMatch(/\.graf-det summary:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--grafico-foco\)/);
  });
});

describe('GraficoTendencia · lo que oye el lector (R169)', () => {
  const viva = (c: HTMLElement) => c.querySelector('[aria-live]') as HTMLElement;

  it('[9] (R169) hay una región `aria-live` educada, fuera del SVG, vacía hasta que se elige un punto', () => {
    const { container } = pintar();
    const r = viva(container);
    expect(r.getAttribute('aria-live')).toBe('polite');
    expect(r.closest('svg')).toBeNull();
    expect(r.textContent).toBe('');
  });

  it('[9] (R169) al recorrer los puntos anuncia semana, rango y valor con unidad', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    fireEvent.keyDown(v, { key: 'End' });
    expect(viva(container).textContent).toBe('Hace 6 semanas, 14 sep – 20 sep: 631 min');
    fireEvent.keyDown(v, { key: 'ArrowLeft' });
    expect(viva(container).textContent).toBe('Hace 5 semanas, 21 sep – 27 sep: 702 min');
  });

  it('[9] (R169) al cerrar la ventana la región se vacía', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    fireEvent.keyDown(v, { key: 'Home' });
    expect(viva(container).textContent).not.toBe('');
    fireEvent.keyDown(v, { key: 'Escape' });
    expect(viva(container).textContent).toBe('');
  });

  it('[10] (R169) el SVG es decoración: `aria-hidden` y sin foco propio', () => {
    const { container } = pintar();
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
  });

  it('[10] (R169) la alternativa accesible es el contenedor enfocable `role="group"`, con el valor actual y la referencia', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    expect(v.getAttribute('role')).toBe('group');
    const nombre = v.getAttribute('aria-label')!;
    expect(nombre).toContain('Tardanzas');
    expect(nombre).toContain('Esta semana 612 min');
    expect(nombre).toContain('Promedio: 585');
    expect(nombre).toMatch(/Flechas/);
    expect(screen.getByRole('group', { name: nombre })).toBe(v);
  });

  it('[10] (R169) el valor actual del texto alternativo usa `formato`', () => {
    const { container } = pintar({ puntos: pts(FALTA), formato: hm, unidad: 'hrs', base: 60, referencia: { valor: 2630, etiqueta: 'Promedio: 43:50' } });
    expect(vistaDe(container).getAttribute('aria-label')).toContain('Esta semana 38:20 hrs; Promedio: 43:50');
  });
});

describe('GraficoTendencia · la tabla desplegable (R169)', () => {
  it('[11] (R169) hay una tabla desplegable «Ver las cifras de cada semana» cerrada de entrada', () => {
    const { container } = pintar();
    const det = container.querySelector('details.graf-det') as HTMLDetailsElement;
    expect(det.open).toBe(false);
    expect(det.querySelector('summary')!.textContent).toBe('Ver las cifras de cada semana');
  });

  it('[11] (R169) las columnas son «Semana atrás», «Periodo» y la que pasa la app', () => {
    const { container } = pintar();
    const cabs = [...container.querySelectorAll('.graf-tabla thead th')].map((t) => t.textContent);
    expect(cabs).toEqual(['Semana atrás', 'Periodo', 'Minutos']);
  });

  it('[11] (R169) una fila por punto; la primera dice «0 (actual)»', () => {
    const { container } = pintar();
    const filas = container.querySelectorAll('.graf-tabla tbody tr');
    expect(filas).toHaveLength(7);
    expect(filas[0].querySelector('th')!.textContent).toBe('0 (actual)');
    expect(filas[6].querySelector('th')!.textContent).toBe('6');
  });

  it('[11] (R169) la ventana y la fila de la tabla muestran el MISMO rango y el MISMO valor, para los siete puntos', () => {
    for (const [datos, formato, unidad, base] of [
      [TARDANZA, String, 'min', 1],
      [FALTA, hm, 'hrs', 60],
    ] as const) {
      const { container, unmount } = pintar({ puntos: pts([...datos]), formato, unidad, base });
      const filas = [...container.querySelectorAll('.graf-tabla tbody tr')];
      const v = vistaDe(container);
      for (let i = 0; i < 7; i++) {
        fireEvent.keyDown(v, { key: i === 0 ? 'Home' : 'ArrowRight' });
        const rangoVentana = lineaVentana(container, 1);
        const valorVentana = lineaVentana(container, 2);
        const celdas = filas[i].querySelectorAll('td');
        expect(celdas[0].textContent).toBe(rangoVentana);
        expect(`${celdas[1].textContent} ${unidad}`).toBe(valorVentana);
        expect(celdas[0].textContent).toBe(RANGOS[i]);
        expect(celdas[1].textContent).toBe(formato(datos[i]));
        // y lo anunciado lo dice igual
        expect(container.querySelector('[aria-live]')!.textContent).toContain(`${rangoVentana}: ${valorVentana}`);
      }
      unmount();
    }
  });

  it('[11] (R169) `textosPunto` es la única fuente: la tabla no reescribe ni el rango ni el valor', () => {
    const t = textosPunto(2, pts(TARDANZA), hm, 'hrs');
    expect(t).toMatchObject({ semana: 'Hace 2 semanas', rango: RANGOS[2], valor: hm(585), valorUnidad: `${hm(585)} hrs` });
    expect(t.anuncio).toBe(`Hace 2 semanas, ${RANGOS[2]}: ${hm(585)} hrs`);
  });
});

describe('GraficoTendencia · la animación única (R169)', () => {
  const linea = (c: HTMLElement) => c.querySelector('svg path.graf-lin') as SVGPathElement;
  const tiene = (c: HTMLElement) => (linea(c).getAttribute('class') ?? '').includes('graf-anima');
  /** El navegador avisa cuando el trazo termina; jsdom no anima, así que se avisa a mano. */
  const terminar = (c: HTMLElement) => act(() => { fireEvent.animationEnd(linea(c)); });

  it('[12] (R169) el primer dibujo lleva la clase de animación y el trazo se mide con `pathLength` 1', () => {
    const { container } = pintar();
    expect(tiene(container)).toBe(true);
    expect(linea(container).getAttribute('pathLength')).toBe('1');
  });

  it('[12] (R169) un cambio de ancho A MEDIO TRAZO (360 a 345) no suelta la clase ni corta la animación', () => {
    const { container } = pintar();
    cambiarAncho(345);
    expect(tiene(container)).toBe(true);
    cambiarAncho(700);
    expect(tiene(container)).toBe(true);
  });

  it('[12] (R169) cambiar `puntos` a medio trazo tampoco la suelta: es el mismo trazo, no uno nuevo', () => {
    const { container, rerender } = pintar();
    rerender(<GraficoTendencia {...props({ puntos: pts(FALTA) })} />);
    expect(tiene(container)).toBe(true);
  });

  it('[12] (R169) la clase se suelta cuando TERMINA la animación (`animationend`)', () => {
    const { container } = pintar();
    terminar(container);
    expect(tiene(container)).toBe(false);
  });

  it('[12] (R169) terminada, la clase NO reaparece al redibujar por el ancho', () => {
    const { container } = pintar();
    terminar(container);
    cambiarAncho(600);
    expect(tiene(container)).toBe(false);
    cambiarAncho(360);
    expect(tiene(container)).toBe(false);
  });

  it('[12] (R169) terminada, la clase NO reaparece al cambiar `puntos`, aunque luego vuelvan los de antes', () => {
    const { container, rerender } = pintar();
    terminar(container);
    rerender(<GraficoTendencia {...props({ puntos: pts(FALTA) })} />);
    expect(tiene(container)).toBe(false);
    rerender(<GraficoTendencia {...props()} />);
    expect(tiene(container)).toBe(false);
  });

  it('[12] (R169) segundo dibujo con otros `puntos` y otro ancho, tras terminar el primero: sin la clase', () => {
    const { container, rerender } = pintar();
    terminar(container);
    rerender(<GraficoTendencia {...props({ puntos: pts(FALTA), formato: hm, base: 60 })} />);
    cambiarAncho(700);
    expect(tiene(container)).toBe(false);
  });

  it('[12] (R169) si `animationend` nunca llega (animación apagada, pestaña oculta), la clase se suelta sola al pasar el tiempo del trazo', () => {
    vi.useFakeTimers();
    try {
      const { container } = pintar();
      expect(tiene(container)).toBe(true);
      act(() => { vi.advanceTimersByTime(500); });
      expect(tiene(container)).toBe(true);
      act(() => { vi.advanceTimersByTime(1500); });
      expect(tiene(container)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('[12] (R169) pasar el cursor o recorrer con el teclado NO suelta la clase (cortaría el trazo a la mitad)', () => {
    const { container, rerender } = pintar();
    mover(vistaDe(container), xDe(360, 3));
    fireEvent.keyDown(vistaDe(container), { key: 'End' });
    expect(tiene(container)).toBe(true);
    // y un padre que repinta con los MISMOS datos (arreglo nuevo, mismo contenido) tampoco
    rerender(<GraficoTendencia {...props({ puntos: pts(TARDANZA) })} />);
    expect(tiene(container)).toBe(true);
  });

  it('[12] (R169) si el montaje llega SIN puntos y los datos vienen después, el primer dibujo con puntos anima, una vez', () => {
    const { container, rerender } = pintar({ puntos: [] });
    expect(container.querySelector('svg')).toBeNull();
    rerender(<GraficoTendencia {...props()} />);
    expect(tiene(container)).toBe(true);
    terminar(container);
    expect(tiene(container)).toBe(false);
    rerender(<GraficoTendencia {...props({ puntos: pts(FALTA) })} />);
    expect(tiene(container)).toBe(false);
  });

  it('[12] (R169) un montaje nuevo vuelve a animar (la regla es por apertura, no global)', () => {
    const a = pintar();
    terminar(a.container);
    cambiarAncho(600);
    a.unmount();
    anchoSim = 360;
    const b = pintar();
    expect(tiene(b.container)).toBe(true);
  });

  it('[12] (R169) la hoja anima el trazo y con `prefers-reduced-motion: reduce` lo deja sin animación', () => {
    expect(HOJA).toMatch(/@keyframes graf-trazo/);
    expect(HOJA).toMatch(/\.graf-anima\s*\{[^}]*animation:\s*graf-trazo/);
    const reducido = /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.graf-anima\s*\{[^}]*animation:\s*none/;
    expect(HOJA).toMatch(reducido);
  });
});


describe('GraficoTendencia · la hoja y la entrega (R169)', () => {
  it('[13] (R169) móvil primero: el alto de base es el de un teléfono y no hay `max-width` ni `@container`', () => {
    expect(HOJA_GRAF.length).toBeGreaterThan(500);
    expect(geometriaGrafico({ ancho: 360, valores: TARDANZA }).alto).toBe(250);
    expect(geometriaGrafico({ ancho: 700, valores: TARDANZA }).alto).toBe(300);
    expect(HOJA_GRAF).not.toMatch(/max-width/);
    expect(HOJA).not.toMatch(/@container/);
  });

  it('[13] (R169) el panel es oscuro por tokens y todo color del gráfico sale de `--grafico-*`', () => {
    expect(HOJA_GRAF).toMatch(/\.graf\s*\{[^}]*background:\s*var\(--grafico-fondo\)/);
    expect(HOJA_GRAF).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/);
  });

  it('[13] (R169) las cifras son tabulares y el marcado no lleva `style`', () => {
    expect(HOJA_GRAF).toMatch(/\.graf-num\s*\{[^}]*tabular-nums/);
    expect(HOJA_GRAF).toMatch(/\.graf-tabla\s*\{[^}]*tabular-nums/);
    const { container } = pintar();
    fireEvent.keyDown(vistaDe(container), { key: 'End' });
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('[14] (R169) `index.ts` exporta la pieza, sus funciones puras y sus tipos', () => {
    for (const nombre of ['GraficoTendencia', 'escalaEje', 'geometriaGrafico', 'puntoMasCercano', 'tramosVisibles', 'textosPunto', 'nombreSemana'] as const) {
      expect(typeof (raiz as Record<string, unknown>)[nombre]).toBe('function');
    }
    const tipos: { p?: import('../src/index').PuntoTendencia; g?: import('../src/index').GraficoTendenciaProps } = {};
    expect(tipos).toBeDefined();
  });
});

describe('GraficoTendencia · el aire del eje (R169)', () => {
  it('[3] (R169) un máximo que cae justo en un tope NO se pega al borde: deja un 12 % de aire y sube al siguiente', () => {
    // 700 · 1,12 / 4 = 196 → paso 200, tope 800: cabe con aire.
    expect(escalaEje(700, 1).tope).toBe(800);
    // 800 · 1,12 / 4 = 224 → no cabe en paso 200: el siguiente «bonito» es 500, tope 2000.
    expect(escalaEje(800, 1).tope).toBe(2000);
    // El borde exacto: 714 aún cabe (paso 200), 715 ya no.
    expect(escalaEje(714, 1).tope).toBe(800);
    expect(escalaEje(715, 1).tope).toBe(2000);
    // y el punto más alto nunca llega a la línea del tope
    const g = geometriaGrafico({ ancho: 360, valores: [800] });
    expect(g.puntos[0].y).toBeGreaterThan(g.arriba);
  });
});

describe('GraficoTendencia · lo que oye el lector, otra vez (R169)', () => {
  const viva = (c: HTMLElement) => c.querySelector('[aria-live]') as HTMLElement;
  const limpio = (t: string | null) => (t ?? '').replace(/​/g, '');

  it('[9] (R169) Fin estando ya en el último (o Inicio en el primero) vuelve a anunciar: la región repinta su texto en un nodo nuevo', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    const nodo = () => viva(container).firstElementChild;
    fireEvent.keyDown(v, { key: 'End' });
    const a = nodo();
    const texto = viva(container).textContent;
    fireEvent.keyDown(v, { key: 'End' });
    expect(nodo()).not.toBe(a);
    expect(viva(container).textContent).toBe(texto);
    fireEvent.keyDown(v, { key: 'Home' });
    const c = nodo();
    fireEvent.keyDown(v, { key: 'Home' });
    expect(nodo()).not.toBe(c);
    expect(viva(container).textContent).toBe('Esta semana, 26 oct – 1 nov: 612 min');
  });

  it('[9] (R169) el ratón NO repite el anuncio: moverse dentro del mismo punto deja el texto igual', () => {
    const { container } = pintar();
    const v = vistaDe(container);
    mover(v, xDe(360, 2));
    const a = viva(container).textContent;
    const nodo = viva(container).firstElementChild;
    mover(v, xDe(360, 2) + 3);
    mover(v, xDe(360, 2) - 3);
    expect(viva(container).textContent).toBe(a);
    expect(viva(container).firstElementChild).toBe(nodo); // ni siquiera se repinta
    mover(v, xDe(360, 4));
    expect(viva(container).textContent).not.toBe(a);
  });
});

describe('GraficoTendencia · valores que no se pueden dibujar (R169)', () => {
  const con = (v: number[]) => pts(v);
  /** El dibujo (la tabla y el texto escriben lo que `formato` dé, que es otra regla). */
  const delSvg = (c: HTMLElement) => c.querySelector('svg')!.outerHTML;

  it('[15] (R169) un valor no finito NO se dibuja ni se conecta: el marcado no lleva NaN ni Infinity', () => {
    const { container } = pintar({ puntos: con([612, NaN, 585, Infinity, 660, 702, 631]) });
    expect(delSvg(container)).not.toMatch(/NaN|Infinity/);
    // cinco puntos con valor finito: 0, 2, 4, 5, 6
    expect(container.querySelectorAll('svg circle.graf-p0, svg circle.graf-p')).toHaveLength(5);
    // el trazo se parte: ningún segmento atraviesa un hueco (hay un «M» por tramo)
    const d = container.querySelector('svg path.graf-lin')!.getAttribute('d')!;
    expect(d.match(/M/g)).toHaveLength(3); // [0] · [2] · [4,5,6]
    expect(d).toMatch(/^M[\d.]+,[\d.]+ M[\d.]+,[\d.]+ M[\d.]+,[\d.]+ L[\d.]+,[\d.]+ L[\d.]+,[\d.]+$/);
  });

  it('[15] (R169) el punto 0 no finito no lleva halo ni punto, y el eje sigue siendo utilizable', () => {
    const { container } = pintar({ puntos: con([NaN, 540, 585, 498, 660, 702, 631]) });
    expect(delSvg(container)).not.toMatch(/NaN|Infinity/);
    expect(container.querySelector('svg circle.graf-halo')).toBeNull();
    expect(container.querySelectorAll('svg circle.graf-p')).toHaveLength(6);
    expect(textosSvg(container, '.graf-eje')).toEqual(['0', '200', '400', '600', '800']);
  });

  it('[15] (R169) la tabla y la ventana escriben lo que `formato` dé para el valor no finito, y no inventan diferencia', () => {
    const f = (v: number) => (Number.isFinite(v) ? String(v) : 'sin dato');
    const { container } = pintar({ puntos: con([612, NaN, 585, 498, 660, 702, 631]), formato: f });
    expect(container.querySelectorAll('.graf-tabla tbody tr')[1].querySelectorAll('td')[1].textContent).toBe('sin dato');
    fireEvent.keyDown(vistaDe(container), { key: 'Home' });
    fireEvent.keyDown(vistaDe(container), { key: 'ArrowRight' });
    expect(lineaVentana(container, 2)).toBe('sin dato min');
    expect(lineaVentana(container, 3)).toBeNull();
    expect(delSvg(container)).not.toMatch(/NaN|Infinity/);
    expect(textosPunto(1, con([612, NaN]), f, 'min').diferencia).toBe('');
    expect(textosPunto(1, con([NaN, 5]), f, 'min').diferencia).toBe('');
  });

  it('[15] (R169) un valor negativo se acota a 0 para DIBUJAR (nunca cae bajo la línea base); el texto conserva el número', () => {
    const g = geometriaGrafico({ ancho: 360, valores: [-50, 100, 50] });
    expect(g.puntos[0].y).toBe(g.yBase);
    expect(g.puntos[0].valor).toBe(-50);
    const { container } = pintar({ puntos: con([612, -30, 585, 498, 660, 702, 631]) });
    const ys = [...container.querySelectorAll('svg circle.graf-p')].map((c) => Number(c.getAttribute('cy')));
    const yBase = Number(container.querySelector('svg line.graf-base')!.getAttribute('y1'));
    for (const y of ys) expect(y).toBeLessThanOrEqual(yBase);
    expect(container.querySelectorAll('.graf-tabla tbody tr')[1].querySelectorAll('td')[1].textContent).toBe('-30');
  });

  it('[15] (R169) todos los valores no finitos: sin trazo, sin puntos y sin NaN', () => {
    const { container } = pintar({ puntos: con([NaN, NaN, NaN]) });
    expect(delSvg(container)).not.toMatch(/NaN|Infinity/);
    expect(container.querySelectorAll('svg circle.graf-p0, svg circle.graf-p')).toHaveLength(0);
  });

  it('[13] (R169) el id del degradado solo lleva caracteres seguros en una `url(#…)`', () => {
    const { container } = pintar();
    const id = container.querySelector('linearGradient')!.getAttribute('id')!;
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(container.querySelector('section.graf')!.getAttribute('aria-labelledby')).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
