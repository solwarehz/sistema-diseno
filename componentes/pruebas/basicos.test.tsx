/**
 * Los siete de uso constante. Se prueba lo que el sistema PROMETE de cada uno,
 * no que rendericen: que rendericen ya lo dice TypeScript.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Boton } from '../src/Boton';
import { Chip } from '../src/Chip';
import { Enlace } from '../src/Enlace';
import { Campo, Selector } from '../src/Campo';
import { Avatar, colorIdentidad, iniciales } from '../src/Avatar';
import { Paginacion } from '../src/Paginacion';

describe('Botón', () => {
  it('la variante la elige la ACCIÓN y se refleja en la clase', () => {
    const { container } = render(
      <>
        <Boton variante="principal">Guardar</Boton>
        <Boton variante="destructiva">Eliminar</Boton>
        <Boton variante="neutra">Cancelar</Boton>
      </>
    );
    expect(container.querySelector('.btn-1')).toHaveTextContent('Guardar');
    expect(container.querySelector('.btn-destr')).toHaveTextContent('Eliminar');
    expect(container.querySelector('.btn-neutro')).toHaveTextContent('Cancelar');
  });

  it('el icono va oculto al lector: quien nombra es el botón', () => {
    const { container } = render(<Boton icono={<svg />}>Exportar</Boton>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
  });

  it('avisa si es solo icono y le falta el nombre accesible', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Boton soloIcono icono={<svg />} />);
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('aria-label'));
    aviso.mockRestore();
  });

  it('type=button por omisión: dentro de un formulario no lo envía sin querer', () => {
    render(<Boton>Filtros</Boton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});

describe('Chip', () => {
  it('lleva SIEMPRE texto: el color solo no distingue nada', () => {
    render(<Chip tono="exito">Activo</Chip>);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('el tono va en la clase, y el texto es independiente del tono', () => {
    const { container } = render(<Chip tono="error">Deuda</Chip>);
    expect(container.querySelector('.chip-error')).toHaveTextContent('Deuda');
  });
});

describe('Enlace', () => {
  it('en prosa va subrayado; en interfaz, no', () => {
    const { container } = render(
      <>
        <Enlace href="#a">requisitos</Enlace>
        <Enlace href="#b" contexto="interfaz">Editar</Enlace>
      </>
    );
    expect(container.querySelector('.enl-sub')).toHaveTextContent('requisitos');
    expect(container.querySelector('.enl-nosub')).toHaveTextContent('Editar');
  });

  it('el externo avisa de que abre fuera, y va seguro', () => {
    render(<Enlace href="https://x.test" externo>Portal</Enlace>);
    const a = screen.getByRole('link', { name: /Portal/ });
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    expect(a).toHaveTextContent('se abre en una pestaña nueva');
  });
});

describe('Campo', () => {
  it('la etiqueta es visible y está vinculada, no es el placeholder', () => {
    render(<Campo etiqueta="Documento de identidad" placeholder="71234567" />);
    const input = screen.getByLabelText('Documento de identidad');
    expect(input).toHaveAttribute('placeholder', '71234567');
    expect(screen.getByText('Documento de identidad')).toBeInTheDocument();
  });

  it('el error marca el campo y se vincula con aria-describedby', () => {
    render(<Campo etiqueta="Correo" error="No parece un correo válido" />);
    const input = screen.getByLabelText('Correo');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const id = input.getAttribute('aria-describedby')!;
    expect(document.getElementById(id.split(' ')[0])).toHaveTextContent('No parece un correo válido');
  });

  it('sin error no hay aria-invalid: no se marca lo que está bien', () => {
    render(<Campo etiqueta="Correo" />);
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid');
  });
});

describe('Selector', () => {
  it('la opción vacía solo existe si se pide', () => {
    const { rerender } = render(
      <Selector etiqueta="Grado" opciones={[{ valor: '1', texto: 'Primero' }]} vacio="Elegir…" />
    );
    expect(screen.getAllByRole('option')).toHaveLength(2);
    rerender(<Selector etiqueta="Grado" opciones={[{ valor: '1', texto: 'Primero' }]} />);
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });
});

describe('Avatar', () => {
  it('el color sale del IDENTIFICADOR, no del nombre', () => {
    // Mismo id y distinto nombre → mismo color. Un cambio de apellido no puede
    // cambiarle el color a nadie.
    expect(colorIdentidad('71234567')).toBe(colorIdentidad('71234567'));
    const { container: a } = render(<Avatar id="71234567" nombre="QUISPE MAMANI, Rosa" />);
    const { container: b } = render(<Avatar id="71234567" nombre="QUISPE DE LA CRUZ, Rosa" />);
    const clase = (c: HTMLElement) => [...c.querySelector('.avatar')!.classList].find((x) => /^avatar-[1-4]$/.test(x));
    expect(clase(a)).toBe(clase(b));
  });

  it('es determinista: el mismo id da el mismo color siempre', () => {
    const uno = colorIdentidad('45120983');
    for (let i = 0; i < 5; i++) expect(colorIdentidad('45120983')).toBe(uno);
  });

  it('las iniciales salen del primer apellido y del nombre', () => {
    expect(iniciales('QUISPE MAMANI, Rosa')).toBe('QR');
    expect(iniciales('PINEDA HUAMÁN, José')).toBe('PJ');
  });

  it('con foto, el alt va vacío para no decir el nombre dos veces', () => {
    const { container } = render(<Avatar id="1" nombre="ROJAS, Luis" foto="/x.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});

describe('Paginación', () => {
  it('con una sola página no se pinta', () => {
    const { container } = render(<Paginacion pagina={1} totalPaginas={1} onPagina={() => {}} de="Personal" />);
    expect(container.querySelector('nav')).toBeNull();
  });

  it('la página en curso se ANUNCIA, no solo se pinta', () => {
    render(<Paginacion pagina={3} totalPaginas={5} onPagina={() => {}} de="Personal" />);
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  it('las flechas llevan texto, no solo chevron', () => {
    render(<Paginacion pagina={2} totalPaginas={5} onPagina={() => {}} de="Personal" />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument();
  });

  it('en los extremos, la flecha que no lleva a ningún sitio se deshabilita', () => {
    render(<Paginacion pagina={1} totalPaginas={5} onPagina={() => {}} de="Personal" />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('nunca más de siete botones de página: a partir de ahí es ruido', () => {
    render(<Paginacion pagina={20} totalPaginas={40} onPagina={() => {}} de="Personal" />);
    const numeros = screen.getAllByRole('button').filter((b) => /^\d+$/.test(b.textContent ?? ''));
    expect(numeros.length).toBeLessThanOrEqual(7);
    // Y siempre se puede saltar al principio y al final.
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '40' })).toBeInTheDocument();
  });

  it('la variante compacta muestra la posición en vez de la lista', () => {
    render(<Paginacion pagina={3} totalPaginas={9} onPagina={() => {}} de="Personal" compacta />);
    expect(screen.getByText('3 de 9')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '5' })).not.toBeInTheDocument();
  });

  it('llama con la página correcta', async () => {
    const u = userEvent.setup();
    const fn = vi.fn();
    render(<Paginacion pagina={2} totalPaginas={5} onPagina={fn} de="Personal" />);
    await u.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(fn).toHaveBeenCalledWith(3);
  });
});

/**
 * R53 · el campo y el selector, iguales a la promesa.
 *
 * Lo reportó el responsable: «la entrega del selector no es igual que la
 * promesa». Medido: la etiqueta salía del color que heredara —negro puro en vez
 * del gris tinta del sistema, porque `.campo-etiqueta` no declaraba color y
 * `.cg-et` sí— y el error salía **sin su icono**, que el catálogo lleva desde
 * siempre. Dos nombres para la misma pieza que habían derivado por dentro.
 */
