/**
 * EL SANEADOR · LA INVARIANTE, PROBADA DONDE SE PUEDE PROBAR.
 *
 * El editor promete una sola cosa: «lo que llega a `onCambio` SIEMPRE está
 * dentro de `etiquetas` y `huecos`, venga de teclear, de pegar, de arrastrar o
 * de deshacer». Todo eso se decide en una función pura sobre texto, así que se
 * prueba entera sin navegador, sin `contenteditable` y sin selección — que es
 * exactamente por lo que se sacó a su propio archivo.
 *
 * La lista de la primera configuración real, la que trajo el requerimiento:
 * siete etiquetas, cero atributos, cuatro huecos.
 */
import { describe, it, expect } from 'vitest';
import { sanear, huecosDe, tramoDeHueco, type EtiquetaEditor } from '../src/interno/sanear';

const ETIQUETAS: EtiquetaEditor[] = ['p', 'strong', 'ul', 'li', 'hr', 'br', 'h3'];
const HUECOS = ['trabajador', 'sede', 'fechaHecho', 'fechaHechoLarga'];

const parse = (html: string) =>
  new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

const limpio = (html: string, etiquetas = ETIQUETAS, huecos = HUECOS) =>
  sanear(html, { etiquetas, huecos, parse });

describe('la invariante: nada sale fuera de las listas', () => {
  it('[1] deja pasar lo permitido, tal cual', () => {
    const r = limpio('<p>Hola <strong>mundo</strong></p><ul><li>uno</li></ul><hr>');
    expect(r.html).toBe('<p>Hola <strong>mundo</strong></p><ul><li>uno</li></ul><hr>');
    expect(r.etiquetasFuera).toEqual([]);
  });

  it('[4] CERO ATRIBUTOS, ni en las etiquetas permitidas', () => {
    // No es la rareza de un producto: un atributo no significa nada para quien
    // dibuja un PDF, y admitirlo solo sirve para que alguien lo escriba y no
    // pase nada.
    const r = limpio('<p class="x" style="color:red" id="y" data-z="1">Texto</p>');
    expect(r.html).toBe('<p>Texto</p>');
  });

  it('[5] quita la etiqueta y CONSERVA el contenido', () => {
    // Tirar el contenido con la etiqueta dejaría vacío un documento pegado
    // desde Word, donde cada párrafo viene envuelto en tres `<span>`.
    const r = limpio('<div><span style="font-weight:bold">Importante</span></div>');
    expect(r.html).toBe('Importante');
    expect(r.etiquetasFuera).toEqual(['div', 'span']);
  });

  it('[9] lo que pega Word sale limpio', () => {
    const word = `<html xmlns:o="urn:schemas-microsoft-com:office:office">
      <!--[if gte mso 9]><xml><o:OfficeDocumentSettings/></xml><![endif]-->
      <body><p class="MsoNormal"><span style="font-family:Calibri">
      Se comunica a <b><span style="mso-bidi-font-weight:normal">
      <strong>{{trabajador}}</strong></span></b><o:p></o:p></span></p></body></html>`;
    const r = limpio(word);
    expect(r.html).toContain('<strong>{{trabajador}}</strong>');
    expect(r.html).not.toContain('style');
    expect(r.html).not.toContain('o:p');
    expect(r.html).not.toContain('MsoNormal');
  });

  it('[5] `script` y `style` se van CON su contenido', () => {
    // La única excepción a «se conserva el contenido», y por motivo obvio.
    const r = limpio('<p>Antes</p><script>alert(1)</script><style>p{color:red}</style><p>Después</p>');
    expect(r.html).toBe('<p>Antes</p><p>Después</p>');
    expect(r.html).not.toContain('alert');
  });

  it('un `<li>` sin lista no se queda suelto', () => {
    // Con `ul` fuera de la lista, sus `li` no significan nada.
    const r = limpio('<ul><li>uno</li></ul>', ['p', 'li']);
    expect(r.html).toBe('uno');
  });

  it('la etiqueta con el mismo nombre en mayúsculas también cae', () => {
    const r = limpio('<P>uno</P><FONT>dos</FONT>');
    expect(r.html).toBe('<p>uno</p>dos');
  });

  it('[6] el `<` dentro de un atributo no engaña al saneador', () => {
    // Un troceador por texto se traga esto. Se parsea el DOM a propósito.
    const r = limpio('<p title="<strong>truco</strong>">Texto</p>');
    expect(r.html).toBe('<p>Texto</p>');
  });

  it('el texto se escapa: no se puede inyectar reabriendo etiquetas', () => {
    const r = limpio('<p>3 &lt; 5 &amp; 7 &gt; 2</p>');
    expect(r.html).toBe('<p>3 &lt; 5 &amp; 7 &gt; 2</p>');
  });

  it('[2] la lista VACÍA no deja pasar nada', () => {
    const r = limpio('<p>Hola <strong>mundo</strong></p>', []);
    expect(r.html).toBe('Hola mundo');
  });
});

