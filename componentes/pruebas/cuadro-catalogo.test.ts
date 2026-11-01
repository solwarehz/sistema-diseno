/**
 * CUADRO DE ESTADO · LA HOJA QUE VIAJA Y LO QUE ENSEÑA EL CATÁLOGO (SPEC 03)
 *
 * Dos reglas del contrato no las puede ver un render en jsdom: el tamaño se
 * decide en la hoja, y «nunca sin leyenda» lo cumple —o no— el marcado del
 * catálogo. Se leen los dos archivos tal como viajan.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(process.cwd(), '..');
const HOJA = readFileSync(resolve(RAIZ, 'sistema', 'componentes', 'componentes.css'), 'utf8');
const CATALOGO = readFileSync(resolve(RAIZ, 'cascaron', 'index.html'), 'utf8');

/** Separa la hoja en lo que está fuera de toda @media y lo que está dentro. */
function partir(css: string) {
  let fuera = '';
  const dentro: { cond: string; cuerpo: string }[] = [];
  let i = 0;
  while (i < css.length) {
    const a = css.indexOf('@media', i);
    if (a < 0) { fuera += css.slice(i); break; }
    fuera += css.slice(i, a);
    const llave = css.indexOf('{', a);
    let nivel = 1;
    let j = llave + 1;
    while (j < css.length && nivel > 0) {
      if (css[j] === '{') nivel++;
      else if (css[j] === '}') nivel--;
      j++;
    }
    dentro.push({ cond: css.slice(a + 6, llave).trim(), cuerpo: css.slice(llave + 1, j - 1) });
    i = j;
  }
  return { fuera, dentro };
}

const { fuera, dentro } = partir(HOJA);
const conCuadro = dentro.filter((m) => /(^|[\s,}])\.cuadro\b/.test(m.cuerpo));

describe('Cuadro de estado · tamaño por ventana, móvil primero', () => {
  it('[4] la base mide 30px y está FUERA de toda @media', () => {
    const m = /(?:^|\})\s*\.cuadro\s*\{([^}]*)\}/m.exec(fuera);
    expect(m, 'no hay regla `.cuadro {…}` fuera de @media').not.toBeNull();
    expect(m![1]).toMatch(/width:\s*30px/);
    expect(m![1]).toMatch(/height:\s*30px/);
  });

  it('[4] los 28px son la ÚNICA regla del cuadro dentro de una @media, y es min-width: 641px', () => {
    expect(conCuadro).toHaveLength(1);
    expect(conCuadro[0].cond).toBe('(min-width: 641px)');
    expect(conCuadro[0].cuerpo).toMatch(/\.cuadro\s*\{[^}]*width:\s*28px[^}]*height:\s*28px/);
  });

  it('[4] ninguna regla del cuadro usa max-width (lo estrecho es la base, no la excepción)', () => {
    expect(conCuadro.some((m) => /max-width/.test(m.cond))).toBe(false);
  });

  it('[4] la hoja no usa @container (el tamaño no se decide por el contenedor)', () => {
    expect(HOJA).not.toMatch(/@container|container-type/);
  });

  it('[4] la letra mide 13px con peso 600, no el 500 de s-etiqueta', () => {
    const m = /(?:^|\})\s*\.cuadro\s*\{([^}]*)\}/m.exec(fuera)!;
    expect(m[1]).toMatch(/font-size:\s*13px/);
    expect(m[1]).toMatch(/font-weight:\s*600/);
  });
});

describe('Cuadro de estado · la leyenda del catálogo', () => {
  const inicio = CATALOGO.indexOf('Una serie, con su leyenda');
  const fin = inicio < 0 ? -1 : CATALOGO.indexOf('<h3', inicio + 10);
  const seccion = inicio < 0 || fin < 0 ? '' : CATALOGO.slice(inicio, fin);
  const texto = seccion.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  it('[7] el catálogo enseña una serie de cuadros CON su leyenda en la misma página', () => {
    expect(inicio, 'no está la sección «Una serie, con su leyenda»').toBeGreaterThan(-1);
    expect(seccion).toMatch(/class="cuadro cuadro-/);
  });

  for (const [letra, significado] of [
    ['P', 'Presente'],
    ['T', 'Tardanza'],
    ['I', 'Incompleto'],
    ['F', 'Falta'],
    ['–', 'No cuenta ese día'],
  ]) {
    it(`[7] la leyenda nombra ${letra} como «${significado}», en texto visible`, () => {
      expect(texto).toContain(`${letra} ${significado}`);
    });
  }

  it('[7] la leyenda no depende de `title`', () => {
    expect(seccion).not.toMatch(/\btitle=/);
  });
});
