/**
 * R100 · El selector con búsqueda se ve como el Selector.
 *
 * Lo reportó Control Administrativos: «se ve distinto a los demás». Medido en
 * navegador contra un `Selector`: mismo alto (32,7 px) y mismo ancho, y de las
 * nueve propiedades que diferían, ocho eran intrínsecas del `<select>` nativo.
 * La única que se veía era el sangrado del texto — 32 px contra 8 — por la lupa.
 *
 * La lupa no se retira: en el buscador de una tabla es correcta. Se vuelve
 * opcional y por omisión no está.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SelectorBusqueda } from '../src/SelectorBusqueda';

const OPCIONES = [{ valor: '1', texto: 'Jefe de personal' }, { valor: '2', texto: 'Dirección' }];
const base = { etiqueta: 'Reporta a', opciones: OPCIONES, valor: '', onCambio: vi.fn() };

describe('SelectorBusqueda — R100 · alineado con el Selector', () => {
  it('R100 · por omisión NO lleva lupa: se alinea con el resto del formulario', () => {
    const { container } = render(<SelectorBusqueda {...base} />);
    expect(container.querySelector('.sel-lupa')).toBeNull();
    expect(container.querySelector('.sel-caja')!.className).not.toContain('sel-con-lupa');
  });

  it('R100 · con `conLupa` la lleva, y declara el sangrado', () => {
    const { container } = render(<SelectorBusqueda {...base} conLupa />);
    expect(container.querySelector('.sel-lupa')).toBeTruthy();
    expect(container.querySelector('.sel-caja')!.className).toContain('sel-con-lupa');
  });

  /* El chevron va SIEMPRE: es lo que dice «esto se despliega», y es lo que
     iguala este control con el Selector. */
  it('R100 · el chevron no es opcional', () => {
    for (const props of [base, { ...base, conLupa: true }]) {
      const { container, unmount } = render(<SelectorBusqueda {...props} />);
      expect(container.querySelector('.sel-chev')).toBeTruthy();
      unmount();
    }
  });

  it('R100 · el sangrado solo lo declara la caja con lupa', () => {
    const css = readFileSync(join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css'), 'utf8');
    // Sin lupa, el campo empieza donde `.campo`: no declara padding-left propio.
    expect(css).toMatch(/input\.campo\.sel-in\{[^}]*padding-right:\s*32px/);
    expect(css.match(/input\.campo\.sel-in\{[^}]*\}/)![0]).not.toMatch(/padding-left/);
    expect(css).toMatch(/\.sel-caja\.sel-con-lupa input\.campo\.sel-in\{[^}]*padding-left:\s*32px/);
  });
});
