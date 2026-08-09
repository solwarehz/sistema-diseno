/**
 * DIÁLOGO MODAL
 *
 * Lo que importa aquí es el FOCO, que es donde fallan los diálogos hechos a
 * mano: entra, no se escapa y vuelve. Y el orden de los botones, que es lo que
 * hace que se pulse el que no era.
 *
 * jsdom no implementa `showModal` —ni la capa superior ni la inercia—, así que
 * se sustituye por una versión que hace lo justo para poder comprobar el resto.
 * Se declara aquí en vez de disimularlo: lo que no se puede probar se dice.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { useRef, useState } from 'react';
import { Dialogo } from '../src/Dialogo';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

function Anfitrion({ conAccion = false, onAccion = () => {} }) {
  const origen = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button ref={origen} onClick={() => setAbierto(true)}>Editar</button>
      <Dialogo
        abierto={abierto}
        titulo="Editar los datos de contacto"
        origen={origen}
        onCerrar={() => setAbierto(false)}
        accion={conAccion ? { texto: 'Guardar', onClick: onAccion } : undefined}
      >
        <p>Contenido del diálogo</p>
      </Dialogo>
    </>
  );
}

const abrir = (u: ReturnType<typeof userEvent.setup>) =>
  u.click(screen.getByRole('button', { name: 'Editar' }));

describe('Diálogo', () => {
  it('el diálogo tiene nombre accesible: sin él es «diálogo» a secas', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    expect(screen.getByRole('dialog', { name: 'Editar los datos de contacto' })).toBeInTheDocument();
  });

  it('el foco ENTRA en el título, no se queda fuera ni cae en un campo sin contexto', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    expect(screen.getByRole('heading', { name: 'Editar los datos de contacto' })).toHaveFocus();
  });

  it('al cerrar, el foco VUELVE al elemento que lo abrió', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    const origen = screen.getByRole('button', { name: 'Editar' });
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(origen).toHaveFocus();
  });

  it('sin acción el pie dice «Cerrar»; con acción, «Cancelar»', async () => {
    const u = userEvent.setup();
    const { rerender } = render(<Anfitrion />);
    await abrir(u);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();

    rerender(<Anfitrion conAccion />);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('CANCELAR va antes que la acción: invertirlo hace que se pulse el que no era', async () => {
    const u = userEvent.setup();
    render(<Anfitrion conAccion />);
    await abrir(u);
    const pie = document.querySelector('.dialogo-pie')!;
    const botones = [...pie.querySelectorAll('button')].map((b) => b.textContent);
    expect(botones).toEqual(['Cancelar', 'Guardar']);
  });

  it('la acción se ejecuta y el diálogo no se cierra solo: lo decide el proyecto', async () => {
    const u = userEvent.setup();
    const guardar = vi.fn();
    render(<Anfitrion conAccion onAccion={guardar} />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(guardar).toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('pulsar DENTRO no cierra: el clic no sube al fondo', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    await u.click(screen.getByText('Contenido del diálogo'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
