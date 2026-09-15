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

/* ── R137 · EL HUECO NO PUEDE MEDIRSE CONTRA LO QUE ÉL MISMO DIMENSIONA ─────
   jsdom no maqueta, así que la altura no se mide aquí — la vigila
   `verificar-cascada`, afirmación R137, sobre la hoja que viaja. Lo que esta
   prueba sujeta es el OTRO extremo: que el componente siga emitiendo las clases
   que esa afirmación mira, y con la aritmética de cuartos que ella supone. Si
   el componente empezara a emitir otro juego de nombres, el candado seguiría en
   verde revisando reglas que ya no activa nadie. */
describe('[8] R137 · el hueco fraccionado', () => {
  const UNA_HORA = { dias: ['Lun'], inicio: '12:00', fin: '14:00', paso: 60 };

  it('un bloque que empieza a y veinte lleva su hueco, en cuartos', () => {
    /* 12:20 redondea al cuarto: un cuarto de hora de hueco arriba. Es el caso
       exacto del R137 —y el que se salía de la celda—: `rowSpan` 1 con
       fracción, que es de lo más normal en un horario de verdad. */
    const { container } = render(
      <Horario titulo="Horario" {...UNA_HORA}
        bloques={[{ dia: 0, de: '12:20', a: '13:55', titulo: 'S1' }]} />
    );
    const hueco = container.querySelector('.hor-hueco');
    expect(hueco, 'sin hueco, el bloque empieza en punto y el horario miente').not.toBeNull();
    const clase = [...hueco!.classList].find((c) => c.startsWith('hor-q'));
    expect(clase, 'el hueco no dice cuántos cuartos es').toMatch(/^hor-q[1-3]-[1-6]$/);
    /* `q1` es UN cuarto de hora, que es donde cae 12:20. El número de detrás es
       cuántas celdas abarca el bloque, y con `paso` 60 sobre 12:00–14:00 son
       dos. En el producto que lo reportó las filas van de dos horas y es
       `hor-q1-1` — el caso que se salía. Lo que la afirmación R137 mira es el
       PRIMER número: los cuartos. */
    expect(clase!.startsWith('hor-q1-'), '12:20 no cae en el primer cuarto').toBe(true);
  });

  it('el caso del R137: una sola celda con fracción — `hor-q1-1`', () => {
    /* Filas de dos horas, que es como lo tiene el producto que lo reportó: el
       bloque de 12:20 a 13:55 cabe en UNA celda y lleva un cuarto de hueco.
       Con el hueco en porcentaje, ése era el que se salía 11 px. */
    const { container } = render(
      <Horario titulo="Horario" dias={['Lun']} inicio="12:00" fin="14:00" paso={120}
        bloques={[{ dia: 0, de: '12:20', a: '13:55', titulo: 'S1' }]} />
    );
    const hueco = container.querySelector('.hor-hueco')!;
    expect([...hueco.classList]).toContain('hor-q1-1');
    expect(container.querySelector('.hor-c')!.getAttribute('rowspan') ?? '1').toBe('1');
  });

  it('y el bloque va DESPUÉS del hueco, en la misma pila', () => {
    const { container } = render(
      <Horario titulo="Horario" {...UNA_HORA}
        bloques={[{ dia: 0, de: '12:20', a: '13:55', titulo: 'S1' }]} />
    );
    const pila = container.querySelector('.hor-pila')!;
    const hijos = [...pila.children].map((e) => e.className.split(' ')[0]);
    expect(hijos[0], 'el hueco no abre la pila: el bloque no arrancaría desplazado').toBe('hor-hueco');
    expect(hijos).toContain('hor-b');
  });

  it('sin fracción no hay hueco que repartir', () => {
    const { container } = render(
      <Horario titulo="Horario" {...UNA_HORA}
        bloques={[{ dia: 0, de: '12:00', a: '13:00', titulo: 'S1' }]} />
    );
    expect(container.querySelectorAll('.hor-hueco')).toHaveLength(0);
  });

  it('el hueco está OCULTO al lector: es geometría, no contenido', () => {
    const { container } = render(
      <Horario titulo="Horario" {...UNA_HORA}
        bloques={[{ dia: 0, de: '12:20', a: '13:55', titulo: 'S1' }]} />
    );
    expect(container.querySelector('.hor-hueco')).toHaveAttribute('aria-hidden', 'true');
  });

  it('[8] y el bloque SIEMPRE dice su franja en texto, que es lo que no redondea', () => {
    /* El relleno redondea a cuartos; el rótulo no redondea nada. Un horario que
       solo dijera la hora con la altura de la caja es el que acaba discutiéndose
       —que es como empezó el R137: «parece acabar más tarde»—. */
    const { container } = render(
      <Horario titulo="Horario" {...UNA_HORA}
        bloques={[{ dia: 0, de: '12:20', a: '13:55', titulo: 'S1' }]} />
    );
    expect(container.querySelector('.hor-rango')!.textContent).toMatch(/12:20\s*–\s*13:55/);
  });
});
