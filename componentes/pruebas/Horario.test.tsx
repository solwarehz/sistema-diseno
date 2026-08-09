import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Horario, escribirHora } from '../src/Horario';

const DIAS = ['Lunes', 'Martes', 'Miércoles'];
const BLOQUES = [
  { dia: 0, de: '07:30', a: '09:00', titulo: 'Matemática', detalle: 'Aula 201', tono: 'info' as const },
  { dia: 1, de: '08:00', a: '08:30', titulo: 'Tutoría', tono: 'neutro' as const },
];
const pintar = (p = {}) =>
  render(<Horario titulo="Horario 5.º A" dias={DIAS} inicio="07:30" fin="10:00" paso={30} bloques={BLOQUES} {...p} />);

describe('Horario', () => {
  it('es una TABLA con cabeceras declaradas, no una rejilla dibujada', () => {
    pintar();
    const t = screen.getByRole('table');
    expect(within(t).getAllByRole('columnheader').length).toBe(DIAS.length + 1);
    expect(within(t).getAllByRole('rowheader').length).toBe(5);
  });

  it('vertical: el día es columna y el bloque se estira con rowspan', () => {
    const { container } = pintar();
    const celda = container.querySelector('td[rowspan]')!;
    expect(celda).toHaveAttribute('rowspan', '3');
  });

  it('horizontal: el día es fila y el bloque se estira con colspan', () => {
    const { container } = pintar({ eje: 'horizontal' });
    expect(container.querySelector('td[colspan]')).toHaveAttribute('colspan', '3');
    expect(container.querySelector('td[rowspan]')).toBeNull();
  });

  it('rotar no pierde bloques: los mismos en los dos ejes', () => {
    const { container: v } = pintar();
    const { container: h } = pintar({ eje: 'horizontal' });
    expect(v.querySelectorAll('.hor-b').length).toBe(h.querySelectorAll('.hor-b').length);
  });

  it('el bloque dice su franja en TEXTO, no solo por la altura', () => {
    pintar();
    expect(screen.getByText('07:30 – 09:00')).toBeInTheDocument();
  });

  it('12 horas se escribe con espacio y puntos, en español', () => {
    expect(escribirHora(7 * 60 + 30, '12')).toBe('7:30 a. m.');
    expect(escribirHora(13 * 60, '12')).toBe('1:00 p. m.');
    expect(escribirHora(13 * 60, '24')).toBe('13:00');
  });

  it('un bloque fuera de rango se descarta en vez de romper la tabla', () => {
    const { container } = pintar({ bloques: [{ dia: 0, de: '23:00', a: '23:30', titulo: 'Fuera' }] });
    expect(container.querySelectorAll('.hor-b')).toHaveLength(0);
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('el marco se alcanza con teclado para poder desplazarlo', () => {
    pintar();
    expect(screen.getByRole('region', { name: 'Horario 5.º A' })).toHaveAttribute('tabindex', '0');
  });
});