describe('los huecos', () => {
  it('[7] los permitidos pasan, y se normaliza el espacio de dentro', () => {
    const r = limpio('<p>{{trabajador}} y {{ sede }}</p>');
    expect(r.html).toBe('<p>{{trabajador}} y {{sede}}</p>');
  });

  it('[7] DISTINGUE MAYÚSCULAS: `{{Trabajador}}` no es `{{trabajador}}`', () => {
    const r = limpio('<p>{{Trabajador}}</p>');
    expect(r.html).toBe('<p></p>');
    expect(r.huecosFuera).toEqual(['Trabajador']);
  });

  it('[8] el desconocido se RETIRA, y se dice cuál era', () => {
    // La invariante no admite que salga: el destino lo rechazaría con 400 y
    // quien escribe perdería el documento al guardar. Se quita, y se nombra —
    // quitarlo en silencio es lo que hace el destino, y es lo que esta pieza
    // viene a evitar.
    const r = limpio('<p>Hola {{documento}} adiós</p>');
    expect(r.html).toBe('<p>Hola  adiós</p>');
    expect(r.huecosFuera).toEqual(['documento']);
  });

  it('[11] borrar un desconocido no FABRICA otro con las llaves de al lado', () => {
    // `String.replace` recorre el original en una sola pasada: el `{{` de la
    // posición 0 no casa —le sigue otra llave—, casa `{{documento}}`, y al
    // borrarlo se unen `{{ ` y `sede}}`. Se sanea hasta el punto fijo.
    const r = limpio('<p>{{ {{documento}}sede}}</p>');
    expect(r.html).toBe('<p>{{sede}}</p>');
    expect(limpio(r.html).html).toBe(r.html);
  });

  it('[5] el espacio duro es contenido, y no se tira', () => {
    // Sale como `&nbsp;` y no como carácter crudo: es lo que devuelve
    // `innerHTML`, y esa coincidencia es lo que salva el cursor. Ver `[1c]`.
    const r = limpio('<p><strong>\u00a0</strong>x</p>');
    expect(r.html).toBe('<p><strong>&nbsp;</strong>x</p>');
  });

  /**
   * LA SALIDA SE SERIALIZA COMO LO HACE EL NAVEGADOR, byte a byte.
   *
   * No es cosmética: el editor decide si reescribe la caja comparando lo que
   * sanea con lo que `innerHTML` le devuelve. Si difieren en un solo carácter,
   * la respuesta es «cambió» SIEMPRE, la caja se reescribe en cada tecla y el
   * cursor vuelve al principio — no se puede escribir de corrido.
   *
   * Eso se publicó. El espacio duro salía crudo y `innerHTML` lo devuelve como
   * `&nbsp;`, y el navegador mete uno **cada vez que se teclea un espacio**.
   * Lo reportó el responsable el 2026-09-14 con la v1.111.0 en producción.
   * Ninguna de las 49 pruebas lo vio porque todas escribían el HTML a mano, y
   * a mano nadie escribe un espacio duro: lo pone el navegador.
   *
   * Por eso esta prueba no compara contra una cadena escrita a mano. Mete el
   * contenido en un elemento de verdad y compara contra lo que ESE elemento
   * devuelve.
   */
  describe('[1c] lo saneado vuelve idéntico de un `innerHTML`', () => {
    const comoElNavegador = (html: string) => {
      const caja = document.createElement('div');
      caja.innerHTML = html;
      return caja.innerHTML;
    };
    const CASOS: [string, string][] = [
      ['un párrafo', '<p>Hola</p>'],
      ['escribiendo, aún sin párrafo', 'Hola'],
      ['un espacio al final, que el navegador hace duro', '<p>Hola&nbsp;</p>'],
      ['un espacio en medio', '<p>Hola&nbsp;mundo</p>'],
      ['dos duros seguidos', '<p>a&nbsp;&nbsp;b</p>'],
      ['duro dentro de negrita', '<p>a <strong>b&nbsp;c</strong></p>'],
      ['duro en una lista', '<ul><li>uno&nbsp;dos</li></ul>'],
      ['duro pegado a un hueco', '<p>Hola&nbsp;{{sede}}&nbsp;fin</p>'],
      ['negrita', '<p>Hola <strong>tú</strong></p>'],
      ['salto de línea', '<p>Hola<br>mundo</p>'],
      ['el párrafo vacío que deja el navegador', '<p><br></p>'],
      ['separador', '<p>a</p><hr><p>b</p>'],
      ['ampersand y menor que', '<p>Tú &amp; yo, 3 &lt; 5</p>'],
      ['comillas', '<p>Dijo "hola" y \'adiós\'</p>'],
      ['acentos y eñe', '<p>Año, sesión, ñandú</p>'],
      ['todo junto', '<h3>T&nbsp;t</h3><p>a &amp; b&nbsp;</p><hr><ul><li>x<br>y</li></ul>'],
    ];
    it.each(CASOS)('%s', (_, html) => {
      const enLaCaja = comoElNavegador(html);
      expect(limpio(enLaCaja).html, 'el editor reescribiría la caja y perdería el cursor')
        .toBe(enLaCaja);
    });
  });

  it('lo que no casa con la forma no es un hueco y se queda como texto', () => {
    const r = limpio('<p>{{ 9malo }} y {{con-guion}} y {{}}</p>');
    expect(r.html).toBe('<p>{{ 9malo }} y {{con-guion}} y {{}}</p>');
    expect(r.huecosFuera).toEqual([]);
  });

  it('`huecosDe` los lee en orden de aparición', () => {
    expect(huecosDe('<p>{{sede}} y {{trabajador}} y {{sede}}</p>'))
      .toEqual(['sede', 'trabajador', 'sede']);
  });

  it('un hueco dentro de una etiqueta permitida sigue siendo hueco', () => {
    const r = limpio('<p><strong>{{trabajador}}</strong></p>');
    expect(r.html).toBe('<p><strong>{{trabajador}}</strong></p>');
  });
});

