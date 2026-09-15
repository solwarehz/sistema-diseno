/**
 * Interruptor, selección múltiple, estados, aviso, progreso y tarjetas.
 * Se prueba la promesa de cada uno, no que rendericen.
 */

import { render, screen, within, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Interruptor, SeleccionMultiple } from '../src/Interruptor';
import { EstadoPantalla, Aviso, Progreso } from '../src/Estados';
import { Tarjeta, TarjetaAccion, TarjetaPersona } from '../src/Tarjeta';

describe('Interruptor', () => {
  it('tiene nombre accesible: el <label> NO nombra a un <button>', () => {
    render(<Interruptor etiqueta="Notificar tardanzas" activo={false} onCambio={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Notificar tardanzas' })).toBeInTheDocument();
  });

  it('surte efecto al instante, sin Guardar', async () => {
    const u = userEvent.setup();
    const fn = vi.fn();
    render(<Interruptor etiqueta="Modo compacto" activo={false} onCambio={fn} />);
    await u.click(screen.getByRole('switch'));
    expect(fn).toHaveBeenCalledWith(true);
  });

  it('el estado se anuncia con aria-checked', () => {
    const { rerender } = render(<Interruptor etiqueta="X" activo={false} onCambio={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    rerender(<Interruptor etiqueta="X" activo onCambio={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('deshabilitado usa aria-disabled: sigue siendo alcanzable y anunciable', async () => {
    const u = userEvent.setup();
    const fn = vi.fn();
    render(<Interruptor etiqueta="X" activo={false} onCambio={fn} deshabilitado />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-disabled', 'true');
    expect(sw).not.toBeDisabled();
    await u.click(sw);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('Selección múltiple', () => {
  const OPS = [
    { valor: 'a', texto: 'Inicial' },
    { valor: 'b', texto: 'Primaria' },
    { valor: 'c', texto: 'Secundaria' },
  ];

  it('el grupo tiene nombre: fieldset con legend, no un div con texto', () => {
    render(<SeleccionMultiple titulo="Niveles" opciones={OPS} valores={[]} onCambio={() => {}} />);
    expect(screen.getByRole('group', { name: 'Niveles' })).toBeInTheDocument();
  });

  it('varias respuestas: casillas que se acumulan', async () => {
    const u = userEvent.setup();
    const fn = vi.fn();
    render(<SeleccionMultiple titulo="Niveles" opciones={OPS} valores={['a']} onCambio={fn} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    await u.click(screen.getByLabelText('Primaria'));
    expect(fn).toHaveBeenCalledWith(['a', 'b']);
  });

  it('respuesta única: botones de opción, y sustituye en vez de acumular', async () => {
    const u = userEvent.setup();
    const fn = vi.fn();
    render(<SeleccionMultiple titulo="Nivel" opciones={OPS} valores={['a']} onCambio={fn} modo="unica" />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    await u.click(screen.getByLabelText('Secundaria'));
    expect(fn).toHaveBeenCalledWith(['c']);
  });
});

describe('Estados de pantalla', () => {
  it('cargando se anuncia ocupado y no inventa contenido', () => {
    const { container } = render(<EstadoPantalla tipo="cargando" titulo="" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('.esqueleto').length).toBeGreaterThan(0);
  });

  it('«sin resultados» y «primera vez» ofrecen acciones DISTINTAS', async () => {
    const quitar = vi.fn();
    const { rerender } = render(
      <EstadoPantalla tipo="sin-resultados" titulo="Sin resultados para «perez»"
        accion={{ texto: 'Quitar filtros', onClick: quitar }} />
    );
    expect(screen.getByRole('button', { name: 'Quitar filtros' })).toBeInTheDocument();

    rerender(
      <EstadoPantalla tipo="primera-vez" titulo="Todavía no hay trabajadores"
        accion={{ texto: 'Registrar trabajador', onClick: () => {} }} />
    );
    expect(screen.getByRole('button', { name: 'Registrar trabajador' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar filtros' })).not.toBeInTheDocument();
  });

  it('el fallo de dibujado ofrece Recargar y muestra referencia', () => {
    render(
      <EstadoPantalla tipo="fallo-dibujado" titulo="No pudimos mostrar esta pantalla"
        referencia="7K4M-92" accion={{ texto: 'Recargar la pantalla', onClick: () => {} }} />
    );
    expect(screen.getByText(/7K4M-92/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recargar la pantalla' })).toBeInTheDocument();
  });
});

describe('Aviso temporal', () => {
  it('[1] y [2] el éxito es status —no interrumpe la lectura— y el error es alert', () => {
    const { rerender } = render(<Aviso tono="exito" texto="Guardado" onCerrar={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Guardado');
    rerender(<Aviso tono="error" texto="No se pudo guardar" onCerrar={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar');
  });

  /* `try/finally` EN TODA PRUEBA CON TEMPORIZADORES FALSOS. Sin él, una que
     falle se deja los falsos puestos y envenena TODAS las siguientes del
     archivo: al cambiar el aviso, una sola prueba rota se llevó por delante
     seis de Tarjetas que no tienen nada que ver, con «Test timed out». El
     diagnóstico que se lee entonces es el equivocado. */
  it('[2] el error NO se va solo, aunque le pasen duración', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      render(<Aviso tono="error" texto="Falló" onCerrar={fn} duracion={1000} />);
      vi.advanceTimersByTime(5000);
      expect(fn).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('[5] el éxito se va solo, pero DESVANECIÉNDOSE: primero sale, después avisa', () => {
    /* Entraba animado y salía de un fotograma a otro. Ahora el temporizador no
       llama a `onCerrar`: quita `.av-dentro` y deja que la transición corra; el
       desmontaje llega cuando termina. Sin esto, el producto lo arrancaba de la
       pantalla y se leía como un fallo de pintado — que es exactamente por lo
       que se animó la entrada. */
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { container } = render(<Aviso tono="exito" texto="Guardado" onCerrar={fn} duracion={1000} />);
      const av = container.querySelector('.av')!;
      act(() => { vi.advanceTimersByTime(1100); });
      expect(av.className, 'no empezó a salir').not.toContain('av-dentro');
      expect(fn, 'desmontó sin dar tiempo a la transición').not.toHaveBeenCalled();
      act(() => { vi.advanceTimersByTime(500); });
      expect(fn, 'se quedó a medio salir y no cerró nunca').toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('[4] dura DOS segundos por omisión, no cinco', () => {
    /* Lo pidió el responsable el 2026-09-15: «máximo que permanezcan en 2seg,
       creo está 5seg, es mucho, son muy intrusivas». El 5000 estaba escrito en
       el componente. */
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { container } = render(<Aviso tono="exito" texto="Guardado" onCerrar={fn} />);
      const av = container.querySelector('.av')!;
      act(() => { vi.advanceTimersByTime(1900); });
      expect(av.className, 'se fue antes de los 2 s').toContain('av-dentro');
      act(() => { vi.advanceTimersByTime(200); });
      expect(av.className, 'sigue dentro pasados los 2 s').not.toContain('av-dentro');
    } finally { vi.useRealTimers(); }
  });

  it('[4] y ese número sale de la HOJA, no del componente', () => {
    /* `--permanencia-aviso` existía, el catálogo lo publicaba como «cuánto
       queda en pantalla un aviso temporal» y NO LO LEÍA NADIE: cero usos en la
       hoja. Dos fuentes de verdad, y la documentada era la decorativa. */
    vi.useFakeTimers();
    const real = window.getComputedStyle;
    try {
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => ({
        ...real(el),
        getPropertyValue: (prop: string) => (prop === '--permanencia-aviso' ? '4s' : ''),
      }) as CSSStyleDeclaration);
      const fn = vi.fn();
      const { container } = render(<Aviso tono="exito" texto="Guardado" onCerrar={fn} />);
      const av = container.querySelector('.av')!;
      act(() => { vi.advanceTimersByTime(2100); });
      expect(av.className, 'ignoró la hoja y usó su número de dentro').toContain('av-dentro');
      act(() => { vi.advanceTimersByTime(2000); });
      expect(av.className, 'no llegó a irse con los 4 s de la hoja').not.toContain('av-dentro');
    } finally { vi.useRealTimers(); vi.restoreAllMocks(); }
  });

  /* jsdom NO despacha `transitionend` por su cuenta, así que sin estas pruebas
     TODO el camino normal del cierre quedaba sin tocar: cada prueba del aviso
     recorría el respaldo de 400 ms. Se podía borrar el oyente entero, invertir
     su filtro o recortar el respaldo, y las 885 seguían en verde. Lo midió una
     auditoría: ocho mutaciones vivas. */
  const finDeTransicion = (el: Element, prop: string, desde: Element = el) => {
    const e = new Event('transitionend', { bubbles: true }) as TransitionEvent;
    Object.defineProperty(e, 'propertyName', { value: prop });
    act(() => { desde.dispatchEvent(e); });
  };

  it('[5] al ACABAR el desvanecido cierra, sin esperar al respaldo', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { container } = render(<Aviso tono="exito" texto="Guardado" onCerrar={fn} duracion={1000} />);
      const av = container.querySelector('.av')!;
      act(() => { vi.advanceTimersByTime(1100); });
      expect(fn).not.toHaveBeenCalled();
      finDeTransicion(av, 'opacity');
      expect(fn, 'la transición acabó y el aviso siguió ahí').toHaveBeenCalledTimes(1);
      // Y el respaldo ya no vuelve a cerrar: una sola llamada.
      act(() => { vi.advanceTimersByTime(1000); });
      expect(fn, 'cerró dos veces').toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });

  it('[5] pero NO cierra con la transición de otra propiedad', () => {
    /* `.av` transiciona `transform` y `opacity`. La de `transform` termina
       antes de que el aviso haya acabado de desaparecer. */
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { container } = render(<Aviso tono="exito" texto="Guardado" onCerrar={fn} duracion={1000} />);
      const av = container.querySelector('.av')!;
      act(() => { vi.advanceTimersByTime(1100); });
      finDeTransicion(av, 'transform');
      expect(fn, 'se fue a mitad del desvanecido').not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('[5] ni con la de un HIJO: `transitionend` burbujea', () => {
    /* La acción es un nodo del producto. Con una hoja propia que transicione la
       opacidad de ese botón, el aviso se cerraba antes de tiempo. */
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { container } = render(
        <Aviso tono="exito" texto="Guardado" onCerrar={fn} duracion={1000}
          accion={{ texto: 'Deshacer', onClick: () => {} }} />
      );
      const av = container.querySelector('.av')!;
      const hijo = container.querySelector('.av-accion')!;
      act(() => { vi.advanceTimersByTime(1100); });
      finDeTransicion(av, 'opacity', hijo);
      expect(fn, 'la transición de un hijo cerró el aviso').not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('[5] y si la transición no corre, el respaldo lo cierra igual', () => {
    /* Un producto con `transition: none`, o el aviso oculto: sin respaldo se
       quedaría en pantalla para siempre, que es el peor final posible. */
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      render(<Aviso tono="exito" texto="Guardado" onCerrar={fn} duracion={1000} />);
      act(() => { vi.advanceTimersByTime(1100); });
      act(() => { vi.advanceTimersByTime(399); });
      expect(fn, 'el respaldo se disparó antes de tiempo').not.toHaveBeenCalled();
      act(() => { vi.advanceTimersByTime(2); });
      expect(fn, 'sin transición, el aviso se quedaría para siempre').toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('[3] el cursor encima PARA el reloj, y quitarlo lo reanuda', () => {
    /* Regla 3, obligatoria desde hace versiones y sin una sola prueba: apagarla
       dejaba los 18 candados y las 885 en verde. Y es la que justifica bajar de
       5 s a 2 s — el tiempo lo da la pausa, no el reloj. */
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { container } = render(<Aviso tono="exito" texto="Guardado" onCerrar={fn} duracion={1000} />);
      const av = container.querySelector('.av')!;
      act(() => { fireEvent.mouseEnter(av); });
      act(() => { vi.advanceTimersByTime(5000); });
      expect(av.className, 'el reloj corrió con el cursor encima').toContain('av-dentro');
      act(() => { fireEvent.mouseLeave(av); });
      act(() => { vi.advanceTimersByTime(1100); });
      expect(av.className, 'al retirar el cursor no se reanudó').not.toContain('av-dentro');
    } finally { vi.useRealTimers(); }
  });

  it('[3] y el FOCO dentro también: si no, Deshacer nunca se alcanza con teclado', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { container } = render(
        <Aviso tono="exito" texto="Guardado" onCerrar={fn} duracion={1000}
          accion={{ texto: 'Deshacer', onClick: () => {} }} />
      );
      const av = container.querySelector('.av')!;
      act(() => { fireEvent.focus(container.querySelector('.av-accion')!); });
      act(() => { vi.advanceTimersByTime(5000); });
      expect(av.className, 'se fue con el foco dentro').toContain('av-dentro');
    } finally { vi.useRealTimers(); }
  });

  it('[4] pulsar la acción CIERRA el aviso: deshacer deja de ser verdad lo que dice', () => {
    vi.useFakeTimers();
    try {
      const alPulsar = vi.fn();
      const fn = vi.fn();
      const { container } = render(
        <Aviso tono="exito" texto="Se archivaron 12 expedientes" onCerrar={fn}
          accion={{ texto: 'Deshacer', onClick: alPulsar }} />
      );
      const av = container.querySelector('.av')!;
      /* PRIMERO ENTRA. Con relojes falsos `requestAnimationFrame` también lo
         es, así que sin avanzarlo el aviso nunca llega a llevar `.av-dentro` y
         la comprobación de abajo pasaría sola: la prueba no podría fallar. */
      act(() => { vi.advanceTimersByTime(20); });
      expect(av.className, 'el aviso no llegó a entrar: la prueba no mediría nada').toContain('av-dentro');
      act(() => { screen.getByRole('button', { name: 'Deshacer' }).click(); });
      expect(alPulsar).toHaveBeenCalled();
      expect(av.className, 'deshizo y el aviso se quedó diciendo lo contrario').not.toContain('av-dentro');
    } finally { vi.useRealTimers(); }
  });

  it('[5] cerrar a mano también se desvanece: el aviso se va de UNA sola forma', () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const { container } = render(<Aviso tono="info" texto="X" onCerrar={fn} />);
      const av = container.querySelector('.av')!;
      act(() => { screen.getByRole('button', { name: 'Cerrar aviso' }).click(); });
      expect(av.className, 'cerrar a mano lo arrancó de golpe').not.toContain('av-dentro');
      expect(fn).not.toHaveBeenCalled();
      act(() => { vi.advanceTimersByTime(500); });
      expect(fn).toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('el botón de cerrar tiene nombre', () => {
    render(<Aviso tono="info" texto="X" onCerrar={() => {}} />);
    expect(screen.getByRole('button', { name: 'Cerrar aviso' })).toBeInTheDocument();
  });

  /* R50 · El aviso nacía INVISIBLE. `.av` arranca con `opacity: 0` y
     `.av-dentro` es lo que lo trae a la vista; el componente no la añadía
     nunca. En cada producto el aviso se montaba, ocupaba su sitio, se
     anunciaba al lector de pantalla — y no se veía. Ni uno. En el catálogo sí,
     porque allí la pone el guion de la página. Lo reportó Control
     Administrativos V2.0, que lo suplía recorriendo el DOM desde fuera. */
  it('R50 · el aviso se hace visible solo: añade av-dentro', async () => {
    const { container } = render(<Aviso tono="exito" texto="Guardado" onCerrar={() => {}} />);
    const av = container.querySelector('.av')!;
    await waitFor(() => expect(av.className).toContain('av-dentro'));
  });

  it('R50 · y conserva su tono al hacerse visible', async () => {
    const { container } = render(<Aviso tono="error" texto="Falló" onCerrar={() => {}} />);
    const av = container.querySelector('.av')!;
    await waitFor(() => expect(av.className).toContain('av-dentro'));
    expect(av.className).toContain('av-error');
  });
});

describe('Barra de progreso', () => {
  it('determinada expone valor, mínimo y máximo', () => {
    render(<Progreso etiqueta="Importando trabajadores" valor={62} />);
    const barra = screen.getByRole('progressbar', { name: 'Importando trabajadores' });
    expect(barra).toHaveAttribute('aria-valuenow', '62');
    expect(barra).toHaveAttribute('aria-valuemax', '100');
  });

  it('indeterminada NO inventa un valor: decir 0 sería mentir', () => {
    render(<Progreso etiqueta="Conectando" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });
});

describe('Tarjetas', () => {
  it('la tarjeta pulsable es un <button>, alcanzable con teclado', async () => {
    const u = userEvent.setup();
    const fn = vi.fn();
    render(<Tarjeta titulo="Asistencia" onClick={fn}>128 registros</Tarjeta>);
    const b = screen.getByRole('button', { name: /Asistencia/ });
    await u.click(b);
    expect(fn).toHaveBeenCalled();
  });

  it('sin onClick es un <article>, no un botón falso', () => {
    render(<Tarjeta titulo="Asistencia">128</Tarjeta>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  /* R57 · El medio. Las reglas de la HOJA viven en `hoja.test.ts`. */
  it('R57 · el medio va ANTES del título y la imagen es decorativa por omisión', () => {
    const { container } = render(
      <Tarjeta titulo="Informe anual" medio="/foto.webp">Contenido</Tarjeta>
    );
    const tarjeta = container.querySelector('.tn')!;
    const medio = tarjeta.querySelector('.tn-medio')!;
    // Primer hijo: antes de .tn-cab. Es la disposición normal de una tarjeta
    // con imagen, y es justo lo que no se podía hacer sin la ranura.
    expect(tarjeta.firstElementChild).toBe(medio);
    const img = medio.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/foto.webp');
    // alt vacío: el título ya la nombra, y con alt el lector lo diría dos veces.
    expect(img.getAttribute('alt')).toBe('');
  });

  it('R57 · con medioAlt la imagen deja de ser decorativa', () => {
    render(<Tarjeta medio="/plano.webp" medioAlt="Plano del pabellón B">x</Tarjeta>);
    expect(screen.getByAltText('Plano del pabellón B')).toBeInTheDocument();
  });

  it('R57 · sin imagen pero con hueco reservado no sale un agujero', () => {
    const { container } = render(<Tarjeta conMedio>Contenido</Tarjeta>);
    const medio = container.querySelector('.tn-medio')!;
    expect(medio).toBeInTheDocument();
    expect(medio.querySelector('img')).toBeNull();
    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
  });

  it('R57 · sin pedir medio no se reserva hueco: la tarjeta de siempre no cambia', () => {
    const { container } = render(<Tarjeta titulo="Asistencia">128</Tarjeta>);
    expect(container.querySelector('.tn-medio')).toBeNull();
  });

  /* R58 · La hoja estilaba h4 y el componente emitía h3: el título salía sin
     estilo en cada producto y bien en el catálogo. Ahora el nivel lo elige el
     producto y la hoja estiliza los tres. */
  it('R58 · el nivel del encabezado lo pone el producto', () => {
    const { container } = render(
      <Tarjeta titulo="Asistencia" nivelTitulo={2}>128</Tarjeta>
    );
    expect(container.querySelector('.tn-cab h2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Asistencia' })).toBeInTheDocument();
  });

  it('R58 · por omisión es h3, y la hoja lo estiliza igual que h2 y h4', () => {
    const { container } = render(<Tarjeta titulo="Asistencia">128</Tarjeta>);
    expect(container.querySelector('.tn-cab h3')).toBeInTheDocument();
  });
});

describe('Tarjeta de acción · R59', () => {
  it('la imagen, el título y el botón llevan a LA MISMA acción', async () => {
    const u = userEvent.setup();
    const ir = vi.fn();
    const { container } = render(
      <TarjetaAccion titulo="Registro de asistencia" texto="128 registros"
        foto="/f.webp" onAccion={ir} textoBoton="Ver" />
    );
    // El título es el control real.
    await u.click(screen.getByRole('button', { name: 'Registro de asistencia' }));
    expect(ir).toHaveBeenCalledTimes(1);
    // La imagen y el botón caen sobre la MISMA zona: el ::after del disparo se
    // estira sobre la tarjeta. jsdom no resuelve diseño, así que lo que se
    // comprueba es que no hay OTRO control que pudiera hacer otra cosa.
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });

  it('una sola parada de tabulador para una sola acción, no cuatro', async () => {
    const u = userEvent.setup();
    render(
      <TarjetaAccion titulo="Ficha" texto="x" foto="/f.webp" onAccion={vi.fn()} />
    );
    await u.tab();
    expect(screen.getByRole('button', { name: 'Ficha' })).toHaveFocus();
    // Y la siguiente tabulación YA SALE de la tarjeta.
    await u.tab();
    expect(screen.getByRole('button', { name: 'Ficha' })).not.toHaveFocus();
  });

  it('el botón del pie es señal, no control: no lo ve el lector ni el tabulador', () => {
    const { container } = render(
      <TarjetaAccion titulo="Ficha" onAccion={vi.fn()} textoBoton="Abrir" />
    );
    const senal = container.querySelector('.tn-pie .btn')!;
    expect(senal.tagName).toBe('SPAN');
    expect(senal).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button', { name: 'Abrir' })).not.toBeInTheDocument();
  });

  it('por omisión NO se puede editar la foto', () => {
    const { container } = render(
      <TarjetaAccion titulo="Ficha" foto="/f.webp" onAccion={vi.fn()}
        onEditarFoto={vi.fn()} />
    );
    expect(container.querySelector('.tna-editar')).toBeNull();
  });

  it('en solo lectura se SIGUE entrando: bloquear la edición no apaga la acción', async () => {
    const u = userEvent.setup();
    const ir = vi.fn();
    render(<TarjetaAccion titulo="Ficha" foto="/f.webp" onAccion={ir} editable={false} />);
    await u.click(screen.getByRole('button', { name: 'Ficha' }));
    expect(ir).toHaveBeenCalled();
  });

  it('editable saca el control de la foto, y hace lo SUYO, no la acción', async () => {
    const u = userEvent.setup();
    const ir = vi.fn();
    const editar = vi.fn();
    const { container } = render(
      <TarjetaAccion titulo="Ficha" foto="/f.webp" onAccion={ir}
        editable onEditarFoto={editar} textoEditarFoto="Cambiar imagen" />
    );
    // Va DENTRO del medio: por encima de la zona pulsable, no al lado.
    expect(container.querySelector('.tn-medio .tna-editar')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Cambiar imagen' }));
    expect(editar).toHaveBeenCalledTimes(1);
    expect(ir).not.toHaveBeenCalled();
  });

  it('editable sin onEditarFoto no saca un botón que no hace nada', () => {
    const { container } = render(
      <TarjetaAccion titulo="Ficha" foto="/f.webp" onAccion={vi.fn()} editable />
    );
    expect(container.querySelector('.tna-editar')).toBeNull();
  });

  it('sin foto reserva el hueco igual, y sigue siendo pulsable', () => {
    const { container } = render(<TarjetaAccion titulo="Ficha" onAccion={vi.fn()} />);
    expect(container.querySelector('.tn-medio')).toBeInTheDocument();
    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ficha' })).toBeInTheDocument();
  });


  it('la tarjeta de persona dice el estado con TEXTO, no solo con el filete', () => {
    const { container } = render(
      <TarjetaPersona id="71234567" nombre="QUISPE MAMANI, Rosa" cargo="Docente"
        estado={{ tono: 'exito', texto: 'Asistió' }} dato="07:42" />
    );
    expect(screen.getByText('Asistió')).toBeInTheDocument();
    expect(container.querySelector('.tp-exito')).toBeInTheDocument();
  });

  it('el avatar de la tarjeta usa el id, no el nombre', () => {
    const { container } = render(
      <TarjetaPersona id="71234567" nombre="QUISPE MAMANI, Rosa" />
    );
    const av = container.querySelector('.avatar')!;
    expect([...av.classList].some((c) => /^avatar-[1-4]$/.test(c))).toBe(true);
    expect(av).toHaveTextContent('QR');
  });
});

describe('Estados de pantalla · R81 · acceso suspendido', () => {
  /* No es `sin-permiso`. Ese manda a hablar con quien administra la
     aplicación, y aquí el administrador NO puede levantar la suspensión.
     Usar el tipo equivocado manda a la persona a la puerta equivocada. */
  it('existe como tipo propio y se distingue de sin-permiso en el marcado', () => {
    const { container, rerender } = render(
      <EstadoPantalla tipo="acceso-suspendido" titulo="Acceso suspendido"
        linea="Escribe a tesorería para reactivarlo." />
    );
    expect(container.querySelector('.ep-acceso-suspendido')).toBeInTheDocument();
    expect(container.querySelector('.ep-sin-permiso')).toBeNull();

    rerender(<EstadoPantalla tipo="sin-permiso" titulo="Sin permiso" />);
    expect(container.querySelector('.ep-sin-permiso')).toBeInTheDocument();
    expect(container.querySelector('.ep-acceso-suspendido')).toBeNull();
  });

  it('la línea dice a quién acudir, y la pinta el componente', () => {
    render(
      <EstadoPantalla tipo="acceso-suspendido" titulo="Acceso suspendido"
        linea="Escribe a tesorería para reactivarlo." />
    );
    expect(screen.getByText('Escribe a tesorería para reactivarlo.')).toBeInTheDocument();
  });
});

describe('Interruptor · R65 · la etiqueta admite marcado', () => {
  it('acepta nodos, no solo texto', () => {
    const { container } = render(
      <Interruptor activo={false} onCambio={() => {}}
        etiqueta={<><strong>Tesorería</strong> — cobros y pagos</>} />
    );
    expect(container.querySelector('.sw-et strong')).toHaveTextContent('Tesorería');
  });

  it('y el nombre accesible NO se resiente: sale del subárbol completo', () => {
    render(
      <Interruptor activo={false} onCambio={() => {}}
        etiqueta={<><strong>Tesorería</strong> — cobros y pagos</>} />
    );
    expect(screen.getByRole('switch', { name: 'Tesorería — cobros y pagos' })).toBeInTheDocument();
  });
});

describe('Interruptor · R66 · cerrado por regla', () => {
  /* No es «apagado» ni «deshabilitado». Deshabilitado se lee como «ahora no,
     vuelve luego» e invita a buscar la forma de encenderlo; aquí el mensaje es
     el contrario. El caso que lo motiva es de seguridad: quien reparte
     privilegios no puede conceder los que él mismo no tiene. */
  it('el interruptor desaparece: lo que no puede cambiar nunca no es un interruptor', () => {
    const { container } = render(
      <Interruptor etiqueta="Tesorería" activo={false} onCambio={() => {}}
        cerrado="No puedes conceder un privilegio que tú no tienes." />
    );
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(container.querySelector('.sw-candado')).toBeInTheDocument();
  });

  it('el motivo se ve SIEMPRE: un candado sin explicación se lee como un fallo', () => {
    render(
      <Interruptor etiqueta="Tesorería" activo={false} onCambio={() => {}}
        cerrado="No puedes conceder un privilegio que tú no tienes." />
    );
    expect(screen.getByText('No puedes conceder un privilegio que tú no tienes.')).toBeInTheDocument();
  });

  it('la opción NO se oculta: el rótulo sigue ahí', () => {
    render(
      <Interruptor etiqueta="Tesorería" activo={false} onCambio={() => {}} cerrado="Regla." />
    );
    expect(screen.getByText('Tesorería')).toBeInTheDocument();
  });

  it('manda sobre deshabilitado: lo permanente gana a lo temporal', () => {
    const { container } = render(
      <Interruptor etiqueta="Tesorería" activo={false} onCambio={() => {}}
        deshabilitado cerrado="Regla." />
    );
    expect(container.querySelector('.sw-cerrado')).toBeInTheDocument();
    expect(container.querySelector('.sw-desh')).toBeNull();
  });

  it('sin `cerrado` sigue siendo el interruptor de siempre', () => {
    render(<Interruptor etiqueta="Notificar" activo={false} onCambio={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Notificar' })).toBeInTheDocument();
  });
});
