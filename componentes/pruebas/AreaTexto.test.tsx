/**
 * R44 · ÁREA DE TEXTO.
 *
 * Lo que jsdom no puede: no calcula alturas, así que el crecimiento no se
 * puede medir aquí. Lo que sí se comprueba es el MECANISMO —que la copia
 * invisible que hace crecer la rejilla lleve de verdad el texto escrito—, y el
 * resultado visual se verificó en el catálogo.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AreaTexto } from '../src/AreaTexto';

describe('Área de texto — el envoltorio es el de Campo, no otro', () => {
  it('rótulo obligatorio, unido al cuadro, y ayuda descrita', () => {
    render(<AreaTexto etiqueta="Observaciones" ayuda="Qué pasó y qué se hizo." />);
    const caja = screen.getByLabelText('Observaciones');
    expect(caja.tagName).toBe('TEXTAREA');
    expect(caja).toHaveAccessibleDescription(/Qué pasó y qué se hizo/);
  });

  it('el error marca inválido y se anuncia con el campo', () => {
    render(<AreaTexto etiqueta="Motivo" error="Escribe el motivo de la baja." />);
    const caja = screen.getByLabelText('Motivo');
    expect(caja).toHaveAttribute('aria-invalid', 'true');
    expect(caja).toHaveAccessibleDescription(/motivo de la baja/);
  });

  it('el rótulo se puede ocultar a la vista, no al lector', () => {
    const { container } = render(<AreaTexto etiqueta="Nota" etiquetaOculta />);
    expect(screen.getByLabelText('Nota')).toBeInTheDocument();
    expect(container.querySelector('label')).toHaveClass('sr-solo');
  });
});

describe('Área de texto — el límite es blando', () => {
  it('NO se corta al pegar: entra entero y se avisa de cuánto sobra', async () => {
    const usuario = userEvent.setup();
    render(<AreaTexto etiqueta="Observaciones" maximo={10} />);
    const caja = screen.getByLabelText('Observaciones') as HTMLTextAreaElement;

    await usuario.click(caja);
    await usuario.paste('doce mas cuatro');

    expect(caja.value).toBe('doce mas cuatro'); // 15 caracteres, no 10
    expect(caja).not.toHaveAttribute('maxlength');
    expect(screen.getByText('5 de más')).toBeInTheDocument();
    expect(caja).toHaveAttribute('aria-invalid', 'true');
  });

  it('el contador cuenta hacia abajo y no aparece sin límite', () => {
    const { rerender } = render(<AreaTexto etiqueta="Nota" />);
    expect(screen.queryByText(/restantes/)).not.toBeInTheDocument();

    rerender(<AreaTexto etiqueta="Nota" maximo={100} value="hola" onChange={() => {}} />);
    expect(screen.getByText('96 restantes')).toBeInTheDocument();
  });

  it('la región viva calla mientras sobra sitio y habla en el último tramo', () => {
    const { container, rerender } = render(
      <AreaTexto etiqueta="Nota" maximo={100} value="hola" onChange={() => {}} />,
    );
    const viva = container.querySelector('[role="status"]')!;
    expect(viva).toHaveTextContent('');

    rerender(<AreaTexto etiqueta="Nota" maximo={100} value={'x'.repeat(95)} onChange={() => {}} />);
    expect(viva).toHaveTextContent('Quedan 5');

    rerender(<AreaTexto etiqueta="Nota" maximo={100} value={'x'.repeat(103)} onChange={() => {}} />);
    expect(viva).toHaveTextContent('Te pasas por 3');
  });

  it('el error del proyecto manda sobre el del límite', () => {
    render(<AreaTexto etiqueta="Nota" maximo={2} value="larguísimo" onChange={() => {}} error="Ya existe una nota igual." />);
    expect(screen.getByLabelText('Nota')).toHaveAccessibleDescription(/Ya existe una nota igual/);
    expect(screen.queryByText(/Acórtalo antes de guardar/)).not.toBeInTheDocument();
  });
});

describe('Área de texto — crecer y recortar', () => {
  it('la copia que estira la rejilla lleva lo escrito', async () => {
    const usuario = userEvent.setup();
    const { container } = render(<AreaTexto etiqueta="Nota" />);
    await usuario.type(screen.getByLabelText('Nota'), 'primera\nsegunda');
    expect(container.querySelector('.ta-crece')).toHaveAttribute('data-replica', 'primera\nsegunda');
  });

  it('sin autoCrecer no hay rejilla que estirar', () => {
    const { container } = render(<AreaTexto etiqueta="Nota" autoCrecer={false} />);
    expect(container.querySelector('.ta-crece')).toBeNull();
    expect(container.querySelector('.ta-fija')).toBeInTheDocument();
  });

  it('`filas` es la altura mínima, no la fija', () => {
    render(<AreaTexto etiqueta="Nota" filas={7} />);
    expect(screen.getByLabelText('Nota')).toHaveAttribute('rows', '7');
  });

  it('recorta los extremos al salir y avisa al producto, pero respeta los saltos de dentro', () => {
    const alCambiar = vi.fn();
    render(<AreaTexto etiqueta="Nota" onChange={alCambiar} />);
    const caja = screen.getByLabelText('Nota') as HTMLTextAreaElement;

    fireEvent.change(caja, { target: { value: '  uno\n\ndos  ' } });
    alCambiar.mockClear();
    fireEvent.blur(caja);

    expect(caja.value).toBe('uno\n\ndos');
    expect(alCambiar).toHaveBeenCalled();
  });
});
