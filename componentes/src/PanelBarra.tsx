/**
 * PANEL DE LA BARRA — mensajes, notificaciones y lo que venga
 *
 * El botón con su contador en la barra superior, y la ventana que se abre al
 * pulsarlo. **Igual que el menú de usuario**: misma superficie, mismo anclaje,
 * mismo comportamiento de cierre.
 *
 * UN SOLO COMPONENTE PARA LOS DOS, y es una decisión, no pereza. Mensajes y
 * notificaciones tienen exactamente la misma forma: un botón con contador y una
 * lista de cosas con su momento. Hacer `PanelMensajes` y `PanelNotificaciones`
 * por separado sería tener dos y verlos divergir —el sistema ya tuvo dos
 * paginaciones y pasó—. Lo que cambia es el icono, el título y los datos, que
 * es justo lo que se pasa por propiedades.
 *
 * NO DECIDE NADA DEL DOMINIO. Qué es un mensaje, cuándo está leído y qué pasa
 * al pulsarlo es del proyecto. El sistema pone la ventana, el contador
 * anunciado, el teclado y el estado vacío.
 */

import { Icono, type NombreIcono } from './Icono';
import { usarDesplegable } from './interno/desplegable';

export type ItemPanel = {
  /** Identificador estable. Nunca el índice. */
  id: string;
  /** Una línea. Quién escribe, o qué pasó. */
  titulo: string;
  /** El detalle, si cabe. Se recorta a dos líneas. */
  texto?: string;
  /** «hace 5 min», «ayer». Lo formatea el proyecto: el sistema no sabe de husos
   *  horarios ni de qué idioma habla esta pantalla. */
  cuando?: string;
  /** Sin leer. Marca el punto y cuenta para el contador. */
  sinLeer?: boolean;
  onClick?: () => void;
};

export type PanelBarraProps = {
  /** Icono del botón. `sobre` para mensajes, `campana` para notificaciones. */
  icono: NombreIcono;
  /** Nombre accesible del botón y título de la ventana. */
  titulo: string;
  items: ItemPanel[];
  /** Qué decir cuando no hay nada. Un «Sin elementos» seco no dice si es que no
   *  hay o que algo falló. */
  vacio?: string;
  /** Enlace del pie. Sin él, no se pinta el pie. */
  onVerTodos?: () => void;
  textoVerTodos?: string;
};

export function PanelBarra({
  icono,
  titulo,
  items,
  vacio = 'No hay nada nuevo',
  onVerTodos,
  textoVerTodos = 'Ver todos',
}: PanelBarraProps) {
  const { abierto, setAbierto, alternar, caja, disparador, cerrarYDevolverFoco } = usarDesplegable();
  const sinLeer = items.filter((i) => i.sinLeer).length;
  const idPanel = `panel-${icono}`;

  return (
    <div className="us" ref={caja}>
      <button
        ref={disparador}
        className="top-btn"
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-haspopup="dialog"
        // El contador va EN EL NOMBRE, no solo en el punto rojo: quien usa
        // lector de pantalla no ve la burbuja, y saber que hay tres sin leer es
        // justo lo que hace que merezca la pena abrir.
        aria-label={sinLeer > 0 ? `${titulo}, ${sinLeer} sin leer` : titulo}
        onClick={alternar}
      >
        <Icono nombre={icono} />
        {/* La burbuja va oculta al lector: lo que dice ya está en el nombre del
            botón, y leerlo dos veces es ruido. */}
        {sinLeer > 0 && <span className="badge" aria-hidden="true">{sinLeer}</span>}
      </button>

      {/* `role="dialog"` y no `menu`: dentro hay texto que se lee, no opciones
          entre las que se elige. Con `menu`, el lector entra en modo de
          navegación por opciones y el texto de cada aviso deja de leerse. */}
      <div className="us-menu pb-panel" id={idPanel} role="dialog" aria-label={titulo} hidden={!abierto}>
        <div className="us-sec">
          <span className="us-et">{titulo}</span>
        </div>

        {items.length === 0 ? (
          <p className="pb-vacio">{vacio}</p>
        ) : (
          <ul className="pb-lista">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  className={['pb-item', it.sinLeer ? 'pb-nuevo' : ''].filter(Boolean).join(' ')}
                  onClick={() => { it.onClick?.(); cerrarYDevolverFoco(); }}
                >
                  <span className="pb-txt">
                    <span className="pb-tit">{it.titulo}</span>
                    {it.texto && <span className="pb-det">{it.texto}</span>}
                  </span>
                  {/* El momento y el punto van al final y ocultos al lector: el
                      «sin leer» ya lo dice el nombre del botón de arriba. */}
                  {it.cuando && <span className="pb-cuando">{it.cuando}</span>}
                  {it.sinLeer && <span className="pb-punto" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        )}

        {onVerTodos && (
          <button
            className="us-op pb-todos"
            onClick={() => { onVerTodos(); cerrarYDevolverFoco(); }}
          >
            {textoVerTodos}
          </button>
        )}
      </div>
    </div>
  );
}
