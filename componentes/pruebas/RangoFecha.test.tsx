/**
 * El teclado del calendario, probado.
 *
 * Cada prueba corresponde a un hallazgo de la auditoría de patrones accesibles.
 * Los cuatro críticos que traía el del catálogo están cubiertos aquí.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RangoFecha } from '../src/RangoFecha';

// Fecha fija: un calendario que dependa del reloj da pruebas que fallan solas
// un martes cualquiera.
const HOY = new Date(2026, 2, 15); // 15 de marzo de 2026, domingo

const pintar = (props = {}) =>
  render(<RangoFecha titulo="Periodo" hoy={HOY} {...props} />);

const abrirDesde = async (u: ReturnType<typeof userEvent.setup>) => {
  await u.click(screen.getByRole('button', { name: /Desde/ }));
  return screen.getByRole('dialog');
};

const diaConNombre = (re: RegExp) => screen.getByRole('button', { name: re });

describe('Rango de fechas · el teclado, que antes no existía', () => {
  it('las flechas mueven el foco por día y por semana', async () => {
    const u = userEvent.setup();
    pintar();
    await abrirDesde(u);

    // Arranca sobre hoy.
    expect(diaConNombre(/domingo 15 de marzo/)).toHaveFocus();

    await u.keyboard('{ArrowRight}');
    expect(diaConNombre(/lunes 16 de marzo/)).toHaveFocus();

    await u.keyboard('{ArrowDown}');
    expect(diaConNombre(/lunes 23 de marzo/)).toHaveFocus();

    await u.keyboard('{ArrowUp}{ArrowLeft}');
    expect(diaConNombre(/domingo 15 de marzo/)).toHaveFocus();
  });

  it('Home y End van al principio y al fin de la SEMANA', async () => {
    const u = userEvent.setup();
    pintar();
    await abrirDesde(u);
    await u.keyboard('{Home}');
    expect(diaConNombre(/lunes 9 de marzo/)).toHaveFocus();
    await u.keyboard('{End}');
    expect(diaConNombre(/domingo 15 de marzo/)).toHaveFocus();
  });

  it('PageUp y PageDown cambian de mes; con Shift, de año', async () => {
    const u = userEvent.setup();
    pintar();
    await abrirDesde(u);

    await u.keyboard('{PageDown}');
    expect(diaConNombre(/15 de abril de 2026/)).toHaveFocus();

    await u.keyboard('{PageUp}');
    expect(diaConNombre(/15 de marzo de 2026/)).toHaveFocus();

    await u.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(diaConNombre(/15 de marzo de 2027/)).toHaveFocus();
  });

  it('roving tabindex: UN solo día alcanzable con Tab, no sesenta', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await abrirDesde(u);
    const alcanzables = container.querySelectorAll('.fc-d[tabindex="0"]');
    expect(alcanzables).toHaveLength(1);
    expect(container.querySelectorAll('.fc-d').length).toBeGreaterThan(30);
  });

  it('Escape cierra Y devuelve el foco al campo, no a <body>', async () => {
    const u = userEvent.setup();
    pintar();
    await abrirDesde(u);
    await u.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Desde/ })).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it('Enter y Espacio eligen el día que tiene el foco', async () => {
    const u = userEvent.setup();
    const alCambio = vi.fn();
    pintar({ onCambio: alCambio });
    await abrirDesde(u);
    await u.keyboard('{ArrowRight}{Enter}');
    expect(alCambio).toHaveBeenCalledWith({ desde: '2026-03-16', hasta: null });
  });
});

describe('Rango de fechas · el fallo que borraba la selección', () => {
  it('volver a «Desde» NO borra el rango', async () => {
    const u = userEvent.setup();
    pintar({ desde: '2026-03-10', hasta: '2026-03-20' });

    // Abrir «Desde» otra vez —lo que un Shift+Tab provocaba— no destruye nada.
    await abrirDesde(u);
    expect(screen.getByRole('button', { name: /Desde/ })).toHaveTextContent('2026-03-10');
    expect(screen.getByRole('button', { name: /Hasta/ })).toHaveTextContent('2026-03-20');
  });

  it('elegir «hasta» anterior a «desde» reinicia el rango en vez de invertirlo', async () => {
    const u = userEvent.setup();
    const alCambio = vi.fn();
    pintar({ desde: '2026-03-20', onCambio: alCambio });
    await u.click(screen.getByRole('button', { name: /Hasta/ }));
    await u.click(diaConNombre(/10 de marzo de 2026/));
    expect(alCambio).toHaveBeenCalledWith({ desde: '2026-03-10', hasta: null });
  });
});

describe('Rango de fechas · lo que se anuncia', () => {
  it('«hoy» es aria-current="date", y los extremos NO', async () => {
    const u = userEvent.setup();
    pintar({ desde: '2026-03-10', hasta: '2026-03-20' });
    await abrirDesde(u);

    expect(diaConNombre(/domingo 15 de marzo/)).toHaveAttribute('aria-current', 'date');
    expect(diaConNombre(/10 de marzo de 2026, extremo/)).not.toHaveAttribute('aria-current');
  });

  it('el interior del rango se dice con texto, no solo con color', async () => {
    const u = userEvent.setup();
    pintar({ desde: '2026-03-10', hasta: '2026-03-20' });
    await abrirDesde(u);
    expect(screen.getByRole('button', { name: /12 de marzo de 2026, dentro del rango/ })).toBeInTheDocument();
  });

  it('la rejilla es una rejilla de verdad, con sus filas y celdas', async () => {
    const u = userEvent.setup();
    pintar();
    const dialogo = await abrirDesde(u);
    const rejilla = within(dialogo).getByRole('grid');
    expect(within(rejilla).getAllByRole('columnheader')).toHaveLength(7);
    expect(within(rejilla).getAllByRole('row').length).toBeGreaterThanOrEqual(6);
    expect(within(rejilla).getAllByRole('gridcell').length).toBe(42);
  });

  it('el mes se anuncia al cambiar', async () => {
    const u = userEvent.setup();
    pintar();
    const dialogo = await abrirDesde(u);
    const titulo = dialogo.querySelector('[aria-live="polite"]')!;
    expect(titulo).toHaveTextContent('marzo de 2026');
    await u.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(titulo).toHaveTextContent('abril de 2026');
  });
});
