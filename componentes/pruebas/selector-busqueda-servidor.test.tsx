/**
 * R118 · SELECTOR CON BÚSQUEDA CONTRA EL SERVIDOR.
 *
 * El catálogo mandaba al servidor «a partir de cientos o miles» desde su
 * primera versión y el componente no sabía hacerlo: filtraba con `includes`
 * sobre un array fijo. Una promesa publicada sin nada detrás.
 *
 * Lo que se fija aquí NO es que la consulta se haga —eso se ve enseguida—,
 * sino las cuatro cosas que fallan en SILENCIO cuando no están:
 *
 *   · la CARRERA — la respuesta de «an» llega después de la de «ana» y pinta
 *     los resultados de una búsqueda que ya nadie está haciendo
 *   · la ELECCIÓN que se evapora al seguir buscando, dejando el campo en
 *     blanco con un valor puesto
 *   · el BUCLE de una `onBuscar` escrita en línea, que se paga en peticiones
 *     al servidor de otro
 *   · el PARPADEO del esqueleto en cada tecla
 *
 * Ninguna de las cuatro rompe nada visible. Por eso hay prueba.
 *
 * ── POR QUÉ RELOJES DE VERDAD ────────────────────────────────────────────────
 *
 * No es una preferencia: es que aquí no hay otra cosa. `vi.useFakeTimers()`
 * con `userEvent` NO funciona con esta versión de `@testing-library/dom`. Su
 * `jestFakeTimersAreEnabled()` los detecta con `typeof jest !== 'undefined'`,
 * y bajo vitest eso da **siempre falso**: la librería toma su camino de
 * relojes reales, se queda esperando un `setTimeout(…, 0)` que los relojes
 * falsos ya no van a disparar, y se cuelga. Comprobado con un `<button>`
 * pelado y un solo `click` — mismo cuelgue, sin este componente por medio.
 *
 * Así que el rebote se acorta con la prop, que existe. Contra el reloj de
 * pared solo se miden los dos umbrales, y ahí el margen es 150 ms contra 300.
 */
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { SelectorBusqueda, type OpcionBusqueda } from '../src/SelectorBusqueda';

const INICIALES: OpcionBusqueda[] = [
  { valor: 'rec1', texto: 'Pérez Salazar, Ana' },
  { valor: 'rec2', texto: 'Rojas Vega, Luis' },
];

/** Una promesa que se resuelve cuando la prueba quiere y no cuando le toca. Es
 *  lo único con lo que se puede provocar una carrera a mano. */
function diferida<T>() {
  let cumplir!: (v: T) => void;
  const promesa = new Promise<T>((si) => { cumplir = si; });
  return { promesa, cumplir };
}

/** Corto para no alargar las pruebas, largo para que varias teclas seguidas
 *  caigan dentro de la misma ventana. */
const CORTO = 20;

const esperar = (ms: number) =>
  act(async () => { await new Promise((s) => setTimeout(s, ms)); });

let u: ReturnType<typeof userEvent.setup>;
beforeEach(() => { u = userEvent.setup(); });

const pintar = (
  props: Partial<React.ComponentProps<typeof SelectorBusqueda>> = {},
) =>
  render(
    <SelectorBusqueda
      etiqueta="Apoderado"
      modo="servidor"
      opciones={INICIALES}
      valor={null}
      onCambio={() => {}}
      onBuscar={async () => []}
      rebote={CORTO}
      {...props}
    />,
  );

const campo = () => screen.getByRole('combobox');

/* ── El rebote ───────────────────────────────────────────────────────────── */

