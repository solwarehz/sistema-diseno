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
  ayuda?: string;
  error?: string;
  /** Qué decir cuando no hay coincidencias. Un «Sin resultados» seco no dice
   *  si el problema es lo escrito o que no existe. */
  textoVacio?: string;
  deshabilitado?: boolean;
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

  function elegir(o: OpcionBusqueda) {
    onCambio(o.valor);
    setAbierto(false);
    setTexto('');
    campo.current?.focus();
  }

  function alTeclado(e: React.KeyboardEvent<HTMLInputElement>) {
    // Abajo abre la lista además de moverse: si solo moviera, con la lista
    // cerrada la tecla no haría nada y parecería que el control está muerto.
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierto) { setAbierto(true); return; }
      setActivo((i) => Math.min(i + 1, filtradas.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && abierto) {
      e.preventDefault();
      const o = filtradas[activo];
      if (o) elegir(o);
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
      <label className="campo-etiqueta" htmlFor={id} id={`${id}-et`}>{etiqueta}</label>

      {/* `.sel` es el ancla. Faltaba, y sin ella la lista —que es
          `position: absolute`— no encontraba antepasado posicionado y se
          colocaba contra el viewport: se desplegaba fuera de la pantalla.
          El catálogo sí la emite; al portar el componente se perdió.
          Lo encontró Control Administrativos V2.0, con las coordenadas medidas. */}
      <div className="sel">
        <div className="sel-caja">
        {/* La lupa y el chevron son la promesa del catálogo: la lupa dice
            «escribe para buscar» y el chevron dice «esto se despliega». El
            React los perdía y el combobox parecía un campo de texto más. */}
        <span className="sel-lupa" aria-hidden="true"><Icono nombre="lupa" tam="control" /></span>
        <input
          id={id}
          ref={campo}
          className={['campo', 'sel-in', error ? 'campo-mal' : ''].filter(Boolean).join(' ')}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={abierto && filtradas[activo] ? `${id}-op-${activo}` : undefined}
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
        <span className="sel-chev" aria-hidden="true"><Icono nombre="chevron" tam="control" /></span>
        </div>

        <ul className="sel-lista" id={idLista} role="listbox" aria-labelledby={`${id}-et`} hidden={!abierto}>
        {filtradas.length === 0 ? (
          <li className="sel-vacio">{textoVacio}</li>
        ) : (
          filtradas.map((o, i) => (
            <li
              key={o.valor}
              id={`${id}-op-${i}`}
              // `marcado` y no `activa`: es LA clase que la hoja estiliza
              // (.sel-op.marcado). Con `activa` la opción resaltada por
              // teclado no se pintaba en ningún producto — y el candado no lo
              // vio porque .pgn-btn.activa declara «activa» en otra familia.
              className={['sel-op', i === activo ? 'marcado' : ''].filter(Boolean).join(' ')}
              role="option"
              aria-selected={o.valor === valor}
              // `mousedown` y no `click`: el clic llega después del blur, y para
              // entonces la lista ya se cerró y la opción no existe.
              onMouseDown={(e) => { e.preventDefault(); elegir(o); }}
              onMouseEnter={() => setActivo(i)}
            >
              {/* El visto en la elegida: aria-selected ya lo dice al lector;
                  esto se lo dice a la vista, que no lee atributos. */}
              {o.valor === valor && (
                <span className="sel-check"><Icono nombre="visto" tam="control" /></span>
              )}
              {o.texto}
              {o.ayuda && <span className="sel-notas">{o.ayuda}</span>}
            </li>
          ))
          )}
        </ul>
      </div>

      {error && <span id={idError} className="campo-error">{error}</span>}
      {ayuda && <span id={idAyuda} className="campo-ayuda">{ayuda}</span>}
    </div>
  );
}
