/**
 * R88 · reglas 1-4 del contrato — el color que agrupa, no el que avisa.
 *
 * Control Administrativos lo pidió para colorear el horario por sede. El
 * diagnóstico era correcto: los tonos de estado no valen de adorno, porque
 * usar `error` como decorativo gasta el rojo.
 *
 * Lo que esta prueba fija no es que las clases existan —eso es fácil— sino la
 * FORMA que se decidió mirándolo: el color va en el filete y a 6 px, no en el
 * fondo. Se probó el fondo macizo, cumple el contraste, y aun así se descartó
 * porque cuatro cajas decorativas pesaban más que un bloque de error.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { Chip } from '../src/Chip';

const HOJA = join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

describe('Identidad — R88 · agrupa, no informa', () => {
  it('R88 · el bloque del horario lleva el color en el filete, y a 6px', () => {
    expect(css).toMatch(/\.hor-b\.hor-identidad-1[\s\S]{0,200}?border-left-width:\s*6px/);
    expect(css).toMatch(/\.hor-b\.hor-identidad-1\{[^}]*border-left-color:\s*var\(--identidad-1\)/);
  });

  /* La decisión de diseño, escrita como prueba: NO fondo macizo. Si alguien lo
     cambia por `background: var(--identidad-N)`, esto sale en rojo.
     Se miran TODAS las reglas que toquen el bloque, no solo la agrupada: la
     primera versión de esta prueba exigía una coma en el selector, así que
     miraba `.hor-b.hor-identidad-1, .hor-b…-2, …` y se le escapaba la regla
     individual. Se rompió a propósito metiendo el fondo macizo ahí y las seis
     pruebas siguieron verdes. */
  it('R88 · y NO en el fondo: ninguna regla del bloque pinta el color de identidad', () => {
    const reglas = css.match(/\.hor-b\.hor-identidad-\d[^{]*\{[^}]*\}/g) ?? [];
    expect(reglas.length).toBeGreaterThanOrEqual(5);   // la agrupada y las cuatro
    for (const regla of reglas) expect(regla).not.toMatch(/background[^;}]*var\(--identidad-/);
    expect(reglas.join('')).toMatch(/background:\s*var\(--neutra-fondo\)/);
  });

  /* R95 · DOS CLASES Y LA LONGHAND, y las dos cosas importan.
     Con una sola clase empataba con `.chip`, que declara el atajo
     `border-left: 3px solid currentcolor` más abajo — gana el último y el atajo
     REESCRIBE el color: los cuatro tonos salían del color del texto. Con
     `border-color` a secas volvería a pisarlo el atajo del lado izquierdo. */
  it('R95 · el chip de identidad gana por especificidad, y declara el lado que se pinta', () => {
    for (const n of [1, 2, 3, 4]) {
      const regla = css.match(new RegExp(`\\.chip\\.chip-identidad-${n}\\{[^}]*\\}`))?.[0] ?? '';
      expect(regla, `falta .chip.chip-identidad-${n}`).not.toBe('');
      expect(regla).toMatch(new RegExp(`border-left-color:\\s*var\\(--identidad-${n}\\)`));
      expect(regla).not.toMatch(/background:\s*var\(--identidad-/);
    }
    // Y con una sola clase no puede quedar ninguna, que era la forma vencida.
    expect(css).not.toMatch(/(^|\n)\.chip-identidad-\d\{/);
  });

  /* Los semánticos se salvaban por accidente —el extractor emite `.chip-exito`
     dos veces y la segunda cae después de `.chip`—. Ahora ganan por regla. */
  it('R95 · los tonos semánticos del chip también ganan por especificidad', () => {
    for (const tono of ['exito', 'aviso', 'error', 'info']) {
      expect(css, `.chip.chip-${tono} debería existir`).toMatch(new RegExp(`\\.chip\\.chip-${tono}`));
    }
    for (const tono of ['pend', 'inact']) {
      expect(css).toMatch(new RegExp(`\\.chip\\.chip-${tono}\\{`));
    }
  });

  /* La leyenda es obligatoria (regla 2), así que su pieza tiene que existir. */
  it('R88 · el punto de leyenda existe para los cuatro, con el color pleno', () => {
    for (const n of [1, 2, 3, 4]) {
      expect(css).toMatch(new RegExp(`\\.chip-punto\\.chip-identidad-${n}\\{[^}]*background:\\s*var\\(--identidad-${n}\\)`));
    }
  });

  it('R88 · son cuatro y no más', () => {
    expect(css).not.toMatch(/identidad-5/);
  });

  it('R88 · el Chip acepta el tono y emite su clase', () => {
    const el = Chip({ tono: 'identidad-3', children: 'Sede Sur' }) as { props: { className: string } };
    expect(el.props.className).toContain('chip-identidad-3');
    expect(el.props.className).toContain('chip');
  });
});
