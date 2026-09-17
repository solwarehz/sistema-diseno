/**
 * RANGO DE FECHAS
 *
 * Rehecho en React porque el del catálogo acumulaba cuatro de los seis críticos
 * de la auditoría de patrones accesibles:
 *
 *   · no implementaba NI UNA tecla del patrón `date picker dialog` de la APG
 *   · los ~60 días eran 60 paradas de tabulación seguidas, sin roving tabindex
 *   · volver al campo «Desde» BORRABA el rango en silencio
 *   · `aria-current="date"` marcaba los extremos, cuando significa «hoy»
 *
 * El teclado no es un extra de este componente: es la mitad de su trabajo.
 *
 * Los estilos vienen de `componentes.css`. Aquí van marcado y comportamiento.
 */

import { useEffect, useMemo, useRef, useState, useId } from 'react';
import { usarDesplegable } from './interno/desplegable';
import { Boton } from './Boton';
import { Icono } from './Icono';

export type RangoFechaProps = {
  /** Etiqueta del conjunto. Obligatoria: dos campos sin nombre común no se
   *  entienden al navegar por formulario. */
  titulo: string;
  desde?: string | null;
  hasta?: string | null;
  onCambio?: (r: { desde: string | null; hasta: string | null }) => void;
  /** Primer día de la semana. En Perú, lunes. */
  primerDia?: 0 | 1;
  /** Hoy, inyectable para poder probarlo sin depender del reloj. */
  hoy?: Date;
  /**
   * EL PANEL DE PERIODOS, que el catálogo publica desde siempre y el
   * componente no entregaba. Por omisión los cuatro del catálogo.
   *
   * Se puede sustituir —un colegio piensa en bimestres, no en trimestres
   * naturales— y se puede quitar con `atajos={[]}`. Lo que no se puede es
   * tenerlo a medias: o hay panel o no lo hay.
   *
   * Con `maxDias`, **los que no caben en el tope no se pintan**. Los cuatro de
   * omisión van de un mes a un año, así que con un tope corto el panel se queda
   * vacío y desaparece: ahí es donde se pasa la lista propia, y `atajosDeDias`
   * la construye en una línea.
   */
  atajos?: AtajoRango[];
  /** Cuántos meses se ven a la vez. Dos por omisión, que es lo que el catálogo
   *  enseña y lo que hace falta para elegir un rango sin navegar a ciegas. */
  meses?: 1 | 2;

  /**
   * R139 · TOPE DE DÍAS DEL RANGO, contado **inclusivo**: del 1 al 7 son 7.
   *
   * **Sin pasarlo no hay tope**, y ese es el caso corriente. Es un número
   * cualquiera —7 en un sitio, 30 en otro— y el componente se comporta igual:
   * lo pidió el responsable así, «si la consulta es máximo 30 días debe
   * funcionar igual, si es libre sin límite debe funcionar igual».
   *
   * El caso que lo trajo: el reporte semanal de asistencia existe por el tope
   * de 48 h, que es **semanal**; sobre nueve días esa columna no significa
   * nada. Antes solo podían avisar **después** de que alguien eligiera catorce.
   *
   * IMPIDE mientras se elige el final —los días de más no se pueden elegir— y
   * AVISA cuando el rango **llega ya puesto** desde fuera: el componente no
   * reescribe un valor que le dieron. Recortarlo sería cambiar el dato de
   * alguien en silencio; rechazarlo, negarse a pintar un rango que ya está
   * guardado. Es lo mismo que hace `maximo` en `EditorTexto`, que cuenta «N de
   * más» y no trunca una letra.
   */
  maxDias?: number;

  /**
   * R139 · EL ERROR DEL PRODUCTO, como en todos los campos del sistema. Manda
   * sobre el que genere `maxDias`, igual que en el contador del editor.
   */
  error?: string;

  /**
   * R139 · APAGADO. Los dos disparadores salen del tabulador y el calendario no
   * se abre.
   *
   * **No es solo lectura** (regla transversal 0c): si lo que hace falta es que
   * se vea, se lea, se enfoque y **viaje con el formulario** mientras una
   * consulta está en curso, esto NO sirve — y este control **no tiene** esa
   * variante. Se dice en vez de fingir que cubre los dos casos.
   */
  deshabilitado?: boolean;
};

/** Un periodo del panel. `rango` recibe «hoy» para poder probarlo sin reloj. */
export type AtajoRango = {
  texto: string;
  rango: (hoy: Date) => { desde: Date; hasta: Date };
};

const finDeMes = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const inicioDeMes = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Los cuatro del catálogo, en su mismo orden. */
export const ATAJOS_POR_OMISION: AtajoRango[] = [
  { texto: 'Este mes', rango: (h) => ({ desde: inicioDeMes(h), hasta: finDeMes(h) }) },
  { texto: 'Mes pasado', rango: (h) => {
      const m = sumarMeses(inicioDeMes(h), -1);
      return { desde: inicioDeMes(m), hasta: finDeMes(m) };
    } },
  { texto: 'Últimos 2 meses', rango: (h) => ({
      desde: inicioDeMes(sumarMeses(inicioDeMes(h), -1)), hasta: finDeMes(h) }) },
  { texto: 'Este año', rango: (h) => ({
      desde: new Date(h.getFullYear(), 0, 1), hasta: new Date(h.getFullYear(), 11, 31) }) },
];

