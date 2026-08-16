/**
 * Interruptor, selección múltiple, estados, aviso, progreso y tarjetas.
 * Se prueba la promesa de cada uno, no que rendericen.
 */

import { render, screen, within, waitFor } from '@testing-library/react';
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
  it('el éxito es status; el error es alert', () => {
    const { rerender } = render(<Aviso tono="exito" texto="Guardado" onCerrar={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Guardado');
    rerender(<Aviso tono="error" texto="No se pudo guardar" onCerrar={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar');
  });

  it('el error NO se va solo, aunque le pasen duración', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    render(<Aviso tono="error" texto="Falló" onCerrar={fn} duracion={1000} />);
    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('el éxito sí se va solo', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    render(<Aviso tono="exito" texto="Guardado" onCerrar={fn} duracion={1000} />);
    vi.advanceTimersByTime(1100);
    expect(fn).toHaveBeenCalled();
    vi.useRealTimers();
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
