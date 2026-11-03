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

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() { return (this as HTMLElement).classList.contains('graf-vista') ? 600 : 0; },
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
      for (const [id, k] of ids) v = v.split(id).join(k);
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
