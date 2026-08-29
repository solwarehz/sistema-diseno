/**
 * R116 · EL DESPLEGADO DEL SELECTOR: EL CATÁLOGO CONTRA EL COMPONENTE.
 *
 * Esta prueba existe por lo que R115 dejó abierto. Aquel día se arreglaron
 * nueve divergencias del selector con búsqueda **a mano**, y las diecisiete
 * pruebas que las fijan (`selector-busqueda-promesa.test.tsx`) escriben a mano
 * lo que el catálogo enseñaba ESE día. Eso protege del olvido, no de la
 * deriva: el día que alguien toque el guion del catálogo, esas diecisiete
 * seguirán en verde con las dos superficies otra vez distintas — que es
 * exactamente cómo nacieron las nueve.
 *
 * La diferencia de esta prueba es que **no escribe lo que espera**. Abre el
 * catálogo de verdad —`cascaron/index.html`, con su guion, en jsdom—, lo
 * despliega, y compara el árbol que sale con el que emite React alimentado con
 * **los mismos datos**, sacados del propio catálogo. No hay una tercera copia
 * de la verdad que pueda quedarse vieja.
 *
 * Es la respuesta al hueco que la memoria declara desde la v1.48.0: «lo que el
 * catálogo no pinta, no se compara». La lista del selector solo existe cuando
 * alguien la abre, así que ninguno de los dieciséis candados —que leen marcado
 * estático— llega hasta aquí.
 *
 * QUÉ NO COMPARA, y por qué:
 *   · `id` y `data-i` — identificadores, no los mira ninguna regla de la hoja.
 *     El catálogo numera `sel-op-N`; React usa `useId()`, que es único por
 *     instancia y NO puede coincidir. Compararlos sería exigir un imposible.
 *   · `aria-selected="false"` — el catálogo omite el atributo y React lo emite
 *     en falso. Las dos formas son válidas y la hoja solo mira `="true"`, así
 *     que se comparan como booleano. Queda declarado aquí y no escondido.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { SelectorBusqueda } from '../src/SelectorBusqueda';

/* `import.meta.url` en Vite devuelve una ruta `/@fs/...` que `readFileSync` no
   abre. La raíz del proyecto es el padre de `componentes/`, que es el cwd. */
const CATALOGO = resolve(process.cwd(), '..', 'cascaron', 'index.html');

/* ── El catálogo, ejecutándose de verdad ─────────────────────────────────── */

type Catalogo = {
  ventana: Window & typeof globalThis;
  raiz: Element;
  campo: HTMLInputElement;
  lista: HTMLElement;
  caja: HTMLElement;
};

let cat: Catalogo;
let HTML: string;
/** Las opciones y las ayudas SALEN DEL CATÁLOGO. Si se escribieran aquí, esto
 *  volvería a ser una tercera copia que se queda vieja. */
let OPCIONES: string[];
let AYUDA: Record<string, string>;
let VACIO: string;

/**
 * Se monta un catálogo NUEVO por prueba, y no uno solo para todas.
 *
 * El guion del catálogo guarda su elección en una clausura que desde fuera no
 * se puede vaciar, así que con un montaje compartido la prueba de «con una
 * opción elegida» dejaba esa elección puesta para las siguientes. Las de
 * después pasaban —pero por el ORDEN en que corren, no porque comparasen lo
 * que dicen comparar. Una prueba que depende del orden es una prueba que un
 * día se reordena y miente.
 */
const montarCatalogo = (): Catalogo => {
  /* El catálogo tiene demos que llaman a `canvas.getContext`, que jsdom no
     implementa. No afecta al selector, pero llena la salida de las pruebas de
     ruido y una salida ilegible es una salida que nadie lee. */
  const consola = new VirtualConsole();
  consola.on('jsdomError', () => {});

  const dom = new JSDOM(HTML, {
    virtualConsole: consola,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://127.0.0.1/',
    beforeParse(w: any) {
      /* jsdom no trae estas dos y el catálogo las usa. Sin ellas el PRIMER
         guion revienta y ninguno posterior llega a registrarse: la lista no se
         abriría nunca y la prueba pasaría comparando dos vacíos. */
      (w as any).TextEncoder = TextEncoder;
      (w as any).TextDecoder = TextDecoder;
      (w as any).matchMedia = (w as any).matchMedia ?? ((q: string) => ({
        matches: false, media: q,
        addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {},
      }));
      (w as any).requestAnimationFrame = (f: FrameRequestCallback) =>
        setTimeout(() => f(Date.now()), 0) as unknown as number;
      (w as any).cancelAnimationFrame = (i: number) => clearTimeout(i);
      (w as any).scrollTo = () => {};
    },
  });

  const ventana = dom.window as unknown as Window & typeof globalThis;
  const raiz = ventana.document.querySelector('[data-sel]');
  if (!raiz) throw new Error('el catálogo no tiene [data-sel]: la demo del selector cambió de forma');

  return {
    ventana,
    raiz,
    campo: raiz.querySelector('.sel-in') as HTMLInputElement,
    lista: raiz.querySelector('.sel-lista') as HTMLElement,
    caja: raiz.querySelector('.sel-caja') as HTMLElement,
  };
};

