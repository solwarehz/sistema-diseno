/**
 * EDITOR DE TEXTO CON HUECOS
 *
 * `AreaTexto` es texto plano. Esto es lo que hace falta cuando el texto viaja a
 * otro formato —un PDF, una impresora, un correo— y por el camino hay un
 * saneador que admite muchísimo menos de lo que un editor de navegador emite.
 *
 * LA PIEZA NO ES UN EDITOR: ES LA GARANTÍA. Lo dijo quien la pidió mejor que
 * nosotros: «lo que el editor ofrece de más se guarda sin error y desaparece en
 * el destino». Y lo que se garantiza es una sola frase:
 *
 *   Lo que llega a `onCambio` SIEMPRE está dentro de `etiquetas` y `huecos`,
 *   venga de teclear, de pegar, de arrastrar o de deshacer.
 *
 * POR ESO LAS TRES LISTAS ENTRAN DESDE FUERA, y no es configurabilidad por
 * gusto. Tres motivos, los tres vividos por quien lo pidió:
 *
 *   1. La lista cambia sin que este sistema publique. Retiraron tres huecos un
 *      martes porque salían impresos como «[falta jornada]»; si la lista
 *      viviera aquí, eso habría sido una versión nuestra.
 *   2. Cada producto admite cosas distintas. Uno no tiene cursiva porque su
 *      destino embebe dos fuentes; otro puede tener cursiva y no listas.
 *   3. Este componente NO DEBE SABER qué hay al otro lado. Ni PDF, ni
 *      impresora, ni correo. Solo el conjunto que le dan.
 *
 * LA BARRA SE DIBUJA DESDE `etiquetas`, no es un juego fijo con botones
 * apagados. Y es una consecuencia directa de lo anterior: una etiqueta que el
 * destino IGNORA es peor que una que rechaza — rechazada, quien escribe se
 * entera; ignorada, guarda sin error y lo descubre cuando ya firmó el papel.
 * Ofrecer un botón apagado es prometer que algún día valdrá.
 *
 * NO SE PINTA LO QUE EL DESTINO NO PUEDE PROMETER. Un `h3` no sale a 24px aquí
 * dentro: sale en negrita, del mismo cuerpo. Este editor enseña ESTRUCTURA, no
 * apariencia final, porque la apariencia final la decide un destino que este
 * componente no conoce. Pintar una jerarquía visual que el papel no tiene es la
 * misma mentira que ofrecer una etiqueta que se ignora.
 *
 * SIN LIBRERÍA, y §9.4 solo la admite para diálogo, menú y selector con
 * búsqueda. Aquí además sería contraproducente: ninguna librería conoce la
 * lista del producto, así que la invariante habría que montarla igual encima.
 *
 * LO QUE NO SE PUEDE PROBAR SIN NAVEGADOR, y se dice: `contenteditable`, la
 * selección y `execCommand` no existen en jsdom. Lo que sí se prueba —entero y
 * a conciencia— es `interno/sanear.ts`, que es donde vive la garantía. El resto
 * es superficie, y para eso está la página del catálogo y «La entrega real».
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Campo } from './Campo';
import { Boton } from './Boton';
import { Icono } from './Icono';
import { sanear, huecosDe, tramoDeHueco, escapar, type EtiquetaEditor } from './interno/sanear';
import { usarContador } from './interno/contador';

export type { EtiquetaEditor };

export type HuecoEditor = {
  /** El nombre que va entre llaves: `trabajador` → `{{trabajador}}`. */
  nombre: string;
  /** Cómo se llama para quien escribe. Sin esto se enseña el nombre crudo. */
  rotulo?: string;
  /** Qué sale en su sitio. Es lo que evita tener que probar para saberlo. */
  ejemplo?: string;
};

export type EditorTextoProps = {
  etiqueta: string;
  /** Las etiquetas que se pueden emitir. **Cerrada.** */
  etiquetas: readonly EtiquetaEditor[];
  /** Los marcadores que se pueden insertar. **Cerrada.** */
  huecos?: readonly HuecoEditor[];
  /** Tope de caracteres **del HTML**, no del texto visible. Ver abajo. */
  maximo?: number;
  valor: string;
  onCambio: (html: string) => void;
  ayuda?: React.ReactNode;
  error?: string;
  etiquetaOculta?: boolean;
  className?: string;
};

