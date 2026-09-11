/**
 * SELECTOR CON BÚSQUEDA
 *
 * El patrón `combobox` de ARIA, escrito una vez. MMI-DS §9 lo señala como uno
 * de los tres casos donde el sistema SÍ acepta ayuda externa, porque a mano
 * produce fallos sistemáticos: la lista que no se anuncia, la flecha que mueve
 * el foco fuera del campo, el Escape que cierra el diálogo entero en vez de la
 * lista.
 *
 * SIN UMBRAL DE ACTIVACIÓN. Nada de «solo si hay más de N opciones». Lo probó
 * Control Administrativos V2.0 y molesta: el control cambia de forma según
 * cuántos datos haya ese día, así que la misma pantalla se usa distinto el
 * lunes y el martes. Si el selector busca, busca siempre.
 *
 * DOS SITIOS DONDE BUSCAR (R118). Con `modo="navegador"` filtra las `opciones`
 * que le den; con `modo="servidor"` no filtra nada y pregunta con `onBuscar`.
 * La palabra es la misma que en `TablaDatos` a propósito: el vocabulario del
 * sistema ya nombraba esta distinción y no hacía falta inventarle otro.
 *
 * Los estilos vienen de `componentes.css` con las clases del catálogo
 * —`sel-caja`, `sel-in`, `sel-lista`, `sel-op`—, que es el mismo control que se
 * ve ahí. No se inventa ninguna.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icono } from './Icono';

export type OpcionBusqueda = { valor: string; texto: string; ayuda?: string };

export type SelectorBusquedaProps = {
  /** Obligatoria y visible. Igual que en `Campo`: el placeholder es ejemplo de
   *  formato, nunca etiqueta —desaparece al escribir y con él la pregunta—. */
  etiqueta: string;
  /**
   * En `navegador`, TODAS: son las que se filtran.
   *
   * En `servidor` son las de PARTIDA — lo que se ve antes de teclear nada, que
   * es donde van las recientes o las frecuentes. Al escribir, manda lo que
   * devuelva `onBuscar`; al borrar, se vuelve a estas.
   */
  opciones: OpcionBusqueda[];
  valor: string | null;
  onCambio: (valor: string | null) => void;
  /** Ejemplo de formato, no etiqueta. */
  placeholder?: string;
  /**
   * R100 · La lupa dentro del campo. **Por omisión no está**, y con eso este
   * componente se ve como un `Selector`.
   *
   * La lupa obliga a sangrar el texto 32 px mientras el resto de los campos
   * empieza en 8, así que en una columna de formulario el suyo se salía de la
   * alineación — lo reportó Control Administrativos con esas palabras: «se ve
   * distinto a los demás».
   *
   * Se enciende donde **de verdad se busca** y no se elige: el buscador de una
   * tabla, una caja de búsqueda global. Elegir de una lista es el mismo gesto
   * que en el `Selector`, y que además se pueda filtrar escribiendo es un
   * detalle de interacción, no otra clase de campo. Si hace falta decirlo, se
   * dice en el `placeholder`, que es texto y no roba sangrado.
   */
  conLupa?: boolean;
  ayuda?: string;
  error?: string;
  /**
   * R115 · QUÉ DECIR CUANDO NO HAY COINCIDENCIAS — y recibe **lo tecleado**.
   *
   * Hasta la v1.94.0 era una cadena, y su valor por omisión era «No hay
   * coincidencias»: exactamente el patrón que el catálogo enseña **como el
   * ejemplo malo** —*«No hay datos — callejón: ni dice qué se buscó ni qué
   * hacer»*—. La demostración entregaba dos líneas, 64,3 px y un titular en
   * negrita; el componente entregaba una línea gris de 44,15 px.
   *
   * Sigue admitiendo una cadena, así que **nadie tiene que cambiar nada**. Con
   * una función recibe lo tecleado y puede decir qué se buscó, que es lo que
   * convierte un callejón en una salida.
   */
  textoVacio?: ReactNode | ((texto: string) => ReactNode);
  deshabilitado?: boolean;
  /**
   * R103 · CÓMO SE VUELVE A «SIN ELEGIR». Texto de la opción de vaciar, igual
   * que en `Selector`. **Si no se pasa, no se puede vaciar** — y así se queda
   * lo que ya está en producción.
   *
   * Lo reportó Control Administrativos V2.0, y el defecto no era la falta:
   * era la MENTIRA. `onCambio` solo salía de `elegir()`, siempre con un valor
   * real, así que este componente **jamás emitía `null`** aunque su firma
   * dijera `(valor: string | null) => void`. El tipo documentaba un camino que
   * no existía, y eso lo bloqueaba en cualquier campo opcional.
   *
   * Se resuelve con **el mismo gesto que el `Selector`** —su opción vacía— y
   * no con una prop booleana, por dos razones: el vocabulario ya existe y se
   * llama igual, y obliga a NOMBRAR el estado vacío. «Todos», «Sin asignar» y
   * «Cualquiera» no significan lo mismo, y un `permiteVaciar` los borra todos
   * en un «— Ninguno —» genérico que no dice qué pasa al elegirlo.
   *
   * Además, con esto puesto, **Retroceso sobre el campo vacío también vacía**
   * —el atajo que pidieron—: es acelerador, no la única puerta. Un gesto que
   * solo existe en el teclado deja fuera a quien usa el ratón.
   */
  vacio?: string;
  /**
   * Oculta la etiqueta A LA VISTA, no al lector. Lo mismo que en `Campo` y
   * `Selector`, y faltaba solo aquí: sin ella, este control bajo una cabecera
   * de columna anuncia el rótulo dos veces. Era el «hueco 16» de Control
   * Administrativos, que se estaba apañando con `Selector` para evitarlo.
   *
   * Sigue siendo obligatoria: esto no es una puerta trasera para quedarse sin
   * etiqueta, es la diferencia entre no mostrarla y no tenerla.
   */
  etiquetaOculta?: boolean;
  /**
   * R118 · DÓNDE SE BUSCA.
   *
   *   `navegador` — sobre las `opciones` recibidas, sin tildes ni mayúsculas.
   *                 Vale cuando `opciones` trae TODO.
   *   `servidor`  — el componente NO filtra: pregunta con `onBuscar` y pinta
   *                 lo que le devuelvan.
   *
   * Es la misma palabra que en `TablaDatos`, y por la misma razón: filtrar en
   * el navegador lo que el servidor ya recortó filtra SOLO el trozo que llegó.
   * El resultado parece completo y no lo está, que es la clase de mentira que
   * nadie comprueba porque no falla.
   *
   * El catálogo prometía esto desde antes de que existiera —su tabla «Cuál de
   * los dos» manda al servidor a partir de «cientos o miles»— y no había con
   * qué cumplirlo: el componente solo sabía `includes` sobre un array fijo.
   */
  modo?: 'navegador' | 'servidor';
  /**
   * R118 · LA CONSULTA. Obligatoria con `modo="servidor"`.
   *
   * Devuelve una promesa con las opciones. **El componente se queda con el
   * ciclo entero** —el rebote, la cancelación de la consulta anterior y el
   * descarte de las respuestas que llegan fuera de orden— y por eso entrega
   * una `AbortSignal` que hay que pasarle a `fetch`.
   *
   * No es comodidad, es que la carrera es un fallo SILENCIOSO: se teclea
   * «ana», la respuesta de «an» llega después, y la lista enseña los
   * resultados de otra búsqueda sin que nada falle ni avise. Dejarlo en cada
   * producto es repartir el mismo defecto tantas veces como pantallas haya —
   * el mismo argumento por el que §9 acepta ayuda externa justo en este patrón
   * y no en los demás.
   *
   * La función se lee por referencia viva, así que **puede escribirse en línea**
   * sin volver a disparar la consulta en cada dibujado.
   *
   * Con el campo vacío no se pregunta nada: se enseñan las `opciones`.
   */
  onBuscar?: (texto: string, senal: AbortSignal) => Promise<OpcionBusqueda[]>;
  /**
   * Cuánto se espera desde la última tecla antes de preguntar, en ms.
   *
   * 300 no es un número redondo puesto a ojo: es el mismo umbral que publica
   * el catálogo en «Cargando: esqueleto, giro o nada». Preguntar por cada
   * tecla son seis consultas para escribir «Quispe» y cinco se tiran.
   */
  rebote?: number;
  /**
   * R118 · QUÉ DECIR CUANDO LA CONSULTA FALLA. Recibe lo tecleado.
   *
   * NO se reaprovecha `textoVacio`: «no hay resultados» y «no se pudo
   * preguntar» son cosas distintas y mandan a sitios distintos. Con la primera
   * se prueba con menos letras; con la segunda no hay nada que reescribir y
   * decirle a alguien que pruebe otra cosa es mandarlo a dar vueltas. Es la
   * misma separación que `EstadoPantalla` hace entre `sin-resultados` y
   * `error`, y por el mismo motivo.
   *
   * La fila es pulsable y **reintenta** —con el ratón y con Enter—, porque
   * ningún estado del sistema es un callejón sin salida.
   */
  textoFallo?: ReactNode | ((texto: string) => ReactNode);
  /**
   * R103 · QUÉ HACER CUANDO NO EXISTE. Recibe **lo tecleado** y, si se pasa,
   * la fila de «no hay coincidencias» pasa a ser pulsable: es el «Crear "…"»
   * dentro del propio selector, sin componer nada por fuera.
   *
   * Se activa con el ratón y **con Enter**, porque sin lista no hay opción
   * activa que Enter pudiera elegir: esa tecla estaba libre justo ahí.
   *
   * El componente **no crea nada** —no sabe qué es «crear» en cada producto—:
   * avisa con el texto y el producto decide. Lo normal es abrir su alta y,
   * cuando vuelva con el registro hecho, meterlo en `opciones` y pasarlo por
   * `valor`.
   */
  onCrear?: (texto: string) => void;
  /** Qué se lee en esa fila cuando `onCrear` está puesto. Recibe lo tecleado
   *  para poder decir exactamente qué se va a crear. */
  textoCrear?: (texto: string) => string;
};