beforeAll(() => {
  HTML = readFileSync(CATALOGO, 'utf8');

  /* Los datos del guion, leídos del propio HTML generado. */
  const leer = <T,>(nombre: string): T => {
    const m = HTML.match(new RegExp(`var ${nombre} = (\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\});`));
    if (!m) throw new Error(`no se encontró «var ${nombre}» en el catálogo`);
    return JSON.parse(m[1]) as T;
  };
  OPCIONES = leer<string[]>('OPCIONES');
  AYUDA = leer<Record<string, string>>('AYUDA');
  const mv = HTML.match(/var VACIO = '([^']*)';/);
  if (!mv) throw new Error('no se encontró «var VACIO» en el catálogo');
  VACIO = mv[1];
});

beforeEach(() => { cat = montarCatalogo(); });

/** Gestos sobre el catálogo. Son los suyos: `focus`, `input` y `keydown`. */
const catEnfocar = () => {
  cat.campo.focus();
  cat.campo.dispatchEvent(new cat.ventana.Event('focus', { bubbles: true }));
};
const catEscribir = (t: string) => {
  cat.campo.value = t;
  cat.campo.dispatchEvent(new cat.ventana.Event('input', { bubbles: true }));
};
const catTecla = (key: string) =>
  cat.campo.dispatchEvent(new cat.ventana.KeyboardEvent('keydown', { key, bubbles: true }));

/* ── La forma comparable ─────────────────────────────────────────────────── */

/**
 * Reduce un elemento a lo que la hoja SÍ mira: etiqueta, clases, el
 * `aria-selected` en verdadero, el texto propio y sus hijos en ORDEN.
 *
 * El orden es la mitad del asunto: A2 de la auditoría —el visto 298,4 px fuera
 * de sitio— no lo decidía ninguna regla CSS, lo decidía el orden de los hijos
 * bajo `space-between`. Un comparador que ordenara los hijos no lo vería.
 */
type Nodo = { et: string; clases: string[]; elegida: boolean; texto: string; hijos: Nodo[] };

const forma = (el: Element): Nodo => ({
  et: el.tagName.toLowerCase(),
  clases: [...el.classList].sort(),
  elegida: el.getAttribute('aria-selected') === 'true',
  // Solo el texto DIRECTO: el de los hijos ya viaja en sus propios nodos.
  texto: [...el.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent ?? '')
    .join('')
    .trim(),
  hijos: [...el.children]
    // El SVG del icono lo compara `verificar-iconos`; aquí solo importa que el
    // hueco del icono esté y que esté en el mismo sitio.
    .filter((h) => h.tagName.toLowerCase() !== 'svg')
    .map(forma),
});

const filasDe = (lista: Element): Nodo[] => [...lista.children].map(forma);

/* ── El componente, con los datos del catálogo ───────────────────────────── */

const comoOpciones = () =>
  OPCIONES.map((t) => ({ valor: t, texto: t, ...(AYUDA[t] ? { ayuda: AYUDA[t] } : {}) }));

/** El catálogo SIEMPRE ofrece crear y SIEMPRE ofrece vaciar: para comparar,
 *  el componente tiene que estar puesto igual. Un componente con menos
 *  capacidades encendidas produciría menos filas y la diferencia sería del
 *  montaje, no del sistema. */
const pintar = (valor: string | null = null) =>
  render(
    <SelectorBusqueda
      etiqueta="Apoderado"
      opciones={comoOpciones()}
      valor={valor}
      onCambio={() => {}}
      vacio={VACIO}
      onCrear={() => {}}
    />,
  );

const listaDe = (raiz: HTMLElement) => raiz.querySelector('.sel-lista') as HTMLElement;
const cajaDe = (raiz: HTMLElement) => raiz.querySelector('.sel-caja') as HTMLElement;

/* ── Las comparaciones ───────────────────────────────────────────────────── */

