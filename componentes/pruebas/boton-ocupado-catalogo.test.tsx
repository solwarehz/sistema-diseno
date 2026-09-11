/**
 * EL BOTÓN OCUPADO DEL CATÁLOGO CONTRA EL QUE EMITE EL COMPONENTE.
 *
 * Nace de una auditoría del 2026-09-11 que midió lo siguiente: `.btn-giro`,
 * `.btn-textos`, `.btn-texto-oculto` y `.btn-ocupado` aparecían en el catálogo
 * **solo como reglas CSS y nunca en marcado**, así que ninguno de los candados
 * de superficie medía ese estado. Todo el arreglo del ancho de la v1.107.0
 * vivía en una superficie que nadie comparaba.
 *
 * Se dibujaron los tres estados en la página del Botón — y **eso tampoco
 * compró cobertura**: borrar la sección entera dejaba los diecisiete pasos en
 * verde. La razón es la de siempre en este repositorio: los candados comparan
 * conjuntos de clases y de etiquetas, y `<span>` está en todas partes.
 *
 * Así que se usa el método que ya funcionó dos veces aquí —R116 con la lista
 * del selector, R126 con el calendario—: ejecutar el catálogo de verdad y
 * comparar el árbol con el que emite React.
 *
 * QUÉ NO COMPARA: el `type="button"`, que el componente emite y el catálogo
 * casi nunca —**solo 8 de sus botones lo llevan**, contados sobre el HTML
 * generado—. Es un desfase sistémico anterior a esto y se declara en vez de
 * disimularlo: copiado dentro de un `<form>`, el marcado que el catálogo
 * enseña **envía el formulario**.
 */
import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Boton } from '../src/Boton';

const CATALOGO = resolve(process.cwd(), '..', 'cascaron', 'index.html');

let HTML: string;
beforeAll(() => { HTML = readFileSync(CATALOGO, 'utf8'); });

/**
 * Forma del árbol: etiqueta, clases, los atributos que dicen el ESTADO, **y el
 * texto**.
 *
 * El texto no estaba, y una auditoría del 2026-09-11 lo aprovechó para
 * engañar a esta prueba: intercambió los dos textos apilados del catálogo —el
 * botón en reposo pasó a DECIR «Grabando…» y a reservar «Guardar»— y los tres
 * casos siguieron en verde. Una prueba que se llama «el botón que el catálogo
 * enseña es el que el componente emite» y no compara lo que dice es una
 * promesa muerta.
 *
 * Se compara el texto PROPIO de cada nodo —sin el de sus hijos—, porque el de
 * un contenedor es la concatenación de los de abajo y taparía dónde está.
 */
const textoPropio = (el: Element) => [...el.childNodes]
  .filter((n) => n.nodeType === 3)
  .map((n) => (n.textContent ?? '').replace(/\s+/g, ' ').trim())
  .join('')
  .trim();

const forma = (el: Element): unknown => ({
  tag: el.tagName.toLowerCase(),
  clases: [...el.classList].sort().join(' '),
  texto: textoPropio(el),
  ariaHidden: el.getAttribute('aria-hidden') ?? null,
  ariaBusy: el.getAttribute('aria-busy') ?? null,
  deshabilitado: el.hasAttribute('disabled'),
  hijos: [...el.children].map(forma),
});

const leerCatalogo = () => {
  const consola = new VirtualConsole();
  const fallos: string[] = [];
  consola.on('jsdomError', (e: Error) => {
    const m = String(e.message);
    if (m.includes('Not implemented')) return;
    fallos.push(m);
  });
  const dom = new JSDOM(HTML, {
    virtualConsole: consola,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://127.0.0.1/',
    beforeParse(w: any) {
      w.TextEncoder = TextEncoder;
      w.TextDecoder = TextDecoder;
      w.matchMedia = w.matchMedia ?? ((q: string) => ({
        matches: false, media: q,
        addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {},
      }));
      w.requestAnimationFrame = (f: FrameRequestCallback) =>
        setTimeout(() => f(Date.now()), 0) as unknown as number;
      w.cancelAnimationFrame = (i: number) => clearTimeout(i);
      w.scrollTo = () => {};
    },
  });
  if (fallos.length) {
    throw new Error('el guion del catálogo lanzó: ' + fallos[0].slice(0, 160));
  }
  return dom.window.document;
};