describe('R118 · R18 · el rebote', () => {
  it('no pregunta a mitad de la ventana, y pregunta UNA vez por lo último tecleado', async () => {
    const onBuscar = vi.fn(async (_t: string, _s: AbortSignal) => [] as OpcionBusqueda[]);
    pintar({ onBuscar, rebote: 300 });
    await u.click(campo());
    await u.type(campo(), 'ana');

    await esperar(150);
    expect(onBuscar).not.toHaveBeenCalled();

    await waitFor(() => expect(onBuscar).toHaveBeenCalledTimes(1));
    // Una sola consulta y por lo ÚLTIMO tecleado: no una por tecla.
    expect(onBuscar.mock.calls[0][0]).toBe('ana');
  });

  it('con el campo vacío NO se pregunta: se vuelve a las opciones de partida', async () => {
    const onBuscar = vi.fn(async (_t: string, _s: AbortSignal) => [{ valor: 'x', texto: 'Zúñiga Peralta, Martín' }]);
    pintar({ onBuscar });
    await u.click(campo());
    await u.type(campo(), 'zu');
    await waitFor(() => expect(onBuscar).toHaveBeenCalledTimes(1));

    await u.clear(campo());
    await esperar(CORTO * 8);
    expect(onBuscar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Pérez Salazar, Ana')).toBeInTheDocument();
  });
});

/* ── Lo que de verdad falla en silencio ──────────────────────────────────── */

describe('R118 · R17 · el componente NO filtra lo que le devuelven', () => {
  it('pinta la respuesta aunque no case con lo tecleado', async () => {
    // Un alias, un DNI, una coincidencia aproximada: el servidor sabe por qué
    // la devuelve. Volver a filtrar aquí la escondería.
    pintar({ onBuscar: async () => [{ valor: 'd', texto: 'Huamán Soto, Pedro' }] });
    await u.click(campo());
    await u.type(campo(), '71234567');

    expect(await screen.findByText('Huamán Soto, Pedro')).toBeInTheDocument();
  });
});

describe('R118 · R18 · la carrera', () => {
  it('una respuesta vieja que llega tarde NO pisa a la nueva', async () => {
    const vieja = diferida<OpcionBusqueda[]>();
    const nueva = diferida<OpcionBusqueda[]>();
    const onBuscar = vi.fn()
      .mockReturnValueOnce(vieja.promesa)
      .mockReturnValueOnce(nueva.promesa);

    pintar({ onBuscar });
    await u.click(campo());
    await u.type(campo(), 'an');
    await waitFor(() => expect(onBuscar).toHaveBeenCalledTimes(1));
    await u.type(campo(), 'a');
    await waitFor(() => expect(onBuscar).toHaveBeenCalledTimes(2));

    // Llegan al revés: primero la nueva, y la vieja después.
    await act(async () => { nueva.cumplir([{ valor: 'n', texto: 'Ana la nueva' }]); });
    await act(async () => { vieja.cumplir([{ valor: 'v', texto: 'An la vieja' }]); });

    expect(screen.getByText('Ana la nueva')).toBeInTheDocument();
    expect(screen.queryByText('An la vieja')).not.toBeInTheDocument();
  });

  it('la consulta anterior se ABORTA, no solo se ignora', async () => {
    const senales: AbortSignal[] = [];
    const onBuscar = vi.fn(async (_t: string, s: AbortSignal) => { senales.push(s); return []; });
    pintar({ onBuscar });
    await u.click(campo());
    await u.type(campo(), 'an');
    await waitFor(() => expect(senales).toHaveLength(1));
    await u.type(campo(), 'a');
    await waitFor(() => expect(senales).toHaveLength(2));

    // Ignorar la respuesta arregla la pantalla; abortar además no gasta el
    // servidor de otro ni deja la conexión colgada.
    expect(senales[0].aborted).toBe(true);
    expect(senales[1].aborted).toBe(false);
  });
});

describe('R118 · R19 · la elección sobrevive a la siguiente búsqueda', () => {
  it('el campo sigue enseñando lo elegido cuando ya no está en ninguna lista', async () => {
    function Anfitrion() {
      const [valor, setValor] = useState<string | null>(null);
      return (
        <SelectorBusqueda
          etiqueta="Apoderado"
          modo="servidor"
          opciones={[]}
          valor={valor}
          onCambio={setValor}
          rebote={CORTO}
          onBuscar={async (t) =>
            t.startsWith('per')
              ? [{ valor: 'ana', texto: 'Pérez Salazar, Ana' }]
              : [{ valor: 'otro', texto: 'Torres Bejarano, Iván' }]
          }
        />
      );
    }
    render(<Anfitrion />);
    await u.click(campo());
    await u.type(campo(), 'perez');
    await u.click(await screen.findByText('Pérez Salazar, Ana'));
    expect(campo()).toHaveValue('Pérez Salazar, Ana');

    // Se vuelve a buscar otra cosa: Ana ya no viene en la respuesta.
    await u.click(campo());
    await u.type(campo(), 'torres');
    await screen.findByText('Torres Bejarano, Iván');
    await u.keyboard('{Escape}');

    // Antes de R118 esto salía EN BLANCO con `valor` puesto.
    expect(campo()).toHaveValue('Pérez Salazar, Ana');
  });
});

describe('R118 · R18 · `onBuscar` escrita en línea no dispara un bucle', () => {
  it('redibujar el padre no vuelve a preguntar', async () => {
    const espia = vi.fn();
    function Anfitrion() {
      const [n, setN] = useState(0);
      return (
        <>
          <button onClick={() => setN(n + 1)}>redibujar {n}</button>
          <SelectorBusqueda
            etiqueta="Apoderado"
            modo="servidor"
            opciones={[]}
            valor={null}
            onCambio={() => {}}
            rebote={CORTO}
            /* En línea a propósito: es como se escribe, y es lo que mete la
               función en las dependencias del efecto si se hace mal. */
            onBuscar={async (t) => { espia(t); return []; }}
          />
        </>
      );
    }
    render(<Anfitrion />);
    await u.click(campo());
    await u.type(campo(), 'ana');
    await waitFor(() => expect(espia).toHaveBeenCalledTimes(1));

    await u.click(screen.getByRole('button', { name: /redibujar/ }));
    await u.click(screen.getByRole('button', { name: /redibujar/ }));
    await esperar(CORTO * 10);

    expect(espia).toHaveBeenCalledTimes(1);
  });
});

/* ── El esqueleto y el fallo ─────────────────────────────────────────────── */

describe('R118 · R20 · el esqueleto solo si la consulta pasa del umbral', () => {
  it('bajo el umbral desde que sale la consulta no se pinta nada', async () => {
    const lenta = diferida<OpcionBusqueda[]>();
    const onBuscar = vi.fn(() => lenta.promesa);
    const { container } = pintar({ onBuscar });
    await u.click(campo());
    await u.type(campo(), 'ana');
    await waitFor(() => expect(onBuscar).toHaveBeenCalledTimes(1));

    // 150 ms de los 300 del umbral: todavía nada. Un parpadeo por tecla es lo
    // que el catálogo llama «se percibe como un fallo».
    await esperar(150);
    expect(container.querySelector('.sel-cargando')).toBeNull();
    expect(campo()).not.toHaveAttribute('aria-busy');

    await waitFor(() => expect(container.querySelector('.sel-cargando')).not.toBeNull());
    // Sin esto el lector anuncia una lista vacía y da por hecho que no hay nada.
    expect(campo()).toHaveAttribute('aria-busy', 'true');
    // Tres renglones, y con la clase del sistema: no se inventa otra.
    expect(container.querySelectorAll('.sel-cargando .esqueleto')).toHaveLength(3);

    await act(async () => { lenta.cumplir([{ valor: 'a', texto: 'Pérez Salazar, Ana' }]); });
    expect(container.querySelector('.sel-cargando')).toBeNull();
  });
});

describe('R118 · R20 · el fallo de la consulta', () => {
  it('no es un callejón: la fila reintenta', async () => {
    const onBuscar = vi.fn()
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValue([{ valor: 'a', texto: 'Pérez Salazar, Ana' }]);

    const { container } = pintar({ onBuscar });
    await u.click(campo());
    await u.type(campo(), 'ana');

    await waitFor(() => expect(container.querySelector('.sel-op.sel-fallo')).not.toBeNull());
    const fila = container.querySelector('.sel-op.sel-fallo')!;
    expect(fila.textContent).toContain('No se pudo buscar «ana»');
    // NO se reaprovecha el texto de «sin resultados»: mandan a sitios distintos.
    expect(screen.queryByText(/Prueba con menos letras/)).not.toBeInTheDocument();

    await u.click(fila);
    expect(await screen.findByText('Pérez Salazar, Ana')).toBeInTheDocument();
    expect(onBuscar).toHaveBeenCalledTimes(2);
    expect(container.querySelector('.sel-op.sel-fallo')).toBeNull();
  });

  it('y también con Enter: un estado que solo se sale con el ratón deja gente fuera', async () => {
    const onBuscar = vi.fn()
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValue([{ valor: 'a', texto: 'Pérez Salazar, Ana' }]);

    const { container } = pintar({ onBuscar });
    await u.click(campo());
    await u.type(campo(), 'ana');
    await waitFor(() => expect(container.querySelector('.sel-op.sel-fallo')).not.toBeNull());

    await u.keyboard('{Enter}');
    expect(await screen.findByText('Pérez Salazar, Ana')).toBeInTheDocument();
  });

  it('abortar NO es un fallo: cambiar de tecla no pinta un error', async () => {
    // Abortar es lo que hacemos NOSOTROS al teclear otra letra. Pintar un
    // error ahí sería acusar al servidor de algo que no ha hecho.
    const onBuscar = vi.fn((_t: string, s: AbortSignal) =>
      new Promise<OpcionBusqueda[]>((_si, no) => {
        s.addEventListener('abort', () => no(new DOMException('Abortada', 'AbortError')));
      }),
    );
    const { container } = pintar({ onBuscar });
    await u.click(campo());
    await u.type(campo(), 'an');
    await waitFor(() => expect(onBuscar).toHaveBeenCalledTimes(1));
    await u.type(campo(), 'a');
    await waitFor(() => expect(onBuscar).toHaveBeenCalledTimes(2));
    await esperar(CORTO * 4);

    expect(container.querySelector('.sel-op.sel-fallo')).toBeNull();
  });

  it('sobre el fallo no se ofrece «Crear»: ahí no se sabe si existe o no', async () => {
    const onCrear = vi.fn();
    const { container } = pintar({
      onBuscar: async () => { throw new Error('502'); },
      onCrear,
    });
    await u.click(campo());
    await u.type(campo(), 'Huaraz Vega, Ana');
    await waitFor(() => expect(container.querySelector('.sel-op.sel-fallo')).not.toBeNull());

    expect(screen.queryByText(/Crear/)).not.toBeInTheDocument();
    // Y Enter reintenta en vez de dar de alta a nadie.
    await u.keyboard('{Enter}');
    expect(onCrear).not.toHaveBeenCalled();
  });
});

/* ── Que no se rompa lo de antes ─────────────────────────────────────────── */

describe('R118 · R17 · `navegador` sigue siendo lo de siempre', () => {
  it('sin `modo` no se pregunta nada y se filtra en local', async () => {
    const onBuscar = vi.fn(async (_t: string, _s: AbortSignal) => [] as OpcionBusqueda[]);
    render(
      <SelectorBusqueda
        etiqueta="Apoderado"
        opciones={INICIALES}
        valor={null}
        onCambio={() => {}}
        onBuscar={onBuscar}
        rebote={CORTO}
      />,
    );
    await u.click(campo());
    await u.type(campo(), 'perez');
    await esperar(CORTO * 10);

    expect(onBuscar).not.toHaveBeenCalled();
    // Y sigue ignorando tildes, que es el contrato de siempre.
    expect(screen.getByText('Pérez Salazar, Ana')).toBeInTheDocument();
    expect(screen.queryByText('Rojas Vega, Luis')).not.toBeInTheDocument();
  });
});
