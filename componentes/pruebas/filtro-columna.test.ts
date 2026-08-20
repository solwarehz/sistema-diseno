/**
 * R87 — el filtro de columna no declara lo que el catálogo no enseña.
 *
 * `.tb-f` llevaba `font-size: 12px`, `padding: 4px 8px` y, en el select, su
 * propia flecha a 13px. Las tres empatan en especificidad con `.campo` y
 * `select.campo`, y en el catálogo pierden: nunca se han visto ahí. En la hoja
 * entregada ganaban, porque el extractor agrupa por elemento y les cambia el
 * orden. Medido en un navegador: 12px y 26,73px de alto contra 13px y 36,18.
 *
 * Se borraron. Esta prueba impide que vuelvan — y el candado del empate impide
 * que aparezca el mismo defecto en otro elemento.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const HOJA = join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

describe('Tabla de datos — R87 · el filtro solo declara lo suyo', () => {
  it('R87 · .tb-f declara el ancho, que es su trabajo', () => {
    expect(css).toMatch(/\.tb-f\{\s*width:\s*100%;\s*\}/);
  });

  it('R87 · y NO el tamaño de letra ni el relleno: los pone .campo', () => {
    const regla = css.match(/\.tb-f\{[^}]*\}/)?.[0] ?? '';
    expect(regla).not.toBe('');
    expect(regla).not.toMatch(/font-size/);
    expect(regla).not.toMatch(/padding/);
  });

  it('R87 · select.tb-f no existe: la flecha es la de select.campo', () => {
    expect(css).not.toMatch(/select\.tb-f/);
    expect(css).toMatch(/select\.campo\{[^}]*background-size:\s*16px 16px/);
  });

  /* La celda SÍ es suya y se queda: es la que da fondo y relleno a la fila. */
  it('R87 · la celda de filtro conserva su regla', () => {
    expect(css).toMatch(/\.tb-fila-filtros \.tb-f-celda\{[^}]*padding:\s*4px 8px/);
  });
});
