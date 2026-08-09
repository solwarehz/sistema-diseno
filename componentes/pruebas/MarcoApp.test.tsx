/**
 * MARCO DE APLICACIÓN
 *
 * Se prueba el COMPORTAMIENTO, que es lo que cada proyecto reconstruía mirando:
 * el plegado, los grupos, la opción activa anunciada y el menú de usuario.
 *
 * La opción activa tiene prueba propia porque es la que más se hace a medias:
 * se pinta el sombreado y se olvida el `aria-current`, y entonces quien usa
 * lector de pantalla no sabe en qué página está.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MarcoApp, type GrupoNav } from '../src/MarcoApp';

const NAV: GrupoNav[] = [
  { clave: 'inicio', texto: 'Inicio', href: '/' },
  {
    clave: 'academico',
    texto: 'Académico',
    hijos: [
      { clave: 'matricula', texto: 'Matrícula', href: '/matricula' },
      { clave: 'notas', texto: 'Notas', href: '/notas' },
    ],
  },
];

const USUARIO = {
  id: 'u-1',
  nombre: 'PINEDA, José Isidro',
  correo: 'jose.pineda@ae.edu.pe',
  onSalir: () => {},
};

function montar(extra: Partial<React.ComponentProps<typeof MarcoApp>> = {}) {
  return render(
    <MarcoApp titulo="Colegio Albert Einstein" hrefInicio="/" navegacion={NAV} usuario={USUARIO} {...extra}>
      <p>Contenido</p>
    </MarcoApp>
  );
}

describe('Marco de aplicación', () => {
  it('la opción activa se ANUNCIA, no solo se pinta', () => {
    montar({ activa: 'notas' });
    const notas = screen.getByRole('link', { name: 'Notas' });
    expect(notas).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Matrícula' })).not.toHaveAttribute('aria-current');
  });

  it('los grupos arrancan abiertos: un menú cerrado esconde la navegación', () => {
    montar();
    expect(screen.getByRole('button', { name: /Académico/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Notas' })).toBeVisible();
  });

  it('plegar un grupo lo dice en aria-expanded y oculta sus hijos', async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole('button', { name: /Académico/ }));
    expect(screen.getByRole('button', { name: /Académico/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: 'Notas', hidden: true })).not.toBeVisible();
  });

  it('el botón de plegar dice si el panel está desplegado', async () => {
    const u = userEvent.setup();
    montar();
    const b = screen.getByRole('button', { name: 'Plegar menú' });
    expect(b).toHaveAttribute('aria-expanded', 'true');
    await u.click(b);
    expect(screen.getByRole('button', { name: 'Desplegar menú' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('navegar avisa al proyecto con la clave, sin recargar', async () => {
    const u = userEvent.setup();
    const ir = vi.fn();
    montar({ onNavegar: ir });
    await u.click(screen.getByRole('link', { name: 'Matrícula' }));
    expect(ir).toHaveBeenCalledWith('matricula', '/matricula');
  });

  it('la marca lleva al inicio desde cualquier pantalla', () => {
    montar();
    expect(screen.getByRole('link', { name: /ir al inicio/ })).toHaveAttribute('href', '/');
  });
});

describe('Menú de usuario', () => {
  it('arranca cerrado y se abre al pulsar el avatar', async () => {
    const u = userEvent.setup();
    montar();
    const avatar = screen.getByRole('button', { name: /Menú de PINEDA/ });
    expect(avatar).toHaveAttribute('aria-expanded', 'false');
    await u.click(avatar);
    expect(avatar).toHaveAttribute('aria-expanded', 'true');
  });

  it('Escape lo cierra y DEVUELVE el foco al avatar', async () => {
    const u = userEvent.setup();
    montar();
    const avatar = screen.getByRole('button', { name: /Menú de PINEDA/ });
    await u.click(avatar);
    await u.keyboard('{Escape}');
    expect(avatar).toHaveAttribute('aria-expanded', 'false');
    expect(avatar).toHaveFocus();
  });

  it('«Salir» siempre está, y es la ÚLTIMA opción', async () => {
    const u = userEvent.setup();
    const salir = vi.fn();
    montar({
      usuario: { ...USUARIO, onSalir: salir },
      opcionesUsuario: <button className="us-op" role="menuitem">Mi perfil</button>,
    });
    await u.click(screen.getByRole('button', { name: /Menú de PINEDA/ }));
    const menu = screen.getByRole('menu');
    const opciones = within(menu).getAllByRole('menuitem');
    expect(opciones[opciones.length - 1]).toHaveTextContent('Salir del sistema');
    await u.click(screen.getByRole('menuitem', { name: /Salir/ }));
    expect(salir).toHaveBeenCalled();
  });

  it('SIN tema no se pinta el selector: el modo oscuro no está aprobado', async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole('button', { name: /Menú de PINEDA/ }));
    expect(screen.queryByRole('group', { name: 'Modo de color' })).toBeNull();
  });

  it('CON tema, el selector dice cuál está puesto y avisa al cambiar', async () => {
    const u = userEvent.setup();
    const cambiar = vi.fn();
    montar({ usuario: { ...USUARIO, tema: 'claro', onTema: cambiar } });
    await u.click(screen.getByRole('button', { name: /Menú de PINEDA/ }));
    expect(screen.getByRole('button', { name: 'Modo claro' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Modo oscuro' })).toHaveAttribute('aria-pressed', 'false');
    await u.click(screen.getByRole('button', { name: 'Modo oscuro' }));
    expect(cambiar).toHaveBeenCalledWith('oscuro');
  });

  it('NO trae densidad, vista ni descarga: son del catálogo', async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole('button', { name: /Menú de PINEDA/ }));
    expect(screen.queryByRole('group', { name: /Densidad/ })).toBeNull();
    expect(screen.queryByRole('group', { name: /Vista/ })).toBeNull();
    expect(screen.queryByText(/Descargar el sistema/)).toBeNull();
  });
});