describe('R53 · el error del campo lleva su icono, como el catálogo', () => {
  it('Campo: el error se pinta con icono, no solo en rojo', () => {
    const { container } = render(<Campo etiqueta="Correo" error="El correo está incompleto." />);
    const err = container.querySelector('.campo-error')!;
    expect(err).not.toBeNull();
    expect(err.querySelector('svg')).not.toBeNull();
    expect(err.textContent).toContain('El correo está incompleto.');
  });

  it('Selector: igual — el color no basta para decir que algo falla (SC 1.4.1)', () => {
    const { container } = render(
      <Selector etiqueta="Sede" error="Elige una sede." opciones={[{ valor: 'h', texto: 'Huaraz' }]} />
    );
    expect(container.querySelector('.campo-error svg')).not.toBeNull();
  });

  it('sin error no hay renglón que ocultar', () => {
    const { container } = render(<Campo etiqueta="Correo" />);
    expect(container.querySelector('.campo-error')).toBeNull();
  });
});

/**
 * R54 · el selector en solo lectura mientras se consulta a la API.
 *
 * Lo pidió el responsable para el selector de documento: cambiar el tipo a
 * mitad de la consulta tira el resultado que se estaba esperando. Y NO es
 * `disabled`: deshabilitado se sale del tabulador y el navegador no lo envía
 * con el formulario, que es justo el dato que hay que conservar.
 */
describe('R54 · Selector en solo lectura: se lee, se enfoca y no cambia', () => {
  const OPCIONES = [
    { valor: 'dni', texto: 'DNI' },
    { valor: 'ce', texto: 'Carné de extranjería' },
  ];

  it('lo anuncia como solo lectura y NO como deshabilitado', () => {
    render(<Selector etiqueta="Tipo de documento" opciones={OPCIONES} soloLectura defaultValue="dni" />);
    const sel = screen.getByLabelText('Tipo de documento');
    expect(sel).toHaveAttribute('aria-readonly', 'true');
    // Sigue enfocable y sigue viajando con el formulario: eso es lo que
    // `disabled` rompería.
    expect(sel).toBeEnabled();
    expect(sel).not.toHaveAttribute('disabled');
  });

  it('el teclado no lo cambia, pero sí deja salir', () => {
    const onCambio = vi.fn();
    render(<Selector etiqueta="Tipo de documento" opciones={OPCIONES} soloLectura onChange={onCambio} />);
    const sel = screen.getByLabelText('Tipo de documento');

    const flecha = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    sel.dispatchEvent(flecha);
    expect(flecha.defaultPrevented).toBe(true);

    // Tab y Escape pasan: salir nunca se bloquea.
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    sel.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
  });

  it('el ratón no abre la lista', () => {
    render(<Selector etiqueta="Tipo de documento" opciones={OPCIONES} soloLectura />);
    const sel = screen.getByLabelText('Tipo de documento');
    const raton = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    sel.dispatchEvent(raton);
    expect(raton.defaultPrevented).toBe(true);
  });

  it('sin `soloLectura` todo sigue igual: no se estorba al caso normal', () => {
    render(<Selector etiqueta="Tipo de documento" opciones={OPCIONES} />);
    const sel = screen.getByLabelText('Tipo de documento');
    expect(sel).not.toHaveAttribute('aria-readonly');
    const raton = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    sel.dispatchEvent(raton);
    expect(raton.defaultPrevented).toBe(false);
  });
});
