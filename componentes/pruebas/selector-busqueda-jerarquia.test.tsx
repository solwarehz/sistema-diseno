/**
 * R169 · SelectorBusqueda con `nivel` y `cuenta`.
 *
 * DOS BLOQUES, y el orden importa:
 *
 *   1. «Sin props nuevas, el HTML es el de v1.152.0». Los literales de abajo se
 *      capturaron CONTRA EL CÓDIGO DE v1.152.0, antes de tocar el componente.
 *      Si esta prueba cambia, cambió el marcado de quien no pidió nada.
 *   2. La jerarquía: ancestros conservados al filtrar en el navegador, `nivel`
 *      y `cuenta` pintados, y el servidor tal cual.
 */
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SelectorBusqueda } from '../src/SelectorBusqueda';
import type { OpcionBusqueda } from '../src/SelectorBusqueda';

/** Los ids de `useId` no son estables entre ejecuciones: se normalizan. */
const normal = (html: string) => html.replace(/:r[0-9a-z]+:/g, 'ID');

const OPS: OpcionBusqueda[] = [
  { valor: 'a', texto: 'Pérez Salazar, Ana', ayuda: '5.º A' },
  { valor: 'b', texto: 'Quispe Huamán, César' },
  { valor: 'c', texto: 'Rojas Díaz, Elsa' },
];
const base = { etiqueta: 'Apoderado', opciones: OPS, valor: null, onCambio: vi.fn() };

function abrir(c: HTMLElement) {
  fireEvent.focus(c.querySelector('input')!);
}

