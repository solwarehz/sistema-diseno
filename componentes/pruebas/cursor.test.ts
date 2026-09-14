/**
 * EL CURSOR SOBREVIVE A UNA REESCRITURA.
 *
 * Nace de dos defectos seguidos sobre la misma pieza. El primero lo reportó el
 * responsable con la v1.111.0 publicada —no se podía escribir de corrido—; el
 * segundo lo encontró una auditoría **en el arreglo del primero**, y era peor
 * de lo que parecía: tras pulsar Intro, la letra siguiente entraba en la línea
 * de arriba y la nueva se quedaba vacía.
 *
 * La ida y la vuelta tienen que ser la IDENTIDAD: leer dónde está el cursor y
 * volver a ponerlo ahí no puede moverlo. Eso es lo que se prueba.
 */
import { describe, it, expect } from 'vitest';
import { dondeEstaElCursor, ponerElCursor, reescribirConservandoElCursor } from '../src/interno/cursor';

const caja = (html: string, conFoco = true) => {
  const d = document.createElement('div');
  d.contentEditable = 'true';
  // `tabIndex` para que jsdom lo deje enfocar: el cursor solo se restaura si la
  // caja tenía el foco, que es la guarda contra robárselo a otro elemento.
  d.tabIndex = -1;
  d.innerHTML = html;
  document.body.appendChild(d);
  if (conFoco) d.focus();
  return d;
};
const ponerEn = (nodo: Node, offset: number) => {
  const r = document.createRange();
  r.setStart(nodo, offset);
  r.collapse(true);
  const sel = document.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(r);
};

describe('[1c] leer el cursor y volver a ponerlo NO lo mueve', () => {
  const CASOS: [string, string, number][] = [
    ['principio', '<p>Hola</p>', 0],
    ['medio', '<p>Hola</p>', 2],
    ['final', '<p>Hola</p>', 4],
    ['FRONTERA entre dos párrafos', '<p>Hola</p><p>mundo</p>', 4],
    ['dentro del segundo párrafo', '<p>Hola</p><p>mundo</p>', 6],
    ['final de todo', '<p>Hola</p><p>mundo</p>', 9],
    ['frontera al salir de una negrita', '<p><strong>Hola</strong>mundo</p>', 4],
    ['con un `br` en medio', '<p>Hola<br>mundo</p>', 4],
  ];
  it.each(CASOS)('%s', (_, html, donde) => {
    const d = caja(html);
    const paseo = document.createTreeWalker(d, 4);
    // Se coloca el cursor a esa distancia, y se comprueba la ida y la vuelta.
    ponerElCursor(d, { donde, pegadoAlSiguiente: false });
    expect(dondeEstaElCursor(d)?.donde, 'la vuelta no cae donde la ida').toBe(donde);
    d.remove();
    expect(paseo).toBeTruthy();
  });
});

describe('[1c] una reescritura no deja el cursor en la línea anterior', () => {
  it('tras Intro, lo que se escriba va a la línea NUEVA', () => {
    /* El flujo por omisión de Chrome: Intro deja `Hola<div><br></div>`, el
       saneador desenvuelve el `<div>` y eso es una reescritura. El cursor tiene
       que quedar DESPUÉS del `<br>`, no al final de «Hola». Con `>=` quedaba
       antes, y la letra siguiente entraba en la línea de arriba. */
    /* Chrome deja `Hola<div><br></div>` y el cursor DENTRO del bloque nuevo
       —contenedor de tipo elemento, desplazamiento 0—, no al final de «Hola».
       Simularlo al final del texto sería simular otra cosa. */
    const d = caja('Hola<div><br></div>');
    ponerEn(d.querySelector('div')!, 0);
    reescribirConservandoElCursor(d, 'Hola<br>');
    const sel = document.getSelection()!;
    const r = sel.getRangeAt(0);
    // Lo que de verdad importa: insertar aquí cae DESPUÉS del `<br>`.
    r.insertNode(document.createTextNode('M'));
    expect(d.innerHTML, 'la letra entró en la línea anterior').toBe('Hola<br>M');
    d.remove();
  });

  it('en la frontera de dos párrafos, gana el SIGUIENTE', () => {
    const d = caja('<p>Hola</p><p>mundo</p>');
    ponerEn(d.querySelectorAll('p')[1].firstChild!, 0);
    expect(dondeEstaElCursor(d)?.donde).toBe(4);
    reescribirConservandoElCursor(d, '<p>Hola</p><p>mundo!</p>');
    const r = document.getSelection()!.getRangeAt(0);
    expect(r.startContainer.textContent, 'el cursor se fue al párrafo de arriba').toBe('mundo!');
    expect(r.startOffset).toBe(0);
    d.remove();
  });
});

