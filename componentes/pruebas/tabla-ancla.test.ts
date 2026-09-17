/**
 * R142 · reglas 30-35 del contrato — la columna anclada, sobre la hoja QUE VIAJA.
 *
 * Lo pidió Control Administrativos V2.0 con 31, 22 y 76 columnas sobre la mesa:
 * al desplazar en horizontal se pierde el nombre y la fila deja de decir de
 * quién es. En sus palabras, *«es lo que haría el móvil cómodo en vez de solo
 * usable»*.
 *
 * Aquí se mira que las reglas EXISTAN Y VIAJEN. Que además GANEN al resolver
 * lo comprueba `verificar-cascada`, y que el orden entre las dos que empatan
 * sea el mismo en las dos hojas, `verificar-empate`. Son tres preguntas
 * distintas y ninguna cubre a las otras dos: el `box-sizing` que no viajaba
 * pasaba las otras dos.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const HOJA = join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

/**
 * La regla completa de un selector, tal y como viaja.
 *
 * ANCLADA AL PRINCIPIO DEL SELECTOR, y no es un detalle. Sin el `(^|[},])`
 * delante, `regla('.tb-ancla')` casaba con **todo selector que TERMINARA** en
 * `.tb-ancla` —`.tb tbody tr.tb-alt .tb-ancla` entre ellos—, así que la prueba
 * del fondo se satisfacía con el fondo de OTRA regla: quitando
 * `background: var(--fondo-tarjeta)` de `.tb-ancla` pasaban las once. La que su
 * propio comentario llamaba «el trabajo de verdad de esta regla» no protegía
 * nada. Lo cazó una auditoría adversaria.
 */
const regla = (sel: string) => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?:^|[}\n;])\\s*' + esc + '\\s*\\{[^}]*\\}', 'g');
  return (css.match(re) ?? []).join('\n');
};

