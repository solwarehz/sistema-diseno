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
    expect(screen.getByText(/Sin resultados/)).toBeInTheDocument();
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

    const primeras = filasCuerpo().map((f) => within(f).getAllByRole('cell')[3].textContent);
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

/**
 * Las dos reglas que el candado del contrato encontró sin prueba. Estaban
 * implementadas —lo que faltaba era comprobarlo—, y una regla obligatoria que
 * nadie comprueba es una promesa.
 */
describe('Contrato de comportamiento', () => {
  it('R9 · la paginación es UN SOLO componente compartido, no una copia', () => {
    pintar({ porPagina: 2 });
    // `.pgn` es la clase del componente compartido. Si la tabla tuviera su
    // propia paginación, esta clase no estaría o sería otra.
    expect(document.querySelector('nav.pgn')).toBeTruthy();
  });

  it('R12 · la dirección de orden se indica con FLECHA además de color', async () => {
    const u = userEvent.setup();
    pintar();
    // La [0] ya no vale: es N.º, que no ordena a propósito (regla 24).
    const th = screen.getByRole('columnheader', { name: /Apellidos/ });
    await u.click(within(th).getByRole('button'));
    // SC 1.4.1: el color no puede ser el único portador. La flecha va aparte,
    // oculta al lector porque `aria-sort` ya lo dice.
    const flecha = th.querySelector('.tb-th-flecha');
    expect(flecha).toBeTruthy();
    expect(flecha!.textContent).toMatch(/[↑↓]/);
    expect(flecha).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('R18 (pedido R31) · columnas visibles controladas', () => {
  it('se siembran al montar desde fuera', () => {
    pintar({ ocultas: ['horas'] });
    expect(screen.queryByRole('columnheader', { name: /Horas/ })).toBeNull();
    expect(screen.getByRole('columnheader', { name: /Cargo/ })).toBeTruthy();
  });

  it('al cambiar, onOcultas emite la lista para persistirla', async () => {
    const u = userEvent.setup();
    const onOcultas = vi.fn();
    pintar({ ocultas: [], onOcultas, columnasFijas: ['nombre'] });
    await u.click(screen.getByRole('button', { name: 'Columnas' }));
    await u.click(screen.getByRole('checkbox', { name: /Horas/ }));
    expect(onOcultas).toHaveBeenCalledWith(['horas']);
    // Controlada: la tabla NO se aplica el cambio por su cuenta. La verdad
    // es del producto, o habría dos fuentes y parpadearía.
    expect(screen.getByRole('columnheader', { name: /Horas/ })).toBeTruthy();
  });
});

describe('R19 (pedido R32) · ranura de acciones en la barra', () => {
  it('lo que se pasa aparece junto a Filtros y Columnas', () => {
    pintar({ acciones: <button type="button">Exportar CSV</button> });
    const exportar = screen.getByRole('button', { name: 'Exportar CSV' });
    expect(exportar.closest('.tb-barra-der')).not.toBeNull();
  });
});

describe('R20 (pedido R33) · filtro de dominio cerrado', () => {
  const CON_OPCIONES: Columna<Persona>[] = COLUMNAS.map((c) =>
    c.clave === 'cargo' ? { ...c, opcionesFiltro: ['Docente', 'Auxiliar', 'Directora'] } : c
  );

  it('la columna con opciones pinta un selector, el resto texto libre', async () => {
    const u = userEvent.setup();
    pintar({ columnas: CON_OPCIONES });
    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    expect(screen.getByRole('combobox', { name: 'Filtrar por Cargo' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Filtrar por Apellidos y nombres' })).toBeTruthy();
  });

  it('casa por IGUALDAD: «Docente» no arrastra a nadie más', async () => {
    const u = userEvent.setup();
    pintar({ columnas: CON_OPCIONES });
    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    await u.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por Cargo' }), 'Docente');
    expect(filasCuerpo()).toHaveLength(3);
  });
});

describe('R21 · la tabla vacía dice por qué', () => {
  it('cero resultados por filtro: aviso y salida de un clic', async () => {
    const u = userEvent.setup();
    pintar();
    await u.click(screen.getByRole('button', { name: 'Filtros' }));
    await u.type(screen.getByRole('textbox', { name: 'Filtrar por Apellidos y nombres' }), 'zzz');
    expect(screen.getByText(/Prueba con menos filtros/)).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'quítalos todos' }));
    expect(filasCuerpo().length).toBeGreaterThan(0);
  });

  it('cero filas sin filtros: «todavía», sin botón que no lleva a nada', () => {
    pintar({ filas: [] });
    expect(screen.getByText(/No hay datos registrados todavía/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'quítalos todos' })).toBeNull();
  });
});

/**
 * R49 · lo reportó el responsable con una tabla ancha:
 *
 *   «al desplazar la barra horizontal que se crea, que solo se desplace la fila
 *    de nombres y las filas de datos. Lo que debe quedar fijo son la búsqueda,
 *    el select mostrar, el número de filas, los botones filtros, columnas y
 *    CSV, y en la parte inferior la cantidad de filas y la navegación.»
 *
 * Esto es ESTRUCTURA, no cascada, y por eso no lo ve ningún candado: el de la
 * promesa resuelve el CSS sobre el marcado del CATÁLOGO y nunca mira el árbol
 * que emite el componente. En el catálogo la barra, la envoltura y el pie
 * siempre fueron hermanos; aquí la envoltura —que es la que lleva el
 * `overflow-x`— se los tragaba a los tres. La prueba la lleva el componente
 * porque es el único sitio donde el árbol se puede afirmar.
 */
describe('R27 (pedido R49) · con la tabla ancha solo se desplaza la tabla', () => {
  it('la envoltura que desliza contiene la tabla y NADA más', () => {
    const { container } = pintar();
    const desliza = container.querySelector('.tb-envoltura')!;
    expect(desliza).not.toBeNull();
    // Un solo hijo, y es la tabla: cabecera y datos se mueven juntos.
    expect(desliza.children).toHaveLength(1);
    expect(desliza.firstElementChild!.tagName).toBe('TABLE');
    expect(desliza.querySelector('table.tb')).not.toBeNull();
  });

  it('los mandos de arriba y el pie quedan FUERA del deslizador', () => {
    const { container } = pintar({ acciones: <button type="button">CSV</button> });
    const desliza = container.querySelector('.tb-envoltura')!;
    for (const clase of ['.tb-barra', '.tb-buscar', '.tb-conteo', '.tb-barra-der',
      '.tb-activos', '.tb-pie', '.tb-rango', '.tb-pag']) {
      const nodo = container.querySelector(clase);
      expect(nodo, `falta ${clase}`).not.toBeNull();
      expect(desliza.contains(nodo), `${clase} se desplazaría con la tabla`).toBe(false);
    }
  });

  it('el bloque del componente no desliza: el que desliza es la envoltura', () => {
    const { container } = pintar();
    const bloque = container.querySelector('.tb-bloque')!;
    expect(bloque).not.toBeNull();
    expect(bloque.classList.contains('tb-envoltura')).toBe(false);
    // Y la envoltura vive dentro del bloque, junto a la barra y el pie.
    expect(bloque.querySelector(':scope > .tb-envoltura')).not.toBeNull();
    expect(bloque.querySelector(':scope > .tb-barra')).not.toBeNull();
    expect(bloque.querySelector(':scope > .tb-pie')).not.toBeNull();
  });
});

describe('R34 · la tabla pinta lo que el catálogo promete', () => {
  it('R22 · la búsqueda global mira TODAS las columnas y vuelve a la página 1', async () => {
    const u = userEvent.setup();
    pintar({ porPagina: 2 });
    await u.click(screen.getByRole('button', { name: 'Siguiente' }));
    // «Directora» está en la columna Cargo; se busca sin decir en cuál.
    await u.type(screen.getByRole('textbox', { name: /Buscar en toda la tabla/ }), 'directora');
    expect(filasCuerpo()).toHaveLength(1);
    expect(filasCuerpo()[0].textContent).toContain('VARGAS SOTO, Ana');
  });

  it('R22 · la búsqueda se SUMA a los filtros, no los pisa', async () => {
    const u = userEvent.setup();
    pintar();
    await u.click(screen.getByRole('button', { name: /Filtros/ }));
    await u.type(screen.getByLabelText('Filtrar por Cargo'), 'Docente');
    await u.type(screen.getByRole('textbox', { name: /Buscar en toda la tabla/ }), 'jose');
    expect(filasCuerpo()).toHaveLength(1);
  });

  it('R23 · «Mostrar» vive en la barra y el recuento lleva sustantivo', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ sustantivo: 'trabajadores' });
    expect(container.querySelector('.tb-conteo')!.textContent).toBe('6 trabajadores');
    // Con criba, «X de Y» aunque X sea igual que Y: un filtro que no descarta
    // nada parece no haber hecho nada.
    await u.type(screen.getByRole('textbox', { name: /Buscar en toda la tabla/ }), 'a');
    expect(container.querySelector('.tb-conteo')!.textContent).toMatch(/de 6 trabajadores$/);
    // Y «Mostrar» cambia el tamaño de página desde arriba.
    await u.selectOptions(within(container.querySelectorAll('.tb-mini')[1] as HTMLElement).getByRole('combobox'), '0');
    expect(container.querySelector('.tb-rango')!.textContent).toContain('1–6 de 6');
  });

  it('R24 · la columna N.º es CONTINUA entre páginas', async () => {
    const u = userEvent.setup();
    pintar({ porPagina: 2 });
    expect(filasCuerpo()[0].querySelector('.tb-indice')!.textContent).toBe('1');
    await u.click(screen.getByRole('button', { name: 'Siguiente' }));
    // Página 2: sigue en 3, no vuelve a 1. Es un dedo en la fila, no un dato.
    expect(filasCuerpo()[0].querySelector('.tb-indice')!.textContent).toBe('3');
  });

  it('R24 · numerada={false} la quita para quien no la quiera', () => {
    const { container } = pintar({ numerada: false });
    expect(container.querySelector('.tb-indice')).toBeNull();
  });

  it('R25 · el pie lleva el rango a la izquierda y la paginación a la derecha', () => {
    const { container } = pintar({ porPagina: 2 });
    const pie = container.querySelector('.tb-pie')!;
    expect(pie.querySelector('.tb-rango')!.textContent).toBe('1–2 de 6');
    expect(pie.querySelector('.tb-pag nav')).not.toBeNull();
  });
});

