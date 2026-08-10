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

  // Lo reporto Control Administrativos V2.0: sin la clase `app` no hay
  // `display: flex`, la lateral ocupa todo el ancho y el contenido cae bajo el
  // pliegue. Se prueba la CLASE y no el diseno porque jsdom no calcula diseno,
  // y decirlo importa: esto fija el olvido, no la maquetacion.
  it('el cascaron lleva las DOS clases: sin `app` el contenido cae fuera', () => {
    const { container } = montar();
    const raiz = container.firstElementChild!;
    expect(raiz).toHaveClass('app');
    expect(raiz).toHaveClass('app-cascaron');
  });

  it('la marca lleva al inicio desde cualquier pantalla', () => {
    montar();
    expect(screen.getByRole('link', { name: /ir al inicio/ })).toHaveAttribute('href', '/');
  });
});

describe('Marco en vista de app', () => {
  const CINCO_Y_PICO = Array.from({ length: 7 }, (_, i) => ({
    clave: `s${i}`, texto: `Sección ${i}`, href: `/s${i}`,
  }));

  it('en app NO hay lateral ni botón de plegar: dos navegaciones compitiendo', () => {
    montar({ vista: 'app' });
    expect(screen.queryByRole('button', { name: /plegar menú/i })).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument();
  });

  it('las pestañas anuncian en cuál estás', () => {
    montar({ vista: 'app', activa: 'inicio' });
    const tabs = screen.getByRole('navigation', { name: 'Secciones' });
    expect(within(tabs).getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });

  it('CINCO pestañas como máximo: el resto entra en «Más»', () => {
    montar({ vista: 'app', navegacion: CINCO_Y_PICO });
    const tabs = screen.getByRole('navigation', { name: 'Secciones' });
    // Cuatro secciones + «Más» = cinco elementos pulsables.
    expect(within(tabs).getAllByRole('link')).toHaveLength(4);
    expect(within(tabs).getByRole('button', { name: /Más/ })).toBeInTheDocument();
  });

  it('con cinco o menos NO aparece «Más»', () => {
    montar({ vista: 'app', navegacion: CINCO_Y_PICO.slice(0, 5) });
    const tabs = screen.getByRole('navigation', { name: 'Secciones' });
    expect(within(tabs).getAllByRole('link')).toHaveLength(5);
    expect(within(tabs).queryByRole('button', { name: /Más/ })).toBeNull();
  });

  it('en vista web NO hay pestañas', () => {
    montar();
    expect(screen.queryByRole('navigation', { name: 'Secciones' })).toBeNull();
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

  // El modo oscuro se aprobó el 2026-08-09. Esta prueba NO se borra: lo que
  // fija ya no es la aprobación, es que la preferencia la gobierna el producto.
  // Sin `tema`, el sistema no tiene dónde guardarla y no la finge.
  it('SIN tema no se pinta el selector: la preferencia es del producto', async () => {
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

/**
 * LOS OCHO DE CONTROL ADMINISTRATIVOS V2.0, del lote sobre la v1.15.0.
 * Cada prueba lleva el número del requerimiento que fija.
 */
describe('Marco — requerimientos R16 a R23', () => {
  it('R16 · el grupo abierto lleva la clase `abierto`, que es la que la hoja espera', () => {
    const { container } = montar();
    const grupo = container.querySelector('.nav-grupo')!;
    expect(grupo).toHaveClass('abierto');
  });

  it('R16 · al plegarlo, la clase se va', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    await u.click(screen.getByRole('button', { name: /Académico/ }));
    expect(container.querySelector('.nav-grupo')).not.toHaveClass('abierto');
  });

  it('R17 · las opciones hijas admiten icono', () => {
    const { container } = montar({
      navegacion: [{
        clave: 'a', texto: 'Académico',
        hijos: [{ clave: 'm', texto: 'Matrícula', href: '/m', icono: <i data-testid="ic-hijo" /> }],
      }],
    });
    expect(screen.getByTestId('ic-hijo')).toBeInTheDocument();
    expect(container.querySelector('.nav-hijo .nav-ic')).toBeTruthy();
  });

  it('R18 · el grupo marcado `alPie` se va al fondo, sea cual sea su orden', () => {
    const { container } = montar({
      navegacion: [
        { clave: 'cfg', texto: 'Configuración', href: '/cfg', alPie: true },
        { clave: 'ini', texto: 'Inicio', href: '/' },
      ],
    });
    const items = [...container.querySelectorAll('.lat-nav > *')];
    expect(items[items.length - 1]).toHaveClass('nav-al-pie');
  });

  it('R21 · sin `plegado` el marco se gobierna solo', async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    expect(screen.getByRole('button', { name: 'Desplegar menú' })).toBeInTheDocument();
  });

  it('R21 · con `plegado` manda el producto, y se le avisa del cambio', async () => {
    const u = userEvent.setup();
    const avisar = vi.fn();
    montar({ plegado: false, onPlegar: avisar });
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    expect(avisar).toHaveBeenCalledWith(true);
    // Controlado: no cambia por su cuenta. Lo decide quien manda el valor.
    expect(screen.getByRole('button', { name: 'Plegar menú' })).toBeInTheDocument();
  });
});
