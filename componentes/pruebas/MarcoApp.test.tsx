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

import { render, screen, within, fireEvent, act, waitFor } from '@testing-library/react';
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

/** Menú con los TRES niveles. Vive aquí porque lo usan dos secciones: sin
 *  nietos ni ramas en el árbol, media regla 8 se quedaba sin proteger. */
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
  it('[1] el marco ENVUELVE a la aplicación: lo que le pasas vive en su zona de contenido', () => {
    /* La regla 1 dice que el enrutador vive DENTRO del marco y que no se monta
       uno por página. Lo comprobable aquí es la mitad estructural: los hijos
       que el producto pasa salen dentro de la zona de contenido del marco, no
       colgando fuera. Montado por página, el plegado del lateral se olvida en
       cada navegación, y eso ya no es del componente. */
    const { container } = montar();
    const zona = container.querySelector('.app-main, .app-contenido, main');
    expect(zona, 'el marco no tiene zona de contenido').not.toBeNull();
    expect(zona!.textContent).toContain('Contenido');
  });

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

  /**
   * ESTA PRUEBA EXIGÍA EL DEFECTO. Decía «cierra al salir» y comprobaba que el
   * panel desaparecía en el mismo `mouseLeave`, que es exactamente lo que hacía
   * imposible usarlo: plegado, el cursor tiene que CRUZAR los 56px del carril
   * para llegar al panel, y por el camino ya no estaba. Lo reportó el
   * responsable probando a 900px — «se cierra rápido el menú que aparece»— y el
   * catálogo llevaba los 220ms de margen desde el principio.
   *
   * Una prueba que fija el comportamiento equivocado no protege: lo blinda.
   */
  const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

  it('[5] plegado, el grupo abre al pasar el cursor y cierra CON MARGEN para llegar', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    const grupo = container.querySelector('.nav-grupo')!;

    fireEvent.mouseEnter(grupo);
    expect(grupo.classList.contains('abierto')).toBe(true);

    fireEvent.mouseLeave(grupo);
    // LO QUE FALLABA: aquí mismo ya estaba cerrado, y por eso no se llegaba.
    expect(grupo.classList.contains('abierto')).toBe(true);
    await esperar(100);
    expect(grupo.classList.contains('abierto')).toBe(true);

    await waitFor(() => expect(grupo.classList.contains('abierto')).toBe(false));
  });

  it('[5] volver a entrar dentro del margen CANCELA el cierre: es lo que deja cambiar de menú', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    const grupo = container.querySelector('.nav-grupo')!;

    fireEvent.mouseEnter(grupo);
    fireEvent.mouseLeave(grupo);
    await esperar(100);
    fireEvent.mouseEnter(grupo);      // el cursor cruzó el carril y llegó
    await esperar(400);               // muy por encima del margen
    expect(grupo.classList.contains('abierto')).toBe(true);
  });

  it('[5] con teclado también abre: sin ratón el panel era inalcanzable', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    const grupo = container.querySelector('.nav-grupo')!;
    expect(grupo.classList.contains('abierto')).toBe(false);

    fireEvent.focus(grupo.querySelector('.nav-grupo-tit')!);
    expect(grupo.classList.contains('abierto')).toBe(true);
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

  it('[9] desplegado NO hay hover: los grupos se gobiernan con el clic', async () => {
    /* La primera versión de esta prueba solo disparaba `mouseLeave` y miraba
       que nada cambiara — y el cierre es DIFERIDO 220 ms, así que pasaba
       aunque el manejador estuviera puesto. No protegía nada. Ahora se cierra
       el grupo con el clic, se ENTRA con el cursor, y se comprueba que sigue
       cerrado: eso sí solo puede pasar si `onMouseEnter` está apagado. */
    const u = userEvent.setup();
    const { container } = montar({ activa: 'inicio' });
    const grupo = container.querySelector('.nav-grupo')!;
    await u.click(grupo.querySelector('.nav-grupo-tit')!);
    expect(grupo.classList.contains('abierto'), 'el clic no cerró el grupo').toBe(false);
    fireEvent.mouseEnter(grupo);
    expect(grupo.classList.contains('abierto'), 'el cursor abrió un grupo con el menú desplegado').toBe(false);
  });

  it('[9] pero PLEGADO sí abre al pasar el cursor: ahí el rótulo no se ve', () => {
    const { container } = montar({ plegado: true, activa: 'inicio' });
    const grupo = container.querySelector('.nav-grupo')!;
    expect(grupo.classList.contains('abierto')).toBe(false);
    fireEvent.mouseEnter(grupo);
    expect(grupo.classList.contains('abierto'), 'plegado el cursor tiene que abrir el panel').toBe(true);
  });
});