/**
 * El botón de la sección «Ocupado: el gerundio» cuyo rótulo empieza por `et`.
 *
 * ACOTADO A SU SECCIÓN, y no buscado por prefijo en el documento entero: hay
 * 55 rótulos `.mf-et` en el catálogo y tres empiezan por «Sin ». Buscar en todo
 * el documento acertaba **por orden de documento**, y el día que alguien
 * escribiera un «Sin icono» con botón en una página anterior, esta prueba
 * compararía el botón equivocado **en silencio**. Lo midió una auditoría el
 * 2026-09-11.
 */
const delCatalogo = (doc: Document, et: string) => {
  const titulo = [...doc.querySelectorAll('h3')]
    .find((h) => (h.textContent ?? '').includes('Ocupado: el gerundio'));
  expect(titulo, 'el catálogo no tiene la sección «Ocupado: el gerundio»').toBeTruthy();
  // El bloque de muestras es el hermano siguiente del encabezado.
  let bloque: Element | null = titulo!.nextElementSibling;
  while (bloque && !bloque.querySelector('.muestra-fila')) bloque = bloque.nextElementSibling;
  expect(bloque, 'la sección no lleva su fila de muestras').toBeTruthy();

  const marcas = [...bloque!.querySelectorAll('.mf-et')]
    .filter((e) => (e.textContent ?? '').trim().startsWith(et));
  expect(marcas.length, `«${et}» debe casar con UNA muestra, no ${marcas.length}`).toBe(1);
  const btn = marcas[0].parentElement!.querySelector('button');
  expect(btn, `la muestra «${et}» no tiene botón`).toBeTruthy();
  return btn!;
};

describe('el botón ocupado que el catálogo enseña es el que el componente emite', () => {
  it('[10b] EN REPOSO con `textoOcupado`: el hueco del giro y los dos textos', () => {
    const doc = leerCatalogo();
    const { container } = render(
      <Boton variante="principal" textoOcupado="Grabando…" onClick={() => new Promise(() => {})}>
        Guardar
      </Boton>,
    );
    expect(forma(delCatalogo(doc, 'Reposo'))).toEqual(forma(container.querySelector('button')!));
  });

  it('[10b] OCUPADO: el giro gira, los textos se cambian, y mide lo mismo', () => {
    const doc = leerCatalogo();
    const { container } = render(
      <Boton variante="principal" ocupado textoOcupado="Grabando…" onClick={() => {}}>
        Guardar
      </Boton>,
    );
    const delComponente = container.querySelector('button')!;
    const enCatalogo = delCatalogo(doc, 'Ocupado');
    expect(forma(enCatalogo)).toEqual(forma(delComponente));
    // Y el ancho: los dos estados del COMPONENTE tienen los mismos hijos
    // directos, que es de donde salía el salto de 22px. Se mide sobre el
    // componente y no catálogo contra catálogo, que no probaba nada.
    const { container: reposo } = render(
      <Boton variante="principal" textoOcupado="Grabando…" onClick={() => new Promise(() => {})}>
        Guardar
      </Boton>,
    );
    expect(delComponente.children.length)
      .toBe(reposo.querySelector('button')!.children.length);
    expect(enCatalogo.children.length).toBe(delComponente.children.length);
  });

  it('[10c] OCUPADO SIN `textoOcupado`: el lector oye el respaldo', () => {
    const doc = leerCatalogo();
    const { container } = render(
      <Boton variante="principal" ocupado onClick={() => {}}>Guardar</Boton>,
    );
    const enCatalogo = delCatalogo(doc, 'Sin ');
    expect(forma(enCatalogo)).toEqual(forma(container.querySelector('button')!));
    expect(enCatalogo.querySelector('.sr-solo')?.textContent).toBe(', enviando');
  });
});
