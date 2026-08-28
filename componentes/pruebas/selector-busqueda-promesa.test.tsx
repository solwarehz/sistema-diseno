/**
 * R115 · LA PROMESA DEL SELECTOR CON BÚSQUEDA, QUE NO ERA LA ENTREGA.
 *
 * Lo reportó el equipo que lo usa en un sistema: con la v1.94.0 instalada, lo
 * que veían no era lo que enseña el catálogo. Tenían razón en nueve puntos —
 * cinco que se ven y cuatro que se teclean— y **los quince candados estaban en
 * verde**, porque en el catálogo la lista del selector es un `<ul hidden>`
 * VACÍO que llena su guión al abrirla: `.sel-op`, `.sel-check`, `.sel-vacio` y
 * `.sel-caja.abierta` no existen en el marcado estático que el candado lee.
 *
 * Estas pruebas fijan las ocho reglas nuevas de `comportamiento.md`, que es
 * donde la tabla de teclado tenía que haber vivido desde el principio: hasta
 * aquí se publicaba solo en el catálogo, y el candado del contrato lee el
 * documento, no el catálogo.
 *
 * Las reglas 9–16 de la sección «Selector con búsqueda» de `comportamiento.md`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SelectorBusqueda } from '../src/SelectorBusqueda';

const OPCIONES = [
  { valor: 'anc', texto: 'Áncash' },
  { valor: 'lim', texto: 'Lima', ayuda: 'capital' },
  { valor: 'cus', texto: 'Cusco' },
];

const pintar = (props: Partial<React.ComponentProps<typeof SelectorBusqueda>> = {}) =>
  render(
    <SelectorBusqueda
      etiqueta="Departamento"
      opciones={OPCIONES}
      valor={null}
      onCambio={() => {}}
      {...props}
    />,
  );

const combo = () => screen.getByRole('combobox');
const abrir = async (u: ReturnType<typeof userEvent.setup>) => u.click(combo());
const marcada = () =>
  document.querySelector('.sel-op.marcado')?.textContent ?? '(ninguna)';

describe('R9 · R115 · las dos flechas abren la lista', () => {
  /** El foco abre la lista, así que para aislar la tecla se cierra con Escape
   *  —que es el gesto real de quien no quiere la lista— y se pulsa entonces. */
  const cerrada = async (u: ReturnType<typeof userEvent.setup>, raiz: HTMLElement) => {
    await abrir(u);
    await u.keyboard('{Escape}');
    expect((raiz.querySelector('.sel-lista') as HTMLElement).hidden).toBe(true);
  };

  it('R9 · R115 · Arriba abre la lista cuando está cerrada', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await cerrada(u, container);
    await u.keyboard('{ArrowUp}');
    expect((container.querySelector('.sel-lista') as HTMLElement).hidden).toBe(false);
  });

  it('R9 · R115 · Abajo sigue abriéndola, que ya lo hacía', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await cerrada(u, container);
    await u.keyboard('{ArrowDown}');
    expect((container.querySelector('.sel-lista') as HTMLElement).hidden).toBe(false);
  });
});

describe('R10 · R115 · las flechas ciclan, no topan', () => {
  it('R10 · R115 · Abajo desde la última vuelve a la primera', async () => {
    const u = userEvent.setup();
    pintar();
    await abrir(u);
    expect(marcada()).toBe('Áncash');
    await u.keyboard('{ArrowDown}{ArrowDown}');
    expect(marcada()).toBe('Cusco');
    // La cuarta pulsación sobre tres opciones: cicla.
    await u.keyboard('{ArrowDown}');
    expect(marcada()).toBe('Áncash');
  });

  it('R10 · R115 · Arriba desde la primera salta a la última', async () => {
    const u = userEvent.setup();
    pintar();
    await abrir(u);
    await u.keyboard('{ArrowUp}');
    expect(marcada()).toBe('Cusco');
  });
});

describe('R11 · R115 · Inicio y Fin', () => {
  it('R11 · R115 · Fin marca la última y Inicio vuelve a la primera', async () => {
    const u = userEvent.setup();
    pintar();
    await abrir(u);
    await u.keyboard('{End}');
    expect(marcada()).toBe('Cusco');
    await u.keyboard('{Home}');
    expect(marcada()).toBe('Áncash');
  });
});

