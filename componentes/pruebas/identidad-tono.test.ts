/**
 * R88 · reglas 1-4 del contrato — el color que agrupa, no el que avisa.
 *
 * Control Administrativos lo pidió para colorear el horario por sede. El
 * diagnóstico era correcto: los tonos de estado no valen de adorno, porque
 * usar `error` como decorativo gasta el rojo.
 *
 * Lo que esta prueba fija no es que las clases existan —eso es fácil— sino la
 * FORMA que se decidió mirándolo, Y DÓNDE VALE ESA DECISIÓN.
 *
 * En el HORARIO el color va en el filete y a 6 px, no en el fondo. Se probó el
 * fondo macizo, cumple el contraste, y aun así se descartó porque cuatro cajas
 * decorativas pesaban más que un bloque de error dentro de una rejilla entera.
 *
 * En el CHIP se copió esa decisión sin volver a pensarla, y ahí estaba el
 * defecto que cerró el R143: los cuatro tonos pintaban `fondo-encabezado`, el
 * mismo relleno que `chip-pend`, así que cinco de los diez tonos publicados
 * eran uno solo. Una columna de estado tiene UN chip por fila: no hay rejilla
 * que ahogar, y lo que se pierde por no pintar es la única razón de que el tono
 * exista.
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
    }
    // Y con una sola clase no puede quedar ninguna, que era la forma vencida.
    expect(css).not.toMatch(/(^|\n)\.chip-identidad-\d\{/);
  });

  /* R143 · EL CHIP SÍ VA MACIZO, Y EL HORARIO NO. Hasta la v1.123.0 esta misma
     prueba exigía lo contrario —`not.toMatch(background: var(--identidad-`)— y
     ahí estaba el defecto: la decisión de la regla 3 es del HORARIO, donde
     cuatro cajas decorativas pesan más que un bloque de error en una rejilla
     entera; se copió al chip sin volver a pensarla y dejó los cuatro tonos
     pintando `fondo-encabezado`, el MISMO relleno que `chip-pend`.
     Cinco de los diez tonos publicados eran uno. Lo midió Control
     Administrativos V2.0 en el navegador y llevaban razón.
     En una columna de estado hay UN chip por fila: no hay rejilla que ahogar. */
  it('R143 · el chip de identidad pinta su color, con el texto que le corresponde', () => {
    for (const n of [1, 2, 3, 4]) {
      const regla = css.match(new RegExp(`\\.chip\\.chip-identidad-${n}\\{[^}]*\\}`))?.[0] ?? '';
      expect(regla).toMatch(new RegExp(`background:\\s*var\\(--identidad-${n}\\)`));
      expect(regla).toMatch(/color:\s*var\(--identidad-texto\)/);
    }
  });

  /* Y el horario NO cambia: la regla 3 sigue siendo suya. Sin esta prueba,
     «macizo» se leería como una decisión del sistema y no del componente. */
  it('R143 · el bloque del horario sigue SIN fondo de identidad', () => {
    const reglas = css.match(/\.hor-b\.hor-identidad-\d[^{]*\{[^}]*\}/g) ?? [];
    for (const regla of reglas) expect(regla).not.toMatch(/background[^;}]*var\(--identidad-/);
  });

  /* LO QUE DE VERDAD SE PROMETE no es «cada uno tiene su regla»: es que los diez
     tonos se distingan. Se comprueba por el TOKEN, que es lo que la hoja
     declara; la distancia perceptual la mide `verificar-tono`, que es el sitio
     donde vive la fórmula. Dos tonos con el mismo token son el mismo tono. */
  it('R143 · ningún par de tonos del chip comparte relleno', () => {
    /* El selector puede llevar compañía —`.chip.chip-exito, .msj.msj-exito`—,
       así que se admite lo que venga entre el tono y la llave. Sin eso solo se
       leían seis de los diez y la prueba pasaba mirando a medias. */
    const tonos = [...css.matchAll(/\.chip\.(chip-[a-z0-9-]+)[^{]*\{([^}]*)\}/g)]
      .map((m) => [m[1], /background:\s*var\(--([a-z0-9-]+)\)/.exec(m[2])?.[1]] as const)
      .filter(([, token]) => token);
    expect(new Set(tonos.map(([t]) => t)).size).toBeGreaterThanOrEqual(10);
    /* El extractor emite los cuatro semánticos DOS veces —lo cuenta el
       comentario del R95 en la hoja—, así que se agrupa por conjunto: lo que
       se busca es un token con dos tonos DISTINTOS, no una regla repetida. */
    const porToken = new Map<string, Set<string>>();
    for (const [tono, token] of tonos) porToken.set(token!, (porToken.get(token!) ?? new Set()).add(tono));
    const repetidos = [...porToken.entries()].filter(([, ts]) => ts.size > 1);
    expect(repetidos.map(([t, ts]) => `${t}: ${[...ts].join(', ')}`)).toEqual([]);
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
