/**
 * R142 · reglas 30-35 del contrato — la columna anclada, sobre la hoja QUE VIAJA.
 *
 * Lo pidió Control Administrativos V2.0 con 31, 22 y 76 columnas sobre la mesa:
 * al desplazar en horizontal se pierde el nombre y la fila deja de decir de
 * quién es. En sus palabras, *«es lo que haría el móvil cómodo en vez de solo
 * usable»*.
 *
 * Aquí se mira que las reglas EXISTAN Y VIAJEN. Que además GANEN al resolver
 * lo comprueba `verificar-cascada`, y que el orden entre las dos que empatan
 * sea el mismo en las dos hojas, `verificar-empate`. Son tres preguntas
 * distintas y ninguna cubre a las otras dos: el `box-sizing` que no viajaba
 * pasaba las otras dos.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const HOJA = join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

/** La regla completa de un selector, tal y como viaja. */
const regla = (sel: string) => {
  const re = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*\\}', 'g');
  return (css.match(re) ?? []).join('\n');
};

describe('R142 · la columna anclada viaja', () => {
  it('[30] `.tb-ancla` se queda quieta, y contra el deslizador que ya existía', () => {
    /* `.tb-envoltura` es `overflow-x: auto` desde el R49 y envuelve SOLO la
       tabla: media solución llevaba dos años puesta. Si alguien le quita el
       desplazamiento, `sticky` deja de tener contra qué resolverse. */
    expect(regla('.tb-ancla')).toMatch(/position:\s*sticky/);
    expect(regla('.tb-ancla')).toMatch(/left:\s*0/);
    expect(css).toMatch(/\.tb-envoltura\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('[30] y lleva FONDO PROPIO, que no es transparente', () => {
    /* Una celda pegajosa transparente deja ver pasar el texto de las otras
       columnas por debajo. Es el trabajo de verdad de esta regla. */
    const r = regla('.tb-ancla');
    expect(r).toMatch(/background:\s*var\(--[a-z0-9-]+\)/);
    expect(r).not.toMatch(/background:\s*transparent/);
  });

  it('[31] el desplazamiento de la segunda sale de `--tb-indice`, escrito UNA vez', () => {
    /* Tres números que tienen que ser el mismo dejan de serlo, y aquí el
       síntoma sería una rendija de 1-3px por la que se ve pasar el texto. */
    expect(css).toMatch(/\.tb\s*\{[^}]*--tb-indice:\s*52px/);
    expect(regla('.tb-th-indice')).toMatch(/width:\s*var\(--tb-indice\)/);
    expect(regla('.tb-indice')).toMatch(/width:\s*var\(--tb-indice\)/);
    expect(regla('.tb-ancla-x')).toMatch(/left:\s*var\(--tb-indice\)/);
    // Y ningún 52px suelto en la familia: si vuelve, vuelve la rendija.
    const familia = [regla('.tb-th-indice'), regla('.tb-indice'), regla('.tb-ancla-x')].join('');
    expect(familia).not.toMatch(/52px/);
  });

  it('[32] la anclada lleva el rayado Y el hover, y el hover va DESPUÉS', () => {
    /* Los dos empatan en especificidad (0,3,2) y decide el orden: si el hover
       va antes, pasar el ratón por una fila par no la tiñe. Es el defecto de
       `.tb-f` contra `.campo` que parió verificar-empate. */
    const alt = css.indexOf('.tb tbody tr.tb-alt .tb-ancla');
    const hover = css.indexOf('.tb tbody tr:hover .tb-ancla');
    expect(alt, 'falta el rayado sobre la celda anclada').toBeGreaterThan(-1);
    expect(hover, 'falta el hover sobre la celda anclada').toBeGreaterThan(-1);
    expect(hover, 'el hover va ANTES del rayado y pierde el empate').toBeGreaterThan(alt);
  });

  it('[32] y el filete del hover se muda a la primera anclada', () => {
    /* En su sitio de siempre —el borde izquierdo de la FILA— queda tapado en
       cuanto alguien desplaza. */
    expect(css).toMatch(
      /\.tb tbody tr:hover \.tb-ancla:not\(\.tb-ancla-x\)\s*\{[^}]*box-shadow:\s*inset 3px 0 0 var\(--accion\)/
    );
  });

  it('[33] el separador es `::after`, y NINGUNA regla del anclaje pone un borde', () => {
    /* Con `border-collapse: collapse` los bordes los pinta la TABLA, no la
       celda: un borde puesto aquí no viajaría con ella al desplazar. */
    expect(css).toMatch(/\.tb-ancla-fin::after\s*\{[^}]*content:\s*''/);
    expect(regla('.tb-ancla-fin::after')).toMatch(/background:\s*var\(--borde\)/);
    for (const sel of ['.tb-ancla', '.tb-ancla-x', '.tb-ancla-fin']) {
      expect(regla(sel), `${sel} declara un borde`).not.toMatch(/border-(left|right)\s*:/);
    }
  });

  it('[33] y `border-collapse` NO se toca', () => {
    /* Pasar a `separate` duplicaría filetes donde `td{border-top}` se encuentra
       con `th{border-bottom}` y cambiaría la altura de fila que la regla 28
       protege con números medidos, a cambio de nada: hoy `.tb` no declara ni un
       borde vertical en celdas, así que no hay borde que perder. */
    expect(css).toMatch(/\.tb\s*\{[^}]*border-collapse:\s*collapse/);
    expect(css).not.toMatch(/border-collapse:\s*separate/);
  });

  it('[34] en el teléfono tiene techo, y recorta en vez de partir', () => {
    /* A 390px, con `nowrap` y un nombre largo, la anclada ocupa más que la
       pantalla y no queda NADA que desplazar: el anclaje habría empeorado el
       caso que vino a arreglar. */
    const movil = css.match(/@media \(max-width: 640px\)\s*\{[\s\S]*?\n\}/g)?.join('\n') ?? '';
    expect(movil).toMatch(/\.tb-ancla\s*\{[^}]*max-width:\s*44vw/);
    expect(movil).toMatch(/\.tb-ancla\s*\{[^}]*text-overflow:\s*ellipsis/);
  });

  it('[34] y en escritorio NO hay techo: el tope es del teléfono', () => {
    const fuera = css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '');
    expect(fuera).not.toMatch(/\.tb-ancla\s*\{[^}]*max-width/);
  });

  it('pegado al papel no significa nada: en impresión vuelve a `static`', () => {
    const impreso = css.match(/@media print\s*\{[\s\S]*?\n\}/g)?.join('\n') ?? '';
    expect(impreso).toMatch(/\.tb-ancla\s*\{[^}]*position:\s*static/);
  });

  it('la cabecera y la fila de filtros llevan SU fondo, no el de la tarjeta', () => {
    /* Si no, la columna anclada rompe la banda del encabezado justo donde
       empieza, que es lo primero que se mira. */
    expect(css).toMatch(
      /\.tb-th\.tb-ancla,\s*\.tb-f-celda\.tb-ancla\s*\{[^}]*background:\s*var\(--fondo-encabezado\)/
    );
  });
});