describe('SelectorBusqueda · R169 · sin props nuevas el HTML es el de v1.152.0', () => {
  it('cerrado', () => {
    const { container } = render(<SelectorBusqueda {...base} />);
    expect(normal(container.innerHTML)).toMatchInlineSnapshot(`"<div class="campo-grupo"><label class="campo-etiqueta" for="ID" id="ID-et">Apoderado</label><div class="sel"><div class="sel-caja"><input id="ID" class="campo sel-in" role="combobox" aria-expanded="false" aria-controls="ID-lista" aria-autocomplete="list" autocomplete="off" placeholder="Escribe para buscar" value=""><span class="sel-chev" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg></span></div><ul class="sel-lista" id="ID-lista" role="listbox" aria-labelledby="ID-et" hidden=""><li id="ID-op-0" class="sel-op marcado" role="option" aria-selected="false"><span class="sel-op-txt">Pérez Salazar, Ana<span class="sel-notas">5.º A</span></span></li><li id="ID-op-1" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Quispe Huamán, César</span></li><li id="ID-op-2" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Rojas Díaz, Elsa</span></li></ul></div></div>"`);
  });

  it('abierto, con ayuda en una opción', () => {
    const { container } = render(<SelectorBusqueda {...base} />);
    abrir(container);
    expect(normal(container.innerHTML)).toMatchInlineSnapshot(`"<div class="campo-grupo"><label class="campo-etiqueta" for="ID" id="ID-et">Apoderado</label><div class="sel"><div class="sel-caja abierta"><input id="ID" class="campo sel-in" role="combobox" aria-expanded="true" aria-controls="ID-lista" aria-autocomplete="list" autocomplete="off" placeholder="Escribe para buscar" value="" aria-activedescendant="ID-op-0"><span class="sel-chev" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg></span></div><ul class="sel-lista" id="ID-lista" role="listbox" aria-labelledby="ID-et"><li id="ID-op-0" class="sel-op marcado" role="option" aria-selected="false"><span class="sel-op-txt">Pérez Salazar, Ana<span class="sel-notas">5.º A</span></span></li><li id="ID-op-1" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Quispe Huamán, César</span></li><li id="ID-op-2" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Rojas Díaz, Elsa</span></li></ul></div></div>"`);
  });

  it('abierto con selección y con `vacio`', () => {
    const { container } = render(<SelectorBusqueda {...base} valor="b" vacio="Todos" />);
    abrir(container);
    expect(normal(container.innerHTML)).toMatchInlineSnapshot(`"<div class="campo-grupo"><label class="campo-etiqueta" for="ID" id="ID-et">Apoderado</label><div class="sel"><div class="sel-caja abierta"><input id="ID" class="campo sel-in" role="combobox" aria-expanded="true" aria-controls="ID-lista" aria-autocomplete="list" autocomplete="off" placeholder="Escribe para buscar" value="" aria-activedescendant="ID-op-0"><span class="sel-chev" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg></span></div><ul class="sel-lista" id="ID-lista" role="listbox" aria-labelledby="ID-et"><li id="ID-op-0" class="sel-op marcado" role="option" aria-selected="false"><span class="sel-op-txt">Todos</span></li><li id="ID-op-1" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Pérez Salazar, Ana<span class="sel-notas">5.º A</span></span></li><li id="ID-op-2" class="sel-op" role="option" aria-selected="true"><span class="sel-op-txt">Quispe Huamán, César</span><span class="sel-check"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 12 5 5L20 7"></path></svg></span></li><li id="ID-op-3" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Rojas Díaz, Elsa</span></li></ul></div></div>"`);
  });

  it('con ayuda del campo, error y lupa', () => {
    const { container } = render(
      <SelectorBusqueda {...base} ayuda="Quien firma" error="Elige uno" conLupa />,
    );
    expect(normal(container.innerHTML)).toMatchInlineSnapshot(`"<div class="campo-grupo"><label class="campo-etiqueta" for="ID" id="ID-et">Apoderado</label><div class="sel"><div class="sel-caja sel-con-lupa"><span class="sel-lupa" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg></span><input id="ID" class="campo sel-in campo-mal" role="combobox" aria-expanded="false" aria-controls="ID-lista" aria-autocomplete="list" aria-invalid="true" aria-describedby="ID-error ID-ayuda" autocomplete="off" placeholder="Escribe para buscar" value=""><span class="sel-chev" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg></span></div><ul class="sel-lista" id="ID-lista" role="listbox" aria-labelledby="ID-et" hidden=""><li id="ID-op-0" class="sel-op marcado" role="option" aria-selected="false"><span class="sel-op-txt">Pérez Salazar, Ana<span class="sel-notas">5.º A</span></span></li><li id="ID-op-1" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Quispe Huamán, César</span></li><li id="ID-op-2" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Rojas Díaz, Elsa</span></li></ul></div><span id="ID-error" class="campo-error"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5M12 16h.01"></path></svg>Elige uno</span><span id="ID-ayuda" class="campo-ayuda">Quien firma</span></div>"`);
  });

  it('filtrado en el navegador', () => {
    const { container } = render(<SelectorBusqueda {...base} />);
    abrir(container);
    fireEvent.change(container.querySelector('input')!, { target: { value: 'quis' } });
    expect(normal(container.innerHTML)).toMatchInlineSnapshot(`"<div class="campo-grupo"><label class="campo-etiqueta" for="ID" id="ID-et">Apoderado</label><div class="sel"><div class="sel-caja abierta"><input id="ID" class="campo sel-in" role="combobox" aria-expanded="true" aria-controls="ID-lista" aria-autocomplete="list" autocomplete="off" placeholder="Escribe para buscar" value="quis" aria-activedescendant="ID-op-0"><span class="sel-chev" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg></span></div><ul class="sel-lista" id="ID-lista" role="listbox" aria-labelledby="ID-et"><li id="ID-op-0" class="sel-op marcado" role="option" aria-selected="false"><span class="sel-op-txt">Quispe Huamán, César</span></li></ul></div></div>"`);
  });

  it('con `onBuscar`, la lista que devuelve la app', async () => {
    const onBuscar = vi.fn(async () => [
      { valor: 'x', texto: 'Mamani Torres, Lucía', ayuda: '3.º B' },
      { valor: 'y', texto: 'Mamani Ríos, Pedro' },
    ]);
    const { container } = render(
      <SelectorBusqueda {...base} modo="servidor" onBuscar={onBuscar} rebote={0} />,
    );
    abrir(container);
    fireEvent.change(container.querySelector('input')!, { target: { value: 'mam' } });
    await waitFor(() => expect(container.querySelectorAll('.sel-op').length).toBe(2));
    expect(normal(container.innerHTML)).toMatchInlineSnapshot(`"<div class="campo-grupo"><label class="campo-etiqueta" for="ID" id="ID-et">Apoderado</label><div class="sel"><div class="sel-caja abierta"><input id="ID" class="campo sel-in" role="combobox" aria-expanded="true" aria-controls="ID-lista" aria-autocomplete="list" autocomplete="off" placeholder="Escribe para buscar" value="mam" aria-activedescendant="ID-op-0"><span class="sel-chev" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg></span></div><ul class="sel-lista" id="ID-lista" role="listbox" aria-labelledby="ID-et"><li id="ID-op-0" class="sel-op marcado" role="option" aria-selected="false"><span class="sel-op-txt">Mamani Torres, Lucía<span class="sel-notas">3.º B</span></span></li><li id="ID-op-1" class="sel-op" role="option" aria-selected="false"><span class="sel-op-txt">Mamani Ríos, Pedro</span></li></ul></div></div>"`);
  });
});

