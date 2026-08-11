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

import { render, screen, within, fireEvent, act } from '@testing-library/react';
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

describe('Pie del lateral — R30', () => {
  it('la identidad de la sesión está a la vista sin abrir nada', () => {
    const { container } = montar();
    const pie = container.querySelector('.lat-usuario')!;
    expect(pie).not.toBeNull();
    // Nombre y correo en permanencia: el avatar de la barra los dice solo
    // tras un clic, y operar con la sesión equivocada se evita de un vistazo.
    expect(pie.textContent).toContain('PINEDA, José Isidro');
    expect(pie.textContent).toContain('jose.pineda@ae.edu.pe');
  });

  it('el círculo es EL MISMO Avatar de la barra: misma persona, mismo color', () => {
    const { container } = montar();
    const arriba = container.querySelector('.top-avatar .avatar')!;
    const abajo = container.querySelector('.lat-usuario .avatar')!;
    expect(abajo).not.toBeNull();
    // Mismas iniciales y misma clase de color (sale del id, no del nombre).
    expect(abajo.textContent).toBe(arriba.textContent);
    expect([...abajo.classList].find((c) => /^avatar-\d$/.test(c)))
      .toBe([...arriba.classList].find((c) => /^avatar-\d$/.test(c)));
  });

  it('en vista app no hay lateral y por tanto no hay pie', () => {
    const { container } = montar({ vista: 'app' });
    expect(container.querySelector('.lat-usuario')).toBeNull();
  });
});

describe('Plegado — el panel flotante', () => {
  it('plegar CIERRA todos los grupos: sin esto, cada uno era un flotante atascado', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    expect(container.querySelectorAll('.nav-grupo.abierto').length).toBeGreaterThan(0);
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(0);
  });

  it('plegado, el grupo abre al pasar el cursor y cierra al salir', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    const grupo = container.querySelector('.nav-grupo')!;
    fireEvent.mouseEnter(grupo);
    expect(grupo.classList.contains('abierto')).toBe(true);
    fireEvent.mouseLeave(grupo);
    expect(grupo.classList.contains('abierto')).toBe(false);
  });

  it('el flotante dice DE QUÉ grupo es: lleva su título', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    const grupo = container.querySelector('.nav-grupo')!;
    fireEvent.mouseEnter(grupo);
    const titulo = grupo.querySelector('.nav-hijos .nav-flot-tit')!;
    expect(titulo).not.toBeNull();
    expect(titulo.textContent).toBe('Académico');
  });

  it('desplegado NO hay hover: los grupos se gobiernan con el clic', () => {
    const { container } = montar();
    const grupo = [...container.querySelectorAll('.nav-grupo')].find((g) =>
      !g.classList.contains('abierto')) ?? container.querySelector('.nav-grupo')!;
    const antes = grupo.classList.contains('abierto');
    fireEvent.mouseLeave(grupo);
    expect(grupo.classList.contains('abierto')).toBe(antes);
  });
});

describe('R37 · las opciones propias cierran el menú al elegirse', () => {
  it('un menuitem del producto cierra; conmutar el tema no', async () => {
    const u = userEvent.setup();
    const { container } = montar({
      opcionesUsuario: <button role="menuitem">Mi cuenta</button>,
      usuario: { ...USUARIO, tema: 'claro', onTema: () => {} },
    });
    await u.click(screen.getByRole('button', { name: /Menú de/ }));
    const menu = container.querySelector('.us-menu')!;
    expect(menu).not.toHaveAttribute('hidden');

    // El tema fija estado, no navega: el menú se queda para seguir eligiendo.
    await u.click(screen.getByRole('button', { name: 'Modo oscuro' }));
    expect(menu).not.toHaveAttribute('hidden');

    // La opción propia navega: se elige y el menú se va, como «Salir».
    await u.click(screen.getByRole('menuitem', { name: 'Mi cuenta' }));
    expect(menu).toHaveAttribute('hidden');
  });
});