describe('R142 · la columna anclada viaja', () => {
  it('[30] `.tb-ancla` se queda quieta, y contra el deslizador que ya existía', () => {
    /* `.tb-envoltura` es `overflow-x: auto` desde el R49 y envuelve SOLO la
       tabla: media solución llevaba dos años puesta. Si alguien le quita el
       desplazamiento, `sticky` deja de tener contra qué resolverse. */
    expect(regla('.tb-ancla')).toMatch(/position:\s*sticky/);
    expect(regla('.tb-ancla')).toMatch(/left:\s*0/);
    /* El `z-index` era la tercera propiedad estructural sin guardia. */
    expect(regla('.tb-ancla')).toMatch(/z-index:\s*1/);
    expect(css).toMatch(/\.tb-envoltura\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('[30] y lleva FONDO PROPIO, que no es transparente', () => {
    /* Una celda pegajosa transparente deja ver pasar el texto de las otras
       columnas por debajo. Es el trabajo de verdad de esta regla. */
    const r = regla('.tb-ancla');
    expect(r).toMatch(/background:\s*var\(--[a-z0-9-]+\)/);
    expect(r).not.toMatch(/background:\s*transparent/);
  });

  it('[31] el desplazamiento de la segunda sale de `--tb-indice`, escrito UNA vez', () => {
    /* Tres números que tienen que ser el mismo dejan de serlo, y aquí el
       síntoma sería una rendija de 1-3px por la que se ve pasar el texto. */
    expect(css).toMatch(/\.tb\s*\{[^}]*--tb-indice:\s*52px/);
    expect(regla('.tb-th-indice')).toMatch(/width:\s*var\(--tb-indice\)/);
    expect(regla('.tb-indice')).toMatch(/width:\s*var\(--tb-indice\)/);
    expect(regla('.tb-ancla-x')).toMatch(/left:\s*var\(--tb-indice\)/);
    // Y ningún 52px suelto en la familia: si vuelve, vuelve la rendija.
    const familia = [regla('.tb-th-indice'), regla('.tb-indice'), regla('.tb-ancla-x')].join('');
    expect(familia).not.toMatch(/52px/);
  });

  it('[32] la anclada lleva el rayado Y el hover, y el hover va DESPUÉS', () => {
    /* Los dos empatan en especificidad (0,3,2) y decide el orden: si el hover
       va antes, pasar el ratón por una fila par no la tiñe. Es el defecto de
       `.tb-f` contra `.campo` que parió verificar-empate. */
    const alt = css.indexOf('.tb tbody tr.tb-alt .tb-ancla');
    const hover = css.indexOf('.tb tbody tr:hover .tb-ancla');
    expect(alt, 'falta el rayado sobre la celda anclada').toBeGreaterThan(-1);
    expect(hover, 'falta el hover sobre la celda anclada').toBeGreaterThan(-1);
    expect(hover, 'el hover va ANTES del rayado y pierde el empate').toBeGreaterThan(alt);
  });

  it('[32] y el filete del hover se muda a la primera anclada', () => {
    /* En su sitio de siempre —el borde izquierdo de la FILA— queda tapado en
       cuanto alguien desplaza. */
    expect(css).toMatch(
      /\.tb tbody tr:hover \.tb-ancla:not\(\.tb-ancla-x\)\s*\{[^}]*box-shadow:\s*inset 3px 0 0 var\(--accion\)/
    );
  });

  it('[31] y la N.º NO SE ENCOGE: `width` en una celda de tabla es una sugerencia', () => {
    /* MEDIDO EN CHROME sobre el catálogo: con 26 columnas la tabla es más ancha
       que su contenedor y la N.º salía a **45,24 px** mientras el nombre se
       anclaba en `left: 52px`. Siete píxeles por los que se ve pasar el
       contenido al desplazar. `min-width` sí entra en el reparto de la tabla:
       th y td pasan a 52,00 y el hueco cae a 0.
       Ningún candado podía verlo: todos miran declaraciones, no cajas. */
    const r = regla('.tb-th-indice.tb-ancla, .tb-indice.tb-ancla');
    expect(r).toMatch(/min-width:\s*var\(--tb-indice\)/);
    /* Y TAMPOCO CRECE, que es el otro síntoma y peor: medido en Chrome, con la
       N.º de cuatro cifras la celda pasaba a 55,21 y el nombre se montaba
       ENCIMA 3,21 px; con cinco, 63 y once. Se pierde el nombre Y el número.
       Con el tope y el relleno a 4 px caben hasta 99.999 filas sin recortar —
       medido una a una—. */
    expect(r, 'sin tope por arriba, el nombre se monta encima de la N.º')
      .toMatch(/max-width:\s*var\(--tb-indice\)/);
    expect(r).toMatch(/overflow:\s*hidden/);
    expect(regla('.tb-indice.tb-ancla')).toMatch(/padding-inline:\s*4px/);
  });

  it('[32] la celda de FILTRO anclada gana por especificidad, no por orden', () => {
    /* `.tb-f-celda.tb-ancla` empataba (0,2,0) con `.tb-fila-filtros .tb-f-celda`,
       que va DESPUÉS: su `background` no ganaba nunca. Los dos valores coinciden
       hoy, así que no se veía — y esa es la declaración muerta del R87, repetida
       veinte líneas más abajo de donde está escrita esa lección. */
    expect(css).toMatch(
      /\.tb-fila-filtros \.tb-f-celda\.tb-ancla\s*\{[^}]*background:\s*var\(--fondo-encabezado\)/
    );
  });

  it('[33] el separador es `::after`, y NINGUNA regla del anclaje pone un borde', () => {
    /* Con `border-collapse: collapse` los bordes los pinta la TABLA, no la
       celda: un borde puesto aquí no viajaría con ella al desplazar. */
    expect(css).toMatch(/\.tb-ancla-fin::after\s*\{[^}]*content:\s*''/);
    expect(regla('.tb-ancla-fin::after')).toMatch(/background:\s*var\(--borde\)/);
    /* Y `position: absolute`, que es LA MITAD DE LA REGLA QUE NADIE MIRABA.
       Sin ella el `::after` es una caja EN LÍNEA vacía: `top/bottom/right`
       quedan inertes y `width: 1px` no aplica. El separador desaparecía entero
       y los veinte candados y las once pruebas salían en verde. Lo cazó una
       auditoría adversaria; quitar la regla ENTERA sí se cazaba, la mitad no. */
    expect(regla('.tb-ancla-fin::after'), 'en línea, el separador no se pinta')
      .toMatch(/position:\s*absolute/);
    expect(regla('.tb-ancla-fin::after')).toMatch(/width:\s*1px/);
    for (const sel of ['.tb-ancla', '.tb-ancla-x', '.tb-ancla-fin']) {
      expect(regla(sel), `${sel} declara un borde`).not.toMatch(/border-(left|right)\s*:/);
    }
  });

  it('[33] y `border-collapse` NO se toca', () => {
    /* Pasar a `separate` duplicaría filetes donde `td{border-top}` se encuentra
       con `th{border-bottom}` y cambiaría la altura de fila que la regla 28
       protege con números medidos, a cambio de nada: hoy `.tb` no declara ni un
       borde vertical en celdas, así que no hay borde que perder. */
    expect(css).toMatch(/\.tb\s*\{[^}]*border-collapse:\s*collapse/);
    expect(css).not.toMatch(/border-collapse:\s*separate/);
  });

  it('[34] en el teléfono tiene techo, y recorta en vez de partir', () => {
    /* A 390px, con `nowrap` y un nombre largo, la anclada ocupa más que la
       pantalla y no queda NADA que desplazar: el anclaje habría empeorado el
       caso que vino a arreglar. */
    const movil = css.match(/@media \(max-width: 640px\)\s*\{[\s\S]*?\n\}/g)?.join('\n') ?? '';
    expect(movil).toMatch(/\.tb-ancla\s*\{[^}]*max-width:\s*44vw/);
    expect(movil).toMatch(/\.tb-ancla\s*\{[^}]*text-overflow:\s*ellipsis/);
    /* `overflow: hidden` es la que DA EFECTO a las otras dos, y era la única de
       las tres que nadie medía: quitándola, cascada, promesa, empate y las once
       pruebas seguían en verde. */
    expect(movil, 'sin overflow, ni el recorte ni la elipsis hacen nada')
      .toMatch(/\.tb-ancla\s*\{[^}]*overflow:\s*hidden/);
  });

  it('[34] y en escritorio NO hay techo para el CONTENIDO: ése es del teléfono', () => {
    /* El tope de la columna N.º —`.tb-indice.tb-ancla`— es otra cosa y sí es
       permanente: existe para que el nombre no se monte encima. Lo que no puede
       existir en escritorio es el techo de 44vw sobre la celda anclada. */
    const fuera = css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '');
    expect(fuera).not.toMatch(/(?:^|[}\n;])\s*\.tb-ancla\s*\{[^}]*max-width/);
    expect(fuera).not.toMatch(/44vw/);
  });

  it('pegado al papel no significa nada: en impresión vuelve a `static`', () => {
    const impreso = css.match(/@media print\s*\{[\s\S]*?\n\}/g)?.join('\n') ?? '';
    expect(impreso).toMatch(/\.tb-ancla\s*\{[^}]*position:\s*static/);
  });

  it('la cabecera y la fila de filtros llevan SU fondo, no el de la tarjeta', () => {
    /* Si no, la columna anclada rompe la banda del encabezado justo donde
       empieza, que es lo primero que se mira. */
    expect(regla('.tb-th.tb-ancla')).toMatch(/background:\s*var\(--fondo-encabezado\)/);
    expect(regla('.tb-fila-filtros .tb-f-celda.tb-ancla'))
      .toMatch(/background:\s*var\(--fondo-encabezado\)/);
  });
});
