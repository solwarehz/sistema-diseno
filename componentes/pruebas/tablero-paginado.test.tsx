/**
 * R159 · PRIMERO SE LLENA EL AREA, Y DESPUES SE DESLIZA.
 *
 * Lo cortó el responsable mirando el tablero en una tablet: «si se ocupa todo
 * el espacio y no queda más, recién se hace scroll horizontal». Un tablero que
 * deja media pantalla en blanco y aun así obliga a deslizar convierte la
 * paginación por gesto en desbordamiento con otro nombre — que es justo la
 * distinción que el R157 dejó escrita.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef, useState, StrictMode } from 'react';
import { render, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  capacidadDeRejilla, enPaginas, useCapacidadTablero, cuentaBurbuja,
  ANCHO_CELDA_TABLERO, ALTO_CELDA_TABLERO, HUECO_TABLERO, HUECO_TABLERO_ANCHO, RESERVA_BURBUJA,
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

  it('[13] la foto del avatar encuadra a la CARA, y con `cover`', () => {
    /* Esta prueba fijaba el «30 %» como número mágico, así que bajarlo a 10
       —que es lo que de verdad deja de cortar— la ponía en rojo por el motivo
       equivocado. Lo que importa no es el número: es que el recorte de arriba
       no se coma la cabeza, y eso lo comprueba la prueba de abajo rehaciendo la
       cuenta. Aquí sólo queda lo que sí es fijo. */
    const i = css.indexOf('.avatar img');
    expect(i, 'la hoja no estiliza la foto del avatar').toBeGreaterThan(-1);
    const r = css.slice(i, css.indexOf('}', i));
    expect(r, 'la foto no declara encuadre vertical y se recorta por el centro')
      .toMatch(/object-position:\s*50%/);
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

  it('[14] el suelo de fila cabe el PEOR caso que la celda puede producir', () => {
    /* No lo declaraba y heredaba 1,45: la celda medía 101,45 px con el suelo de
       fila en 100, así que las tres líneas se encogían para caber. Medido en
       navegador. Con 1,25 —el de sus dos hermanas— la cuenta que el código
       documenta da 99,25 y el suelo es cierto. */
    for (const c of ['.tbl-nom', '.tbl-ape', '.tbl-hora']) {
      expect(regla(c), `${c} no declara interlineado y hereda lo que le echen`)
        .toMatch(/line-height:\s*1\.25/);
    }
    /* Y LA CUENTA CON EL PEOR CASO QUE LA CELDA PUEDE PRODUCIR, que es lo que
       hace que el suelo no mienta: foto + separación + UNA línea de nombre +
       DOS de apellido + una de hora. Con el suelo en 100 esto daba 113 contra
       100 y la fila encogía a los hijos de flex, perdiendo una línea entera sin
       avisar — medido en navegador: 27,5 px pintados a 13,02. */
    const linea = 11 * 1.25;
    const peorCaso = 48 + 10 + linea * 1 + linea * 2 + linea * 1;
    expect(peorCaso, 'el peor caso de la celda NO cabe en el suelo de fila: se '
      + 'perderá una línea sin avisar').toBeLessThanOrEqual(ALTO_CELDA_TABLERO);

    /* Y el nombre va a UNA línea en este modo, que es lo que hace el peor caso
       DETERMINISTA. Si pudiera ir a dos, la celda llegaría a 126,75 y el suelo
       volvería a mentir. */
    const enLlena = css.slice(css.indexOf('.tn-densa-llena'));
    expect(enLlena.slice(0, 600), 'el nombre puede crecer a dos líneas y entonces el '
      + 'suelo se queda corto otra vez').toMatch(/\.tn-densa-llena \.tbl-nom\{[^}]*line-clamp:\s*1/);
  });
});

