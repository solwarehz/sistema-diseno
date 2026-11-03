/**
 * R169 · SPEC 07 paso 1: lo que el tablero «General» le exige a `RangoFecha`,
 * con `maxDias={7}` y `fechaMaxima` = hoy. El componente ya lo cumplía por R166;
 * estas pruebas lo fijan con el flujo real (elegir el inicio y mirar «Hasta»).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { RangoFecha } from '../src/RangoFecha';

const HOY = new Date(2026, 2, 15); // domingo 15 de marzo de 2026
const MAX = '2026-03-15';

const campos = (c: HTMLElement) => [...c.querySelectorAll('.fc-campo')] as HTMLElement[];
const dia = (c: HTMLElement, n: string) =>
  [...c.querySelectorAll('.fc-d')].find((b) => b.textContent === n) as HTMLElement;
/* Los días habilitados desde el inicio en adelante. Los anteriores al inicio
   siguen elegibles (elegir uno reinicia el rango) y no entran en la regla. */
const habilitados = (c: HTMLElement, inicio: number) =>
  [...c.querySelectorAll('.fc-d')]
    .filter((b) => b.getAttribute('aria-disabled') !== 'true')
    .map((b) => Number(b.textContent))
    .filter((n) => n >= inicio);

function Tablero({ alCambiar }: { alCambiar?: (r: { desde: string | null; hasta: string | null }) => void }) {
  const [r, setR] = useState<{ desde: string | null; hasta: string | null }>({ desde: null, hasta: null });
  return (
    <RangoFecha titulo="Rango de fechas" hoy={HOY} meses={1} maxDias={7} fechaMaxima={MAX}
      desde={r.desde} hasta={r.hasta}
      onCambio={(n) => { setR(n); alCambiar?.(n); }} />
  );
}

describe('R169 · `RangoFecha` con `maxDias={7}` y `fechaMaxima` = hoy', () => {
  it('[1] R169 · elegido el inicio, «Hasta» deja los siete días siguientes y ninguno posterior a hoy', () => {
    const { container } = render(<Tablero />);
    fireEvent.click(campos(container)[0]);
    fireEvent.click(dia(container, '5'));
    expect(habilitados(container, 5), 'del 5 al 11 son siete días con el inicio').toEqual([5, 6, 7, 8, 9, 10, 11]);
  });

  it('[2] R169 · con el inicio a menos de siete días de hoy, el techo es hoy y nunca un día posterior', () => {
    const { container } = render(<Tablero />);
    fireEvent.click(campos(container)[0]);
    fireEvent.click(dia(container, '12'));
    expect(habilitados(container, 12)).toEqual([12, 13, 14, 15]);
    expect(dia(container, '16').getAttribute('aria-disabled')).toBe('true');
  });

  it('[3] R169 · inicio = final = hoy es un rango válido de un día', () => {
    const alCambiar = vi.fn();
    const { container } = render(<Tablero alCambiar={alCambiar} />);
    fireEvent.click(campos(container)[0]);
    fireEvent.click(dia(container, '15'));
    fireEvent.click(dia(container, '15'));
    expect(alCambiar).toHaveBeenLastCalledWith({ desde: '2026-03-15', hasta: '2026-03-15' });
  });

  it('[4] R169 · «Mes siguiente» está apagado en el mes de hoy y no avanza', () => {
    const { container } = render(<Tablero />);
    fireEvent.click(campos(container)[0]);
    const boton = screen.getByRole('button', { name: 'Mes siguiente' });
    expect(boton.getAttribute('aria-disabled')).toBe('true');
    const antes = container.querySelector('.fc-meses')!.textContent;
    fireEvent.click(boton);
    expect(container.querySelector('.fc-meses')!.textContent).toBe(antes);
  });
});
