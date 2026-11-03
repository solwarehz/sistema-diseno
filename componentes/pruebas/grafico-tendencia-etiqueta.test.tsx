/**
 * GRÁFICO DE TENDENCIA · la etiqueta de la referencia (parche v1.153.1, sin requerimiento)
 *
 * Regla 16 de la sección «Gráfico de tendencia» de `comportamiento.md`: la
 * etiqueta de la referencia no se solapa con el trazo, los puntos ni los
 * valores. El choque se mide aquí con un detector PROPIO (muestreo de los
 * segmentos, distancia a los círculos, cajas de texto), distinto del de la
 * pieza, sobre el marcado que el componente emite.
 */
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GraficoTendencia, geometriaGrafico, posicionEtiquetaReferencia, type PuntoTendencia,
} from '../src/GraficoTendencia';
import * as raiz from '../src/index';

let anchoSim = 360;
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() { return (this as HTMLElement).classList.contains('graf-vista') ? anchoSim : 0; },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
});

const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const pts = (v: number[]): PuntoTendencia[] => v.map((valor, i) => ({ valor, detalle: `s${i}` }));
const TARDANZA = [612, 540, 585, 498, 660, 702, 631];
const FALTA = [2300, 2470, 1980, 2760, 3100, 2640, 2900];
const CASOS = [
  { nombre: 'tardanzas', valores: TARDANZA, ref: 603, formato: String, base: 1, etiqueta: 'Promedio: 603' },
  { nombre: 'faltas', valores: FALTA, ref: 2642, formato: hm, base: 60, etiqueta: 'Promedio: 44:02' },
];
const ANCHOS = [280, 360, 390, 520, 1000];

type Caja = { x0: number; x1: number; y0: number; y1: number };
const num = (n: Element, a: string) => Number(n.getAttribute(a));

/** Cuántas cosas dibujadas toca la etiqueta del SVG (0 = libre). Detector independiente de la pieza. */
function choques(svg: Element): { n: number; fuera: boolean; caja: Caja } {
  const t = svg.querySelector('.graf-ref-t')!;
  const w = (t.textContent ?? '').length * 7; // 12 px: 7 px por glifo (cota alta)
  const x = num(t, 'x'), y = num(t, 'y');
  const ancla = t.getAttribute('text-anchor');
  const caja: Caja = {
    x0: ancla === 'end' ? x - w : x, x1: ancla === 'end' ? x : x + w, y0: y - 10, y1: y + 3,
  };
  const dentro = (px: number, py: number) => px >= caja.x0 && px <= caja.x1 && py >= caja.y0 && py <= caja.y1;
  let n = 0;
  // Trazo: se recorre el `d` de la línea de datos (tramos «M… L…»).
  const d = svg.querySelector('.graf-lin')!.getAttribute('d')!;
  for (const tramo of d.split('M').filter(Boolean)) {
    const p = tramo.split('L').map((s) => s.trim().split(',').map(Number)).filter((a) => a.length === 2 && !a.some(Number.isNaN));
    for (let k = 1; k < p.length; k++) {
      for (let j = 0; j <= 400; j++) {
        const f = j / 400;
        if (dentro(p[k - 1][0] + (p[k][0] - p[k - 1][0]) * f, p[k - 1][1] + (p[k][1] - p[k - 1][1]) * f)) { n++; break; }
      }
    }
  }
  // Círculos de punto y halo.
  for (const c of svg.querySelectorAll('circle.graf-halo, circle.graf-p0, circle.graf-p')) {
    const cx = num(c, 'cx'), cy = num(c, 'cy'), r = num(c, 'r');
    const px = Math.min(Math.max(cx, caja.x0), caja.x1), py = Math.min(Math.max(cy, caja.y0), caja.y1);
    if (Math.hypot(cx - px, cy - py) < r) n++;
  }
  // Valores escritos sobre los puntos (13 px, centrados).
  for (const v of svg.querySelectorAll('text.graf-val')) {
    const vw = (v.textContent ?? '').length * 7.5;
    const vx = num(v, 'x'), vy = num(v, 'y');
    if (Math.min(caja.x1, vx + vw / 2) > Math.max(caja.x0, vx - vw / 2) && Math.min(caja.y1, vy + 3) > Math.max(caja.y0, vy - 11)) n++;
  }
  const W = num(svg, 'width'), H = num(svg, 'height');
  return { n, fuera: caja.x0 < 0 || caja.x1 > W || caja.y0 < 0 || caja.y1 > H, caja };
}

function pintar(c: (typeof CASOS)[number], ancho: number) {
  anchoSim = ancho;
  const r = render(
    <GraficoTendencia
      titulo={c.nombre} unidad="u" formato={c.formato} puntos={pts(c.valores)} base={c.base}
      referencia={{ valor: c.ref, etiqueta: c.etiqueta }} columnaValor="v"
    />,
  );
  return r.container.querySelector('svg')!;
}

