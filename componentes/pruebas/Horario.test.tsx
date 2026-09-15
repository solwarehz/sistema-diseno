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
    const clase = [...hueco!.classList].find((c) => /^hor-h\d+$/.test(c));
    expect(clase, 'el hueco no dice cuántos cuartos es').toMatch(/^hor-h\d+$/);
    /* `q1` es UN cuarto de hora, que es donde cae 12:20. El número de detrás es
       cuántas celdas abarca el bloque, y con `paso` 60 sobre 12:00–14:00 son
       dos. En el producto que lo reportó las filas van de dos horas y es
       igual. Desde el R138 el nombre dice solo eso: `hor-h1`, un cuarto. */
    expect(clase, '12:20 no cae en el primer cuarto').toBe('hor-h1');
  });

  it('el caso del R137: una sola celda con fracción — `hor-h1`', () => {
    /* Filas de dos horas, que es como lo tiene el producto que lo reportó: el
       bloque de 12:20 a 13:55 cabe en UNA celda y lleva un cuarto de hueco.
       Con el hueco en porcentaje, ése era el que se salía 11 px. */
    const { container } = render(
      <Horario titulo="Horario" dias={['Lun']} inicio="12:00" fin="14:00" paso={120}
        bloques={[{ dia: 0, de: '12:20', a: '13:55', titulo: 'S1' }]} />
    );
    const hueco = container.querySelector('.hor-hueco')!;
    expect([...hueco.classList]).toContain('hor-h1');
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

/* ── R138 · DOS BLOQUES QUE COMPARTEN FILA Y NO COMPARTEN MINUTO ────────────
   Lo reportó Control Administrativos V2.0 con el horario de un profesor real:
   S3 de 09:00 a 12:20 y S1 de 12:20 a 13:55 **no comparten un minuto**, y el
   segundo se descartaba con «se solapa con otro bloque ya colocado». No se
   solapaban: **compartían fila**. Con franjas de dos horas el primero acaba
   dentro de la fila de las 12:00 y el segundo empieza ahí. */
describe('[4b] R138 · una celda lleva una pila de bloques', () => {
  const DIA = { dias: ['Mié'], inicio: '08:00', fin: '14:00', paso: 120 };
  const S3 = { dia: 0, de: '09:00', a: '12:20', titulo: 'S3' };
  const S1 = { dia: 0, de: '12:20', a: '13:55', titulo: 'S1' };

  const cuartos = (pila: Element) => [...pila.children]
    .map((e) => [...e.classList].find((c) => /^hor-[hd]\d+$/.test(c)) ?? '?');

  it('el caso del profesor: los DOS se pintan', () => {
    const { container } = render(<Horario titulo="H" {...DIA} bloques={[S3, S1]} />);
    const rotulos = [...container.querySelectorAll('.hor-b b')].map((b) => b.textContent);
    expect(rotulos, 'se descartó uno de los dos, que es el defecto').toEqual(['S3', 'S1']);
  });

  it('y van en la MISMA celda, apilados, con sus cuartos', () => {
    const { container } = render(<Horario titulo="H" {...DIA} bloques={[S3, S1]} />);
    expect(container.querySelectorAll('.hor-pila')).toHaveLength(1);
    expect(cuartos(container.querySelector('.hor-pila')!)).toEqual(['hor-h2', 'hor-d7', 'hor-d3']);
  });

  it('la celda abarca la UNIÓN de sus filas, no las de uno', () => {
    /* S3 ocupa tres franjas y S1 la última. Si el `rowSpan` fuera el de uno
       solo, la pila se saldría de su celda o taparía filas que no le tocan. */
    const { container } = render(<Horario titulo="H" {...DIA} bloques={[S3, S1]} />);
    expect(container.querySelector('.hor-c:not(.hor-vacia)')!.getAttribute('rowspan')).toBe('3');
  });

  it('y si el SEGUNDO se alarga más, la celda crece con él', () => {
    /* Que la celda llegue hasta donde llega el ÚLTIMO bloque de la pila. Lo que
       esta prueba NO puede vigilar es el `Math.max` del agrupador: dentro de un
       grupo los bloques van ordenados y no se solapan, así que `qA` crece
       estrictamente y el último siempre tiene el `ff` mayor — quitarlo deja
       todo en verde porque es **inalcanzable**, no porque falte prueba. Lo midió
       una auditoría, y se dice aquí en vez de fingir que lo sujeta. */
    const { container } = render(
      <Horario titulo="H" {...DIA} fin="16:00" bloques={[S3, { dia: 0, de: '12:20', a: '15:00', titulo: 'S1' }]} />
    );
    expect(container.querySelector('.hor-c:not(.hor-vacia)')!.getAttribute('rowspan'),
      'la celda no abarca hasta donde llega el segundo bloque').toBe('4');
    expect(cuartos(container.querySelector('.hor-pila')!),
      'las piezas no suman la celda entera').toEqual(['hor-h2', 'hor-d7', 'hor-d5', 'hor-h2']);
  });

  it('[4b] el ORDEN de entrada no cambia nada: llegan como llegan de la consulta', () => {
    /* El agrupador da por hecho que van en orden —`f0 = grupo[0].f`, `cursor =
       base`— y lo consigue ordenando. Quitar ese `sort` dejaba las 912 EN
       VERDE, y con la entrada invertida el bloque se pintaba TRES FRANJAS más
       abajo de su hora, con la celda a rowspan 1 y catorce cuartos dentro de
       cuatro. Un producto que traiga los bloques de una consulta sin `ORDER BY`
       lo reproduce. Lo cazó una auditoría. */
    const alDerecho = render(<Horario titulo="H" {...DIA} bloques={[S3, S1]} />);
    const alReves = render(<Horario titulo="H" {...DIA} bloques={[S1, S3]} />);
    const retrato = (c: HTMLElement) => {
      const td = c.querySelector('.hor-c:not(.hor-vacia)')!;
      return {
        rowspan: td.getAttribute('rowspan'),
        piezas: cuartos(c.querySelector('.hor-pila')!),
        rotulos: [...c.querySelectorAll('.hor-b b')].map((b) => b.textContent),
      };
    };
    expect(retrato(alReves.container), 'el orden de entrada cambió el dibujo')
      .toEqual(retrato(alDerecho.container));
  });

  it('[4b] pasado el TOPE no se descarta a nadie: se pierde la proporción, y se avisa', () => {
    /* La primera versión de este arreglo dejaba fuera a todos menos el primero,
       y con eso el caso que trajo el R138 SEGUÍA ROTO a paso 30 —el grupo
       abarca diez franjas— mientras el contrato decía que estaba arreglado. Un
       bloque que desaparece no deja hueco visible; uno mal proporcionado se ve. */
    const avisos: string[] = [];
    const { container } = render(
      <Horario titulo="H" dias={['Mié']} inicio="00:00" fin="24:00" paso={30}
        onAjuste={(a) => avisos.push(...a.map((x) => x.motivo))}
        bloques={[S3, S1]} />
    );
    expect([...container.querySelectorAll('.hor-b b')].map((b) => b.textContent),
      'volvió a descartar el segundo bloque').toEqual(['S3', 'S1']);
    expect(avisos, 'se perdió la proporción y no se dijo').toContain('span-largo');
  });

  it('[4b] y una pieza que pasa el tope NO emite una clase que la hoja no atiende', () => {
    /* `hor-d40` no existe en la hoja: emitirla es colocar el bloque donde caiga.
       Sin clase hereda `flex: 1 0 auto`, que es lo que «a celda entera» siempre
       quiso decir. */
    const { container } = render(
      <Horario titulo="H" dias={['Mié']} inicio="00:00" fin="24:00" paso={30}
        bloques={[S3, S1]} />
    );
    const conClaseImposible = [...container.querySelectorAll('.hor-b, .hor-hueco')]
      .flatMap((e) => [...e.classList])
      .filter((c) => /^hor-[hd](\d+)$/.test(c))
      .filter((c) => Number(c.replace(/^hor-[hd]/, '')) > 24);
    expect(conClaseImposible, 'emite clases de tamaño que la hoja no declara').toEqual([]);
  });

  it('sin aviso: no había nada que avisar', () => {
    const avisos: string[] = [];
    render(<Horario titulo="H" {...DIA} bloques={[S3, S1]}
      onAjuste={(a) => avisos.push(...a.map((x) => x.detalle))} />);
    expect(avisos, 'sigue avisando de un solape que no existe').toEqual([]);
  });

  it('pero dos que SÍ comparten un minuto siguen descartándose, y se dice cuál', () => {
    /* El descarte no desaparece: cambia de criterio. Antes era por fila —que es
       geometría— y ahora por tiempo, que es lo que de verdad no cabe. */
    const avisos: string[] = [];
    const { container } = render(
      <Horario titulo="H" {...DIA}
        bloques={[S3, { dia: 0, de: '11:00', a: '13:00', titulo: 'B' }]}
        onAjuste={(a) => avisos.push(...a.map((x) => x.detalle))} />
    );
    expect(container.querySelectorAll('.hor-b')).toHaveLength(1);
    expect(avisos.join(' '), 'el aviso no dice con cuál se solapa').toContain('«S3»');
    expect(avisos.join(' ')).toContain('se solapa en el tiempo');
  });

  it('[8] el hueco de ABAJO existe, y no tenía prueba', () => {
    /* Lo cazó una auditoría: poner `aba = 0` dejaba 903 pruebas en verde. Es la
       mitad simétrica del R137 — un bloque que acaba a media franja se dibujaría
       hasta el fondo de la celda y parecería acabar en punto. */
    const { container } = render(
      <Horario titulo="H" dias={['Lun']} inicio="08:00" fin="10:00" paso={120}
        bloques={[{ dia: 0, de: '08:00', a: '09:00', titulo: 'Medio' }]} />
    );
    const piezas = cuartos(container.querySelector('.hor-pila')!);
    expect(piezas, 'el bloque acaba a media franja y no se reserva el hueco de abajo')
      .toEqual(['hor-d2', 'hor-h2']);
  });

  it('[8] y arriba y abajo a la vez, cuando el bloque va por el medio', () => {
    const { container } = render(
      <Horario titulo="H" dias={['Lun']} inicio="08:00" fin="10:00" paso={120}
        bloques={[{ dia: 0, de: '08:30', a: '09:30', titulo: 'Centro' }]} />
    );
    expect(cuartos(container.querySelector('.hor-pila')!)).toEqual(['hor-h1', 'hor-d2', 'hor-h1']);
  });
});
