/**
 * EDITOR DE TEXTO · LO QUE SE PUEDE PROBAR SIN NAVEGADOR.
 *
 * jsdom no implementa `contenteditable`, ni la selección, ni `execCommand`. Lo
 * que se prueba aquí es lo que NO depende de eso y decide igual de:
 *
 *   · que la barra se dibuje DESDE `etiquetas` y no de un juego fijo
 *   · que pegar limpie EN EL MOMENTO, que es el camino por el que de verdad
 *     entra el contenido
 *   · que el tope cuente el HTML y no el texto visible
 *   · que lo retirado se DIGA
 *
 * La garantía entera vive en `sanear.test.ts`, que sí se prueba a conciencia.
 * Y las tres cosas que solo se ven pintando —que el `<strong>` salga sin
 * `class`, que la ficha no se pueda partir, y que un `h3` salga del mismo
 * cuerpo— están en «La entrega real» del catálogo, que es donde el
 * requerimiento pidió que estuvieran.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EditorTexto, type EtiquetaEditor } from '../src/EditorTexto';

const SIETE: EtiquetaEditor[] = ['p', 'strong', 'ul', 'li', 'hr', 'br', 'h3'];
const HUECOS = [
  { nombre: 'trabajador', rotulo: 'Trabajador', ejemplo: 'LEÓN TUYA, Mayori' },
  { nombre: 'sede', rotulo: 'Sede' },
];

beforeAll(() => {
  // jsdom no la trae. No se prueba lo que hace; se prueba lo que se le pasa.
  document.execCommand = vi.fn(() => true) as unknown as typeof document.execCommand;
});

/** Un pegado del navegador, con el portapapeles que se le diga. */
const pegar = (caja: Element, datos: Record<string, string>) => {
  const e = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(e, 'clipboardData', {
    value: { getData: (t: string) => datos[t] ?? '' },
  });
  fireEvent(caja, e);
  return e;
};

const pintar = (props: Partial<React.ComponentProps<typeof EditorTexto>> = {}) =>
  render(
    <EditorTexto
      etiqueta="Cuerpo"
      etiquetas={SIETE}
      huecos={HUECOS}
      valor="<p>Hola</p>"
      onCambio={() => {}}
      {...props}
    />,
  );