describe('R39 · el cajón de pantalla estrecha tiene velo y salida', () => {
  function conBanda(matchesInicial: boolean) {
    let oyente: ((e: { matches: boolean }) => void) | null = null;
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: matchesInicial,
      media,
      addEventListener: (_: string, f: (e: { matches: boolean }) => void) => { oyente = f; },
      removeEventListener: () => {},
    }));
    return { cruzar: (m: boolean) => oyente?.({ matches: m }) };
  }

  it('el velo cierra el cajón al pulsarlo: la salida con el ratón', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    const velo = container.querySelector('.velo')!;
    // Desplegado, el velo está presente (la hoja lo pinta solo bajo 700px).
    expect(velo).not.toHaveAttribute('hidden');
    await u.click(velo);
    expect(container.querySelector('.lat')!.classList.contains('colapsado')).toBe(true);
    // Plegado, el velo se esconde: ya no hay nada que tapar.
    expect(velo).toHaveAttribute('hidden');
  });

  it('al cruzar a la banda del cajón, el marco se pliega SOLO', () => {
    const banda = conBanda(false);
    const { container } = montar();
    expect(container.querySelector('.lat.colapsado')).toBeNull();
    act(() => banda.cruzar(true));
    expect(container.querySelector('.lat.colapsado')).not.toBeNull();
  });

  it('montado ya en angosto, arranca plegado: un cajón abierto de inicio tapa', () => {
    conBanda(true);
    const { container } = montar();
    expect(container.querySelector('.lat.colapsado')).not.toBeNull();
  });

  it('el pliegue automático AVISA por onPlegar: el producto que persiste se entera', () => {
    const banda = conBanda(false);
    const onPlegar = vi.fn();
    montar({ onPlegar });
    act(() => banda.cruzar(true));
    expect(onPlegar).toHaveBeenCalledWith(true);
  });
});

describe('R38a · la banda del riel (≤900px) es estado, no CSS forzado', () => {
  it('al cruzar a tableta el marco se pliega DE VERDAD: aria y marca se enteran', () => {
    let oyente: ((e: { matches: boolean }) => void) | null = null;
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: false,
      media,
      addEventListener: (_: string, f: (e: { matches: boolean }) => void) => {
        if (media.includes('900')) oyente = f;
      },
      removeEventListener: () => {},
    }));
    const { container } = montar();
    expect(container.querySelector('.lat.colapsado')).toBeNull();
    act(() => oyente?.({ matches: true }));
    // Plegado real: la clase (el riel), el aria (la verdad) y MarcaMenu (el
    // logo compacto) salen del MISMO estado. Antes el CSS forzaba 56px y el
    // aria decia «desplegada» con el lockup estrujado.
    expect(container.querySelector('.lat.colapsado')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Desplegar menú' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('R42a · el tercer nivel del menú por fin se emite', () => {
  const TRES_NIVELES: GrupoNav[] = [
    {
      clave: 'config', texto: 'Configuración',
      hijos: [
        { clave: 'general', texto: 'General', href: '/general' },
        {
          clave: 'catalogos', texto: 'Catálogos',
          hijos: [
            { clave: 'sedes', texto: 'Sedes', href: '/catalogos/sedes' },
            { clave: 'cargos', texto: 'Cargos', href: '/catalogos/cargos' },
          ],
        },
      ],
    },
  ];

  it('una opción con hijos es una RAMA plegable, con el marcado que la hoja estiliza', async () => {
    const u = userEvent.setup();
    const { container } = montar({ navegacion: TRES_NIVELES });
    const rama = screen.getByRole('button', { name: 'Catálogos' });
    // Arranca cerrada: doce ítems seguidos no se leen.
    expect(rama).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.nav-rama.abierta')).toBeNull();
    await u.click(rama);
    expect(rama).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.nav-rama.abierta .nav-nietos .nav-nieto')).not.toBeNull();
  });

  it('el nieto navega y se anuncia con aria-current', async () => {
    const u = userEvent.setup();
    const ir = vi.fn();
    montar({ navegacion: TRES_NIVELES, activa: 'sedes', onNavegar: ir });
    // La rama que contiene a la activa arranca ABIERTA: llegar a una pantalla
    // y no ver dónde estás en el menú es peor que un clic de más.
    const sedes = screen.getByRole('link', { name: 'Sedes' });
    expect(sedes).toHaveAttribute('aria-current', 'page');
    await u.click(screen.getByRole('link', { name: 'Cargos' }));
    expect(ir).toHaveBeenCalledWith('cargos', '/catalogos/cargos');
  });
});