/**
 * LOS PERIODOS DE UN SISTEMA CON TOPE, en una línea.
 *
 * `ATAJOS_POR_OMISION` piensa en meses porque nació sin tope. Quien pone
 * `maxDias` se queda sin panel —los cuatro son imposibles— y tiene que escribir
 * su propia lista con su propia aritmética de fechas. Eso es exactamente lo que
 * la política de creación llama RECONSTRUIR: cada producto resolviendo otra vez
 * lo mismo, y cada uno con su descuido.
 *
 *   <RangoFecha maxDias={7} atajos={atajosDeDias(1, 3, 7)} />
 *
 * Cuenta INCLUSIVE, igual que `maxDias`: `atajosDeDias(7)` da siete días con
 * hoy dentro, no ocho. `atajosDeDias(1)` es «Hoy».
 */
export const atajosDeDias = (...dias: number[]): AtajoRango[] =>
  dias.map((n) => ({
    texto: n === 1 ? 'Hoy' : `Últimos ${n} días`,
    rango: (h: Date) => ({ desde: new Date(h.getFullYear(), h.getMonth(), h.getDate() - (n - 1)), hasta: h }),
  }));

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_CORTOS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deIso = (s: string) => {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
};
const mismoDia = (a: Date, b: Date) => iso(a) === iso(b);
const sumarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/**
 * R129 · SUMAR MESES SIN DESBORDAR. `new Date(a, m+n, 31)` con destino en un mes
 * de 30 desborda al siguiente: PageDown desde el 31 de enero aterrizaba el 3 de
 * marzo —febrero entero saltado— y PageUp desde el 31 de marzo no se movía. El
 * día se recorta al último del mes destino, que es lo que hace cualquier
 * calendario. Los cuatro atajos ya estaban a salvo porque parten de día 1.
 */
const sumarMeses = (d: Date, n: number) => {
  const a = d.getFullYear();
  const m = d.getMonth() + n;
  const ultimo = new Date(a, m + 1, 0).getDate();
  return new Date(a, m, Math.min(d.getDate(), ultimo));
};

/**
 * R130.2 · EL FORMATO QUE SE MUESTRA, que este componente no aplicaba.
 *
 * La tabla «Formato» del catalogo lo dice desde siempre: se MUESTRA 31/03/2026,
 * se GUARDA 2026-03-31. El disparador imprimia el valor tal cual y en pantalla
 * salia el ISO — el formato de guardar, ensenado a quien mira.
 *
 * Lo grave no es el despiste: es que este mismo archivo YA formateaba. El
 * resumen usaba `enPalabras` y el disparador no usaba nada. Una superficie del
 * mismo componente cumplia la regla y la otra no.
 *
 * Y se resuelve AQUI y no en cada producto. El contrato de la propiedad es ISO
 * —y esta bien que lo sea, porque es lo que se guarda—, asi que el formateo al
 * pintar le toca al componente. Si lo hace cada pantalla por su cuenta,
 * acabaran habiendo tantos formatos como pantallas, que es exactamente lo que
 * un sistema de diseno existe para evitar.
 */
const enCorto = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