/**
 * R4 · LA TIRA DE FILTROS PUESTOS, entera.
 *
 * Se entregaba a medias y lo reportó el responsable desde su producto: «cuando
 * un filtro está activo aparece una línea azul con una x para borrar el filtro,
 * así aparece en la promesa; en la entrega solo aparece la línea azul, no
 * muestra el valor tampoco la x». La banda azul es el fondo de `.tb-activos`;
 * lo que faltaba era su contenido — el componente pintaba un `Chip` por filtro
 * y ningún botón de quitar.
 */
describe('Tabla de datos · la tira dice CUÁLES y deja quitarlos', () => {
  async function conFiltro() {
    const u = userEvent.setup();
    const vista = pintar();
    await u.click(screen.getByRole('button', { name: /Filtros/ }));
    await u.type(screen.getByLabelText('Filtrar por Cargo'), 'Docente');
    return { u, vista };
  }

  it('cada filtro puesto se lista con su valor Y con su × para quitarlo', async () => {
    const { vista } = await conFiltro();
    const tira = vista.container.querySelector('.tb-activos')!;
    expect(tira).not.toHaveAttribute('hidden');
    expect(tira).toHaveTextContent('Cargo: Docente');
    // Lo que faltaba: el botón de quitar, con el NOMBRE de la columna en su
    // rótulo — con cuatro filtros puestos, cuatro «Quitar» iguales no dicen
    // cuál se llevan.
    expect(within(tira as HTMLElement).getByRole('button', { name: 'Quitar filtro de Cargo' }))
      .toBeInTheDocument();
  });

  it('pulsar la × suelta ESE filtro y vuelve a la página 1', async () => {
    const { u, vista } = await conFiltro();
    expect(filasCuerpo()).toHaveLength(3);

    await u.click(screen.getByRole('button', { name: 'Quitar filtro de Cargo' }));
    expect(filasCuerpo()).toHaveLength(6);
    expect(vista.container.querySelector('.tb-activos')).toHaveAttribute('hidden');
  });

  it('la búsqueda también se lista y también se quita desde la tira', async () => {
    const u = userEvent.setup();
    const vista = pintar();
    await u.type(screen.getByLabelText(/Buscar/), 'Rosa');

    const tira = vista.container.querySelector('.tb-activos')!;
    expect(tira).toHaveTextContent('Busca: Rosa');
    await u.click(within(tira as HTMLElement).getByRole('button', { name: 'Quitar búsqueda' }));
    expect(filasCuerpo()).toHaveLength(6);
  });

  it('«Quitar todos» los suelta a la vez, búsqueda incluida', async () => {
    const { u } = await conFiltro();
    await u.type(screen.getByLabelText(/Buscar/), 'a');
    await u.click(screen.getByRole('button', { name: 'Quitar todos' }));
    expect(filasCuerpo()).toHaveLength(6);
  });

  it('sin nada puesto, la tira no se ve', () => {
    const vista = pintar();
    expect(vista.container.querySelector('.tb-activos')).toHaveAttribute('hidden');
  });
});

