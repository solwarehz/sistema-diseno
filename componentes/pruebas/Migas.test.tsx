/**
 * MIGAS DE PAN
 *
 * Lo que se prueba es lo que NO SE VE, que es exactamente lo que se perdía al
 * reconstruirlas mirando: el rótulo de la región, las barras que el lector no
 * debe leer, y el `aria-current` del nivel actual.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Migas } from '../src/Migas';

const RUTA = [
  { texto: 'Sistema de diseño', href: '/' },
  { texto: 'Elementos', href: '/elementos' },
  { texto: 'Interruptor' },
];

describe('Migas de pan', () => {
  it('la región tiene rótulo: sin él hay dos «navegación» y no se distinguen', () => {
    render(<Migas ruta={RUTA} />);
    expect(screen.getByRole('navigation', { name: 'Ubicación' })).toBeInTheDocument();
  });

  it('el nivel actual se ANUNCIA con aria-current', () => {
    render(<Migas ruta={RUTA} />);
    expect(screen.getByText('Interruptor')).toHaveAttribute('aria-current', 'page');
  });

  it('el último NO es enlace: llevaría a donde ya estás', () => {
    render(<Migas ruta={RUTA} />);
    expect(screen.queryByRole('link', { name: 'Interruptor' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Elementos' })).toBeInTheDocument();
  });

  it('aunque el último traiga href, se ignora', () => {
    render(<Migas ruta={[{ texto: 'Inicio', href: '/' }, { texto: 'Aquí', href: '/aqui' }]} />);
    expect(screen.queryByRole('link', { name: 'Aquí' })).toBeNull();
  });

  it('las barras NO las lee el lector', () => {
    const { container } = render(<Migas ruta={RUTA} />);
    const seps = container.querySelectorAll('.migas-sep');
    expect(seps).toHaveLength(2);
    seps.forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
  });

  it('navegar avisa al enrutador sin recargar', async () => {
    const u = userEvent.setup();
    const ir = vi.fn();
    render(<Migas ruta={RUTA} onIr={ir} />);
    await u.click(screen.getByRole('link', { name: 'Elementos' }));
    expect(ir).toHaveBeenCalledWith('/elementos');
  });

  it('los niveles de más atrás se marcan para ocultarse SOLO a la vista', () => {
    const { container } = render(<Migas ruta={RUTA} visiblesEnMovil={2} />);
    // El primero se oculta en móvil; sigue en el árbol de accesibilidad.
    expect(container.querySelectorAll('.migas-atras')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Sistema de diseño' })).toBeInTheDocument();
  });

  it('con una sola miga no hay separadores', () => {
    const { container } = render(<Migas ruta={[{ texto: 'Inicio' }]} />);
    expect(container.querySelectorAll('.migas-sep')).toHaveLength(0);
  });

  it('sin ruta no pinta nada, en vez de una barra vacía', () => {
    const { container } = render(<Migas ruta={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

/**
 * SELECTOR CON BÚSQUEDA — el ancla de la lista.
 *
 * Va aquí y no en su archivo porque prueba lo mismo que el resto: una clase que
 * se perdió al portar. Sin `.sel`, la lista no tiene antepasado posicionado y
 * se despliega contra el viewport, fuera de la pantalla.
 */
import { SelectorBusqueda } from '../src/SelectorBusqueda';

describe('Selector con búsqueda — posicionamiento', () => {
  it('la lista vive DENTRO del ancla `.sel`, no suelta en el grupo', () => {
    const { container } = render(
      <SelectorBusqueda etiqueta="Apoderado" opciones={[{ valor: 'a', texto: 'Ana' }]} valor={null} onCambio={() => {}} />
    );
    const ancla = container.querySelector('.sel');
    expect(ancla).toBeTruthy();
    expect(ancla!.querySelector('.sel-lista')).toBeTruthy();
    expect(ancla!.querySelector('.sel-caja')).toBeTruthy();
  });
});

/**
 * ICONOS COMO COMPONENTE. Lo pidió Control Administrativos V2.0: el módulo
 * devuelve cadenas y en React eso obliga a `dangerouslySetInnerHTML`, la única
 * puerta insegura del lenguaje. Hoy inofensiva —el contenido es nuestro— pero
 * normaliza el patrón.
 */
import { Icono, NOMBRES_ICONO } from '../src/Icono';

