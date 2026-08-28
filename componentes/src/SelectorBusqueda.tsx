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
 * Los estilos vienen de `componentes.css` con las clases del catálogo
 * —`sel-caja`, `sel-in`, `sel-lista`, `sel-op`—, que es el mismo control que se
 * ve ahí. No se inventa ninguna.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icono } from './Icono';

export type OpcionBusqueda = { valor: string; texto: string; ayuda?: string };

export type SelectorBusquedaProps = {
  /** Obligatoria y visible. Igual que en `Campo`: el placeholder es ejemplo de
   *  formato, nunca etiqueta —desaparece al escribir y con él la pregunta—. */
  etiqueta: string;
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
}: SelectorBusquedaProps) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  const elegida = opciones.find((o) => o.valor === valor) ?? null;

  // Con la lista cerrada se muestra lo ELEGIDO, no lo que se tecleó. Dejar el
  // texto a medias hace creer que hay un filtro puesto que no existe.
  const mostrado = abierto ? texto : elegida?.texto ?? '';

  const filtradas = useMemo(() => {
    if (!abierto || !texto.trim()) return opciones;
    const q = normalizar(texto);
    return opciones.filter((o) => normalizar(o.texto).includes(q));
  }, [opciones, texto, abierto]);

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
  const puedeCrear = !!onCrear && filas.length === 0 && !!texto.trim();

  /** R115 · el texto del vacío admite cadena o función de lo tecleado. Se
   *  resuelve aquí para que el marcado no tenga que saber cuál de las dos es. */
  const vacioMostrado =
    typeof textoVacio === 'function' ? textoVacio(texto.trim()) : textoVacio;

  // El índice activo no puede quedarse fuera de una lista que encogió.
  useEffect(() => { setActivo(0); }, [texto, abierto]);

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
    // NO se cierra ni se limpia: crear es del producto y puede tardar o
    // cancelarse. Cerrar aquí daría por hecho un alta que quizá no ocurre, y
    // quien vuelva de cancelar se encontraría el campo en blanco.
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
          aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
          autoComplete="off"
          placeholder={placeholder}
          disabled={deshabilitado}
          value={mostrado}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTeclado}
        />
        <span className="sel-chev" aria-hidden="true"><Icono nombre="chevron" /></span>
        </div>

        <ul className="sel-lista" id={idLista} role="listbox" aria-labelledby={`${id}-et`} hidden={!abierto}>
        {filas.length === 0 ? (
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