/* ── La jerarquía ─────────────────────────────────────────────────────── */

const UNIDADES: OpcionBusqueda[] = [
  { valor: 'todas', texto: 'Todas las unidades', cuenta: '62 trab.' },
  { valor: 'dg', texto: 'Dirección General', cuenta: '4 trab.' },
  { valor: 'ini', texto: 'Nivel Inicial', cuenta: '14 trab.' },
  { valor: 'adm', texto: 'Administración', cuenta: '10 trab.' },
  { valor: 'sec', texto: 'Secretaría', nivel: 1, cuenta: '6 trab.' },
  { valor: 'man', texto: 'Mantenimiento', nivel: 1, cuenta: '4 trab.' },
];
const jer = { etiqueta: 'Unidad', valor: null, onCambio: vi.fn() };

/** El nombre visible: sin el texto solo-lector que añade la jerarquía. */
const textos = (c: HTMLElement) =>
  [...c.querySelectorAll('.sel-op')].map((li) => {
    const t = li.querySelector('.sel-op-txt')!.cloneNode(true) as HTMLElement;
    t.querySelectorAll('.sr-solo').forEach((x) => x.remove());
    return t.textContent;
  });

function buscar(c: HTMLElement, q: string) {
  abrir(c);
  fireEvent.change(c.querySelector('input')!, { target: { value: q } });
}

