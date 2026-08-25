/**
 * R101 · La tabla arranca ordenada y con su identificador a salvo.
 *
 * Dos comportamientos por omisión que faltaban:
 *   · la PRIMERA columna no se puede ocultar — antes ninguna lo era por
 *     omisión, y se podían quitar todas hasta dejar filas en blanco;
 *   · la tabla arranca ordenada por esa columna, alfabéticamente. El orden de
 *     llegada de la consulta no es un orden para quien mira la pantalla.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TablaDatos, type Columna } from '../src/TablaDatos';

type Fila = { id: string; nombre: string; sede: string; horas: number };
const FILAS: Fila[] = [
  { id: '1', nombre: 'Ñuñez, Olga', sede: 'Sur', horas: 30 },
  { id: '2', nombre: 'Álvarez, Rosa', sede: 'Centro', horas: 40 },
  { id: '3', nombre: 'zapata, Luis', sede: 'Norte', horas: 20 },
  { id: '4', nombre: 'Bustamante, Julio', sede: 'Centro', horas: 35 },
];
const COLUMNAS: Columna<Fila>[] = [
  { clave: 'nombre', titulo: 'Trabajador', valor: (f) => f.nombre },
  { clave: 'sede', titulo: 'Sede', valor: (f) => f.sede },
  { clave: 'horas', titulo: 'Horas', valor: (f) => f.horas, numerica: true },
];
const base = { columnas: COLUMNAS, filas: FILAS, claveFila: (f: Fila) => f.id, titulo: 'Trabajadores' };

// La segunda celda: la primera es la columna «N.º», que la tabla numera sola.
const enPantalla = (c: HTMLElement) =>
  [...c.querySelectorAll('tbody tr td:nth-child(2)')].map((t) => t.textContent);

describe('TablaDatos — R101 · orden inicial y columna fija', () => {
  it('R101 · arranca ordenada por la primera columna, en español', () => {
    const { container } = render(<TablaDatos {...base} />);
    // Álvarez antes que Bustamante, la Ñ después de la N y antes de la Z, y
    // «zapata» en minúscula no se va al final: eso es `localeCompare('es')`.
    expect(enPantalla(container)).toEqual([
      'Álvarez, Rosa', 'Bustamante, Julio', 'Ñuñez, Olga', 'zapata, Luis',
    ]);
  });

  it('R101 · `ordenInicial={null}` respeta el orden de llegada', () => {
    const { container } = render(<TablaDatos {...base} ordenInicial={null} />);
    expect(enPantalla(container)).toEqual([
      'Ñuñez, Olga', 'Álvarez, Rosa', 'zapata, Luis', 'Bustamante, Julio',
    ]);
  });

  it('R101 · se puede arrancar por otra columna y en descendente', () => {
    const { container } = render(<TablaDatos {...base} ordenInicial={{ clave: 'horas', dir: 'desc' }} />);
    expect(enPantalla(container)[0]).toBe('Álvarez, Rosa');   // 40 horas
  });

  /* En servidor la tabla NO ordena, así que pintar la flecha sin que el backend
     haya ordenado sería mentir. */
  it('R101 · en modo servidor no se impone orden', () => {
    const { container } = render(<TablaDatos {...base} modo="servidor" total={4} />);
    expect(enPantalla(container)).toEqual([
      'Ñuñez, Olga', 'Álvarez, Rosa', 'zapata, Luis', 'Bustamante, Julio',
    ]);
    expect(container.querySelector('[aria-sort="ascending"]')).toBeNull();
  });

  it('R101 · y la cabecera dice por dónde está ordenada', () => {
    const { container } = render(<TablaDatos {...base} />);
    const th = container.querySelector('[aria-sort="ascending"]');
    expect(th).toBeTruthy();
    expect(th!.textContent).toContain('Trabajador');
  });

  it('R101 · la primera columna no se puede ocultar aunque no se declare', async () => {
    render(<TablaDatos {...base} />);
    await userEvent.click(screen.getByRole('button', { name: /Columnas/ }));
    const op = screen.getByRole('checkbox', { name: /Trabajador/ });
    expect(op).toBeDisabled();
    // Y lo dice, en vez de dejar que se descubra pulsando.
    expect(screen.getByText(/no se puede quitar/)).toBeTruthy();
  });

  it('R101 · las demás sí, y siguen siendo elección de quien mira', async () => {
    render(<TablaDatos {...base} />);
    await userEvent.click(screen.getByRole('button', { name: /Columnas/ }));
    expect(screen.getByRole('checkbox', { name: /Sede/ })).not.toBeDisabled();
  });

  it('R101 · `columnasFijas={[]}` es renunciar DICIÉNDOLO', async () => {
    render(<TablaDatos {...base} columnasFijas={[]} />);
    await userEvent.click(screen.getByRole('button', { name: /Columnas/ }));
    expect(screen.getByRole('checkbox', { name: /Trabajador/ })).not.toBeDisabled();
  });

  it('R101 · ordenar a mano sigue mandando sobre el orden inicial', async () => {
    const { container } = render(<TablaDatos {...base} />);
    await userEvent.click(screen.getByRole('button', { name: /Horas/ }));
    expect(enPantalla(container)[0]).toBe('zapata, Luis');   // 20 horas
  });
});