/**
 * R28 (pedido R52) · el tamaño del icono, que es markup y no cascada.
 *
 * Lo reportó el responsable mirando la barra: «los botones filtro, columnas,
 * CSV ¿tienen el mismo ancho? En la entrega el botón CSV es más ancho».
 *
 * No tienen el mismo ancho —cada uno mide lo que mide su texto, y el catálogo
 * los enseña así: 97, 119 y 84 px—, pero el CSV **parecía** más grande por otra
 * razón: el catálogo dibuja **todos** los iconos de la interfaz a **18px** y la
 * entrega los pasaba a `tam="control"`, **16px**. Como el CSV lo pone el
 * producto siguiendo el catálogo, su icono salía 2px mayor que el de sus dos
 * vecinos.
 *
 * NINGÚN CANDADO PODÍA VERLO: el de la promesa compara la cascada, y esto es un
 * atributo del `<svg>`. Por eso la prueba vive aquí.
 */
describe('R28 (pedido R52) · los iconos de la barra son los del catálogo', () => {
  it('Filtros y Columnas llevan el icono de texto, 18px, como el catálogo', () => {
    const { container } = pintar();
    const iconos = [...container.querySelectorAll('.tb-barra-der .btn svg')];
    expect(iconos).toHaveLength(2);
    for (const svg of iconos) {
      expect(svg.getAttribute('width')).toBe('18');
      expect(svg.getAttribute('height')).toBe('18');
    }
  });

  it('la lupa de la búsqueda, también', () => {
    const { container } = pintar();
    const lupa = container.querySelector('.tb-buscar svg')!;
    expect(lupa.getAttribute('width')).toBe('18');
  });
});
