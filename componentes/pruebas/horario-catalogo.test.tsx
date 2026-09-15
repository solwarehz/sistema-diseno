/**
 * EL HORARIO DEL CATÁLOGO EMITE LO QUE EMITE EL COMPONENTE
 *
 * De los cinco archivos que comparan el catálogo con la entrega, **ninguno era
 * el del horario**. Lo único que lo cubría era `verificar-promesa`, y ése
 * resuelve las dos hojas **sobre el MISMO marcado**: por construcción no puede
 * ver que el marcado del catálogo sea distinto del que el componente produce.
 * Es el hueco exacto que hizo nacer `verificar-elemento` en su día.
 *
 * Y había dos divergencias, encontradas al ir a mirar el 2026-09-15, a raíz del
 * R137:
 *
 *   · **Nueve de diez bloques sin `title`.** El componente lo emite siempre
 *     —«Lunes, 07:45 – 09:00»— y la maqueta no lo llevaba. Es R135(c) otra vez:
 *     el catálogo incumpliendo la regla del globito que él mismo publica.
 *   · **Cinco bloques fuera de `.hor-pila`.** El componente la emite SIEMPRE, y
 *     sin ella el bloque recibe `height: 100%` en vez de
 *     `flex: 1 0 auto; height: auto`. El catálogo demostraba una caja que el
 *     componente no produce jamás — justo el sitio donde se esconden los
 *     defectos de altura, que es de lo que iba el R137.
 */

import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Horario } from '../src/Horario';

let HTML: string;
beforeAll(() => {
  HTML = readFileSync(resolve(process.cwd(), '..', 'cascaron', 'index.html'), 'utf8');
});
const doc = () => new JSDOM(HTML, { virtualConsole: new VirtualConsole() }).window.document;

/** Los bloques del horario del catálogo, estén en la maqueta que estén. */
const bloquesDelCatalogo = (d: Document) => [...d.querySelectorAll('.hor-b')];

describe('[8] el horario del catálogo emite lo que emite el componente', () => {
  it('todo bloque va dentro de una `.hor-pila`, como lo emite el componente', () => {
    /* Sin la pila la caja es otra: `.hor-b{height:100%}` contra
       `.hor-pila > .hor-b{flex:1 0 auto; height:auto}`. Una maqueta que enseñe
       la primera está enseñando algo que ningún producto recibe. */
    const sueltos = bloquesDelCatalogo(doc())
      .filter((b) => !b.parentElement?.classList.contains('hor-pila'))
      .map((b) => b.querySelector('b')?.textContent ?? b.className);
    expect(sueltos, 'bloques del catálogo fuera de `.hor-pila`').toEqual([]);
  });

  it('y todo bloque lleva su `title`, que el componente emite siempre', () => {
    const mudos = bloquesDelCatalogo(doc())
      .filter((b) => !b.getAttribute('title'))
      .map((b) => b.querySelector('b')?.textContent ?? b.className);
    expect(mudos, 'bloques del catálogo sin rótulo para el ratón').toEqual([]);
  });

  it('el `title` dice el día y la franja, no otra cosa', () => {
    /* El componente lo compone como `${día}, ${rango}`. Si el catálogo escribe
       cualquier texto, el globito se demuestra con una forma que no es la que
       llega. */
    for (const b of bloquesDelCatalogo(doc())) {
      const t = b.getAttribute('title')!;
      const rango = b.querySelector('.hor-rango')!.textContent!.trim();
      expect(t, `el title de «${b.querySelector('b')?.textContent}» no acaba en su franja`)
        .toContain(rango);
      expect(t, 'el title no empieza por el día').toMatch(/^[^,]+, /);
    }
  });

  it('la ANATOMÍA de un bloque es la misma en las dos superficies', () => {
    /* Hueco + bloque, y dentro: título en `<b>`, detalle en `<span>` pelado y
       la franja en `.hor-rango`. Se compara la forma, no el texto. */
    const { container } = render(
      <Horario titulo="Horario" dias={['Lun']} inicio="12:00" fin="14:00" paso={120}
        bloques={[{ dia: 0, de: '12:20', a: '13:55', titulo: 'Tutoría', detalle: 'Sede Centro', tono: 'identidad-1' }]} />
    );
    const forma = (pila: Element) => ({
      hijos: [...pila.children].map((e) => e.tagName.toLowerCase() + '.' + e.className.split(' ')[0]),
      dentro: [...(pila.querySelector('.hor-b')?.children ?? [])]
        .map((e) => e.tagName.toLowerCase() + (e.className ? '.' + e.className : '')),
      bloqueTieneTitle: !!pila.querySelector('.hor-b')?.getAttribute('title'),
    });

    const delComponente = forma(container.querySelector('.hor-pila')!);
    expect(delComponente.hijos[0], 'el componente dejó de abrir la pila con el hueco').toBe('i.hor-hueco');

    /* La misma forma en la maqueta: un bloque con fracción, en una celda. Es el
       caso del R137 y el que no estaba en ninguna página hasta hoy. */
    const conHueco = [...doc().querySelectorAll('.hor-pila')]
      .filter((p) => p.querySelector('.hor-hueco'));
    expect(conHueco.length, 'el catálogo no enseña ningún bloque con fracción').toBeGreaterThan(0);
    for (const p of conHueco) {
      expect(forma(p).hijos[0], 'una pila del catálogo no abre con el hueco').toBe('i.hor-hueco');
      expect(forma(p).dentro, 'el bloque del catálogo tiene otra anatomía').toEqual(delComponente.dentro);
      expect(forma(p).bloqueTieneTitle).toBe(true);
    }
  });

  it('[8] R137 · el catálogo enseña el caso que fallaba: UNA celda con fracción', () => {
    /* Sus tres bloques con fracción eran los tres de `rowSpan` 2 —los que
       caben—, así que el único que se salía no estaba en ninguna página. */
    const unaCelda = [...doc().querySelectorAll('.hor-pila')]
      .filter((p) => p.querySelector('.hor-hueco'))
      .filter((p) => {
        const td = p.closest('td');
        return !td?.getAttribute('rowspan') || td.getAttribute('rowspan') === '1';
      });
    expect(unaCelda.length,
      'el catálogo solo enseña bloques con fracción que abarcan varias franjas: '
      + 'el que se salía —una celda con fracción— sigue sin verse en ninguna página')
      .toBeGreaterThan(0);
    // Y con dos líneas de texto dentro, que es lo que hacía que no cupiera.
    const b = unaCelda[0].querySelector('.hor-b')!;
    expect(b.querySelectorAll('span').length, 'el bloque no lleva detalle además de la franja')
      .toBeGreaterThan(1);
  });
});
