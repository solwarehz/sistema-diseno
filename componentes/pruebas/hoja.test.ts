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

describe('R56 · la tarjeta pulsable es un <button>, y la hoja lo sabe', () => {
  /* El defecto: durante 48 versiones el catálogo pintó la pulsable como
     `<a href="#">` y el componente la emitió como `<button>`. Un ancla hereda
     tipografía; un botón no. Sin este reset el producto veía la fuente del
     navegador (~13,3px Arial), el texto centrado y relleno de más — y el
     catálogo se veía perfecto. No lo cazó el candado de la promesa porque ese
     resuelve la cascada sobre EL MISMO marcado, y aquí difería el elemento. */
  const regla = hoja.match(/^\.tn\{[^}]*\}/ms)?.[0] ?? '';

  it('.tn hereda la tipografía en vez de aceptar la del navegador', () => {
    expect(regla).toContain('font: inherit');
  });

  it('.tn no deja que el botón centre el texto ni meta su relleno', () => {
    expect(regla).toContain('text-align: left');
    expect(regla).toContain('padding: 0');
    expect(regla).toContain('margin: 0');
  });
});

describe('R70 · la tarjeta pulsable marca el foco del teclado', () => {
  /* WCAG 2.2 SC 2.4.7. No tenía regla: la genérica de foco solo alcanza lo que
     vive dentro del marco de aplicación, y una tarjeta en una pantalla de
     aterrizaje está fuera. Con el ratón sí cambiaba el borde, así que el
     teclado recibía menos señal que el ratón. */
  it('tiene su anillo, y es el del sistema', () => {
    expect(hoja).toMatch(/\.tn-pulsable:focus-visible\{[^}]*outline:\s*2px solid var\(--foco\)/);
  });

  it('el anillo NO se apaga en ningún sitio', () => {
    // §2.5.7: `outline: none` sin reemplazo es el defecto real de §1.3.
    expect(hoja).not.toMatch(/\.tn-pulsable:focus(-visible)?\{[^}]*outline:\s*none/);
  });

  it('y sigue habiendo señal de ratón: el foco se suma, no sustituye', () => {
    expect(hoja).toMatch(/\.tn-pulsable:hover\{[^}]*border-color:\s*var\(--accion\)/);
  });
});

describe('R57 · el medio de la tarjeta', () => {
  it('la proporción la declara la hoja, no el producto', () => {
    expect(hoja).toMatch(/\.tn-medio\{[^}]*aspect-ratio:\s*16\s*\/\s*9/);
    // Y recorta: sin overflow oculto, el acercamiento se sale del marco.
    expect(hoja).toMatch(/\.tn-medio\{[^}]*overflow:\s*hidden/);
  });

  it('la imagen cubre el hueco en vez de deformarse', () => {
    expect(hoja).toMatch(/\.tn-medio img\{[^}]*object-fit:\s*cover/);
  });

  it('el acercamiento sale de un token de duración, nunca de una cifra a mano', () => {
    expect(hoja).toMatch(/\.tn-medio img\{[^}]*transition:\s*transform var\(--dur-[a-z]+\) var\(--curva\)/);
    expect(hoja).not.toMatch(/\.tn-medio img\{[^}]*transition:[^;]*\d+m?s/);
  });

  it('con movimiento reducido el acercamiento se apaga del todo', () => {
    // Los tokens caen a 0,01ms arriba, pero `transform` no es una duración:
    // sin esta regla el acercamiento seguiría ocurriendo, solo que de golpe.
    expect(hoja).toMatch(/prefers-reduced-motion[\s\S]{0,120}\.tn-pulsable:hover \.tn-medio img\s*\{\s*transform:\s*none/);
  });

  /* R64 · Lo reportó Control Administrativos V2.0. `.tna-editar` es absoluto;
     sin `position` en `.tn-medio`, su bloque contenedor era la tarjeta entera
     —y en una `Tarjeta` normal, que no lleva `.tna`, no había ninguno—. En el
     catálogo se veía bien por accidente: el medio es el primer hijo. */
  it('R64 · el medio es su propio bloque contenedor', () => {
    expect(hoja).toMatch(/\.tn-medio\{[^}]*position:\s*relative/);
    // Y el control de la foto sigue siendo absoluto: si dejara de serlo, esta
    // regla sobraría y la prueba estaría protegiendo un fósil.
    expect(hoja).toMatch(/\.tna-editar\{[^}]*position:\s*absolute/);
  });

  it('la vista previa de CargaImagen es el MISMO hueco: 192×108 es 16:9', () => {
    expect(hoja).toMatch(/\.ci-medio\{[^}]*width:\s*192px[^}]*height:\s*108px/);
    expect(192 / 108).toBeCloseTo(16 / 9, 5);
  });
});
