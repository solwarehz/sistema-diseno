/**
 * SOLO UNO ABIERTO A LA VEZ — el menú de usuario y los paneles de la barra
 *
 * Lo reportó el responsable sobre el cascarón: con el menú de usuario abierto,
 * pulsar la campana deja **los dos** encima del contenido, y el de usuario
 * queda en primer plano tapando lo que acabas de abrir.
 *
 * La prueba vive aquí y no en el archivo de cada componente porque lo que se
 * prueba **no es de ninguno de los dos**: es la relación entre ellos. Escrita
 * dentro de `MenuUsuario` no se habría escrito nunca, que es justo por lo que
 * el fallo llegó a producción.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MenuUsuario } from '../src/MenuUsuario';
import { PanelBarra } from '../src/PanelBarra';

const USUARIO = { id: 'u-1', nombre: 'PINEDA, José Isidro', correo: 'j@ae.edu.pe', onSalir: () => {} };

function barra() {
  return render(
    <div className="top">
      <PanelBarra icono="sobre" titulo="Mensajes" items={[{ id: 'm1', titulo: 'Uno', sinLeer: true }]} />
      <PanelBarra icono="campana" titulo="Notificaciones" items={[{ id: 'n1', titulo: 'Dos', sinLeer: true }]} />
      <MenuUsuario {...USUARIO} />
    </div>
  );
}

const avatar = () => screen.getByRole('button', { name: /Menú de PINEDA/ });
const campana = () => screen.getByRole('button', { name: /Notificaciones/ });
const sobre = () => screen.getByRole('button', { name: /Mensajes/ });

describe('Desplegables de la barra — solo uno abierto', () => {
  it('abrir la campana CIERRA el menú de usuario', async () => {
    const u = userEvent.setup();
    barra();
    await u.click(avatar());
    expect(avatar()).toHaveAttribute('aria-expanded', 'true');

    await u.click(campana());
    expect(campana()).toHaveAttribute('aria-expanded', 'true');
    expect(avatar()).toHaveAttribute('aria-expanded', 'false');
  });

  it('abrir el menú de usuario CIERRA la campana', async () => {
    const u = userEvent.setup();
    barra();
    await u.click(campana());
    await u.click(avatar());
    expect(avatar()).toHaveAttribute('aria-expanded', 'true');
    expect(campana()).toHaveAttribute('aria-expanded', 'false');
  });

  it('entre los dos paneles de la barra, tampoco se quedan los dos', async () => {
    const u = userEvent.setup();
    barra();
    await u.click(sobre());
    await u.click(campana());
    expect(sobre()).toHaveAttribute('aria-expanded', 'false');
  });

  it('nunca hay dos ventanas visibles a la vez, sea cual sea el orden', async () => {
    const u = userEvent.setup();
    const { container } = barra();
    const visibles = () => [...container.querySelectorAll('.us-menu')].filter((n) => !(n as HTMLElement).hidden).length;
    for (const b of [avatar, campana, sobre, avatar, sobre, campana]) {
      await u.click(b());
      expect(visibles()).toBeLessThanOrEqual(1);
    }
  });
});