describe('[1c] el lado de la frontera decide, y un numero solo no lo dice', () => {
  it('escribir al FINAL del documento deja la letra DENTRO del párrafo', () => {
    /* Con la regla «hacia delante» el cursor caía al final de la RAÍZ y la
       letra salía fuera del `<p>`: `<p>Hola</p>M`. Lo midió una auditoría el
       2026-09-14, sobre el arreglo del defecto de Intro. */
    const d = caja('<p>HolaQ</p>');
    const t = d.querySelector('p')!.firstChild as Text;
    ponerEn(t, 5);
    // La `Q` no está permitida en este ejemplo: el saneo la retira y reescribe.
    reescribirConservandoElCursor(d, '<p>Hola</p>');
    document.getSelection()!.getRangeAt(0).insertNode(document.createTextNode('M'));
    expect(d.innerHTML, 'la letra salió del párrafo').toBe('<p>HolaM</p>');
    d.remove();
  });

  it('con el cursor al final del párrafo 1, la letra NO salta al párrafo 2', () => {
    /* El otro lado de la frontera. El saneo retira un `<font>` del párrafo de
       abajo —eso reescribe— pero el texto de delante del cursor no cambia, así
       que el cursor tiene que quedarse donde estaba: al final de «uno». Sin
       distinguir el lado, se iba al principio de «dos». */
    const d = caja('<p>uno</p><p><font>dos</font></p>');
    ponerEn(d.querySelectorAll('p')[0].firstChild!, 3);
    reescribirConservandoElCursor(d, '<p>uno</p><p>dos</p>');
    document.getSelection()!.getRangeAt(0).insertNode(document.createTextNode('M'));
    expect(d.innerHTML, 'la letra saltó al párrafo siguiente').toBe('<p>unoM</p><p>dos</p>');
    d.remove();
  });

  it('si el saneo retira texto POR DELANTE del cursor, el cursor se corre — y se dice', () => {
    /* HUECO DECLARADO, no defecto tapado. La posición se guarda como un número
       de caracteres, así que si el saneo retira algo **antes** del cursor, ese
       número apunta N caracteres más allá. Arreglarlo de verdad pide comparar
       el antes y el después, y eso es otra pieza.
       Pasa solo cuando el saneo retira mientras se escribe —escribir dentro de
       un `{{hueco}}`, o pegar—, no al teclear normal, que no reescribe nada. */
    const d = caja('<p>unoQ</p><p>dos</p>');
    ponerEn(d.querySelectorAll('p')[0].firstChild!, 4);
    reescribirConservandoElCursor(d, '<p>uno</p><p>dos</p>');
    document.getSelection()!.getRangeAt(0).insertNode(document.createTextNode('M'));
    // Lo que hace HOY, escrito para que se vea si algún día cambia.
    expect(d.innerHTML).toBe('<p>uno</p><p>dMos</p>');
    d.remove();
  });

  it('pero al final del documento NO se sale del párrafo aunque el texto encoja', () => {
    const d = caja('<p>Hola</p><p>dosQ</p>');
    ponerEn(d.querySelectorAll('p')[1].firstChild!, 4);
    reescribirConservandoElCursor(d, '<p>Hola</p><p>dos</p>');
    document.getSelection()!.getRangeAt(0).insertNode(document.createTextNode('M'));
    expect(d.innerHTML, 'la letra salió del párrafo').toBe('<p>Hola</p><p>dosM</p>');
    d.remove();
  });
});

describe('[1c] los bordes', () => {
  it('una posición más allá del texto se queda al final', () => {
    const d = caja('<p>Hola</p>');
    ponerElCursor(d, { donde: 99, pegadoAlSiguiente: false });
    expect(dondeEstaElCursor(d)?.donde).toBe(4);
    d.remove();
  });
  it('sin cursor dentro, no se inventa uno', () => {
    const d = caja('<p>Hola</p>');
    const fuera = caja('<p>Otra caja</p>');
    ponerEn(fuera.firstChild!.firstChild!, 2);
    expect(dondeEstaElCursor(d)).toBeNull();
    d.remove(); fuera.remove();
  });
  it('sin foco NO se toca la selección: no se le roba a nadie', () => {
    const d = caja('<p>Hola</p>');
    const otro = caja('<p>Donde estoy escribiendo</p>');
    otro.focus();
    ponerEn(otro.firstChild!.firstChild!, 5);
    reescribirConservandoElCursor(d, '<p>Adios</p>');
    const r = document.getSelection()!.getRangeAt(0);
    expect(otro.contains(r.startContainer), 'le robó la selección a otro elemento').toBe(true);
    d.remove(); otro.remove();
  });
  it('si no hay nada que reescribir, no reescribe', () => {
    const d = caja('<p>Hola</p>');
    const p = d.querySelector('p');
    expect(reescribirConservandoElCursor(d, '<p>Hola</p>')).toBe(false);
    expect(d.querySelector('p')).toBe(p);
    d.remove();
  });
});