describe('lo que se retira SE PUEDE DECIR', () => {
  it('devuelve las etiquetas retiradas, ordenadas y sin repetir', () => {
    const r = limpio('<div><span>a</span><span>b</span><font>c</font></div>');
    expect(r.etiquetasFuera).toEqual(['div', 'font', 'span']);
  });

  it('y no reporta las que sí estaban permitidas', () => {
    const r = limpio('<p><strong>a</strong></p>');
    expect(r.etiquetasFuera).toEqual([]);
  });
});

describe('[11] el saneo es IDEMPOTENTE', () => {
  // Si sanear dos veces diera algo distinto, el editor entraría en bucle:
  // cada `onCambio` reescribiría la caja y dispararía otro `onCambio`.
  it.each([
    '<p>Hola <strong>{{trabajador}}</strong></p>',
    '<div><span style="x">a</span></div>',
    '<ul><li>uno</li><li>{{sede}}</li></ul><hr><p></p>',
    '<p>{{documento}} y {{Trabajador}}</p>',
    // LOS QUE LO ROMPIERON. Borrar un hueco desconocido juntaba las llaves de
    // los lados y FABRICABA uno nuevo, así que el documento guardado cambiaba
    // solo entre una sesión y la siguiente. Las cuatro entradas de arriba eran
    // todas benignas: ninguna borraba un hueco ENTRE llaves.
    '<p>{{ {{documento}}sede}}</p>',
    '<p>{{{{documento}}trabajador}}</p>',
    '<p>{{a}}{{ {{b}}sede}}{{c}}</p>',
    '<p>{{ {{ {{x}}y}}sede}}</p>',
  ])('%s', (html) => {
    const una = limpio(html).html;
    expect(limpio(una).html).toBe(una);
  });
});