describe('[8] el carril plegado no es una fila de iconos mudos', () => {
  /* Plegado, `.nav-txt` no se ve y el `<svg>` va `aria-hidden`: sin rótulo, una
     opción sin hijos se queda sin nombre de ninguna clase —y tampoco abre panel
     flotante—. El catálogo lo rotulaba con `title` desde siempre y el
     componente NO EMITÍA NINGUNO. Lo midió el responsable pasando el ratón. */

  it('[8] cada opción lleva `title` con su texto, que es el globito del ratón', () => {
    /* Con `TRES_NIVELES` y no con el `NAV` de siempre: sin nietos ni ramas en
       el árbol, quitarle el `title` a `.nav-rama-tit` o a `.nav-nieto` dejaba
       la prueba EN VERDE — dos de las cinco piezas sin proteger. */
    const { container } = montar({ navegacion: TRES_NIVELES, activa: 'notas' });
    const sinTitle = [...container.querySelectorAll('.nav-item, .nav-hijo, .nav-nieto')]
      .filter((a) => a.getAttribute('title') === null)
      .map((a) => a.textContent?.trim());
    expect(sinTitle, 'hay opciones de navegación sin rótulo para el ratón').toEqual([]);
  });

  it('[8] y el `title` dice lo mismo que el rótulo, no otra cosa', () => {
    const { container } = montar();
    for (const a of container.querySelectorAll('.nav-item, .nav-hijo')) {
      expect(a.getAttribute('title')).toBe(a.querySelector('.nav-txt')!.textContent);
    }
  });

  it('[8] el rótulo sigue EN EL MARCADO estando plegado, no se desmonta', () => {
    /* LO QUE ESTA PRUEBA **NO** COMPRUEBA, y su primera versión decía que sí:
       que el rótulo llegue al árbol de accesibilidad. Aquí no hay hoja de
       estilos —`preparar.ts` no carga ninguna—, así que jsdom nunca vería un
       `display:none` viniera de donde viniera, y además el nombre caería al
       `title`: era verde con el rótulo y sin él. Lo cazó una auditoría el
       2026-09-14.
       Esa mitad de la regla 8 la protege `CARRIL-CON-NOMBRE` en
       `verificar-cascada`, que resuelve la hoja QUE VIAJA. Lo que sí se
       comprueba aquí es lo otro: que plegado el rótulo siga EN EL MARCADO, que
       es la condición para que la hoja pueda esconderlo sin borrarlo. */
    const { container } = montar({ plegado: true, activa: 'inicio' });
    const rotulos = [...container.querySelectorAll('.nav-item .nav-txt')].map((e) => e.textContent);
    expect(rotulos, 'plegado se desmontan los rótulos: la hoja ya no puede salvarlos').toContain('Inicio');
  });

  it('[10] los hijos de un grupo cerrado llevan `hidden`', () => {
    // `.nav-hijos` declara `display: grid`, que gana a la regla `[hidden]` del
    // navegador: sin `.nav-hijos[hidden]` en la hoja, el atributo no ocultaba.
    /* Desplegado los grupos nacen ABIERTOS (R48); plegado nacen cerrados,
       porque un grupo abierto plegado es un panel flotante encima del
       contenido. Así que el grupo cerrado que hay que mirar está aquí. */
    const { container } = montar({ plegado: true, activa: 'inicio' });
    const cerrado = [...container.querySelectorAll('.nav-grupo')]
      .find((g) => !g.classList.contains('abierto'));
    expect(cerrado, 'no hay ningún grupo cerrado que mirar').not.toBeUndefined();
    expect(cerrado!.querySelector('.nav-hijos')!.hasAttribute('hidden')).toBe(true);
  });

  it('[10] y el TERCER nivel se cierra igual, no de otra forma', () => {
    /* `.nav-nietos[hidden]` viaja en la hoja de todos los productos: si el
       componente no lo emite, es una regla que nadie puede activar —la
       categoría de `.sel-caja.abierta`— y además el tercer nivel se cerraría
       de otra manera que el segundo. Lo cazó una auditoría el 2026-09-14. */
    const { container } = montar({ navegacion: TRES_NIVELES });
    const rama = container.querySelector('.nav-rama')!;
    expect(rama.classList.contains('abierta'), 'la rama arranca abierta').toBe(false);
    expect(rama.querySelector('.nav-nietos')!.hasAttribute('hidden')).toBe(true);
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

/**
 * R48 · LO QUE SE PIDE NO ES LO QUE QUEDA.
 *
 * Reportado por el responsable a 900px, con el marco ya en el carril:
 *
 *   «al dar clic el menú sigue comprimido pero se ven las opciones de
 *    extendido»
 *
 * El clic re-sincronizaba los grupos con el valor PEDIDO. Controlado (R21) el
 * que manda es el producto: si no devuelve el nuevo valor, la barra se queda
 * plegada — y los grupos se abrían igual. Plegado, un grupo abierto ES un panel
 * flotante, así que el clic dejaba los cuatro paneles encima del contenido con
 * la barra todavía a 56px. Medido en el navegador con la hoja que viaja:
 * `.lat.colapsado` de 56px y cuatro `.nav-hijos` visibles a la vez.
 */
describe('R48 · los grupos siguen al plegado que QUEDA, no al que se pide', () => {
  it('controlado y no honrado: el clic no deja los flotantes sueltos', async () => {
    const u = userEvent.setup();
    // El producto manda `plegado` y no devuelve el cambio: ni por descuido —lo
    // pasa sin `onPlegar`— ni por lentitud, que es lo que pasa cuando la
    // preferencia se guarda en el perfil y el guardado tarda o falla.
    const { container } = montar({ plegado: true });
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(0);

    await u.click(screen.getByRole('button', { name: 'Desplegar menú' }));

    // Sigue plegado, porque el producto no lo desplegó: eso es lo correcto.
    expect(container.querySelector('.lat.colapsado')).not.toBeNull();
    // Y LO QUE FALLABA: los grupos se abrían de todas formas. Plegado, cada uno
    // es un panel flotante, así que salían todos a la vez.
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(0);
  });

  it('controlado y honrado: los grupos se re-sincronizan al llegar el cambio', () => {
    const { container, rerender } = render(
      <MarcoApp titulo="AE" hrefInicio="/" navegacion={NAV} usuario={USUARIO} plegado>
        <p>Contenido</p>
      </MarcoApp>
    );
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(0);

    // El producto devuelve el valor nuevo. Aquí sí abre, y abre por el cambio
    // EFECTIVO — así funciona igual si el pliegue no vino del botón, como al
    // restaurar la preferencia del perfil al abrir sesión.
    rerender(
      <MarcoApp titulo="AE" hrefInicio="/" navegacion={NAV} usuario={USUARIO} plegado={false}>
        <p>Contenido</p>
      </MarcoApp>
    );
    expect(container.querySelectorAll('.nav-grupo.abierto').length).toBeGreaterThan(0);
  });

  it('sin control de fuera nada cambia: pedir ES aplicar', async () => {
    const u = userEvent.setup();
    const { container } = montar();
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    expect(container.querySelector('.lat.colapsado')).not.toBeNull();
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(0);
    await u.click(screen.getByRole('button', { name: 'Desplegar menú' }));
    expect(container.querySelector('.lat.colapsado')).toBeNull();
    expect(container.querySelectorAll('.nav-grupo.abierto').length).toBeGreaterThan(0);
  });
});

describe('R42a · el tercer nivel del menú por fin se emite', () => {
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
