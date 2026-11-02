/**
 * MAPA DE CALOR (SPEC 07, R169)
 *
 * Las reglas son las de la sección «Mapa de calor» de `comportamiento.md`;
 * cada título lleva el número de la suya. El desplazamiento dentro del
 * contenedor y el `border-style` medido son de navegador; aquí se comprueba el
 * marcado y lo que declara la hoja que viaja.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MapaCalor, pasoMapa, pasosDelMapa, type CeldaMapaCalor } from '../src/MapaCalor';
import * as raiz from '../src/index';

const HOJA = readFileSync(
  resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'),
  'utf8',
);

const FILAS = ['Hombre', 'Mujer'];
const COLS = ['18-29', '30-39', '40-49', '50-59', '60+'];
const N = [[3, 5, 5, 1, 0], [4, 6, 5, 5, 2]];
const V = [[48, 96, 108, 52, 0], [31, 84, 66, 100, 18]];
const CELDAS: CeldaMapaCalor[][] = V.map((f, a) => f.map((valor, b) => ({ valor, n: N[a][b] })));
const SUMA = V.flat().reduce((s, v) => s + v, 0);

function pintar(extra: Partial<React.ComponentProps<typeof MapaCalor>> = {}) {
  return render(
    <MapaCalor
      titulo="Tardanzas"
      descripcion="Por sexo y edad"
      total={`${SUMA} min`}
      filas={FILAS}
      columnas={COLS}
      celdas={CELDAS}
      formato={(v) => String(v)}
      {...extra}
    />,
  );
}

const celda = (c: HTMLElement, f: number, k: number) =>
  c.querySelectorAll('tbody tr')[f].querySelectorAll('td')[k].querySelector('.mapa-celda') as HTMLElement;

describe('MapaCalor · la tabla (R169)', () => {
  it('[1] (R169) es una tabla real con cabeceras de columna y de fila', () => {
    const { container } = pintar();
    const t = container.querySelector('table')!;
    expect(t).not.toBeNull();
    const cols = [...t.querySelectorAll('thead th[scope="col"]')].map((h) => h.textContent);
    expect(cols).toEqual(COLS);
    const filas = [...t.querySelectorAll('tbody th[scope="row"]')].map((h) => h.textContent);
    expect(filas).toEqual(FILAS);
    expect(t.querySelectorAll('tbody td')).toHaveLength(10);
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    expect(screen.getAllByRole('rowheader')).toHaveLength(2);
  });

  it('[2] (R169) dibuja título, descripción y total propios', () => {
    const { container } = pintar();
    expect(screen.getByRole('heading', { name: 'Tardanzas' }).tagName).toBe('H3');
    expect(screen.getByText('Por sexo y edad')).toBeTruthy();
    expect(container.querySelector('.mapa-total')!.textContent).toBe('Total 603 min');
  });

  it('[2] (R169) sin descripción ni total no deja elementos vacíos', () => {
    const { container } = pintar({ descripcion: undefined, total: undefined });
    expect(container.querySelector('.mapa-total')).toBeNull();
    expect(container.querySelector('.mapa-desc')).toBeNull();
  });

  it('[2] (R169) el total de ejemplo es la suma de los valores de las celdas', () => {
    expect(SUMA).toBe(603);
  });

  it('[3] (R169) el contenedor desplazable es una región enfocable con nombre', () => {
    const { container } = pintar();
    const r = container.querySelector('.mapa-vista')!;
    expect(r.getAttribute('role')).toBe('region');
    expect(r.getAttribute('tabindex')).toBe('0');
    const titulo = screen.getByRole('heading', { name: 'Tardanzas' });
    expect(r.getAttribute('aria-labelledby')).toBe(titulo.id);
    expect(screen.getByRole('region', { name: 'Tardanzas' })).toBe(r);
    expect(r.querySelector('table')).not.toBeNull();
  });
});

describe('MapaCalor · los pasos (R169)', () => {
  it('[4] (R169) `pasoMapa` es ceil(5·v/max), entre 1 y 5', () => {
    expect(pasoMapa(108, 108)).toBe(5);
    expect(pasoMapa(96, 108)).toBe(5);
    expect(pasoMapa(52, 108)).toBe(3);
    expect(pasoMapa(48, 108)).toBe(3);
    expect(pasoMapa(18, 108)).toBe(1);
    expect(pasoMapa(21.6, 108)).toBe(1);
    expect(pasoMapa(21.7, 108)).toBe(2);
    expect(pasoMapa(0.0001, 108)).toBe(1);
    expect(pasoMapa(0, 0)).toBe(1);
  });

  it('[4] (R169) `pasosDelMapa` calcula el máximo solo sobre las celdas con n > 0', () => {
    const celdas: CeldaMapaCalor[][] = [[{ valor: 1000, n: 0 }, { valor: 10, n: 4 }, { valor: 5, n: 3 }]];
    expect(pasosDelMapa(celdas)).toEqual([[0, 5, 3]]);
  });

  it('[4] (R169) cada celda con n > 0 lleva la clase de su paso `mapa-pN`', () => {
    const { container } = pintar();
    const esperado = [[3, 5, 5, 3, 0], [2, 4, 4, 5, 1]];
    // 48 → ceil(5·48/108) = 3 · 96 → 5 · 108 → 5 · 52 → 3 · 31 → 2 · 84 → 4 · 66 → 4 · 100 → 5 · 18 → 1
    esperado.forEach((fila, f) => fila.forEach((p, k) => {
      const c = celda(container, f, k);
      const pasos = [1, 2, 3, 4, 5].filter((i) => c.classList.contains(`mapa-p${i}`));
      expect(pasos, `celda ${f},${k}`).toEqual(p === 0 ? [] : [p]);
    }));
  });

  it('[4] (R169) cada celda escribe el valor y «n trab.»; `formato` escribe el valor', () => {
    const { container } = pintar({ formato: (v) => `${v} min` });
    const c = celda(container, 0, 2);
    expect(c.querySelector('.mapa-valor')!.textContent).toBe('108 min');
    expect(c.querySelector('.mapa-n')!.textContent).toBe('5 trab.');
  });

  it('[4] (R169) sin `formato`, el valor sale tal cual', () => {
    const { container } = pintar({ formato: undefined });
    expect(celda(container, 0, 0).querySelector('.mapa-valor')!.textContent).toBe('48');
  });

  it('[5] (R169) la hoja pone el texto principal en los pasos 1 a 3 y el invertido en 4 y 5, sobre los tokens mapa-*', () => {
    for (const p of [1, 2, 3]) {
      expect(HOJA).toMatch(new RegExp(`\\.mapa-p${p}\\s*\\{[^}]*var\\(--mapa-${p}\\)[^}]*var\\(--texto-principal\\)`));
    }
    for (const p of [4, 5]) {
      expect(HOJA).toMatch(new RegExp(`\\.mapa-p${p}\\s*\\{[^}]*var\\(--mapa-${p}\\)[^}]*var\\(--texto-invertido\\)`));
    }
  });
});

describe('MapaCalor · pocos datos y celdas vacías (R169)', () => {
  it('[6] (R169) n ≤ 2 es «Pocos datos»: clase, y nombre accesible con singular y plural', () => {
    const { container } = pintar();
    const uno = celda(container, 0, 3); // n = 1
    const dos = celda(container, 1, 4); // n = 2
    expect(uno.classList.contains('mapa-pocos')).toBe(true);
    expect(within(uno).getByText('Pocos datos: 1 trabajador')).toBeTruthy();
    expect(dos.classList.contains('mapa-pocos')).toBe(true);
    expect(within(dos).getByText('Pocos datos: 2 trabajadores')).toBeTruthy();
    // Una celda con n = 3 no lo es.
    const tres = celda(container, 0, 0);
    expect(tres.classList.contains('mapa-pocos')).toBe(false);
    expect(tres.textContent).not.toMatch(/Pocos datos/);
  });

  it('[6] (R169) «Pocos datos» sigue siendo una celda con paso de color: solo cambia el borde', () => {
    const { container } = pintar();
    const uno = celda(container, 0, 3);
    expect(uno.classList.contains('mapa-p3')).toBe(true);
  });

  it('[6] (R169) `pocosDatosHasta` mueve el umbral', () => {
    const { container } = pintar({ pocosDatosHasta: 4 });
    expect(celda(container, 0, 0).classList.contains('mapa-pocos')).toBe(true); // n = 3
    expect(celda(container, 1, 0).classList.contains('mapa-pocos')).toBe(true); // n = 4
    expect(celda(container, 0, 1).classList.contains('mapa-pocos')).toBe(false); // n = 5
    const sin = pintar({ pocosDatosHasta: 0 });
    expect(sin.container.querySelectorAll('.mapa-pocos')).toHaveLength(0);
  });

  it('[7] (R169) n = 0 es una celda vacía: «—» y «0 trab.», sin paso y sin «Pocos datos»', () => {
    const { container } = pintar();
    const v = celda(container, 0, 4);
    expect(v.classList.contains('mapa-vacia')).toBe(true);
    expect(v.textContent).toContain('—');
    expect(v.textContent).toContain('0 trab.');
    expect([1, 2, 3, 4, 5].some((i) => v.classList.contains(`mapa-p${i}`))).toBe(false);
    expect(v.classList.contains('mapa-pocos')).toBe(false);
    expect(v.textContent).not.toMatch(/Pocos datos/);
  });

  it('[7] (R169) una celda vacía no cuenta para el máximo aunque traiga valor', () => {
    const { container } = pintar({
      celdas: [[{ valor: 999, n: 0 }, { valor: 10, n: 9 }, { valor: 5, n: 9 }, { valor: 1, n: 9 }, { valor: 0, n: 0 }],
               [{ valor: 0, n: 0 }, { valor: 0, n: 0 }, { valor: 0, n: 0 }, { valor: 0, n: 0 }, { valor: 0, n: 0 }]],
    });
    expect(celda(container, 0, 1).classList.contains('mapa-p5')).toBe(true);
  });
});

describe('MapaCalor · la escala (R169)', () => {
  it('[8] (R169) escala «Menos – Más» de cinco pasos debajo de la tabla, sin leyenda de «Pocos datos»', () => {
    const { container } = pintar();
    const esc = container.querySelector('.mapa-escala')!;
    expect(esc).not.toBeNull();
    expect(esc.textContent).toBe('MenosMás');
    expect(esc.querySelectorAll('.mapa-paso')).toHaveLength(5);
    [1, 2, 3, 4, 5].forEach((i, k) => {
      expect(esc.querySelectorAll('.mapa-paso')[k].classList.contains(`mapa-p${i}`)).toBe(true);
    });
    expect(container.textContent!.replace(/Pocos datos: \d trabajador(es)?/g, '')).not.toMatch(/Pocos datos/);
    // Va después del contenedor desplazable, no dentro.
    const vista = container.querySelector('.mapa-vista')!;
    expect(vista.contains(esc)).toBe(false);
    expect(vista.compareDocumentPosition(esc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('MapaCalor · la hoja que viaja (R169)', () => {
  it('[9] (R169) ancho mínimo ~350 px y desplazamiento dentro del contenedor, con foco visible', () => {
    expect(HOJA).toMatch(/\.mapa-tabla\s*\{[^}]*min-width:\s*350px/);
    expect(HOJA).toMatch(/\.mapa-vista\s*\{[^}]*overflow-x:\s*auto/);
    expect(HOJA).toMatch(/\.mapa-vista:focus-visible\s*\{[^}]*outline:/);
  });

  it('[9] (R169) «Pocos datos» es borde punteado y la celda vacía también, sin pasar por color solo', () => {
    expect(HOJA).toMatch(/\.mapa-pocos\s*\{[^}]*border-style:\s*dashed/);
    expect(HOJA).toMatch(/\.mapa-vacia\s*\{[^}]*dashed/);
  });

  it('[10] (R169) cifras tabulares, colores por token y móvil primero (ni max-width ni @container)', () => {
    expect(HOJA).toMatch(/\.mapa-celda\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);
    expect(HOJA).not.toMatch(/@media[^{]*max-width[^{]*\{[^@]*\.mapa-/);
    expect(HOJA).not.toMatch(/@container/);
  });
});

describe('MapaCalor · lo que exporta el paquete (R169)', () => {
  it('[11] (R169) `index.ts` exporta la pieza', () => {
    expect(typeof raiz.MapaCalor).toBe('function');
  });
});

describe('MapaCalor · datos inválidos y nombre único (R169)', () => {
  it('[12] (R169) un valor que no es número cae en el paso 1, nunca en `mapa-pNaN`', () => {
    expect(pasoMapa(Number.NaN, 10)).toBe(1);
    expect(pasoMapa(Number.POSITIVE_INFINITY, 10)).toBe(1);
  });

  it('[12] (R169) solo la región lleva el título como nombre: la tabla no lo repite', () => {
    const { container } = render(
      <MapaCalor titulo="Tardanzas" filas={['A']} columnas={['x']} celdas={[[{ valor: 5, n: 3 }]]} />,
    );
    expect(container.querySelector('[role="region"]')!.getAttribute('aria-labelledby')).toBeTruthy();
    expect(container.querySelector('table')!.hasAttribute('aria-labelledby')).toBe(false);
  });
});
