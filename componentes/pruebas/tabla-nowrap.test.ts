/**
 * R86 · R28 del contrato — un dato, una línea.
 *
 * Lo reportó Control Administrativos V2.0 con la medida hecha: un nombre como
 * «SIFUENTES DE PINEDA, Julia Trinidad» salía en tres líneas y la fila crecía.
 * Medido aquí en un navegador, sobre la hoja que viaja y antes de tocar nada:
 * tres filas de la misma tabla daban 54,7 · 34,0 · 72,3 px con 34 declarados,
 * y 36,7 con 28 en compacta.
 *
 * Esta prueba mira la hoja QUE VIAJA, no la del catálogo: lo que se les entrega
 * es esa. El candado de la cascada comprueba además que cada regla GANE al
 * resolver, a los once anchos; aquí se comprueba que exista y viaje, que es la
 * mitad que aquél da por supuesta.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const HOJA = join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

describe('Tabla de datos — R28 · la celda de datos no parte el texto', () => {
  it('R28 · la celda de datos viaja con nowrap', () => {
    expect(css).toMatch(/\.tb td\s*\{[^}]*white-space:\s*nowrap/);
  });

  it('R28 · y la celda de la sub-tabla plegable también, que tenía el mismo defecto', () => {
    expect(css).toMatch(/\.tb-sub td\s*\{[^}]*white-space:\s*nowrap/);
  });

  /* La excepción no basta con declararla: `.tb-vacio` es una clase (100) y
     `.tb td` suma clase y tipo (101). Escrita con el selector corto perdía, y
     el vacío salía en una línea. Se exige la forma que gana. */
  it('R28 · el estado vacío vuelve a partir, con especificidad que le gane a .tb td', () => {
    expect(css).toMatch(/\.tb td\.tb-vacio\s*\{[^}]*white-space:\s*normal/);
  });

  it('R28 · el panel de detalle vuelve a partir: lo llena el producto y no tiene altura declarada', () => {
    expect(css).toMatch(/\.tb-detalle\s*>\s*td\s*\{[^}]*white-space:\s*normal/);
  });

  /* La otra mitad del pedido, rechazada a propósito y con su razón: la tabla
     simple NO declara altura de fila, así que no hay medida que romper, y sus
     celdas son prosa por diseño. Si un día alguien le pone nowrap «por
     simetría», esta prueba lo saca en rojo. */
  it('R28 · la tabla simple NO lleva nowrap: no declara altura y sus celdas son prosa', () => {
    const regla = css.match(/\.tabla-simple td\s*\{[^}]*\}/)?.[0] ?? '';
    expect(regla).not.toBe('');
    expect(regla).not.toMatch(/white-space/);
    expect(regla).toMatch(/vertical-align:\s*top/);
  });

  it('R28 · su única celda que no parte sigue siendo la numérica', () => {
    expect(css).toMatch(/\.tabla-simple \.num\s*\{[^}]*white-space:\s*nowrap/);
  });
});
