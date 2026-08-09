/**
 * MIGAS DE PAN
 *
 * Lo que se prueba es lo que NO SE VE, que es exactamente lo que se perdía al
 * reconstruirlas mirando: el rótulo de la región, las barras que el lector no
 * debe leer, y el `aria-current` del nivel actual.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Migas } from '../src/Migas';

const RUTA = [
  { texto: 'Sistema de diseño', href: '/' },
  { texto: 'Elementos', href: '/elementos' },
  { texto: 'Interruptor' },
];

describe('Migas de pan', () => {
  it('la región tiene rótulo: sin él hay dos «navegación» y no se distinguen', () => {
    render(<Migas ruta={RUTA} />);
    expect(screen.getByRole('navigation', { name: 'Ubicación' })).toBeInTheDocument();
  });

  it('el nivel actual se ANUNCIA con aria-current', () => {
    render(<Migas ruta={RUTA} />);
    expect(screen.getByText('Interruptor')).toHaveAttribute('aria-current', 'page');
  });

  it('el último NO es enlace: llevaría a donde ya estás', () => {
    render(<Migas ruta={RUTA} />);
    expect(screen.queryByRole('link', { name: 'Interruptor' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Elementos' })).toBeInTheDocument();
  });

  it('aunque el último traiga href, se ignora', () => {
    render(<Migas ruta={[{ texto: 'Inicio', href: '/' }, { texto: 'Aquí', href: '/aqui' }]} />);
    expect(screen.queryByRole('link', { name: 'Aquí' })).toBeNull();
  });

  it('las barras NO las lee el lector', () => {
    const { container } = render(<Migas ruta={RUTA} />);
    const seps = container.querySelectorAll('.migas-sep');
    expect(seps).toHaveLength(2);
    seps.forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
  });

  it('navegar avisa al enrutador sin recargar', async () => {
    const u = userEvent.setup();
    const ir = vi.fn();
    render(<Migas ruta={RUTA} onIr={ir} />);
    await u.click(screen.getByRole('link', { name: 'Elementos' }));
    expect(ir).toHaveBeenCalledWith('/elementos');
  });

  it('los niveles de más atrás se marcan para ocultarse SOLO a la vista', () => {
    const { container } = render(<Migas ruta={RUTA} visiblesEnMovil={2} />);
    // El primero se oculta en móvil; sigue en el árbol de accesibilidad.
    expect(container.querySelectorAll('.migas-atras')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Sistema de diseño' })).toBeInTheDocument();
  });

  it('con una sola miga no hay separadores', () => {
    const { container } = render(<Migas ruta={[{ texto: 'Inicio' }]} />);
    expect(container.querySelectorAll('.migas-sep')).toHaveLength(0);
  });

  it('sin ruta no pinta nada, en vez de una barra vacía', () => {
    const { container } = render(<Migas ruta={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
