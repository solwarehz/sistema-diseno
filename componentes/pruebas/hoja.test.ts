/**
 * Reglas del contrato que viven en la HOJA, no en un componente React.
 * jsdom no calcula diseño, así que se fija el TEXTO de la regla: el defecto
 * exacto que se corrigió no puede volver sin poner esta prueba en rojo.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const hoja = readFileSync(
  join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css'),
  'utf8'
);

describe('R26 · la tabla simple es UNA tabla', () => {
  it('cabecera y cuerpo NUNCA vuelven a ser dos tablas independientes', () => {
    // El defecto: `.tabla-simple > thead { display: table }` — cada grupo
    // repartía columnas por su cuenta y los rótulos no caían sobre las celdas.
    expect(hoja).not.toMatch(/\.tabla-simple\s*>\s*thead[^{]*\{[^}]*display:\s*table\b/);
    expect(hoja).not.toMatch(/\.tb-sub\s*>\s*thead[^{]*\{[^}]*display:\s*table\b/);
  });

  it('dentro de la envoltura es tabla plena, y el contenedor resuelve el desbordamiento', () => {
    expect(hoja).toMatch(/\.tb-envoltura\s*>\s*\.tabla-simple\s*\{[^}]*display:\s*table\b/);
    expect(hoja).toMatch(/\.tb-envoltura\s*\{[^}]*overflow-x:\s*auto/);
  });
});