describe('R12 · R115 · Tab elige lo marcado', () => {
  it('R12 · R115 · tabular con una opción marcada la elige', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    pintar({ onCambio });
    await abrir(u);
    await u.keyboard('{ArrowDown}');       // marca «Lima»
    expect(marcada()).toContain('Lima');
    await u.keyboard('{Tab}');
    expect(onCambio).toHaveBeenCalledWith('lim');
  });

  it('R12 · R115 · y NO devuelve el foco: la persona se está yendo', async () => {
    const u = userEvent.setup();
    pintar({ onCambio: () => {} });
    await abrir(u);
    await u.keyboard('{ArrowDown}');
    await u.keyboard('{Tab}');
    expect(document.activeElement).not.toBe(combo());
  });

  it('R12 · R115 · Tab NO dispara «crear»: salir no es pedir un alta', async () => {
    const onCrear = vi.fn();
    const u = userEvent.setup();
    pintar({ onCrear });
    await abrir(u);
    await u.keyboard('Piura');            // no coincide con ninguna
    expect(screen.getAllByRole('option')).toHaveLength(1); // la fila de crear
    await u.keyboard('{Tab}');
    expect(onCrear).not.toHaveBeenCalled();
  });
});

describe('R13 · R115 · Escape cierra la lista y conserva la elección', () => {
  it('R13 · R115 · devuelve el valor anterior y no emite cambio', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    pintar({ valor: 'lim', onCambio });
    await abrir(u);
    await u.keyboard('Cus');
    await u.keyboard('{Escape}');
    expect(combo()).toHaveValue('Lima');
    expect(onCambio).not.toHaveBeenCalled();
  });
});

describe('R14 · R115 · el orden de los hijos de la opción', () => {
  it('R14 · R115 · el visto va DETRÁS del texto, no delante', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ valor: 'cus' });
    await abrir(u);
    const elegida = container.querySelector('.sel-op[aria-selected="true"]')!;
    const hijos = [...elegida.children].map((h) => h.className);
    expect(hijos).toEqual(['sel-op-txt', 'sel-check']);
  });

  it('R14 · R115 · el nombre y su ayuda van dentro de .sel-op-txt', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await abrir(u);
    // «Lima» es la única con ayuda.
    const conAyuda = container.querySelector('.sel-notas')!;
    expect(conAyuda.textContent).toBe('capital');
    expect(conAyuda.closest('.sel-op-txt')).not.toBeNull();
  });

  it('R14 · R115 · con visto y ayuda a la vez, .sel-op sigue teniendo DOS hijos', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ valor: 'lim' });
    await abrir(u);
    const elegida = container.querySelector('.sel-op[aria-selected="true"]')!;
    // Tres hijos sueltos era el defecto: space-between mandaba el nombre al
    // centro y la fila elegida se desalineaba de sus vecinas.
    expect(elegida.children).toHaveLength(2);
  });
});

describe('R15 · R115 · la clase `abierta` mientras la lista está desplegada', () => {
  it('R15 · R115 · se pone al abrir y se quita al cerrar', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    const caja = () => container.querySelector('.sel-caja')!;
    expect(caja().className).not.toContain('abierta');
    await abrir(u);
    expect(caja().className).toContain('abierta');
    await u.keyboard('{Escape}');
    expect(caja().className).not.toContain('abierta');
  });

  it('R15 · R115 · convive con `sel-con-lupa` sin pisarla', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ conLupa: true });
    await abrir(u);
    const cn = container.querySelector('.sel-caja')!.className;
    expect(cn).toContain('sel-con-lupa');
    expect(cn).toContain('abierta');
  });
});

describe('R16 · R115 · el vacío dice qué se buscó', () => {
  it('R16 · R115 · por omisión nombra lo tecleado', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await abrir(u);
    await u.keyboard('Piura');
    const vacio = container.querySelector('.sel-vacio')!;
    expect(vacio.textContent).toContain('Piura');
    // Y lleva su titular: la regla del catálogo es «di qué se buscó y ofrece
    // salida», no un cartel seco.
    expect(vacio.querySelector('strong')).not.toBeNull();
  });

  it('R16 · R115 · una cadena sigue funcionando: nadie tiene que cambiar nada', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ textoVacio: 'Sin apoderados' });
    await abrir(u);
    await u.keyboard('Piura');
    expect(container.querySelector('.sel-vacio')!.textContent).toBe('Sin apoderados');
  });

  it('R16 · R115 · con una función recibe lo tecleado, ya recortado', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ textoVacio: (t: string) => `nada para ${t}` });
    await abrir(u);
    await u.keyboard('  Piura  ');
    expect(container.querySelector('.sel-vacio')!.textContent).toBe('nada para Piura');
  });
});
