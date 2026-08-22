/**
 * R89 · sonda del motor de encaje — antes y después.
 *
 * Estos son los casos que se midieron para escribir R89, y quedan como prueba
 * porque son exactamente los que el pedido daba por imposibles o por
 * silenciosos. Lo que se encontró al sondear el motor viejo:
 *
 *   07:45–09:00 con paso 60  →  se dibujaba en la fila de las 08:00
 *   13:30–15:00 (su ejemplo) →  se dibujaba de 14:00 a 16:00
 *   07:25–07:50 (25 min)     →  desaparecía
 *   dos bloques a la misma hora → solo se veía el SEGUNDO
 *
 * O sea: su premisa era que un bloque desalineado no se dibuja. Era peor. Se
 * dibujaba en el sitio equivocado, con el rótulo correcto al lado.
 */
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Horario, type AjusteHorario } from '../src/Horario';

const base = { titulo: 'x', dias: ['Lun'], inicio: '07:00', fin: '19:00', paso: 60 };

/** Dónde acaba dibujado un bloque: fila, span y proporciones de la pila. */
function encaje(b: Record<string, unknown>) {
  const { container } = render(<Horario {...base} bloques={[b as never]} />);
  const bloque = container.querySelector('.hor-b');
  if (!bloque) return null;
  const td = bloque.closest('td')!;
  const clase = (el: Element | null) =>
    el ? Number((el.className.match(/hor-fr-(\d+)/) ?? [])[1] ?? 0) : 0;
  return {
    fila: td.closest('tr')!.querySelector('th')!.textContent,
    span: Number(td.getAttribute('rowspan') ?? 1),
    arr: clase(td.querySelector('.hor-hueco:first-child')),
    dur: clase(bloque),
    aba: clase(td.querySelector('.hor-hueco:last-child')),
    rango: bloque.querySelector('.hor-rango')!.textContent,
  };
}

describe('Horario — R89 · la celda deja de ser un interruptor', () => {
  it('R89 · 13:30–15:00 con paso 60: media celda de las 13:00 y la de las 14:00 entera', () => {
    const e = encaje({ dia: 0, de: '13:30', a: '15:00', titulo: 'D' })!;
    expect(e.fila).toBe('13:00');          // antes decía 14:00
    expect(e.span).toBe(2);
    expect(e.arr).toBe(2);                 // dos cuartos vacíos arriba = media celda
    expect(e.dur).toBe(6);                 // hora y media = seis cuartos
    expect(e.aba).toBe(0);
    expect(e.rango).toBe('13:30 – 15:00'); // el rótulo no redondea nada
  });

  it('R89 · las 07:45, que es el caso que trajo el pedido', () => {
    const e = encaje({ dia: 0, de: '07:45', a: '09:00', titulo: 'B' })!;
    expect(e.fila).toBe('07:00');          // antes se pintaba en la fila de las 08:00
    expect(e.arr).toBe(3);                 // tres cuartos vacíos
    expect(e.dur).toBe(5);
  });

  it('R89 · un bloque más corto que un cuarto de franja se descarta, y se dice', () => {
    const onAjuste = vi.fn();
    render(<Horario {...base} onAjuste={onAjuste}
      bloques={[{ dia: 0, de: '07:10', a: '07:20', titulo: 'E' }]} />);
    const avisos = onAjuste.mock.calls[0][0] as AjusteHorario[];
    expect(avisos).toHaveLength(1);
    expect(avisos[0].motivo).toBe('duracion-nula');
    expect(avisos[0].detalle).toContain('«E»');
  });

  it('R89 · 25 minutos con paso 60 ya SÍ se dibujan: dos cuartos', () => {
    const e = encaje({ dia: 0, de: '07:25', a: '07:50', titulo: 'C' })!;
    expect(e.fila).toBe('07:00');
    expect(e.dur).toBeGreaterThan(0);
  });

  it('R89 · el que se sale del rango avisa, con su motivo', () => {
    const onAjuste = vi.fn();
    render(<Horario {...base} onAjuste={onAjuste}
      bloques={[{ dia: 0, de: '18:00', a: '20:00', titulo: 'G' }]} />);
    expect((onAjuste.mock.calls[0][0] as AjusteHorario[])[0].motivo).toBe('fuera-de-rango');
  });

  it('R89 · el día que no existe avisa', () => {
    const onAjuste = vi.fn();
    render(<Horario {...base} onAjuste={onAjuste}
      bloques={[{ dia: 5, de: '08:00', a: '09:00', titulo: 'H' }]} />);
    expect((onAjuste.mock.calls[0][0] as AjusteHorario[])[0].motivo).toBe('dia-inexistente');
  });

  /* Antes ganaba el SEGUNDO y el primero desaparecía sin dejar rastro. Ahora
     gana el primero —que es determinista— y el segundo se anuncia. */
  it('R89 · dos bloques a la misma hora: se queda el primero y el otro avisa', () => {
    const onAjuste = vi.fn();
    const { container } = render(<Horario {...base} onAjuste={onAjuste} bloques={[
      { dia: 0, de: '08:00', a: '09:00', titulo: 'PRIMERO' },
      { dia: 0, de: '08:00', a: '09:00', titulo: 'SEGUNDO' },
    ]} />);
    expect([...container.querySelectorAll('.hor-b b')].map((x) => x.textContent)).toEqual(['PRIMERO']);
    const avisos = onAjuste.mock.calls[0][0] as AjusteHorario[];
    expect(avisos[0].motivo).toBe('sin-sitio');
    expect(avisos[0].detalle).toContain('«SEGUNDO»');
  });

  it('R89 · el solapamiento parcial también avisa', () => {
    const onAjuste = vi.fn();
    render(<Horario {...base} onAjuste={onAjuste} bloques={[
      { dia: 0, de: '08:00', a: '10:00', titulo: 'LARGO' },
      { dia: 0, de: '09:00', a: '10:00', titulo: 'DENTRO' },
    ]} />);
    expect((onAjuste.mock.calls[0][0] as AjusteHorario[])[0].detalle).toContain('«DENTRO»');
  });

  /* El tope se DICE. Un límite silencioso es el defecto que este pedido venía
     a quitar, así que el propio tope no puede tenerlo. */
  it('R89 · pasado el tope de span se pinta a celda entera, avisando', () => {
    const onAjuste = vi.fn();
    render(<Horario {...base} onAjuste={onAjuste}
      bloques={[{ dia: 0, de: '07:00', a: '15:00', titulo: 'JORNADA' }]} />);
    const avisos = onAjuste.mock.calls[0][0] as AjusteHorario[];
    expect(avisos[0].motivo).toBe('span-largo');
  });

  it('R89 · lo que encaja no avisa: onAjuste no se llama', () => {
    const onAjuste = vi.fn();
    render(<Horario {...base} onAjuste={onAjuste}
      bloques={[{ dia: 0, de: '08:00', a: '09:00', titulo: 'OK' }]} />);
    expect(onAjuste).not.toHaveBeenCalled();
  });

  it('R89 · la tabla no cambia: sigue habiendo th scope y rowSpan', () => {
    const { container } = render(<Horario {...base}
      bloques={[{ dia: 0, de: '13:30', a: '15:00', titulo: 'D' }]} />);
    expect(container.querySelectorAll('th[scope="row"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('th[scope="col"]').length).toBeGreaterThan(0);
    expect(container.querySelector('td[rowspan="2"]')).toBeTruthy();
  });
});
