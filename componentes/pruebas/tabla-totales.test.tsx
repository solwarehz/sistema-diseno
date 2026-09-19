/**
 * R156 · LA FILA DE TOTALES ES DE LA TABLA.
 *
 * Lo pidió Control Administrativos tras cortarlo el dueño con una frase que
 * vale como regla del sistema:
 *
 *   «colocarlo dentro de la tabla pero no como una fila de la tabla es romper
 *    el componente tabla»
 *
 * Y no es de una pantalla: el historial de contratos cierra con el tiempo
 * laborado, los tres reportes de asistencia con las horas, tardanzas y faltas
 * del periodo, y pagos con el importe cobrado — que es el dato que se cuadra.
 * En los reportes es donde más se nota: **la fila de totales es lo que permite
 * ver que las filas cuadran sin repasarlas una a una**.
 *
 * Va en `<tfoot>`, que es donde el HTML dice que va el resumen de una tabla.
 * Por eso no la tocan el orden, el filtro ni la paginación: no porque se le
 * haga una excepción, sino porque no está donde se aplican.
 */
import { fireEvent, render, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { TablaDatos, type Columna } from '../src/TablaDatos';

const css = readFileSync(
  join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css'), 'utf8');

type Contrato = { id: string; trabajador: string; tiempo: string; dias: number };

const FILAS: Contrato[] = Array.from({ length: 25 }, (_, i) => ({
  id: `c${i}`,
  trabajador: `Trabajador ${String(i).padStart(2, '0')}`,
  tiempo: `${i} m`,
  dias: i * 3,
}));

const COLUMNAS: Columna<Contrato>[] = [
  { clave: 'trabajador', titulo: 'Trabajador', valor: (f) => f.trabajador },
  { clave: 'tiempo', titulo: 'Tiempo', valor: (f) => f.tiempo },
  { clave: 'dias', titulo: 'Días', valor: (f) => f.dias, numerica: true },
];

const TOTALES = {
  trabajador: 'Tiempo laborado',
  tiempo: <b>1 a 6 m 12 d</b>,
};

const pinta = (extra = {}) => render(
  <TablaDatos<Contrato>
    titulo="Contratos" sustantivo="contratos" filas={FILAS}
    claveFila={(f) => f.id} columnas={COLUMNAS} totales={TOTALES} {...extra} />
);

const pie = (c: HTMLElement) => c.querySelector('tfoot.tb-totales');

describe('[37] R156 · la fila de totales está EN la tabla', () => {
  it('[37] va al pie del mismo cuadro, y en `tfoot`', () => {
    /* Dentro del cuadro pero sin ser fila, «parece» de la tabla sin estarlo;
       fuera del cuadro queda suelta del dato que resume. `tfoot` es lo que un
       lector anuncia como resumen sin que nadie se lo explique. */
    const { container } = pinta();
    const tfoot = pie(container);
    expect(tfoot, 'no hay fila de totales').not.toBeNull();
    expect(tfoot!.closest('table'), 'la fila quedó fuera de la tabla').not.toBeNull();
    /* Y DESPUÉS del cuerpo: es el cierre, no una fila más. */
    const tabla = container.querySelector('table')!;
    const hijos = [...tabla.children].map((x) => x.tagName);
    expect(hijos.indexOf('TFOOT')).toBeGreaterThan(hijos.indexOf('TBODY'));
  });

  it('[37] cada total cae BAJO SU COLUMNA, no suelto', () => {
    /* Es el criterio textual del requerimiento: «1 a 6 m 12 d» cae bajo
       «Tiempo». Se comprueba por posición, no por que el texto exista. */
    const { container } = pinta();
    const celdas = [...pie(container)!.querySelectorAll('td')];
    const titulos = [...container.querySelectorAll('thead tr:first-child th')]
      .map((t) => t.textContent ?? '');
    expect(celdas).toHaveLength(titulos.length);
    const iTiempo = titulos.findIndex((t) => t.includes('Tiempo'));
    expect(celdas[iTiempo].textContent, 'el total no está bajo su columna')
      .toBe('1 a 6 m 12 d');
    const iTrab = titulos.findIndex((t) => t.includes('Trabajador'));
    expect(celdas[iTrab].textContent).toBe('Tiempo laborado');
  });

  it('[37] una columna sin total se pinta VACÍA, no se descuadra', () => {
    const { container } = pinta();
    const celdas = [...pie(container)!.querySelectorAll('td')];
    /* Una celda por columna Y una por la de índice: la fila tiene que cuadrar
       con TODAS las columnas de la tabla, incluida la N.º, o se desplaza medio
       cuadro a la izquierda. */
    const cabeceras = container.querySelectorAll('thead tr:first-child th').length;
    expect(celdas, 'sobran o faltan celdas: la fila se descuadra').toHaveLength(cabeceras);
    expect(celdas.at(-1)!.textContent, '«Días» no tiene total y no debe inventarse').toBe('');
  });

  it('[37] ordenar por cualquier columna NO la mueve', () => {
    const { container } = pinta();
    const antes = pie(container)!.textContent;
    fireEvent.click(within(container.querySelector('thead')!).getByText('Días'));
    expect(pie(container)!.textContent, 'el orden se llevó la fila de totales')
      .toBe(antes);
    const tabla = container.querySelector('table')!;
    const hijos = [...tabla.children].map((x) => x.tagName);
    expect(hijos.indexOf('TFOOT')).toBeGreaterThan(hijos.indexOf('TBODY'));
  });

  it('[37] con tres páginas, la fila es LA MISMA en las tres', () => {
    /* Resume TODAS las filas, no la página que se está viendo. Es lo que la
       hace servir para cuadrar sin repasar una a una. */
    const { container } = pinta({ porPagina: 10 });
    const vistas = [];
    for (let p = 0; p < 3; p += 1) {
      vistas.push(pie(container)!.textContent);
      const siguiente = container.querySelector('[aria-label="Página siguiente"], .pgn-sig');
      if (siguiente) fireEvent.click(siguiente);
    }
    expect(new Set(vistas).size, 'la fila cambia con la página: resume la página, no el total')
      .toBe(1);
  });

  it('[37] filtrar NO la recalcula: la aporta la pantalla', () => {
    /* Quien sabe qué suma es quien tiene los datos: «1 a 6 m 12 d» no es la
       suma de una columna, es una cuenta de calendario. */
    const { container } = pinta({ columnas: COLUMNAS.map(
      (c) => (c.clave === 'trabajador' ? { ...c, filtrable: true } : c)) });
    const antes = pie(container)!.textContent;
    const caja = container.querySelector('.tb-f, .tb-f-celda input') as HTMLInputElement | null;
    if (caja) {
      fireEvent.change(caja, { target: { value: 'Trabajador 01' } });
      expect(pie(container)!.textContent, 'el filtro recalculó el total').toBe(antes);
    }
    expect(pie(container)).not.toBeNull();
  });

  it('[37] sin `totales`, la tabla se ve EXACTAMENTE como hoy', () => {
    const { container } = render(
      <TablaDatos<Contrato> titulo="Contratos" sustantivo="contratos" filas={FILAS}
        claveFila={(f) => f.id} columnas={COLUMNAS} />
    );
    expect(container.querySelector('tfoot'), 'aparece un pie que nadie pidió').toBeNull();
  });

  it('[37] y un `totales` que no toca ninguna columna visible no pinta nada', () => {
    /* Un pie vacío es un cuadro más y una fila que no dice nada. */
    const { container } = pinta({ totales: { inexistente: 'x' } });
    expect(pie(container), 'se pinta un pie vacío').toBeNull();
  });

  it('[37] con columna congelada, la celda del total se congela CON ella', () => {
    /* Si no, el total se despega de su columna justo al desplazar, que es
       cuando hace falta. Es la regla del R142 aplicada al pie. */
    const { container } = pinta({ anclarColumnas: 1 });
    const celdas = [...pie(container)!.querySelectorAll('td')];
    /* La de DATOS que está congelada, no la de índice: la de índice se ancla
       por otra vía y miraba esa, así que quitar el anclaje de las celdas de
       columna pasaba desapercibido. */
    const cabeceras = [...container.querySelectorAll('thead tr:first-child th')];
    const iAnclada = cabeceras.findIndex((t) => t.textContent?.includes('Trabajador'));
    expect(cabeceras[iAnclada].classList.contains('tb-ancla'),
      'la columna que se dice congelada no lo está').toBe(true);
    expect(celdas[iAnclada].classList.contains('tb-ancla'),
      'la celda del total no se congela con su columna').toBe(true);
    /* Y con su propio fondo: heredar el de `.tb-ancla` pintaría una celda
       blanca en mitad de una fila gris, justo al desplazar. */
    expect(css).toMatch(/\.tb-totales\s+\.tb-ancla\s*\{[^}]*background/);
  });

  it('[37] la hoja la separa del cuerpo: es un cierre, no una fila más', () => {
    expect(css, 'la fila de totales no se distingue de los datos')
      .toMatch(/\.tb-totales\s+td\s*\{[^}]*border-top/);
  });
});
