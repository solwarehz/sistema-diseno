/**
 * FRANJA DE CIFRAS Y CIFRA CON DIFERENCIA (SPEC 07, R169)
 *
 * Las reglas son las de la sección «Franja de cifras» de `comportamiento.md`;
 * cada título lleva el número de la suya. Dos de ellas —las columnas y la
 * jerarquía de la hoja— no las ve un render en jsdom, así que se leen las
 * hojas tal como viajan.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CifraConDiferencia, FranjaCifras,
  type DiferenciaCifra,
} from '../src/FranjaCifras';
import * as raiz from '../src/index';

const HOJA = readFileSync(
  resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'),
  'utf8',
);

const MENOS = '−'; // el signo menos de verdad, no el guion

/** Las seis combinaciones de dirección y sentido. */
const SEIS: {
  caso: string;
  dif: DiferenciaCifra;
  tono: 'peor' | 'mejor' | 'igual';
  visible: string;
  nombre: string;
}[] = [
  { caso: 'sube / subir-es-peor', dif: { cantidad: '72 min', direccion: 'sube', sentido: 'subir-es-peor' },
    tono: 'peor', visible: '▲ +72 min', nombre: 'empeoró: +72 min' },
  { caso: 'baja / subir-es-peor', dif: { cantidad: '3 trab.', direccion: 'baja', sentido: 'subir-es-peor' },
    tono: 'mejor', visible: `▼ ${MENOS}3 trab.`, nombre: `mejoró: ${MENOS}3 trab.` },
  { caso: 'sube / subir-es-mejor', dif: { cantidad: '2', direccion: 'sube', sentido: 'subir-es-mejor' },
    tono: 'mejor', visible: '▲ +2', nombre: 'mejoró: +2' },
  { caso: 'baja / subir-es-mejor', dif: { cantidad: '2', direccion: 'baja', sentido: 'subir-es-mejor' },
    tono: 'peor', visible: `▼ ${MENOS}2`, nombre: `empeoró: ${MENOS}2` },
  { caso: 'igual / subir-es-peor', dif: { cantidad: '0', direccion: 'igual', sentido: 'subir-es-peor' },
    tono: 'igual', visible: '= igual que antes', nombre: 'sin cambio' },
  { caso: 'igual / subir-es-mejor', dif: { cantidad: '0', direccion: 'igual', sentido: 'subir-es-mejor' },
    tono: 'igual', visible: '= igual que antes', nombre: 'sin cambio' },
];