/** Qué botón ofrece cada etiqueta. Lo que no está aquí no tiene control. */
const CONTROLES: Partial<Record<EtiquetaEditor, {
  rotulo: string; icono?: 'negrita' | 'cursiva' | 'lista'; orden: string; valor?: string;
}>> = {
  strong: { rotulo: 'Negrita', icono: 'negrita', orden: 'bold' },
  em: { rotulo: 'Cursiva', icono: 'cursiva', orden: 'italic' },
  u: { rotulo: 'Subrayado', orden: 'underline' },
  ul: { rotulo: 'Lista', icono: 'lista', orden: 'insertUnorderedList' },
  ol: { rotulo: 'Lista numerada', orden: 'insertOrderedList' },
  /* Tres rótulos DISTINTOS: un producto que pase `h2` y `h3` tenía dos
     botones llamados «Título» y ninguna forma de saber cuál era cuál. */
  h2: { rotulo: 'Título', orden: 'formatBlock', valor: 'h2' },
  h3: { rotulo: 'Subtítulo', orden: 'formatBlock', valor: 'h3' },
  h4: { rotulo: 'Subtítulo menor', orden: 'formatBlock', valor: 'h4' },
  hr: { rotulo: 'Separador', orden: 'insertHorizontalRule' },
};
/** El orden de la barra es fijo; lo que cambia es QUÉ aparece en ella. */
const ORDEN_BARRA: EtiquetaEditor[] = ['strong', 'em', 'u', 'h2', 'h3', 'h4', 'ul', 'ol', 'hr'];

/* Constante de modulo y no `= []` en la firma: un literal en el valor por
   omision es un array NUEVO en cada render, asi que todo lo que dependiera de
   el —el saneador memorizado, y con el el efecto que reescribe `innerHTML`—
   se recreaba siempre. El efecto se llevaba por delante el cursor y la pila de
   deshacer en cada pulsacion de la pantalla. */
const SIN_HUECOS: readonly HuecoEditor[] = [];

/* Lo que vale el saneo ANTES de que haya DOM. No es «vacio»: es «todavia no se
   sabe», y por eso no se pinta nada derivado de el. */
const SIN_SANEAR = { html: '', etiquetasFuera: [] as string[], huecosFuera: [] as string[] };

/** De donde vino lo que se retiro. El aviso lo dice, porque no es lo mismo. */
type OrigenRetiro = 'pegar' | 'texto' | 'abrir' | 'fallo';

