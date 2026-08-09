/**
 * Las tres reglas que el catálogo incumplía, probadas. La del foco es la que
 * fallaba en las tres salidas: confirmar, cancelar y Escape.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useRef, useState } from 'react';
import { Confirmacion } from '../src/Confirmacion';

/** Un consumidor realista: un botón que abre la banda y la desmonta al cerrar. */
function Anfitrion({
  onConfirmar = () => {},
  onCancelar = () => {},
  focoInicial,
}: { onConfirmar?: () => void; onCancelar?: () => void; focoInicial?: 'accion' | 'cancelar' }) {
  const origen = useRef<HTMLButtonElement>(null);
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button ref={origen} onClick={() => setAbierta(true)}>Eliminar</button>
      <Confirmacion
        abierta={abierta}
        titulo="Eliminar a Rosa Quispe"
        detalle="No se puede deshacer."
        accion="Sí, eliminar"
        origen={origen}
        focoInicial={focoInicial}
        onConfirmar={() => { setAbierta(false); onConfirmar(); }}
        onCancelar={() => { setAbierta(false); onCancelar(); }}
      />
    </>
  );
}

const abrir = async (u: ReturnType<typeof userEvent.setup>) => {
  await u.click(screen.getByRole('button', { name: 'Eliminar' }));
};

describe('Confirmación en línea', () => {
  // El foco entra en la banda Y en la opción SEGURA. Lo segundo importa más:
  // con el foco en la acción, el Enter que acababa de pulsarse para llegar
  // aquí ejecuta lo irreversible. Lo reportó Control Administrativos V2.0.
  it('el foco entra en la banda, y en CANCELAR, no en la acción', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Sí, eliminar' })).not.toHaveFocus();
  });

  it('un Enter nada más abrir NO ejecuta la acción destructiva', async () => {
    const u = userEvent.setup();
    const confirmar = vi.fn();
    render(<Anfitrion onConfirmar={confirmar} />);
    await abrir(u);
    await u.keyboard('{Enter}');
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('con focoInicial="accion" sí arranca en la acción', async () => {
    const u = userEvent.setup();
    render(<Anfitrion focoInicial="accion" />);
    await abrir(u);
    expect(screen.getByRole('button', { name: 'Sí, eliminar' })).toHaveFocus();
  });

  it('al CONFIRMAR el foco vuelve al origen, no a <body>', async () => {
    const u = userEvent.setup();
    const fn = vi.fn();
    render(<Anfitrion onConfirmar={fn} />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(fn).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveFocus();
  });

  it('al CANCELAR el foco vuelve al origen', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveFocus();
  });

  it('con ESCAPE cancela y el foco vuelve al origen', async () => {
    const u = userEvent.setup();
    const fn = vi.fn();
    render(<Anfitrion onCancelar={fn} />);
    await abrir(u);
    await u.keyboard('{Escape}');
    expect(fn).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveFocus();
  });

  it('la region tiene nombre accesible y es assertive desde el marcado', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    const region = screen.getByRole('region', { name: 'Eliminar a Rosa Quispe' });
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('no es un dialogo modal: no existe role=dialog ni atrapa el foco', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Se puede tabular fuera de la banda sin quedarse atrapado.
    await u.tab();
    expect(screen.getByRole('button', { name: 'Sí, eliminar' })).not.toHaveFocus();
  });

  it('el boton nombra la ACCION, no dice «Aceptar»', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    expect(screen.queryByRole('button', { name: /^Aceptar$/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sí, eliminar' })).toBeInTheDocument();
  });
});
