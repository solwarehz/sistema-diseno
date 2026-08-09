/**
 * PANEL DE LA BARRA
 *
 * Un solo componente para mensajes y notificaciones. Lo que se prueba es el
 * contador anunciado —lo que no ve quien usa lector— y el cierre con
 * devolución del foco, que es donde fallan los desplegables hechos a mano.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PanelBarra, type ItemPanel } from '../src/PanelBarra';

const ITEMS: ItemPanel[] = [
  { id: '1', titulo: 'QUISPE, Rosa', texto: 'Justificación de tardanza', cuando: 'hace 5 min', sinLeer: true },
  { id: '2', titulo: 'MAMANI, Luis', texto: 'Consulta de horario', cuando: 'ayer' },
];

describe('Panel de la barra', () => {
  it('el contador va EN EL NOMBRE del botón, no solo en la burbuja', () => {
    render(<PanelBarra icono="campana" titulo="Notificaciones" items={ITEMS} />);
    expect(screen.getByRole('button', { name: 'Notificaciones, 1 sin leer' })).toBeInTheDocument();
  });

  it('sin nada sin leer, el nombre no inventa un número', () => {
    render(<PanelBarra icono="sobre" titulo="Mensajes" items={[ITEMS[1]]} />);
    expect(screen.getByRole('button', { name: 'Mensajes' })).toBeInTheDocument();
  });

  it('arranca cerrado y se abre al pulsar', async () => {
    const u = userEvent.setup();
    render(<PanelBarra icono="campana" titulo="Notificaciones" items={ITEMS} />);
    const b = screen.getByRole('button', { name: /Notificaciones/ });
    expect(b).toHaveAttribute('aria-expanded', 'false');
    await u.click(b);
    expect(b).toHaveAttribute('aria-expanded', 'true');
  });

  it('Escape cierra y DEVUELVE el foco al botón', async () => {
    const u = userEvent.setup();
    render(<PanelBarra icono="campana" titulo="Notificaciones" items={ITEMS} />);
    const b = screen.getByRole('button', { name: /Notificaciones/ });
    await u.click(b);
    await u.keyboard('{Escape}');
    expect(b).toHaveAttribute('aria-expanded', 'false');
    expect(b).toHaveFocus();
  });

  it('es un diálogo y no un menú: dentro hay texto que leer', async () => {
    const u = userEvent.setup();
    render(<PanelBarra icono="sobre" titulo="Mensajes" items={ITEMS} />);
    await u.click(screen.getByRole('button', { name: /Mensajes/ }));
    expect(screen.getByRole('dialog', { name: 'Mensajes' })).toBeInTheDocument();
  });

  it('pulsar un elemento avisa al proyecto y cierra', async () => {
    const u = userEvent.setup();
    const abrir = vi.fn();
    render(<PanelBarra icono="sobre" titulo="Mensajes" items={[{ ...ITEMS[0], onClick: abrir }]} />);
    const b = screen.getByRole('button', { name: /Mensajes/ });
    await u.click(b);
    await u.click(screen.getByRole('button', { name: /QUISPE/ }));
    expect(abrir).toHaveBeenCalled();
    expect(b).toHaveAttribute('aria-expanded', 'false');
  });

  it('sin nada, lo dice en vez de dejar una ventana vacía', async () => {
    const u = userEvent.setup();
    render(<PanelBarra icono="campana" titulo="Notificaciones" items={[]} vacio="No tienes avisos" />);
    await u.click(screen.getByRole('button', { name: /Notificaciones/ }));
    expect(screen.getByText('No tienes avisos')).toBeInTheDocument();
  });

  it('«Ver todos» solo aparece si hay a dónde ir', async () => {
    const u = userEvent.setup();
    const { rerender } = render(<PanelBarra icono="sobre" titulo="Mensajes" items={ITEMS} />);
    await u.click(screen.getByRole('button', { name: /Mensajes/ }));
    expect(screen.queryByRole('button', { name: 'Ver todos' })).toBeNull();

    rerender(<PanelBarra icono="sobre" titulo="Mensajes" items={ITEMS} onVerTodos={() => {}} />);
    expect(screen.getByRole('button', { name: 'Ver todos' })).toBeInTheDocument();
  });

  it('el «sin leer» no depende solo del punto: SC 1.4.1', async () => {
    const u = userEvent.setup();
    const { container } = render(<PanelBarra icono="campana" titulo="Notificaciones" items={ITEMS} />);
    await u.click(screen.getByRole('button', { name: /Notificaciones/ }));
    const nuevo = container.querySelector('.pb-nuevo')!;
    expect(nuevo).toBeTruthy();
    // El punto va oculto al lector: lo que dice ya está en el nombre del botón.
    expect(nuevo.querySelector('.pb-punto')).toHaveAttribute('aria-hidden', 'true');
  });
});
