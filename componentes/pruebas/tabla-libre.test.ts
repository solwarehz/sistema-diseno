/**
 * R85 · P3 — el suelo de 520 px se puede quitar, DICIÉNDOLO.
 *
 * Control Administrativos lo pidió con el argumento correcto: su apaño era
 * sacar la tabla fuera de `.tb-envoltura` para que no heredara el suelo, y eso
 * depende de un detalle interno de nuestra cascada. «El día que cambiéis ese
 * selector, se nos rompe y no nos vamos a enterar.»
 *
 * Esta prueba mira la hoja QUE VIAJA, no la del catálogo: lo que se les entrega
 * es esa. El candado de la cascada comprueba además que la regla GANE al
 * resolver, a los once anchos; aquí se comprueba que exista y viaje, que es la
 * mitad que aquél da por supuesta.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const HOJA = join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

describe('Tabla simple — R85 · P3 · ancho mínimo declarado', () => {
  it('R85 · la tabla puede declarar que no lleva ancho mínimo, dentro de la envoltura', () => {
    expect(css).toMatch(/\.tb-envoltura\s*>\s*\.tabla-simple\.tabla-libre\s*\{[^}]*min-width:\s*0/);
  });

  it('R85 · y también suelta, para que no dependa del display:block por accidente', () => {
    expect(css).toMatch(/\.tabla-simple\.tabla-libre\s*\{[^}]*min-width:\s*0/);
  });

  /* La otra cara, y no es simetría de adorno: si el suelo por omisión
     desapareciera sin querer, `tabla-libre` seguiría «funcionando» y nadie se
     enteraría de que las tablas de datos perdieron su suelo. */
  it('R85 · sin declarar nada, el suelo de 520px sigue en pie', () => {
    expect(css).toMatch(/\.tb-envoltura\s*>\s*\.tabla-simple\s*\{[^}]*min-width:\s*520px/);
  });

  /* Corrige una premisa suya: dijeron «cualquier tabla dentro de .tb-envoltura
     obliga a desplazamiento lateral». La tabla de datos emite `.tb`, no
     `.tabla-simple`, y nunca tuvo suelo. */
  it('R85 · la tabla de datos no está afectada: .tb no lleva ancho mínimo', () => {
    const reglasTb = css.match(/^\.tb\s*\{[^}]*\}/gm) ?? [];
    expect(reglasTb.length).toBeGreaterThan(0);
    for (const regla of reglasTb) expect(regla).not.toMatch(/min-width/);
  });
});