describe('[12] la ficha es indivisible', () => {
  // Un `{{trabajador}}` es UNA cosa, no trece caracteres. La primera versión
  // del componente lo afirmaba en tres sitios sin construir nada: un Retroceso
  // al lado dejaba `{{sede}` y el hueco pasaba a ser texto suelto.
  const T = 'Hola {{sede}} adiós';
  //         0123456789...  → el hueco va de 5 a 13

  it('Retroceso justo DETRÁS se lleva el hueco entero, nunca `{{sede}`', () => {
    expect(tramoDeHueco(T, 13, 'atras')).toEqual({ inicio: 5, fin: 13 });
  });

  it('Suprimir justo DELANTE, lo mismo por el otro lado', () => {
    expect(tramoDeHueco(T, 5, 'delante')).toEqual({ inicio: 5, fin: 13 });
  });

  it('DENTRO del hueco, en cualquier dirección, se va entero', () => {
    for (const donde of [6, 8, 12]) {
      expect(tramoDeHueco(T, donde, 'atras'), `atrás en ${donde}`).toEqual({ inicio: 5, fin: 13 });
      expect(tramoDeHueco(T, donde, 'delante'), `delante en ${donde}`).toEqual({ inicio: 5, fin: 13 });
    }
  });

  it('fuera del hueco NO se toca el borrado normal', () => {
    expect(tramoDeHueco(T, 3, 'atras')).toBeNull();      // en «Hola»
    expect(tramoDeHueco(T, 17, 'atras')).toBeNull();     // en «adiós»
    expect(tramoDeHueco(T, 5, 'atras')).toBeNull();      // justo ANTES, con Retroceso
    expect(tramoDeHueco(T, 13, 'delante')).toBeNull();   // justo DESPUÉS, con Suprimir
  });

  it('con varios huecos, se lleva el que toca y solo ese', () => {
    const dos = '{{sede}} y {{trabajador}}';
    expect(tramoDeHueco(dos, 8, 'atras')).toEqual({ inicio: 0, fin: 8 });
    expect(tramoDeHueco(dos, 25, 'atras')).toEqual({ inicio: 11, fin: 25 });
    expect(tramoDeHueco(dos, 9, 'atras')).toBeNull();
  });

  it('un texto sin huecos no cambia nada', () => {
    expect(tramoDeHueco('nada que ver', 4, 'atras')).toBeNull();
  });
});

