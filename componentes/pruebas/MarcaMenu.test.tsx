/**
 * MARCA DEL MENÚ
 *
 * Lo que se prueba es que **el cliente no pueda romper el marco**. La garantía
 * de no deformarse es de CSS y aquí no se puede medir —jsdom no calcula
 * diseño—, así que lo que se comprueba es lo otro: que la caja tenga su clase
 * de tamaño fijo siempre, que el fallo de carga no deje un hueco mudo, y que
 * el nombre accesible no se diga dos veces.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MarcaMenu } from '../src/MarcaMenu';

const LOGO = 'https://ejemplo/lockup.png';
const ESCUDO = 'https://ejemplo/escudo.png';

describe('Marca del menú', () => {
  it('desplegado usa la imagen ancha; plegado, la compacta', () => {
    const { rerender } = render(
      <MarcaMenu titulo="Colegio Albert Einstein" logo={LOGO} logoCompacto={ESCUDO} href="/" />
    );
    expect(document.querySelector('img')).toHaveAttribute('src', LOGO);

    rerender(
      <MarcaMenu titulo="Colegio Albert Einstein" logo={LOGO} logoCompacto={ESCUDO} plegado href="/" />
    );
    expect(document.querySelector('img')).toHaveAttribute('src', ESCUDO);
  });

  it('sin versión compacta, plegado reutiliza la ancha en vez de quedarse vacío', () => {
    render(<MarcaMenu titulo="Colegio Albert Einstein" logo={LOGO} plegado href="/" />);
    expect(document.querySelector('img')).toHaveAttribute('src', LOGO);
  });

  it('la caja lleva SIEMPRE su clase de tamaño fijo: el hueco existe antes de cargar', () => {
    const { rerender, container } = render(
      <MarcaMenu titulo="Colegio Albert Einstein" logo={LOGO} href="/" />
    );
    expect(container.querySelector('.lat-marca-caja.lat-marca-ancha')).toBeTruthy();

    rerender(<MarcaMenu titulo="Colegio Albert Einstein" logo={LOGO} plegado href="/" />);
    expect(container.querySelector('.lat-marca-caja.lat-marca-estrecha')).toBeTruthy();
  });

  it('SIN imagen no hay hueco mudo: sale el nombre', () => {
    render(<MarcaMenu titulo="Colegio Albert Einstein" href="/" />);
    expect(screen.getByText('Colegio Albert Einstein')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('si la imagen NO CARGA, cae al nombre en vez de dejar el icono roto', () => {
    render(<MarcaMenu titulo="Colegio Albert Einstein" logo="https://ejemplo/no-existe.png" href="/" />);
    fireEvent.error(document.querySelector('img')!);
    expect(screen.getByText('Colegio Albert Einstein')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('un nombre LARGO no rompe el marco: sale entero y la caja lo recorta', () => {
    const largo = 'Institución Educativa Privada Colegio Albert Einstein de Huaraz';
    const { container } = render(<MarcaMenu titulo={largo} href="/" />);
    // El texto va COMPLETO en el DOM —el lector lo lee entero— y es el CSS el
    // que lo recorta a dos líneas. Recortarlo en JavaScript daría un nombre
    // truncado también para quien no lo ve.
    expect(screen.getByText(largo)).toBeInTheDocument();
    expect(container.querySelector('.lat-marca-texto')).toBeTruthy();
    expect(container.querySelector('.lat-marca-caja.lat-marca-ancha')).toBeTruthy();
  });

  it('plegado y sin imagen, el nombre se recorta a las iniciales que caben en 40px', () => {
    render(<MarcaMenu titulo="Colegio Albert Einstein" plegado href="/" />);
    expect(screen.getByText('CAE')).toBeInTheDocument();
  });

  it('una imagen nueva merece otra oportunidad tras un fallo de red', () => {
    const { rerender } = render(<MarcaMenu titulo="Colegio" logo="https://ejemplo/mala.png" href="/" />);
    fireEvent.error(document.querySelector('img')!);
    expect(document.querySelector('img')).toBeNull();

    rerender(<MarcaMenu titulo="Colegio" logo={LOGO} href="/" />);
    expect(document.querySelector('img')).toHaveAttribute('src', LOGO);
  });

  it('el nombre lo dice el ENLACE y el alt va vacío: no se anuncia dos veces', () => {
    render(<MarcaMenu titulo="Colegio Albert Einstein" logo={LOGO} href="/" />);
    expect(screen.getByRole('link', { name: 'Colegio Albert Einstein — ir al inicio' })).toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('pulsar la marca lleva al inicio sin recargar cuando hay enrutador', async () => {
    const u = userEvent.setup();
    const ir = vi.fn();
    render(<MarcaMenu titulo="Colegio" logo={LOGO} href="/" onIr={ir} />);
    await u.click(screen.getByRole('link'));
    expect(ir).toHaveBeenCalled();
  });
});
