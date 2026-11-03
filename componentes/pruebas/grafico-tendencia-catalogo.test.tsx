/**
 * GRÁFICO DE TENDENCIA · el catálogo y el componente (SPEC 07, R169)
 *
 * El catálogo no ejecuta React: su página lleva el marcado ESTÁTICO de dos
 * gráficos, escrito a mano con la geometría repetida. Esta prueba renderiza el
 * componente con los mismos datos y compara, nodo por nodo, que lo que el
 * catálogo enseña es lo que el componente emite. Sin ella, cambiar la
 * geometría en uno y no en el otro pasa todos los candados.
 */
import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GraficoTendencia } from '../src/GraficoTendencia';

const CATALOGO = readFileSync(resolve(process.cwd(), '..', 'cascaron', 'index.html'), 'utf8');

const hm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const RANGOS = ['26 oct – 1 nov', '19 oct – 25 oct', '12 oct – 18 oct', '5 oct – 11 oct', '28 sep – 4 oct', '21 sep – 27 sep', '14 sep – 20 sep'];
const pts = (v: number[]) => v.map((valor, i) => ({ valor, detalle: RANGOS[i] }));
const TARDANZA = [612, 540, 585, 498, 660, 702, 631];
const FALTA = [2300, 2470, 1980, 2760, 3100, 2640, 2900];

let anchoSim = 600;
beforeEach(() => {
  anchoSim = 600;
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

/** Árbol canónico: etiqueta, atributos ordenados (sin ids, que useId inventa) y texto. */
function canon(n: Node, ids: Map<string, string>): string {
  if (n.nodeType === Node.TEXT_NODE) return JSON.stringify(n.textContent);
  if (n.nodeType !== Node.ELEMENT_NODE) return '';
  const el = n as Element;
  const atrs = [...el.attributes]
    .map((a) => {
      let v = a.value;
      // Solo donde un id puede estar: un id corto («rd») también aparece dentro de «Tardanzas».
      if (['id', 'aria-labelledby', 'fill'].includes(a.name.toLowerCase())) for (const [id, k] of ids) v = v.split(id).join(k);
      return `${a.name.toLowerCase()}=${v}`;
    })
    .sort()
    .join(' ');
  return `<${el.tagName.toLowerCase()} ${atrs}>${[...el.childNodes].map((c) => canon(c, ids)).join('')}</>`;
}
function normalizado(sec: Element): string {
  sec.normalize(); // React parte «{titulo}: texto» en dos nodos de texto; el HTML del catálogo es uno
  const ids = new Map<string, string>();
  sec.querySelectorAll('[id]').forEach((e, k) => ids.set(e.id, `#${k}`));
  return canon(sec, ids);
}
const delCatalogo = (id: string) => {
  const doc = new DOMParser().parseFromString(CATALOGO, 'text/html');
  return doc.querySelector(`section.graf[aria-labelledby="${id}t"]`)!;
};

describe('GraficoTendencia · el catálogo enseña lo que el componente emite (R169)', () => {
  it('[13] (R169) el ejemplo de tardanzas del catálogo es el marcado del componente a 600 px', () => {
    const chip = <span className="chip chip-aviso">▲ +72 min frente a la semana previa</span>;
    const { container } = render(
      <GraficoTendencia
        titulo="Tardanzas" unidad="min" formato={String} puntos={pts(TARDANZA)} base={1}
        referencia={{ valor: 603, etiqueta: 'Promedio: 603' }} columnaValor="Minutos" comparaciones={chip}
      />,
    );
    const real = normalizado(container.querySelector('section.graf')!);
    const estatico = normalizado(delCatalogo('gr-ej-1'));
    expect(estatico.split('<')).toEqual(real.split('<'));
  });

  it('[13] (R169) el ejemplo de faltas, con la ventana de la semana 3 abierta, también coincide', () => {
    const chip = <span className="chip chip-exito">▼ −2:50 hrs frente a la semana previa</span>;
    const { container } = render(
      <GraficoTendencia
        titulo="Faltas" unidad="hrs" formato={hm} puntos={pts(FALTA)} base={60}
        referencia={{ valor: 2642, etiqueta: `Promedio: ${hm(2642)}` }} columnaValor="Horas" comparaciones={chip}
      />,
    );
    const v = container.querySelector('.graf-vista') as HTMLElement;
    act(() => { fireEvent.keyDown(v, { key: 'Home' }); });
    for (let k = 0; k < 3; k++) act(() => { fireEvent.keyDown(v, { key: 'ArrowRight' }); });
    expect(normalizado(delCatalogo('gr-ej-2')).split('<')).toEqual(normalizado(container.querySelector('section.graf')!).split('<'));
  });
});

/**
 * La función del catálogo (`graficoEj`) vive en un `.mjs` que escribe archivos al importarse: no se
 * importa, se EXTRAE su texto (de `grRed` a antes de `GRAF_RANGOS`) y se evalúa. Así la prueba compara
 * el marcado que el catálogo sabría dibujar a CUALQUIER ancho con el del componente, también donde la
 * etiqueta de la referencia no va a la derecha-encima.
 */
const FUENTE = readFileSync(resolve(process.cwd(), '..', 'sistema', 'cascaron', 'generar-cascaron.mjs'), 'utf8');
const TROZO = FUENTE.slice(FUENTE.indexOf('const grRed ='), FUENTE.indexOf('const GRAF_RANGOS'));
const { graficoEj } = new Function(`${TROZO}; return { graficoEj };`)() as {
  graficoEj: (o: Record<string, unknown>) => string;
};

describe('GraficoTendencia · el catálogo y el componente coinciden a cualquier ancho (v1.153.1)', () => {
  const casos = [
    { id: 'gr-ej-1', titulo: 'Tardanzas', unidad: 'min', formato: String, valores: TARDANZA, base: 1, ref: 603, etiqueta: 'Promedio: 603', columna: 'Minutos' },
    { id: 'gr-ej-2', titulo: 'Faltas', unidad: 'hrs', formato: hm, valores: FALTA, base: 60, ref: 2642, etiqueta: `Promedio: ${hm(2642)}`, columna: 'Horas' },
  ];
  // Además de las etiquetas reales, etiquetas de otros largos: el ancho estimado del texto decide el lado.
  const variantes = casos.flatMap((c) => [0, 6, 12, 18, 24].map((n) => ({
    ...c, etiqueta: n === 0 ? c.etiqueta : `${c.etiqueta}${'x'.repeat(n)}`,
  })));
  for (const c of variantes) {
    for (const w of [280, 360, 390, 520]) {
      it(`[16] (v1.153.1) ${c.titulo} a ${w} px con «${c.etiqueta}»: el SVG del catálogo y el del componente son el mismo`, () => {
        anchoSim = w;
        const { container } = render(
          <GraficoTendencia
            titulo={c.titulo} unidad={c.unidad} formato={c.formato} puntos={pts(c.valores)} base={c.base}
            referencia={{ valor: c.ref, etiqueta: c.etiqueta }} columnaValor={c.columna}
          />,
        );
        const html = graficoEj({
          id: c.id, titulo: c.titulo, unidad: c.unidad, formato: c.formato, puntos: pts(c.valores), base: c.base,
          referencia: { valor: c.ref, etiqueta: c.etiqueta }, columna: c.columna, ancho: w,
        });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const real = normalizado(container.querySelector('section.graf')!);
        expect(normalizado(doc.querySelector('section.graf')!).split('<')).toEqual(real.split('<'));
      });
    }
  }
});