describe('lo que EMITE el navegador cabe en la lista', () => {
  /**
   * LA TABLA QUE MIDIÓ EL EQUIPO EN CHROME 152, convertida en prueba.
   *
   * El defecto que la motiva es el peor de todos los que ha tenido esta pieza:
   * **el botón «Negrita» no ponía negrita, y encima culpaba a quien escribe**.
   * `execCommand('bold')` emite `<b>`, la lista blanca tiene `strong`, el
   * saneador lo desenvolvía, y el aviso decía «se quitó el formato que no se
   * admite (b)» — acusando de meter un formato prohibido a quien había pulsado
   * el botón del propio componente.
   *
   * Y sobrevivió por una razón que conviene no olvidar: **se quitó la
   * demostración viva del catálogo** porque mentía —era un `contenteditable`
   * sin saneador— y con ella se fue el único sitio donde pulsar «Negrita»
   * habría enseñado que no hacía nada. Esta prueba es lo que ocupa su lugar, y
   * es mejor: corre sola.
   */
  const EMITE: Array<[string, string, string]> = [
    ['bold',                  '<b>hola</b>',            '<strong>hola</strong>'],
    ['italic',                '<i>hola</i>',            '<em>hola</em>'],
    ['underline',             '<u>hola</u>',            '<u>hola</u>'],
    ['formatBlock h3',        '<h3>hola</h3>',          '<h3>hola</h3>'],
    ['insertUnorderedList',   '<ul><li>hola</li></ul>', '<ul><li>hola</li></ul>'],
    ['insertHorizontalRule',  '<hr>',                   '<hr>'],
  ];
  const TODAS: EtiquetaEditor[] = ['p', 'strong', 'em', 'u', 'ul', 'li', 'hr', 'br', 'h3'];

  it.each(EMITE)('[11b] `%s` emite %s y sobrevive', (_orden, emitido, esperado) => {
    const r = sanear(emitido, { etiquetas: TODAS, huecos: [], parse });
    expect(r.html).toBe(esperado);
    expect(r.etiquetasFuera, 'el propio botón del componente salía en el aviso').toEqual([]);
  });

  it('[11b] pero la lista SIGUE mandando: sin `strong`, un `<b>` se va igual', () => {
    // Normalizar no es ampliar la lista blanca. Si el producto no admite
    // negrita, el `<b>` del navegador tampoco pasa.
    const r = sanear('<b>hola</b>', { etiquetas: ['p'], huecos: [], parse });
    expect(r.html).toBe('hola');
    expect(r.etiquetasFuera).toEqual(['b']);
  });

  it('[11b] y lo que se pega gana con ello: un `<b>` de Word pasa a `<strong>`', () => {
    const r = sanear('<p><b>Importante</b></p>', { etiquetas: ['p', 'strong'], huecos: [], parse });
    expect(r.html).toBe('<p><strong>Importante</strong></p>');
  });

  it('[11b] el aviso nombra lo que la persona escribió, no su traducción', () => {
    const r = sanear('<b>x</b>', { etiquetas: ['p'], huecos: [], parse });
    expect(r.etiquetasFuera, 'decir «strong» cuando se escribió «b» confunde').toEqual(['b']);
  });
});

describe('[11] el punto fijo es a nivel de DOCUMENTO, no de texto', () => {
  /**
   * El único camino por el que la garantía se rompía de verdad, y sobrevivió a
   * 43 pruebas en verde: cada nodo de texto se sanea por separado, así que un
   * hueco **partido por una etiqueta que se desenvuelve** nunca se ve como
   * hueco — y al desenvolver, los trozos se juntan y aparece en la salida.
   */
  it('un hueco PARTIDO por una etiqueta que se va no se cuela entero', () => {
    const r = sanear('<p>Hola {{doc<b>umento</b>}} adiós</p>', {
      etiquetas: ['p'], huecos: ['sede'], parse,
    });
    expect(r.html, 'salía un hueco desconocido, entero y sin avisar').not.toContain('{{documento}}');
    expect(r.html).toBe('<p>Hola  adiós</p>');
    // Y se puede DECIR cuál era: antes `huecosFuera` salía vacío.
    expect(r.huecosFuera).toEqual(['documento']);
  });

  it('y con un hueco PERMITIDO partido, se recompone en vez de perderse', () => {
    const r = sanear('<p>{{se<b>de</b>}}</p>', { etiquetas: ['p'], huecos: ['sede'], parse });
    expect(r.html).toBe('<p>{{sede}}</p>');
  });

  it('el tope sale del CONTENIDO: diez capas anidadas convergen', () => {
    // Un tope fijo entregaba algo inestable —y sin avisar— en cuanto alguien
    // anidaba más capas que el tope.
    const hondo = `<p>${'{{ '.repeat(10)}documento${'}}'.repeat(10)}</p>`;
    const una = sanear(hondo, { etiquetas: ['p'], huecos: ['sede'], parse }).html;
    const dos = sanear(una, { etiquetas: ['p'], huecos: ['sede'], parse }).html;
    expect(dos).toBe(una);
  });

  it.each([
    '<p>Hola {{doc<b>umento</b>}} adiós</p>',
    '<p>{{ {{doc<i>umento</i>}}sede}}</p>',
    '<p><b>{{a</b>}}{{sede}}</p>',
  ])('y sigue siendo idempotente: %s', (html) => {
    const o = { etiquetas: ['p' as const], huecos: ['sede'], parse };
    const una = sanear(html, o).html;
    expect(sanear(una, o).html).toBe(una);
  });
});