describe('R159 · la caja que se mide no puede depender del contenido', () => {
  it('[11] la referencia va en `tbl-lleno`, NO en el carril', () => {
    /* El carril es `height: 100%`. Si su padre no tiene alto definido, ese
       100 % resuelve al alto del CONTENIDO, y la cuenta entra en un punto fijo
       en el sitio equivocado: capacidad de una fila → se pintan tres personas →
       el contenido sigue midiendo una fila → la capacidad sigue siendo una. Se
       vio en un teléfono: TRES tarjetas arriba, el resto del contenedor vacío y
       ocho puntos de página.
       `tbl-lleno` no puede caer en eso porque lleva `overflow: hidden`: su
       tamaño nunca lo decide lo que hay dentro. */
    const demo = readFileSync(
      join(process.cwd(), '..', 'sistema', 'cascaron', 'vivo.tsx'), 'utf8');
    /* Se persigue EL REF QUE MIDE, no cualquier `ref=`: desde el R162 la demo
       cuelga el que devuelve el gancho —y le pone un nombre— y desde el flujo
       en vivo el carril lleva un `ref` PROPIO, que es legítimo y no tiene nada
       que ver con la medida. Lo que la regla dice es dónde va LA MEDIDA. */
    const nombre = (demo.match(/useCapacidadTablero\(\)[\s\S]{0,80}?ref:\s*(\w+)/)
      ?? demo.match(/ref:\s*(\w+)\s*\}\s*=\s*useCapacidadTablero/))?.[1];
    expect(nombre, 'la demo ya no toma el `ref` que devuelve el gancho').toBeTruthy();
    const lineaLleno = demo.split('\n').find((l) => l.includes('tbl-lleno')) ?? '';
    expect(lineaLleno, 'la demo no mide `tbl-lleno`: la cuenta se clavará en la primera fila')
      .toContain(`ref={${nombre}}`);
    const lineaCarril = demo.split('\n').find((l) => l.includes('car car-pagina')) ?? '';
    expect(lineaCarril, 'la MEDIDA volvió al carril, que es lo que causaba el punto fijo')
      .not.toContain(`ref={${nombre}}`);
    /* Y lo que hace a `tbl-lleno` inmune: su tamaño no lo decide su contenido. */
    expect(regla('.tbl-lleno'), 'sin `overflow: hidden` el contenido puede estirar la caja '
      + 'que se mide, y vuelve el punto fijo').toMatch(/overflow:\s*hidden/);
  });
});