describe('FranjaCifras · la lista (R169)', () => {
  it('[1] (R169) es una lista `ul` con un `li` por cifra', () => {
    const { container } = render(
      <FranjaCifras>
        <CifraConDiferencia titulo="Tardanzas" valor="612" unidad="min" />
        <CifraConDiferencia titulo="Faltas" valor="7" unidad="trab." />
        <CifraConDiferencia titulo="Días incompletos" valor="11" unidad="días" />
      </FranjaCifras>,
    );
    const ul = container.querySelector('ul.franja');
    expect(ul).not.toBeNull();
    expect(ul!.querySelectorAll(':scope > li.franja-item')).toHaveLength(3);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('[1] (R169) con un número par de cifras también son `li`; los hijos nulos o falsos no abren `li` vacíos', () => {
    const { container } = render(
      <FranjaCifras>
        <CifraConDiferencia titulo="A" valor="1" />
        {false}
        {null}
        <CifraConDiferencia titulo="B" valor="2" />
      </FranjaCifras>,
    );
    expect(container.querySelectorAll('li.franja-item')).toHaveLength(2);
  });

  it('[1] (R169) la lista puede llevar nombre accesible con `etiqueta`', () => {
    render(
      <FranjaCifras etiqueta="Resumen de la semana">
        <CifraConDiferencia titulo="A" valor="1" />
      </FranjaCifras>,
    );
    expect(screen.getByRole('list', { name: 'Resumen de la semana' })).toBeInTheDocument();
  });
});

describe('CifraConDiferencia · lo que dibuja (R169)', () => {
  it('[2] (R169) pinta título, valor y unidad, y la unidad va separada del valor para quien escucha', () => {
    const { container } = render(<CifraConDiferencia titulo="Tardanzas" valor="612" unidad="min" />);
    expect(container.querySelector('.cifra-titulo')!.textContent).toBe('Tardanzas');
    const valor = container.querySelector('.cifra-valor')!;
    expect(valor.textContent).toBe('612 min');
    expect(valor.querySelector('.cifra-unidad')!.textContent).toBe('min');
  });

  it('[2] (R169) sin `unidad`, `diferencia` ni `detalle`, solo salen título y valor', () => {
    const { container } = render(<CifraConDiferencia titulo="Días" valor="11" />);
    expect(container.querySelector('.cifra-unidad')).toBeNull();
    expect(container.querySelector('.cifra-dif')).toBeNull();
    expect(container.querySelector('.cifra-detalle')).toBeNull();
  });

  it('[2] (R169) `detalle` es una línea opcional bajo la diferencia', () => {
    const { container } = render(
      <CifraConDiferencia titulo="Faltas" valor="7" detalle="de 143 trabajadores" />,
    );
    expect(container.querySelector('.cifra-detalle')!.textContent).toBe('de 143 trabajadores');
  });

  it('[3] (R169) la diferencia llega calculada: la pieza pinta `cantidad` tal cual, sin restar ni formatear', () => {
    const { container } = render(
      <CifraConDiferencia titulo="X" valor="38:20" diferencia={{ cantidad: '2:50', direccion: 'baja', sentido: 'subir-es-peor' }} />,
    );
    expect(container.querySelector('.cifra-dif')!.textContent).toContain('2:50');
    expect(container.querySelector('.cifra-dif')!.textContent).not.toMatch(/2\.5|170/);
  });
});

describe('CifraConDiferencia · flecha, signo y nombre en las seis combinaciones (R169)', () => {
  it.each(SEIS)('[4] (R169) $caso: flecha y signo visibles = «$visible»', ({ dif, visible }) => {
    const { container } = render(<CifraConDiferencia titulo="X" valor="1" diferencia={dif} />);
    const dibujo = container.querySelector('.cifra-dif [aria-hidden="true"]');
    expect(dibujo).not.toBeNull();
    expect(dibujo!.textContent).toBe(visible);
  });

  it.each(SEIS)('[5] (R169) $caso: el nombre accesible es «$nombre» y el dibujo no se lee dos veces', ({ dif, nombre }) => {
    const { container } = render(<CifraConDiferencia titulo="X" valor="1" diferencia={dif} />);
    const leido = within(container.querySelector('.cifra-dif') as HTMLElement).getByText(nombre);
    expect(leido).toHaveClass('sr-solo');
    expect(leido).not.toHaveAttribute('aria-hidden');
    // lo único legible por tecnología de apoyo es el nombre
    const sinOcultos = [...container.querySelectorAll('.cifra-dif > :not([aria-hidden="true"])')]
      .map((n) => n.textContent).join('');
    expect(sinOcultos).toBe(nombre);
  });

  it.each(SEIS)('[6] (R169) $caso: el tono es «$tono» (subir-es-peor y subir-es-mejor invierten el significado)', ({ dif, tono }) => {
    const { container } = render(<CifraConDiferencia titulo="X" valor="1" diferencia={dif} />);
    const el = container.querySelector('.cifra-dif')!;
    expect(el).toHaveClass(`cifra-dif-${tono}`);
    for (const otro of ['peor', 'mejor', 'igual'].filter((t) => t !== tono)) {
      expect(el).not.toHaveClass(`cifra-dif-${otro}`);
    }
  });

  it('[6] (R169) las seis combinaciones dan exactamente tres tonos: sube-peor y baja-mejor no se confunden', () => {
    const tonos = SEIS.map(({ dif }) => {
      const { container, unmount } = render(<CifraConDiferencia titulo="X" valor="1" diferencia={dif} />);
      const t = /cifra-dif-(peor|mejor|igual)/.exec(container.querySelector('.cifra-dif')!.className)![1];
      unmount();
      return t;
    });
    expect(tonos).toEqual(['peor', 'mejor', 'mejor', 'peor', 'igual', 'igual']);
  });

  it('[4] (R169) «igual» no pinta la cantidad ni un signo: no hubo cambio que medir', () => {
    const { container } = render(
      <CifraConDiferencia titulo="X" valor="11" diferencia={{ cantidad: '0', direccion: 'igual', sentido: 'subir-es-peor' }} />,
    );
    expect(container.querySelector('.cifra-dif')!.textContent).not.toMatch(/[+−]|\b0\b/);
  });

  it('[5] (R169) el significado no depende solo del color: peor y mejor llevan flecha y palabra distintas', () => {
    const { container } = render(
      <>
        <CifraConDiferencia titulo="P" valor="1" diferencia={SEIS[0].dif} />
        <CifraConDiferencia titulo="M" valor="1" diferencia={SEIS[1].dif} />
      </>,
    );
    const [p, m] = [...container.querySelectorAll('.cifra-dif')].map((n) => n.textContent!);
    expect(p).toContain('▲');
    expect(m).toContain('▼');
    expect(p).toContain('empeoró');
    expect(m).toContain('mejoró');
  });
});

describe('FranjaCifras · la hoja que viaja (R169)', () => {
  const partir = (css: string) => {
    let fuera = '';
    const dentro: { cond: string; cuerpo: string }[] = [];
    let i = 0;
    while (i < css.length) {
      const a = css.indexOf('@media', i);
      if (a < 0) { fuera += css.slice(i); break; }
      fuera += css.slice(i, a);
      const llave = css.indexOf('{', a);
      let nivel = 1; let j = llave + 1;
      while (j < css.length && nivel > 0) { if (css[j] === '{') nivel++; else if (css[j] === '}') nivel--; j++; }
      dentro.push({ cond: css.slice(a + 6, llave).trim(), cuerpo: css.slice(llave + 1, j - 1) });
      i = j;
    }
    return { fuera, dentro };
  };
  const { fuera, dentro } = partir(HOJA);

  it('[7] (R169) móvil primero: la base son DOS columnas, fuera de toda @media', () => {
    const m = /(?:^|\})\s*\.franja\s*\{([^}]*)\}/m.exec(fuera);
    expect(m, 'no hay regla `.franja {…}` fuera de @media').not.toBeNull();
    expect(m![1]).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });

  it('[7] (R169) con número impar, la última cifra ocupa el ancho completo en móvil', () => {
    expect(fuera).toMatch(/\.franja-item:last-child:nth-child\(odd\)\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
  });

  it('[7] (R169) cinco columnas desde 900px (min-width) y la última deja de estirarse', () => {
    const m = dentro.find((d) => /\.franja\s*\{[^}]*repeat\(5/.test(d.cuerpo));
    expect(m, 'no hay @media con cinco columnas').toBeDefined();
    expect(m!.cond).toBe('(min-width: 900px)');
    expect(m!.cuerpo).toMatch(/\.franja-item:last-child:nth-child\(odd\)\s*\{[^}]*grid-column:\s*auto/);
  });

  it('[7] (R169) ninguna regla de la franja usa max-width ni @container', () => {
    const conFranja = dentro.filter((d) => /\.(franja|cifra)\b/.test(d.cuerpo));
    expect(conFranja.some((d) => /max-width/.test(d.cond))).toBe(false);
    expect(HOJA).not.toMatch(/@container/);
  });

  it('[8] (R169) la cifra usa números tabulares y los tonos de la diferencia salen de los tokens de estado', () => {
    expect(HOJA).toMatch(/\.cifra-valor\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);
    expect(HOJA).toMatch(/\.cifra-dif\.cifra-dif-peor\s*\{[^}]*var\(--aviso-fondo\)[^}]*var\(--aviso-texto\)/);
    expect(HOJA).toMatch(/\.cifra-dif\.cifra-dif-mejor\s*\{[^}]*var\(--exito-fondo\)[^}]*var\(--exito-texto\)/);
    expect(HOJA).toMatch(/\.cifra-dif\.cifra-dif-igual\s*\{[^}]*var\(--neutra-fondo\)[^}]*var\(--neutra-texto\)/);
  });
});

describe('FranjaCifras · lo que exporta el paquete (R169)', () => {
  it('[9] (R169) `index.ts` exporta las dos piezas', () => {
    expect(typeof raiz.FranjaCifras).toBe('function');
    expect(typeof raiz.CifraConDiferencia).toBe('function');
  });
});