describe('GraficoTendencia · la etiqueta de la referencia no se solapa (v1.153.1)', () => {
  for (const c of CASOS) {
    for (const w of ANCHOS) {
      it(`[16] (v1.153.1) ${c.nombre} a ${w} px: la etiqueta no toca trazo, puntos ni valores y queda dentro del SVG`, () => {
        const svg = pintar(c, w);
        const r = choques(svg);
        expect(r.n, `choques con ${JSON.stringify(r.caja)}`).toBe(0);
        expect(r.fuera).toBe(false);
      });
    }
  }

  it('[16] (v1.153.1) el lado elegido se refleja en `text-anchor` (derecha → end, izquierda → start)', () => {
    for (const c of CASOS) {
      for (const w of ANCHOS) {
        const geo = geometriaGrafico({ ancho: w, valores: c.valores, base: c.base, referencia: c.ref });
        const pos = posicionEtiquetaReferencia(geo, c.etiqueta, c.formato)!;
        const t = pintar(c, w).querySelector('.graf-ref-t')!;
        expect(t.getAttribute('text-anchor')).toBe(pos.anchor);
        expect(pos.anchor).toBe(pos.lado === 'derecha' ? 'end' : 'start');
        expect(num(t, 'x')).toBe(pos.x);
        expect(num(t, 'y')).toBe(pos.y);
      }
    }
  });

  it('[16] (v1.153.1) la función es pura: misma geometría, misma posición', () => {
    const geo = geometriaGrafico({ ancho: 390, valores: TARDANZA, referencia: 603 });
    expect(posicionEtiquetaReferencia(geo, 'Promedio: 603')).toEqual(posicionEtiquetaReferencia(geo, 'Promedio: 603'));
  });

  it('[16] (v1.153.1) sin referencia no hay etiqueta ni posición', () => {
    const geo = geometriaGrafico({ ancho: 360, valores: TARDANZA });
    expect(posicionEtiquetaReferencia(geo, 'x')).toBeNull();
    anchoSim = 360;
    const { container } = render(<GraficoTendencia titulo="t" unidad="u" formato={String} puntos={pts(TARDANZA)} columnaValor="v" />);
    expect(container.querySelector('.graf-ref-t')).toBeNull();
    expect(container.querySelector('.graf-ref')).toBeNull();
  });

  it('[16] (v1.153.1) el borde izquierdo nunca invade el halo del punto 0 ni el rótulo del eje', () => {
    for (const c of CASOS) {
      for (const w of ANCHOS) {
        const geo = geometriaGrafico({ ancho: w, valores: c.valores, base: c.base, referencia: c.ref });
        const pos = posicionEtiquetaReferencia(geo, c.etiqueta, c.formato)!;
        if (pos.lado === 'izquierda') expect(pos.x).toBeGreaterThanOrEqual(geo.puntos[0].x + 14);
        expect(pos.x).toBeGreaterThan(geo.izq);
      }
    }
  });

  describe('casos límite', () => {
    const caso = (valores: number[], ref: number, w: number, etiqueta = 'Promedio') => {
      anchoSim = w;
      const { container } = render(
        <GraficoTendencia titulo="t" unidad="u" formato={String} puntos={pts(valores)} referencia={{ valor: ref, etiqueta }} columnaValor="v" />,
      );
      return container.querySelector('svg')!;
    };
    for (const w of [280, 360, 1000]) {
      it(`[16] (v1.153.1) referencia en el máximo del eje (${w} px): dentro del SVG y sin chocar`, () => {
        const svg = caso([100, 200, 150, 300, 250, 120, 180], 800, w, 'Promedio: 800');
        const r = choques(svg);
        expect(r.n).toBe(0);
        expect(r.fuera).toBe(false);
      });
      it(`[16] (v1.153.1) referencia en cero (${w} px): dentro del SVG, sin salirse bajo la base`, () => {
        const svg = caso([100, 200, 150, 300, 250, 120, 180], 0, w, 'Promedio: 0');
        const r = choques(svg);
        expect(r.fuera).toBe(false);
        const yBase = Number(svg.querySelector('.graf-base')!.getAttribute('y1'));
        expect(r.caja.y1).toBeLessThanOrEqual(yBase);
      });
      it(`[16] (v1.153.1) datos planos (${w} px): la etiqueta no choca con la línea de datos`, () => {
        const svg = caso([300, 300, 300, 300, 300, 300, 300], 300, w, 'Promedio: 300');
        expect(choques(svg).n).toBe(0);
        expect(choques(svg).fuera).toBe(false);
      });
      it(`[16] (v1.153.1) un solo punto (${w} px): no falla y queda dentro`, () => {
        const svg = caso([300], 250, w, 'Promedio: 250');
        expect(choques(svg).fuera).toBe(false);
      });
    }
  });

  it('[16] (v1.153.1) una etiqueta que no cabe en ningún lado: la elegida no está dominada por otra en (desborde, choques), medido con el detector de la prueba', () => {
    const larga = 'Una etiqueta larguísima que no cabe en ningún lado sin tocar';
    const valores = [100, 700, 100, 700, 100, 700, 100]; // zigzag: el trazo cruza la línea de referencia
    const geo = geometriaGrafico({ ancho: 280, valores, referencia: 300 });
    const pos = posicionEtiquetaReferencia(geo, larga, String)!;
    expect(Number.isFinite(pos.x) && Number.isFinite(pos.y)).toBe(true);
    expect(pos.solape).toBeGreaterThan(0);

    const w = larga.length * 7;
    const yr = geo.yReferencia!;
    const p0 = geo.puntos[0];
    const coste = (anchor: 'end' | 'start', x: number, y: number) => {
      const x0 = anchor === 'end' ? x - w : x, x1 = anchor === 'end' ? x : x + w;
      const desborde = Math.max(0, geo.izq - x0) + Math.max(0, x1 - geo.ancho);
      let n = 0;
      for (const p of geo.puntos) {
        const d = Math.hypot(Math.max(x0 - p.x, 0, p.x - x1), Math.max(y - 10 - p.y, 0, p.y - (y + 3)));
        if (d < (p === p0 ? 14 : 4.5)) n++;
      }
      for (let k = 1; k < geo.puntos.length; k++) {
        const a = geo.puntos[k - 1], b = geo.puntos[k];
        for (let j = 0; j <= 300; j++) {
          const px = a.x + ((b.x - a.x) * j) / 300, py = a.y + ((b.y - a.y) * j) / 300;
          if (px >= x0 && px <= x1 && py >= y - 10 && py <= y + 3) { n++; break; }
        }
      }
      return { desborde, n };
    };
    const todas: Array<{ anchor: string; desborde: number; n: number }> = [];
    for (const extra of [0, 12, 24]) {
      for (const dy of [-8 - extra, 17 + extra]) {
        todas.push({ anchor: 'end', ...coste('end', geo.ancho - geo.der, yr + dy) });
        todas.push({ anchor: 'start', ...coste('start', p0.x + 18, yr + dy) });
      }
    }
    const mio = { anchor: pos.anchor, ...coste(pos.anchor, pos.x, pos.y) };
    // Ninguna otra colocación es mejor en las dos cosas a la vez (no está dominada).
    const dominada = todas.some((c) => c.desborde <= mio.desborde && c.n <= mio.n && (c.desborde < mio.desborde || c.n < mio.n));
    expect(dominada, JSON.stringify({ mio, todas })).toBe(false);
  });

  it('[16] (v1.153.1) `index.ts` exporta `posicionEtiquetaReferencia`', () => {
    expect(typeof (raiz as Record<string, unknown>).posicionEtiquetaReferencia).toBe('function');
  });
});

