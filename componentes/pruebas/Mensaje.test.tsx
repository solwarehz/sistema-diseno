/**
 * R83 · Mensaje en flujo con tono. Existía el CSS de los cuatro tonos y no
 * existía la pieza, así que cada pantalla dibujaba su caja a mano: seis
 * mensajes en tres pantallas, medido por Control Administrativos V2.0.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Mensaje } from '../src/Mensaje';

describe('Mensaje — R83', () => {
  it('el error INTERRUMPE y el resto espera turno', () => {
    const { rerender } = render(<Mensaje intencion="error">No se guardó</Mensaje>);
    expect(screen.getByRole('alert')).toHaveTextContent('No se guardó');

    rerender(<Mensaje intencion="exito">Se guardó</Mensaje>);
    expect(screen.getByRole('status')).toHaveTextContent('Se guardó');
  });

  it('la urgencia se puede forzar en los dos sentidos', () => {
    const { rerender, container } = render(
      <Mensaje intencion="error" urgencia="status">Error ya leído</Mensaje>
    );
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    expect(container.querySelector('[role="alert"]')).toBeNull();

    rerender(<Mensaje intencion="aviso" urgencia="alert">La sesión caduca en 1 minuto</Mensaje>);
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  /* SC 1.4.1 · el tono NO se dice solo con color. */
  it('cada intención trae su glifo, y son cuatro distintos', () => {
    const vistos = new Set<string>();
    for (const i of ['exito', 'aviso', 'error', 'info'] as const) {
      const { container, unmount } = render(<Mensaje intencion={i}>x</Mensaje>);
      const svg = container.querySelector('.msj-ico svg');
      expect(svg).toBeInTheDocument();
      vistos.add(container.querySelector('.msj-ico')!.innerHTML);
      unmount();
    }
    expect(vistos.size).toBe(4);
  });

  it('el glifo va OCULTO al lector: quien nombra es el texto', () => {
    const { container } = render(<Mensaje intencion="info">Cierra el 31</Mensaje>);
    expect(container.querySelector('.msj-ico svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lleva la clase del tono, que es la que ya existía en la hoja', () => {
    const { container } = render(<Mensaje intencion="aviso">x</Mensaje>);
    const m = container.querySelector('.msj')!;
    expect(m.className).toContain('msj-aviso');
  });

  it('el título va en negrita y delante del cuerpo', () => {
    const { container } = render(
      <Mensaje intencion="exito" titulo="Se guardó.">24 registros actualizados.</Mensaje>
    );
    const fuerte = container.querySelector('.msj-txt strong')!;
    expect(fuerte).toHaveTextContent('Se guardó.');
    expect(container.querySelector('.msj-txt')).toHaveTextContent('24 registros actualizados.');
  });
});