describe('R160 · la burbuja no puede comerse la cara que viene a anotar', () => {
  it('[13] el texto llega acortado: tres caracteres como mucho', () => {
    /* La burbuja CRECE con su contenido: con «+120» medía 32,4 px sobre un
       avatar de 48 —el 67 %—. Lo vio el responsable en su teléfono: «el espacio
       que tiene es muy poco y los números son más extensos». El sistema publica
       el acortador para que no lo invente cada pantalla. */
    expect(cuentaBurbuja(7)).toBe('7');
    expect(cuentaBurbuja(99)).toBe('99');
    expect(cuentaBurbuja(120)).toBe('99+');
    expect(cuentaBurbuja(7, '+')).toBe('+7');
    expect(cuentaBurbuja(91, '+')).toBe('+91');
    expect(cuentaBurbuja(120, '+')).toBe('+99');
    /* Y SE BARRE EL TOPE TAMBIEN, que es un parámetro PÚBLICO: la primera
       versión de esta prueba sólo variaba `n` y `prefijo`, y con un tope propio
       la promesa de tres caracteres se rompía — `cuentaBurbuja(5, '', 2.5)`
       daba «2.5+», y con un tope no finito el corte se desactivaba entero.
       Lo encontró una auditoría barriendo lo que la prueba no barría. */
    const topes = [undefined, 9, 99, 999, 9999, 0, -1, 2.5, NaN, Infinity];
    for (const n of [0, 1, 9, 99, 100, 5000, 1e6, Number.MAX_VALUE]) {
      for (const p of ['', '+'] as const) {
        for (const t of topes) {
          const salida = t === undefined ? cuentaBurbuja(n, p) : cuentaBurbuja(n, p, t);
          expect(salida.length,
            `«${salida}» (n=${n} prefijo=«${p}» tope=${t}) pasa de tres caracteres y tapa la foto`)
            .toBeLessThanOrEqual(3);
          expect(salida, `«${salida}» no es una cuenta`).toMatch(/^\+?\d{0,3}\+?$/);
        }
      }
    }
  });

  it('[13] y un número que no lo es no pinta basura', () => {
    for (const malo of [NaN, Infinity, -Infinity]) {
      expect(cuentaBurbuja(malo), `con ${malo} la burbuja pinta basura`).toBe('');
    }
    expect(cuentaBurbuja(-5), 'un negativo no es una cuenta').toBe('0');
  });

  it('[13] el CIRCULO lo dibuja el texto, y no al revés', () => {
    /* Llegó a llevar un `max-width` y era exactamente lo contrario: un círculo
       fijo dentro del cual meter el número. El responsable lo cortó: «la
       burbuja debe depender del contenido del texto y sobre ese contenido
       dibujar el círculo». El ancho sale del contenido más su relleno, y
       `aspect-ratio: 1` copia ese ancho al alto. */
    const b = regla('.badge');
    expect(b, 'un `max-width` convierte la burbuja en un círculo fijo con texto dentro')
      .not.toMatch(/max-width:/);
    /* El «(?<![a-z-])» no es adorno: sin él, `line-height: 1` casaba con
       «height» y la prueba se cazaba a sí misma. */
    expect(b, 'un ancho fijo hace lo mismo').not.toMatch(/(?<![a-z-])width:\s*\d/);
    expect(b, 'un alto fijo impide que el círculo se dibuje sobre el texto')
      .not.toMatch(/(?<![a-z-])height:\s*\d/);
    expect(b, 'sin `aspect-ratio` el círculo no sigue al ancho del texto')
      .toMatch(/aspect-ratio:\s*1/);
    /* El suelo sí: una sola cifra sin él saldría como una pastilla diminuta. */
    expect(b, 'falta el suelo para una sola cifra').toMatch(/min-width:/);
  });

  it('[13] y vive FUERA del disco, en la esquina', () => {
    /* Estaba en la esquina de la CAJA, y el avatar es un círculo inscrito en
       ella: el centro de la burbuja quedaba DENTRO del disco —14,1 px del
       centro, contra 24 de radio— y se comía la foto. El 14,64 % es donde el
       borde del círculo cruza la diagonal, y el `translate` pone ahí su centro.
       En porcentaje, porque el avatar es fluido. */
    const b = regla('.badge');
    expect(b, 'la burbuja no se coloca en el borde del disco').toMatch(/top:\s*14\.64%/);
    expect(b, 'sin el desplazamiento, su centro cae dentro del disco')
      .toMatch(/transform:\s*translate\(75%,\s*-75%\)/);
  });

  it('[13] y la demo del catálogo USA el acortador, no el número crudo', () => {
    const demo = readFileSync(
      join(process.cwd(), '..', 'sistema', 'cascaron', 'vivo.tsx'), 'utf8');
    const linea = demo.split('\n').find((l) => l.includes('className="badge"')) ?? '';
    expect(linea, 'el catálogo enseña a pasar el número crudo: lo copiarán así')
      .toContain('cuentaBurbuja');
  });

  it('[13] el encuadre de la foto NO corta la cabeza en ninguna proporción', () => {
    /* Estuvo en 30 % y seguía cortando. Medido con la cabeza empezando al 5 %
       del alto y una caja de 48: al 50 % corta 4,8 px en un 3:4, 8,4 en un 2:3
       y 14,4 en una vertical de móvil; al 30 %, 1,6 · 3,6 · 6,9; al 10 %, nada.
       Aquí se rehace esa cuenta para que el número de la hoja no se pueda subir
       sin que esto caiga. */
    const i = css.indexOf('.avatar img');
    const r = css.slice(i, css.indexOf('}', i));
    const pos = Number(/object-position:\s*50%\s*(\d+)%/.exec(r)?.[1]);
    expect(Number.isFinite(pos), 'la foto no declara su encuadre vertical').toBe(true);
    const caja = 48;
    for (const [W, H, nom] of [[300, 400, '3:4'], [300, 450, '2:3'], [300, 533, 'vertical de móvil']] as const) {
      const escala = Math.max(caja / W, caja / H);
      const sobra = H * escala - caja;
      const cabeza = H * 0.05 * escala;
      expect(sobra * (pos / 100), `en una foto ${nom} el encuadre corta la cabeza`)
        .toBeLessThanOrEqual(cabeza);
    }
  });
});