describe('Icono', () => {
  it('dibuja SVG de verdad, sin la puerta insegura', () => {
    const { container } = render(<Icono nombre="candado" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeTruthy();
    expect(svg.querySelector('rect')).toBeTruthy();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('los cuatro tamaños y ninguno más', () => {
    const { container, rerender } = render(<Icono nombre="lupa" tam="etiqueta" />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '14');
    rerender(<Icono nombre="lupa" tam="estado" />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '32');
  });

  it('están los 53, los mismos que el catálogo', () => {
    // 42 desde la v1.37.0: subir (R35) y la pareja ojo/ojoTachado (contraseña).
    // 45 desde la v1.40.0, los tres de la carga de PDF: `documento` (la hoja en
    // blanco de cada archivo puesto), `papelera` (el tachito, en la línea del
    // nombre) y `pdf` (la hoja con renglones, del botón). Usar `libro` habría
    // enseñado dos significados con el mismo dibujo.
    // 46 desde la v1.57.0: `informacion` (R83), el cuarto glifo de intención.
    // Los otros tres ya estaban —visto, alerta y cerrar—, y sin este un mensaje
    // informativo quedaba dicho SOLO con el color (SC 1.4.1).
    // 53 desde la v1.92.0: las siete redes sociales de R112.
    //
    // R112 · «los mismos que el catálogo» era hasta hoy una frase, no una
    // comprobación: esta prueba cuenta los del PRODUCTO y nadie miraba los del
    // catálogo. Ahora lo garantiza `verificar-iconos.mjs`, que además compara
    // el trazo — el número puede cuadrar con dos dibujos distintos.
    expect(NOMBRES_ICONO).toHaveLength(53);
    for (const n of ['candado', 'lupa', 'cerrar', 'visto', 'alerta', 'informacion', 'subir', 'documento', 'papelera', 'pdf',
      'facebook', 'instagram', 'youtube', 'tiktok', 'whatsapp', 'x', 'linkedin']) {
      expect(NOMBRES_ICONO).toContain(n);
    }
  });

  /* R83 · Los cuatro glifos de intención tienen que ser DISTINTOS entre sí: si
     dos comparten trazo, la señal no cromática deja de distinguir nada y todo
     el argumento de SC 1.4.1 se cae. */
  it('R83 · los cuatro glifos de intención son cuatro dibujos distintos', () => {
    const { container, rerender } = render(<Icono nombre="visto" />);
    const trazos = new Set<string>();
    for (const n of ['visto', 'alerta', 'cerrar', 'informacion'] as const) {
      rerender(<Icono nombre={n} />);
      trazos.add(container.querySelector('svg')!.innerHTML);
    }
    expect(trazos.size).toBe(4);
  });
});

/**
 * CABECERA DE PANTALLA. Lo pidió Control Administrativos V2.0 con once
 * pantallas montadas. La prueba del `<h1>` único es la que sostiene el
 * componente: hoy ellos tienen dos sitios que lo pintan y se salvan porque
 * alguien dejó una nota. Eso es disciplina, no mecanismo.
 */
import { CabeceraPantalla } from '../src/CabeceraPantalla';

describe('Cabecera de pantalla', () => {
  it('emite UN h1, y solo uno', () => {
    render(<CabeceraPantalla titulo="Clientes" />);
    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('Clientes');
  });

  it('las migas van ENCIMA del título', () => {
    const { container } = render(
      <CabeceraPantalla titulo="Clientes" migas={[{ texto: 'Inicio', href: '/' }, { texto: 'Clientes' }]} />
    );
    const cab = container.querySelector('.pant-cab')!;
    const orden = [...cab.children].map((e) => e.className || e.tagName);
    expect(orden[0]).toContain('migas');
  });

  it('la acción va junto al título, no debajo de la descripción', () => {
    const { container } = render(
      <CabeceraPantalla titulo="Clientes" descripcion="Todos los clientes." accion={<button>Nuevo</button>} />
    );
    const fila = container.querySelector('.pant-fila')!;
    expect(fila.querySelector('h1')).toBeTruthy();
    expect(within(fila as HTMLElement).getByRole('button', { name: 'Nuevo' })).toBeTruthy();
  });

  it('la descripción va DEBAJO: en medio separaría la acción de su objeto', () => {
    const { container } = render(
      <CabeceraPantalla titulo="Clientes" descripcion="Todos los clientes." accion={<button>Nuevo</button>} />
    );
    const cab = container.querySelector('.pant-cab')!;
    const hijos = [...cab.children];
    expect(hijos[hijos.length - 1]).toHaveClass('pant-desc');
  });

  it('sin migas ni descripción no pinta huecos', () => {
    const { container } = render(<CabeceraPantalla titulo="Clientes" />);
    expect(container.querySelector('.migas')).toBeNull();
    expect(container.querySelector('.pant-desc')).toBeNull();
  });
});

/**
 * NOTA PERMANENTE. Se quedó sin pruebas al publicarla, y lo cazó la auditoría
 * del cascarón. Un componente sin pruebas es un componente que nadie sabe si
 * sigue haciendo lo que dice.
 */
import { Nota } from '../src/Nota';

describe('Nota permanente', () => {
  it('NO es una región viva: no interrumpe en cada repintado', () => {
    const { container } = render(<Nota>Las horas se redondean a 15 minutos.</Nota>);
    const n = container.firstElementChild!;
    expect(n).not.toHaveAttribute('role');
    expect(n).not.toHaveAttribute('aria-live');
  });

  it('lleva el tono NEUTRO, no el de un estado', () => {
    const { container } = render(<Nota>Texto</Nota>);
    const n = container.firstElementChild!;
    expect(n).toHaveClass('msj', 'msj-nota');
    expect(n.className).not.toMatch(/msj-(aviso|error|exito|info)/);
  });

  it('el título es parte del texto, no un encabezado que rompa la jerarquía', () => {
    const { container } = render(<Nota titulo="Cómo se calcula:">Al bloque de 15 min.</Nota>);
    expect(container.querySelector('h1,h2,h3,h4,h5,h6')).toBeNull();
    expect(screen.getByText('Cómo se calcula:')).toBeInTheDocument();
  });

  it('no se cierra: no hay botón para hacerla desaparecer', () => {
    const { container } = render(<Nota>Texto</Nota>);
    expect(container.querySelector('button')).toBeNull();
  });
});

describe('SelectorBusqueda · la promesa del catálogo, entregada', () => {
  const OPCIONES = [
    { valor: 'a', texto: 'Ana Pérez' },
    { valor: 'b', texto: 'Bruno Díaz' },
  ];

  it('la opción resaltada por teclado lleva `marcado` — LA clase que la hoja estiliza', async () => {
    const u = userEvent.setup();
    const { container } = render(
      <SelectorBusqueda etiqueta="Apoderado" opciones={OPCIONES} valor={null} onCambio={() => {}} />
    );
    await u.click(screen.getByRole('combobox', { name: 'Apoderado' }));
    await u.keyboard('{ArrowDown}');
    // Con `activa` (sin regla en la hoja) el resaltado era invisible en todo
    // producto; el candado no lo vio porque .pgn-btn.activa declara la
    // palabra en otra familia.
    expect(container.querySelector('.sel-op.marcado')).not.toBeNull();
    expect(container.querySelector('.sel-op.activa')).toBeNull();
  });

  it('la elegida lleva el visto, y solo ella', async () => {
    const u = userEvent.setup();
    const { container } = render(
      <SelectorBusqueda etiqueta="Apoderado" opciones={OPCIONES} valor="b" onCambio={() => {}} />
    );
    await u.click(screen.getByRole('combobox', { name: 'Apoderado' }));
    const conVisto = container.querySelectorAll('.sel-op .sel-check');
    expect(conVisto).toHaveLength(1);
    expect(conVisto[0].closest('.sel-op')!.textContent).toContain('Bruno Díaz');
  });

  /* R100 · la lupa dejó de ser obligatoria: sangraba el texto 32px donde el
     resto del formulario empieza en 8, y el campo se salía de la alineación.
     El chevron sigue siendo obligatorio — es lo que dice «esto se despliega» y
     lo que iguala este control con el Selector. */
  it('R100 · el chevron va siempre; la lupa solo si se pide', () => {
    const { container, unmount } = render(
      <SelectorBusqueda etiqueta="Apoderado" opciones={OPCIONES} valor={null} onCambio={() => {}} />
    );
    expect(container.querySelector('.sel-caja .sel-chev svg')).not.toBeNull();
    expect(container.querySelector('.sel-caja .sel-lupa')).toBeNull();
    unmount();

    const conLupa = render(
      <SelectorBusqueda etiqueta="Apoderado" opciones={OPCIONES} valor={null} onCambio={() => {}} conLupa />
    );
    expect(conLupa.container.querySelector('.sel-caja .sel-lupa svg')).not.toBeNull();
    expect(conLupa.container.querySelector('.sel-caja .sel-chev svg')).not.toBeNull();
  });
});
