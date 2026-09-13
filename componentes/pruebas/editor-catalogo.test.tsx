/**
 * EL EDITOR DEL CATÁLOGO CONTRA EL QUE EMITE EL COMPONENTE.
 *
 * Existe porque una auditoría encontró **cinco divergencias** el día que nació
 * el componente, y ninguna la vio ningún candado: el icono a 18 px contra 16,
 * el orden de la barra cambiado, el icono sin su envoltura, `.ed-puestos`
 * fuera de `.ed` en vez de dentro, y la región viva que el catálogo no pintaba.
 *
 * `verificar-iconos` pasó en verde porque compara **nombres y trazo, no
 * tamaño**. Es la misma ceguera de siempre en un candado nuevo, y por eso hace
 * falta esto: el método de R116 y R126, que ya se usa para el selector, para el
 * calendario y para el botón ocupado.
 */
import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { EditorTexto, type EtiquetaEditor } from '../src/EditorTexto';

const CATALOGO = resolve(process.cwd(), '..', 'cascaron', 'index.html');
let HTML: string;
beforeAll(() => {
  HTML = readFileSync(CATALOGO, 'utf8');
  document.execCommand = vi.fn(() => true) as unknown as typeof document.execCommand;
});

/** Forma del árbol: etiqueta, clases, y los atributos que deciden algo. */
const forma = (el: Element): unknown => ({
  tag: el.tagName.toLowerCase(),
  clases: [...el.classList].sort().join(' '),
  role: el.getAttribute('role') ?? null,
  ariaHidden: el.getAttribute('aria-hidden') ?? null,
  tabindex: el.getAttribute('tabindex') ?? null,
  // El tamaño del icono: es una de las cinco divergencias, y `verificar-iconos`
  // no lo mira.
  medidas: el.tagName.toLowerCase() === 'svg'
    ? `${el.getAttribute('width')}x${el.getAttribute('height')}` : null,
  /* `title` SÍ SE COMPARA: lo emite el componente cuando el hueco trae
     `ejemplo`, y el catálogo no lo pintaba en ninguno de los cuatro botones.
     `ejemplo` era una función del sistema que no existía en la página. */
  title: el.getAttribute('title') ?? null,
  hijos: [...el.children].map(forma),
});

/**
 * TODOS los editores del catálogo, **incluidos los de dentro de un
 * `<template>`**.
 *
 * `querySelector` no entra en el contenido de un `<template>`, y el editor de
 * «La entrega real» vive justo ahí: conservó las cinco divergencias que esta
 * prueba dice cazar sin que nadie se enterara. Y los dos candados que leen
 * marcado —`verificar-elemento` y `verificar-promesa`— **borran los
 * `<template>` a propósito**, así que tampoco los ven. Esa página es la única
 * que enseña el componente con la hoja que viaja: no mirarla es no mirar nada.
 */
const delCatalogo = () => {
  const dom = new JSDOM(HTML, { virtualConsole: new VirtualConsole() });
  const doc = dom.window.document;
  const todos = [
    ...doc.querySelectorAll('.ed'),
    ...[...doc.querySelectorAll('template')]
      .flatMap((t) => [...(t as HTMLTemplateElement).content.querySelectorAll('.ed')]),
  ];
  expect(todos.length, 'el catálogo no pinta el editor').toBeGreaterThan(0);
  return todos;
};

/** ¿Este nodo vive dentro del contenido de un `<template>`? */
const dentroDePlantilla = (el: Element) => {
  for (let n: Node | null = el; n; n = (n as Element).parentNode ?? (n as unknown as { host?: Node }).host ?? null) {
    if ((n as Element).nodeType === 11) return true;   // DocumentFragment: el contenido de un template
  }
  return false;
};

describe('el editor que el catálogo enseña es el que el componente emite', () => {
  const SIETE: EtiquetaEditor[] = ['p', 'strong', 'ul', 'li', 'hr', 'br', 'h3'];

  /**
   * Cada muestra con SU configuración. Las dos páginas enseñan el mismo
   * componente con textos distintos, así que cada una se compara con el render
   * de LO SUYO: contra un único render sería comparar peras con manzanas, y
   * pasaría por casualidad el día que coincidieran.
   *
   * La lista de huecos es la misma en las dos, y eso ahora es obligatorio, no
   * casualidad: «La entrega real» declaraba dos huecos y su texto usaba un
   * tercero —`{{fechaHechoLarga}}`—, así que el componente lo retiraba y
   * anunciaba el retiro, mientras el marcado a mano lo enseñaba puesto. El
   * catálogo pintaba una configuración que el componente no produce.
   */
  /** Los cuatro huecos del contrato, con los dos ejemplos que trae. */
  const CUATRO = [
    { nombre: 'trabajador', rotulo: 'Trabajador', ejemplo: 'LEON TUYA, Mayori' },
    { nombre: 'sede', rotulo: 'Sede' },
    { nombre: 'fechaHecho', rotulo: 'Fecha', ejemplo: '08/09/2026' },
    { nombre: 'fechaHechoLarga', rotulo: 'Fecha larga' },
  ];

  const MUESTRAS = [
    {
      donde: 'la página del componente',
      enPlantilla: false,
      orden: 0,
      huecos: CUATRO,
      valor: '<p>Por medio del <strong>presente</strong> se comunica a {{trabajador}}, de la sede {{sede}}, que el dia {{fechaHechoLarga}} se registro una inasistencia.</p>',
    },
    {
      donde: '«La entrega real»',
      enPlantilla: true,
      orden: 0,
      huecos: CUATRO,
      valor: '<h3>Memorando de inasistencia</h3><p>Se comunica a {{trabajador}}, de la sede {{sede}}, lo <strong>siguiente</strong>:</p><ul><li>Inasistencia del dia {{fechaHechoLarga}}.</li><li>Sin justificacion presentada.</li></ul><hr><p>Se descuenta la jornada.</p>',
    },
    {
      /* `.ed-mal` y `.ed-retirado` VIAJABAN sin que el catálogo los pintara en
         ningún sitio, así que el aviso que es la única prueba visible de la
         promesa central de la pieza —«se retira y SE DICE»— se entregaba sin
         que nadie lo hubiera visto. Ahora hay muestra, y se compara. */
      donde: '«La entrega real», en error',
      enPlantilla: true,
      orden: 1,
      huecos: CUATRO,
      error: 'Revisa el documento antes de guardar.',
      valor: '<div><font>Se comunica a {{trabajador}}</font> y a {{documento}}.</div>',
    },
  ];

  it.each(MUESTRAS)('$donde emite la misma anatomía', ({ enPlantilla, orden, huecos, valor, error }) => {
    const { container } = render(
      <EditorTexto
        etiqueta="Cuerpo del documento"
        etiquetas={SIETE}
        huecos={huecos}
        valor={valor}
        error={error}
        onCambio={() => {}}
      />,
    );
    const enCatalogo = delCatalogo().filter((e) => dentroDePlantilla(e) === enPlantilla);
    expect(enCatalogo.length, 'no encuentro esa muestra en el catálogo').toBeGreaterThan(orden);
    expect(forma(enCatalogo[orden])).toEqual(forma(container.querySelector('.ed')!));
  });

  it('el catálogo no pinta NI UN editor de más ni de menos', () => {
    // Sin esto, una muestra nueva y sin comparar pasaría inadvertida — que es
    // exactamente como «La entrega real» conservó sus cinco divergencias.
    const todos = delCatalogo();
    expect(todos.filter((e) => !dentroDePlantilla(e)).length).toBe(1);
    expect(todos.filter((e) => dentroDePlantilla(e)).length).toBe(2);
  });
});
