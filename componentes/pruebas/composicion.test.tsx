/**
 * Interruptor, selección múltiple, estados, aviso, progreso y tarjetas.
 * Se prueba la promesa de cada uno, no que rendericen.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Interruptor, SeleccionMultiple } from '../src/Interruptor';
import { EstadoPantalla, Aviso, Progreso } from '../src/Estados';
import { Tarjeta, TarjetaPersona } from '../src/Tarjeta';

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