describe('la barra se dibuja DESDE la lista', () => {
  it('[3] los tres títulos tienen rótulos DISTINTOS', () => {
    // Un producto que pase `h2` y `h3` tenía dos botones llamados «Título» y
    // ninguna forma de saber cuál era cuál.
    pintar({ etiquetas: ['p', 'h2', 'h3', 'h4'] });
    const rotulos = ['Título', 'Subtítulo', 'Subtítulo menor'];
    for (const r of rotulos) expect(screen.getByRole('button', { name: r })).toBeInTheDocument();
    expect(new Set(rotulos).size).toBe(3);
  });

  it('[3] ofrece solo lo que está en `etiquetas`', () => {
    // Una etiqueta que el destino IGNORA es peor que una que rechaza, así que
    // no se ofrece un botón apagado: se ofrece lo que vale y nada más.
    pintar();
    expect(screen.getByRole('button', { name: 'Negrita' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lista' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subtítulo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Separador' })).toBeInTheDocument();
    // El icono `cursiva` EXISTE en el sistema y aun así no sale: la lista manda.
    expect(screen.queryByRole('button', { name: 'Cursiva' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Subrayado' })).toBeNull();
  });

  it('[2] con otra lista, otra barra — sin tocar el componente', () => {
    pintar({ etiquetas: ['p', 'em', 'ol', 'li'] });
    expect(screen.getByRole('button', { name: 'Cursiva' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lista numerada' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Negrita' })).toBeNull();
  });

  it('sin etiquetas con control, la barra solo lleva los huecos', () => {
    const { container } = pintar({ etiquetas: ['p', 'br'] });
    expect(container.querySelectorAll('.ed-barra .btn')).toHaveLength(HUECOS.length);
    expect(container.querySelector('.ed-sep')).toBeNull();
  });

  it('[15] es un `toolbar` de ARIA, para que el tabulador no pase por cada botón', () => {
    const { container } = pintar();
    expect(container.querySelector('.ed-barra')!.getAttribute('role')).toBe('toolbar');
  });
});

describe('los huecos', () => {
  it('hay un botón por hueco, con su rótulo', () => {
    pintar();
    expect(screen.getByRole('button', { name: 'Trabajador' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sede' })).toBeInTheDocument();
  });

  it('el ejemplo se ofrece, que es lo que evita tener que probar para saberlo', () => {
    pintar();
    expect(screen.getByRole('button', { name: 'Trabajador' }))
      .toHaveAttribute('title', 'Sale: LEÓN TUYA, Mayori');
  });

  it('[7] inserta el TEXTO LITERAL, no un marcado propio', async () => {
    // Un `<span data-hueco>` se rechazaría por el atributo, y ata el documento
    // al editor que lo escribió. El texto literal lo lee cualquier motor.
    const u = userEvent.setup();
    pintar();
    await u.click(screen.getByRole('button', { name: 'Sede' }));
    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, '{{sede}}');
  });

  it('los que hay en el texto se enumeran, y SOLO los permitidos', () => {
    // Sin filtrar contra la lista, esta línea enumeraba huecos que el propio
    // saneador retira: prometía lo contrario de lo que hace la pieza.
    const { container } = pintar({ valor: '<p>{{trabajador}} en {{sede}}</p>' });
    expect(container.querySelector('.ed-puestos')!.textContent)
      .toBe('Huecos en el texto: {{trabajador}} · {{sede}}');
  });

  it('[10] el contador cuenta puntos de código, como su hermano `AreaTexto`', () => {
    // En unidades UTF-16 un emoji cuenta dos, y `AreaTexto` cuenta puntos de
    // código. Dos componentes del mismo sistema no pueden contar distinto.
    const html = '<p>👨‍👩‍👧</p>';
    const { container } = pintar({ valor: html, maximo: 20 });
    expect(container.querySelector('.ta-cuenta')!.textContent)
      .toBe(`${20 - [...html].length} restantes`);
  });
});

describe('pegar, que es el camino por el que entra el contenido', () => {
  it('[9] limpia EN EL MOMENTO de pegar, no al guardar', () => {
    // Al guardar, quien escribe pierde lo pegado en el peor momento posible.
    const { container } = pintar();
    const caja = container.querySelector('.ed-texto')!;
    pegar(caja, {
      'text/html': '<p class="MsoNormal"><span style="font:Calibri">Hola <b>tú</b></span></p>',
    });
    const puesto = (document.execCommand as unknown as ReturnType<typeof vi.fn>).mock.calls
      .filter((c) => c[0] === 'insertHTML').pop();
    // El `<b>` de Word NO se pierde: se traduce a `<strong>`, que es lo que la
    // lista permite. Antes se desenvolvía y el formato desaparecía.
    expect(puesto![2]).toBe('<p>Hola <strong>tú</strong></p>');
  });

  it('[8] y lo dice: lo retirado no desaparece en silencio', () => {
    const { container } = pintar();
    pegar(container.querySelector('.ed-texto')!, {
      'text/html': '<div><font>Hola</font> {{documento}}</div>',
    });
    const aviso = container.querySelector('.ed-retirado')!;
    expect(aviso.textContent).toContain('div');
    expect(aviso.textContent).toContain('font');
    expect(aviso.textContent).toContain('{{documento}}');
    // Y para el lector, en una región viva.
    expect(container.querySelector('.sr-solo')!.getAttribute('role')).toBe('status');
  });

  it('[8] sin nada que pegar, NO se traga el contenido en silencio', () => {
    // Un RTF de Word, una imagen o un archivo: `getData` devuelve vacío las dos
    // veces. Impedir el pegado y no poner nada se lo traga EN SILENCIO, que es
    // justo lo que esta pieza viene a evitar. Se deja pasar y lo recoge el
    // `input` que viene detrás, donde sí se sanea.
    const { container } = pintar();
    const e = pegar(container.querySelector('.ed-texto')!, { 'text/rtf': '{\\rtf1}' });
    expect(e.defaultPrevented, 'se impidió el pegado y no se puso nada').toBe(false);
  });

  it('[8] sin portapapeles no revienta', () => {
    const { container } = pintar();
    const e = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'clipboardData', { value: null });
    expect(() => fireEvent(container.querySelector('.ed-texto')!, e)).not.toThrow();
  });

  it('el aviso dice de DÓNDE vino: no culpa a un pegado que no se hizo', () => {
    // Decía «Al pegar» viniera de donde viniera, así que quien abría un
    // documento viejo y escribía una letra veía desaparecer medio documento y
    // que le culparan de algo que no hizo.
    const { container } = pintar({ valor: '<p>a</p>' });
    const caja = container.querySelector('.ed-texto')!;
    caja.innerHTML = '<p>a <b>b</b> {{documento}}</p>';
    fireEvent.input(caja);
    expect(container.querySelector('.ed-retirado')!.textContent).toMatch(/^Del texto,/);
  });

  it('sin HTML en el portapapeles, el texto plano se escapa', () => {
    const { container } = pintar();
    pegar(container.querySelector('.ed-texto')!, { 'text/plain': '3 < 5 & 7' });
    const puesto = (document.execCommand as unknown as ReturnType<typeof vi.fn>).mock.calls
      .filter((c) => c[0] === 'insertHTML').pop();
    expect(puesto![2]).toBe('3 &lt; 5 &amp; 7');
  });

  it('se impide el pegado del navegador: si no, entra sin limpiar', () => {
    const { container } = pintar();
    const e = pegar(container.querySelector('.ed-texto')!, { 'text/plain': 'x' });
    expect(e.defaultPrevented).toBe(true);
  });
});

describe('el tope cuenta el HTML, no el texto visible', () => {
  it('[10] descuenta las etiquetas', () => {
    // Es lo que mide el saneador del otro lado. Contando lo visible, se avisa
    // tarde: un texto que se ve corto puede pasarse por el marcado.
    const html = '<p><strong>Hola</strong></p>';   // 28 caracteres, 4 visibles
    const { container } = pintar({ valor: html, maximo: 30 });
    expect(container.querySelector('.ta-cuenta')!.textContent).toBe(`${30 - html.length} restantes`);
  });

  it('[10] pasado el tope, lo dice y da error sin que el producto lo pida', () => {
    const { container } = pintar({ valor: '<p>0123456789</p>', maximo: 10 });
    const cuenta = container.querySelector('.ta-cuenta')!;
    expect(cuenta.className).toContain('ta-cuenta-mal');
    expect(cuenta.textContent).toBe('7 de más');
    expect(screen.getByText(/se pasa por 7 caracteres/)).toBeInTheDocument();
  });

  it('sin `maximo` no hay contador', () => {
    const { container } = pintar();
    expect(container.querySelector('.ta-cuenta')).toBeNull();
  });
});

describe('se compone, no se reconstruye', () => {
  it('el rótulo y el error los pone `Campo`, como en cualquier campo', () => {
    const { container } = pintar({ error: 'Hace falta el cuerpo.' });
    expect(container.querySelector('.campo-grupo')).not.toBeNull();
    expect(container.querySelector('.campo-etiqueta')!.textContent).toBe('Cuerpo');
    expect(container.querySelector('.campo-error')!.textContent).toContain('Hace falta el cuerpo.');
    expect(container.querySelector('.ed-mal')).not.toBeNull();
  });

  it('los botones de la barra son `Boton` del sistema', () => {
    const { container } = pintar();
    for (const b of container.querySelectorAll('.ed-barra button')) {
      expect(b.className).toContain('btn');
      expect(b.className).toContain('btn-mini');
    }
  });

  it('la caja es un `textbox` multilínea, y `Campo` le ata el rótulo para el FOCO', () => {
    // El `for` lleva el foco al pulsar el rótulo. NO nombra: eso es `[14]`.
    const { container } = pintar();
    const caja = container.querySelector('.ed-texto')!;
    expect(caja.getAttribute('role')).toBe('textbox');
    expect(caja.getAttribute('aria-multiline')).toBe('true');
    expect(caja.getAttribute('id')).toBe(container.querySelector('.campo-etiqueta')!.getAttribute('for'));
  });
});

describe('lo que ENTRA también se sanea', () => {
  it('[1] un `valor` sucio no llega a la caja, y se avisa al padre', () => {
    // La invariante cubría la SALIDA y la entrada no tenía guarda: un valor
    // guardado por otra versión, por otro editor o a mano entraba CRUDO. En un
    // navegador de verdad, un `<img onerror>` se ejecuta al asignar innerHTML.
    const onCambio = vi.fn();
    const { container } = pintar({
      valor: '<p class="x" onclick="alert(1)">Hola</p><script>window.X=1</script><div>otro</div>',
      onCambio,
    });
    const caja = container.querySelector('.ed-texto')!;
    expect(caja.innerHTML).toBe('<p>Hola</p>otro');
    expect(caja.querySelector('script')).toBeNull();
    expect(caja.querySelector('[onclick]')).toBeNull();
    // Y se avisa, para que los dos converjan en vez de discrepar en silencio.
    expect(onCambio).toHaveBeenCalledWith('<p>Hola</p>otro');
  });

  it('[1] si el valor ya está limpio, no se avisa de nada', () => {
    const onCambio = vi.fn();
    pintar({ valor: '<p>Hola</p>', onCambio });
    expect(onCambio).not.toHaveBeenCalled();
  });
});

describe('la caja tiene NOMBRE accesible', () => {
  it('[14] un `<label for>` no nombra a un `div[role=textbox]`', () => {
    // Este sistema lo tiene escrito dos veces —en `Interruptor` y en
    // `RangoFecha`— y aun así se incumplió: HTML-AAM no calcula el nombre de un
    // elemento NO etiquetable desde un `<label for>`.
    pintar();
    expect(screen.getByRole('textbox', { name: 'Cuerpo' })).toBeInTheDocument();
  });
});

describe('la barra es un toolbar DE VERDAD', () => {
  it('[15] una sola parada de tabulador, y las flechas recorren', async () => {
    // `role="toolbar"` solo no hace nada: el patrón lo implementa quien lo
    // escribe. La primera versión afirmaba las flechas y no tenía ninguna, así
    // que con cuatro etiquetas y cuatro huecos eran OCHO tabulaciones antes de
    // llegar al texto.
    const u = userEvent.setup();
    const { container } = pintar();
    const botones = [...container.querySelectorAll('.ed-barra button')] as HTMLElement[];
    expect(botones.map((b) => b.getAttribute('tabindex')))
      .toEqual(['0', ...botones.slice(1).map(() => '-1')]);

    botones[0].focus();
    await u.keyboard('{ArrowRight}');
    expect(botones[1]).toHaveFocus();
    await u.keyboard('{End}');
    expect(botones[botones.length - 1]).toHaveFocus();
    await u.keyboard('{ArrowRight}');
    expect(botones[0], 'el recorrido da la vuelta').toHaveFocus();
  });
});

describe('lo que el destino no puede prometer, no se pinta', () => {
  it('[13] la hoja entregada da al `h3` del editor el MISMO cuerpo que al texto', () => {
    // Un `h3` a 24px estaría enseñando algo que el papel no va a hacer. Este
    // editor enseña ESTRUCTURA, no apariencia final — la apariencia final la
    // decide un destino que el componente no conoce.
    const css = readFileSync(
      resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'), 'utf8',
    );
    const regla = /\.ed-texto h2, \.ed-texto h3, \.ed-texto h4\s*\{([^}]*)\}/.exec(css);
    expect(regla, 'la hoja no fija el cuerpo de los títulos del editor').not.toBeNull();
    const cuerpoTexto = /\.ed-texto\s*\{([^}]*)\}/.exec(css)![1];
    const px = (t: string) => /font-size:\s*(\d+)px/.exec(t)?.[1];
    expect(px(regla![1]), 'el título del editor no mide lo mismo que el texto')
      .toBe(px(cuerpoTexto));
    // Se distingue por PESO, que es lo que hace el destino.
    expect(regla![1]).toMatch(/font-weight:\s*[56]00/);
  });
});

describe('cuatro que se colaron y no se ven leyendo', () => {
  it('[12] el `beforeinput` se escucha NATIVO: React no conecta el del navegador', () => {
    // React 18 no mapea el `beforeinput` del DOM a su `onBeforeInput` —la suya
    // viene de la composición de texto—, así que el manejador NO CORRÍA y la
    // ficha se partía igual. Es la segunda vez que esta pieza «construye» algo
    // que no se ejecuta, y por eso esto se fija aquí.
    const onCambio = vi.fn();
    const { container } = pintar({ valor: '<p>{{sede}}</p>', onCambio });
    const caja = container.querySelector('.ed-texto') as HTMLElement;
    const texto = caja.querySelector('p')!.firstChild!;

    const sel = document.getSelection()!;
    const r = document.createRange();
    r.setStart(texto, 8);          // justo detrás de `{{sede}}`
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);

    const e = new Event('beforeinput', { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'inputType', { value: 'deleteContentBackward' });
    caja.dispatchEvent(e);

    expect(e.defaultPrevented, 'el manejador nativo no llegó a correr').toBe(true);
    expect(caja.textContent, 'quedó `{{sede}` en vez de irse entero').toBe('');
  });

  it('[15] con CERO mandos la barra sale vacía y no revienta', () => {
    // `etiquetas: ['p']` y sin huecos. El `Math.max(1, …)` del roving está
    // puesto porque `% 0` da NaN, pero **esta prueba no lo cubre y se dice**:
    // sin botones no hay nada que enfocar, así que el NaN no llega al DOM y
    // quitando la guarda esto sigue en verde. Se comprobó. La guarda se queda
    // porque el cálculo es incorrecto igual; lo que no se hace es fingir que
    // una prueba la protege.
    const { container } = pintar({ etiquetas: ['p'], huecos: [] });
    expect(container.querySelectorAll('.ed-barra button')).toHaveLength(0);
    expect(container.querySelector('.ed-texto')).not.toBeNull();
  });

  it('[1] el efecto NO se dispara por un `onCambio` nuevo en cada render', () => {
    // Este efecto toca `innerHTML`, así que dispararse de más se lleva por
    // delante el cursor y la pila de deshacer. `onCambio` casi siempre es una
    // lambda en línea: como dependencia, se disparaba en CADA render.
    const { container, rerender } = render(
      <EditorTexto etiqueta="C" etiquetas={SIETE} valor="<p>a</p>" onCambio={() => {}} />,
    );
    const caja = container.querySelector('.ed-texto')!;
    caja.innerHTML = '<p>a<!--marca--></p>';   // marca que un reescrito borraría
    rerender(
      <EditorTexto etiqueta="C" etiquetas={SIETE} valor="<p>a</p>" onCambio={() => {}} />,
    );
    expect(caja.innerHTML, 'el efecto reescribió la caja sin que cambiara nada')
      .toContain('marca');
  });

  it('[9] el texto plano multilínea conserva los saltos', () => {
    // Perderlos convertía tres párrafos pegados en un churro de una línea.
    const { container } = pintar();
    const e = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'clipboardData', {
      value: { getData: (t: string) => (t === 'text/plain' ? 'uno\ndos\ntres' : '') },
    });
    fireEvent(container.querySelector('.ed-texto')!, e);
    const puesto = (document.execCommand as unknown as ReturnType<typeof vi.fn>).mock.calls
      .filter((c) => c[0] === 'insertHTML').pop();
    expect(puesto![2]).toBe('uno<br>dos<br>tres');
  });
});

describe('lo que la segunda auditoría dejó al descubierto', () => {
  it('[8] abrir un documento sucio NO retira en silencio', () => {
    // Este camino saneaba y avisaba al padre, pero no decía nada a quien mira:
    // abrir un documento viejo borraba medio texto sin una palabra, que es
    // literalmente lo que la regla 8 dice que la pieza existe para impedir.
    const { container } = pintar({
      valor: '<div><font>Hola</font> {{documento}} y {{Sede}}</div>',
      onCambio: () => {},
    });
    const aviso = container.querySelector('.ed-retirado')!;
    expect(aviso, 'no dijo nada').not.toBeNull();
    expect(aviso.textContent).toMatch(/^Al abrir,/);
    expect(aviso.textContent).toContain('div');
    expect(aviso.textContent).toContain('{{documento}}');
  });

  it('[10] el contador y los huecos salen de lo SANEADO, no del valor crudo', () => {
    // 65 caracteres de HTML sucio que entregan 11. Decía «45 de más» con un
    // tope de 20 sobre un documento que cabe de sobra.
    const { container } = pintar({
      valor: '<p class="MsoNormal" style="mso-pagination:widow-orphan">Hola</p>',
      maximo: 20,
    });
    expect(container.querySelector('.ta-cuenta')!.textContent).toBe('9 restantes');
    expect(container.querySelector('.campo-error')).toBeNull();
  });

  it('[10] y un hueco dentro de un ATRIBUTO no se enumera', () => {
    const { container } = pintar({ valor: '<p title="{{sede}}">Hola</p>' });
    expect(container.querySelector('.ed-puestos')).toBeNull();
  });

  it('[9] si `insertHTML` falla, el pegado NO se traga en silencio', () => {
    const fallo = vi.fn(() => false) as unknown as typeof document.execCommand;
    const antes = document.execCommand;
    document.execCommand = fallo;
    try {
      const { container } = pintar();
      const e = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(e, 'clipboardData', { value: { getData: () => 'Hola' } });
      fireEvent(container.querySelector('.ed-texto')!, e);
      expect(container.querySelector('.ed-retirado')!.textContent)
        .toMatch(/no se pudo pegar/i);
    } finally {
      document.execCommand = antes;
    }
  });

  it('[9] lo que entra por el pegado del navegador se reporta COMO pegado', () => {
    /* El camino que deja pasar el pegado del navegador lo recoge `emitir`, que
       marcaba «Del texto»: el defecto inverso del que se acababa de arreglar.

       ESTA PRUEBA NO PROBABA ESO. Su única aserción era que `.ed-retirado`
       fuese `null` —porque `<b>`→`<strong>` no retira nada—, así que quitando
       entero el mecanismo que nombra seguía en verde. Lo cazó una auditoría el
       2026-09-13. Ahora se pega algo que SÍ se retira y se lee el prefijo. */
    const { container } = pintar({ valor: '<p>a</p>' });
    const caja = container.querySelector('.ed-texto')!;
    const e = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'clipboardData', { value: { getData: () => '' } });
    fireEvent(caja, e);
    caja.innerHTML = '<p>a <font>b</font></p>';
    fireEvent.input(caja);
    expect(container.querySelector('.ed-retirado')!.textContent).toMatch(/^Al pegar,/);
  });

  it('[9] la marca del pegado CADUCA: no culpa a un pegado que ya pasó', async () => {
    /* Si el pegado del navegador no inserta nada —portapapeles con solo un
       archivo— no llega ningún `input`, y la marca se quedaba puesta para
       siempre: la siguiente tecla que retirara algo se anunciaba «Al pegar». */
    const { container } = pintar({ valor: '<p>a</p>' });
    const caja = container.querySelector('.ed-texto')!;
    const e = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'clipboardData', { value: { getData: () => '' } });
    fireEvent(caja, e);
    await new Promise((r) => { setTimeout(r, 0); });
    caja.innerHTML = '<p>a <font>b</font></p>';
    fireEvent.input(caja);
    expect(container.querySelector('.ed-retirado')!.textContent).toMatch(/^Del texto,/);
  });

  it('[8] el aviso SOBREVIVE al `input` que el navegador despacha tras pegar', () => {
    /* `execCommand` inserta y el navegador despacha un `input` detrás. Ese
       `input` volvía a mirar una caja YA limpia y borraba el aviso en el mismo
       cuadro: la función entera era decorativa. Es la segunda vez que este
       modo de fallo aparece en esta pieza. */
    const { container } = pintar();
    const caja = container.querySelector('.ed-texto')!;
    pegar(caja, { 'text/html': '<div><font>Hola</font></div>' });
    expect(container.querySelector('.ed-retirado'), 'el aviso no llegó a salir').not.toBeNull();
    // Lo que hace el navegador de verdad: insertar y avisar.
    caja.innerHTML = '<p>Hola</p>';
    fireEvent.input(caja);
    expect(container.querySelector('.ed-retirado')!.textContent).toMatch(/^Al pegar,/);
  });

  it('[8] el aviso SOBREVIVE a salir de la caja para pulsar la barra', () => {
    // Pulsar un botón de la barra desenfoca la caja primero, así que el gesto
    // natural de reaccionar al aviso lo destruía.
    const { container } = pintar({ valor: '<div><font>Hola</font> {{documento}}</div>' });
    const caja = container.querySelector('.ed-texto')!;
    expect(container.querySelector('.ed-retirado')!.textContent).toMatch(/^Al abrir,/);
    fireEvent.blur(caja);
    expect(container.querySelector('.ed-retirado')!.textContent).toMatch(/^Al abrir,/);
  });

  it('[8] y se calla también cuando el PADRE cambia el documento', () => {
    /* El modo de fallo INVERSO al que `sobre` vino a cerrar, y quedó abierto:
       el efecto de `valor` solo tocaba el aviso cuando había algo que retirar,
       así que cargar otro documento limpio dejaba en pantalla «Al abrir, se
       quitó el formato que no se admite (div, font)…» hablando de un contenido
       que ya no existe. Lo midió una auditoría sobre el arreglo anterior. */
    const { container, rerender } = pintar({ valor: '<div><font>Viejo</font> {{documento}}</div>' });
    expect(container.querySelector('.ed-retirado')!.textContent).toMatch(/^Al abrir,/);
    rerender(
      <EditorTexto etiqueta="Cuerpo" etiquetas={SIETE} huecos={HUECOS}
        valor="<p>Otro documento, totalmente limpio</p>" onCambio={() => {}} />,
    );
    expect(container.querySelector('.ed-retirado'), 'el aviso habla de un documento que ya no está').toBeNull();
  });

  it('[8] y al vaciarlo desde el padre, tampoco queda hablando solo', () => {
    const { container, rerender } = pintar({ valor: '<div>Viejo</div>' });
    expect(container.querySelector('.ed-retirado')).not.toBeNull();
    rerender(
      <EditorTexto etiqueta="Cuerpo" etiquetas={SIETE} huecos={HUECOS}
        valor="" onCambio={() => {}} />,
    );
    expect(container.querySelector('.ed-retirado')).toBeNull();
  });

  it('[8] el LECTOR oye TAMBIÉN de dónde vino, no solo qué se quitó', () => {
    /* La región viva decía «se quitó el formato…» —en minúscula, detrás de un
       punto— sin el prefijo: quien usa lector no se enteraba de si fue al
       pegar, al abrir o al escribir. El arreglo se había aplicado a la vista y
       no al anuncio. */
    const { container } = pintar({ valor: '<div>Viejo</div>', maximo: 3 });
    const viva = container.querySelector('.sr-solo')!.textContent!;
    expect(viva).toContain('Te pasas por');
    expect(viva).toContain('Al abrir, se quitó el formato');
  });

  it('[8] pero se calla en cuanto el contenido ya no es aquél', () => {
    const { container } = pintar({ valor: '<div>Hola</div>' });
    const caja = container.querySelector('.ed-texto')!;
    expect(container.querySelector('.ed-retirado')).not.toBeNull();
    caja.innerHTML = '<p>Hola, y sigo escribiendo</p>';
    fireEvent.input(caja);
    expect(container.querySelector('.ed-retirado')).toBeNull();
  });

  it('[16] se renderiza en SERVIDOR: sin `DOMParser` no revienta', () => {
    /* `DOMParser` no existe en Node. El saneo corría en el render, así que
       cualquier producto con renderizado de servidor moría con
       `ReferenceError: DOMParser is not defined` y la página entera no se
       pintaba. Ninguna prueba podía verlo porque jsdom SÍ lo tiene: aquí se le
       quita a propósito, que es lo que un servidor de verdad hace. */
    const guardado = globalThis.DOMParser;
    // @ts-expect-error se quita a proposito, como en Node
    delete globalThis.DOMParser;
    try {
      expect(() => renderToStaticMarkup(
        <EditorTexto etiqueta="Cuerpo" etiquetas={SIETE} huecos={HUECOS} maximo={2500}
          valor="<p>Hola <b>tú</b></p>" onCambio={() => {}} />,
      )).not.toThrow();
    } finally {
      globalThis.DOMParser = guardado;
    }
  });

  it('[16] y el servidor y el primer render del cliente emiten LO MISMO', () => {
    /* Si no, React avisa de desfase de hidratación y vuelve a pintar el árbol
       entero en el cliente. La primera versión de esta prueba NO pintaba el
       cliente: solo miraba que el HTML del servidor no trajera el contador, así
       que la mitad de la regla —la que da el motivo— se quedaba sin respaldo.
       Lo cazó una auditoría el 2026-09-13, y es el mismo modo de fallo que esta
       misma entrega cuenta haber cazado en la prueba `[9]`. */
    const props = {
      etiqueta: 'Cuerpo', etiquetas: SIETE, huecos: HUECOS, maximo: 2500,
      valor: '<p>Hola</p>', onCambio: () => {},
    };
    const guardado = globalThis.DOMParser;
    // @ts-expect-error se quita a proposito, como en Node
    delete globalThis.DOMParser;
    let servidor = '';
    try {
      servidor = renderToStaticMarkup(<EditorTexto {...props} />);
    } finally {
      globalThis.DOMParser = guardado;
    }
    /* EL PRIMER RENDER DEL CLIENTE, ANTES DE QUE CORRAN LOS EFECTOS: es
       exactamente lo que React compara contra el HTML del servidor al hidratar.
       `flushSync` vacía el trabajo síncrono y deja los `useEffect` para después,
       que es donde `montado` se pone a cierto.

       SE COMPARA EL MARCADO, y no se confía en `onRecoverableError`: se probó
       con un desfase metido a propósito y **no avisaba**, así que una prueba
       montada sobre eso no podía fallar. Los identificadores se normalizan
       porque `useId` numera distinto en las dos vías —`:R0:` y `:r0:`— y React
       los casa por posición, no por texto. */
    const raiz = document.createElement('div');
    document.body.appendChild(raiz);
    const arbol = createRoot(raiz);
    flushSync(() => { arbol.render(<EditorTexto {...props} />); });
    const cliente = raiz.innerHTML;
    const normal = (h: string) => h.replace(/:[Rr][0-9a-z]*:/g, 'ID').replace(/<!--[\s\S]*?-->/g, '');
    expect(normal(cliente), 'el servidor y el cliente no emiten lo mismo').toBe(normal(servidor));
    // Y ninguno de los dos trae lo que depende del contenido de la caja.
    expect(servidor).not.toContain('ta-cuenta');
    expect(servidor).not.toContain('ed-puestos');
    act(() => { arbol.unmount(); });
    raiz.remove();
  });

  it('[10] el LECTOR oye el tope AUNQUE algo se haya retirado', () => {
    /* Encadenados con `||`, el anuncio del contador quedaba el último y se
       callaba en cuanto algo se retiraba: quien usa lector no se enteraba de
       que el documento no se puede guardar. Es justo el defecto que
       `interno/contador.tsx` dice haberse extraído para impedir. */
    const { container } = pintar({ valor: '<div>0123456789</div>', maximo: 5 });
    const viva = container.querySelector('.sr-solo')!.textContent!;
    expect(viva, 'no dice el tope').toContain('Te pasas por 5');
    expect(viva, 'no dice lo retirado').toContain('div');
  });

  it('[7] un hueco que sale DOS veces se enumera UNA', () => {
    const { container } = pintar({ valor: '<p>{{sede}} y {{sede}}</p>' });
    expect(container.querySelector('.ed-puestos')!.textContent)
      .toBe('Huecos en el texto: {{sede}}');
  });

  it('[12] el borrado de LÍNEA se deja pasar: no puede partir una ficha', () => {
    /* Metido en el mismo saco que el de carácter, el manejador borraba solo la
       ficha y cancelaba el resto: quien pulsaba Cmd+Retroceso esperando vaciar
       la línea se quedaba con «Hola ». Una línea entera se lleva sus huecos
       enteros, así que aquí no hay nada que proteger. */
    const { container } = pintar({ valor: '<p>Hola {{sede}}</p>' });
    const caja = container.querySelector('.ed-texto')!;
    const texto = caja.querySelector('p')!.firstChild!;
    const sel = document.getSelection()!;
    const r = document.createRange();
    r.setStart(texto, 13); r.setEnd(texto, 13);
    sel.removeAllRanges(); sel.addRange(r);
    const e = new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'deleteSoftLineBackward' });
    caja.dispatchEvent(e);
    expect(e.defaultPrevented, 'se interceptó el borrado de línea').toBe(false);
    expect(caja.textContent, 'se borró la ficha por su cuenta').toBe('Hola {{sede}}');
  });

  it('[8] con UN hueco retirado y ninguna etiqueta, la frase no empieza por «y»', () => {
    const { container } = pintar({ valor: '<p>{{documento}}</p>' });
    expect(container.querySelector('.ed-retirado')!.textContent)
      .toBe('Al abrir, el hueco {{documento}}, que no existe.');
  });

  it('[12] el borrado de PALABRA también respeta la ficha', () => {
    // Es el gesto de barrido del teclado del teléfono, que la regla decía
    // cubrir mirando solo `deleteContentBackward`.
    const { container } = pintar({ valor: '<p>{{sede}}</p>' });
    const caja = container.querySelector('.ed-texto') as HTMLElement;
    const texto = caja.querySelector('p')!.firstChild!;
    const sel = document.getSelection()!;
    const r = document.createRange();
    r.setStart(texto, 8); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);

    const e = new Event('beforeinput', { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'inputType', { value: 'deleteWordBackward' });
    caja.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(caja.textContent).toBe('');
  });

  it('[15] sin mandos NO se pinta un `toolbar` vacío con nombre', () => {
    const { container } = pintar({ etiquetas: ['p'], huecos: [] });
    expect(container.querySelector('.ed-barra')).toBeNull();
  });

  it('el pie es el MISMO que el de `AreaTexto`, no una copia', () => {
    // Estaban duplicados y ya habían divergido: el editor pintaba `.ta-pie`
    // con `ayuda` y sin `maximo`, y no copió el anuncio al lector.
    const { container } = pintar({ ayuda: 'Una ayuda' });
    expect(container.querySelector('.ta-pie'), 'pie de dos columnas con un solo hijo').toBeNull();
  });

  it('pasado el tope, el LECTOR se entera', () => {
    const { container } = pintar({ valor: '<p>0123456789</p>', maximo: 10 });
    expect(container.querySelector('.sr-solo')!.textContent!.trim()).toBe('Te pasas por 7');
  });
});
