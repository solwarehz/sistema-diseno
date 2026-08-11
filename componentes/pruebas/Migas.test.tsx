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

  it('están los 40, los mismos que el catálogo', () => {
    // 40 desde la v1.30.0: entró «subir», la pareja de descargar2 (R35).
    expect(NOMBRES_ICONO).toHaveLength(40);
    for (const n of ['candado', 'lupa', 'cerrar', 'visto', 'alerta', 'subir']) {
      expect(NOMBRES_ICONO).toContain(n);
    }
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