describe('R161 · la pieza no puede depender de que su padre sea flex', () => {
  it('[15] `tbl-lleno` y `tbl-crece` declaran un alto que NO depende del padre', () => {
    /* Declaraban sólo `flex: 1 1 auto`, que no hace nada si el padre no es un
       contenedor flex: la caja medía su propio CONTENIDO y la cuenta entraba en
       un lazo —capacidad de una fila → se pinta una fila → el contenido sigue
       midiendo una fila—. Reproducido en navegador: en un padre de 420 px sin
       flex, la caja medía 139,3 y daba 7×1; con el padre en flex column, 416 y
       7×3. Lo diagnosticó el equipo que la usa. */
    for (const c of ['.tbl-lleno', '.tbl-crece']) {
      const r = regla(c);
      expect(r, `${c} sólo crece si su padre es flex: en cualquier otro sitio mide su contenido`)
        .toMatch(/height:\s*100%/);
      /* Y la base a CERO: con `auto`, ese `height: 100%` se convierte en el
         tamaño de partida dentro de un padre flex y puede encoger al encabezado
         y al pie. */
      expect(r, `${c} usa el alto como base de flex y puede aplastar a sus hermanos`)
        .toMatch(/flex:\s*1\s+1\s+0/);
      expect(r, `${c} sin \`min-height: 0\` no baja y empuja al pie fuera`)
        .toMatch(/min-height:\s*0/);
    }
  });

  it('[16] el catálogo lo demuestra en un padre que NO coopera', () => {
    /* La lección general del R161: demostrar una pieza sólo donde funciona no
       es demostrarla. El catálogo la monta dentro de `tbl-marco` —el montaje
       recomendado— y dentro de un contenedor liso. */
    const cat = readFileSync(join(process.cwd(), '..', 'cascaron', 'index.html'), 'utf8');
    const estatico = cat.split('<script data-vivo>')[0];
    expect(estatico, 'el catálogo no monta el tablero en un padre sin flex: la pieza se '
      + 'sigue validando en el único sitio donde funciona').toMatch(/class="muestra-liso"/);
    /* Y LA DEMOSTRACIÓN ES VIVA, no marcado escrito a mano. Lo era —seis celdas
       fijas en una caja fija— y por eso mentía: a 360 px la caja da para 2×2 y
       las seis seguían ahí, así que la propia demostración de esta regla
       enseñaba el desplazamiento vertical que el sistema promete que no
       existe. Un marcado fijo no demuestra la pieza: demuestra un marcado. */
    const i = estatico.indexOf('class="muestra-liso"');
    const trozo = estatico.slice(i, i + 200);
    expect(trozo, 'el contenedor liso no tiene ancla de montaje: si vuelve a ser marcado '
      + 'fijo, deja de adaptarse y vuelve a desbordar en estrecho')
      .toMatch(/id="tablero-liso-vivo"/);
    expect(trozo, 'el contenedor liso trae celdas escritas a mano otra vez')
      .not.toMatch(/tbl-persona/);
    const guion = readFileSync(join(process.cwd(), '..', 'sistema', 'cascaron', 'vivo.tsx'), 'utf8');
    expect(guion, 'nadie monta nada en el ancla del contenedor liso')
      .toMatch(/getElementById\('tablero-liso-vivo'\)/);
    const liso = guion.slice(guion.indexOf('function TableroLisoVivo'));
    expect(liso.slice(0, 1600), 'la demo hostil no usa el gancho: no mide su caja')
      .toMatch(/useCapacidadTablero\(\)/);
    expect(liso.slice(0, 1600), 'la demo hostil no pinta `tbl-lleno`').toMatch(/tbl-lleno/);
    /* Y el contenedor tiene que ser LISO de verdad: si se le pone flex, deja de
       demostrar nada. */
    const cromo = cat.slice(cat.indexOf('.muestra-liso'));
    expect(cromo.slice(0, 120), 'el contenedor de la demo hostil es flex: no demuestra nada')
      .not.toMatch(/display:\s*flex/);
  });
});

