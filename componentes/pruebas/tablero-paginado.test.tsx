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
  capacidadDeRejilla, enPaginas, useCapacidadTablero, cuentaBurbuja,
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
    const lineaLleno = demo.split('\n').find((l) => l.includes('tbl-lleno')) ?? '';
    expect(lineaLleno, 'la demo no mide `tbl-lleno`: la cuenta se clavará en la primera fila')
      .toContain('ref={caja}');
    const lineaCarril = demo.split('\n').find((l) => l.includes('car car-pagina')) ?? '';
    expect(lineaCarril, 'la referencia volvió al carril, que es lo que causaba el punto fijo')
      .not.toContain('ref={caja}');
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
