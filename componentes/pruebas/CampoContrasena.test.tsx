/**
 * R6 · el Campo recorta al salir. R7 · la contraseña jamás se normaliza.
 * Las dos reglas nacieron juntas y se prueban juntas: la segunda existe
 * PORQUE existe la primera.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { Campo } from '../src/Campo';
import { CampoContrasena } from '../src/CampoContrasena';

function CampoControlado({ alCambiar }: { alCambiar?: (v: string) => void }) {
  const [v, setV] = useState('');
  return (
    <>
      <Campo etiqueta="Sede" value={v} onChange={(e) => { setV(e.target.value); alCambiar?.(e.target.value); }} />
      <button>Otro sitio</button>
    </>
  );
}

describe('R6 · el Campo recorta al salir, nunca al teclear', () => {
  it('mientras se escribe no se toca nada; al salir, los extremos se van y onChange se entera', async () => {
    const u = userEvent.setup();
    const alCambiar = vi.fn();
    render(<CampoControlado alCambiar={alCambiar} />);
    const caja = screen.getByRole('textbox', { name: 'Sede' });
    await u.type(caja, '  Huaraz  ');
    // Tecleando: intacto, espacios incluidos.
    expect(caja).toHaveValue('  Huaraz  ');
    await u.tab();
    expect(caja).toHaveValue('Huaraz');
    expect(alCambiar).toHaveBeenLastCalledWith('Huaraz');
  });

  it('los espacios INTERNOS son contenido y se quedan', async () => {
    const u = userEvent.setup();
    render(<CampoControlado />);
    const caja = screen.getByRole('textbox', { name: 'Sede' });
    await u.type(caja, ' Huaraz  Centro ');
    await u.tab();
    expect(caja).toHaveValue('Huaraz  Centro');
  });
});

function ContrasenaControlada() {
  const [v, setV] = useState('');
  return (
    <>
      <CampoContrasena etiqueta="Contraseña" value={v} onChange={(e) => setV(e.target.value)} />
      <button>Otro sitio</button>
    </>
  );
}

describe('R7 · la contraseña jamás se normaliza', () => {
  it('los espacios se quedan EXACTOS, también al salir del campo', async () => {
    const u = userEvent.setup();
    render(<ContrasenaControlada />);
    const caja = screen.getByLabelText('Contraseña');
    await u.type(caja, '  clave con espacios  ');
    await u.tab();
    expect(caja).toHaveValue('  clave con espacios  ');
  });

  it('el conmutador muestra y oculta SIN tocar el valor, y lo dice con aria-pressed', async () => {
    const u = userEvent.setup();
    render(<ContrasenaControlada />);
    const caja = screen.getByLabelText('Contraseña') as HTMLInputElement;
    await u.type(caja, ' secreta ');
    const ver = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(ver).toHaveAttribute('aria-pressed', 'false');
    expect(caja.type).toBe('password');
    await u.click(ver);
    expect(caja.type).toBe('text');
    expect(caja).toHaveValue(' secreta ');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('el gestor de contraseñas tiene su autoComplete: current, o new con `nueva`', () => {
    const { rerender } = render(
      <CampoContrasena etiqueta="Contraseña" value="" onChange={() => {}} />
    );
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
    rerender(<CampoContrasena etiqueta="Contraseña" value="" onChange={() => {}} nueva />);
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('el error llega por Campo: junto al campo y descrito', () => {
    render(<CampoContrasena etiqueta="Contraseña" value="" onChange={() => {}} error="No coincide." />);
    const caja = screen.getByLabelText('Contraseña');
    expect(caja).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('No coincide.')).toBeTruthy();
  });
});
