/**
 * DOBLE ENVÍO
 *
 * Lo que se prueba aquí no es una propiedad: es una GARANTÍA. Si el botón
 * dependiera de que el proyecto se acuerde de poner `ocupado`, el día que se
 * olvida se graba dos veces — y no se olvida por descuido, se pulsa dos veces
 * porque el servidor tarda y la persona insiste.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Boton } from '../src/Boton';

describe('Botón — acción de servidor', () => {
  // EL FALLO QUE REPORTÓ CONTROL ADMINISTRATIVOS V2.0.
  //
  // En modo estricto —que viene activado por omisión— React monta, limpia y
  // vuelve a montar. La limpieza ponía `vivo = false` y NADA lo devolvía a
  // `true`, así que a partir de ahí la liberación no ocurría nunca: el botón se
  // quedaba deshabilitado para siempre tras la primera acción.
  //
  // Y no se podía arreglar desde fuera, porque `trabajando` es
  // `ocupado || enVuelo` y `enVuelo` solo lo baja ese camino.
  it('en MODO ESTRICTO el botón se libera: no se queda muerto tras la primera vez', async () => {
    const u = userEvent.setup();
    let soltar: () => void = () => {};
    const enVuelo = new Promise<void>((r) => { soltar = r; });

    render(
      <StrictMode>
        <Boton onClick={() => enVuelo}>Consultar</Boton>
      </StrictMode>
    );
    const b = screen.getByRole('button');

    await u.click(b);
    expect(b).toBeDisabled();

    soltar();
    await waitFor(() => expect(b).not.toBeDisabled());
  });

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

  it('con textoOcupado, LOS DOS textos existen: el ancho no salta', async () => {
    const u = userEvent.setup();
    const enVuelo = new Promise<void>(() => {});
    render(<Boton textoOcupado="Consultando…" onClick={() => enVuelo}>Consultar</Boton>);
    const b = screen.getByRole('button');

    // Antes de pulsar: los dos en el DOM, uno reservando sitio.
    expect(b.textContent).toContain('Consultar');
    expect(b.textContent).toContain('Consultando…');
    expect(b.querySelectorAll('.btn-texto-oculto')).toHaveLength(1);

    await u.click(b);
    // Después: siguen los dos, y sigue habiendo exactamente uno oculto.
    expect(b.querySelectorAll('.btn-texto-oculto')).toHaveLength(1);
  });

  it('el lector NO oye los dos textos a la vez', async () => {
    const u = userEvent.setup();
    const enVuelo = new Promise<void>(() => {});
    render(<Boton textoOcupado="Guardando…" onClick={() => enVuelo}>Guardar</Boton>);
    const b = screen.getByRole('button');

    expect(b).toHaveAccessibleName('Guardar');
    await u.click(b);
    expect(b).toHaveAccessibleName('Guardando…');
  });

  it('SIN textoOcupado el estado se anuncia igual, por el texto de solo-lector', async () => {
    const u = userEvent.setup();
    const enVuelo = new Promise<void>(() => {});
    render(<Boton onClick={() => enVuelo}>Guardar</Boton>);
    const b = screen.getByRole('button');
    await u.click(b);
    expect(b).toHaveAccessibleName(/enviando/);
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
