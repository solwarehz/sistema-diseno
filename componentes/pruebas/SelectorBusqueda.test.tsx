/**
 * R103 · SELECTOR CON BÚSQUEDA — vaciar, etiqueta oculta y «crear».
 *
 * Los tres huecos que reportó Control Administrativos V2.0. El primero no era
 * una falta, era una MENTIRA: la firma decía `(valor: string | null) => void` y
 * el componente **nunca** emitía `null`, porque `onCambio` solo salía de
 * `elegir()`. Un tipo que documenta un camino que no existe bloquea el
 * componente en cualquier campo opcional.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SelectorBusqueda } from '../src/SelectorBusqueda';

const OPCIONES = [
  { valor: 'anc', texto: 'Áncash' },
  { valor: 'lim', texto: 'Lima' },
  { valor: 'cus', texto: 'Cusco' },
];

const pintar = (props: Partial<React.ComponentProps<typeof SelectorBusqueda>> = {}) =>
  render(
    <SelectorBusqueda
      etiqueta="Departamento"
      opciones={OPCIONES}
      valor={null}
      onCambio={() => {}}
      {...props}
    />,
  );

const abrir = async (u: ReturnType<typeof userEvent.setup>) =>
  u.click(screen.getByRole('combobox'));

describe('R103 · se puede volver a «sin elegir»', () => {
  it('R103 · sin `vacio` NO se ofrece vaciar: lo de producción no cambia', async () => {
    const u = userEvent.setup();
    pintar({ valor: 'lim' });
    await abrir(u);
    // Las tres opciones y nada más. Ningún mando de vaciar aparecido solo.
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('R103 · con `vacio` la lista ofrece el mando, y elegirlo emite null', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    pintar({ valor: 'lim', vacio: 'Todos los departamentos', onCambio });
    await abrir(u);

    const mando = screen.getByRole('option', { name: 'Todos los departamentos' });
    expect(mando).toBeInTheDocument();
    await u.click(mando);

    // ESTO es lo que el componente no sabía hacer.
    expect(onCambio).toHaveBeenCalledTimes(1);
    expect(onCambio).toHaveBeenCalledWith(null);
  });

  it('R103 · el mando de vaciar va PRIMERO y se alcanza con las flechas', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    pintar({ valor: 'lim', vacio: 'Todos', onCambio });
    await abrir(u);

    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Todos');
    // Abrir deja el activo en 0, que ES el mando: Enter lo elige.
    await u.keyboard('{Enter}');
    expect(onCambio).toHaveBeenCalledWith(null);
  });

  it('R103 · no se ofrece vaciar lo que no está elegido', async () => {
    const u = userEvent.setup();
    pintar({ valor: null, vacio: 'Todos' });
    await abrir(u);
    expect(screen.queryByRole('option', { name: 'Todos' })).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('R103 · al escribir, el mando se retira: es un mando, no un resultado', async () => {
    const u = userEvent.setup();
    pintar({ valor: 'lim', vacio: 'Todos' });
    await abrir(u);
    await u.keyboard('cus');
    expect(screen.queryByRole('option', { name: 'Todos' })).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('R103 · Retroceso sobre el campo vacío vacía la elección', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    pintar({ valor: 'lim', vacio: 'Todos', onCambio });
    await abrir(u);
    await u.keyboard('{Backspace}');
    expect(onCambio).toHaveBeenCalledWith(null);
  });

  it('R103 · sin `vacio`, Retroceso NO vacía: el permiso es el mismo', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    pintar({ valor: 'lim', onCambio });
    await abrir(u);
    await u.keyboard('{Backspace}');
    expect(onCambio).not.toHaveBeenCalled();
  });
});

describe('R103 · etiquetaOculta — el hueco 16', () => {
  it('R103 · oculta la etiqueta A LA VISTA y la conserva para el lector', () => {
    const { container } = pintar({ etiquetaOculta: true });
    const rotulo = container.querySelector('label.campo-etiqueta')!;
    expect(rotulo.textContent).toBe('Departamento');
    expect(rotulo.className).toContain('sr-solo');
    // Sigue nombrando al control: ocultarla no es quitarla.
    expect(screen.getByRole('combobox', { name: 'Departamento' })).toBeInTheDocument();
  });

  it('R103 · por omisión la etiqueta se ve, como en Campo y Selector', () => {
    const { container } = pintar();
    expect(container.querySelector('label.campo-etiqueta')!.className).not.toContain('sr-solo');
  });
});

describe('R103 · crear lo que no existe, sin salir del selector', () => {
  it('R103 · sin `onCrear`, la fila de «no hay» sigue siendo un cartel', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await abrir(u);
    await u.keyboard('zzz');
    // R115 · lo que fija esta prueba es que la fila sea un CARTEL y no una
    // opción pulsable. El texto exacto dejó de estar aquí a propósito: desde
    // R115 el vacío por omisión nombra lo que se buscó, y quien lo fija es la
    // prueba R16 de `selector-busqueda-promesa`. Repetir la cadena en dos
    // sitios convierte un cambio de copia en dos pruebas rojas sin motivo.
    expect(container.querySelector('.sel-vacio')).not.toBeNull();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('R103 · con `onCrear` la fila es pulsable y recibe LO TECLEADO', async () => {
    const onCrear = vi.fn();
    const u = userEvent.setup();
    pintar({ onCrear });
    await abrir(u);
    await u.keyboard('Huaraz');

    const fila = screen.getByRole('option', { name: 'Crear «Huaraz»' });
    await u.click(fila);
    expect(onCrear).toHaveBeenCalledWith('Huaraz');
  });

  it('R103 · y también con Enter, que ahí no tenía nada que elegir', async () => {
    const onCrear = vi.fn();
    const u = userEvent.setup();
    pintar({ onCrear });
    await abrir(u);
    await u.keyboard('Huaraz{Enter}');
    expect(onCrear).toHaveBeenCalledWith('Huaraz');
  });

  it('R103 · crear NO elige ni limpia: el alta es del producto y puede cancelarse', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    pintar({ onCrear: () => {}, onCambio });
    await abrir(u);
    await u.keyboard('Huaraz{Enter}');
    expect(onCambio).not.toHaveBeenCalled();
  });

  it('R103 · con coincidencias no se ofrece crear: existe, se elige', async () => {
    const u = userEvent.setup();
    pintar({ onCrear: () => {} });
    await abrir(u);
    await u.keyboard('Lima');
    expect(screen.queryByRole('option', { name: /Crear/ })).toBeNull();
    expect(screen.getByRole('option', { name: 'Lima' })).toBeInTheDocument();
  });
});

describe('R103 · lo que ya hacía sigue igual', () => {
  it('R103 · elegir una opción sigue emitiendo su valor', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    pintar({ onCambio, vacio: 'Todos' });
    await abrir(u);
    await u.click(screen.getByRole('option', { name: 'Cusco' }));
    expect(onCambio).toHaveBeenCalledWith('cus');
  });

  it('R103 · la búsqueda sigue ignorando tildes', async () => {
    const u = userEvent.setup();
    pintar();
    await abrir(u);
    await u.keyboard('ancash');
    expect(screen.getByRole('option', { name: 'Áncash' })).toBeInTheDocument();
  });

  it('R103 · con la lista cerrada se sigue viendo lo ELEGIDO, no lo tecleado', () => {
    pintar({ valor: 'lim' });
    expect(screen.getByRole('combobox')).toHaveValue('Lima');
  });
});
