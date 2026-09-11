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

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { ReactNode } from 'react';
import { StrictMode, useRef, useState } from 'react';
import { Dialogo } from '../src/Dialogo';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

function Anfitrion({
  conAccion = false,
  onAccion = () => {},
  textoOcupado = undefined as ReactNode,
  deshabilitada = false,
  destructiva = false,
  ocupado = false,
  cerrarAlPulsarFuera = true,
}) {
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
        cerrarAlPulsarFuera={cerrarAlPulsarFuera}
        accion={conAccion ? { texto: 'Guardar', onClick: onAccion, textoOcupado, deshabilitada, destructiva, ocupado } : undefined}
      >
        <p>Contenido del diálogo</p>
      </Dialogo>
    </>
  );
}

const abrir = (u: ReturnType<typeof userEvent.setup>) =>
  u.click(screen.getByRole('button', { name: 'Editar' }));

describe('Diálogo', () => {
  it('[1] el diálogo tiene nombre accesible: sin él es «diálogo» a secas', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    expect(screen.getByRole('dialog', { name: 'Editar los datos de contacto' })).toBeInTheDocument();
  });

  it('[3] el foco ENTRA en el título, no se queda fuera ni cae en un campo sin contexto', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    expect(screen.getByRole('heading', { name: 'Editar los datos de contacto' })).toHaveFocus();
  });

  it('[4] al cerrar, el foco VUELVE al elemento que lo abrió', async () => {
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

  it('[6] CANCELAR va antes que la acción: invertirlo hace que se pulse el que no era', async () => {
    const u = userEvent.setup();
    render(<Anfitrion conAccion />);
    await abrir(u);
    const pie = document.querySelector('.dialogo-pie')!;
    const botones = [...pie.querySelectorAll('button')].map((b) => b.textContent);
    expect(botones).toEqual(['Cancelar', 'Guardar']);
  });

  it('[7] la acción se ejecuta y el diálogo no se cierra solo: lo decide el proyecto', async () => {
    const u = userEvent.setup();
    const guardar = vi.fn();
    render(<Anfitrion conAccion onAccion={guardar} />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(guardar).toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('[8] pulsar DENTRO no cierra: el clic no sube al fondo', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    await u.click(screen.getByText('Contenido del diálogo'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('[2] se abre con showModal y NO con show: con `show` el foco se pasea por detras', async () => {
    const u = userEvent.setup();
    const modal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    // `show` se restaura igual que el espía: dejarlo puesto se filtraba al
    // resto del archivo, que es la clase de contaminación que hace que una
    // prueba pase por lo que hizo la anterior.
    const antes = HTMLDialogElement.prototype.show;
    const suelto = vi.fn();
    HTMLDialogElement.prototype.show = suelto;
    try {
      render(<Anfitrion />);
      await abrir(u);
      expect(modal).toHaveBeenCalled();
      expect(suelto).not.toHaveBeenCalled();
    } finally {
      HTMLDialogElement.prototype.show = antes;
      modal.mockRestore();
    }
  });

  it('[5] Escape cierra y el proyecto SE ENTERA: se intercepta `cancel`', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    const origen = screen.getByRole('button', { name: 'Editar' });
    await abrir(u);
    const dlg = screen.getByRole('dialog');

    // jsdom no traduce Escape a `cancel` —eso lo hace el navegador—, asi que se
    // emite el evento que el navegador emitiria. Lo que se prueba es lo nuestro:
    // que el dialogo no se cierre a espaldas del proyecto.
    const ev = new Event('cancel', { cancelable: true });
    await act(async () => { dlg.dispatchEvent(ev); });

    expect(ev.defaultPrevented).toBe(true);
    expect(dlg).not.toHaveAttribute('open');
    expect(origen).toHaveFocus();
  });

  it('[8] pulsar EL FONDO cierra', async () => {
    const u = userEvent.setup();
    render(<Anfitrion />);
    await abrir(u);
    const dlg = screen.getByRole('dialog');
    // El fondo es el propio <dialog>: la caja de dentro detiene el clic.
    await u.click(dlg);
    expect(dlg).not.toHaveAttribute('open');
  });

  it('[8] `cerrarAlPulsarFuera={false}` lo impide: lo escrito no se pierde por un clic', async () => {
    const u = userEvent.setup();
    render(<Anfitrion cerrarAlPulsarFuera={false} />);
    await abrir(u);
    const dlg = screen.getByRole('dialog');
    await u.click(dlg);
    expect(dlg).toHaveAttribute('open');
  });

  it('[9] `deshabilitada` deja el boton A LA VISTA y apagado, que no es quitarlo', async () => {
    const u = userEvent.setup();
    const guardar = vi.fn();
    render(<Anfitrion conAccion deshabilitada onAccion={guardar} />);
    await abrir(u);
    const btn = screen.getByRole('button', { name: 'Guardar' });
    expect(btn).toBeDisabled();
    await u.click(btn);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('[4] el foco vuelve también por el CIERRE PROGRAMÁTICO, que es el camino de la regla 7', async () => {
    // Es el cierre más frecuente en producción —la acción sale bien y el
    // proyecto pone `abierto={false}`— y NO pasaba por `cerrar()`, así que el
    // foco se quedaba en el `<h2>` de un diálogo ya cerrado. Lo destapó una
    // auditoría el 2026-09-11 junto con las diecisiete reglas de la sección nueva.
    function Prog() {
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
            accion={{ texto: 'Guardar', onClick: () => { setAbierto(false); } }}
          >
            <p>Contenido del diálogo</p>
          </Dialogo>
        </>
      );
    }
    const u = userEvent.setup();
    render(<Prog />);
    const origen = screen.getByRole('button', { name: 'Editar' });
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(origen).toHaveFocus();
  });

  it('[11] `destructiva` pinta la variante destructiva, y sin ella la principal', async () => {
    // No estaba en ninguna regla ni en ninguna prueba: ignorar la prop dejaba
    // todo «Eliminar» pintado de azul y las quince pruebas de entonces en verde.
    const u = userEvent.setup();
    const { container, unmount } = render(<Anfitrion conAccion destructiva />);
    await abrir(u);
    const btn = container.querySelectorAll('.dialogo-pie button')[1] as HTMLElement;
    expect(btn.className).toContain('btn-destr');
    unmount();

    const u2 = userEvent.setup();
    const { container: c2 } = render(<Anfitrion conAccion />);
    await abrir(u2);
    expect((c2.querySelectorAll('.dialogo-pie button')[1] as HTMLElement).className)
      .not.toContain('btn-destr');
  });

  it('[12] `accion.ocupado` fuerza el estado cuando `onClick` no devuelve promesa', async () => {
    // `onClick: () => void` está permitido por el tipo y nada avisa: sin
    // promesa no hay gerundio, ni bloqueo, ni protección de doble envío. Tres
    // clics llamaban tres veces. `Boton` ya tenía la salida; el diálogo no la
    // dejaba pasar hasta la v1.107.0.
    const u = userEvent.setup();
    const guardar = vi.fn();
    render(<Anfitrion conAccion ocupado onAccion={guardar} textoOcupado="Grabando…" />);
    await abrir(u);
    const btn = screen.getByRole('button', { name: 'Grabando…' });
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await u.click(btn);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('[13] cerrar con la acción EN VUELO conserva el estado, y NO permite un segundo envío', async () => {
    // Aquí hubo una `key` que remontaba el botón limpio al cerrar, para que
    // una promesa que no se resuelve nunca no lo dejara muerto. Se retiró: con
    // el botón remontado, abrir-Guardar-Cancelar-abrir-Guardar disparaba la
    // acción DOS VECES con la primera todavía en vuelo. Medido el 2026-09-11.
    // Un botón bloqueado se recupera recargando; una segunda escritura, no.
    const u = userEvent.setup();
    const guardar = vi.fn(() => new Promise(() => {}));
    const { container } = render(
      <Anfitrion conAccion onAccion={guardar} textoOcupado="Grabando…" />,
    );
    const accion = () => container.querySelectorAll('.dialogo-pie button')[1] as HTMLButtonElement;
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(accion().disabled).toBe(true);

    await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    await abrir(u);
    // Sigue ocupado, que es lo correcto: la acción SIGUE viajando.
    expect(accion().disabled).toBe(true);
    await u.click(accion());
    expect(guardar).toHaveBeenCalledTimes(1);
  });

  it('[13] EL LÍMITE: si el proyecto DESMONTA el diálogo, el guardia se va con él', async () => {
    // La regla 4 bendice `{abierto && <Dialogo …/>}` para el foco, y con ese
    // patrón el guardia del doble envío —que vive DENTRO de `Boton`— muere al
    // desmontar y el botón remontado acepta el segundo clic. No se puede
    // arreglar desde aquí: es lo que le pasa a cualquier estado de componente.
    // Se fija en una prueba para que nadie lo «arregle» sin querer y para que
    // la regla 13 no prometa lo que no puede. Las dos salidas están en el
    // contrato: no desmontar, o llevar el estado con `accion.ocupado`.
    function Desmontando({ onAccion }: { onAccion: () => Promise<unknown> }) {
      const origen = useRef<HTMLButtonElement>(null);
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button ref={origen} onClick={() => setAbierto(true)}>Editar</button>
          {abierto && (
            <Dialogo abierto titulo="T" origen={origen} onCerrar={() => setAbierto(false)}
              accion={{ texto: 'Guardar', onClick: onAccion, textoOcupado: 'Grabando…' }}>
              <p>x</p>
            </Dialogo>
          )}
        </>
      );
    }
    const u = userEvent.setup();
    const guardar = vi.fn(() => new Promise(() => {}));
    render(<Desmontando onAccion={guardar} />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    await abrir(u);
    // Esto es el LÍMITE, no la promesa: el botón vuelve pulsable.
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(guardar).toHaveBeenCalledTimes(2);
  });

  it('[13] y con `accion.ocupado` el proyecto SÍ puede cerrarlo', async () => {
    // La salida que el contrato ofrece para el caso de arriba: el estado vive
    // fuera del diálogo, así que sobrevive al desmontaje.
    function Desmontando() {
      const origen = useRef<HTMLButtonElement>(null);
      const [abierto, setAbierto] = useState(false);
      const [enVuelo, setEnVuelo] = useState(false);
      const guardar = () => { setEnVuelo(true); return new Promise(() => {}); };
      return (
        <>
          <button ref={origen} onClick={() => setAbierto(true)}>Editar</button>
          {abierto && (
            <Dialogo abierto titulo="T" origen={origen} onCerrar={() => setAbierto(false)}
              accion={{ texto: 'Guardar', onClick: guardar, ocupado: enVuelo, textoOcupado: 'Grabando…' }}>
              <p>x</p>
            </Dialogo>
          )}
        </>
      );
    }
    const u = userEvent.setup();
    render(<Desmontando />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    await abrir(u);
    expect(screen.getByRole('button', { name: 'Grabando…' })).toBeDisabled();
  });

  it('[13] y en cuanto la promesa termina, el botón se libera aunque se cerrara', async () => {
    const u = userEvent.setup();
    let soltar: () => void = () => {};
    const enVuelo = new Promise<void>((r) => { soltar = r; });
    const { container } = render(
      <Anfitrion conAccion onAccion={() => enVuelo} textoOcupado="Grabando…" />,
    );
    const accion = () => container.querySelectorAll('.dialogo-pie button')[1] as HTMLButtonElement;
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    await u.click(screen.getByRole('button', { name: 'Cancelar' }));

    await act(async () => { soltar(); await enVuelo; });
    await abrir(u);
    expect(accion().disabled).toBe(false);
    expect(accion()).not.toHaveAttribute('aria-busy');
  });

  it('[3b] el título es enfocable pero NO tabulable, que es lo que justifica el `outline:none`', () => {
    // La excepción al §6 de CLAUDE.md se apoya en un hecho comprobable: ese
    // `<h2>` tiene `tabIndex={-1}`, así que nadie llega a él navegando con el
    // teclado y el anillo solo aparecería al abrir, señalando un texto que no
    // es un control. Si mañana alguien lo mete en el recorrido del tabulador,
    // la excepción deja de valer — y esto cae.
    const origen = { current: null } as React.RefObject<HTMLElement>;
    const { container } = render(
      <Dialogo abierto={false} titulo="T" origen={origen} onCerrar={() => {}}>
        <p>x</p>
      </Dialogo>,
    );
    const tit = container.querySelector('.dialogo-tit')!;
    expect(tit.getAttribute('tabindex')).toBe('-1');
  });

  it('[3] EN MODO ESTRICTO el foco entra igual: la limpieza falsa no se lo lleva', async () => {
    // React en modo estricto —por omisión en Vite, CRA y Next— monta, LIMPIA y
    // vuelve a montar. La primera versión de la devolución del foco corría en
    // esa limpieza falsa: el título acababa de recibirlo, contaba como
    // «perdido» y se lo llevaba al origen; y el efecto recreado ya veía el
    // diálogo abierto y no volvía a enfocar. Diálogo abierto, foco FUERA.
    function Desmontable() {
      const origen = useRef<HTMLButtonElement>(null);
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button ref={origen} onClick={() => setAbierto(true)}>Editar</button>
          {abierto && (
            <Dialogo abierto titulo="Editar los datos de contacto" origen={origen} onCerrar={() => setAbierto(false)}>
              <p>x</p>
            </Dialogo>
          )}
        </>
      );
    }
    const u = userEvent.setup();
    render(<StrictMode><Desmontable /></StrictMode>);
    await abrir(u);
    expect(screen.getByRole('heading', { name: 'Editar los datos de contacto' })).toHaveFocus();
  });

  it('[3] y en modo estricto tampoco se pierde al cerrar de verdad', async () => {
    const u = userEvent.setup();
    render(<StrictMode><Anfitrion /></StrictMode>);
    const origen = screen.getByRole('button', { name: 'Editar' });
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(origen).toHaveFocus();
  });

  it('[4] el foco vuelve aunque el proyecto DESMONTE el diálogo al cerrar', async () => {
    // `{abierto && <Dialogo …/>}` es un patrón habitual y nada lo desaconseja.
    // Con la devolución del foco solo en el efecto de `abierto`, ese efecto ya
    // no llega a correr y el foco se caía a `<body>`.
    function Desmontando() {
      const origen = useRef<HTMLButtonElement>(null);
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button ref={origen} onClick={() => setAbierto(true)}>Editar</button>
          {abierto && (
            <Dialogo abierto titulo="T" origen={origen} onCerrar={() => setAbierto(false)}>
              <p>x</p>
            </Dialogo>
          )}
        </>
      );
    }
    const u = userEvent.setup();
    render(<Desmontando />);
    const origen = screen.getByRole('button', { name: 'Editar' });
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(origen).toHaveFocus();
  });

  it('[4] y NO se lo roba si el proyecto ya lo colocó él', async () => {
    // El camino programático es justo donde el consumidor suele mover el foco
    // a la fila recién creada. Devolverlo incondicionalmente se lo quitaba.
    function ConDestino() {
      const origen = useRef<HTMLButtonElement>(null);
      const destino = useRef<HTMLButtonElement>(null);
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button ref={origen} onClick={() => setAbierto(true)}>Editar</button>
          <button ref={destino}>Fila recién creada</button>
          <Dialogo
            abierto={abierto}
            titulo="T"
            origen={origen}
            onCerrar={() => setAbierto(false)}
            accion={{ texto: 'Guardar', onClick: () => { setAbierto(false); destino.current?.focus(); } }}
          >
            <p>x</p>
          </Dialogo>
        </>
      );
    }
    const u = userEvent.setup();
    render(<ConDestino />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('button', { name: 'Fila recién creada' })).toHaveFocus();
  });
});

describe('R118 · la acción dice el gerundio', () => {
  /**
   * Lo reportó Control Administrativos leyendo el paquete instalado: `Dialogo`
   * pasaba `onClick` a `Boton` SIN `textoOcupado`, así que el doble envío sí
   * quedaba protegido —el botón espera la promesa— pero el botón **enmudecía**:
   * se apagaba sin decir por qué. `Boton` ya sabía hacerlo; el diálogo no lo
   * dejaba pasar.
   */
  it('[10] R118 · mientras la acción trabaja, el botón dice el gerundio', async () => {
    const u = userEvent.setup();
    let soltar: () => void = () => {};
    const enVuelo = new Promise<void>((r) => { soltar = r; });

    render(<Anfitrion conAccion onAccion={() => enVuelo} textoOcupado="Grabando…" />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    // El gerundio se ve, y el botón queda ocupado.
    const btn = screen.getByRole('button', { name: 'Grabando…' });
    expect(btn).toHaveAttribute('aria-busy', 'true');

    await act(async () => { soltar(); await enVuelo; });
    expect(screen.getByRole('button', { name: 'Guardar' })).not.toHaveAttribute('aria-busy');
  });

  it('[10] R118 · los dos textos se dibujan siempre, para que el botón no baile', async () => {
    const u = userEvent.setup();
    const { container } = render(
      <Anfitrion conAccion onAccion={() => new Promise(() => {})} textoOcupado="Grabando…" />,
    );
    await abrir(u);

    // Esta prueba SOLO miraba que existiera `.btn-textos`, y por eso pasaba en
    // verde con el segundo texto borrado entero. Lo cazó una auditoría el
    // 2026-09-11: un título que promete más de lo que mide es una promesa
    // muerta. Ahora se miran los DOS textos y CUÁL de ellos se tapa.
    const caja = container.querySelector('.btn-textos')!;
    const dos = [...caja.children] as HTMLElement[];
    expect(dos.map((e) => e.textContent)).toEqual(['Guardar', 'Grabando…']);
    expect(dos[0].className).toBe('');             // en reposo se ve el texto…
    expect(dos[1].className).toBe('btn-texto-oculto'); // …y el gerundio ocupa sitio

    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    const ahora = [...container.querySelector('.btn-textos')!.children] as HTMLElement[];
    expect(ahora[0].className).toBe('btn-texto-oculto'); // ocupado: se cambian
    expect(ahora[1].className).toBe('');
  });

  it('[10b] R118 · el GIRO también reserva su sitio: el botón no crece 22px al ocuparse', async () => {
    const u = userEvent.setup();
    const { container } = render(
      <Anfitrion conAccion onAccion={() => new Promise(() => {})} textoOcupado="Grabando…" />,
    );
    await abrir(u);
    const btn = () => container.querySelectorAll('.dialogo-pie button')[1] as HTMLElement;
    // Se cuentan los hijos directos: si el giro se INSERTA al ocuparse, pasa de
    // uno a dos y el flex añade 14px de rueda + 8px de hueco. La promesa «mide
    // igual antes, durante y después» era falsa hasta la v1.107.0.
    const antes = btn().children.length;
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(btn().children.length).toBe(antes);
    expect(container.querySelector('.btn-giro.btn-texto-oculto')).toBeNull(); // ocupado: gira de verdad
  });

  it('[10c] R118 · un `textoOcupado` VACÍO no deja el botón mudo', async () => {
    // `null`, `false` y `''` son ReactNode legales y pasaban la guarda
    // `=== undefined`: el texto de reposo quedaba con `aria-hidden`, el hueco
    // del gerundio salía vacío y el «, enviando» se suprimía. El botón ocupado
    // se quedaba SIN NINGÚN NOMBRE ACCESIBLE — la mudez que R118 vino a
    // arreglar, con un valor más. Llega sola con `t('clave.ausente')`.
    const vacios: [string, ReactNode][] = [
      ['null', null],
      ['false', false],
      ['true', true],                      // la simetria que el primer arreglo olvido
      ['cadena vacia', ''],
      ['solo espacios', '   '],
      ['array vacio', []],
      ['array de nadas', [null, false]],
      ['elemento con hijo vacio', <span>{''}</span>],   // `<span>{t(clave)}</span>`
      ['fragmento con nada dentro', <>{null}</>],
      ['fragmento VACIO', <></>],                      // sin `children` siquiera
      ['Set vacio', new Set()],
      ['Map vacio', new Map()],
      ['Set de nadas', new Set([''])],
      ['generador vacio', (function* () { /* nada */ })()],
      ['iterable propio vacio', { [Symbol.iterator]: () => [][Symbol.iterator]() }],
    ];
    for (const [nombre, falso] of vacios) {
      const u = userEvent.setup();
      const { container, unmount } = render(
        <Anfitrion conAccion onAccion={() => new Promise(() => {})} textoOcupado={falso} />,
      );
      await abrir(u);
      await u.click(screen.getByRole('button', { name: 'Guardar' }));
      const btn = container.querySelectorAll('.dialogo-pie button')[1] as HTMLElement;
      expect(btn, nombre).toHaveAttribute('aria-busy', 'true');
      // Se cae al comportamiento de siempre: el texto se ve y el lector lo oye.
      expect(container.querySelector('.btn-textos'), nombre).toBeNull();
      expect(container.querySelector('.sr-solo')?.textContent, nombre).toBe(', enviando');
      expect(btn.textContent, nombre).toContain('Guardar');
      unmount();
    }
  });

  it('[10c] R118 · un gerundio que SÍ pinta texto se respeta, venga como venga', async () => {
    // El otro lado de la moneda: estrechar la guarda para tapar los vacíos no
    // puede tapar los llenos. Un iterador de UN SOLO USO es el caso delicado:
    // mirarlo lo gasta, así que se copia una vez y se pinta la copia.
    const llenos: [string, ReactNode][] = [
      ['cadena', 'Grabando…'],
      ['elemento', <span>Grabando…</span>],
      ['array', ['Grab', 'ando…']],
      ['Set', new Set(['Grabando…'])],
      ['generador', (function* () { yield 'Grabando…'; })()],
    ];
    for (const [nombre, valor] of llenos) {
      const u = userEvent.setup();
      const { container, unmount } = render(
        <Anfitrion conAccion onAccion={() => new Promise(() => {})} textoOcupado={valor} />,
      );
      await abrir(u);
      await u.click(screen.getByRole('button', { name: 'Guardar' }));
      const btn = container.querySelectorAll('.dialogo-pie button')[1] as HTMLElement;
      // El gerundio se ve, el texto de reposo se tapa, y NO sale el respaldo.
      expect(container.querySelector('.btn-textos'), nombre).not.toBeNull();
      expect(btn.textContent, nombre).toContain('Grabando…');
      expect(container.querySelector('.sr-solo'), nombre).toBeNull();
      unmount();
    }
  });

  it('[10d] R118 · una acción que FALLA no deja un rechazo sin manejar', async () => {
    // `.finally()` devuelve una promesa DERIVADA que rechaza con la misma
    // razón, y el `void` la tiraba sin `catch`. Cada acción fallida dejaba un
    // `unhandledRejection` AUNQUE el proyecto capturara el suyo. En Node >=15
    // eso mata el proceso; en navegador lo reporta Sentry como error del
    // producto. Y `textoOcupado` existe justo para llamadas que pueden fallar.
    const u = userEvent.setup();
    const sueltos: unknown[] = [];
    const oyente = (r: unknown) => sueltos.push(r);
    process.on('unhandledRejection', oyente);
    const fallar = () => {
      const p = Promise.reject(new Error('red caída'));
      p.catch(() => {});   // el proyecto SÍ maneja la suya
      return p;
    };
    render(<Anfitrion conAccion onAccion={fallar} textoOcupado="Grabando…" />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    process.off('unhandledRejection', oyente);
    expect(sueltos).toEqual([]);
    // Y el botón vuelve: sin liberar en el fallo quedaría muerto para siempre.
    expect(screen.getByRole('button', { name: 'Guardar' })).not.toHaveAttribute('aria-busy');
  });

  it('[10] R118 · sin `textoOcupado` no cambia nada de lo que ya estaba', async () => {
    const u = userEvent.setup();
    const { container } = render(<Anfitrion conAccion onAccion={() => new Promise(() => {})} />);
    await abrir(u);
    await u.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(container.querySelector('.btn-textos')).toBeNull();
    expect(screen.getByRole('button', { name: /Guardar/ })).toHaveAttribute('aria-busy', 'true');
  });
});