/** Texto largo para el lector: «lunes 3 de marzo de 2026». */
const enPalabras = (d: Date) =>
  `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;

export function RangoFecha({
  titulo,
  /* SIN VALOR POR OMISIÓN, a propósito. Un `= null` haría que `desdeProp` nunca
     fuera `undefined` y el componente se creería controlado SIEMPRE: pasaría a
     ignorar sus propios clics en todo producto que no pase `onCambio`. */
  desde: desdeProp,
  hasta: hastaProp,
  onCambio,
  primerDia = 1,
  hoy = new Date(),
  atajos = ATAJOS_POR_OMISION,
  meses = 2,
  maxDias,
  error,
  deshabilitado,
}: RangoFechaProps) {
  const id = useId();
  /**
   * R139 · EL RANGO MANDA, NO SIEMBRA.
   *
   * Aquí ponía `useState(desdeProp)`: las props se leían **una vez** y no se
   * volvían a mirar. El producto no podía mover el rango después de montar, así
   * que devolverle por `onCambio` un rango corregido **no lo movía**. Lo dijo
   * Control Administrativos V2.0 en el R139 con su consecuencia: *«esto pasa de
   * avisar a impedir y las líneas se borran»* — quien quiere rechazar una
   * selección no tiene forma de devolver el valor anterior, así que solo puede
   * avisar **después** de que alguien ya eligió mal.
   *
   * Mismo patrón que `plegado`/`onPlegar` del marco: sin props, el componente
   * se gobierna solo; pasadas, mandan siempre. No se hacen obligatorias porque
   * ya están publicadas como opcionales desde la v1.39.0 y eso sería un error
   * de compilación en cada consumidor.
   *
   * SE DECIDE CON `!== undefined`, no con `??`. `desde={null}` es un rango
   * vacío deliberado y tiene que mandar igual; con `??` ese `null` caería al
   * estado interno y el control se perdería **justo al vaciar**, que es cuando
   * más se nota. Es la familia del R103 del selector: el `null` que la firma
   * promete y no viaja.
   */
  const controlado = desdeProp !== undefined || hastaProp !== undefined;
  const [desdeDentro, setDesdeDentro] = useState<string | null>(desdeProp ?? null);
  const [hastaDentro, setHastaDentro] = useState<string | null>(hastaProp ?? null);
  const desde = controlado ? (desdeProp ?? null) : desdeDentro;
  const hasta = controlado ? (hastaProp ?? null) : hastaDentro;

  /**
   * EL USO VIEJO SE DICE EN VOZ ALTA, que es lo único que se puede hacer por él.
   *
   * Hasta la v1.121.0 `desde`/`hasta` eran la semilla, y mucha pantalla las pasa
   * **sin** `onCambio` porque no hacía falta: el componente se gobernaba solo.
   * Ahora eso deja el calendario congelado —se pulsa un día y no pasa nada—, y
   * es el único caso que se puede detectar con certeza.
   *
   * **Lo que NO se puede detectar** es a quien sí pasa `onCambio` y no guarda lo
   * que llega. Ése solo lo caza su pantalla, y por eso va también en el aviso de
   * ruptura del registro de cambios: un `console.error` no sustituye a decirlo.
   */
  if (process.env.NODE_ENV !== 'production'
      && (desdeProp !== undefined || hastaProp !== undefined) && !onCambio) {
    console.error(
      'RangoFecha: `desde`/`hasta` MANDAN desde la v1.122.0, ya no son el valor ' +
      'inicial. Pasadas sin `onCambio`, el calendario queda congelado: se pulsa ' +
      'un día y no pasa nada, porque el componente pide el cambio y nadie lo ' +
      'aplica. Guarda lo que llegue por `onCambio` y devuélvelo por `desde`/' +
      '`hasta` —es una línea— o deja de pasarlas y se gobernará solo.',
    );
  }

  /**
   * PEDIR NO ES APLICAR — Y AVERIGUARLO NO ES MIRAR SI HAY PROPS.
   *
   * La primera versión de esto devolvía `!controlado`, que es «no hay props»,
   * no «se aplicó». Con eso, un producto que guarda el valor y lo devuelve
   * —**el patrón que esta misma versión enseña**— se encontraba con que el
   * calendario no encadenaba, no movía la ventana y **no cerraba**: dos clics
   * no fijaban un rango, porque el segundo reescribía el inicio. Rompía el
   * gesto principal del componente para el modo correcto, con los 19 candados
   * y las 934 pruebas en verde. Lo cazó una auditoría adversaria antes de
   * publicar.
   *
   * Averiguarlo **no se puede hacer en el momento**: `onCambio` no devuelve
   * nada y el producto reacciona en su propio dibujado. Así que se apunta lo
   * pedido y se mira **después**: si las props vuelven con lo que se pidió, el
   * producto lo aplicó y entonces —y solo entonces— corre lo que colgaba.
   *
   * Los tres finales posibles, y los tres son correctos:
   *   · el producto aplica          → vuelve con el valor pedido → encadena y cierra;
   *   · el producto NO hace nada    → no hay dibujado nuevo → no pasa nada;
   *   · el producto aplica OTRA cosa —recorta el rango, lo ajusta— → vuelve
   *     con algo distinto → **tampoco** cierra, y se queda a la vista lo que el
   *     producto decidió. Cerrar ahí escondería justo lo que hay que mirar.
   */
  const pedido = useRef<{ d: string | null; h: string | null; alAplicar: () => void } | null>(null);

  function pedirRango(d: string | null, h: string | null, alAplicar: () => void = () => {}) {
    pedido.current = null;
    if (!controlado) {
      setDesdeDentro(d);
      setHastaDentro(h);
      onCambio?.({ desde: d, hasta: h });
      alAplicar();               // sin control, pedir ES aplicar
      return;
    }
    pedido.current = { d, h, alAplicar };
    onCambio?.({ desde: d, hasta: h });
  }

  /* SIN LISTA DE DEPENDENCIAS, a propósito: hay que mirar tras CADA dibujado.
     Con `[desde, hasta]`, un producto que rechaza no provoca cambio y el efecto
     no correría nunca, dejando la petición viva para disparar en el cambio
     siguiente —que no tiene nada que ver—. */
  useEffect(() => {
    const p = pedido.current;
    if (!p) return;
    pedido.current = null;
    if (desde === p.d && hasta === p.h) p.alAplicar();
  });

  /**
   * R131 · SE USA EL DESPLEGABLE DEL SISTEMA, no una cuarta copia.
   *
   * `cerrar()` existia y no habia quien lo llamara: ni clic fuera, ni Escape
   * desde fuera, ni alternar en el disparador. La primera version de R131
   * escribio aqui su propio efecto con escuchas en `document`, y una auditoria
   * lo tumbo por dos motivos, los dos justos:
   *
   *  · Era la CUARTA copia de un comportamiento que `interno/desplegable.ts`
   *    ya tenia, y cuya propia cabecera avisa: «dos copias de un comportamiento
   *    divergen. La paginacion ya lo demostro». Divergian de verdad —captura
   *    contra burbuja, `pointerdown` contra `mousedown`— y no en teoria.
   *  · Y no se apuntaba en el conjunto de «solo uno abierto», asi que el
   *    calendario y el menu de usuario podian quedarse los dos encima del
   *    contenido, que es el defecto exacto que ese conjunto existe para evitar.
   *
   * Lo que el calendario tiene de suyo —el modo, el mes a la vista, el dia con
   * el foco— se queda aqui. Lo de ser una capa que se abre y se cierra, no.
   */
  const {
    abierto, setAbierto, abrir: abrirCapa, caja: zona, disparador,
    cerrarYDevolverFoco, cerrarPorClicFuera,
  } = usarDesplegable({ alCerrar: () => setSobre(null) });
  /* APAGAR CON LA CAPA ABIERTA LA CIERRA. Sin esto, `deshabilitado` solo
     miraba en `abrir()` y en el `disabled` del marcado: un calendario ya
     abierto se quedaba abierto y SEGUÍA EMITIENDO `onCambio` — un control
     apagado que cambia valores es peor que el rodeo con CSS que el R140 vino a
     corregir. Lo cazó una auditoría. */
  useEffect(() => {
    if (deshabilitado && abierto) cerrarPorClicFuera();
  }, [deshabilitado, abierto]);

  /** Qué extremo se está eligiendo. */
  const [modo, setModo] = useState<'desde' | 'hasta'>('desde');
  /** El día que tiene el foco dentro de la rejilla. Es lo que mueve el teclado
   *  y lo único con tabindex=0: eso es el roving tabindex. */
  const [foco, setFoco] = useState<Date>(() => (desdeProp ? deIso(desdeProp) : hoy));
  /** El mes de la IZQUIERDA. Se separa de `foco` porque con dos meses a la
   *  vista el día enfocado puede estar en cualquiera de los dos, y la ventana
   *  solo se mueve cuando el foco se sale de ella. */
  const [mesBase, setMesBase] = useState<Date>(() =>
    inicioDeMes(desdeProp ? deIso(desdeProp) : hoy));
  /** R120 · el día sobrevolado, para pintar el rango que SALDRÍA. Es lo que la
   *  hoja llama `.fc-previo` y ningún producto podía activar. */
  const [sobre, setSobre] = useState<Date | null>(null);
  const rejilla = useRef<HTMLDivElement>(null);
  const debeEnfocar = useRef(false);

  // El foco se mueve DESPUÉS de pintar, o se enfocaría un nodo que aún no
  // existe cuando el mes cambia.
  useEffect(() => {
    if (!abierto || !debeEnfocar.current) return;
    const nodo = rejilla.current?.querySelector<HTMLElement>('[tabindex="0"]');
    // Si el día enfocado todavía no está pintado, NO se consume la bandera: se
    // vuelve a intentar en el siguiente dibujado. Con dos meses a la vista esto
    // deja de ser teórico — saltar un año mueve la ventana, y esa mudanza es un
    // dibujado más. Consumiendo la bandera antes de encontrar el nodo, el foco
    // se perdía justo en los saltos largos.
    if (!nodo) return;
    debeEnfocar.current = false;
    nodo.focus();
  });

  function abrir(cual: 'desde' | 'hasta') {
    /* DEFENSA, Y SE DICE QUE LO ES. Hoy `abrir` solo se llama desde los dos
       disparadores, y un botón `disabled` no dispara `onClick`: esta línea es
       **inalcanzable**, y quitarla deja las 31 pruebas en verde —lo midió una
       mutación—. Se queda porque lo que hace que sea inalcanzable vive FUERA de
       esta función, en el `disabled` del marcado, y el día que alguien llame a
       `abrir` desde un atajo de teclado o desde una prop nueva, esto seguiría
       siendo correcto. Lo que NO se hace es escribir una prueba que finja
       sujetarla. */
    if (deshabilitado) return;
    // NO se borra nada al abrir. El del catálogo hacía `ini = null; fin = null`
    // aquí, así que un simple Shift+Tab de vuelta destruía la selección sin
    // avisar. Abrir es abrir.
    setModo(cual);
    const d = cual === 'hasta' && hasta ? deIso(hasta) : desde ? deIso(desde) : hoy;
    setFoco(d);
    // La ventana se coloca al abrir, no de rebote por el efecto: así el primer
    // dibujado ya trae el mes correcto y no hay salto visible.
    setMesBase(inicioDeMes(d));
    // `abrirCapa` y no `setAbierto`: cierra los demas desplegables antes.
    abrirCapa();
    debeEnfocar.current = true;
  }

  /**
   * El dia sobrevolado se suelta en `alCerrar`, arriba: asi ocurre venga el
   * cierre de donde venga —Escape, clic fuera, o que otro desplegable se
   * abriera—. Solo se limpiaba con `mouseleave`, y cerrar con teclado dejaba
   * medio mes pintado como «dentro del rango» sin nadie encima (R129).
   */
  function cerrar(devolverFoco = true) {
    if (devolverFoco) cerrarYDevolverFoco();
    else cerrarPorClicFuera();
  }

  /* ── EL TOPE ─────────────────────────────────────────────────────────────
     Sin `maxDias` nada de esto existe: `techo` es null, `fueraDeAlcance`
     devuelve siempre false y `excede` siempre false. El componente se comporta
     exactamente como antes, que es el caso corriente. */
  /* EL TOPE SE SANEA. `maxDias={0}` es falsy y desactivaba el tope EN SILENCIO
     —un producto que lo calcula y le sale 0 lo perdía sin enterarse— y un
     negativo apagaba 55 de 61 días, el propio inicio incluido, con un nombre
     accesible que decía «fuera del máximo de -3 días». Lo cazó una auditoría. */
  const tope = typeof maxDias === 'number' && Number.isFinite(maxDias) && maxDias >= 1
    ? Math.floor(maxDias) : null;
  if (process.env.NODE_ENV !== 'production' && maxDias !== undefined && tope === null) {
    console.error(
      `RangoFecha: \`maxDias\` recibió ${maxDias}, que no es un tope. Tiene que ser ` +
      'un entero de 1 en adelante. Se ignora: el rango queda sin límite.',
    );
  }
  /** El aviso de que un periodo entero no cabe en el tope. */
  const [avisoTope, setAvisoTope] = useState<string | null>(null);

  const dDesde = desde ? deIso(desde) : null;
  const dHasta = hasta ? deIso(hasta) : null;
  /** Días del rango, contados INCLUSIVE: del 1 al 7 son 7, no 6. */
  const diasEntre = (a: Date, b: Date) =>
    Math.round((b.getTime() - a.getTime()) / 86400000) + 1;

  /**
   * R139 (añadido) · UN PERIODO QUE NO CABE EN EL TOPE NO SE PINTA.
   *
   * Los cuatro periodos por omisión van de un mes a un año. Con `maxDias={7}`,
   * los cuatro son IMPOSIBLES: el panel enseñaba cuatro botones que solo sabían
   * dar un aviso. Lo reportó el responsable después de quitarlos a mano en su
   * producto — que es la prueba de que sobraban: si hay que quitarlos fuera, es
   * que el componente no los tenía que haber puesto.
   *
   * Se ESCONDEN y no se apagan, y la diferencia importa. Un día del calendario
   * va `aria-disabled` porque su disponibilidad depende del inicio elegido y
   * cambia en cuanto se elige otro: apagarlo hay que explicarlo. Un periodo, en
   * cambio, mide siempre lo mismo contra el mismo tope — «Este mes» nunca va a
   * caber en siete días—, así que no es un control apagado: es un control que
   * en esta pantalla no existe. Lo que no puede pasar nunca no se anuncia.
   *
   * `atajos={[]}` seguía siendo la forma de quitar el panel entero, y lo sigue
   * siendo. Esto es otra cosa: el panel se queda con los que sirven.
   */
  const atajosQueCaben = tope === null ? atajos : atajos.filter((a) => {
    const r = a.rango(hoy);
    return diasEntre(r.desde, r.hasta) <= tope;
  });
  /** El último día que se puede elegir como final. */
  const techo = tope && dDesde ? sumarDias(dDesde, tope - 1) : null;
  /**
   * Un día queda fuera SOLO mientras se elige el FINAL. Eligiendo el inicio no
   * hay techo: si no, un rango que ya se pasó no se podría arreglar moviendo su
   * inicio, y la persona quedaría encerrada.
   */
  const fueraDeAlcance = (d: Date) => !!(techo && modo === 'hasta' && d > techo);
  /** Un rango que LLEGA ya pasado no se recorta ni se rechaza: se pinta y se dice. */
  const excede = !!(tope && dDesde && dHasta && diasEntre(dDesde, dHasta) > tope);
  /* LA CLASE DEL ERROR ES `cg-mal`, NO `campo-mal`, y el porqué va aquí y no
     dentro del array de clases: ahí dentro el extractor lee las palabras del
     comentario como nombres de clase y las reporta como clases que nadie
     define. Este archivo ya lo tenía escrito unas líneas más abajo y aun así
     caí; lo cazó `verificar-entrega` al instante.

     `cg-mal` porque es la clase que el candado de la altura ya mide para este
     componente —eligió esa—, y porque viajaba en la hoja desde siempre SIN QUE
     NINGÚN COMPONENTE LA EMITIERA: invisible al candado de la promesa muerta,
     que solo mira unidades de dos clases o más. Emitirla PAGA esa deuda en vez
     de añadir otra. */
  const idError = `${id}-error`;
  /* El error del producto MANDA; el del tope aparece solo si no hay otro. Es la
     misma línea que `usarContador` del editor, no un criterio nuevo. */
  const elError = error ?? avisoTope ?? (excede
    ? `El rango no puede pasar de ${tope} ${tope === 1 ? 'día' : 'días'}. `
      + `Has elegido ${diasEntre(dDesde!, dHasta!)}.`
    : undefined);

  function elegir(d: Date) {
    // Fuera de alcance no se elige, venga del ratón o del teclado.
    if (fueraDeAlcance(d)) return;
    const s = iso(d);
    if (modo === 'desde') {
      const nuevoHasta = hasta && deIso(hasta) < d ? null : hasta;
      // Encadena al segundo extremo sin cerrar —es lo que se espera al elegir
      // un rango— PERO solo si el cambio quedó: ver `pedirRango`.
      pedirRango(s, nuevoHasta, () => setModo('hasta'));
      return;
    }
    // Elegir un «hasta» anterior al «desde» reinicia el rango en vez de
    // producir un rango invertido, que no significa nada.
    if (desde && d < deIso(desde)) {
      pedirRango(s, null, () => setModo('hasta'));
      return;
    }
    pedirRango(desde, s, () => cerrar());
  }

  function teclas(e: React.KeyboardEvent) {
    const salto: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    if (e.key in salto) {
      e.preventDefault();
      setFoco((f) => sumarDias(f, salto[e.key]));
      debeEnfocar.current = true;
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      // Principio y fin de la SEMANA, que es lo que dice el patrón.
      setFoco((f) => {
        const dow = (f.getDay() - primerDia + 7) % 7;
        return sumarDias(f, e.key === 'Home' ? -dow : 6 - dow);
      });
      debeEnfocar.current = true;
      return;
    }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      // Con Shift, un año. Sin Shift, un mes.
      const n = e.key === 'PageUp' ? -1 : 1;
      setFoco((f) => sumarMeses(f, e.shiftKey ? n * 12 : n));
      debeEnfocar.current = true;
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cerrar();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      elegir(foco);
    }
  }

  /** Las seis semanas de UN mes, con hueco donde no hay día. El catálogo pinta
   *  huecos (`.fc-vacio`) y no días del mes vecino: con dos meses a la vista,
   *  el mismo día saldría dos veces y no se sabría cuál vale. */
  const semanasDe = useMemo(() => (mes: Date) => {
    const primero = inicioDeMes(mes);
    const hueco = (primero.getDay() - primerDia + 7) % 7;
    const ultimo = finDeMes(mes).getDate();
    const celdas: (Date | null)[] = [
      ...Array.from({ length: hueco }, () => null),
      ...Array.from({ length: ultimo }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
    ];
    while (celdas.length % 7) celdas.push(null);
    return Array.from({ length: celdas.length / 7 }, (_, w) => celdas.slice(w * 7, w * 7 + 7));
  }, [primerDia]);

  const visibles = useMemo(
    () => Array.from({ length: meses }, (_, i) => sumarMeses(mesBase, i)),
    [mesBase, meses],
  );

  // La ventana se mueve solo cuando el foco se sale de ella.
  useEffect(() => {
    const f = new Date(foco.getFullYear(), foco.getMonth(), 1).getTime();
    const dentro = visibles.some((m) => inicioDeMes(m).getTime() === f);
    if (!dentro) setMesBase(inicioDeMes(foco));
  }, [foco, visibles]);

  /** R120 · con «desde» puesto y eligiendo «hasta», el rango que saldría si se
   *  pulsara donde está el ratón. Sin esto no se ve qué se está a punto de
   *  elegir hasta después de elegirlo. */
  /* Y SE RECORTA AL TECHO. Sin esto, con `maxDias` puesto el cursor pintaba un
     tramo más largo del que se puede elegir: el contrato dice que el tramo que
     se ve es el que se elegiría, y con el tope dejaba de serlo. */
  const sobreEnAlcance = sobre && techo && sobre > techo ? techo : sobre;
  const previo = modo === 'hasta' && dDesde && !dHasta && sobreEnAlcance && sobreEnAlcance > dDesde
    ? sobreEnAlcance : null;
  const finEfectivo = dHasta ?? previo;

  const dentroDelRango = (d: Date) =>
    !!(dDesde && finEfectivo && d > dDesde && d < finEfectivo);
  // Ini y fin por separado: cada extremo redondea SU lado (.fc-ini / .fc-fin).
  // Fundidos en una sola clase, el rango pierde dónde empieza y dónde acaba.
  const esIni = (d: Date) => !!(dDesde && mismoDia(d, dDesde));
  const esFin = (d: Date) => !!(finEfectivo && mismoDia(d, finEfectivo));

  const tituloMes = (m: Date) => `${MESES[m.getMonth()]} de ${m.getFullYear()}`;
  const cabecera =
    visibles.length === 1
      ? tituloMes(visibles[0])
      : visibles[0].getFullYear() === visibles[visibles.length - 1].getFullYear()
        ? `${MESES[visibles[0].getMonth()]} – ${tituloMes(visibles[visibles.length - 1])}`
        : `${tituloMes(visibles[0])} – ${tituloMes(visibles[visibles.length - 1])}`;

  function aplicarAtajo(a: AtajoRango) {
    const r = a.rango(hoy);
    const d = r.desde;
    const h = r.hasta;
    /* EL TOPE TAMBIÉN AQUÍ. Vivía solo en `elegir()`, así que el camino más
       rápido de la interfaz —pulsar «Este año» con un tope de siete días— lo
       saltaba entero y dejaba dentro un rango que el calendario no habría
       dejado construir a mano. Lo cazó una auditoría.
       Desde el añadido al R139 los que no caben ya NO SE PINTAN, así que por la
       interfaz esto no se alcanza. Se queda porque `rango` es código ajeno: uno
       que devuelva algo distinto en el filtro y en el clic —que lee un reloj,
       por ejemplo— metería por aquí un rango que el calendario prohíbe. */
    if (tope && diasEntre(d, h) > tope) {
      setAvisoTope(`«${a.texto}» son ${diasEntre(d, h)} días y el máximo es ${tope}.`);
      return;
    }
    setAvisoTope(null);
    pedirRango(iso(d), iso(h), () => {
      setMesBase(inicioDeMes(meses === 1 ? h : sumarMeses(h, -1)));
      setFoco(d);
      cerrar();
    });
  }

  /** El resumen que la hoja publica y nadie podía activar. Dice lo elegido en
   *  palabras: la línea de dos fechas ISO no se lee de un vistazo. */
  /* Las condiciones salen FUERA del array de clases. Dentro, el extractor lee
     `'desde'` y `'hasta'` de la comparación como si fueran nombres de clase, y
     las reporta como clases que nadie define. */
  const activoDesde = abierto && modo === 'desde';
  const activoHasta = abierto && modo === 'hasta';

  /**
   * R130.3 · SIN RANGO, EL RESUMEN CALLA — pero no desaparece.
   *
   * Decia «Sin rango elegido.» y era una tercera frase para lo mismo: los dos
   * disparadores ya dicen «Elegir fecha». Lo reporto Control Administrativos.
   *
   * De las dos salidas que proponian —una propiedad para apagarlo, o no pintar
   * nada— no se toma ninguna de las dos tal cual, y el motivo importa:
   *
   *  · Una propiedad no vale porque esta linea ES el anuncio al lector cuando
   *    se elige (regla 6). Apagarla seria dejar el componente sin decir lo que
   *    acaba de pasar, y eso no puede quedar a criterio de cada pantalla.
   *  · Y NO PINTAR NADA romperia el anuncio de la PRIMERA eleccion: una region
   *    viva creada en el momento no la anuncian la mayoria de lectores. Es la
   *    regla 0 de «Aviso temporal», que este sistema ya aprendio.
   *
   * Asi que el elemento se queda SIEMPRE en el arbol y lo que se vacia es su
   * texto. La region viva existe desde la carga, no se ve nada cuando no hay
   * nada, y `.fc-resumen:empty` le quita el margen para que no deje hueco.
   */
  const resumen = !desde
    ? ''
    : !hasta
      ? `Desde el ${enPalabras(deIso(desde))}. Falta la fecha final.`
      : `Del ${enPalabras(deIso(desde))} al ${enPalabras(deIso(hasta))}.`;

  return (
    <div className="fc-zona" ref={zona}>
      {/* Los dos disparadores NO son <Campo>, y es a proposito. Campo renderiza
          un <input>, y un input no abre un dialogo: esto tiene que SER un
          boton -aria-haspopup, aria-expanded, teclado de boton- y PARECER un
          campo. Se toma la superficie de .campo, que es estilo, no componente.
          Es la unica excepcion a la regla 1 de la politica, y esta aqui escrita
          para que se discuta si alguien la ve, no para que pase inadvertida. */}
      <div className="fc-campos" role="group" aria-label={titulo}>
        {/* R130.1 · LA ETIQUETA VA FUERA DEL RECUADRO, como en todos los demas
            campos del sistema. Estaba DENTRO, y era la unica que lo estaba:
            `Campo` compone `.campo-grupo` > `.campo-etiqueta` + `.campo`, con
            el rotulo encima de la caja. Puestos en la misma fila, el rotulo de
            uno salia arriba y el del otro dentro, y las cajas ni siquiera
            median lo mismo. Lo reporto Control Administrativos.
            La hoja YA lo preveia: `.fc-campos .cg{ width:172px }` viajaba en el
            paquete desde siempre y NINGUN producto podia activarla, porque el
            componente no emitia ningun `.cg` ahi dentro. Una promesa muerta que
            el candado no vio por ser un descendiente y no dos clases juntas.
            El rotulo se ata al boton con `aria-labelledby` —un `<label>` no
            nombra a un boton—, y el nombre accesible sigue siendo «Desde
            01/09/2026», que es lo que se leia antes. */}
        <div className="cg">
          <span className="cg-et" id={`${id}-e-desde`}>Desde</span>
          <button
            type="button"
            ref={modo === 'desde' ? disparador : undefined}
            className={['campo', 'fc-campo', activoDesde ? 'fc-activo' : '',
              elError ? 'cg-mal' : '']
              .filter(Boolean).join(' ')}
            disabled={deshabilitado}
            aria-invalid={elError ? true : undefined}
            /* El error describe a los DOS: es del par, no de un extremo. El
               `.fc-resumen` NO entra aquí — es una región viva y se leería dos
               veces. */
            aria-describedby={elError ? idError : undefined}
            aria-haspopup="dialog"
            aria-expanded={abierto && modo === 'desde'}
            aria-labelledby={`${id}-e-desde ${id}-v-desde`}
            onClick={() => (abierto && modo === 'desde' ? cerrar() : abrir('desde'))}
          >
            <span id={`${id}-v-desde`}>{desde ? enCorto(deIso(desde)) : 'Elegir fecha'}</span>
          </button>
        </div>
        {/* El guion entre los dos campos. La hoja lo entrega desde siempre y
            ningún producto lo emitía: los dos campos salían pegados, sin nada
            que dijera que son los dos extremos de una misma cosa. */}
        <span className="fc-guion" aria-hidden="true">
          <svg className="ic" viewBox="0 0 24 24" width="14" height="14" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
               strokeLinejoin="round" focusable="false">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
        <div className="cg">
          <span className="cg-et" id={`${id}-e-hasta`}>Hasta</span>
          <button
            type="button"
            ref={modo === 'hasta' ? disparador : undefined}
            className={['campo', 'fc-campo', activoHasta ? 'fc-activo' : '',
              elError ? 'cg-mal' : '']
              .filter(Boolean).join(' ')}
            disabled={deshabilitado}
            aria-invalid={elError ? true : undefined}
            /* El error describe a los DOS: es del par, no de un extremo. El
               `.fc-resumen` NO entra aquí — es una región viva y se leería dos
               veces. */
            aria-describedby={elError ? idError : undefined}
            aria-haspopup="dialog"
            aria-expanded={abierto && modo === 'hasta'}
            aria-labelledby={`${id}-e-hasta ${id}-v-hasta`}
            onClick={() => (abierto && modo === 'hasta' ? cerrar() : abrir('hasta'))}
          >
            <span id={`${id}-v-hasta`}>{hasta ? enCorto(deIso(hasta)) : 'Elegir fecha'}</span>
          </button>
        </div>
      </div>

      {abierto && (
        <div className="fc-cal" role="dialog" aria-modal="false" aria-label={`Elegir fecha ${modo}`}>
          <div className="fc-cal-cab">
            <Boton mini variante="terciaria"
              aria-label="Mes anterior"
              onClick={() => { setSobre(null); setMesBase((m) => sumarMeses(m, -1)); setFoco((f) => sumarMeses(f, -1)); debeEnfocar.current = true; }}>‹</Boton>
            {/* El cambio de mes se anuncia: sin esto, con lector de pantalla la
                rejilla cambia entera en silencio. */}
            <span className="fc-meses" id={`${id}-mes`} aria-live="polite">{cabecera}</span>
            <Boton mini variante="terciaria"
              aria-label="Mes siguiente"
              onClick={() => { setSobre(null); setMesBase((m) => sumarMeses(m, 1)); setFoco((f) => sumarMeses(f, 1)); debeEnfocar.current = true; }}>›</Boton>
          </div>

          {/* `.fc-cal-marco` reparte el cuerpo y el panel de periodos en dos
              columnas. La hoja lo entrega desde siempre; sin él, el panel caía
              debajo y el calendario perdía su forma. */}
          <div className="fc-cal-marco">
            <div
              className="fc-cal-cuerpo"
              ref={rejilla}
              onKeyDown={teclas}
              onMouseLeave={() => setSobre(null)}
            >
              {visibles.map((mes) => (
                <div key={`${mes.getFullYear()}-${mes.getMonth()}`}>
                  <div className="fc-mes-tit">{tituloMes(mes)}</div>
                  <div className="fc-dias" role="grid" aria-label={tituloMes(mes)}>
                    <div role="row" className="fc-sem">
                      {Array.from({ length: 7 }, (_, i) => {
                        const dow = (primerDia + i) % 7;
                        return (
                          <span role="columnheader" key={dow} aria-label={DIAS_LARGOS[dow]}>
                            {DIAS_CORTOS[dow]}
                          </span>
                        );
                      })}
                    </div>
                    {semanasDe(mes).map((semana, w) => (
                      <div role="row" key={w}>
                        {semana.map((d, i) => {
                          if (!d) {
                            return (
                              <span role="gridcell" key={`v${w}-${i}`}>
                                <span className="fc-d fc-vacio" />
                              </span>
                            );
                          }
                          const enFoco = mismoDia(d, foco);
                          const ini = esIni(d);
                          const fin = esFin(d);
                          const extremo = ini || fin;
                          const dentro = dentroDelRango(d);
                          const esPrevio = !!(previo && mismoDia(d, previo));
                          const lejos = fueraDeAlcance(d);
                          return (
                            <span role="gridcell" key={iso(d)} aria-selected={extremo || dentro}>
                              <button
                                type="button"
                                // Roving tabindex: UNO solo es alcanzable con Tab. Antes
                                // eran ~60 paradas seguidas.
                                tabIndex={enFoco ? 0 : -1}
                                className={[
                                  'fc-d',
                                  ini ? 'fc-ini' : '',
                                  fin ? 'fc-fin' : '',
                                  esPrevio ? 'fc-previo' : '',
                                  dentro ? 'fc-dentro' : '',
                                ].filter(Boolean).join(' ')}
                                /* `aria-disabled` y NO `disabled`: un día apagado de
                                   verdad sale del roving tabindex y las flechas dejan de
                                   recorrer la rejilla — quien navega con teclado se queda
                                   sin saber por qué un día no responde. Así conserva el
                                   foco, dice por qué en su nombre, y no hace nada. */
                                aria-disabled={lejos ? true : undefined}
                                // «hoy» es aria-current="date". Los extremos son
                                // aria-selected. El del catálogo los confundía.
                                aria-current={mismoDia(d, hoy) ? 'date' : undefined}
                                // El interior del rango se decía SOLO con color, que es
                                // SC 1.4.1. Ahora va en el nombre accesible.
                                aria-label={`${enPalabras(d)}${dentro ? ', dentro del rango' : ''}${extremo ? ', extremo del rango' : ''}`
                                  + (lejos ? `, fuera del máximo de ${tope} días` : '')}
                                onMouseEnter={() => setSobre(d)}
                                onFocus={() => setSobre(d)}
                                onClick={() => elegir(d)}
                              >
                                {d.getDate()}
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {atajosQueCaben.length > 0 && (
              <div className="fc-atajos">
                <span className="fc-atajos-tit" id={`${id}-per`}>Periodos</span>
                {atajosQueCaben.map((a) => (
                  <button
                    type="button"
                    key={a.texto}
                    className="fc-atajo"
                    onClick={() => aplicarAtajo(a)}
                  >
                    {a.texto}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="fc-cal-pie">
            <Boton mini variante="destructiva"
              /* LIMPIAR NO TIENE TOPE, y es deliberado: es el gesto que arregla
                 un rango que se pasó. Un tope que bloquea su propio remedio deja
                 a la persona encerrada. */
              onClick={() => { setAvisoTope(null); pedirRango(null, null, () => setModo('desde')); }}>
              Limpiar
            </Boton>
          </div>
        </div>
      )}

      {/* EL ERROR VA UNA VEZ, y es del PAR. Dentro de cada `.cg` saldría dos
          veces diciendo lo mismo, y lo que está mal no es un extremo: es el
          rango. Lleva su icono porque un renglón rojo suelto se confunde con
          una ayuda, y el color solo no dice que algo falla (SC 1.4.1). */}
      {elError && (
        <span id={idError} className="cg-error">
          <Icono nombre="alerta" />
          {elError}
        </span>
      )}

      {/* Lo elegido, en palabras. Dos fechas ISO no se leen de un vistazo, y
          esta línea es además la que anuncia el cambio al lector. */}
      <p className="fc-resumen" role="status">{resumen}</p>
    </div>
  );
}