describe('auditoría de 28 tamaños · lo que sólo se ve midiendo', () => {
  it('[17] la tira de paradas SIEMPRE ocupa: sin eso hay dos puntos fijos', () => {
    /* La tira vive dentro de la columna que se mide, así que aparecer o no
       cambia el alto disponible — y ese alto decide la capacidad, que decide el
       número de páginas, que decide si la tira aparece. Medido: la MISMA caja
       de 768×500 daba 7×3 en una página llegando desde una caja mayor, y 7×2 en
       dos llegando desde una menor. Los 54 px de diferencia son esta tira. */
    const demo = readFileSync(
      join(process.cwd(), '..', 'sistema', 'cascaron', 'vivo.tsx'), 'utf8');
    expect(demo, 'la tira se pinta condicionalmente: la medida vuelve a tener dos '
      + 'puntos fijos').not.toMatch(/\{paginas\.length > 1 && \(\s*<p className="car-cuenta/);
    expect(regla('.car-cuenta-vacia'), 'falta la forma de esconderla SIN que deje su hueco')
      .toMatch(/visibility:\s*hidden/);
    expect(regla('.car-cuenta-vacia'), 'si se esconde con `display` deja de ocupar y vuelve el defecto')
      .not.toMatch(/display:\s*none/);
  });

  it('[17] el índice de parada no se calcula dividiendo por el ancho', () => {
    /* El carril tiene `gap: 12px`: cada parada empieza en `i·(ancho+hueco)`, no
       en `i·ancho`. Dividiendo, el error se acumula — medido con 18 paradas,
       desde la 6 decía una de más y en la última «Pantalla 20 de 18» sin
       encender ningún punto. */
    const demo = readFileSync(
      join(process.cwd(), '..', 'sistema', 'cascaron', 'vivo.tsx'), 'utf8');
    const fn = demo.slice(demo.indexOf('const alDeslizar'), demo.indexOf('return (', demo.indexOf('const alDeslizar')));
    expect(fn, 'divide por el ancho e ignora el hueco del carril')
      .not.toMatch(/scrollLeft\s*\/\s*(el\.)?(clientWidth|ancho)/);
    expect(fn, 'no busca la parada por su posición real').toMatch(/offsetLeft/);
  });

  it('[17] y el índice se acota al número de pantallas que hay', () => {
    /* Nada lo comparaba con `paginas.length`: al pasar de 18 paradas a 2, el
       carril seguía diciendo «Pantalla 20 de 2» y sin ningún punto encendido,
       dentro de un `aria-live` que además lo anuncia. */
    const demo = readFileSync(
      join(process.cwd(), '..', 'sistema', 'cascaron', 'vivo.tsx'), 'utf8');
    expect(demo, 'el índice de parada no se acota y puede pasarse del total')
      .toMatch(/Math\.min\(actual,\s*Math\.max\(0,\s*paginas\.length\s*-\s*1\)\)/);
  });

  it('[18] la primera fila reserva lo que la burbuja sobresale', () => {
    /* La burbuja se apoya en el borde del disco y su borde superior queda
       `7,03 − 0,75·D` por encima de la foto: con el mayor que el sistema
       produce —«+99», 22 px— son 9,47. En la primera fila eso cae fuera del
       carril, que no se puede desplazar hasta ahí. Medido: 3,70 px recortados
       en una fila de 124,54; la auditoría midió 3,71. */
    const saliente = 0.75 * 22 - 7.03;
    expect(RESERVA_BURBUJA, 'la reserva no cubre lo que la burbuja sobresale')
      .toBeGreaterThanOrEqual(saliente);
    expect(regla('.tn-densa-llena'), 'la rejilla no reserva sitio para la burbuja de la primera fila')
      .toContain(`padding-top: ${RESERVA_BURBUJA}px`);
    /* Y LAS DOS CUENTAS NO SE PUEDEN SEPARAR: si la hoja reserva y la cuenta no
       descuenta, la cuenta cree que cabe una fila más de la que se puede pintar. */
    const fila = ALTO_CELDA_TABLERO + HUECO_TABLERO;
    // justo para UNA fila una vez descontada la reserva
    expect(capacidadDeRejilla(400, ALTO_CELDA_TABLERO + RESERVA_BURBUJA, 400).filas,
      'la cuenta no descuenta la reserva: creerá que cabe más de lo que se puede pintar').toBe(1);
    // un píxel menos y ya no cabe ni una
    expect(capacidadDeRejilla(400, ALTO_CELDA_TABLERO + RESERVA_BURBUJA - 1, 400).filas,
      'la cuenta no baja de fila cuando la reserva se come el sitio').toBe(1);
    // y justo para DOS
    expect(capacidadDeRejilla(400, fila + ALTO_CELDA_TABLERO + RESERVA_BURBUJA, 400).filas,
      'la cuenta no llega a dos filas cuando sí caben').toBe(2);
  });
});

describe('R162 · el nodo que llega tarde', () => {
  /* Se espía el observador para poder preguntar lo único que importa aquí:
     ¿llegó a observar el nodo? El de jsdom no existe, así que se instala uno. */
  let observados: Element[] = [];
  /* Y quién está observado AHORA, que es otra pregunta. El defecto que encontró
     la auditoría no era «no se observó nunca», era «se observó, se soltó y no
     volvió nadie» — y la primera pregunta sale en verde delante de ése. */
  let vivos = new Set<Element>();
  const RealRO = (globalThis as any).ResizeObserver;
  beforeEach(() => {
    observados = [];
    vivos = new Set<Element>();
    (globalThis as any).ResizeObserver = class {
      observe(el: Element) { observados.push(el); vivos.add(el); }
      unobserve(el: Element) { vivos.delete(el); }
      disconnect() { vivos.clear(); }
    };
  });
  afterEach(() => { (globalThis as any).ResizeObserver = RealRO; });

  /* Lo reprodujo el equipo EN PRODUCCIÓN, en un teléfono: «Dentro 27» y UNA
     sola tarjeta. No era la cadena de alto —la midieron, 317×572, que son 3×4—:
     era CUÁNDO se medía. La pantalla monta el carril de forma condicional, así
     que en el momento del efecto la caja no existía; `ro.observe` no llegaba a
     llamarse y `[caja]` es estable, así que el efecto no volvía a correr jamás.
     La capacidad se quedaba en 1×1 toda la sesión.

     Y lo más afilado de su parte: EL DEFECTO SE CURA CON EL GESTO DE IR A
     MIRARLO. Los oyentes de ventana sí quedaban puestos, así que en escritorio
     bastaba mover el borde una vez para que saltara al valor bueno. En un
     teléfono no se redimensiona nunca. Por eso pasó una verificación. */

  function Tarde({ montar }: { montar: boolean }) {
    const caja = useRef<HTMLDivElement>(null);
    const cap = useCapacidadTablero(caja);
    return (
      <div>
        {montar ? <div ref={caja} data-caja style={{ width: 300, height: 500 }} /> : <span>cargando…</span>}
        <b data-cap>{`${cap.columnas}x${cap.filas}`}</b>
      </div>
    );
  }

  it('[19] con `RefObject`, el observador se engancha cuando la caja APARECE', async () => {
    const { container, rerender } = render(<Tarde montar={false} />);
    expect(container.querySelector('[data-caja]'), 'la caja no debería existir aún').toBeNull();

    /* El nodo llega después, como cuando responde el servidor. Antes del
       arreglo, aquí no se suscribía nadie y la capacidad se quedaba congelada
       en la del primer render, para siempre. */
    await act(async () => { rerender(<Tarde montar />); });
    expect(container.querySelector('[data-caja]'), 'la caja ya debería existir').not.toBeNull();

    /* En jsdom no hay maquetado, así que el NÚMERO no prueba nada. Lo que se
       comprueba es el invariante de verdad: que el observador llegó a observar
       ESE nodo. Con el código anterior, `observe` no se llamaba nunca. */
    expect(observados, 'nadie observó la caja: el observador no se enganchó cuando apareció')
      .toContain(container.querySelector('[data-caja]'));
  });

  it('[19] y el `ref` que devuelve NO necesita ese rodeo', () => {
    /* Es la forma que pidieron, y la que resuelve el problema de raíz: React
       llama a la retrollamada en el momento en que el nodo entra en el árbol,
       así que no existe el instante «la caja todavía no está». */
    function ConRef() {
      const { columnas, filas, ref } = useCapacidadTablero();
      return (
        <div>
          <div ref={ref} data-caja style={{ width: 300, height: 500 }} />
          <b data-cap>{`${columnas}x${filas}`}</b>
        </div>
      );
    }
    const { container } = render(<ConRef />);
    expect(container.querySelector('[data-caja]')).not.toBeNull();
    expect(container.querySelector('[data-cap]')?.textContent).toMatch(/^\d+x\d+$/);
  });

  it('[19] el gancho devuelve SIEMPRE un `ref`, sin pasarle nada', () => {
    /* La firma vieja sigue valiendo —no se rompe a nadie— y la nueva no
       necesita `useRef` en la pantalla. */
    function Sonda() {
      const cap = useCapacidadTablero();
      return <b data-tipo={typeof cap.ref}>{cap.porPagina}</b>;
    }
    const { container } = render(<Sonda />);
    expect(container.firstElementChild?.getAttribute('data-tipo'),
      'el gancho no devuelve el `ref` de retrollamada').toBe('function');
  });

  /* LAS TRES QUE FALTABAN. El primer arreglo del R162 salió en verde con 39
     pruebas y una auditoría lo tumbó por tres sitios. Las tres comparten la
     misma causa de fondo: se trató el enganche como un SUCESO —ocurrió una
     vez— y no como un ESTADO que hay que mantener. */

  it('[19] en `StrictMode` el `ref` NO se vuelve a llamar, y aun así sigue observando', () => {
    /* React en modo estricto monta, limpia y vuelve a montar — pero vuelve a
       correr el EFECTO sin volver a llamar la retrollamada del `ref`. Anular el
       nodo en la limpieza dejaba sordo al camino que el propio sistema
       recomienda, y el equipo que reporta usa modo estricto. */
    function ConRefEstricto() {
      const { ref } = useCapacidadTablero();
      return <div ref={ref} data-caja style={{ width: 300, height: 500 }} />;
    }
    const { container } = render(<StrictMode><ConRefEstricto /></StrictMode>);
    const nodo = container.querySelector('[data-caja]');
    expect(nodo, 'no hay caja que comprobar').not.toBeNull();
    expect([...vivos], 'tras el doble montaje de `StrictMode` no queda nadie observando la '
      + 'caja: el camino recomendado se ha quedado sordo').toContain(nodo);
  });

  it('[19] si la caja se desmonta y VUELVE, se engancha al nodo nuevo', async () => {
    /* El nodo viejo, ya desprendido, mide cero en un navegador: seguir
       midiéndolo es exactamente el síntoma del parte —una tarjeta y el resto
       vacío—. Pasa al cambiar de pestaña o al recargar datos. */
    const { container, rerender } = render(<Tarde montar />);
    const primero = container.querySelector('[data-caja]');
    await act(async () => { rerender(<Tarde montar={false} />); });
    await act(async () => { rerender(<Tarde montar />); });
    const segundo = container.querySelector('[data-caja]');
    expect(segundo, 'no hay nodo nuevo que comprobar').not.toBe(primero);
    expect([...vivos], 'se sigue observando el nodo VIEJO: al nuevo no lo mira nadie')
      .toContain(segundo);
    expect([...vivos], 'el nodo desprendido sigue observado').not.toContain(primero);
  });

  it('[19] con `RefObject` y sin `ResizeObserver`, el `resize` de ventana AÚN rescata', () => {
    /* El rescate por ventana es lo que hacía que en escritorio el defecto se
       curase al mover el borde —§3 del parte—. Al pasar `medir` a leer sólo el
       nodo propio se perdió, y eso era una REGRESIÓN contra la v1.147.0: sin
       observador y sin rescate, la caja tardía se queda en 1×1 y en silencio. */
    const guarda = (globalThis as any).ResizeObserver;
    delete (globalThis as any).ResizeObserver;
    try {
      const medidas: string[] = [];
      function SoloVentana() {
        const caja = useRef<HTMLDivElement>(null);
        const cap = useCapacidadTablero(caja);
        medidas.push(`${cap.columnas}x${cap.filas}`);
        return <div ref={caja} data-caja style={{ width: 300, height: 500 }} />;
      }
      const { container } = render(<SoloVentana />);
      const nodo = container.querySelector('[data-caja]') as HTMLElement;
      /* jsdom no maqueta: se le da tamaño a mano y se avisa a la ventana, que
         es el gesto que el equipo describe. */
      Object.defineProperty(nodo, 'clientWidth', { value: 300, configurable: true });
      Object.defineProperty(nodo, 'clientHeight', { value: 500, configurable: true });
      act(() => { window.dispatchEvent(new Event('resize')); });
      expect(medidas[medidas.length - 1], 'el `resize` de ventana no llegó a leer la caja: '
        + 'se perdió el rescate que la v1.147.0 sí tenía').not.toBe('1x1');
    } finally {
      (globalThis as any).ResizeObserver = guarda;
    }
  });

  it('[19] lo que devuelve NO cambia de identidad si la capacidad no cambia', () => {
    /* Antes se devolvía el objeto del `useState`, que el gancho se esfuerza en
       no cambiar salvo que cambie la capacidad. Al envolverlo para añadir el
       `ref` se empezó a devolver uno nuevo en CADA render, y eso hace correr
       los efectos del consumidor que dependan de la capacidad — con un
       `setState` dentro de uno de ellos, es un bucle. Lo cazó la auditoría.
       No es cosmético: el propio archivo tiene una prueba de que no
       re-renderiza cuando la capacidad no cambia, y esto la vaciaba de sentido
       aguas abajo. */
    const vistos: unknown[] = [];
    let forzar: (n: number) => void = () => {};
    function Sonda() {
      const [, set] = useState(0);
      forzar = set;
      const cap = useCapacidadTablero();
      vistos.push(cap);
      return <b>{cap.porPagina}</b>;
    }
    render(<Sonda />);
    act(() => { forzar(1); });
    act(() => { forzar(2); });
    expect(vistos.length, 'no hubo re-renders que comparar').toBeGreaterThan(2);
    const distintos = new Set(vistos).size;
    expect(distintos, `el gancho devolvió ${distintos} objetos distintos en ${vistos.length} `
      + 'renders sin que la capacidad cambiara').toBe(1);
  });
});

describe('datos que cambian debajo · el tablero en vivo', () => {
  /* Lo pidió el responsable: «que funcione como si tuviera socketio, que la
     data cambie de estado en tiempo real». El transporte NO es del sistema
     —de dónde salen los datos es del producto—; lo que sí es del sistema es
     que la pieza no mienta cuando la lista se mueve. Estas tres cosas sólo
     se rompen con datos en movimiento, y por eso no había prueba de ninguna. */

  it('[19] nadie se pierde ni se repite al repaginar, sea cual sea el tamaño', () => {
    /* Es el invariante de fondo: repaginar es RE-REPARTIR, nunca perder. Se
       barre toda la combinación de tamaños de lista y capacidades. */
    for (let n = 0; n <= 40; n += 1) {
      const lista = Array.from({ length: n }, (_, i) => `p${i}`);
      for (let cap = 1; cap <= 12; cap += 1) {
        const paginas = enPaginas(lista, cap);
        const plano = paginas.flat();
        expect(plano, `con ${n} personas y capacidad ${cap} se perdió o se repitió alguien`)
          .toEqual(lista);
        if (n > 0) {
          expect(paginas[paginas.length - 1].length,
            `con ${n} y capacidad ${cap} la última página quedó vacía`).toBeGreaterThan(0);
          expect(Math.max(...paginas.map((p) => p.length)),
            `con ${n} y capacidad ${cap} una página se pasó de la capacidad`)
            .toBeLessThanOrEqual(cap);
        }
      }
    }
  });

  it('[19] al ENCOGER la lista, el número de paradas encoge con ella', () => {
    /* El caso que el catálogo enseña al reiniciar el turno: el grupo pasa de
       24 a 18 y el carril tiene que quedarse con menos paradas. Si el número
       de paradas no bajara, la tira encendería un punto que ya no existe —y
       vive dentro de un `aria-live`, así que además lo anuncia. */
    const cap = 12;
    const antes = enPaginas(Array.from({ length: 24 }, (_, i) => i), cap);
    const despues = enPaginas(Array.from({ length: 18 }, (_, i) => i), cap);
    expect(antes.length).toBe(2);
    expect(despues.length, 'la lista encogió y el número de paradas no')
      .toBeLessThan(antes.length + 1);
    expect(despues.length).toBe(2);
    const muyPocos = enPaginas(Array.from({ length: 5 }, (_, i) => i), cap);
    expect(muyPocos.length, 'con 5 personas y capacidad 12 sobra una parada').toBe(1);
  });

  it('[19] una lista que se vacía en vivo sigue siendo UNA página, no ninguna', () => {
    /* Con cero paradas el carril no tiene dónde estar y la tira se queda sin
       punto que encender. Una pantalla vacía es una pantalla. */
    expect(enPaginas([], 12).length).toBe(1);
    expect(enPaginas([], 12)[0]).toEqual([]);
  });
});