/** Sin tildes y en minúsculas: `perez` tiene que encontrar «Pérez Salazar».
 *  Es la misma normalización que usa la tabla, y es contrato de interfaz: si el
 *  buscador del servidor no la hace, el componente se comporta distinto y nadie
 *  sabe por qué. */
const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** R118 · Desde que la consulta SALE hasta que se pinta el esqueleto. Es el
 *  mismo umbral de la tabla «Cargando: esqueleto, giro o nada» del catálogo:
 *  bajo 300 ms no se enseña nada porque un parpadeo se percibe como un fallo. */
const UMBRAL = 300;

export function SelectorBusqueda({
  etiqueta,
  opciones,
  valor,
  onCambio,
  placeholder = 'Escribe para buscar',
  ayuda,
  error,
  textoVacio = (t: string) =>
    t
      ? (<><strong>Sin resultados para «{t}».</strong><br />Prueba con menos letras.</>)
      : 'No hay coincidencias',
  deshabilitado = false,
  conLupa = false,
  vacio,
  etiquetaOculta = false,
  onCrear,
  textoCrear = (t) => `Crear «${t}»`,
  modo = 'navegador',
  onBuscar,
  rebote = 300,
  textoFallo = (t: string) => (
    <>
      <strong>No se pudo buscar{t ? ` «${t}»` : ''}.</strong>
      <br />
      Pulsa aquí para reintentar.
    </>
  ),
}: SelectorBusquedaProps) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  /* ── R118 · la búsqueda contra el servidor ───────────────────────────── */

  const remoto = modo === 'servidor';
  const [remotas, setRemotas] = useState<OpcionBusqueda[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [tardando, setTardando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [intento, setIntento] = useState(0);

  if (process.env.NODE_ENV !== 'production' && remoto && !onBuscar) {
    console.error(
      'SelectorBusqueda: con modo="servidor" hace falta `onBuscar`. Sin él el ' +
      'control no pregunta nada y la lista se queda en las opciones de partida ' +
      'pase lo que pase — parece que busca y no busca.',
    );
  }

  /** Por referencia viva. Si `onBuscar` entrara en las dependencias del efecto,
   *  una función escrita en línea —que es como se escribe— cambiaría de
   *  identidad en cada dibujado y la consulta se repetiría sin parar. Es la
   *  trampa de este patrón, y se paga en peticiones al servidor ajeno. */
  const consultar = useRef(onBuscar);
  useEffect(() => { consultar.current = onBuscar; });

  /** El fallo se borra AQUÍ y no dentro del temporizador: si no, se pulsaba
   *  «Pulsa aquí para reintentar» y durante los 300 ms del rebote no pasaba
   *  nada visible — la misma fila de fallo seguía ahí y se leía como un botón
   *  muerto. */
  const reintentar = useCallback(() => {
    setFallo(false);
    setIntento((n) => n + 1);
  }, []);

  /** R103 (corregido) · lo tecleado que sobrevive a «Crear» hasta que haya
   *  elección. Se suelta en cuanto el producto responde con un `valor`, o en
   *  cuanto la persona vuelve a escribir: a partir de ahí manda lo nuevo. */
  const [pendiente, setPendiente] = useState<string | null>(null);
  useEffect(() => { if (valor !== null) setPendiente(null); }, [valor]);

  /**
   * R118 · LA ELECCIÓN TIENE QUE SOBREVIVIR A LA SIGUIENTE BÚSQUEDA.
   *
   * `elegida` salía de buscar `valor` dentro de `opciones`, y contra el
   * servidor eso se rompe solo: se elige a Ana, se teclea otra cosa, la lista
   * se reemplaza por la respuesta nueva y Ana ya no está en ninguna parte. El
   * campo se quedaba EN BLANCO con un valor puesto.
   *
   * Es la misma familia que el `null` que la firma prometía y no emitía
   * (R103) — el estado diciendo una cosa y la pantalla otra—, y por eso se
   * arregla aquí dentro y no pidiéndole al producto que pase el texto: lo que
   * el producto no puede olvidarse de hacer es lo que no se le pide.
   *
   * Se recuerda la última opción vista que casaba con `valor`. No es una caché
   * de rendimiento: es la única copia que queda del texto de algo que ya no
   * está en ninguna lista.
   */
  const visibles = useMemo(
    () => (remoto && remotas ? [...opciones, ...remotas] : opciones),
    [remoto, opciones, remotas],
  );
  const hallada = visibles.find((o) => o.valor === valor) ?? null;
  const recordada = useRef<OpcionBusqueda | null>(null);
  useEffect(() => {
    if (hallada) recordada.current = hallada;
    else if (valor === null) recordada.current = null;
  }, [hallada, valor]);
  const elegida =
    hallada ?? (recordada.current?.valor === valor ? recordada.current : null);

  /**
   * LA CONSULTA, con su rebote y su cancelación.
   *
   * Tres relojes y no uno, y cada uno responde a algo distinto:
   *
   *   · `rebote` (300 ms) — desde la última tecla hasta preguntar. Sin él se
   *     pregunta seis veces para escribir «Quispe» y cinco respuestas se tiran.
   *   · `UMBRAL` (300 ms) — desde que la consulta SALE hasta pintar el
   *     esqueleto. Arranca al salir la petición y no al teclear, que es la
   *     diferencia entre «bajo 300 ms no se enseña nada» y enseñarlo siempre.
   *   · el `AbortController` — no es un reloj, es la salida. Cancela la
   *     consulta anterior en cuanto hay una nueva.
   *
   * Y sobre la cancelación va `vivo`, que es lo que de verdad cierra la
   * carrera: abortar pide que se pare, no garantiza que no llegue. Una
   * respuesta ya en vuelo puede resolverse igual, y sin esta bandera pintaría
   * los resultados de una búsqueda que ya nadie está haciendo.
   */
  useEffect(() => {
    if (!remoto) return;
    // Al CERRAR se limpia el estado de la consulta. Antes se salía por el
    // `return` de arriba sin reponer nada, así que un Escape con el esqueleto
    // puesto dejaba `aria-busy="true"` sobre un control cerrado y ocioso — y al
    // volver a abrir, el esqueleto aparecía instantáneo.
    if (!abierto) {
      setBuscando(false);
      setTardando(false);
      return;
    }
    const q = texto.trim();
    if (!q) {
      setRemotas(null);
      setBuscando(false);
      setTardando(false);
      setFallo(false);
      return;
    }

    let vivo = true;
    let umbral: ReturnType<typeof setTimeout> | undefined;
    const mando = new AbortController();

    const lanzar = setTimeout(() => {
      const fn = consultar.current;
      if (!fn || !vivo) return;
      setBuscando(true);
      setFallo(false);
      umbral = setTimeout(() => { if (vivo) setTardando(true); }, UMBRAL);

      /**
       * APAGAR EL RELOJ DEL UMBRAL AL TERMINAR, y no solo en la limpieza.
       *
       * Sin esto, contra un servidor rápido —el caso normal— el reloj seguía
       * vivo después de responder y disparaba `tardando` a los 300 ms con la
       * consulta ya resuelta. No se veía nada entonces, pero dejaba el estado
       * sucio: **a la siguiente tecla el esqueleto salía con umbral cero**, que
       * es exactamente el parpadeo por pulsación que la regla 20 prohíbe. De la
       * segunda consulta en adelante, el umbral no existía.
       */
      const rematar = () => {
        if (umbral) clearTimeout(umbral);
        setBuscando(false);
        setTardando(false);
      };

      Promise.resolve(fn(q, mando.signal)).then(
        (ops) => {
          if (!vivo) return;
          setRemotas(Array.isArray(ops) ? ops : []);
          rematar();
        },
        (e: unknown) => {
          // Abortar es lo que hacemos NOSOTROS al teclear otra letra: no es un
          // fallo de nadie y pintar un error ahí sería mentir sobre el servidor.
          if (!vivo || mando.signal.aborted) return;
          /**
           * PERO UN `AbortError` QUE NO ES NUESTRO SÍ HAY QUE REMATARLO.
           *
           * Si el producto cancela con su propio controlador —cambio de ruta,
           * `AbortSignal.any`— la señal nuestra no está abortada y `vivo` sigue
           * en true. Antes se salía por `return` sin tocar nada: `buscando` se
           * quedaba en true para siempre, el umbral disparaba, y el control
           * quedaba con esqueleto eterno, `aria-busy` eterno y SIN fila de
           * reintento. Un callejón sin salida, que es justo lo que este sistema
           * dice no tener.
           */
          if (e instanceof Error && e.name === 'AbortError') { rematar(); return; }
          setFallo(true);
          rematar();
        },
      );
    }, rebote);

    return () => {
      vivo = false;
      clearTimeout(lanzar);
      if (umbral) clearTimeout(umbral);
      mando.abort();
    };
  }, [remoto, abierto, texto, rebote, intento]);

  /** El esqueleto solo si la consulta pasa del umbral. Bajo 300 ms no se
   *  enseña nada, que es lo que publica el catálogo —«un parpadeo se percibe
   *  como un fallo»—; y una lista que parpadea por cada tecla es el peor sitio
   *  posible para tenerlo. */
  const esperando = remoto && buscando && tardando;

  // Con la lista cerrada se muestra lo ELEGIDO, no lo que se tecleó. Dejar el
  // texto a medias hace creer que hay un filtro puesto que no existe.
  /**
   * R103 (corregido) · LO QUE SE VE CON LA LISTA CERRADA.
   *
   * Con la lista cerrada se muestra lo ELEGIDO. Pero «Crear» no elige —el alta
   * es del producto y puede tardar o cancelarse— así que al cerrar tras pulsarlo
   * no había nada que mostrar y **el campo salía en blanco**: exactamente lo que
   * R103 dice que se evitó por diseño. El comentario de `crear()` afirmaba «NO
   * se cierra ni se limpia» y la línea siguiente cerraba.
   *
   * Ahora lo tecleado sobrevive al cierre hasta que llegue una elección de
   * verdad. Quien abra el alta, la cancele y vuelva, encuentra el nombre donde
   * lo dejó.
   */
  const mostrado = abierto ? texto : elegida?.texto ?? pendiente ?? '';

  const filtradas = useMemo(() => {
    if (!abierto || !texto.trim()) return opciones;
    /* En `servidor` el componente NO filtra. Volver a filtrar lo que el
       servidor ya recortó esconde lo que devolvió a propósito —una coincidencia
       aproximada, un alias, un DNI que no se parece al nombre— y deja al
       buscador contradiciéndose a sí mismo sin que nada falle. */
    if (remoto) return fallo ? [] : remotas ?? [];
    const q = normalizar(texto);
    return opciones.filter((o) => normalizar(o.texto).includes(q));
  }, [remoto, remotas, fallo, opciones, texto, abierto]);

  /**
   * R103 · LAS FILAS DE LA LISTA, que no son solo las opciones.
   *
   * La de vaciar va PRIMERA y solo cuando hay algo que vaciar. No se filtra al
   * escribir —es un mando, no un dato—, pero se retira en cuanto hay texto:
   * ofrecer «Todos» mientras se busca «Ancash» no significa nada, y encima
   * empujaría la primera coincidencia fuera del sitio donde el dedo ya va.
   */
  const filas = useMemo(() => {
    const ops = filtradas.map((o) => ({ tipo: 'opcion' as const, o }));
    const sePuedeVaciar = vacio !== undefined && valor !== null && !texto.trim();
    return sePuedeVaciar ? [{ tipo: 'vaciar' as const }, ...ops] : ops;
  }, [filtradas, vacio, valor, texto]);

  /** Sin coincidencias y con `onCrear`, la fila vacía deja de ser un cartel. */
  /* R118 · ni mientras se busca ni sobre un fallo. Ofrecer «Crear «Ana»»
     porque la respuesta no ha llegado todavía es invitar a dar de alta a
     alguien que ya existe; y ofrecerlo cuando la consulta se cayó es peor,
     porque ahí no se sabe nada de nada. */
  const puedeCrear =
    !!onCrear && filas.length === 0 && !!texto.trim() && !buscando && !fallo;

  /** R115 · el texto del vacío admite cadena o función de lo tecleado. Se
   *  resuelve aquí para que el marcado no tenga que saber cuál de las dos es. */
  const vacioMostrado =
    typeof textoVacio === 'function' ? textoVacio(texto.trim()) : textoVacio;

  /** R118 · igual que el del vacío: cadena o función de lo tecleado. */
  const falloMostrado =
    typeof textoFallo === 'function' ? textoFallo(texto.trim()) : textoFallo;

  // El índice activo no puede quedarse fuera de una lista que encogió — y con
  // el servidor la lista cambia sin que nadie toque el teclado.
  useEffect(() => { setActivo(0); }, [texto, abierto, remotas, fallo]);

  // Cerrar al pulsar fuera. Sin esto la lista se queda abierta sobre otra cosa.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  /**
   * Cerrar dejando el foco donde estaba. Lo comparten elegir y vaciar.
   *
   * R115 · `devolverFoco` existe por **Tab**. El catálogo publica que salir del
   * campo con una opción marcada la elige, y con el foco devuelto a la fuerza
   * el Tab quedaba anulado: se elegía y el foco volvía al mismo campo del que
   * la persona estaba saliendo. Al elegir con ratón o con Enter sí se devuelve,
   * porque ahí nadie ha pedido irse.
   */
  function cerrarTras(nuevo: string | null, devolverFoco = true) {
    onCambio(nuevo);
    setAbierto(false);
    setTexto('');
    if (devolverFoco) campo.current?.focus();
  }

  function elegir(o: OpcionBusqueda, devolverFoco = true) {
    cerrarTras(o.valor, devolverFoco);
  }

  /** R103 · el camino que la firma prometía y no existía. */
  function vaciarEleccion(devolverFoco = true) {
    cerrarTras(null, devolverFoco);
  }

  /** R115 · una fila cualquiera de la lista, elegida por el mismo camino sea
   *  cual sea su tipo. Lo comparten Enter y Tab. */
  function elegirFila(f: (typeof filas)[number], devolverFoco = true) {
    if (f.tipo === 'vaciar') vaciarEleccion(devolverFoco);
    else elegir(f.o, devolverFoco);
  }

  function crear() {
    const t = texto.trim();
    onCrear?.(t);
    // Se cierra la lista —ya no hay nada que elegir en ella— pero NO se limpia
    // lo tecleado: crear es del producto y puede tardar o cancelarse, y dar por
    // hecho un alta que quizá no ocurre dejaría el campo en blanco a quien
    // vuelve de cancelar. `pendiente` es lo que lo sostiene.
    setPendiente(t);
    setAbierto(false);
  }

  function alTeclado(e: React.KeyboardEvent<HTMLInputElement>) {
    /**
     * R115 · LAS DOS FLECHAS ABREN, Y LAS DOS CICLAN.
     *
     * Abrir con la tecla ya lo hacía Abajo —si solo moviera, con la lista
     * cerrada no pasaría nada y el control parecería muerto—, pero **Arriba
     * no**: era la misma tecla muerta, solo que en la otra dirección. El
     * catálogo publica las dos juntas en su tabla de teclado y las dos abren.
     *
     * Y ciclan, que es lo que el catálogo demuestra desde siempre. Topar en el
     * extremo obliga a recorrer la lista entera para llegar a la última, y en
     * un selector con búsqueda la última suele estar a una tecla de la primera.
     */
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!abierto) { setAbierto(true); return; }
      if (!filas.length) return;
      const abajo = e.key === 'ArrowDown';
      setActivo((i) => (abajo ? i + 1 : i - 1 + filas.length) % filas.length);
      return;
    }
    /** R115 · Inicio y Fin. Estaban en la tabla del catálogo y no existían. */
    if ((e.key === 'Home' || e.key === 'End') && abierto && filas.length) {
      e.preventDefault();
      setActivo(e.key === 'Home' ? 0 : filas.length - 1);
      return;
    }
    if (e.key === 'Enter' && abierto) {
      e.preventDefault();
      /* R118 · sobre el fallo, Enter REINTENTA. La fila es lo único que hay en
         la lista, así que la tecla está libre por el mismo motivo por el que lo
         estaba para «Crear» — y un estado al que solo se sale con el ratón deja
         fuera a quien no lo usa. */
      if (remoto && fallo) { reintentar(); return; }
      // Mientras la consulta está en vuelo no hay nada que elegir todavía, y
      // Enter no puede elegir la respuesta anterior a lo que se está viendo.
      if (esperando) return;
      // R103 · sin lista no hay opción activa que Enter pudiera elegir, así que
      // ahí la tecla está libre y es donde cae «Crear».
      if (puedeCrear) { crear(); return; }
      const f = filas[activo];
      if (!f) return;
      elegirFila(f);
      return;
    }
    /**
     * R103 · RETROCESO SOBRE EL CAMPO VACÍO VACÍA LA ELECCIÓN. El atajo que
     * pidió Control Administrativos, y solo cuando `vacio` está puesto: es el
     * mismo permiso, expresado con la misma prop.
     *
     * «Vacío» es lo TECLEADO, no lo que se ve: con la lista cerrada el campo
     * enseña lo elegido, y ahí `texto` está en blanco. Es el gesto de borrar
     * una ficha, el mismo que hace cualquier campo de etiquetas.
     */
    if (e.key === 'Backspace' && vacio !== undefined && texto === '' && valor !== null) {
      e.preventDefault();
      vaciarEleccion();
      return;
    }
    if (e.key === 'Escape') {
      // Escape cierra LA LISTA y no se propaga: dentro de un diálogo, dejarlo
      // subir cierra el diálogo entero y se pierde lo escrito.
      if (abierto) { e.preventDefault(); e.stopPropagation(); setAbierto(false); }
      return;
    }
    /**
     * R115 · TAB ELIGE LO MARCADO. Lo publica el catálogo —«sale del campo; si
     * había una marcada, la elige»— y el componente solo cerraba: `onCambio` no
     * se llamaba ni una vez. Quien teclea, ve su coincidencia marcada y tabula
     * al siguiente campo, **se llevaba el campo vacío**.
     *
     * NO dispara «crear»: salir de un campo no es pedir un alta, y por eso sin
     * filas esto solo cierra. Y no se devuelve el foco: la persona se va.
     */
    if (e.key === 'Tab' && abierto) {
      const f = filas[activo];
      if (f) { elegirFila(f, false); return; }
      setAbierto(false);
    }
  }

  const idLista = `${id}-lista`;
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;

  return (
    <div className="campo-grupo" ref={caja}>
      <label
        className={['campo-etiqueta', etiquetaOculta ? 'sr-solo' : ''].filter(Boolean).join(' ')}
        htmlFor={id}
        id={`${id}-et`}
      >
        {etiqueta}
      </label>

      {/* `.sel` es el ancla. Faltaba, y sin ella la lista —que es
          `position: absolute`— no encontraba antepasado posicionado y se
          colocaba contra el viewport: se desplegaba fuera de la pantalla.
          El catálogo sí la emite; al portar el componente se perdió.
          Lo encontró Control Administrativos V2.0, con las coordenadas medidas. */}
      <div className="sel">
        {/* R115 · `abierta` faltaba, y con ella la hoja no podía girar el
            chevron: `.sel-caja.abierta .sel-chev .ic` viajaba en el paquete y
            NINGÚN producto podía activarla. Medido: el catálogo respondía
            `matrix(-1,0,0,-1,0,0)` y el componente `none`. Es la misma familia
            que `.sel-op.activa` de la v1.83.0 — una clase que la hoja estiliza
            y el React no emite jamás. */}
        <div className={['sel-caja', conLupa ? 'sel-con-lupa' : '', abierto ? 'abierta' : '']
          .filter(Boolean).join(' ')}>
        {/* El chevron dice «esto se despliega» y va siempre — es lo que iguala
            este control con el `Selector`. La lupa dice «aquí se busca» y solo
            va cuando `conLupa`: en un formulario, su sangrado de 32 px sacaba
            este campo de la alineación de los demás (R100). */}
        {conLupa && <span className="sel-lupa" aria-hidden="true"><Icono nombre="lupa" /></span>}
        <input
          id={id}
          ref={campo}
          className={['campo', 'sel-in', error ? 'campo-mal' : ''].filter(Boolean).join(' ')}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={abierto && filas[activo] ? `${id}-op-${activo}` : undefined}
          aria-invalid={error ? true : undefined}
          // R118 · mientras se busca, el control está OCUPADO. Sin esto el
          // lector de pantalla anuncia una lista vacía y da por hecho que no
          // hay resultados, que es lo contrario de lo que está pasando.
          aria-busy={esperando || undefined}
          aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
          autoComplete="off"
          placeholder={placeholder}
          disabled={deshabilitado}
          value={mostrado}
          onChange={(e) => { setPendiente(null); setTexto(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTeclado}
        />
        <span className="sel-chev" aria-hidden="true"><Icono nombre="chevron" /></span>
        </div>

        <ul className="sel-lista" id={idLista} role="listbox" aria-labelledby={`${id}-et`} hidden={!abierto}>
        {esperando ? (
          /* R118 · ESQUELETO, NO UN GIRO. Lo manda la tabla «Cargando:
             esqueleto, giro o nada» del catálogo: el giro es «el último
             recurso, no el primero» y solo vale cuando no se conoce la forma de
             lo que viene. Aquí se conoce —son filas de una lista— y tres
             renglones reservan el sitio para que no salte al llegar.

             `.esqueleto` ya existe y ya viaja en el paquete, así que se
             reutiliza: la regla 1 de la política dice que un componente nuevo
             se arma con lo que hay, y esto vale también para una clase. */
          <li className="sel-cargando">
            <span className="esqueleto" />
            <span className="esqueleto" />
            <span className="esqueleto" />
            <span className="sr-solo">Buscando…</span>
          </li>
        ) : remoto && fallo ? (
          /* R118 · el fallo de la consulta es PULSABLE y reintenta. Ningún
             estado del sistema es un callejón sin salida, y aquí la salida no
             puede ser «prueba con menos letras»: no hay nada que reescribir. */
          <li
            id={`${id}-op-0`}
            className="sel-op sel-fallo marcado"
            role="option"
            aria-selected={false}
            onMouseDown={(e) => { e.preventDefault(); reintentar(); }}
          >
            <span className="sel-op-txt">{falloMostrado}</span>
          </li>
        ) : filas.length === 0 ? (
          puedeCrear ? (
            /* R103 · la fila de «no hay» deja de ser un cartel y pasa a ser el
               camino. Sigue siendo `option` porque está dentro del listbox y
               se elige con Enter, como cualquier otra. */
            <li
              id={`${id}-op-0`}
              className="sel-op marcado"
              role="option"
              aria-selected={false}
              onMouseDown={(e) => { e.preventDefault(); crear(); }}
            >
              <span className="sel-op-txt">{textoCrear(texto.trim())}</span>
            </li>
          ) : (
            <li className="sel-vacio">{vacioMostrado}</li>
          )
        ) : (
          filas.map((f, i) => f.tipo === 'vaciar' ? (
            /* R103 · vaciar la elección. Va DENTRO de la lista y como una
               opción más: es el mismo gesto que la opción vacía del
               `Selector`, y así se alcanza con el ratón y con las flechas.
               El atajo de Retroceso es un acelerador, no la única puerta. */
            <li
              key="__vaciar"
              id={`${id}-op-${i}`}
              className={['sel-op', i === activo ? 'marcado' : ''].filter(Boolean).join(' ')}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => { e.preventDefault(); vaciarEleccion(); }}
              onMouseEnter={() => setActivo(i)}
            >
              <span className="sel-op-txt">{vacio}</span>
            </li>
          ) : (
            <li
              key={f.o.valor}
              id={`${id}-op-${i}`}
              // `marcado` y no `activa`: es LA clase que la hoja estiliza
              // (.sel-op.marcado). Con `activa` la opción resaltada por
              // teclado no se pintaba en ningún producto — y el candado no lo
              // vio porque .pgn-btn.activa declara «activa» en otra familia.
              className={['sel-op', i === activo ? 'marcado' : ''].filter(Boolean).join(' ')}
              role="option"
              aria-selected={f.o.valor === valor}
              // `mousedown` y no `click`: el clic llega después del blur, y para
              // entonces la lista ya se cerró y la opción no existe.
              onMouseDown={(e) => { e.preventDefault(); elegir(f.o); }}
              onMouseEnter={() => setActivo(i)}
            >
              {/* R115 · EL NOMBRE Y SU AYUDA, DENTRO DE UNA ENVOLTURA.
                  `.sel-op` reparte con `space-between`: con el visto, el nombre
                  y la ayuda sueltos eran TRES hijos y el del medio —el nombre—
                  se iba al centro. Medido: la fila elegida empezaba su texto en
                  98,3 px y sus vecinas en 8. Con la envoltura vuelven a ser dos
                  y la lista deja de salir escalonada. */}
              <span className="sel-op-txt">
                {f.o.texto}
                {f.o.ayuda && <span className="sel-notas">{f.o.ayuda}</span>}
              </span>
              {/* R115 · el visto va DETRÁS, que es donde lo pone el catálogo.
                  Delante lo mandaba al borde izquierdo: 8 px contra los 306,4
                  de la demostración, 298,4 px de diferencia en la misma lista.
                  No lo decidía el CSS —las dos hojas declaran lo mismo—, lo
                  decidía el orden de los hijos.
                  `aria-selected` ya se lo dice al lector; esto se lo dice a la
                  vista, que no lee atributos. */}
              {f.o.valor === valor && (
                <span className="sel-check"><Icono nombre="visto" /></span>
              )}
            </li>
          ))
          )}
        </ul>
      </div>

      {error && (
        /* R53 · el error lleva SU ICONO, como en el catalogo: un renglon rojo
           suelto se confunde con una ayuda, y el color no basta (SC 1.4.1). */
        <span id={idError} className="campo-error"><Icono nombre="alerta" />{error}</span>
      )}
      {ayuda && <span id={idAyuda} className="campo-ayuda">{ayuda}</span>}
    </div>
  );
}