describe('R116 · el desplegado que el catálogo enseña es el que el componente emite', () => {
  it('los datos salen del catálogo, no de esta prueba', () => {
    // Si esto falla, lo de abajo compara aire.
    expect(OPCIONES.length).toBeGreaterThan(5);
    expect(Object.keys(AYUDA).length).toBeGreaterThan(0);
    expect(VACIO).toBeTruthy();
  });

  it('A · abierta, sin texto y sin elección: las mismas filas, en el mismo orden', async () => {
    catEnfocar();
    expect(cat.lista.hidden).toBe(false);

    const u = userEvent.setup();
    const { container } = pintar();
    await u.click(screen.getByRole('combobox'));

    expect(filasDe(listaDe(container))).toEqual(filasDe(cat.lista));
  });

  it('B · con una opción elegida: el mando de vaciar, el visto y su LADO', async () => {
    // El catálogo elige la primera con Enter y vuelve a abrir.
    catEnfocar();
    catTecla('Enter');
    catEnfocar();
    const elegidaCat = cat.lista.querySelector('[aria-selected="true"]');
    expect(elegidaCat, 'el catálogo no marcó ninguna opción como elegida').not.toBeNull();

    const u = userEvent.setup();
    const { container } = pintar(elegidaCat!.textContent!.trim());
    await u.click(screen.getByRole('combobox'));

    expect(filasDe(listaDe(container))).toEqual(filasDe(cat.lista));
  });

  it('C · texto sin coincidencia: la fila de crear, igual en las dos', async () => {
    catEnfocar();
    catEscribir('zzzz');

    const u = userEvent.setup();
    const { container } = pintar();
    await u.click(screen.getByRole('combobox'));
    await u.keyboard('zzzz');

    expect(filasDe(listaDe(container))).toEqual(filasDe(cat.lista));
  });

  it('D · texto con coincidencia: una sola fila, con su ayuda dentro', async () => {
    const conAyuda = Object.keys(AYUDA)[0];
    const trozo = conAyuda.slice(0, 5);

    catEnfocar();
    catEscribir(trozo);

    const u = userEvent.setup();
    const { container } = pintar();
    await u.click(screen.getByRole('combobox'));
    await u.keyboard(trozo);

    const nuestras = filasDe(listaDe(container));
    expect(nuestras).toEqual(filasDe(cat.lista));
    // Y que la comparación no sea trivial: tiene que haber salido la ayuda.
    expect(JSON.stringify(nuestras)).toContain('sel-notas');
  });

  /**
   * DECLARADO Y SIN PROMESA: el vacío POR OMISIÓN.
   *
   * El catálogo no puede llegar nunca a `.sel-vacio`. Su guion añade la fila de
   * «crear» siempre que hay texto sin coincidencias, y sin texto la lista trae
   * las 19 opciones: la rama del vacío está escrita y es inalcanzable.
   *
   * El componente SÍ llega a ella, y es su estado por omisión: `onCrear` es
   * opcional, así que un producto que no lo pase ve `.sel-vacio` — la hoja le
   * viaja `.sel-vacio` y `.sel-vacio strong`, y el catálogo no enseña ninguna
   * de las dos. Es la misma familia que R104, la variante sin lupa.
   *
   * Mientras no haya demo, aquí se fija lo único que se puede fijar sin
   * inventar la promesa: que el componente emite lo que la hoja estiliza.
   */
  it('G · el vacío por omisión emite lo que la hoja estiliza (sin promesa en el catálogo)', async () => {
    expect(cat.lista.querySelector('.sel-vacio'), 'el catálogo ya alcanza .sel-vacio: esta prueba se queda corta y hay que compararlo de verdad').toBeNull();

    const u = userEvent.setup();
    const { container } = render(
      <SelectorBusqueda
        etiqueta="Apoderado"
        opciones={comoOpciones()}
        valor={null}
        onCambio={() => {}}
      />,
    );
    await u.click(screen.getByRole('combobox'));
    await u.keyboard('zzzz');

    const vacio = listaDe(container).querySelector('.sel-vacio');
    expect(vacio, 'sin `onCrear` el vacío tiene que ser `.sel-vacio`').not.toBeNull();
    expect(vacio!.querySelector('strong'), 'la hoja estiliza `.sel-vacio strong`').not.toBeNull();
  });

  it('E · la caja lleva las mismas clases abierta y cerrada', async () => {
    const u = userEvent.setup();
    const { container } = pintar();

    // Cerrada.
    expect([...cajaDe(container).classList].sort())
      .toEqual([...cat.caja.classList].sort());

    // Abierta: `abierta` es la clase que R115 encontró muerta en el paquete.
    catEnfocar();
    await u.click(screen.getByRole('combobox'));
    expect([...cajaDe(container).classList].sort())
      .toEqual([...cat.caja.classList].sort());
    expect([...cajaDe(container).classList]).toContain('abierta');
  });

  it('F · el orden de los hijos de la caja es el mismo', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await u.click(screen.getByRole('combobox'));
    catEnfocar();

    const hijos = (c: Element) => [...c.children].map((h) =>
      h.tagName.toLowerCase() === 'input' ? 'input' : [...h.classList].join('.'));

    expect(hijos(cajaDe(container))).toEqual(hijos(cat.caja));
  });
});
