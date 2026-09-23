/**
 * R159 · PRIMERO SE LLENA EL AREA, Y DESPUES SE DESLIZA.
 *
 * Lo cortó el responsable mirando el tablero en una tablet: «si se ocupa todo
 * el espacio y no queda más, recién se hace scroll horizontal». Un tablero que
 * deja media pantalla en blanco y aun así obliga a deslizar convierte la
 * paginación por gesto en desbordamiento con otro nombre — que es justo la
 * distinción que el R157 dejó escrita.
 */
import { describe, it, expect, vi } from 'vitest';
import { useRef } from 'react';
import { render, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  capacidadDeRejilla, enPaginas, useCapacidadTablero,
  ANCHO_CELDA_TABLERO, ALTO_CELDA_TABLERO, HUECO_TABLERO, HUECO_TABLERO_ANCHO,
} from '../src/tablero';

const css = readFileSync(
  join(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'), 'utf8');
const regla = (sel: string) => {
  const i = css.indexOf(`\n${sel}{`);
  return i === -1 ? '' : css.slice(i, css.indexOf('}', i));
};

describe('R159 · la capacidad la calcula el sistema', () => {
  it('[11] la cuenta cabe de verdad en la caja que se midió', () => {
    /* La comprobación que importa: lo que dice que cabe, cabe. Se verifica
       rehaciendo la aritmética de la rejilla en cada caso. */
    for (const [w, h] of [[293, 477], [541, 131], [753, 391], [1133, 591], [360, 640]]) {
      const { columnas, filas } = capacidadDeRejilla(w, h);
      const hueco = w >= 768 ? HUECO_TABLERO_ANCHO : HUECO_TABLERO;
      const ocupaAncho = columnas * ANCHO_CELDA_TABLERO + (columnas - 1) * hueco;
      const ocupaAlto = filas * ALTO_CELDA_TABLERO + (filas - 1) * hueco;
      expect(ocupaAncho, `${columnas} columnas NO caben en ${w}px`).toBeLessThanOrEqual(w);
      expect(ocupaAlto, `${filas} filas NO caben en ${h}px`).toBeLessThanOrEqual(h);
    }
  });

  it('[11] y no deja sitio de sobra: una más ya NO cabría', () => {
    /* Lo contrario del anterior, y es la mitad que hace falta: una cuenta
       prudente que devolviera siempre 1 pasaría la prueba de arriba y dejaría
       la pantalla medio vacía, que es el defecto que se vino a arreglar. */
    for (const [w, h] of [[293, 477], [753, 391], [1133, 591]]) {
      const { columnas, filas } = capacidadDeRejilla(w, h);
      const hueco = w >= 768 ? HUECO_TABLERO_ANCHO : HUECO_TABLERO;
      expect((columnas + 1) * ANCHO_CELDA_TABLERO + columnas * hueco,
        `cabría otra columna en ${w}px y se está desperdiciando`).toBeGreaterThan(w);
      expect((filas + 1) * ALTO_CELDA_TABLERO + filas * hueco,
        `cabría otra fila en ${h}px y se está desperdiciando`).toBeGreaterThan(h);
    }
  });

  it('[11] una caja sin medir todavía da 1×1, nunca 0', () => {
    /* Un cero aquí hace dividir por cero a quien trocee la lista, y deja la
       primera pintada en blanco. Una celda es lo mínimo honesto mientras se
       mide. */
    for (const [w, h] of [[0, 0], [10, 10], [-5, 40]]) {
      const c = capacidadDeRejilla(w, h);
      expect(c.columnas).toBeGreaterThanOrEqual(1);
      expect(c.filas).toBeGreaterThanOrEqual(1);
      expect(c.porPagina).toBeGreaterThanOrEqual(1);
    }
  });

  it('[11] el hueco de la cuenta es el MISMO que el de la hoja', () => {
    /* Si la hoja sube el hueco a 12 y la cuenta sigue en 8, la última columna
       de cada página se sale. Los dos números salen del mismo sitio o un día
       dejan de coincidir. Sin RegExp construida: se compara el texto. */
    expect(regla('.tn-densa'), 'el hueco estrecho de la hoja no es el de la cuenta')
      .toContain(`gap: ${HUECO_TABLERO}px`);
    const ancho = css.slice(css.indexOf('@media (min-width: 768px)'));
    expect(ancho.slice(0, 400), 'el hueco ancho de la hoja no es el de la cuenta')
      .toContain(`gap: ${HUECO_TABLERO_ANCHO}px`);
  });

  it('[11] y los suelos de celda de la hoja son los de la cuenta', () => {
    expect(regla('.tn-densa-llena'), 'la hoja y la cuenta no miden el mismo ALTO de celda')
      .toContain(`minmax(${ALTO_CELDA_TABLERO}px`);
    expect(regla('.tn-densa'), 'la hoja y la cuenta no miden el mismo ANCHO de celda')
      .toContain(`minmax(${ANCHO_CELDA_TABLERO}px`);
  });
});

describe('R159 · el troceo en páginas', () => {
  it('[11] reparte sin perder ni repetir a nadie', () => {
    const gente = Array.from({ length: 23 }, (_, i) => i);
    const pags = enPaginas(gente, 5);
    expect(pags.map((p) => p.length)).toEqual([5, 5, 5, 5, 3]);
    expect(pags.flat(), 'alguien se perdió o salió dos veces').toEqual(gente);
  });

  it('[11] una lista vacía es UNA página vacía, no cero', () => {
    /* El carril necesita una parada que enseñar, y su cuenta no puede decir
       «0 de 0». */
    expect(enPaginas([], 5)).toEqual([[]]);
  });

  it('[11] con capacidad imposible no se pierde a nadie', () => {
    /* Antes que dejar fuera a una persona, se devuelve todo en una página:
       una rejilla apretada se ve; una persona que no aparece, no. */
    expect(enPaginas([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
  });
});

describe('R159 · lo que la hoja tiene que garantizar', () => {
  it('[11] el cuerpo del tablero NO se desplaza en vertical', () => {
    /* Es la petición literal: «elimina el scroll vertical para en-vivo». Y no
       es capricho: el gesto vertical y el horizontal competirían en la misma
       superficie, y en un teléfono se intenta pasar de página y la rejilla
       baja. Lo que no cabe va a la siguiente pantalla, no más abajo. */
    const r = regla('.tbl-lleno');
    expect(r, 'no existe el cuerpo que llena').not.toBe('');
    expect(r, 'el cuerpo se desplaza en vertical: el gesto compite con el del carril')
      .toMatch(/overflow:\s*hidden/);
    expect(r, 'sin `min-height: 0` el cuerpo no baja y empuja el pie fuera')
      .toMatch(/min-height:\s*0/);
  });

  it('[11] la rejilla reparte FILAS, no solo columnas', () => {
    /* Sin esto las celdas se apilan arriba y queda media pantalla en blanco
       con el carril pidiendo que deslices. */
    const r = regla('.tn-densa-llena');
    expect(r, 'la rejilla no reparte filas: no llena el alto')
      .toMatch(/grid-template-rows:\s*repeat\(auto-fill/);
    expect(r, 'las filas no se estiran hasta llenar').toMatch(/1fr\)/);
    expect(r, 'la rejilla no toma el alto de su página').toMatch(/height:\s*100%/);
  });

  it('[11] y cada parada del carril ocupa el alto completo', () => {
    expect(regla('.car-pagina'), 'las paradas no llenan el alto').toMatch(/height:\s*100%/);
    expect(regla('.car-pagina > *'), 'la página de dentro no llena el alto')
      .toMatch(/height:\s*100%/);
  });
});

describe('R160 · dos defectos que se vieron en la misma pantalla', () => {
  it('[13] la burbuja declara su propio `line-height`, no lo hereda', () => {
    /* `.tbl-foto` declara `line-height: 0` para matar el hueco de línea del
       avatar, y la burbuja lo HEREDABA: su caja de texto medía cero de alto y
       `place-items: center` centraba una línea vacía. Medido en el catálogo
       antes del arreglo: `line-height: 0px` en el `.badge`. Con dos cifras se
       veía; con una, casi no. */
    const b = regla('.badge');
    expect(b, 'la burbuja no declara su interlineado y hereda el 0 de `.tbl-foto`')
      .toMatch(/line-height:\s*1\b/);
    expect(regla('.tbl-foto'), 'si `.tbl-foto` deja de declarar 0, esta regla sobra')
      .toMatch(/line-height:\s*0/);
  });

  it('[13] y se despega de la foto con su anillo', () => {
    /* Un círculo rojo sobre una fotografía con el pelo oscuro detrás se
       confunde con el borde. Es el mismo recurso que ya usa el anillo de
       estado del avatar. */
    expect(regla('.badge'), 'la burbuja no se despega del fondo que tenga detrás')
      .toMatch(/box-shadow:[^;]*var\(--fondo-tarjeta\)/);
  });

  it('[13] la foto del avatar encuadra a la CARA, no al centro', () => {
    /* `cover` recorta. Con el punto por omisión, una foto vertical de carnet
       pierde la parte de arriba. Medido: el centro corta 5,4 px de cabeza en
       un 3:4 y el 30 % corta 2,2; en una vertical de móvil, 15,2 contra 7,8.
       No lo elimina —ninguna cifra sirve para todas las proporciones— y por eso
       el contrato dice que el arreglo de raíz es recortar al subir. */
    const i = css.indexOf('.avatar img');
    expect(i, 'la hoja no estiliza la foto del avatar').toBeGreaterThan(-1);
    const r = css.slice(i, css.indexOf('}', i));
    expect(r, 'la foto se recorta por el centro y se come la cabeza')
      .toMatch(/object-position:\s*50%\s*30%/);
    expect(r, 'sin `cover` no hay recorte que encuadrar').toMatch(/object-fit:\s*cover/);
  });
});

describe('R159 · lo que una auditoría encontró en esta misma pieza', () => {
  it('[12] el umbral del hueco mide la VENTANA, no la caja', () => {
    /* La hoja sube el hueco con `@media (min-width: 768px)`, que mide el
       VIEWPORT. La cuenta lo decidía por el ancho de la CAJA, así que con una
       ventana ancha y una caja estrecha la hoja usaba 12 y la cuenta 8: se
       pasaba de una columna y, con `overflow: hidden`, esa columna se recortaba
       en silencio. Una auditoría barrió 112 anchos afectados. */
    const caja = 753;
    // ventana estrecha: hueco de 8
    const estrecha = capacidadDeRejilla(caja, 400, 500);
    // ventana ancha con la MISMA caja: hueco de 12, así que caben menos
    const ancha = capacidadDeRejilla(caja, 400, 1200);
    expect(ancha.columnas, 'con hueco mayor tienen que caber MENOS columnas, no las mismas')
      .toBeLessThan(estrecha.columnas);
    // y la que dice la ventana ancha cabe de verdad con el hueco de la hoja
    const n = ancha.columnas;
    expect(n * ANCHO_CELDA_TABLERO + (n - 1) * HUECO_TABLERO_ANCHO,
      'la cuenta se pasa: la última columna se recortaría').toBeLessThanOrEqual(caja);
  });

  it('[12] una medida que no es un número NO hace desaparecer a nadie', () => {
    /* `Math.max(1, NaN)` es NaN, no 1. El NaN se colaba hasta `enPaginas`,
       donde `NaN < 1` es FALSE, `i += NaN` cortaba el bucle al primer paso y la
       lista entera desaparecía SIN ERROR: una página vacía y nadie dentro. */
    for (const malo of [NaN, Infinity, -Infinity]) {
      const c = capacidadDeRejilla(malo, malo, malo);
      expect(Number.isFinite(c.porPagina), `con ${malo} la capacidad no es un número`).toBe(true);
      expect(c.porPagina).toBeGreaterThanOrEqual(1);
    }
    const gente = [1, 2, 3, 4, 5];
    for (const malo of [NaN, 0, -3, Infinity]) {
      const pags = enPaginas(gente, malo);
      expect(pags.flat(), `con porPagina=${malo} se pierde gente`).toEqual(gente);
    }
  });

  it('[12] y una lista vacía es UNA página vacía también con capacidad imposible', () => {
    /* Antes devolvía CERO páginas por ese camino, contradiciendo su propio
       comentario. El carril necesita una parada que enseñar. */
    for (const malo of [NaN, 0, -1, 5]) {
      expect(enPaginas([], malo), `con porPagina=${malo} el carril se queda sin paradas`)
        .toEqual([[]]);
    }
  });
});

describe('R159 · el gancho, que es la mitad publicada de la pieza', () => {
  /* La regla 12 dice «se publica el gancho, no sólo la cuenta», y una auditoría
     encontró que el gancho NO tenía ni una prueba: las tres escuchas, su
     limpieza y el ahorro de renders eran una promesa. */
  function Sonda({ alto = 400, ancho = 300, onRender }: {
    alto?: number; ancho?: number; onRender?: () => void;
  }) {
    const caja = useRef<HTMLDivElement>(null);
    const cap = useCapacidadTablero(caja);
    onRender?.();
    return (
      <div ref={caja} data-cap={`${cap.columnas}x${cap.filas}`}
           style={{ width: ancho, height: alto }} />
    );
  }

  it('[12] mide al montar, sin esperar a que nada cambie', () => {
    /* jsdom devuelve 0 en `getBoundingClientRect`, así que lo que se comprueba
       aquí es el suelo: una caja sin medir da 1×1 y NUNCA 0. Un cero haría
       dividir por cero a quien trocee la lista. */
    const { container } = render(<Sonda />);
    const cap = container.firstElementChild?.getAttribute('data-cap');
    expect(cap, 'el gancho no midió al montar').toBeTruthy();
    const [c, f] = cap!.split('x').map(Number);
    expect(c).toBeGreaterThanOrEqual(1);
    expect(f).toBeGreaterThanOrEqual(1);
  });

  it('[12] suelta SUS TRES escuchas al desmontar', () => {
    /* Tres fuentes: observador de caja, `resize` de ventana y `visualViewport`.
       Si alguna se queda viva, cada tablero que se monte y desmonte deja una
       escucha midiendo una caja que ya no existe. */
    const suma = vi.spyOn(window, 'addEventListener');
    const resta = vi.spyOn(window, 'removeEventListener');
    let desconectado = 0;
    const RO = globalThis.ResizeObserver;
    class Espia {
      observe() {}
      unobserve() {}
      disconnect() { desconectado += 1; }
    }
    (globalThis as any).ResizeObserver = Espia;

    const { unmount } = render(<Sonda />);
    const puestas = suma.mock.calls.filter(([e]) => e === 'resize').length;
    expect(puestas, 'el gancho no escucha el `resize` de la ventana').toBeGreaterThanOrEqual(1);
    unmount();
    const quitadas = resta.mock.calls.filter(([e]) => e === 'resize').length;
    expect(quitadas, 'deja viva la escucha de `resize` al desmontar').toBe(puestas);
    expect(desconectado, 'no desconecta el observador de caja').toBe(1);

    (globalThis as any).ResizeObserver = RO;
    suma.mockRestore(); resta.mockRestore();
  });

  it('[12] no re-renderiza cuando la capacidad NO cambia', () => {
    /* Un `ResizeObserver` dispara por cualquier fracción de píxel; sin comparar
       antes de asignar, cada uno sería un render de la rejilla entera. */
    let renders = 0;
    render(<Sonda onRender={() => { renders += 1; }} />);
    const alMontar = renders;
    act(() => {
      for (let i = 0; i < 5; i += 1) window.dispatchEvent(new Event('resize'));
    });
    expect(renders, 'cada medida repetida provoca un render de la rejilla entera')
      .toBe(alMontar);
  });

  it('[12] con la caja todavía sin montar NO se queda mudo para siempre', () => {
    /* Hacía `if (!el) return` con dependencias `[caja]`, así que no volvía a
       intentarlo nunca: quien montara el carril de forma condicional se quedaba
       en 1×1 de por vida. Ahora escucha igual y comprueba en cada medida. */
    function SinCaja() {
      const caja = useRef<HTMLDivElement>(null);   // nunca se asigna
      const cap = useCapacidadTablero(caja);
      return <span data-cap={`${cap.columnas}x${cap.filas}`} />;
    }
    const suma = vi.spyOn(window, 'addEventListener');
    const { container } = render(<SinCaja />);
    expect(suma.mock.calls.filter(([e]) => e === 'resize').length,
      'sin caja no se suscribe, y entonces no se entera cuando aparezca')
      .toBeGreaterThanOrEqual(1);
    expect(container.firstElementChild?.getAttribute('data-cap'),
      'sin caja tiene que dar el suelo, no romperse').toBe('1x1');
    expect(() => act(() => { window.dispatchEvent(new Event('resize')); }),
      'medir sin caja revienta').not.toThrow();
    suma.mockRestore();
  });
});

describe('R159 · lo que una auditoría en navegador encontró', () => {
  it('[13] la burbuja se ancla al AVATAR, no al borde de la celda', () => {
    /* `.tbl-foto` era `width: 100%` de la celda, así que la burbuja —`right:
       1px`— se pegaba al borde de la CELDA y no al de la foto. Medido en el
       catálogo: hasta 12,7 px de aire entre el disco y el número, flotando en
       el vacío. El tope es el mismo 48 del mayor de la escala. */
    const foto = regla('.tbl-foto');
    expect(foto, 'la foto se estira a toda la celda y la burbuja se va con ella')
      .toMatch(/max-width:\s*48px/);
    expect(foto, 'sin centrado propio, la foto acotada se pega a la izquierda')
      .toMatch(/margin-inline:\s*auto/);
    /* Y el tope tiene que ser el MISMO que el del avatar fluido, o la foto y su
       caja dejan de medir lo mismo. */
    const av = /max-width:\s*(\d+)px/.exec(regla('.avatar-fluido'))?.[1];
    const fo = /max-width:\s*(\d+)px/.exec(foto)?.[1];
    expect(fo, 'la caja de la foto y el avatar no miden lo mismo').toBe(av);
  });

  it('[11] la hora declara su interlineado, y por eso el suelo de 100 es cierto', () => {
    /* No lo declaraba y heredaba 1,45: la celda medía 101,45 px con el suelo de
       fila en 100, así que las tres líneas se encogían para caber. Medido en
       navegador. Con 1,25 —el de sus dos hermanas— la cuenta que el código
       documenta da 99,25 y el suelo es cierto. */
    for (const c of ['.tbl-nom', '.tbl-ape', '.tbl-hora']) {
      expect(regla(c), `${c} no declara interlineado y hereda lo que le echen`)
        .toMatch(/line-height:\s*1\.25/);
    }
    /* Y la cuenta: foto + separación + tres líneas ≤ el suelo declarado. */
    const linea = 11 * 1.25;
    expect(48 + 10 + linea * 3, 'la celda no cabe en el suelo de fila que declara la hoja')
      .toBeLessThanOrEqual(ALTO_CELDA_TABLERO);
  });
});
