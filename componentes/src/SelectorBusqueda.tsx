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
  /** Qué decir cuando no hay coincidencias. Un «Sin resultados» seco no dice
   *  si el problema es lo escrito o que no existe. */
  textoVacio?: string;
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
  textoVacio = 'No hay coincidencias',
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

  /** Cerrar dejando el foco donde estaba. Lo comparten elegir y vaciar. */
  function cerrarTras(nuevo: string | null) {
    onCambio(nuevo);
    setAbierto(false);
    setTexto('');
    campo.current?.focus();
  }

  function elegir(o: OpcionBusqueda) {
    cerrarTras(o.valor);
  }

  /** R103 · el camino que la firma prometía y no existía. */
  function vaciarEleccion() {
    cerrarTras(null);
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
    // Abajo abre la lista además de moverse: si solo moviera, con la lista
    // cerrada la tecla no haría nada y parecería que el control está muerto.
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierto) { setAbierto(true); return; }
      setActivo((i) => Math.min(i + 1, filas.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && abierto) {
      e.preventDefault();
      // R103 · sin lista no hay opción activa que Enter pudiera elegir, así que
      // ahí la tecla está libre y es donde cae «Crear».
      if (puedeCrear) { crear(); return; }
      const f = filas[activo];
      if (!f) return;
      if (f.tipo === 'vaciar') vaciarEleccion();
      else elegir(f.o);
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
    if (e.key === 'Tab' && abierto) setAbierto(false);
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
        <div className={['sel-caja', conLupa ? 'sel-con-lupa' : ''].filter(Boolean).join(' ')}>
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
              {textoCrear(texto.trim())}
            </li>
          ) : (
            <li className="sel-vacio">{textoVacio}</li>
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
              {vacio}
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
              {/* El visto en la elegida: aria-selected ya lo dice al lector;
                  esto se lo dice a la vista, que no lee atributos. */}
              {f.o.valor === valor && (
                <span className="sel-check"><Icono nombre="visto" /></span>
              )}
              {f.o.texto}
              {f.o.ayuda && <span className="sel-notas">{f.o.ayuda}</span>}
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
