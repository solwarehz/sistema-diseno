/**
 * R112 · Redes sociales.
 *
 * Lo que se fija aquí no es el dibujo: es que un puñado de enlaces con un icono
 * dentro y sin una palabra **se puedan usar**. Es el componente donde más se
 * falla en toda la web, y siempre por lo mismo — el nombre accesible.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RedesSociales, type EnlaceRed } from '../src/RedesSociales';

const CUENTAS: EnlaceRed[] = [
  { red: 'facebook', url: 'https://facebook.com/ae' },
  { red: 'instagram', url: 'https://instagram.com/ae', usuario: '@ae.huaraz' },
  { red: 'x', url: 'https://x.com/ae' },
];

describe('R112 · el nombre accesible lo lleva el enlace, no el dibujo', () => {
  it('con el icono solo, cada enlace se nombra por su red', () => {
    render(<RedesSociales redes={CUENTAS} />);
    expect(screen.getByRole('link', { name: /^Facebook/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Instagram/ })).toBeInTheDocument();
  });

  it('«X» se dice con su antiguo nombre: una letra suelta no identifica un destino', () => {
    render(<RedesSociales redes={CUENTAS} />);
    expect(screen.getByRole('link', { name: /X, antes Twitter/ })).toBeInTheDocument();
  });

  it('el icono queda oculto al lector: quien nombra es el control', () => {
    const { container } = render(<RedesSociales redes={[CUENTAS[0]]} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });
});

describe('R112 · lo que se ve tiene que estar dentro de lo que se oye — SC 2.5.3', () => {
  it('con el nombre escrito, el nombre accesible EMPIEZA por ese texto', () => {
    render(<RedesSociales redes={[CUENTAS[0]]} conNombre />);
    const enlace = screen.getByRole('link');
    expect(within(enlace).getByText('Facebook')).toBeInTheDocument();
    // Si el aria-label no empezara por «Facebook», quien dicta por voz diría
    // «pulsar Facebook» y no pasaría nada.
    expect(enlace.getAttribute('aria-label')).toMatch(/^Facebook/);
  });

  it('sin aviso de pestaña nueva no se pone aria-label: el texto visible basta', () => {
    render(<RedesSociales redes={[CUENTAS[0]]} conNombre nuevaPestana={false} />);
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-label');
  });
});

describe('R112 · abrir en otra pestaña se avisa — SC 3.2.5', () => {
  it('lo dice en el nombre accesible, no en un title que no oye nadie', () => {
    render(<RedesSociales redes={[CUENTAS[0]]} />);
    expect(screen.getByRole('link')).toHaveAccessibleName(/se abre en una pestaña nueva/);
  });

  it('y siempre con rel=noopener: sin él, el destino puede tocar nuestra página', () => {
    render(<RedesSociales redes={[CUENTAS[0]]} />);
    const a = screen.getByRole('link');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('sin nuevaPestana no hay target ni aviso', () => {
    render(<RedesSociales redes={[CUENTAS[0]]} nuevaPestana={false} />);
    const a = screen.getByRole('link');
    expect(a).not.toHaveAttribute('target');
    expect(a).toHaveAccessibleName('Facebook');
  });
});

describe('R112 · el grupo se nombra, y sin enlaces no se pinta', () => {
  it('va en un <nav> con nombre, para distinguirlo del menú y de las migas', () => {
    render(<RedesSociales redes={CUENTAS} />);
    expect(screen.getByRole('navigation', { name: 'Redes sociales' })).toBeInTheDocument();
  });

  it('el nombre del grupo se puede cambiar', () => {
    render(<RedesSociales redes={CUENTAS} etiqueta="Síguenos" />);
    expect(screen.getByRole('navigation', { name: 'Síguenos' })).toBeInTheDocument();
  });

  it('con la lista vacía NO pinta un nav vacío', () => {
    const { container } = render(<RedesSociales redes={[]} />);
    expect(container.querySelector('nav')).toBeNull();
  });
});

describe('R112 · las tres formas son la misma lista con otra clase', () => {
  it('por omisión, suelto: ni circulo ni cuadro ni relleno', () => {
    const { container } = render(<RedesSociales redes={CUENTAS} />);
    const nav = container.querySelector('nav')!;
    expect(nav.className).toContain('rs-fila');
    expect(nav.className).not.toContain('rs-circulo');
    expect(nav.className).not.toContain('rs-relleno');
  });

  it('círculo y relleno son clases sobre el MISMO marcado', () => {
    const { container } = render(<RedesSociales redes={CUENTAS} forma="circulo" relleno />);
    const nav = container.querySelector('nav')!;
    expect(nav.className).toContain('rs-circulo');
    expect(nav.className).toContain('rs-relleno');
    expect(container.querySelectorAll('li.rs-item')).toHaveLength(3);
  });

  it('`relleno` sin marco no hace nada: no hay dónde rellenar', () => {
    const { container } = render(<RedesSociales redes={CUENTAS} relleno />);
    expect(container.querySelector('nav')!.className).not.toContain('rs-relleno');
  });

  it('no emite una clase `rs` de raíz — ninguna regla la definiría', () => {
    const { container } = render(<RedesSociales redes={CUENTAS} />);
    const clases = container.querySelector('nav')!.className.split(' ');
    expect(clases).not.toContain('rs');
  });
});

describe('R112 · el resto de lo configurable', () => {
  it('el tamaño va en la clase del grupo', () => {
    const { container } = render(<RedesSociales redes={CUENTAS} tamano="grande" />);
    expect(container.querySelector('nav')!.className).toContain('rs-grande');
  });

  it('en columna cambia la dirección, no el marcado', () => {
    const { container } = render(<RedesSociales redes={CUENTAS} direccion="columna" />);
    expect(container.querySelector('nav')!.className).toContain('rs-columna');
    expect(container.querySelectorAll('li.rs-item')).toHaveLength(3);
  });

  it('la URL viaja tal cual: el sistema no la construye ni la valida', () => {
    render(<RedesSociales redes={[{ red: 'whatsapp', url: 'https://wa.me/51999888777' }]} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://wa.me/51999888777');
  });

  it('el nombre se puede sustituir por el de la cuenta', () => {
    render(<RedesSociales redes={[{ red: 'facebook', url: '#', nombre: 'Colegio Albert Einstein' }]} conNombre />);
    expect(screen.getByText('Colegio Albert Einstein')).toBeInTheDocument();
  });

  it('el usuario solo se pinta con conNombre', () => {
    const { rerender } = render(<RedesSociales redes={[CUENTAS[1]]} />);
    expect(screen.queryByText('@ae.huaraz')).toBeNull();
    rerender(<RedesSociales redes={[CUENTAS[1]]} conNombre />);
    expect(screen.getByText('@ae.huaraz')).toBeInTheDocument();
  });

  it('no reordena: salen en el orden en que se pasan', () => {
    render(<RedesSociales redes={CUENTAS} conNombre />);
    const nombres = screen.getAllByRole('link').map((a) => a.textContent);
    expect(nombres[0]).toContain('Facebook');
    expect(nombres[2]).toContain('X');
  });
});

describe('R113 · el rojo del escudo, y solo donde está medido', () => {
  it('por omisión van pintados con el color de marca', () => {
    const { container } = render(<RedesSociales redes={CUENTAS} />);
    expect(container.querySelector('nav')!.className).toContain('rs-marca');
  });

  it('`color="heredado"` los deja en currentColor, para fondos sin medir', () => {
    const { container } = render(<RedesSociales redes={CUENTAS} color="heredado" />);
    expect(container.querySelector('nav')!.className).not.toContain('rs-marca');
  });

  it('el color no cambia el marcado: sigue siendo la misma lista', () => {
    const conColor = render(<RedesSociales redes={CUENTAS} />).container.querySelectorAll('li').length;
    const sinColor = render(<RedesSociales redes={CUENTAS} color="heredado" />).container.querySelectorAll('li').length;
    expect(conColor).toBe(sinColor);
  });
});
