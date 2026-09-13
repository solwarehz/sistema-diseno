/**
 * LA VERSIÓN SE PUEDE COMPROBAR EN EJECUCIÓN, no solo en disco.
 *
 * Nace de un reporte de Control Administrativos el 2026-09-13, y el reporte no
 * era un defecto del componente sino de **cómo se entrega**:
 *
 *   «Con solo el npm install, Next siguió sirviendo el paquete viejo: la
 *    primera medición salió idéntica a la de antes y estuve a punto de
 *    reportarlo como no resuelto. Hizo falta reiniciar el contenedor.»
 *
 * La comprobación que el manual daba —`node -p "require('…/package.json')
 * .version"`— mira **el disco**, y desde otro proceso. Pasaba en verde mientras
 * el navegador recibía la versión anterior. Y lo que cambia en la mayoría de
 * versiones de este sistema es **CSS**: desde JavaScript no había forma de
 * preguntarle a la hoja qué versión es.
 *
 * Ahora hay dos formas, y las dos se comprueban aquí:
 *   · `import { VERSION } from 'sistema-diseno-ae'` — el JavaScript servido.
 *   · `--mmi-version` en `:root` — la HOJA servida, que es la otra mitad.
 *
 * Las dos tienen que decir lo mismo que `package.json`, o la comprobación
 * miente en vez de comprobar.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VERSION } from '../../sistema/tokens/fuente.mjs';

const raiz = (...p: string[]) => resolve(process.cwd(), '..', ...p);

describe('la versión se puede comprobar donde importa', () => {
  it('la raíz del paquete exporta `VERSION`, y es la del `package.json`', () => {
    const pkg = JSON.parse(readFileSync(raiz('package.json'), 'utf8'));
    expect(pkg.exports['.']).toBe('./sistema/tokens/fuente.mjs');
    expect(VERSION).toBe(pkg.version);
  });

  it('`tokens.css` declara `--mmi-version` en `:root`, y dice lo mismo', () => {
    const css = readFileSync(raiz('sistema', 'tokens', 'tokens.css'), 'utf8');
    const m = /--mmi-version:\s*([^;]+);/.exec(css);
    expect(m, 'la hoja no dice su versión: no se puede comprobar lo que se sirve').not.toBeNull();
    expect(m![1].trim()).toBe(VERSION);
    // En `:root`, no en un modo: tiene que responder con y sin `data-tema`.
    const root = /:root,\s*\[data-tema='claro'\]\s*\{([\s\S]*?)\n\}/.exec(css);
    expect(root, 'no encuentro el bloque :root').not.toBeNull();
    expect(root![1]).toContain('--mmi-version');
  });

  it('y `componentes.css` declara la SUYA: es la hoja que de verdad cambia', () => {
    // El sello vivía solo en los tokens, y una auditoría lo tumbó con la
    // pregunta justa: el CSS que el equipo estaba midiendo —R129, R130— vive
    // entero en la hoja de componentes, que no decía ninguna versión. Son dos
    // importaciones distintas y se pueden servir por separado.
    const css = readFileSync(raiz('sistema', 'componentes', 'componentes.css'), 'utf8');
    const m = /--mmi-componentes:\s*([^;]+);/.exec(css);
    expect(m, 'la hoja de componentes no dice su versión').not.toBeNull();
    expect(m![1].trim()).toBe(VERSION);
  });

  it('SIN COMILLAS: entrecomilladas, la comparación falla siempre', () => {
    // `getPropertyValue` devuelve la comilla DENTRO del valor, así que un
    // `=== VERSION` no casaría nunca. Y el minificador reescribe la comilla
    // simple en doble, así que recortarla a mano se rompe al desplegar.
    for (const [nombre, ruta] of [
      ['tokens', raiz('sistema', 'tokens', 'tokens.css')],
      ['componentes', raiz('sistema', 'componentes', 'componentes.css')],
    ] as const) {
      const css = readFileSync(ruta, 'utf8');
      const m = /--mmi-(?:version|componentes):\s*([^;]+);/.exec(css)!;
      expect(m[1], nombre).not.toMatch(/['"]/);
    }
  });

  it('y viajan en el catálogo, que es la otra superficie', () => {
    const html = readFileSync(raiz('cascaron', 'index.html'), 'utf8');
    expect(html).toContain(`--mmi-version: ${VERSION};`);
    expect(html).toContain(`--mmi-componentes: ${VERSION};`);
  });
});
