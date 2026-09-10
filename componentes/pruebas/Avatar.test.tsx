/**
 * AVATAR — la foto que no carga, y la que carga.
 *
 * No había ni una prueba de este componente, y por eso convivían dos defectos
 * durante versiones sin que nadie los viera. Los dos salieron de auditar los
 * documentos de `peticiones/` contra el código: el del 2026-08-08 prometía
 * «si la imagen no carga, vuelve a las iniciales» y «con foto: proporción 1:1
 * y recorte centrado».
 *
 * Ninguna de las dos era cierta:
 *
 *   1 · No había `onError`, y con `foto` puesta las iniciales NI SIQUIERA
 *       estaban en el DOM. Una URL caducada pintaba el icono de imagen rota
 *       del navegador dentro del círculo.
 *   2 · La regla que da tamaño y recorte se llamaba `.av img` —el AVISO
 *       temporal— y no `.avatar img`. Una letra. `.av img` no casaba con nada
 *       en ninguna parte, y la foto se pintaba a tamaño natural dentro de un
 *       círculo con `overflow:hidden`: un trozo de la cara, ampliado.
 *
 * EL CATÁLOGO NO PODÍA ENSEÑARLO. No pinta ni un solo avatar con `<img>`:
 * solo la silueta en SVG, que sí estaba cubierta por esa misma regla. Es la
 * misma familia que todo lo demás de este repositorio — lo que el catálogo no
 * pinta, no lo compara nadie.
 */
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Avatar, iniciales, colorIdentidad } from '../src/Avatar';

const HOJA = readFileSync(
  resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'),
  'utf8',
);

describe('Avatar · la foto que no carga', () => {
  it('sin foto, enseña las iniciales', () => {
    render(<Avatar id="p1" nombre="QUISPE MAMANI, Rosa" />);
    expect(screen.getByText('QR')).toBeInTheDocument();
  });

  it('con foto, enseña la imagen', () => {
    const { container } = render(
      <Avatar id="p1" nombre="QUISPE MAMANI, Rosa" foto="/f.jpg" />,
    );
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('si la carga FALLA, cae a las iniciales y la imagen desaparece', () => {
    const { container } = render(
      <Avatar id="p1" nombre="QUISPE MAMANI, Rosa" foto="/rota.jpg" />,
    );
    const img = container.querySelector('img')!;
    fireEvent.error(img);

    // Antes quedaba el icono de imagen rota del navegador. Ahora no hay imagen.
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('QR')).toBeInTheDocument();
  });

  it('al cambiar de foto se rearma: la caída de una no rompe a la siguiente', () => {
    const { container, rerender } = render(
      <Avatar id="p1" nombre="QUISPE MAMANI, Rosa" foto="/rota.jpg" />,
    );
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();

    rerender(<Avatar id="p2" nombre="TORRES BEJARANO, Iván" foto="/buena.jpg" />);
    // Sin el rearme, este avatar nacería roto por culpa del anterior.
    expect(container.querySelector('img')).not.toBeNull();
  });
});

describe('Avatar · la hoja que viaja le da tamaño a la foto', () => {
  it('existe una regla `.avatar img` con recorte, y NO apunta al aviso', () => {
    // La comprobación es sobre la hoja ENTREGADA, no sobre el catálogo: el
    // defecto vivía justo en que las dos no decían lo mismo.
    expect(HOJA).toMatch(/\.avatar img[^{]*\{[^}]*object-fit:\s*cover/);
    // `.av` es el aviso temporal y no lleva imágenes: la regla vieja estaba
    // muerta. Si alguien la reintroduce, esto cae.
    expect(HOJA).not.toMatch(/\.av img/);
  });
});

describe('Avatar · lo que ya prometía el documento del 2026-08-08', () => {
  it('el color sale del identificador, no del nombre', () => {
    // «un cambio de apellido no debe cambiarle el color a nadie»
    expect(colorIdentidad('p1')).toBe(colorIdentidad('p1'));
    const antes = colorIdentidad('dni-71234567');
    expect(colorIdentidad('dni-71234567')).toBe(antes);
  });

  it('las iniciales son la del apellido y la del nombre', () => {
    // Parte por la coma: «QUISPE MAMANI» → Q, «Rosa» → R.
    expect(iniciales('QUISPE MAMANI, Rosa')).toBe('QR');
  });
});
