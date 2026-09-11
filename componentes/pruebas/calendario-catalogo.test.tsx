/**
 * R126 · EL CALENDARIO DEL CATÁLOGO CONTRA EL QUE EMITE EL COMPONENTE.
 *
 * R126 nació de que las dos superficies tenían anatomías distintas: el catálogo
 * metía las celdas planas en `.fc-dias` y el componente anidaba filas. Una
 * misma regla servía a una y destrozaba la otra, y se arregló DOS VECES sin
 * cerrarlo —la primera dejando la regla vieja puesta, la segunda dejando la
 * celda de rejilla sin estirar—.
 *
 * Mientras la garantía sea «lo miré», vuelve. Esto ejecuta el catálogo de
 * verdad —`cascaron/index.html`, con su guion, en jsdom—, abre su calendario, y
 * compara el árbol con el que emite React. Es el mismo método que R116 usó para
 * la lista del selector, y por la misma razón: **lo que el catálogo no pinta en
 * reposo, no lo compara ningún candado** — y el cuerpo del calendario es un
 * `<div>` vacío hasta que alguien lo abre.
 *
 * QUÉ NO COMPARA, y por qué:
 *   · el CONTENIDO de las celdas —los números— porque los dos calendarios
 *     enseñan meses distintos: el catálogo arranca en el mes de hoy y el
 *     componente recibe su `hoy` inyectado. Lo que se compara es la FORMA.
 *   · `aria-label` de la rejilla, que lleva el nombre del mes.
 */
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { RangoFecha } from '../src/RangoFecha';

const CATALOGO = resolve(process.cwd(), '..', 'cascaron', 'index.html');

let HTML: string;
beforeAll(() => { HTML = readFileSync(CATALOGO, 'utf8'); });

/** La forma de un árbol: etiqueta, clases y los `role` — sin texto ni ids. */
const forma = (el: Element): unknown => ({
  tag: el.tagName.toLowerCase(),
  clases: [...el.classList].sort().join(' '),
  role: el.getAttribute('role') ?? null,
  hijos: [...el.children].map(forma),
});

const abrirCatalogo = () => {
  const consola = new VirtualConsole();
  /* Los errores del guion NO se tragan: tragárselos fue lo que ocultó que el
     catálogo ni siquiera se abría. `TextEncoder` no existe en jsdom y el guion
     lo usa, así que una excepción mataba el bloque entero y el calendario no
     llegaba a pintarse — con la consola muda, la prueba solo decía «null». */
  const fallos: string[] = [];
  consola.on('jsdomError', (e: Error) => {
    const m = String(e.message);
    // `canvas.getContext` es una carencia de jsdom, no del catálogo: hay demos
    // que dibujan en lienzo. Lo que sí importa es que el GUION no reviente.
    if (m.includes('Not implemented')) return;
    fallos.push(m);
  });
  const dom = new JSDOM(HTML, {
    virtualConsole: consola,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://127.0.0.1/',
    beforeParse(w: any) {
      /* Las mismas suplencias que `selector-desplegado-catalogo.test.tsx`, y
         por la misma razón que su comentario ya avisaba: sin ellas el PRIMER
         guion revienta, ninguno posterior llega a registrarse, y la prueba
         pasaría comparando dos vacíos. */
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
  const doc = dom.window.document;
  const campo = doc.getElementById('fc-ini') as HTMLElement | null;
  if (!campo) throw new Error('el catálogo no tiene el campo del rango');
  campo.dispatchEvent(new dom.window.Event('focus', { bubbles: true }));
  campo.click();
  /**
   * EL GUION DEL CATÁLOGO NO PUEDE LANZAR, pase lo que pase.
   *
   * El CSS y el marcado viven en una plantilla de JavaScript, así que un
   * backtick en un comentario del guion no rompe el generador: rompe el
   * archivo GENERADO. El generador termina con éxito y publica un catálogo
   * cuyo guion muere en la primera línea — sin navegación y sin nada. Pasó
   * cuatro veces en un solo día.
   *
   * Se comprueba EJECUTÁNDOLO, no leyéndolo: un troceador por texto se corta
   * solo en cuanto hay un `</script>` dentro de un bloque de cargamento.
   */
  if (fallos.length) {
    throw new Error('el guion del catálogo lanzó: ' + fallos[0].slice(0, 160));
  }
  return doc;
};

describe('R126 · una sola anatomía', () => {
  it('la rejilla del catálogo tiene la MISMA forma que la del componente', () => {
    const doc = abrirCatalogo();
    const delCatalogo = doc.querySelector('.fc-dias');
    expect(delCatalogo, 'el catálogo no pintó el calendario').not.toBeNull();

    /* El mes SALE DEL CATÁLOGO, no se escribe aquí: el catálogo arranca en el
       mes de hoy y el componente recibe su `hoy` inyectado. Si se escribiera,
       la prueba compararía dos calendarios distintos y fallaría por el número
       de semanas, que no es lo que se quiere fijar. */
    const titulo = doc.querySelector('.fc-mes-tit')!.textContent!.trim();
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const [nombreMes, , anio] = titulo.split(' ');
    const mes = MESES.indexOf(nombreMes.toLowerCase());
    expect(mes, `no se pudo leer el mes del catálogo: «${titulo}»`).toBeGreaterThanOrEqual(0);

    const { container } = render(
      <RangoFecha titulo="Periodo" hoy={new Date(Number(anio), mes, 1)} />,
    );
    // El componente lo pinta al abrir. `fireEvent` y no `.click()` nativo:
    // hace falta que React aplique el cambio de estado antes de mirar el árbol.
    fireEvent.click(container.querySelector('button.fc-campo') as HTMLElement);
    const delComponente = container.querySelector('.fc-dias');
    expect(delComponente).not.toBeNull();

    expect(forma(delCatalogo!)).toEqual(forma(delComponente!));
  });

  it('el contenedor es `role="grid"` en las dos, y sus hijos son filas', () => {
    const doc = abrirCatalogo();
    const d = doc.querySelector('.fc-dias')!;
    expect(d.getAttribute('role')).toBe('grid');
    expect([...d.children].every((h) => h.getAttribute('role') === 'row')).toBe(true);
    // ARIA exige que dentro de un `grid` los hijos de fila sean celdas. El
    // catálogo llegó a emitir `role="row"` con botones sueltos dentro, que es
    // ponerle un rol que el marcado no sostiene para enganchar un selector.
    for (const fila of [...d.children].slice(1)) {
      expect([...fila.children].every((c) => c.getAttribute('role') === 'gridcell')).toBe(true);
    }
  });

  it('todas las filas tienen SIETE celdas, también la última', () => {
    const doc = abrirCatalogo();
    const filas = [...doc.querySelector('.fc-dias')!.children].slice(1);
    expect(filas.length).toBeGreaterThan(3);
    for (const f of filas) expect(f.children.length).toBe(7);
  });

  it('la cabecera de días va DENTRO de la rejilla, como una fila más', () => {
    const doc = abrirCatalogo();
    const sem = doc.querySelector('.fc-sem')!;
    expect(sem.parentElement!.classList.contains('fc-dias')).toBe(true);
    expect(sem.getAttribute('role')).toBe('row');
    expect([...sem.children].every((c) => c.getAttribute('role') === 'columnheader')).toBe(true);
  });
});