describe('SelectorBusqueda · R169 · nivel y cuenta', () => {
  it('[21] sin buscar, todas las opciones, en su orden, sin filas de contexto', () => {
    const { container } = render(<SelectorBusqueda {...jer} opciones={UNIDADES} />);
    abrir(container);
    expect(textos(container)).toEqual(UNIDADES.map((u) => u.texto));
    expect(container.querySelector('.sel-ctx')).toBeNull();
  });

  it('[21] `nivel` sangra con una clase por nivel y no usa `style`', () => {
    const { container } = render(<SelectorBusqueda {...jer} opciones={UNIDADES} />);
    abrir(container);
    const lis = [...container.querySelectorAll('.sel-op')];
    expect(lis[0].className).not.toMatch(/sel-n\d/);
    expect(lis[4].classList.contains('sel-n1')).toBe(true);
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('[21] más allá del cuarto nivel se queda en el cuarto', () => {
    const ops: OpcionBusqueda[] = [0, 1, 2, 3, 4, 7].map((n) => ({
      valor: `n${n}`, texto: `Nivel ${n}`, nivel: n,
    }));
    const { container } = render(<SelectorBusqueda {...jer} opciones={ops} />);
    abrir(container);
    const lis = [...container.querySelectorAll('.sel-op')];
    expect(lis[4].classList.contains('sel-n4')).toBe(true);
    expect(lis[5].classList.contains('sel-n4')).toBe(true);
    expect(container.querySelector('.sel-n5')).toBeNull();
  });

  it('[22] `cuenta` va a la derecha, fuera de `.sel-op-txt`, con su propia clase tabular', () => {
    const { container } = render(<SelectorBusqueda {...jer} opciones={UNIDADES} />);
    abrir(container);
    const li = container.querySelector('.sel-op')!;
    const cuenta = li.querySelector('.sel-cuenta')!;
    expect(cuenta.textContent).toBe('62 trab.');
    expect(cuenta.parentElement).toBe(li);
    expect(li.querySelector('.sel-op-txt')!.contains(cuenta)).toBe(false);
    expect(li.lastElementChild).toBe(cuenta);
  });

  it('[22] `cuenta` numérica y 0 se pintan; sin `cuenta` no hay elemento', () => {
    const ops: OpcionBusqueda[] = [
      { valor: 'a', texto: 'A', cuenta: 0 },
      { valor: 'b', texto: 'B', cuenta: 12 },
      { valor: 'c', texto: 'C' },
    ];
    const { container } = render(<SelectorBusqueda {...jer} opciones={ops} />);
    abrir(container);
    const cs = [...container.querySelectorAll('.sel-op')].map(
      (li) => li.querySelector('.sel-cuenta')?.textContent ?? null,
    );
    expect(cs).toEqual(['0', '12', null]);
  });

  it('[22] con la opción elegida, la cuenta va antes del visto', () => {
    const { container } = render(<SelectorBusqueda {...jer} opciones={UNIDADES} valor="dg" />);
    abrir(container);
    const li = container.querySelectorAll('.sel-op')[1];
    expect([...li.children].map((h) => h.className.split(' ')[0])).toEqual([
      'sel-op-txt', 'sel-cuenta', 'sel-check',
    ]);
  });

  it('[23] al buscar un hijo se conserva su ancestro, marcado como contexto', () => {
    const { container } = render(<SelectorBusqueda {...jer} opciones={UNIDADES} />);
    buscar(container, 'secre');
    expect(textos(container)).toEqual(['Administración', 'Secretaría']);
    const lis = container.querySelectorAll('.sel-op');
    expect(lis[0].classList.contains('sel-ctx')).toBe(true);
    expect(lis[1].classList.contains('sel-ctx')).toBe(false);
  });

  it('[23] tres niveles: la coincidencia arrastra a toda la cadena, no a los hermanos', () => {
    const ops: OpcionBusqueda[] = [
      { valor: 'raiz', texto: 'Colegio' },
      { valor: 'p', texto: 'Primaria', nivel: 1 },
      { valor: 'g1', texto: 'Primero A', nivel: 2 },
      { valor: 'g2', texto: 'Segundo B', nivel: 2 },
      { valor: 'hermana', texto: 'Hermana', nivel: 1 },
      { valor: 'otra', texto: 'Otra rama' },
    ];
    const { container } = render(<SelectorBusqueda {...jer} opciones={ops} />);
    buscar(container, 'segundo');
    expect(textos(container)).toEqual(['Colegio', 'Primaria', 'Segundo B']);
    expect([...container.querySelectorAll('.sel-ctx')].length).toBe(2);
  });

  it('[23] el ancestro es el más cercano ANTERIOR de nivel menor, no uno de otra rama', () => {
    const ops: OpcionBusqueda[] = [
      { valor: 'a', texto: 'Rama A' },
      { valor: 'a1', texto: 'Hijo de A', nivel: 1 },
      { valor: 'b', texto: 'Rama B' },
      { valor: 'b1', texto: 'Hijo de B', nivel: 1 },
    ];
    const { container } = render(<SelectorBusqueda {...jer} opciones={ops} />);
    buscar(container, 'hijo de b');
    expect(textos(container)).toEqual(['Rama B', 'Hijo de B']);
  });

  it('[23] NO se muestran descendientes de una coincidencia', () => {
    const { container } = render(<SelectorBusqueda {...jer} opciones={UNIDADES} />);
    buscar(container, 'administ');
    expect(textos(container)).toEqual(['Administración']);
  });

  it('[23] dos coincidencias con el mismo ancestro no lo duplican, y el orden es el original', () => {
    const { container } = render(<SelectorBusqueda {...jer} opciones={UNIDADES} />);
    buscar(container, 'a');
    // «a» está en casi todo; lo que importa: una sola Administración y en su sitio.
    const t = textos(container);
    expect(t.filter((x) => x === 'Administración').length).toBe(1);
    const orden = UNIDADES.map((u) => u.texto).filter((x) => t.includes(x));
    expect(t).toEqual(orden);

    const dos = render(<SelectorBusqueda {...jer} opciones={UNIDADES} />);
    buscar(dos.container, 'ntenim');
    expect(textos(dos.container)).toEqual(['Administración', 'Mantenimiento']);
  });

  it('[23] una coincidencia que también es ancestro de otra coincidencia no se marca como contexto', () => {
    const ops: OpcionBusqueda[] = [
      { valor: 'adm', texto: 'Sede Norte' },
      { valor: 'sec', texto: 'Aula Norte 1', nivel: 1 },
      { valor: 'otra', texto: 'Otra sede' },
    ];
    const { container } = render(<SelectorBusqueda {...jer} opciones={ops} />);
    buscar(container, 'norte');
    expect(textos(container)).toEqual(['Sede Norte', 'Aula Norte 1']);
    // «Sede Norte» coincide POR SÍ MISMA y además es ancestro de «Aula Norte 1».
    expect(container.querySelector('.sel-ctx')).toBeNull();
  });

  it('[23] el nivel real, no el visual, halla la cadena: un 6 tras un 1 cuelga del 1 y de la raíz', () => {
    const ops: OpcionBusqueda[] = [
      { valor: 'r', texto: 'Raíz' },
      { valor: 'u', texto: 'Uno', nivel: 1 },
      { valor: 'h', texto: 'Hondo', nivel: 6 },
      { valor: 'x', texto: 'Ajeno' },
    ];
    const { container } = render(<SelectorBusqueda {...jer} opciones={ops} />);
    buscar(container, 'hondo');
    expect(textos(container)).toEqual(['Raíz', 'Uno', 'Hondo']);
    expect(container.querySelectorAll('.sel-ctx').length).toBe(2);
    expect(container.querySelector('.sel-n6')).toBeNull();
  });

  it('[21] un nivel negativo o NaN cuenta como 0: raíz, sin clase ni ancestros', () => {
    const ops: OpcionBusqueda[] = [
      { valor: 'r', texto: 'Raíz' },
      { valor: 'n', texto: 'Negativa', nivel: -3 },
      { valor: 'q', texto: 'Quebrada', nivel: Number.NaN },
    ];
    const { container } = render(<SelectorBusqueda {...jer} opciones={ops} />);
    abrir(container);
    expect(container.querySelector('[class*="sel-n"]')).toBeNull();
    expect(container.querySelector('.sr-solo')).toBeNull();
    buscar(container, 'quebrada');
    expect(textos(container)).toEqual(['Quebrada']);
  });

  it('[26] el lector oye la jerarquía: «, contexto» en el ancestro y «, nivel N» real', () => {
    const ops: OpcionBusqueda[] = [
      { valor: 'r', texto: 'Raíz' },
      { valor: 'u', texto: 'Uno', nivel: 1 },
      { valor: 'h', texto: 'Hondo', nivel: 6 },
    ];
    const { container } = render(<SelectorBusqueda {...jer} opciones={ops} />);
    abrir(container);
    const solo = (c: HTMLElement) =>
      [...c.querySelectorAll('.sel-op')].map((li) => li.querySelector('.sr-solo')?.textContent ?? null);
    expect(solo(container)).toEqual([null, ', nivel 1', ', nivel 6']);
    fireEvent.change(container.querySelector('input')!, { target: { value: 'hondo' } });
    expect(solo(container)).toEqual([', contexto', ', contexto, nivel 1', ', nivel 6']);
  });

  it('[26] sin props nuevas no hay texto solo-lector en las opciones', () => {
    const { container } = render(<SelectorBusqueda {...base} />);
    abrir(container);
    expect(container.querySelector('.sel-op .sr-solo')).toBeNull();
  });

  it('[23] sin `nivel` en ninguna opción, filtrar es lo de siempre', () => {
    const { container } = render(<SelectorBusqueda {...base} />);
    buscar(container, 'quis');
    expect(textos(container)).toEqual(['Quispe Huamán, César']);
    expect(container.querySelector('.sel-ctx')).toBeNull();
  });

  it('[23] el ancestro de contexto sigue siendo elegible', () => {
    const onCambio = vi.fn();
    const { container } = render(
      <SelectorBusqueda {...jer} opciones={UNIDADES} onCambio={onCambio} />,
    );
    buscar(container, 'secre');
    fireEvent.mouseDown(container.querySelectorAll('.sel-op')[0]);
    expect(onCambio).toHaveBeenCalledWith('adm');
  });

  it('[24] teclado: con filas de contexto, la marcada de partida es la primera COINCIDENCIA', () => {
    const onCambio = vi.fn();
    const { container } = render(
      <SelectorBusqueda {...jer} opciones={UNIDADES} onCambio={onCambio} />,
    );
    buscar(container, 'secre');
    const lis = container.querySelectorAll('.sel-op');
    expect(lis[1].classList.contains('marcado')).toBe(true);
    expect(lis[0].classList.contains('marcado')).toBe(false);
    fireEvent.keyDown(container.querySelector('input')!, { key: 'Enter' });
    expect(onCambio).toHaveBeenCalledWith('sec');
  });

  it('[24] teclado: las flechas recorren también las filas de contexto y ciclan', () => {
    const onCambio = vi.fn();
    const { container } = render(
      <SelectorBusqueda {...jer} opciones={UNIDADES} onCambio={onCambio} />,
    );
    buscar(container, 'secre');
    const campo = container.querySelector('input')!;
    fireEvent.keyDown(campo, { key: 'ArrowUp' });
    expect(container.querySelectorAll('.sel-op')[0].classList.contains('marcado')).toBe(true);
    expect(campo.getAttribute('aria-activedescendant')).toBe(
      container.querySelectorAll('.sel-op')[0].id,
    );
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(onCambio).toHaveBeenCalledWith('adm');
  });

  it('[25] con `onBuscar` la lista del servidor sale TAL CUAL: sin ancestros añadidos', async () => {
    const onBuscar = vi.fn(async () => [
      { valor: 'sec', texto: 'Secretaría', nivel: 1, cuenta: '6 trab.' },
    ]);
    const { container } = render(
      <SelectorBusqueda
        {...jer}
        opciones={UNIDADES}
        modo="servidor"
        onBuscar={onBuscar}
        rebote={0}
      />,
    );
    buscar(container, 'secre');
    await waitFor(() => expect(textos(container)).toEqual(['Secretaría']));
    expect(container.querySelector('.sel-ctx')).toBeNull();
    // `nivel` y `cuenta` de lo devuelto sí se pintan.
    expect(container.querySelector('.sel-n1')).toBeTruthy();
    expect(screen.getByText('6 trab.')).toBeTruthy();
  });
});
