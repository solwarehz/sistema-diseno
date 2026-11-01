/**
 * CUADRO DE ESTADO — SPEC 03 (R165).
 *
 * Un cuadrado de una letra con tono. La letra sola no informa a quien la ve en
 * un teléfono (CLAUDE.md §4bis); por eso el nombre accesible es obligatorio y
 * el «sin estado» se distingue por la FORMA, no por el tono (SC 1.4.1).
 */
import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CuadroEstado, type TonoCuadro } from '../src/CuadroEstado';

const HOJA = readFileSync(
  resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'),
  'utf8',
);

/** Cuerpo de la primera regla cuyo selector es exactamente `sel`. */
function regla(sel: string): string {
  const escapado = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\})\\s*${escapado}\\s*\\{([^}]*)\\}`, 'm').exec(HOJA);
  return m ? m[1] : '';
}

afterEach(() => vi.restoreAllMocks());

describe('CuadroEstado · emisión', () => {
  it('[1] emite un único elemento con role="img" y aria-label igual a titulo', () => {
    const { container } = render(
      <CuadroEstado letra="P" tono="exito" titulo="Presente, lunes 26" />,
    );
    expect(container.children).toHaveLength(1);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Presente, lunes 26');
    expect(el.textContent).toBe('P');
  });

  const TONOS: [TonoCuadro, string][] = [
    ['exito', 'cuadro-exito'],
    ['aviso', 'cuadro-aviso'],
    ['error', 'cuadro-error'],
    ['info', 'cuadro-info'],
    ['inactivo', 'cuadro-inactivo'],
    ['ninguno', 'cuadro-ninguno'],
  ];
  for (const [tono, clase] of TONOS) {
    it(`[5] el tono ${tono} lleva la clase base y ${clase}`, () => {
      const { container } = render(<CuadroEstado letra="X" tono={tono} titulo="t" />);
      const el = container.firstElementChild as HTMLElement;
      expect(el.classList.contains('cuadro')).toBe(true);
      expect(el.classList.contains(clase)).toBe(true);
    });
  }

  it('conserva className del consumidor', () => {
    const { container } = render(
      <CuadroEstado letra="P" tono="exito" titulo="t" className="mia" />,
    );
    expect((container.firstElementChild as HTMLElement).classList.contains('mia')).toBe(true);
  });

  it('[3] no es interactivo: sin tabindex, no focalizable, sin title', () => {
    const { container } = render(<CuadroEstado letra="P" tono="exito" titulo="t" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.tabIndex).toBe(-1); // no focalizable: el DOM lo resuelve a -1 en un span sin tabindex
    expect(el.hasAttribute('title')).toBe(false);
    expect(container.querySelector('button, a, input, [tabindex]')).toBeNull();
    // Si tuviera tabindex o fuera un control, `focus()` le daría el foco.
    document.body.focus();
    el.focus();
    expect(document.activeElement).not.toBe(el);
  });
});

describe('CuadroEstado · tipos', () => {
  it('[1] tsc rechaza una llamada sin titulo o sin tono (se comprueba con `npm run tipos`)', () => {
    // Estas líneas no se ejecutan: solo existen para que `tsc` las examine.
    // Si el tipo dejara de exigir `titulo` o `tono`, el @ts-expect-error sobraría y tsc fallaría.
    const _sinTitulo = () => (
      // @ts-expect-error — falta `titulo`
      <CuadroEstado letra="P" tono="exito" />
    );
    const _sinLetra = () => (
      // @ts-expect-error — falta `letra`
      <CuadroEstado tono="exito" titulo="t" />
    );
    const _sinTono = () => (
      // @ts-expect-error — falta `tono`
      <CuadroEstado letra="P" titulo="t" />
    );
    expect([_sinTitulo, _sinLetra, _sinTono]).toHaveLength(3);
  });
});

describe('CuadroEstado · aviso de desarrollo', () => {
  for (const letra of ['', 'PP']) {
    it(`[6] letra «${letra}» avisa por consola y no rompe el render`, () => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(<CuadroEstado letra={letra} tono="exito" titulo="t" />);
      expect(aviso).toHaveBeenCalledTimes(1);
      expect(String(aviso.mock.calls[0][0])).toMatch(/letra/i);
      expect(container.firstElementChild?.textContent).toBe(letra);
    });
  }

  it('[6] una letra de un carácter no avisa', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<CuadroEstado letra="–" tono="ninguno" titulo="t" />);
    expect(aviso).not.toHaveBeenCalled();
  });
});

describe('CuadroEstado · la hoja', () => {
  const declaraciones = (cuerpo: string) =>
    [...cuerpo.matchAll(/(?:background|color|border-color):\s*([^;]+);/g)].map((m) => m[1].trim()).sort();

  for (const [cuadro, chip] of [
    ['exito', 'exito'],
    ['aviso', 'aviso'],
    ['error', 'error'],
    ['info', 'info'],
  ]) {
    it(`[5] ${cuadro} usa los MISMOS tokens que el chip: fondo, texto y acento`, () => {
      const a = regla(`.cuadro.cuadro-${cuadro}`);
      const b = new RegExp(`\\.chip\\.chip-${chip}, \\.msj\\.msj-${chip}\\{([^}]*)\\}`).exec(HOJA)?.[1] ?? '';
      expect(a, `falta .cuadro.cuadro-${cuadro}`).not.toBe('');
      expect(b, `falta la regla del chip ${chip}`).not.toBe('');
      expect(declaraciones(a)).toEqual(declaraciones(b));
    });
  }

  it('[5] inactivo usa los mismos tokens que .chip-inact', () => {
    const a = regla('.cuadro.cuadro-inactivo');
    const b = regla('.chip.chip-inact');
    expect(a).not.toBe('');
    expect(declaraciones(a)).toEqual(declaraciones(b));
  });

  it('[3] el cuadro no promete pulsarse: ninguna regla suya pone cursor:pointer', () => {
    const reglas = [...HOJA.matchAll(/[^{}]*\.cuadro[^{}]*\{[^}]*\}/g)].map((m) => m[0]);
    expect(reglas.length).toBeGreaterThan(0);
    expect(reglas.some((r) => /cursor:\s*pointer/.test(r))).toBe(false);
  });

  it('[2] «ninguno» se distingue por la forma: borde punteado y sin relleno', () => {
    const cuerpo = regla('.cuadro.cuadro-ninguno');
    expect(cuerpo, 'no hay una regla `.cuadro.cuadro-ninguno {…}` de selector único en la hoja').not.toBe('');
    expect(cuerpo).toMatch(/border(-style)?:[^;]*\bdashed\b/);
    expect(cuerpo).toMatch(/background(-color)?:\s*(transparent|none)\b/);
  });
});
