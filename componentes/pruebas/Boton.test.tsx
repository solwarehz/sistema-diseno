/**
 * DOBLE ENVÍO
 *
 * Lo que se prueba aquí no es una propiedad: es una GARANTÍA. Si el botón
 * dependiera de que el proyecto se acuerde de poner `ocupado`, el día que se
 * olvida se graba dos veces — y no se olvida por descuido, se pulsa dos veces
 * porque el servidor tarda y la persona insiste.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Boton } from '../src/Boton';

describe('Botón — acción de servidor', () => {
  it('con una acción que tarda, el segundo clic NO llega', async () => {
    const u = userEvent.setup();
    let soltar: () => void = () => {};
    const enVuelo = new Promise<void>((r) => { soltar = r; });
    const accion = vi.fn(() => enVuelo);

    render(<Boton variante="principal" onClick={accion}>Guardar</Boton>);
    const b = screen.getByRole('button', { name: /Guardar/ });

    await u.click(b);
    expect(accion).toHaveBeenCalledTimes(1);

    // La persona insiste porque no ve respuesta. Tres veces.
    await u.click(b);
    await u.click(b);
    await u.click(b);
    expect(accion).toHaveBeenCalledTimes(1);

    soltar();
    await waitFor(() => expect(b).not.toBeDisabled());
  });

  it('se anuncia como ocupado mientras viaja, no solo se pinta', async () => {
    const u = userEvent.setup();
    let soltar: () => void = () => {};
    const enVuelo = new Promise<void>((r) => { soltar = r; });

    render(<Boton onClick={() => enVuelo}>Enviar</Boton>);
    const b = screen.getByRole('button');

    await u.click(b);
    expect(b).toHaveAttribute('aria-busy', 'true');
    expect(b).toBeDisabled();

    soltar();
    await waitFor(() => expect(b).not.toHaveAttribute('aria-busy'));
  });

  it('si la petición FALLA el botón vuelve; no se queda muerto', async () => {
    const u = userEvent.setup();
    let romper: (e: Error) => void = () => {};
    const enVuelo = new Promise<void>((_, rechazar) => { romper = rechazar; });
    // La promesa se rechaza a propósito: sin `finally`, aquí el botón se
    // quedaría deshabilitado para siempre y la pantalla habría que recargarla.
    render(<Boton onClick={() => enVuelo.catch(() => {})}>Reintentar</Boton>);
    const b = screen.getByRole('button');

    await u.click(b);
    expect(b).toBeDisabled();

    romper(new Error('sin red'));
    await waitFor(() => expect(b).not.toBeDisabled());
  });

  it('una acción normal —sin promesa— no se ocupa ni estorba', async () => {
    const u = userEvent.setup();
    const accion = vi.fn();
    render(<Boton onClick={accion}>Filtros</Boton>);
    const b = screen.getByRole('button');

    await u.click(b);
    await u.click(b);
    expect(accion).toHaveBeenCalledTimes(2);
    expect(b).not.toBeDisabled();
  });

  it('un `disabled={false}` del proyecto NO puede quitar el bloqueo', async () => {
    const u = userEvent.setup();
    const enVuelo = new Promise<void>(() => {});
    const accion = vi.fn(() => enVuelo);
    // Esto es lo que pasaría si el reparto de props fuera después: el proyecto
    // pisaría la garantía sin querer.
    render(<Boton disabled={false} onClick={accion}>Guardar</Boton>);
    const b = screen.getByRole('button');

    await u.click(b);
    await u.click(b);
    expect(accion).toHaveBeenCalledTimes(1);
  });
});
