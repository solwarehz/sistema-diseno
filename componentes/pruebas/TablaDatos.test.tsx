/**
 * Las reglas de comportamiento de la tabla, probadas.
 *
 * Cada prueba lleva el número de regla de `comportamiento.md`. Las cinco
 * primeras son exactamente las que Control Administrativos V2.0 descubrió
 * pulsando: «cinco reglas, cinco pruebas, un día». Ahora las prueba el sistema
 * una vez, y ningún proyecto vuelve a descubrirlas.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { TablaDatos, type Columna } from '../src/TablaDatos';

type Persona = { id: string; nombre: string; cargo: string; horas: number };

const PERSONAS: Persona[] = [
  { id: '1', nombre: 'QUISPE MAMANI, Rosa', cargo: 'Docente', horas: 30 },
  { id: '2', nombre: 'ROJAS VARGAS, Luis', cargo: 'Auxiliar', horas: 40 },
  { id: '3', nombre: 'PINEDA HUAMÁN, José', cargo: 'Docente', horas: 25 },
  { id: '4', nombre: 'VARGAS SOTO, Ana', cargo: 'Directora', horas: 45 },
  { id: '5', nombre: 'CHÁVEZ RÍOS, Marta', cargo: 'Docente', horas: 20 },
  { id: '6', nombre: 'TORRES LEÓN, Pedro', cargo: 'Auxiliar', horas: 35 },
];

const COLUMNAS: Columna<Persona>[] = [
  { clave: 'nombre', titulo: 'Apellidos y nombres', valor: (p) => p.nombre },
  { clave: 'cargo', titulo: 'Cargo', valor: (p) => p.cargo },
  { clave: 'horas', titulo: 'Horas', valor: (p) => p.horas, numerica: true },
];

const pintar = (props: Partial<React.ComponentProps<typeof TablaDatos<Persona>>> = {}) =>
  render(
    <TablaDatos
      columnas={COLUMNAS}
      filas={PERSONAS}
      claveFila={(p) => p.id}
      titulo="Personal"
      {...props}
    />
  );

const filasCuerpo = () => {
  const tabla = screen.getByRole('table', { name: 'Personal' });
  const cuerpo = tabla.querySelector('tbody')!;
  return within(cuerpo).getAllByRole('row');
};

describe('Tabla de datos · filtros', () => {
  it('R1 · «Filtros» despliega una fila DENTRO del thead, uno por columna', async () => {
    const u = userEvent.setup();
    pintar();
    const boton = screen.getByRole('button', { name: 'Filtros' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');

    await u.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');

    const filtros = COLUMNAS.map((c) => screen.getByLabelText(`Filtrar por ${c.titulo}`));
    expect(filtros).toHaveLength(3);
    // Dentro del thead, no en un panel aparte.
    filtros.forEach((f) => expect(f.closest('thead')).not.toBeNull());
  });

  it('R2 · al plegar la fila, los valores se CONSERVAN', async () => {
    const u = userEvent.setup();
    pintar();
    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    await u.type(screen.getByLabelText('Filtrar por Cargo'), 'Docente');
    expect(filasCuerpo()).toHaveLength(3);

    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    // Plegado: el filtro sigue aplicado.
    expect(filasCuerpo()).toHaveLength(3);

    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    expect(screen.getByLabelText('Filtrar por Cargo')).toHaveValue('Docente');
  });

  it('R3 · el botón queda MARCADO mientras haya filtro, también plegado', async () => {
    const u = userEvent.setup();
    pintar();
    const boton = screen.getByRole('button', { name: 'Filtros' });
    expect(boton.className).not.toContain('activo');

    await u.click(boton);
    await u.type(screen.getByLabelText('Filtrar por Cargo'), 'Docente');
    expect(boton.className).toContain('activo');

    await u.click(boton); // plegar
    expect(boton.className).toContain('activo');
  });

  it('R4 · los filtros puestos se listan encima de la tabla', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    const tira = container.querySelector('.tb-activos')!;
    expect(tira).toHaveAttribute('hidden');

    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    await u.type(screen.getByLabelText('Filtrar por Cargo'), 'Docente');

    expect(tira).not.toHaveAttribute('hidden');
    expect(tira).toHaveTextContent('Cargo: Docente');
  });

  it('R5 · al filtrar se vuelve a la página 1', async () => {
    const u = userEvent.setup();
    pintar({ porPagina: 2 });
    await u.click(screen.getByRole('button', { name: 'Siguiente' }));
    await u.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('3 de 3')).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    await u.type(screen.getByLabelText('Filtrar por Cargo'), 'Docente');

    // Vuelve a la 1, no se queda en una página que ya no existe.
    expect(screen.getByText('1 de 2')).toBeInTheDocument();
  });

  it('el filtro ignora tildes: «jose» encuentra «José»', async () => {
    const u = userEvent.setup();
    pintar();
    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    await u.type(screen.getByLabelText('Filtrar por Apellidos y nombres'), 'jose');
    expect(filasCuerpo()).toHaveLength(1);
  });
});

describe('Tabla de datos · paginación', () => {
  it('R7 · con una sola página NO se pinta la paginación, pero el rango se queda', () => {
    pintar({ porPagina: 50 });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('1–6 de 6')).toBeInTheDocument();
  });

  it('R7 · con varias páginas sí se pinta', () => {
    pintar({ porPagina: 2 });
    expect(screen.getByRole('navigation', { name: /Paginación/ })).toBeInTheDocument();
  });

  it('sin resultados lo dice, en vez de mostrar un rango vacío', async () => {
    const u = userEvent.setup();
    pintar();
    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    await u.type(screen.getByLabelText('Filtrar por Cargo'), 'zzz');
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });
});

describe('Tabla de datos · orden', () => {
  it('R11 · el disparador es un <button> y el <th> lleva aria-sort', async () => {
    const u = userEvent.setup();
    pintar();
    const th = screen.getByRole('columnheader', { name: /Horas/ });
    expect(th).toHaveAttribute('aria-sort', 'none');

    await u.click(within(th).getByRole('button'));
    expect(th).toHaveAttribute('aria-sort', 'ascending');

    await u.click(within(th).getByRole('button'));
    expect(th).toHaveAttribute('aria-sort', 'descending');
  });

  it('ordena de verdad, y los números por valor y no por texto', async () => {
    const u = userEvent.setup();
    pintar({ porPagina: 50 });
    const th = screen.getByRole('columnheader', { name: /Horas/ });
    await u.click(within(th).getByRole('button'));

    const primeras = filasCuerpo().map((f) => within(f).getAllByRole('cell')[2].textContent);
    expect(primeras).toEqual(['20', '25', '30', '35', '40', '45']);
  });

  it('R13 · ordenar NO pierde los filtros', async () => {
    const u = userEvent.setup();
    pintar({ porPagina: 50 });
    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    await u.type(screen.getByLabelText('Filtrar por Cargo'), 'Docente');
    expect(filasCuerpo()).toHaveLength(3);

    const th = screen.getByRole('columnheader', { name: /Horas/ });
    await u.click(within(th).getByRole('button'));
    expect(filasCuerpo()).toHaveLength(3);
  });
});

describe('Tabla de datos · accesibilidad', () => {
  it('la tabla tiene nombre accesible', () => {
    pintar();
    expect(screen.getByRole('table', { name: 'Personal' })).toBeInTheDocument();
  });

  it('cada cabecera es columnheader con scope', () => {
    pintar();
    COLUMNAS.forEach((c) => {
      const th = screen.getByRole('columnheader', { name: new RegExp(c.titulo) });
      expect(th).toHaveAttribute('scope', 'col');
    });
  });

  it('la flecha de orden es aria-hidden: el estado lo dice aria-sort', async () => {
    const u = userEvent.setup();
    pintar();
    const th = screen.getByRole('columnheader', { name: /Horas/ });
    await u.click(within(th).getByRole('button'));
    // Acotado a ESA columna: hay una flecha por cabecera y querySelector
    // devolvia la primera, que es la de otra columna.
    const flecha = th.querySelector('.tb-th-flecha')!;
    expect(flecha).toHaveAttribute('aria-hidden', 'true');
    expect(flecha.textContent).toBe('↑');
  });
});