export function EditorTexto({
  etiqueta, etiquetas, huecos = SIN_HUECOS, maximo,
  valor, onCambio, ayuda, error, etiquetaOculta, className = '',
}: EditorTextoProps) {
  const caja = useRef<HTMLDivElement>(null);
  /**
   * LO QUE SE RETIRO, Y **DE QUE CONTENIDO** SE DIJO.
   *
   * `sobre` no es adorno: sin el, el aviso se borraba solo. Cualquier paso que
   * no retire nada —el `input` que el navegador despacha DESPUES de
   * `execCommand`, o el `blur` de pulsar un boton de la barra— volvia a mirar
   * una caja ya limpia y pisaba el aviso con vacio. Pulsar la barra desenfoca
   * la caja primero, asi que **el gesto natural de reaccionar al aviso lo
   * destruia**. Ahora un paso que no retira nada solo calla el aviso si el
   * contenido YA NO ES EL MISMO del que hablaba.
   */
  const [retirado, setRetirado] = useState<{
    etiquetas: string[]; huecos: string[]; de: OrigenRetiro; sobre: string;
  }>({ etiquetas: [], huecos: [], de: 'texto', sobre: '' });

  /**
   * NO HAY DOM HASTA QUE ESTO MONTA, y el componente no puede fingir que si.
   *
   * `DOMParser` NO EXISTE EN NODE. El saneo corria dentro de un `useMemo`, o
   * sea EN EL RENDER, asi que cualquier producto con renderizado de servidor
   * —Next, Remix— reventaba con `ReferenceError: DOMParser is not defined` y
   * la pagina entera no se pintaba. Lo cazo una auditoria el 2026-09-13 al
   * intentar un `renderToStaticMarkup`; ninguna prueba podia verlo porque
   * jsdom SI tiene `DOMParser`.
   *
   * Se resuelve con una regla entera y no con un parche: **nada que dependa
   * del contenido de la caja se pinta hasta que la caja existe**. El texto ya
   * era asi —lo escribe un efecto por `innerHTML`, no React—, asi que ahora el
   * contador y la lista de huecos siguen la misma regla. El servidor y el
   * primer render del cliente emiten LO MISMO, que es lo que evita el desfase
   * de hidratacion.
   */
  const [montado, setMontado] = useState(false);
  useEffect(() => { setMontado(true); }, []);

  const nombresHueco = useMemo(() => huecos.map((h) => h.nombre), [huecos]);
  /** Marca que lo siguiente que llegue por `input` vino de un pegado. */
  const vinoDePegar = useRef(false);
  const caducaPegado = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * LA MARCA CADUCA, y hace falta que caduque.
   *
   * Solo la borraba `emitir`. Si el pegado del navegador no inserta nada
   * —portapapeles con solo un archivo, o un formato que descarta— no llega
   * ningun `input`, la marca se quedaba puesta PARA SIEMPRE, y la siguiente
   * tecla que retirara algo se anunciaba como «Al pegar». Es el defecto
   * inverso del que este mismo `ref` vino a arreglar.
   *
   * El `input` del pegado llega en la MISMA tarea que el evento, asi que este
   * temporizador corre despues: solo se cumple cuando de verdad no hubo nada.
   */
  const marcarPegado = () => {
    vinoDePegar.current = true;
    if (caducaPegado.current) clearTimeout(caducaPegado.current);
    caducaPegado.current = setTimeout(() => { vinoDePegar.current = false; }, 0);
  };
  useEffect(() => () => { if (caducaPegado.current) clearTimeout(caducaPegado.current); }, []);
  const avisar = useRef(onCambio);
  avisar.current = onCambio;

  /**
   * Sanea contra las listas de ESTE editor. Un solo sitio, un solo criterio.
   *
   * Las dependencias son el CONTENIDO de las listas y no su identidad: con
   * `etiquetas={['p','strong']}` en línea —que es como el propio catálogo lo
   * enseña— el array es nuevo en cada render, así que `limpiar` se recreaba
   * siempre y con él se disparaba el efecto que reescribe `innerHTML`. Medido:
   * seis renders del padre, seis parseos del documento entero, y el cursor de
   * vuelta al principio cada vez.
   */
  const firma = `${[...etiquetas].join(',')}|${nombresHueco.join(',')}`;
  const limpiar = useMemo(() => (html: string) => sanear(html, {
    etiquetas,
    huecos: nombresHueco,
    parse: (t) => new DOMParser().parseFromString(`<body>${t}</body>`, 'text/html').body,
    /* `firma` Y NO LAS LISTAS: la dependencia es el CONTENIDO de `etiquetas` y
       `huecos`, no su identidad. En línea —que es como lo enseña el catálogo—
       el array es nuevo en cada render.
       SIN `eslint-disable`: el proyecto NO carga `eslint-plugin-react-hooks`,
       así que el comentario que había aquí era un error de ESLint («Definition
       for rule … was not found»), no un silenciador. Un silenciador de una
       regla que no existe es ruido que además rompe el lint. */
  }), [firma]);

  /**
   * EL VALOR SANEADO, calculado UNA vez por cambio. Todo lo que se pinta sale
   * de aquí y no de `valor` crudo: el contador y la lista de huecos se
   * calculaban sobre el HTML de entrada, así que un `<p class="MsoNormal"
   * style="…">Hola</p>` de 65 caracteres decía «45 de más» con un tope de 20
   * cuando lo que se va a entregar mide 11 y cabe de sobra. Y `.ed-puestos`
   * enumeraba un `{{sede}}` que vivía dentro de un atributo.
   */
  const saneado = useMemo(() => (montado ? limpiar(valor) : SIN_SANEAR), [valor, limpiar, montado]);

  /**
   * El valor MANDA sobre lo que hay en la caja, pero solo cuando difieren: si
   * se reescribiera en cada pulsación, el cursor saltaría al principio en cada
   * letra. Es el defecto clásico de un `contenteditable` controlado.
   */
  useEffect(() => {
    const nodo = caja.current;
    // Sin DOM no hay saneo, y sin saneo este efecto avisaria al padre de que su
    // documento «quedo vacio». Se espera a que monte.
    if (!nodo || !montado) return;
    /**
     * EL VALOR QUE ENTRA TAMBIÉN SE SANEA, y no lo hacía.
     *
     * La invariante cubría la SALIDA y la entrada no tenía ninguna guarda: un
     * `valor` guardado por una versión anterior —o por otro editor, o a mano—
     * se metía CRUDO en la caja. Lo midió una auditoría el 2026-09-13 con un
     * `<img onerror>`, que en un navegador de verdad **se ejecuta** al asignar
     * `innerHTML`. Y encadenaba: el editor mostraba marcado que jura no emitir,
     * el contador lo contaba, y si nadie tecleaba el producto lo REGUARDABA.
     *
     * Si el saneo cambió algo se avisa al padre, para que los dos converjan en
     * vez de quedarse discrepando en silencio.
     */
    const r = saneado;
    if (nodo.innerHTML !== r.html) nodo.innerHTML = r.html;
    if (r.html !== valor) {
      // Y SE DICE. Este camino retiraba en SILENCIO: abrir un documento viejo
      // borraba medio texto sin una palabra, que es literalmente lo que la
      // regla 8 dice que esta pieza existe para impedir.
      setRetirado({ etiquetas: r.etiquetasFuera, huecos: r.huecosFuera, de: 'abrir', sobre: r.html });
      avisar.current(r.html);
    } else {
      /* EL PADRE CAMBIO EL DOCUMENTO Y NO HUBO NADA QUE RETIRAR. Este camino no
         miraba el aviso, asi que quedaba el modo de fallo INVERSO al que `sobre`
         vino a cerrar: cargar otro documento —o vaciarlo— dejaba en pantalla
         «Al abrir, se quitó el formato que no se admite (div, font)…» hablando
         de un contenido que ya no existe. Lo midio una auditoria el 2026-09-13,
         sobre el arreglo del defecto contrario. */
      setRetirado((antes) => (r.html === antes.sobre
        ? antes
        : { etiquetas: [], huecos: [], de: 'texto', sobre: r.html }));
    }
    /* `onCambio` NO es dependencia: casi siempre es una lambda en linea, asi
       que el efecto se disparaba en CADA render aunque no cambiara nada — y
       este efecto toca `innerHTML`, o sea que se lleva por delante el cursor y
       la pila de deshacer. Se lee de un ref. */
  }, [valor, saneado, montado]);

  /**
   * Lee la caja, la sanea y avisa. Todo camino de entrada pasa por aquí.
   *
   * `reporta` existe porque sin él el aviso del pegado NO SE VEÍA NUNCA: el
   * pegado anotaba lo retirado y llamaba aquí inmediatamente, y aquí volvía a
   * mirar una caja que YA estaba limpia, así que el aviso se borraba en el
   * mismo cuadro en que se ponía. Lo cazó su prueba, no un navegador: la
   * función entera era decorativa. Cada camino reporta lo que ÉL retiró.
   */
  const emitir = (anota?: { etiquetas: string[]; huecos: string[]; de: OrigenRetiro }) => {
    const nodo = caja.current;
    if (!nodo) return;
    const r = limpiar(nodo.innerHTML);
    if (anota) {
      /* EL CAMINO DICE LO QUE **EL** RETIRO. El pegado limpia antes de
         insertar, asi que cuando se vuelve a mirar la caja ya no queda rastro:
         si el aviso saliera de esa segunda mirada, no saldria nunca. */
      vinoDePegar.current = false;
      setRetirado({ ...anota, sobre: r.html });
    } else {
      const hay = r.etiquetasFuera.length > 0 || r.huecosFuera.length > 0;
      const de: OrigenRetiro = vinoDePegar.current ? 'pegar' : 'texto';
      vinoDePegar.current = false;
      setRetirado((antes) => {
        if (hay) return { etiquetas: r.etiquetasFuera, huecos: r.huecosFuera, de, sobre: r.html };
        /* ESTE PASO NO RETIRO NADA. Callar aqui el aviso de otro camino es el
           defecto que `sobre` existe para cerrar: el `input` que despacha el
           navegador tras `execCommand`, y el `blur` de irse a pulsar la barra,
           llegan con la caja YA limpia. Mientras el contenido sea el mismo del
           que hablaba, el aviso sigue siendo cierto y se queda. */
        if (r.html === antes.sobre) return antes;
        return { etiquetas: [], huecos: [], de, sobre: r.html };
      });
    }
    // Se reescribe la caja SOLO si el saneo cambió algo: si no, se respeta el
    // cursor. Pegar sí la cambia, y ahí el salto del cursor es lo de menos.
    if (r.html !== nodo.innerHTML) nodo.innerHTML = r.html;
    if (r.html !== valor) onCambio(r.html);
  };

  /**
   * PEGAR ES EL CAMINO POR EL QUE DE VERDAD ENTRA EL CONTENIDO, y quien lo
   * pidió lo dijo así: «esto vale más que cualquier botón de la barra».
   *
   * Quien redacta tiene el texto en Word, en Google Docs o en un correo. Lo que
   * llega trae `<span style>`, `<o:p>`, `<font>`, clases y comentarios
   * condicionales. Se limpia EN EL MOMENTO DE PEGAR y no al guardar: al
   * guardar, quien escribe pierde lo pegado en el peor momento posible.
   */
  const alPegar = (e: React.ClipboardEvent) => {
    const dt = e.clipboardData;
    /* SIN PORTAPAPELES O SIN NADA QUE PEGAR, se deja pasar el pegado del
       navegador en vez de impedirlo: impedirlo y no poner nada se traga el
       contenido EN SILENCIO —un RTF de Word, una imagen, un archivo—, que es
       justo lo que esta pieza viene a evitar. Lo que entre asi lo recoge
       `emitir` en el `input` que viene detras, y ahi si se sanea. */
    if (!dt) { marcarPegado(); return; }
    const html = dt.getData('text/html');
    const texto = dt.getData('text/plain');
    // Se deja pasar el pegado del navegador, pero se APUNTA: lo recoge `emitir`
    // en el `input` siguiente, y sin esta marca el aviso decia «Del texto» de
    // algo que vino de un pegado — el defecto inverso del que se acababa de
    // arreglar, en la misma tanda.
    if (!html && !texto) { marcarPegado(); return; }
    e.preventDefault();
    /* Los saltos del texto plano se conservan como `<br>` si esta permitido, y
       si no se quedan como espacios: perderlos convertia tres parrafos pegados
       en un churro de una linea. */
    // `escapar` viene del saneador: el mapa estaba escrito DOS veces.
    const plano = escapar(texto).replace(/\r?\n/g, '<br>');
    const r = limpiar(html || plano);
    /* SI `insertHTML` FALLA, no se traga el contenido. Devuelve `false` y el
       `preventDefault` ya corrio, asi que sin esto el pegado desaparecia sin
       rastro — el mismo modo de fallo que el arreglo de la rama sin datos
       cerro, dejando abierta la rama CON datos. */
    if (!document.execCommand('insertHTML', false, r.html)
      && !document.execCommand('insertText', false, texto || r.html.replace(/<[^>]*>/g, ''))) {
      setRetirado({ etiquetas: [], huecos: [], de: 'fallo', sobre: limpiar(caja.current?.innerHTML ?? '').html });
      return;
    }
    emitir({ etiquetas: r.etiquetasFuera, huecos: r.huecosFuera, de: 'pegar' });
  };

  const mandar = (orden: string, valorOrden?: string) => {
    caja.current?.focus();
    /* `styleWithCSS` en false: sin esto, algunos navegadores emiten
       `<span style="font-weight:bold">` en vez de una etiqueta, y el saneador
       —que no admite NINGÚN atributo— se lo lleva entero. Con etiquetas, lo
       traduce `IGUALES`. Es la misma familia del defecto de `<b>`: lo que el
       navegador decide emitir no puede decidir si el botón funciona. */
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(orden, false, valorOrden);
    emitir();
  };

  /**
   * LA FICHA NO SE PARTE. Qué hay que borrar lo decide `tramoDeHueco`, que es
   * una función pura y está probada; aquí solo queda aplicarlo al DOM.
   *
   * `beforeinput` y no `keydown`: cubre el Retroceso, el Suprimir, el gesto
   * del teléfono y lo que mande un lector de pantalla, que son caminos
   * distintos hacia el mismo borrado.
   *
   * LO QUE NO SE PUEDE PROBAR AQUÍ, dicho: jsdom no simula la selección dentro
   * de un `contenteditable`, así que esta costura —las cuatro líneas que
   * mueven el rango— no tiene prueba. La decisión sí.
   */
  const alBorrar = (e: InputEvent) => {
    /* EL CARACTER Y LA PALABRA, Y **NO** LA LINEA. La primera version metia
       tambien `SoftLine`/`HardLine` en el mismo saco, y con eso **rompia el
       borrado de linea**: quien pulsaba Cmd+Retroceso esperando vaciar la
       linea se quedaba con `Hola ` porque el manejador borraba solo la ficha y
       cancelaba el resto. Medido por una auditoria el 2026-09-13.

       No hacen falta: un borrado de linea se lleva la linea ENTERA, huecos
       incluidos, asi que no puede partir una ficha. Lo que si la parte es el
       caracter y la palabra, y esos dos son los que se interceptan. La palabra
       es ademas el gesto de barrido del teclado del telefono. */
    const atras = /^delete(ContentBackward|WordBackward)$/;
    const delante = /^delete(ContentForward|WordForward)$/;
    const hacia = atras.test(e.inputType ?? '') ? 'atras'
      : delante.test(e.inputType ?? '') ? 'delante' : null;
    if (!hacia) return;
    const sel = document.getSelection();
    /* SOLO CON EL CURSOR PLEGADO Y DENTRO DE UN NODO DE TEXTO, y lo que queda
       fuera se declara en vez de fingirse cubierto:

         · **el corte y el arrastre** (`deleteByCut`, `deleteByDrag`) llevan
           siempre un rango, no un cursor. Un rango puede partir una ficha por
           la mitad, y aqui no se arregla.
         · un hueco **repartido entre dos nodos de texto** —lo que hace el
           navegador al deshacer o al pegar dentro— no lo ve `tramoDeHueco`,
           que mira un solo nodo.

       En los dos casos la GARANTIA sigue en pie: lo que quede es texto plano y
       el saneador lo entrega tal cual. Lo que se pierde es la comodidad, y por
       eso se dice aqui y en el contrato en vez de prometerse. */
    if (!sel || !sel.isCollapsed || !sel.anchorNode || sel.anchorNode.nodeType !== 3) return;
    const tramo = tramoDeHueco(sel.anchorNode.textContent ?? '', sel.anchorOffset, hacia);
    if (!tramo) return;
    e.preventDefault();
    const rango = document.createRange();
    rango.setStart(sel.anchorNode, tramo.inicio);
    rango.setEnd(sel.anchorNode, tramo.fin);
    rango.deleteContents();
    emitir();
  };
  /* SE ESCUCHA EL EVENTO NATIVO, y no con `onBeforeInput` de React: React 18
     NO conecta el `beforeinput` del navegador a esa prop —la suya es otra cosa,
     heredada de la composicion de texto—, asi que el manejador NO CORRIA y la
     ficha se partia igual. Es la segunda vez que esta pieza «construye» algo
     que no se ejecuta; lo cazo una auditoria el 2026-09-13. */
  const borrar = useRef(alBorrar);
  borrar.current = alBorrar;
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return undefined;
    const oyente = (e: Event) => borrar.current(e as InputEvent);
    nodo.addEventListener('beforeinput', oyente);
    return () => nodo.removeEventListener('beforeinput', oyente);
  }, []);

  const meterHueco = (nombre: string) => {
    caja.current?.focus();
    document.execCommand('insertText', false, `{{${nombre}}}`);
    emitir();
  };

  /**
   * SE CUENTA EL HTML, NO EL TEXTO VISIBLE, y no es un descuido: es lo que mide
   * el saneador del otro lado. Un texto que se ve corto puede pasarse de largo
   * por las etiquetas, y si el editor contara lo visible avisaría tarde. Y se
   * cuenta sobre lo SANEADO, que es lo que se va a entregar.
   *
   * El conteo lo hace `interno/contador.tsx`, el mismo que usa `AreaTexto`: en
   * puntos de código y no en unidades UTF-16, porque dos componentes del mismo
   * sistema no pueden contar distinto lo mismo.
   */
  /* `montado ? maximo : undefined`: sin DOM no hay contenido saneado que
     contar, y contar el vacio pintaba «2500 restantes» un instante antes de
     corregirse. La regla es la misma de arriba —nada que dependa del contenido
     de la caja se pinta hasta que la caja existe— y aqui tambien aplica. */
  const { pie, error: elError, anuncio } = usarContador(saneado.html, montado ? maximo : undefined, ayuda, error);

  const barra = ORDEN_BARRA.filter((t) => etiquetas.includes(t));


  /**
   * ROVING TABINDEX, que faltaba. La primera versión ponía `role="toolbar"` y
   * afirmaba que «las flechas son el recorrido y el tabulador entra y sale de
   * ella de una vez». El atributo estaba; el comportamiento, no — y `role` solo
   * no hace nada, el patrón lo implementa quien lo escribe. Medido por una
   * auditoría: los seis botones eran paradas de tabulador, y la configuración
   * del catálogo —**cuatro etiquetas con control** de las siete que admite, más
   * cuatro huecos— son OCHO tabulaciones antes de llegar al texto.
   *
   * NO SE COMPONE CON EL DE `RangoFecha`, y es deliberado: aquél recorre una
   * REJILLA —arriba y abajo saltan de semana, `Home`/`End` van a los extremos
   * de la suya— y éste una fila. Sacar un ayudante común obligaría a que uno de
   * los dos pidiera lo que no necesita. Se declara aquí para que la próxima
   * lista lineal componga con ésta y no escriba la tercera.
   */
  /* `Math.max(1, …)`: con cero mandos —`etiquetas: ['p']` y sin huecos— el
     `% mandos` daba NaN y acababa en el `tabIndex`. La barra no se pinta
     entonces, pero el calculo corre igual. */
  const mandos = Math.max(1, barra.length + huecos.length);
  const [enBarra, setEnBarra] = useState(0);
  const foco = Math.min(enBarra, Math.max(0, mandos - 1));
  const barraRef = useRef<HTMLDivElement>(null);

  const teclasBarra = (e: React.KeyboardEvent) => {
    const salto = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const ir = e.key === 'Home' ? 0 : e.key === 'End' ? mandos - 1 : salto ? (foco + salto + mandos) % mandos : -1;
    // `Number.isFinite` y no `ir < 0`: `NaN < 0` es falso, asi que un NaN se
    // colaba por la guarda y acababa en `setEnBarra`.
    if (!Number.isFinite(ir) || ir < 0) return;
    e.preventDefault();
    setEnBarra(ir);
    (barraRef.current?.querySelectorAll('button')[ir] as HTMLElement | undefined)?.focus();
  };
  // Filtrado contra la lista: sin eso enumeraba huecos que el propio saneador
  // RETIRA, asi que la linea prometia lo contrario de lo que hace la pieza.
  // Sin repetir: `{{sede}} y {{sede}}` enumeraba «{{sede}} · {{sede}}».
  const puestos = [...new Set(huecosDe(saneado.html))].filter((h) => nombresHueco.includes(h));

  /* El fallo del pegado tiene su propio mensaje: no retiró nada, no pudo
     poner nada, y callarlo es exactamente el modo de fallo que el arreglo
     venía a cerrar. */
  const avisoFallo = retirado.de === 'fallo'
    ? 'No se pudo pegar aquí. Vuelve a intentarlo, o pega el texto sin formato.'
    : '';
  /* LAS DOS CLAUSULAS SE UNEN CON «y», y no empieza por «y» la de los huecos:
     con un hueco retirado y ninguna etiqueta salia «Al abrir, y el hueco
     {{documento}}, que no existe.» Lo cazo una auditoria el 2026-09-13. */
  /* Los `Set` son cinturon y tirantes: `sanear` ya devuelve las dos listas sin
     repetir. La deduplicacion que de verdad trabaja es la de `puestos`. */
  const soloEtiquetas = [...new Set(retirado.etiquetas)];
  const soloHuecos = [...new Set(retirado.huecos)];
  const deDonde = retirado.de === 'pegar' ? 'Al pegar, ' : retirado.de === 'abrir' ? 'Al abrir, ' : 'Del texto, ';
  const avisoRetirado = [
    soloEtiquetas.length
      ? `se quitó el formato que no se admite (${soloEtiquetas.join(', ')})`
      : '',
    soloHuecos.length
      ? `${soloHuecos.length === 1 ? 'el hueco' : 'los huecos'} ${soloHuecos.map((h) => `{{${h}}}`).join(', ')}, que no ${soloHuecos.length === 1 ? 'existe' : 'existen'}`
      : '',
  ].filter(Boolean).join(' y ');



  return (
    <Campo
      etiqueta={etiqueta}
      etiquetaOculta={etiquetaOculta}
      error={elError}
      ayuda={pie || ayuda}
    >
      {(props) => (
        <div className={['ed', elError ? 'ed-mal' : '', className].filter(Boolean).join(' ')}>
          {/* La barra es un `toolbar` de ARIA: con eso, las flechas son el
              recorrido y el tabulador entra y sale de ella de una vez, en vez
              de pasar por cada botón antes de llegar al texto. */}
          {/* Sin mandos no se pinta: un `toolbar` con nombre y cero botones se
              anuncia al lector y no lleva a ninguna parte. */}
          {barra.length + huecos.length > 0 && (
          <div
            className="ed-barra" role="toolbar" ref={barraRef}
            aria-label={`Formato de ${etiqueta}`}
            onKeyDown={teclasBarra}
          >
            {barra.map((t, i) => {
              const c = CONTROLES[t]!;
              return c.icono ? (
                <Boton
                  key={t} mini variante="terciaria" soloIcono
                  aria-label={c.rotulo}
                  tabIndex={i === foco ? 0 : -1}
                  icono={<Icono nombre={c.icono} tam="control" />}
                  onClick={() => mandar(c.orden, c.valor)}
                  onFocus={() => setEnBarra(i)}
                />
              ) : (
                <Boton
                  key={t} mini variante="terciaria"
                  tabIndex={i === foco ? 0 : -1}
                  onClick={() => mandar(c.orden, c.valor)}
                  onFocus={() => setEnBarra(i)}
                >
                  {c.rotulo}
                </Boton>
              );
            })}
            {huecos.length > 0 && barra.length > 0 && <span className="ed-sep" aria-hidden="true" />}
            {huecos.map((h, i) => (
              <Boton
                key={h.nombre} mini variante="secundaria"
                tabIndex={barra.length + i === foco ? 0 : -1}
                onClick={() => meterHueco(h.nombre)}
                onFocus={() => setEnBarra(barra.length + i)}
                title={h.ejemplo ? `Sale: ${h.ejemplo}` : undefined}
              >
                {h.rotulo ?? h.nombre}
              </Boton>
            ))}
          </div>
          )}

          <div
            {...props}
            ref={caja}
            className="ed-texto"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            /* EL NOMBRE VA AQUI, y este sistema ya lo tenia escrito DOS veces
               —en `Interruptor` y en `RangoFecha`— y aun asi se incumplio:
               HTML-AAM no calcula el nombre de un elemento NO ETIQUETABLE desde
               un `<label for>`. `Campo` ata el rotulo por `htmlFor`, que sirve
               para el foco al pulsar y no para el nombre. Sin esto, la caja
               salia SIN NOMBRE ACCESIBLE: medido, cero coincidencias buscando
               el textbox por su rotulo. */
            aria-label={etiqueta}
            aria-multiline="true"
            /* `() => emitir()` y no `emitir` a secas: React le pasaria el
               EVENTO como primer argumento, y el primer argumento es la
               anotacion de lo que ese camino retiro. `tsc` lo caza, pero nadie
               deberia tener que razonar sobre eso. */
            onInput={() => emitir()}
            onBlur={() => emitir()}
            onPaste={alPegar}
          />

          {/* Lo que se retiró SE DICE. Quitar en silencio es lo que hace el
              destino, y es justo lo que esta pieza viene a evitar. */}
          {/* LOS DOS, Y EL DEL TOPE PRIMERO. Encadenados con `||`, el anuncio
              del contador quedaba el ultimo y **se callaba en cuanto algo se
              retiraba**: con el texto pasado de tope y un `<div>` retirado, el
              lector oia «se quitó el formato» y nunca «Te pasas por N», que es
              lo que impide guardar. Lo cazo una auditoria el 2026-09-13, y es
              justo el defecto que `interno/contador.tsx` dice haberse extraido
              para impedir. */}
          {/* EL LECTOR OYE LO MISMO QUE SE VE, prefijo incluido. Sin el, la
              region viva decia «se quitó el formato…» —en minuscula, justo
              detras de un punto— y quien usa lector NO SE ENTERABA de si fue al
              pegar, al abrir o al escribir: justo la distincion por la que
              existe `OrigenRetiro`. El arreglo se habia aplicado a la vista y
              no al anuncio. Lo midio una auditoria el 2026-09-13. */}
          <span className="sr-solo" role="status" aria-live="polite">
            {[anuncio, avisoFallo || (avisoRetirado && `${deDonde}${avisoRetirado}`)]
              .filter(Boolean).join('. ')}
          </span>
          {/* El texto decia «Al pegar» viniera de donde viniera, asi que quien
              abria un documento viejo y escribia una letra veia desaparecer
              medio documento y que le culparan de un pegado que no hizo. */}
          {avisoFallo && <p className="ed-retirado">{avisoFallo}</p>}
          {avisoRetirado && (
            <p className="ed-retirado">
              {deDonde}{avisoRetirado}.
            </p>
          )}

          {puestos.length > 0 && (
            <p className="ed-puestos">
              Huecos en el texto: {puestos.map((h) => `{{${h}}}`).join(' · ')}
            </p>
          )}
        </div>
      )}
    </Campo>
  );
}
