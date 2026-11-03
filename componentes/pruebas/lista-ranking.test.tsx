/**
 * LISTA DE RANKING (SPEC 07, R169)
 *
 * Las reglas son las de la sección «Lista de ranking» de `comportamiento.md`;
 * cada título lleva el número de la suya. El desborde a 360 px no lo mide
 * jsdom (no tiene maquetación): se comprueba que la hoja que viaja declare lo
 * que lo evita, y la medición real se hace en navegador.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ListaRanking, porcentajeBarra, type FilaRanking } from '../src/ListaRanking';
import * as raiz from '../src/index';

const HOJA = readFileSync(
  resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'),
  'utf8',
);

const NOMBRE_LARGO = 'Salazar Quispe de la Cruz, María Guadalupe del Carmen';

const FILAS: FilaRanking[] = [
  { id: 'a', nombre: NOMBRE_LARGO, valor: 74, texto: '74 min', detalle: 'Nivel Inicial' },
  { id: 'b', nombre: 'Huamán Ríos, Luis', valor: 61, texto: '61 min', detalle: 'Nivel Primaria' },
  { id: 'c', nombre: 'Paredes Soto, Elena', valor: 55, texto: '55 min' },
  { id: 'd', nombre: 'Cárdenas Vega, Jorge', valor: 49, texto: '49 min', detalle: 'Nivel Inicial' },
  { id: 'e', nombre: 'Mendoza Lara, Rosa', valor: 44, texto: '44 min', detalle: 'Secretaría' },
];

const ancho = (li: Element) => li.querySelector('svg rect')!.getAttribute('width');

describe('ListaRanking · la estructura (R169)', () => {
  it('[1] (R169) es una sección con título (`h3`) y una lista ordenada con nombre accesible', () => {
    const { container } = render(<ListaRanking titulo="Tardanzas" filas={FILAS} textoVacio="Nadie" />);
    const sec = container.querySelector('section.ranking');
    expect(sec).not.toBeNull();
    const h = within(sec as HTMLElement).getByRole('heading', { name: 'Tardanzas' });
    expect(h.tagName).toBe('H3');
    expect(sec!.getAttribute('aria-labelledby')).toBe(h.id);
    expect(sec!.querySelector('ol.ranking-lista')).not.toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('[2] (R169) cada fila lleva posición, Avatar (tamaño m), nombre, detalle y valor', () => {
    const { container } = render(<ListaRanking titulo="Tardanzas" filas={FILAS} textoVacio="Nadie" />);
    const filas = container.querySelectorAll('li.ranking-fila');
    expect(filas).toHaveLength(5);
    filas.forEach((li, i) => {
      expect(li.querySelector('.ranking-pos')!.textContent).toBe(String(i + 1));
      expect(li.querySelector('.avatar.avatar-m')).not.toBeNull();
      expect(li.querySelector('.ranking-nombre')!.textContent).toBe(FILAS[i].nombre);
      expect(li.querySelector('.ranking-valor')!.textContent).toBe(FILAS[i].texto);
    });
    expect(filas[0].querySelector('.ranking-detalle')!.textContent).toBe('Nivel Inicial');
    expect(filas[2].querySelector('.ranking-detalle')).toBeNull();
  });

  it('[2] (R169) el Avatar sale de las iniciales y cae a ellas sin foto; con foto la pinta', () => {
    const { container } = render(
      <ListaRanking
        titulo="T"
        filas={[
          { id: 'x', nombre: 'Huamán Ríos, Luis', valor: 2, texto: '2' },
          { id: 'y', nombre: 'Paredes Soto, Elena', valor: 1, texto: '1', foto: '/f.png' },
        ]}
        textoVacio="N"
      />,
    );
    const av = container.querySelectorAll('.avatar');
    expect(av[0].textContent).toBe('HL');
    expect(av[1].querySelector('img')!.getAttribute('src')).toBe('/f.png');
  });

  it('[2] (R169) el Avatar no se lee dos veces: va fuera del árbol accesible', () => {
    const { container } = render(<ListaRanking titulo="T" filas={FILAS} textoVacio="N" />);
    container.querySelectorAll('li.ranking-fila').forEach((li) => {
      expect(li.querySelector('.avatar')!.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  it('[7] (R169) muestra las filas que recibe, ni recorta a cinco ni rellena', () => {
    const una = render(<ListaRanking titulo="T" filas={FILAS.slice(0, 1)} textoVacio="N" />);
    expect(una.container.querySelectorAll('li.ranking-fila')).toHaveLength(1);
    una.unmount();
    const tres = render(<ListaRanking titulo="T" filas={FILAS.slice(0, 3)} textoVacio="N" />);
    expect(tres.container.querySelectorAll('li.ranking-fila')).toHaveLength(3);
    tres.unmount();
    const siete = render(
      <ListaRanking titulo="T" filas={[...FILAS, ...FILAS.map((f) => ({ ...f, id: f.id + '2' }))].slice(0, 7)} textoVacio="N" />,
    );
    expect(siete.container.querySelectorAll('li.ranking-fila')).toHaveLength(7);
  });
});

describe('ListaRanking · la barra (R169)', () => {
  it('[3] (R169) `porcentajeBarra`: el primero es 100 %, los demás valor / primero', () => {
    expect(porcentajeBarra(74, 74)).toBe(100);
    expect(porcentajeBarra(37, 74)).toBe(50);
    expect(porcentajeBarra(61, 74)).toBeCloseTo((61 / 74) * 100, 2);
  });

  it('[3] (R169) `porcentajeBarra` no sale de 0 a 100 aunque el dato lo haga', () => {
    expect(porcentajeBarra(-5, 74)).toBe(0);
    expect(porcentajeBarra(90, 74)).toBe(100);
  });

  it('[3] (R169) la barra es un `rect` SVG con su porcentaje exacto, sin cuantizar y sin `style`', () => {
    const { container } = render(<ListaRanking titulo="T" filas={FILAS} textoVacio="N" />);
    const lis = [...container.querySelectorAll('li.ranking-fila')];
    expect(ancho(lis[0])).toBe('100%');
    FILAS.slice(1).forEach((f, i) => {
      const n = parseFloat(ancho(lis[i + 1])!);
      expect(n).toBeCloseTo((f.valor / FILAS[0].valor) * 100, 2);
    });
    // 61/74 = 82,43 %: nada de saltos de 5 en 5.
    expect(parseFloat(ancho(lis[1])!)).not.toBe(80);
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('[3] (R169) la barra es decoración: el valor ya está en el texto', () => {
    const { container } = render(<ListaRanking titulo="T" filas={FILAS} textoVacio="N" />);
    container.querySelectorAll('li.ranking-fila svg').forEach((s) => {
      expect(s.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('[4] (R169) con valor 0 en el primero no hay barra en ninguna fila', () => {
    const { container } = render(
      <ListaRanking
        titulo="T"
        filas={[
          { id: 'a', nombre: 'A, A', valor: 0, texto: '0 min' },
          { id: 'b', nombre: 'B, B', valor: 0, texto: '0 min' },
        ]}
        textoVacio="N"
      />,
    );
    expect(container.querySelectorAll('li.ranking-fila svg rect')).toHaveLength(0);
    expect(porcentajeBarra(0, 0)).toBe(0);
  });
});

describe('ListaRanking · sin filas (R169)', () => {
  it('[5] (R169) sin filas muestra `textoVacio` y no una lista vacía', () => {
    const { container } = render(<ListaRanking titulo="Faltas" filas={[]} textoVacio="Nadie tiene faltas esta semana" />);
    expect(screen.getByText('Nadie tiene faltas esta semana')).toBeTruthy();
    expect(container.querySelector('ol')).toBeNull();
    expect(container.querySelector('li')).toBeNull();
    // El título sigue ahí: sin él la tarjeta vacía no diría de qué es.
    expect(screen.getByRole('heading', { name: 'Faltas' })).toBeTruthy();
  });
});

describe('ListaRanking · la hoja que viaja (R169)', () => {
  it('[6] (R169) el nombre largo envuelve: `overflow-wrap` en el nombre y `min-width: 0` en su columna', () => {
    expect(HOJA).toMatch(/\.ranking-nombre\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(HOJA).toMatch(/\.ranking-quien\s*\{[^}]*min-width:\s*0/);
    expect(HOJA).toMatch(/\.ranking-fila\s*\{[^}]*grid-template-columns:[^;}]*minmax\(0,\s*1fr\)/);
  });

  it('[6] (R169) un nombre de 60 caracteres entra entero en el marcado, sin recortar', () => {
    const largo = 'Apellidopaterno Apellidomaterno, Nombre Segundo Nombre Terceronom';
    expect(largo.length).toBeGreaterThanOrEqual(60);
    render(<ListaRanking titulo="T" filas={[{ id: 'l', nombre: largo, valor: 1, texto: '1' }]} textoVacio="N" />);
    expect(screen.getByText(largo)).toBeTruthy();
    expect(HOJA).not.toMatch(/\.ranking-nombre\s*\{[^}]*(text-overflow|white-space:\s*nowrap)/);
  });

  it('[8] (R169) móvil primero y colores de token: sin max-width, pista y relleno de la barra por token, valor tabular', () => {
    expect(HOJA).not.toMatch(/@media[^{]*max-width[^{]*\{[^@]*\.ranking/);
    expect(HOJA).toMatch(/\.ranking-barra\s*\{[^}]*var\(--barra-pista\)/);
    expect(HOJA).toMatch(/\.ranking-barra-relleno\s*\{[^}]*var\(--barra-relleno\)/);
    expect(HOJA).toMatch(/\.ranking-valor\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);
    expect(HOJA).toMatch(/\.ranking-pos\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);
  });
});

describe('ListaRanking · lo que exporta el paquete (R169)', () => {
  it('[9] (R169) `index.ts` exporta la pieza', () => {
    expect(typeof raiz.ListaRanking).toBe('function');
  });
});

describe('ListaRanking · semántica de lista (R169)', () => {
  it('[10] (R169) el `ol` declara `role="list"`: sin viñetas, Safari le quitaría la lista', () => {
    const { container } = render(
      <ListaRanking titulo="Tardanzas" textoVacio="Nadie"
        filas={[{ id: 'a', nombre: 'Soto, Ana', valor: 5, texto: '5 min' }]} />,
    );
    expect(container.querySelector('ol')!.getAttribute('role')).toBe('list');
  });
});