// ── El ORDEN de los candidatos (punto fijo con geometría armada a mano) ──────
/** Una geometría mínima: el punto 0 lejos de las cajas y, tras cada «bloqueo», un punto invisible que corta el trazo. */
function geoConBloqueos(bloqueos: Array<[number, number]>) {
  const puntos = [{ x: 60, y: 190, valor: 1, visible: true }];
  for (const [x, y] of bloqueos) {
    puntos.push({ x: 0, y: 190, valor: NaN, visible: false });
    puntos.push({ x, y, valor: 1, visible: true });
  }
  return {
    ancho: 400, alto: 250, izq: 44, der: 18, arriba: 38, yBase: 196, ancha: false,
    escala: { tope: 800, paso: 200, marcas: [] }, marcas: [], paso: 40, puntos, yReferencia: 100,
  };
}
// Con 'Promedio' (8 car.): derecha ocupa x 322–384; izquierda 76–138; encima y 79–97 (sobre yr=100); debajo 104–122.
const RE: [number, number] = [350, 88];
const RD: [number, number] = [350, 113];
const LE: [number, number] = [110, 88];
const LD: [number, number] = [110, 113];

describe('GraficoTendencia · el orden de los candidatos (v1.153.1)', () => {
  const elige = (b: Array<[number, number]>) => {
    const p = posicionEtiquetaReferencia(geoConBloqueos(b), 'Promedio')!;
    return `${p.lado}-${p.vertical}`;
  };
  it('[16] (v1.153.1) con todo libre se elige derecha-encima', () => {
    expect(elige([])).toBe('derecha-encima');
  });
  it('[16] (v1.153.1) con derecha-encima ocupada se elige derecha-debajo (aunque izquierda-encima esté libre)', () => {
    expect(elige([RE])).toBe('derecha-debajo');
  });
  it('[16] (v1.153.1) con las dos de la derecha ocupadas se elige izquierda-encima (aunque izquierda-debajo esté libre)', () => {
    expect(elige([RE, RD])).toBe('izquierda-encima');
  });
  it('[16] (v1.153.1) si solo izquierda-debajo está libre, se elige izquierda-debajo', () => {
    expect(elige([RE, RD, LE])).toBe('izquierda-debajo');
  });
  it('[16] (v1.153.1) si las cuatro están ocupadas añade aire en vez de quedarse con un choque', () => {
    const p = posicionEtiquetaReferencia(geoConBloqueos([RE, RD, LE, LD]), 'Promedio')!;
    expect(p.solape).toBe(0);
    expect(p.y === 100 - 8 || p.y === 100 + 17).toBe(false); // ya no es la posición básica
  });
});
