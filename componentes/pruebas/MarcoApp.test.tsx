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
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  it('[6] el menú llega CORTO: solo el grupo de la pantalla en curso está abierto', () => {
    /* Hasta la v1.116.0 los grupos nacían TODOS abiertos: con cuatro grupos de
       cinco opciones, veinte renglones siempre a la vista y ninguno diciendo
       dónde estás. Lo pidió el responsable con el menú delante: «mostrar un
       menú corto y solo donde estoy ahora». */
    const { container } = montar({ activa: 'notas' });
    expect(screen.getByRole('button', { name: /Académico/ })).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelectorAll('.nav-grupo.abierto').length).toBe(1);
  });

  it('[6] y sin pantalla en curso dentro de un grupo, no hay ninguno abierto', () => {
    const { container } = montar({ activa: 'inicio' });
    expect(container.querySelectorAll('.nav-grupo.abierto').length).toBe(0);
  });

  it('[6] el grupo de la pantalla en curso lleva `.fijo`, que la hoja pinta con el acento', () => {
    /* `.nav-grupo.fijo` viajaba en la hoja de TODOS los productos desde hacía
       versiones y ningún producto podía activarla: deuda declarada en
       `verificar-promesa-muerta`. Se diseñó para esto. */
    const { container } = montar({ activa: 'notas' });
    const fijo = container.querySelector('.nav-grupo.fijo');
    expect(fijo, 'nadie puede fijar un grupo: `.fijo` sigue siendo promesa muerta').not.toBeNull();
    expect(fijo!.querySelector('.nav-txt')!.textContent).toBe('Académico');
  });

  it('[7] soltar CIERRA de verdad: el aria no puede decir «abierto» tras pulsar para cerrar', async () => {
    /* El título es a la vez el mando y un elemento ENFOCABLE, y enfocarlo revela
       el grupo. Con el ratón eso se deshace al salir; con TECLADO el foco se
       queda en el propio botón, así que el grupo no se cerraba jamás y
       `aria-expanded` respondía «true» justo después de pulsarlo para cerrar.
       La prueba anterior exigía `aria-expanded === 'false'` y `not.toBeVisible`;
       al reescribirla para el modelo nuevo se quedó mirando solo `.fijo` y dejó
       de cazarlo. Lo cazó una auditoría el 2026-09-15. */
    const u = userEvent.setup();
    const { container } = montar({ activa: 'notas' });
    const tit = screen.getByRole('button', { name: /Académico/ });
    await u.click(tit);
    expect(container.querySelector('.nav-grupo.fijo')).toBeNull();
    expect(tit, 'dice que está abierto justo después de cerrarlo').toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.nav-grupo')).not.toHaveClass('abierto');
    expect(container.querySelector('.nav-hijos')!.hasAttribute('hidden')).toBe(true);
  });

  it('[7] y con TECLADO igual: sin ratón que retirar, el grupo tiene que cerrarse', async () => {
    const u = userEvent.setup();
    const { container } = montar({ activa: 'notas' });
    const tit = screen.getByRole('button', { name: /Académico/ });
    tit.focus();
    await u.keyboard('{Enter}');
    expect(tit).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.nav-grupo')).not.toHaveClass('abierto');
  });

  it('[9] SIN RATÓN, enfocar un grupo revela sus opciones de segundo nivel', () => {
    /* El título decía «se llega a todas las pantallas» y solo mide esto: que
       el grupo se abre y que hay un `.nav-hijo`. El tercer nivel sigue detrás
       de un clic con el riel extendido, que es política declarada (R42a). Una
       auditoría señaló que el título prometía más de lo que la prueba mide. */
    /* Con el menú corto, un grupo que no se abra al enfocar deja sus opciones
       INALCANZABLES para quien navega con teclado. Ninguna prueba lo sujetaba:
       quitar el `onFocus` dejaba las 78 en verde y cuatro pantallas sin ruta. */
    const { container } = montar({ navegacion: TRES_NIVELES, activa: 'inicio' });
    const grupo = container.querySelector('.nav-grupo')!;
    expect(grupo).not.toHaveClass('abierto');
    fireEvent.focus(grupo.querySelector('.nav-grupo-tit')!);
    expect(grupo, 'enfocar el grupo no revela sus opciones: sin ratón no hay forma de entrar')
      .toHaveClass('abierto');
    expect(grupo.querySelector('.nav-hijo')).not.toBeNull();
  });

  it('[7] elegir una opción MUEVE el fijado aunque el producto no controle `activa`', async () => {
    /* `navegar` fija el grupo además de avisar, porque el producto puede tardar
       en actualizar `activa` —o no controlarla— y el menú no puede esperar. Ese
       camino entero no tenía prueba: quitarlo dejaba las 70 en verde. */
    const u = userEvent.setup();
    const { container } = montar({ activa: 'inicio', onNavegar: () => {} });
    const grupo = container.querySelector('.nav-grupo')!;
    fireEvent.mouseEnter(grupo);
    await u.click(screen.getByRole('link', { name: 'Notas' }));
    expect(container.querySelector('.nav-grupo.fijo'), 'elegir no movió el bloqueo').not.toBeNull();
    expect(container.querySelector('.nav-grupo.fijo')!.querySelector('.nav-txt')!.textContent)
      .toBe('Académico');
  });

  it('[7] y el fijado SIGUE a `activa` cuando el producto sí la controla', () => {
    /* Tapada por el inicializador: solo rompiendo los dos a la vez se veía.
       Aquí se monta con `activa` FUERA del grupo y se cambia después. */
    const { container, rerender } = render(
      <MarcoApp titulo="AE" hrefInicio="/" navegacion={NAV} usuario={USUARIO} activa="inicio">
        <p>x</p>
      </MarcoApp>,
    );
    expect(container.querySelector('.nav-grupo.fijo')).toBeNull();
    rerender(
      <MarcoApp titulo="AE" hrefInicio="/" navegacion={NAV} usuario={USUARIO} activa="notas">
        <p>x</p>
      </MarcoApp>,
    );
    expect(container.querySelector('.nav-grupo.fijo'), 'cambiar de pantalla no movió el bloqueo').not.toBeNull();
  });

  it('[9] plegado NO se pinta `.fijo`: ahí el acento no dice nada y manda el cursor', () => {
    const { container } = montar({ activa: 'notas', plegado: true });
    expect(container.querySelector('.nav-grupo.fijo'),
      'plegado se pinta el acento de un grupo que ni siquiera se ve abierto').toBeNull();
  });

  it('[7] el título del grupo FIJA y SUELTA', async () => {
    const u = userEvent.setup();
    const { container } = montar({ activa: 'inicio' });
    const tit = screen.getByRole('button', { name: /Académico/ });
    await u.click(tit);
    expect(container.querySelector('.nav-grupo.fijo'), 'el clic no fijó el grupo').not.toBeNull();
    expect(tit).toHaveAttribute('aria-expanded', 'true');
    await u.click(tit);
    expect(container.querySelector('.nav-grupo.fijo'), 'el clic no soltó el grupo').toBeNull();
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
    // Con la pantalla en curso dentro del grupo, sus opciones están a la vista.
    montar({ onNavegar: ir, activa: 'notas' });
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
    const { container } = montar({ activa: 'notas' });
    expect(container.querySelector('.nav-grupo')!).toHaveClass('abierto');
  });

  it('R16 · al soltarlo se va `.fijo`, y `.abierto` en cuanto el cursor se marcha', async () => {
    /* `userEvent.click` PASA EL CURSOR por encima antes de pulsar, así que el
       grupo sigue abierto —correctamente— mientras el ratón está ahí. Lo que
       el clic suelta es el fijado; el abierto se va al salir. */
    const u = userEvent.setup();
    const { container } = montar({ activa: 'notas' });
    const grupo = container.querySelector('.nav-grupo')!;
    await u.click(screen.getByRole('button', { name: /Académico/ }));
    expect(grupo, 'el clic no soltó el fijado').not.toHaveClass('fijo');
    fireEvent.mouseLeave(grupo);
    await waitFor(() => expect(grupo).not.toHaveClass('abierto'));
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
    /* Plegado el FIJADO no abre —si no, elegir una opción dejaría el panel
       flotante reabriéndose solo— así que al plegar no puede quedar ninguno. */
    const u = userEvent.setup();
    const { container } = montar({ activa: 'notas' });
    expect(container.querySelectorAll('.nav-grupo.abierto').length).toBeGreaterThan(0);
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(0);
  });

  it('[7] plegar SUELTA el grupo que tuviera el cursor: si no, queda un flotante atascado', async () => {
    /* `sincronizarGrupos` existe para esto y era un no-op sin prueba: quitarlo
       dejaba las 70 en verde. Al plegar, el grupo que el cursor tenía abierto
       se quedaba como panel flotante encima del contenido sin que nadie lo
       pidiera. */
    const u = userEvent.setup();
    const { container } = montar({ activa: 'inicio' });
    const grupo = container.querySelector('.nav-grupo')!;
    fireEvent.mouseEnter(grupo);
    expect(grupo).toHaveClass('abierto');
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    expect(grupo, 'al plegar quedó un panel flotante abierto que nadie pidió').not.toHaveClass('abierto');
  });

  it('[9] plegar NO deja el foco dentro de lo que acaba de ocultar', () => {
    /* Plegar cierra los grupos, y cerrar pone `hidden` —`display:none`— en el
       panel. Con el foco de alguien ahí dentro, el navegador lo tira al `body`.
       Pasaba por las dos puertas que nadie miraba: la ventana cruzando los
       900px sola y el producto plegando desde fuera. Las otras dos ya movían el
       foco antes, y por eso no se veía. */
    let oyente: ((e: { matches: boolean }) => void) | null = null;
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: false, media,
      addEventListener: (_: string, f: (e: { matches: boolean }) => void) => {
        if (media.includes('900')) oyente = f;
      },
      removeEventListener: () => {},
    }));
    const { container } = montar({ navegacion: TRES_NIVELES, activa: 'general' });
    const dentro = container.querySelector('.nav-hijos .nav-hijo') as HTMLElement;
    dentro.focus();
    expect(document.activeElement, 'no se pudo poner el foco dentro del panel').toBe(dentro);
    // La ventana cruza a tableta y el marco se pliega solo. Nadie tocó nada.
    act(() => oyente?.({ matches: true }));
    expect(
      (document.activeElement as HTMLElement)?.closest('[hidden]'),
      'el foco se quedó dentro de un contenedor oculto',
    ).toBeNull();
    expect(document.activeElement, 'el foco se perdió en el body').not.toBe(document.body);
  });

  it('[7] plegar suelta TAMBIÉN el grupo que tuviera el foco, no solo el del cursor', () => {
    /* `sincronizarGrupos` suelta dos señalizadores y solo uno tenía prueba:
       dejar el del foco puesto pasaba 90/90 en verde. */
    const { container } = montar({ navegacion: TRES_NIVELES, activa: 'inicio' });
    const grupo = container.querySelector('.nav-grupo')!;
    fireEvent.focus(grupo.querySelector('.nav-grupo-tit')!);
    expect(grupo).toHaveClass('abierto');
    fireEvent.click(screen.getByRole('button', { name: 'Plegar menú' }));
    expect(grupo, 'plegar dejó abierto el grupo que tenía el foco').not.toHaveClass('abierto');
  });

  it('[5] al desmontar no queda ningún temporizador de salida vivo', () => {
    /* Sin la limpieza, un `setTimeout` de `saleElCursor` despierta sobre un
       componente que ya no existe y React avisa de una actualización en algo
       desmontado. No tenía prueba: quitarla dejaba 90/90 en verde. */
    vi.useFakeTimers();
    try {
      const { container, unmount } = montar({ activa: 'inicio' });
      const grupo = container.querySelector('.nav-grupo')!;
      fireEvent.mouseEnter(grupo);
      fireEvent.mouseLeave(grupo);
      expect(vi.getTimerCount(), 'no hay temporizador pendiente que comprobar').toBeGreaterThan(0);
      unmount();
      expect(vi.getTimerCount(), 'quedó un temporizador vivo tras desmontar').toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('[7] CONTROLADO, plegar desde fuera también suelta el grupo del cursor', () => {
    /* La regla 7 dice que la sincronización llega cuando el producto DEVUELVE
       el cambio, no cuando se le pide. Esa rama —la del `useEffect`— no tenía
       prueba: borrarla entera dejaba las 70 en verde. Y es la que importa,
       porque es la que corre cuando el producto persiste el plegado en el
       perfil y lo restaura al cargar la sesión, sin pasar por el botón. */
    const { container, rerender } = render(
      <MarcoApp titulo="Colegio Albert Einstein" hrefInicio="/" navegacion={NAV}
        usuario={USUARIO} activa="inicio" plegado={false} onPlegar={() => {}}>
        <p>Contenido</p>
      </MarcoApp>
    );
    const grupo = container.querySelector('.nav-grupo')!;
    fireEvent.mouseEnter(grupo);
    expect(grupo).toHaveClass('abierto');
    // El producto pliega por su cuenta. Nadie tocó el botón.
    rerender(
      <MarcoApp titulo="Colegio Albert Einstein" hrefInicio="/" navegacion={NAV}
        usuario={USUARIO} activa="inicio" plegado onPlegar={() => {}}>
        <p>Contenido</p>
      </MarcoApp>
    );
    expect(grupo, 'quedó un panel flotante atascado que nadie pidió').not.toHaveClass('abierto');
  });

  it('[9] salir con el TECLADO cierra el grupo: si no, tabular los deja todos abiertos', () => {
    /* Mutación superviviente: `onBlur={() => {}}` dejaba 70/70 y 8/8 en verde.
       Con ella, quien tabula de arriba abajo acaba con TODOS los grupos
       abiertos y `aria-expanded="true"`, y el «menú corto» de la regla 9
       simplemente no existe para el teclado. */
    const { container } = montar({ navegacion: TRES_NIVELES, activa: 'inicio' });
    const grupo = container.querySelector('.nav-grupo')!;
    const tit = grupo.querySelector('.nav-grupo-tit')!;
    fireEvent.focus(tit);
    expect(grupo).toHaveClass('abierto');
    // El foco se va FUERA del grupo — al botón de plegar, que está en la cabecera.
    fireEvent.blur(tit, { relatedTarget: screen.getByRole('button', { name: 'Plegar menú' }) });
    expect(grupo, 'el foco salió del grupo y el panel se quedó abierto').not.toHaveClass('abierto');
    expect(tit).toHaveAttribute('aria-expanded', 'false');
  });

  it('[9] pero moverse del título a una OPCIÓN de dentro no lo cierra', () => {
    /* La otra mitad, y la mutación opuesta: quitar la guarda `contains` dejaba
       también 70/70 en verde. Sin ella, tabular del título a su primera opción
       cierra el panel DEBAJO DEL FOCO y la opción se vuelve inalcanzable — que
       es el mismo daño que el defecto del ratón, por la otra puerta. */
    const { container } = montar({ navegacion: TRES_NIVELES, activa: 'inicio' });
    const grupo = container.querySelector('.nav-grupo')!;
    const tit = grupo.querySelector('.nav-grupo-tit')!;
    fireEvent.focus(tit);
    const dentro = grupo.querySelector('.nav-hijo')!;
    fireEvent.blur(tit, { relatedTarget: dentro });
    expect(grupo, 'ir del título a una opción de dentro cerró el grupo').toHaveClass('abierto');
  });

  it('[5] el margen de salida son 220 ms: ni 100 ni un segundo', () => {
    /* El número estaba sin sujetar por abajo: con 101 o con 120 las 70 seguían
       en verde. Y el número IMPORTA — es el tiempo que el cursor tarda en
       cruzar los 56px del carril hasta el panel flotante. */
    vi.useFakeTimers();
    try {
      const { container } = montar({ activa: 'inicio' });
      const grupo = container.querySelector('.nav-grupo')!;
      fireEvent.mouseEnter(grupo);
      fireEvent.mouseLeave(grupo);
      act(() => { vi.advanceTimersByTime(219); });
      expect(grupo, 'cerró antes de los 220 ms: no da tiempo a cruzar el carril').toHaveClass('abierto');
      act(() => { vi.advanceTimersByTime(2); });
      expect(grupo, 'sigue abierto pasados los 220 ms: se queda colgado').not.toHaveClass('abierto');
    } finally {
      vi.useRealTimers();
    }
  });

  it('[9] el RATÓN en otro grupo NO puede cerrar el panel donde está el FOCO', async () => {
    /* DEFECTO DE LA v1.117.0, cazado por una auditoría antes de publicar.
       `enElCursor` paso de ser un `Set` a UN SOLO VALOR, asi que entrar con el
       raton en un grupo desalojaba al anterior en el acto — aunque el anterior
       estuviera abierto por el FOCO DEL TECLADO. Como `.nav-hijos[hidden]` es
       `display:none`, en un navegador de verdad eso EXPULSA EL FOCO al `body`:
       quien navega con teclado pierde el sitio porque alguien movio el raton.
       Y `aria-expanded` del grupo donde esta su foco pasa a decir «false».
       WCAG 2.4.3 (orden del foco) y 4.1.2 (nombre, funcion, valor). */
    const dos: GrupoNav[] = [
      ...NAV,
      { clave: 'reportes', texto: 'Reportes', hijos: [{ clave: 'mensual', texto: 'Mensual', href: '/m' }] },
    ];
    const { container } = montar({ activa: 'inicio', navegacion: dos });
    // Solo los que TIENEN panel: 'inicio' no lleva hijos y no es comparable.
    const [uno, otro] = [...container.querySelectorAll('.nav-grupo')]
      .filter((g) => g.querySelector('.nav-hijos'));

    // El foco entra en el primer grupo: su panel se revela.
    fireEvent.focus(uno.querySelector('.nav-grupo-tit')!);
    expect(uno.querySelector('.nav-hijos')).not.toHaveAttribute('hidden');

    // Y ahora el ratón se pasea por el otro. El foco no se ha movido.
    fireEvent.mouseEnter(otro);
    expect(
      uno.querySelector('.nav-hijos'),
      'el ratón cerró el panel donde vive el foco del teclado',
    ).not.toHaveAttribute('hidden');
    expect(
      uno.querySelector('.nav-grupo-tit'),
      'aria-expanded miente sobre el grupo donde está el foco',
    ).toHaveAttribute('aria-expanded', 'true');
    // Y el del ratón también se revela: son dos señales, no una.
    expect(otro.querySelector('.nav-hijos')).not.toHaveAttribute('hidden');
  });

  it('[9] con el cursor sobre otro grupo hay EXACTAMENTE UN `.fijo`', () => {
    /* `.nav-grupo.fijo > .nav-grupo-tit` pinta el acento, y la regla 9 dice que
       el acento identifica al retenido. Dos acentos a la vez no identifican
       nada. La mutación `!plegado && abierto` en vez de `!plegado && estaFijo`
       dejaba las 70 en verde. */
    const dos: GrupoNav[] = [
      ...NAV,
      { clave: 'reportes', texto: 'Reportes', hijos: [{ clave: 'mensual', texto: 'Mensual', href: '/m' }] },
    ];
    const { container } = montar({ activa: 'notas', navegacion: dos });
    const otro = [...container.querySelectorAll('.nav-grupo')]
      .find((g) => !g.classList.contains('fijo'))!;
    fireEvent.mouseEnter(otro);
    expect(otro, 'el cursor no reveló el otro grupo').toHaveClass('abierto');
    expect(container.querySelectorAll('.nav-grupo.fijo')).toHaveLength(1);
  });

  it('[9] `aria-expanded` dice la verdad cuando quien abre es el TECLADO', () => {
    /* Mutación superviviente: `aria-expanded={estaFijo}` en vez de `{abierto}`
       dejaba 70/70 y 8/8 en verde. Con ella, un grupo revelado por el foco está
       visiblemente abierto y anuncia «false». */
    const { container } = montar({ activa: 'inicio' });
    const g = [...container.querySelectorAll('.nav-grupo')]
      .find((x) => x.querySelector('.nav-hijos'))!;
    const tit = g.querySelector('.nav-grupo-tit')!;
    expect(tit).toHaveAttribute('aria-expanded', 'false');
    fireEvent.focus(tit);
    expect(g.querySelector('.nav-hijos')).not.toHaveAttribute('hidden');
    expect(tit, 'se ve abierto y anuncia cerrado').toHaveAttribute('aria-expanded', 'true');
  });

  it('[9] `.fijo` se mueve a mano, pero `aria-current` NO: son dos señales distintas', async () => {
    /* El contrato afirma que quien pregunte por la pantalla en curso tiene
       `aria-current` y que ése no se mueve. Sin esta prueba era una frase: el
       acento de `.fijo` SÍ se va al grupo que pulses, y si `aria-current` se
       fuera con él, un lector de pantalla anunciaría como página actual una en
       la que no estás. */
    const u = userEvent.setup();
    /* Hacen falta DOS grupos: `NAV` solo trae uno con hijos, y con uno solo la
       pregunta «¿se mueve la retención al pulsar otro?» no se puede hacer. */
    const dos: GrupoNav[] = [
      ...NAV,
      { clave: 'reportes', texto: 'Reportes', hijos: [{ clave: 'mensual', texto: 'Mensual', href: '/m' }] },
    ];
    const { container } = montar({ activa: 'notas', navegacion: dos });
    const antes = container.querySelector('[aria-current="page"]')!.textContent;
    const otro = [...container.querySelectorAll('.nav-grupo')]
      .find((g) => !g.classList.contains('fijo'))!;
    await u.click(otro.querySelector('.nav-grupo-tit')!);
    expect(otro, 'pulsar el título de otro grupo no movió la retención').toHaveClass('fijo');
    expect(
      container.querySelectorAll('[aria-current="page"]'),
      'hay más de una página anunciada como actual',
    ).toHaveLength(1);
    expect(
      container.querySelector('[aria-current="page"]')!.textContent,
      'la retención se llevó consigo el anuncio de página actual',
    ).toBe(antes);
  });

  it('pero el FIJO se conserva al plegar y vuelve al desplegar: es dónde estás', async () => {
    const u = userEvent.setup();
    const { container } = montar({ activa: 'notas' });
    const b = screen.getByRole('button', { name: 'Plegar menú' });
    await u.click(b);
    await u.click(screen.getByRole('button', { name: 'Desplegar menú' }));
    expect(container.querySelector('.nav-grupo.fijo'), 'plegar perdió dónde estabas').not.toBeNull();
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

  it('[9] DESPLEGADO el cursor REVELA el grupo, y al salir se pliega solo', async () => {
    /* LA REGLA 9 CAMBIA DE SIGNO en la v1.117.0, y conviene saber por qué:
       decía «desplegado el cursor NO abre los grupos» y el argumento era que
       abrir al pasar por encima cuando ya se lee todo es ruido. Ese argumento
       se apoyaba en que **ya se leía todo** — con los cuatro grupos abiertos.
       Al pasar a un menú corto deja de sostenerse: si el grupo está plegado, el
       cursor es justo lo que hace falta para mirar dentro sin perder el sitio.
       Lo pidió el responsable el 2026-09-15. */
    const { container } = montar({ activa: 'inicio' });
    const grupo = container.querySelector('.nav-grupo')!;
    expect(grupo.classList.contains('abierto'), 'arranca abierto sin estar fijado').toBe(false);
    fireEvent.mouseEnter(grupo);
    expect(grupo.classList.contains('abierto'), 'el cursor no reveló el grupo').toBe(true);
    fireEvent.mouseLeave(grupo);
    await waitFor(() => expect(grupo.classList.contains('abierto')).toBe(false));
  });

  it('[9] y el FIJADO no se cierra al salir: se queda porque es dónde estás', async () => {
    const { container } = montar({ activa: 'notas' });
    const grupo = container.querySelector('.nav-grupo.fijo')!;
    expect(grupo).not.toBeNull();
    fireEvent.mouseEnter(grupo);
    fireEvent.mouseLeave(grupo);
    await new Promise((r) => { setTimeout(r, 300); });
    expect(grupo.classList.contains('abierto'), 'el grupo de la pantalla en curso se cerró al salir').toBe(true);
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

describe('R135 · el tercer nivel, y el riel plegado', () => {
  /**
   * SE LEE LA HOJA QUE VIAJA, no la cascada resuelta por jsdom.
   *
   * jsdom resuelve por orden de archivo e **ignora la especificidad** —está
   * medido—, así que preguntarle por `getComputedStyle` da falsos positivos.
   * Aquí se mira lo que la hoja **declara** para los dos niveles; la versión
   * resuelta la comprueba `NIVELES-QUE-SE-COMPONEN-IGUAL` en `verificar-cascada`,
   * con el resolvedor del repositorio y a once anchos.
   */
  const HOJA = readFileSync(
    resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'), 'utf8',
  );
  /** Las declaraciones del bloque cuyo selector es exactamente ése. */
  const bloque = (selector: string) => {
    const i = HOJA.indexOf(`\n${selector}{`);
    expect(i, `la hoja no declara ${selector}`).toBeGreaterThan(-1);
    return HOJA.slice(i, HOJA.indexOf('}', i));
  };

  it('[13] la barra de encabezado es UNA fila, y su `height` NO lo mata una regla posterior', () => {
    /* R158.1 · Llevaba `flex-wrap: wrap; height: auto` bajo 640 px. El `height`
       no se aplicaba NUNCA —la base `.top{…height:64px}` va después y gana por
       orden—, así que la barra envolvía y seguía midiendo 64: la segunda fila
       quedaba catorce píxeles FUERA. Medido en el producto a 333 px. */
    /* SE BUSCA EL BLOQUE QUE HABLA DE `.top`, no el primer «640px» del archivo:
       hay varios y los otros son de otros componentes. La primera versión de
       esta prueba miraba el primero y comprobaba una regla del filtro de fechas
       — verde sin mirar nada. */
    const regla = [...HOJA.matchAll(/@media \(max-width: 640px\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1]).find((b) => /\.top\{/.test(b)) ?? '';
    expect(regla, 'no encuentro el bloque de la barra a 640 px').not.toBe('');
    expect(regla, 'la barra vuelve a envolver: el encabezado se parte en dos filas')
      .not.toMatch(/\.top\{[^}]*flex-wrap:\s*wrap/);
    expect(regla, 'declara un `height` que la regla base de abajo mata por orden')
      .not.toMatch(/\.top\{[^}]*height:\s*auto/);
    /* Y lo que hace que quepan sin envolver: los hijos tienen que poder encoger.
       Medido: 26 + 12 de hueco + 264 = 302 px contra 301,3 de sitio. Envolvía
       por SIETE DÉCIMAS. */
    expect(bloque('.top-acciones'), '`top-acciones` no encoge, así que la barra no cabe')
      .toMatch(/min-width:\s*0/);
  });

  it('[14] `altoCompleto` publica la cadena de alto, en `dvh` y como OPCIÓN', () => {
    /* R158.2 · El sistema entregó `tbl-marco` diciendo «el alto lo pone el
       padre» y no publicó ningún padre que lo diera: `.app` sólo declara
       `min-height`. Sin esto, `tbl-crece` no desplaza nada y el rótulo que
       sostiene el color se va de pantalla — la regla 2 de «Piezas de tablero». */
    const { container } = montar();
    expect(container.querySelector('.app')?.className,
      'sin pedirlo, la aplicación NO cambia su modelo de desplazamiento')
      .not.toContain('app-alto');

    const { container: c2 } = montar({ altoCompleto: true });
    expect(c2.querySelector('.app')?.className,
      '`altoCompleto` no emite la clase: la cadena de alto no llega')
      .toContain('app-alto');

    const alto = bloque('.app-alto');
    expect(alto, 'la cadena de alto no usa `dvh`: en un teléfono el pie queda debajo')
      .toMatch(/height:\s*100dvh/);
    expect(alto, 'sin respaldo en `vh`, un navegador sin `dvh` se queda sin alto')
      .toMatch(/height:\s*100vh/);
    expect(alto, 'sin anular el `min-height`, la cadena se rompe en el primer hijo')
      .toMatch(/min-height:\s*0/);
    expect(bloque('.app-alto .app-contenido'),
      'el contenido no baja de su tamaño: empujará el pie fuera').toMatch(/min-height:\s*0/);
  });

  it('[11] el tercer nivel se compone como el segundo: nada de iconos apilados', () => {
    /* `.nav-nieto` era `display: block` mientras `.nav-hijo` es `flex`, así que
       cualquier icono en ese nivel caía ENCIMA del rótulo y la fila medía el
       doble. Control Administrativos lo midió montando un menú de tres niveles
       y tuvo que quitar el icono para que no se partiera. */
    const hijo = bloque('.nav-hijo');
    const nieto = bloque('.nav-nieto');
    expect(hijo).toContain('display: flex');
    expect(nieto, 'el tercer nivel no coloca en línea: el icono cae sobre el rótulo').toContain('display: flex');
    expect(nieto, 'sin `align-items` el icono no centra con el texto').toContain('align-items: center');
  });

  it('[11] pero el sangrado y el cuerpo SIGUEN siendo suyos', () => {
    // Lo que se iguala es la composición, no la jerarquía: 56px y 12px hacen su
    // trabajo y el equipo pidió expresamente no tocarlos.
    const nieto = bloque('.nav-nieto');
    expect(nieto).toContain('padding: 4px 8px 4px 56px');
    expect(nieto).toContain('font-size: 12px');
  });

  it('[12] plegado, las ramas del panel flotante llegan ABIERTAS', () => {
    /* Dentro del panel, una rama cerrada no se abre al pasar por encima —solo
       el grupo lo hace—, así que el tercer nivel quedaba detrás de un clic
       dentro de un panel que solo vive mientras el puntero esté encima. Lo
       midió Control Administrativos V2.0 recorriéndolo con el ratón. */
    const { container } = montar({ navegacion: TRES_NIVELES, plegado: true });
    /* El panel solo se pinta con el grupo abierto: plegado, eso es el cursor.
       Y se comprueba que de verdad lo abrió, porque sin esto las aserciones de
       abajo salían igual sin pasar el cursor: la prueba se llamaba «del panel
       flotante» y del panel no medía nada. */
    fireEvent.mouseEnter(container.querySelector('.nav-grupo')!);
    expect(container.querySelector('.nav-grupo')!.classList.contains('abierto'),
      'el cursor no abrió el panel: lo de abajo no está midiendo el panel').toBe(true);
    expect(container.querySelector('.nav-hijos')!.hasAttribute('hidden')).toBe(false);
    const rama = container.querySelector('.nav-rama')!;
    expect(rama.classList.contains('abierta'), 'la rama llega cerrada en el panel flotante').toBe(true);
    expect(rama.querySelector('.nav-nietos')!.hasAttribute('hidden')).toBe(false);
    expect(rama.querySelector('.nav-rama-tit')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('[12] pero EXTENDIDO siguen cerradas: doce ítems seguidos no se leen', () => {
    // La regla 6 no cambia. Aquí el menú entero es una columna larga.
    const { container } = montar({ navegacion: TRES_NIVELES });
    expect(container.querySelector('.nav-rama')!.classList.contains('abierta')).toBe(false);
  });

  it('[12] y el mando sigue vivo: plegado se pueden cerrar a mano', async () => {
    const u = userEvent.setup();
    const { container } = montar({ navegacion: TRES_NIVELES, plegado: true });
    fireEvent.mouseEnter(container.querySelector('.nav-grupo')!);
    await u.click(container.querySelector('.nav-rama-tit') as HTMLElement);
    expect(container.querySelector('.nav-rama')!.classList.contains('abierta')).toBe(false);
  });

  it('[12] cerrar una rama a mano AGUANTA una navegación: el efecto no la reabre', async () => {
    /* Las dependencias del efecto son SOLO `plegado`. Con `navegacion` o
       `activa` dentro, navegar por el panel reabriría lo que se acaba de
       cerrar — y `navegacion` suele ser un array literal nuevo en cada render
       del producto, así que se dispararía SIEMPRE. La razón está escrita en el
       componente y no la protegía nada: una auditoría metió las dos
       dependencias y las 57 pruebas siguieron en verde. */
    const u = userEvent.setup();
    const props = { titulo: 'C', hrefInicio: '/', usuario: USUARIO, plegado: true };
    const { container, rerender } = render(
      <MarcoApp {...props} navegacion={TRES_NIVELES} activa="sedes"><p>x</p></MarcoApp>,
    );
    fireEvent.mouseEnter(container.querySelector('.nav-grupo')!);
    await u.click(container.querySelector('.nav-rama-tit') as HTMLElement);
    expect(container.querySelector('.nav-rama')!.classList.contains('abierta')).toBe(false);

    // Navegar: cambia `activa`. La rama cerrada a mano tiene que seguir cerrada.
    rerender(<MarcoApp {...props} navegacion={TRES_NIVELES} activa="cargos"><p>x</p></MarcoApp>);
    expect(container.querySelector('.nav-rama')!.classList.contains('abierta'),
      'cambiar `activa` reabrió la rama que se acababa de cerrar').toBe(false);

    // Y un `navegacion` NUEVO con el mismo contenido —lo que hace un literal
    // en línea— tampoco puede reabrirla.
    rerender(
      <MarcoApp {...props} navegacion={JSON.parse(JSON.stringify(TRES_NIVELES))} activa="cargos">
        <p>x</p>
      </MarcoApp>,
    );
    expect(container.querySelector('.nav-rama')!.classList.contains('abierta'),
      'un `navegacion` nuevo en cada render reabre lo que el usuario cierre').toBe(false);
  });

  it('[12] al plegar sobre la marcha, las ramas se abren', () => {
    const { container, rerender } = render(
      <MarcoApp titulo="C" hrefInicio="/" navegacion={TRES_NIVELES} usuario={USUARIO} plegado={false}>
        <p>x</p>
      </MarcoApp>,
    );
    expect(container.querySelector('.nav-rama')!.classList.contains('abierta')).toBe(false);
    rerender(
      <MarcoApp titulo="C" hrefInicio="/" navegacion={TRES_NIVELES} usuario={USUARIO} plegado>
        <p>x</p>
      </MarcoApp>,
    );
    expect(container.querySelector('.nav-rama')!.classList.contains('abierta'), 'plegar no abrió las ramas').toBe(true);
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
      <MarcoApp titulo="AE" hrefInicio="/" navegacion={NAV} usuario={USUARIO} activa="notas" plegado>
        <p>Contenido</p>
      </MarcoApp>
    );
    // Plegado el fijado NO abre: solo el cursor.
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(0);

    /* El producto devuelve el valor nuevo. Al desplegar vuelve el FIJO —dónde
       estás—, y solo ése: así funciona igual si el pliegue no vino del botón,
       como al restaurar la preferencia del perfil al abrir sesión. */
    rerender(
      <MarcoApp titulo="AE" hrefInicio="/" navegacion={NAV} usuario={USUARIO} activa="notas" plegado={false}>
        <p>Contenido</p>
      </MarcoApp>
    );
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(1);
    expect(container.querySelector('.nav-grupo.fijo')).not.toBeNull();
  });

  it('sin control de fuera nada cambia: pedir ES aplicar', async () => {
    const u = userEvent.setup();
    const { container } = montar({ activa: 'notas' });
    await u.click(screen.getByRole('button', { name: 'Plegar menú' }));
    expect(container.querySelector('.lat.colapsado')).not.toBeNull();
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(0);
    await u.click(screen.getByRole('button', { name: 'Desplegar menú' }));
    expect(container.querySelector('.lat.colapsado')).toBeNull();
    expect(container.querySelectorAll('.nav-grupo.abierto')).toHaveLength(1);
  });
});

describe('R42a · el tercer nivel del menú por fin se emite', () => {
  it('una opción con hijos es una RAMA plegable, con el marcado que la hoja estiliza', async () => {
    const u = userEvent.setup();
    // `activa` dentro del grupo: si no, llega plegado y la rama no se ve.
    const { container } = montar({ navegacion: TRES_NIVELES, activa: 'general' });
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
